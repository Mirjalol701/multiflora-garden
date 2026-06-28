export type ChatAttachment =
  | { id: string; type: "file" | "document"; name: string; content: string }
  | { id: string; type: "image"; name: string; mimeType: string; dataUrl: string }
  | { id: string; type: "link"; url: string };

export type ImageAttachmentPayload = {
  type: "image";
  dataUrl: string;
  name: string;
};

const MAX_TEXT_FILE_BYTES = 512 * 1024;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".json",
  ".csv",
  ".xml",
  ".html",
  ".htm",
  ".yaml",
  ".yml",
  ".js",
  ".ts",
  ".tsx",
  ".jsx",
  ".py",
  ".java",
  ".c",
  ".cpp",
  ".h",
  ".css",
  ".scss",
  ".sql",
  ".log",
  ".env",
  ".ini",
  ".toml",
]);

const DOCUMENT_EXTENSIONS = new Set([
  ...TEXT_EXTENSIONS,
  ".doc",
  ".docx",
  ".rtf",
  ".pdf",
]);

const TEXT_MIME_PREFIXES = ["text/", "application/json", "application/xml"];

function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot).toLowerCase();
}

export function isTextLikeFile(file: File): boolean {
  const ext = getExtension(file.name);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  return TEXT_MIME_PREFIXES.some((p) => file.type.startsWith(p));
}

export function isDocumentFile(file: File): boolean {
  const ext = getExtension(file.name);
  return DOCUMENT_EXTENSIONS.has(ext) || isTextLikeFile(file);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Не удалось прочитать файл «${file.name}»`));
    reader.readAsText(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Не удалось прочитать изображение «${file.name}»`));
    reader.readAsDataURL(file);
  });
}

export function createAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function fileToAttachment(
  file: File,
  kind: "file" | "document" | "image"
): Promise<ChatAttachment> {
  const id = createAttachmentId();

  if (kind === "image") {
    if (!isImageFile(file)) {
      throw new Error("Выберите файл изображения (PNG, JPG, GIF, WebP).");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("Изображение слишком большое (макс. 4 МБ).");
    }
    const dataUrl = await readFileAsDataUrl(file);
    return { id, type: "image", name: file.name, mimeType: file.type, dataUrl };
  }

  if (kind === "document" && !isDocumentFile(file)) {
    throw new Error("Поддерживаются текстовые документы: TXT, MD, JSON, CSV и др.");
  }

  if (!isTextLikeFile(file) && kind === "file") {
    throw new Error(
      "Этот тип файла не поддерживается. Попробуйте текстовый файл или изображение."
    );
  }

  if (!isTextLikeFile(file)) {
    throw new Error(
      `Формат «${getExtension(file.name) || file.type}» пока не поддерживается. Используйте TXT, MD или JSON.`
    );
  }

  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error("Файл слишком большой (макс. 512 КБ).");
  }

  const content = await readFileAsText(file);
  return { id, type: kind, name: file.name, content };
}

export function linkToAttachment(url: string): ChatAttachment {
  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Введите корректную ссылку (например, https://example.com).");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Поддерживаются только ссылки http и https.");
  }
  return { id: createAttachmentId(), type: "link", url: parsed.href };
}

export function buildMessageWithAttachments(
  text: string,
  attachments: ChatAttachment[]
): string {
  if (attachments.length === 0) return text.trim();

  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());

  for (const att of attachments) {
    if (att.type === "link") {
      parts.push(`Ссылка: ${att.url}`);
      continue;
    }
    if (att.type === "image") {
      parts.push(`Изображение: ${att.name}`);
      continue;
    }
    parts.push(
      `---\nВложение: ${att.name}\n\`\`\`\n${att.content}\n\`\`\``
    );
  }

  return parts.join("\n\n");
}

export function extractImageAttachments(
  attachments: ChatAttachment[]
): ImageAttachmentPayload[] {
  return attachments
    .filter((a): a is Extract<ChatAttachment, { type: "image" }> => a.type === "image")
    .map((a) => ({ type: "image", dataUrl: a.dataUrl, name: a.name }));
}
