import { fal } from "@fal-ai/client";
import { put } from "@vercel/blob";
import { getServerEnv } from "@/server/env";

/**
 * AI video generation via fal.ai (Kling models).
 *
 * Video is long-running (1–5 min), so we use fal's async queue:
 *   submit → poll status → fetch result → persist to Vercel Blob.
 * The client polls our own `/api/video/[id]` endpoint, which advances the job.
 */

const DEFAULT_T2V = "fal-ai/kling-video/v2.5-turbo/pro/text-to-video";
const DEFAULT_I2V = "fal-ai/kling-video/v2.5-turbo/pro/image-to-video";

export type VideoJobStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

let configured = false;

function ensureConfigured(): void {
  if (configured) return;
  const key = getServerEnv("FAL_KEY");
  if (!key) throw new Error("FAL_KEY не настроен. Добавьте ключ fal.ai в .env.");
  fal.config({ credentials: key });
  configured = true;
}

export function textToVideoModel(): string {
  return getServerEnv("FAL_VIDEO_MODEL_T2V") || DEFAULT_T2V;
}

export function imageToVideoModel(): string {
  return getServerEnv("FAL_VIDEO_MODEL_I2V") || DEFAULT_I2V;
}

function blobToken(): string {
  const token = getServerEnv("BLOB_READ_WRITE_TOKEN");
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN не настроен. Подключите Vercel Blob и добавьте токен."
    );
  }
  return token;
}

type SubmitParams = {
  prompt: string;
  aspectRatio: string;
  duration: string;
  imageUrl?: string;
};

export async function submitVideoJob(
  params: SubmitParams
): Promise<{ requestId: string; model: string }> {
  ensureConfigured();

  const model = params.imageUrl ? imageToVideoModel() : textToVideoModel();
  const input: Record<string, unknown> = {
    prompt: params.prompt.slice(0, 2500),
    duration: params.duration,
  };

  if (params.imageUrl) {
    input.image_url = params.imageUrl;
  } else {
    input.aspect_ratio = params.aspectRatio;
  }

  const { request_id } = await fal.queue.submit(model, { input });
  return { requestId: request_id, model };
}

function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  const video = root.video;
  if (video && typeof video === "object") {
    const url = (video as Record<string, unknown>).url;
    if (typeof url === "string") return url;
  }

  if (typeof root.video_url === "string") return root.video_url;

  const videos = root.videos;
  if (Array.isArray(videos) && videos[0] && typeof videos[0] === "object") {
    const url = (videos[0] as Record<string, unknown>).url;
    if (typeof url === "string") return url;
  }

  return null;
}

export type VideoJobUpdate = {
  status: VideoJobStatus;
  videoUrl?: string;
  error?: string;
};

/** Poll fal for a submitted job. Returns normalized status + result URL when done. */
export async function checkVideoJob(
  model: string,
  requestId: string
): Promise<VideoJobUpdate> {
  ensureConfigured();

  try {
    const status = await fal.queue.status(model, { requestId, logs: false });

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(model, { requestId });
      const url = extractVideoUrl(result.data);
      if (!url) {
        return { status: "FAILED", error: "Пустой результат генерации." };
      }
      return { status: "COMPLETED", videoUrl: url };
    }

    if (status.status === "IN_PROGRESS") {
      return { status: "IN_PROGRESS" };
    }

    return { status: "IN_QUEUE" };
  } catch (error) {
    return {
      status: "FAILED",
      error: error instanceof Error ? error.message : "Ошибка проверки задачи.",
    };
  }
}

/** Download fal's temporary video URL and store it permanently in Vercel Blob. */
export async function persistVideoToBlob(
  sourceUrl: string,
  id: string
): Promise<string> {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error("Не удалось скачать сгенерированное видео.");
  }
  const data = await response.arrayBuffer();
  const { url } = await put(`videos/${id}.mp4`, Buffer.from(data), {
    access: "public",
    contentType: "video/mp4",
    token: blobToken(),
  });
  return url;
}

/** Upload a user-supplied data-URL image to Blob so fal can read it (image-to-video). */
export async function uploadImageToBlob(
  dataUrl: string,
  id: string
): Promise<string> {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Некорректное изображение.");
  const mimeType = match[1];
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
      ? "webp"
      : "jpg";
  const buffer = Buffer.from(match[2], "base64");
  const { url } = await put(`videos/inputs/${id}.${ext}`, buffer, {
    access: "public",
    contentType: mimeType,
    token: blobToken(),
  });
  return url;
}
