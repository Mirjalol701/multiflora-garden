import type { AiWorkspaceContext } from "@/lib/ai-os-prompt";

type StreamMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StreamContext = AiWorkspaceContext;

export async function streamAiReply(
  messages: StreamMessage[],
  onChunk: (text: string) => void,
  context?: StreamContext,
  chatModel?: string
): Promise<string> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      stream: true,
      chatModel,
      ...context,
    }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { error?: string };
    throw new Error(data.error ?? "Не удалось получить ответ");
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
        const { text } = JSON.parse(payload) as { text?: string };
        if (text) {
          full += text;
          onChunk(full);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return full || "Пустой ответ от AI.";
}
