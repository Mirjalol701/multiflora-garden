/**
 * Shared SSE event contract between /api/agent/run and the client.
 * Single source of truth — avoids client/server type drift.
 */

export type AgentRunPhase =
  | "assembling_context"
  | "reasoning"
  | "tool_calling"
  | "streaming"
  | "post_processing"
  | "completed"
  | "failed";

export type AgentSSEEvent =
  | { type: "run_id"; runId: string }
  | { type: "phase"; phase: AgentRunPhase }
  | { type: "text_delta"; text: string }
  | { type: "tool_start"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; summary: string }
  | { type: "memory_used"; count: number; previews: string[] }
  | { type: "artifact_created"; title: string; content: string; artifactType: string }
  | { type: "memory_candidate"; content: string }
  | { type: "image_generated"; dataUrl: string; alt: string }
  | { type: "done"; model: string; toolCallsCount: number }
  | { type: "error"; message: string };

export const PHASE_LABELS: Record<AgentRunPhase, string> = {
  assembling_context: "Собираю контекст проекта…",
  reasoning: "Думаю…",
  tool_calling: "Использую инструменты…",
  streaming: "Формирую ответ…",
  post_processing: "Сохраняю insights…",
  completed: "Готово",
  failed: "Ошибка",
};
