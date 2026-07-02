import { auth } from "@/auth";
import { formatGeminiUserError } from "@/lib/ai-errors";
import { prisma } from "@/lib/prisma";
import { applyHandlerRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { sanitizeAiPrompt } from "@/lib/sanitize-ai-prompt";
import { logSecurityEvent } from "@/lib/security-logger";
import {
  buildMultifloraSystemPrompt,
  type AiWorkspaceContext,
} from "@/lib/zyron-prompt";
import { classifyQuery, buildSearchQuery } from "@/server/agent/query-classifier";
import { getTermKnowledgeHint } from "@/server/agent/term-knowledge";
import { formatWebHits, searchWeb } from "@/server/tools/web-search";
import { modelRouter } from "@/server/ai/router";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse";

function buildGeminiBody(
  messages: ChatMessage[],
  systemPrompt: string,
  temperature: number
) {
  return {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      maxOutputTokens: 4096,
      temperature,
    },
  };
}

function extractTextFromChunk(line: string): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return "";
  const jsonStr = trimmed.slice(5).trim();
  if (!jsonStr || jsonStr === "[DONE]") return "";

  try {
    const data = JSON.parse(jsonStr) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    return (
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("") ?? ""
    );
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const ip = getClientIpFromRequest(request);

  if (!session?.user?.id) {
    logSecurityEvent("unauthorized_api_access", {
      ip,
      endpoint: "/api/chat",
      method: "POST",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await applyHandlerRateLimit(session.user.id, "AI_USER");
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "AI не настроен. Добавьте GEMINI_API_KEY в файл .env и перезапустите сервер.",
      },
      { status: 503 }
    );
  }

  let body: {
    messages?: ChatMessage[];
    stream?: boolean;
    mode?: string;
    chatModel?: string;
    aiPreferences?: { tone: string; proactivity: string };
    projectName?: string;
    projectDescription?: string;
    projectInstructions?: string;
    memories?: string[];
    relatedChats?: { title: string; summary: string }[];
    artifacts?: { title: string; excerpt: string; type: string }[];
    otherProjects?: { name: string; instructions?: string }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { userRole: true },
  });

  const messages =
    body.messages
      ?.filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role,
        content: sanitizeAiPrompt(m.content),
      })) ?? [];

  if (messages.length === 0) {
    return NextResponse.json({ error: "Сообщение пустое" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const classification = classifyQuery(lastUser?.content ?? "");
  const termKnowledge = getTermKnowledgeHint(lastUser?.content ?? "");

  let webSearchResults = "";
  if (classification.needsWebSearch && process.env.TAVILY_API_KEY?.trim()) {
    try {
      const hits = await searchWeb(buildSearchQuery(lastUser?.content ?? "", classification));
      webSearchResults = formatWebHits(hits);
    } catch {
      // continue without search
    }
  }

  const context: AiWorkspaceContext = {
    mode: body.mode,
    userRole: user?.userRole ?? null,
    aiPreferences: body.aiPreferences as AiWorkspaceContext["aiPreferences"],
    projectName: body.projectName
      ? sanitizeAiPrompt(body.projectName)
      : undefined,
    projectDescription: body.projectDescription
      ? sanitizeAiPrompt(body.projectDescription)
      : undefined,
    projectInstructions: body.projectInstructions
      ? sanitizeAiPrompt(body.projectInstructions)
      : undefined,
    memories: body.memories?.map((m) => sanitizeAiPrompt(m)),
    relatedChats: body.relatedChats?.map((c) => ({
      title: sanitizeAiPrompt(c.title),
      summary: sanitizeAiPrompt(c.summary),
    })),
    artifacts: body.artifacts?.map((a) => ({
      title: sanitizeAiPrompt(a.title),
      excerpt: sanitizeAiPrompt(a.excerpt),
      type: a.type,
    })),
    otherProjects: body.otherProjects?.map((p) => ({
      name: sanitizeAiPrompt(p.name),
      instructions: p.instructions
        ? sanitizeAiPrompt(p.instructions)
        : undefined,
    })),
    webSearchResults: webSearchResults || undefined,
    queryHint: classification.hint,
    responseFormat: classification.responseFormat,
    termKnowledge,
  };

  const { config } = modelRouter.forChat();
  const useStream = body.stream !== false;
  const systemPrompt = buildMultifloraSystemPrompt(context);
  const temperature = config.temperature ?? 0.4;

  try {
    const response = await fetch(`${GEMINI_URL}&key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildGeminiBody(messages, systemPrompt, temperature)),
    });

    if (!response.ok) {
      const data = (await response.json()) as { error?: { message?: string } };
      const raw = data.error?.message ?? "Ошибка Gemini API";
      return NextResponse.json(
        { error: formatGeminiUserError(raw, response.status) },
        { status: response.status }
      );
    }

    if (!useStream || !response.body) {
      const text = await response.text();
      let full = "";
      for (const line of text.split("\n")) {
        full += extractTextFromChunk(line);
      }
      return NextResponse.json({ content: full || "Пустой ответ от AI." });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const chunk = extractTextFromChunk(line);
              if (chunk) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`)
                );
              }
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch {
          controller.error(new Error("Stream interrupted"));
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось связаться с AI. Проверьте интернет и API-ключ." },
      { status: 502 }
    );
  }
}
