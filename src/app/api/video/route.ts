import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyHandlerRateLimit, getClientIpFromRequest } from "@/lib/rate-limit";
import { sanitizeAiPrompt } from "@/lib/sanitize-ai-prompt";
import { logSecurityEvent } from "@/lib/security-logger";
import { getServerEnv } from "@/server/env";
import {
  submitVideoJob,
  uploadImageToBlob,
} from "@/server/ai/video-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(2500),
  aspectRatio: z.enum(["16:9", "9:16", "1:1"]).default("16:9"),
  duration: z.enum(["5", "10"]).default("5"),
  image: z
    .string()
    .regex(/^data:image\/(png|jpeg|jpg|webp);base64,/)
    .max(12_000_000)
    .optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const ip = getClientIpFromRequest(request);

  if (!session?.user?.id) {
    logSecurityEvent("unauthorized_api_access", {
      ip,
      endpoint: "/api/video",
      method: "POST",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rate = await applyHandlerRateLimit(session.user.id, "AI_USER");
  if (!rate.success) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } }
    );
  }

  if (!getServerEnv("FAL_KEY")) {
    return NextResponse.json(
      {
        error:
          "Генерация видео не настроена. Добавьте FAL_KEY в .env и перезапустите сервер.",
      },
      { status: 503 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте промпт и параметры видео." },
      { status: 400 }
    );
  }

  const { prompt, aspectRatio, duration, image } = parsed.data;
  const cleanPrompt = sanitizeAiPrompt(prompt);

  const record = await prisma.videoGeneration.create({
    data: {
      userId: session.user.id,
      prompt: cleanPrompt,
      aspectRatio,
      duration,
      status: "IN_QUEUE",
      model: "",
    },
  });

  try {
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await uploadImageToBlob(image, record.id);
    }

    const { requestId, model } = await submitVideoJob({
      prompt: cleanPrompt,
      aspectRatio,
      duration,
      imageUrl,
    });

    const updated = await prisma.videoGeneration.update({
      where: { id: record.id },
      data: { falRequestId: requestId, model, sourceImageUrl: imageUrl },
    });

    return NextResponse.json(serialize(updated), { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось запустить генерацию.";
    await prisma.videoGeneration
      .update({
        where: { id: record.id },
        data: { status: "FAILED", error: message },
      })
      .catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.videoGeneration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ items: items.map(serialize) });
}

type VideoRow = {
  id: string;
  prompt: string;
  status: string;
  aspectRatio: string;
  duration: string;
  videoUrl: string | null;
  sourceImageUrl: string | null;
  error: string | null;
  createdAt: Date;
};

function serialize(row: VideoRow) {
  return {
    id: row.id,
    prompt: row.prompt,
    status: row.status,
    aspectRatio: row.aspectRatio,
    duration: row.duration,
    videoUrl: row.videoUrl,
    sourceImageUrl: row.sourceImageUrl,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  };
}
