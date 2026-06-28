import { GeminiApiError, parseRetrySeconds } from "../gemini-errors";
import { getServerEnv } from "@/server/env";
import type { AIProvider, StreamChunk, ToolSchema } from "../types";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";
const EMBED_MODEL = "text-embedding-004";
const EMBED_DIM = 768;

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: { result: unknown } } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

function getApiKey(): string {
  const key = getServerEnv("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured");
  return key;
}

function toGeminiRole(role: string): "user" | "model" {
  return role === "assistant" || role === "model" ? "model" : "user";
}

function toGeminiContents(
  messages: {
    role: string;
    content: string;
    toolCalls?: import("../types").ToolCall[];
    toolResults?: import("../types").ToolObservation[];
  }[]
): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const m of messages) {
    if (m.toolResults?.length) {
      for (const tr of m.toolResults) {
        contents.push({
          role: "user",
          parts: [
            {
              functionResponse: {
                name: tr.name,
                response: { result: JSON.parse(tr.result) },
              },
            },
          ],
        });
      }
      continue;
    }

    if (m.toolCalls?.length) {
      contents.push({
        role: "model",
        parts: m.toolCalls.map((tc) => ({
          functionCall: { name: tc.name, args: tc.arguments },
        })),
      });
      continue;
    }

    if (m.content.trim()) {
      contents.push({
        role: toGeminiRole(m.role),
        parts: [{ text: m.content }],
      });
    }
  }

  return contents;
}

function toGeminiTools(tools: ToolSchema[]) {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      })),
    },
  ];
}

function parseGeminiResponse(data: {
  candidates?: {
    content?: { parts?: GeminiPart[] };
  }[];
}): { text: string; toolCalls: import("../types").ToolCall[] } {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  let text = "";
  const toolCalls: import("../types").ToolCall[] = [];

  for (const part of parts) {
    if ("text" in part && part.text) {
      text += part.text;
    }
    if ("functionCall" in part && part.functionCall) {
      toolCalls.push({
        id: `call_${toolCalls.length}_${Date.now()}`,
        name: part.functionCall.name,
        arguments: part.functionCall.args ?? {},
      });
    }
  }

  return { text, toolCalls };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geminiFetch(path: string, body: unknown, attempt = 0): Promise<Response> {
  const response = await fetch(`${GEMINI_BASE}${path}?key=${getApiKey()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    const raw = err.error?.message ?? `Gemini API error ${response.status}`;

    if (response.status === 429 && attempt < 1) {
      const waitSec = parseRetrySeconds(raw) ?? 30;
      await sleep(waitSec * 1000);
      return geminiFetch(path, body, attempt + 1);
    }

    throw new GeminiApiError(raw, response.status);
  }

  return response;
}

export const geminiProvider: AIProvider = {
  id: "gemini",

  async complete({ system, messages, tools, model, temperature = 0.7, maxTokens = 4096 }) {
    const resolvedModel = model ?? DEFAULT_MODEL;
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: system }] },
      contents: toGeminiContents(messages),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    };

    if (tools?.length) {
      body.tools = toGeminiTools(tools);
    }

    const response = await geminiFetch(
      `/models/${resolvedModel}:generateContent`,
      body
    );
    const data = await response.json();
    const parsed = parseGeminiResponse(data);
    return { ...parsed, model: resolvedModel };
  },

  async *stream({ system, messages, model, temperature = 0.7, maxTokens = 4096 }) {
    const resolvedModel = model ?? DEFAULT_MODEL;
    const response = await geminiFetch(
      `/models/${resolvedModel}:streamGenerateContent?alt=sse`,
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: toGeminiContents(messages),
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }
    );

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;

        try {
          const data = JSON.parse(jsonStr) as Parameters<typeof parseGeminiResponse>[0];
          const parsed = parseGeminiResponse(data);
          if (parsed.text) {
            yield { type: "text", text: parsed.text } satisfies StreamChunk;
          }
        } catch {
          // skip malformed SSE chunk
        }
      }
    }
  },

  async embed(text: string): Promise<number[]> {
    const response = await geminiFetch(`/models/${EMBED_MODEL}:embedContent`, {
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text: text.slice(0, 8000) }] },
    });

    const data = (await response.json()) as {
      embedding?: { values?: number[] };
    };

    const values = data.embedding?.values;
    if (!values?.length) {
      throw new Error("Empty embedding from Gemini");
    }

    if (values.length !== EMBED_DIM) {
      // Normalize dimension mismatch — pad or truncate
      const normalized = new Array(EMBED_DIM).fill(0);
      for (let i = 0; i < Math.min(values.length, EMBED_DIM); i++) {
        normalized[i] = values[i];
      }
      return normalized;
    }

    return values;
  },
};

export const GEMINI_EMBED_DIM = EMBED_DIM;
