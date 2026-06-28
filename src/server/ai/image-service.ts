import { modelRouter } from "@/server/ai/router";
import { getServerEnv } from "@/server/env";
import { formatImageError } from "@/lib/ai-errors";
import { cleanImageUserMessage } from "@/lib/image-intent";

const OPENAI_BASE = "https://api.openai.com/v1";

const IMAGE_MODELS = ["dall-e-3", "gpt-image-1"] as const;

const CELEBRITY_REPLACEMENTS: [RegExp, string][] = [
  [/\blionel\s+messi\b/gi, "a professional male football player with short dark hair"],
  [/\bmessi\b/gi, "a professional male football player"],
  [/\bcristiano\s+ronaldo\b/gi, "a professional male football player"],
  [/\bronaldo\b/gi, "a professional male football player"],
  [/\bneymar\b/gi, "a professional male football player"],
  [/\bmbapp[eé]\b/gi, "a professional male football player"],
];

function getApiKey(): string {
  const key = getServerEnv("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

/** Avoid celebrity names — OpenAI image models often reject them. */
export function sanitizeImagePrompt(prompt: string): string {
  let out = prompt;
  for (const [pattern, replacement] of CELEBRITY_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out.replace(/\s{2,}/g, " ").trim();
}

function buildGenerationBody(model: string, prompt: string): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model,
    prompt: prompt.slice(0, 4000),
    n: 1,
    size: "1024x1024",
  };

  if (model === "dall-e-3") {
    body.quality = "standard";
  } else if (model.startsWith("gpt-image")) {
    body.quality = "medium";
  }

  return body;
}

async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Не удалось скачать сгенерированное изображение");
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function extractB64(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  const items = root.data;
  if (Array.isArray(items) && items[0] && typeof items[0] === "object") {
    const first = items[0] as Record<string, unknown>;
    if (typeof first.b64_json === "string") return first.b64_json;
    if (typeof first.url === "string") return null; // handled separately
  }

  if (typeof root.b64_json === "string") return root.b64_json;
  return null;
}

function extractUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const items = root.data;
  if (Array.isArray(items) && items[0] && typeof items[0] === "object") {
    const first = items[0] as Record<string, unknown>;
    if (typeof first.url === "string") return first.url;
  }
  return null;
}

function parseDataUrl(dataUrl: string): {
  buffer: Buffer;
  mimeType: string;
  filename: string;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Некорректное изображение");
  const mimeType = match[1];
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
  return {
    mimeType,
    buffer: Buffer.from(match[2], "base64"),
    filename: `input.${ext}`,
  };
}

function buildEditPrompt(userMessage: string): string {
  const cleaned = cleanImageUserMessage(userMessage);
  return (
    `Edit this photo: ${cleaned}. ` +
    `Keep the exact same person — same face, facial features, expression, hair, skin tone, and body pose. ` +
    `Change only what was requested (for example jersey/uniform). Photorealistic sports photography.`
  );
}

async function editImageFromReference(dataUrl: string, prompt: string): Promise<string> {
  const { buffer, mimeType, filename } = parseDataUrl(dataUrl);
  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("prompt", prompt.slice(0, 4000));
  form.append("input_fidelity", "high");
  form.append("quality", "high");
  form.append("image", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);

  const response = await fetch(`${OPENAI_BASE}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: form,
  });

  const rawText = await response.text();

  if (!response.ok) {
    let message = rawText;
    try {
      const err = JSON.parse(rawText) as { error?: { message?: string } };
      message = err.error?.message ?? rawText;
    } catch {
      // keep raw
    }
    throw new Error(`[gpt-image-1 edit] ${message}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Некорректный ответ от API редактирования");
  }

  const b64 = extractB64(data);
  if (b64) return b64;

  const url = extractUrl(data);
  if (url) return urlToBase64(url);

  throw new Error("Пустой ответ от API редактирования");
}

async function requestImage(model: string, prompt: string): Promise<string> {
  const response = await fetch(`${OPENAI_BASE}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify(buildGenerationBody(model, prompt)),
  });

  const rawText = await response.text();

  if (!response.ok) {
    let message = rawText;
    try {
      const err = JSON.parse(rawText) as { error?: { message?: string } };
      message = err.error?.message ?? rawText;
    } catch {
      // keep raw
    }
    throw new Error(`[${model}] ${message}`);
  }

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error("Некорректный ответ от API изображений");
  }

  const b64 = extractB64(data);
  if (b64) return b64;

  const url = extractUrl(data);
  if (url) return urlToBase64(url);

  throw new Error("Пустой ответ от API изображений");
}

export async function generateImage(prompt: string): Promise<{ b64: string; model: string }> {
  const safePrompt = sanitizeImagePrompt(prompt);
  let lastError: Error | null = null;

  for (const model of IMAGE_MODELS) {
    try {
      const b64 = await requestImage(model, safePrompt);
      return { b64, model };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw new Error(formatImageError(lastError));
}

/** Edit attached photo (preserves face) or generate from scratch. */
export async function generateImageFromRequest(
  userMessage: string,
  imageAttachments?: { dataUrl: string; name: string }[]
): Promise<{ b64: string; model: string }> {
  if (imageAttachments?.[0]) {
    const editPrompt = buildEditPrompt(userMessage);
    try {
      const b64 = await editImageFromReference(imageAttachments[0].dataUrl, editPrompt);
      return { b64, model: "gpt-image-1" };
    } catch {
      // Fall back to text-to-image with vision prompt
    }
  }

  const dallePrompt = await buildDallePrompt(userMessage, imageAttachments);
  return generateImage(dallePrompt);
}

function fallbackPromptFromUser(userMessage: string): string {
  const cleaned = sanitizeImagePrompt(cleanImageUserMessage(userMessage));
  if (cleaned) {
    return `Photorealistic image: ${cleaned}. High quality, detailed, natural lighting.`;
  }
  return "Photorealistic professional football player in Portugal national team red and green jersey on a stadium, high quality photo";
}

export async function buildDallePrompt(
  userMessage: string,
  imageAttachments?: { dataUrl: string; name: string }[]
): Promise<string> {
  const fallback = fallbackPromptFromUser(userMessage);

  if (!imageAttachments?.length) {
    return fallback;
  }

  try {
    const { provider, config } = modelRouter.forZyron();
    const result = await provider.complete({
      system: `You write prompts for AI image generation.
The user attached a reference photo. Describe a NEW photorealistic image matching their request.
Do NOT use real celebrity names — use generic descriptions like "professional football player".
Write one detailed English prompt. Output ONLY the prompt.`,
      messages: [
        {
          role: "user",
          content:
            cleanImageUserMessage(userMessage) ||
            "Create an image based on the attached photo and user request.",
        },
      ],
      imageAttachments,
      model: config.model,
      temperature: 0.5,
      maxTokens: 500,
    });

    const prompt = sanitizeImagePrompt(
      result.text.trim().replace(/^["']|["']$/g, "")
    );
    if (prompt.length > 15) return prompt;
  } catch {
    // vision step failed — use text fallback
  }

  return fallback;
}

export function imageToMarkdown(b64: string, alt: string): string {
  const safeAlt =
    alt.replace(/[\[\]()]/g, "").slice(0, 120) || "Сгенерированное изображение";
  return `![${safeAlt}](data:image/png;base64,${b64})`;
}
