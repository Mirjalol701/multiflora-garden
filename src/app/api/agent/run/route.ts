import { auth } from "@/auth";
import { agentRunBodySchema, type AgentRunBody } from "@/lib/validations";
import { applyHandlerRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { sanitizeAiPrompt } from "@/lib/sanitize-ai-prompt";
import { logSecurityEvent } from "@/lib/security-logger";
import { runAgent } from "@/server/agent/orchestrator";
import type { AgentRunInput, WorkspaceSnapshot } from "@/server/agent/types";
import { getServerEnv } from "@/server/env";
import {
  agentStreamResponse,
  createAgentSSEStream,
} from "@/server/streaming/sse";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  try {
    return await handleAgentRun(request);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Внутренняя ошибка сервера";
    return Response.json({ error: message }, { status: 500 });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

function toWorkspaceSnapshot(workspace: AgentRunBody["workspace"]): WorkspaceSnapshot {
  return {
    projects: workspace.projects,
    chats: workspace.chats,
    artifacts: workspace.artifacts,
    memories: workspace.memories,
    aiPreferences: workspace.aiPreferences,
  };
}

async function handleAgentRun(request: Request) {
  let session;
  try {
    session = await auth();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ошибка авторизации";
    console.error("[agent/run] auth failed:", message);
    return Response.json(
      { error: "Ошибка сессии. Выйдите и войдите снова." },
      { status: 401 }
    );
  }

  const ip = getClientIpFromRequest(request);

  if (!session?.user?.id) {
    logSecurityEvent("unauthorized_api_access", {
      ip,
      endpoint: "/api/agent/run",
      method: "POST",
    });
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await applyHandlerRateLimit(session.user.id, "AI_USER");
  if (!rate.success) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  const openaiKey = getServerEnv("OPENAI_API_KEY");
  if (!openaiKey) {
    return Response.json(
      {
        error:
          "Zyron (GPT) не настроен. Добавьте OPENAI_API_KEY в .env и перезапустите сервер.",
      },
      { status: 503 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const parsed = agentRunBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    logSecurityEvent("suspicious_input", {
      ip,
      userId: session.user.id,
      endpoint: "/api/agent/run",
      issues: parsed.error.flatten(),
    });
    return Response.json({ error: "Неверные данные запроса" }, { status: 400 });
  }

  const body = parsed.data;
  const message = sanitizeAiPrompt(body.message);
  const runId = randomUUID();

  const input: AgentRunInput = {
    runId,
    userId: session.user.id,
    chatId: body.chatId ?? randomUUID(),
    projectId: body.projectId ?? null,
    message,
    mode: body.mode ?? "chat",
    history: (body.history ?? []).map((m) => ({
      role: m.role,
      content: sanitizeAiPrompt(m.content),
    })),
    workspace: toWorkspaceSnapshot(body.workspace),
    imageAttachments: body.imageAttachments,
  };

  const stream = createAgentSSEStream((emit) => runAgent(input, emit));
  return agentStreamResponse(stream);
}
