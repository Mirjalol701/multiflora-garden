import type { AgentSSEEvent } from "@/lib/agent-events";
import { formatGeminiUserError } from "@/lib/ai-errors";
import type { AiWorkspaceContext } from "@/lib/zyron-prompt";
import type { WorkspaceSnapshot } from "@/server/agent/types";

export type AgentStreamCallbacks = {
  onText: (fullText: string) => void;
  onEvent?: (event: AgentSSEEvent) => void;
};

export type ImageAttachmentPayload = {
  type: "image";
  dataUrl: string;
  name: string;
};

export type AgentStreamInput = {
  chatId: string;
  projectId?: string | null;
  message: string;
  mode: "chat" | "cowork" | "code";
  history: { role: "user" | "assistant"; content: string }[];
  imageAttachments?: ImageAttachmentPayload[];
  workspace: WorkspaceSnapshot;
  context?: AiWorkspaceContext;
};

export async function streamAgentReply(
  input: AgentStreamInput,
  callbacks: AgentStreamCallbacks
): Promise<string> {
  let response: Response;

  try {
    response = await fetch("/api/agent/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: input.chatId,
        projectId: input.projectId,
        message: input.message,
        mode: input.mode,
        history: input.history,
        imageAttachments: input.imageAttachments,
        workspace: input.workspace,
      }),
    });
  } catch (error) {
    const isNetwork =
      error instanceof TypeError ||
      (error instanceof Error && /failed to fetch|network/i.test(error.message));
    throw new Error(
      isNetwork
        ? "Нет связи с сервером. Проверьте, что `npm run dev` запущен, и обновите страницу."
        : error instanceof Error
          ? error.message
          : "Ошибка сети"
    );
  }

  if (!response.ok) {
    let message = "Не удалось получить ответ от Zyron";
    try {
      const raw = await response.text();
      try {
        const data = JSON.parse(raw) as { error?: string; message?: string };
        message = data.error ?? data.message ?? message;
      } catch {
        const snippet = raw.replace(/\s+/g, " ").trim().slice(0, 200);
        message = snippet
          ? `Ошибка сервера (${response.status}): ${snippet}`
          : `Ошибка сервера (${response.status})`;
      }
    } catch {
      message = `Ошибка сервера (${response.status})`;
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Пустой ответ от сервера");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;

      try {
        const event = JSON.parse(payload) as AgentSSEEvent;

        if (event.type === "error") {
          throw new Error(formatGeminiUserError(event.message));
        }

        if (event.type === "text_delta") {
          full += event.text;
          callbacks.onText(full);
        }

        callbacks.onEvent?.(event);
      } catch (e) {
        if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
          if (payload.startsWith("{")) throw e;
        }
      }
    }
  }

  return full || "Пустой ответ от Zyron.";
}
