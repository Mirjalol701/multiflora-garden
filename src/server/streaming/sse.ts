import { formatGeminiUserError } from "@/lib/ai-errors";
import type { AgentSSEEvent } from "@/lib/agent-events";
import { GeminiApiError } from "@/server/ai/gemini-errors";

/**
 * Creates a ReadableStream that emits Server-Sent Events.
 * Each event is JSON-encoded in a `data:` frame — standard for browser EventSource/fetch readers.
 */
export function createAgentSSEStream(
  producer: (emit: (event: AgentSSEEvent) => void) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const emit = (event: AgentSSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        await producer(emit);
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        const message =
          error instanceof GeminiApiError
            ? error.userMessage
            : error instanceof Error
              ? formatGeminiUserError(error.message)
              : "Внутренняя ошибка агента";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", message })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
}

export function agentStreamResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
