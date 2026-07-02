import { prisma } from "@/lib/prisma";
import { assembleContext } from "./context-assembler";
import { postProcessRun } from "./post-processor";
import { classifyQuery } from "./query-classifier";
import { wantsImageGeneration, cleanImageUserMessage } from "@/lib/image-intent";
import { formatImageError } from "@/lib/ai-errors";
import { generateImageFromRequest } from "@/server/ai/image-service";
import type {
  AgentEventEmitter,
  AgentRunInput,
  AgentMessage,
  CompletedRun,
} from "./types";
import { buildZyronSystemPrompt } from "@/lib/zyron-prompt";
import { modelRouter } from "@/server/ai/router";
import { toolRegistry } from "@/server/tools/registry";
import type { ToolCall } from "@/server/ai/types";

const MAX_TOOL_ITERATIONS = 6;

export async function runAgent(
  input: AgentRunInput,
  emit: AgentEventEmitter
): Promise<void> {
  emit({ type: "run_id", runId: input.runId });
  emit({ type: "phase", phase: "assembling_context" });

  const ctx = await assembleContext(input);
  const classification = classifyQuery(input.message);

  const systemPrompt = buildZyronSystemPrompt({
    projectInstructions: ctx.projectInstructions,
    queryHint: classification.needsWebSearch
      ? `${classification.hint} Answer from model knowledge; note uncertainty for live data (weather, time, news).`
      : classification.hint,
  });

  if (ctx.vectorMemoriesRaw.length > 0) {
    emit({
      type: "memory_used",
      count: ctx.vectorMemoriesRaw.length,
      previews: ctx.vectorMemoriesRaw.map((m) => m.content.slice(0, 120)),
    });
  }

  const { provider, config } = modelRouter.forZyron();
  const tools =
    input.mode === "chat" ? [] : toolRegistry.getSchemas(input.mode);

  let messages: AgentMessage[] = [...ctx.recentMessages];
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || last.content !== input.message) {
    messages.push({ role: "user", content: input.message });
  }

  let toolCallsCount = 0;
  let iterations = 0;

  await prisma.agentRun
    .create({
      data: {
        id: input.runId,
        userId: input.userId ?? null,
        chatId: input.chatId,
        projectId: input.projectId ?? null,
        phase: "reasoning",
        model: config.model,
      },
    })
    .catch(() => undefined);

  const toolCtx = {
    userId: input.userId,
    projectId: input.projectId,
    chatId: input.chatId,
    runId: input.runId,
    onArtifact: (data: {
      title: string;
      content: string;
      artifactType: string;
    }) => {
      emit({
        type: "artifact_created",
        title: data.title,
        content: data.content,
        artifactType: data.artifactType,
      });
    },
  };

  const imageAttachments = input.imageAttachments?.map((img) => ({
    dataUrl: img.dataUrl,
    name: img.name,
  }));

  if (wantsImageGeneration(input.message, !!imageAttachments?.length)) {
    emit({ type: "phase", phase: "tool_calling" });
    emit({
      type: "tool_start",
      tool: "image_generation",
      args: { prompt: input.message.slice(0, 200) },
    });

    try {
      const { b64, model: imageModel } = await generateImageFromRequest(
        input.message,
        imageAttachments
      );
      const alt =
        cleanImageUserMessage(input.message).slice(0, 120) || "Изображение";
      const intro =
        imageAttachments?.length
          ? "Готово — создал изображение по вашему запросу и фото:"
          : "Готово — вот сгенерированное изображение:";

      emit({ type: "phase", phase: "streaming" });
      emit({ type: "text_delta", text: intro });
      emit({
        type: "image_generated",
        dataUrl: `data:image/png;base64,${b64}`,
        alt,
      });
      emit({
        type: "tool_result",
        tool: "image_generation",
        summary: "Изображение создано",
      });

      const completed: CompletedRun = {
        runId: input.runId,
        userId: input.userId,
        chatId: input.chatId,
        projectId: input.projectId,
        userMessage: input.message,
        assistantMessage: intro,
        projectName: ctx.projectName,
        toolCallsCount: 1,
        model: imageModel,
      };

      await postProcessRun(completed, emit);

      await prisma.agentRun
        .update({
          where: { id: input.runId },
          data: {
            phase: "completed",
            toolCallsCount: 1,
            completedAt: new Date(),
          },
        })
        .catch(() => undefined);

      emit({ type: "done", model: imageModel, toolCallsCount: 1 });
      return;
    } catch (error) {
      const msg = formatImageError(error);
      emit({
        type: "tool_result",
        tool: "image_generation",
        summary: `Ошибка: ${msg}`,
      });
      emit({
        type: "error",
        message: msg,
      });
      return;
    }
  }

  while (iterations < MAX_TOOL_ITERATIONS) {
    emit({
      type: "phase",
      phase: iterations === 0 ? "reasoning" : "tool_calling",
    });

    const result = await provider.complete({
      system: systemPrompt,
      messages,
      tools,
      model: config.model,
      temperature: config.temperature ?? 0.35,
      maxTokens: config.maxTokens ?? 8192,
      imageAttachments: iterations === 0 ? imageAttachments : undefined,
    });

    if (result.toolCalls.length === 0) {
      emit({ type: "phase", phase: "streaming" });

      let fullText = result.text;

      if (!fullText.trim()) {
        for await (const chunk of provider.stream({
          system: systemPrompt,
          messages,
          model: config.model,
          temperature: config.temperature ?? 0.35,
          maxTokens: config.maxTokens ?? 8192,
          imageAttachments,
        })) {
          if (chunk.type === "text") {
            fullText += chunk.text;
            emit({ type: "text_delta", text: chunk.text });
          }
        }
      } else {
        emit({ type: "text_delta", text: fullText });
      }

      const completed: CompletedRun = {
        runId: input.runId,
        userId: input.userId,
        chatId: input.chatId,
        projectId: input.projectId,
        userMessage: input.message,
        assistantMessage: fullText,
        projectName: ctx.projectName,
        toolCallsCount,
        model: config.model,
      };

      await postProcessRun(completed, emit);

      await prisma.agentRun
        .update({
          where: { id: input.runId },
          data: {
            phase: "completed",
            toolCallsCount,
            completedAt: new Date(),
          },
        })
        .catch(() => undefined);

      emit({ type: "done", model: config.model, toolCallsCount });
      return;
    }

    for (const call of result.toolCalls) {
      emit({ type: "tool_start", tool: call.name, args: call.arguments });
    }

    const observations = await toolRegistry.executeAll(result.toolCalls, toolCtx);
    toolCallsCount += result.toolCalls.length;

    for (const obs of observations) {
      emit({ type: "tool_result", tool: obs.name, summary: obs.summary });
    }

    messages = appendToolTurn(messages, result.toolCalls, observations);
    iterations++;
  }

  await prisma.agentRun
    .update({
      where: { id: input.runId },
      data: {
        phase: "failed",
        error: "Max tool iterations exceeded",
        toolCallsCount,
        completedAt: new Date(),
      },
    })
    .catch(() => undefined);

  emit({ type: "error", message: "Превышен лимит вызовов инструментов" });
}

function appendToolTurn(
  messages: AgentMessage[],
  toolCalls: ToolCall[],
  observations: { id: string; name: string; result: string }[]
): AgentMessage[] {
  return [
    ...messages,
    { role: "assistant", content: "", toolCalls },
    {
      role: "user",
      content: "",
      toolResults: observations.map((o) => ({
        id: o.id,
        name: o.name,
        result: o.result,
        summary: "",
      })),
    },
  ];
}
