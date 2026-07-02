import { auth } from "@/auth";
import { formatAiUserError } from "@/lib/ai-errors";
import { prisma } from "@/lib/prisma";
import { applyHandlerRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { sanitizeAiPrompt } from "@/lib/sanitize-ai-prompt";
import { logSecurityEvent } from "@/lib/security-logger";
import {
  buildMultifloraSystemPrompt,
  type AiWorkspaceContext,
} from "@/lib/zyron-prompt";
import { classifyQuery } from "@/server/agent/query-classifier";
import { getTermKnowledgeHint } from "@/server/agent/term-knowledge";
import { modelRouter } from "@/server/ai/router";
import { getServerEnv } from "@/server/env";
import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

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

  if (!getServerEnv("OPENAI_API_KEY")) {
    return NextResponse.json(
      {
        error:
          "AI не настроен. Добавьте OPENAI_API_KEY в .env и перезапустите сервер.",
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
    queryHint: classification.needsWebSearch
      ? `${classification.hint} Answer from model knowledge; note uncertainty for live data.`
      : classification.hint,
    responseFormat: classification.responseFormat,
    termKnowledge,
  };

  const { provider, config } = modelRouter.forChat();
  const useStream = body.stream !== false;
  const systemPrompt = buildMultifloraSystemPrompt(context);
  const temperature = config.temperature ?? 0.4;

  const agentMessages = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  try {
    if (!useStream) {
      const result = await provider.complete({
        system: systemPrompt,
        messages: agentMessages,
        model: config.model,
        temperature,
        maxTokens: config.maxTokens ?? 4096,
      });
      return NextResponse.json({ content: result.text || "Пустой ответ от AI." });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of provider.stream({
            system: systemPrompt,
            messages: agentMessages,
            model: config.model,
            temperature,
            maxTokens: config.maxTokens ?? 4096,
          })) {
            if (chunk.type === "text" && chunk.text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error
              ? formatAiUserError(error.message)
              : "Stream interrupted";
          controller.error(new Error(message));
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
  } catch (error) {
    const message =
      error instanceof Error
        ? formatAiUserError(error.message)
        : "Не удалось связаться с AI.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
