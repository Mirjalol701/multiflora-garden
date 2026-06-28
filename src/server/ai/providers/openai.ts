import type { AgentMessage } from "@/server/agent/types";
import { getServerEnv } from "@/server/env";
import type { AIProvider, StreamChunk, ToolCall, ToolSchema } from "../types";

const OPENAI_BASE = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4.1-mini";

type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "auto" | "low" | "high" } };

type OpenAIMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string | OpenAIContentPart[] }
  | { role: "assistant"; content: string | null; tool_calls?: OpenAIToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type OpenAIToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

function getApiKey(): string {
  const key = getServerEnv("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

function resolveModel(model?: string): string {
  return model ?? getServerEnv("ZYRON_OPENAI_MODEL") ?? DEFAULT_MODEL;
}

function toOpenAIMessages(
  system: string,
  messages: AgentMessage[],
  imageAttachments?: { dataUrl: string; name: string }[]
): OpenAIMessage[] {
  const out: OpenAIMessage[] = [{ role: "system", content: system }];
  const lastUserIndex = [...messages].reverse().findIndex((m) => {
    if (m.toolResults?.length || m.toolCalls?.length) return false;
    return m.role === "user" || m.role !== "assistant" && m.role !== "model";
  });
  const lastUserAbs =
    lastUserIndex === -1 ? -1 : messages.length - 1 - lastUserIndex;

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.toolResults?.length) {
      for (const tr of m.toolResults) {
        out.push({
          role: "tool",
          tool_call_id: tr.id,
          content: tr.result,
        });
      }
      continue;
    }

    if (m.toolCalls?.length) {
      out.push({
        role: "assistant",
        content: m.content || null,
        tool_calls: m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        })),
      });
      continue;
    }

    if (!m.content.trim()) continue;

    const role = m.role === "assistant" || m.role === "model" ? "assistant" : "user";

    if (
      role === "user" &&
      i === lastUserAbs &&
      imageAttachments?.length
    ) {
      out.push({
        role: "user",
        content: [
          { type: "text", text: m.content },
          ...imageAttachments.map((img) => ({
            type: "image_url" as const,
            image_url: { url: img.dataUrl, detail: "auto" as const },
          })),
        ],
      });
      continue;
    }

    out.push({ role, content: m.content });
  }

  return out;
}

function toOpenAITools(tools: ToolSchema[]) {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

function parseToolCalls(raw: OpenAIToolCall[] | undefined): ToolCall[] {
  if (!raw?.length) return [];

  return raw.map((tc) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
    } catch {
      args = {};
    }
    return {
      id: tc.id,
      name: tc.function.name,
      arguments: args,
    };
  });
}

function parseCompletion(data: {
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: OpenAIToolCall[];
    };
  }[];
}): { text: string; toolCalls: ToolCall[] } {
  const message = data.choices?.[0]?.message;
  return {
    text: message?.content ?? "",
    toolCalls: parseToolCalls(message?.tool_calls),
  };
}

async function openaiFetch(path: string, body: unknown): Promise<Response> {
  const response = await fetch(`${OPENAI_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(err.error?.message ?? `OpenAI API error ${response.status}`);
  }

  return response;
}

export const openaiProvider: AIProvider = {
  id: "openai",

  async complete({ system, messages, tools, model, temperature = 0.7, maxTokens = 4096, imageAttachments }) {
    const resolvedModel = resolveModel(model);
    const body: Record<string, unknown> = {
      model: resolvedModel,
      messages: toOpenAIMessages(system, messages, imageAttachments),
      temperature,
      max_tokens: maxTokens,
    };

    if (tools?.length) {
      body.tools = toOpenAITools(tools);
    }

    const response = await openaiFetch("/chat/completions", body);
    const data = await response.json();
    const parsed = parseCompletion(data);
    return { ...parsed, model: resolvedModel };
  },

  async *stream({ system, messages, model, temperature = 0.7, maxTokens = 4096, imageAttachments }) {
    const resolvedModel = resolveModel(model);
    const response = await openaiFetch("/chat/completions", {
      model: resolvedModel,
      messages: toOpenAIMessages(system, messages, imageAttachments),
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

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
          const data = JSON.parse(jsonStr) as {
            choices?: { delta?: { content?: string } }[];
          };
          const text = data.choices?.[0]?.delta?.content;
          if (text) {
            yield { type: "text", text } satisfies StreamChunk;
          }
        } catch {
          // skip malformed SSE chunk
        }
      }
    }
  },

  async embed(text: string): Promise<number[]> {
    const response = await openaiFetch("/embeddings", {
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });

    const data = (await response.json()) as {
      data?: { embedding?: number[] }[];
    };

    const values = data.data?.[0]?.embedding;
    if (!values?.length) {
      throw new Error("Empty embedding from OpenAI");
    }

    return values;
  },
};
