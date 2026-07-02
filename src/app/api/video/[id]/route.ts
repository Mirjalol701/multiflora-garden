import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkVideoJob, persistVideoToBlob } from "@/server/ai/video-service";
import { NextResponse } from "next/server";

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const record = await prisma.videoGeneration.findUnique({ where: { id } });

  if (!record || record.userId !== session.user.id) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  // Terminal states — nothing to advance.
  if (record.status === "COMPLETED" || record.status === "FAILED") {
    return NextResponse.json(serialize(record));
  }

  if (!record.falRequestId || !record.model) {
    return NextResponse.json(serialize(record));
  }

  const update = await checkVideoJob(record.model, record.falRequestId);

  if (update.status === "COMPLETED" && update.videoUrl) {
    try {
      const blobUrl = await persistVideoToBlob(update.videoUrl, record.id);
      const done = await prisma.videoGeneration.update({
        where: { id: record.id },
        data: {
          status: "COMPLETED",
          videoUrl: blobUrl,
          completedAt: new Date(),
        },
      });
      return NextResponse.json(serialize(done));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Не удалось сохранить видео.";
      const failed = await prisma.videoGeneration.update({
        where: { id: record.id },
        data: { status: "FAILED", error: message },
      });
      return NextResponse.json(serialize(failed));
    }
  }

  if (update.status === "FAILED") {
    const failed = await prisma.videoGeneration.update({
      where: { id: record.id },
      data: { status: "FAILED", error: update.error ?? "Ошибка генерации." },
    });
    return NextResponse.json(serialize(failed));
  }

  // Still queued / in progress — persist status if it changed.
  if (update.status !== record.status) {
    const bumped = await prisma.videoGeneration.update({
      where: { id: record.id },
      data: { status: update.status },
    });
    return NextResponse.json(serialize(bumped));
  }

  return NextResponse.json(serialize(record));
}
