/** Pull a short human-readable message from raw API / JSON errors. */
export function extractApiErrorMessage(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "Неизвестная ошибка";

  try {
    const parsed = JSON.parse(trimmed) as { error?: { message?: string } };
    if (parsed.error?.message) return parsed.error.message;
  } catch {
    // not JSON
  }

  const match = trimmed.match(/"message"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (match?.[1]) {
    return match[1].replace(/\\"/g, '"').replace(/\\n/g, " ");
  }

  return trimmed;
}

export function parseRetrySeconds(message: string): number | null {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (!match) return null;
  const seconds = Math.ceil(parseFloat(match[1]));
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.min(seconds, 60);
}

export function isQuotaError(message: string, status?: number): boolean {
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource exhausted") ||
    lower.includes("too many requests") ||
    lower.includes("free_tier")
  );
}

export function formatImageError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const msg = extractApiErrorMessage(raw);
  const lower = msg.toLowerCase();

  if (
    lower.includes("billing") ||
    lower.includes("insufficient_quota") ||
    lower.includes("exceeded your current quota")
  ) {
    return "Недостаточно средств на OpenAI. Пополните баланс для генерации изображений (DALL-E).";
  }

  if (isQuotaError(msg)) {
    const retry = parseRetrySeconds(msg);
    return retry
      ? `Лимит запросов OpenAI. Подождите ~${retry} сек.`
      : "Лимит запросов OpenAI. Подождите минуту.";
  }

  if (
    lower.includes("content_policy") ||
    lower.includes("safety") ||
    lower.includes("moderation") ||
    lower.includes("not allowed") ||
    lower.includes("cannot fulfill")
  ) {
    return (
      "OpenAI отклонил запрос. Не указывайте имена знаменитостей — " +
      "опишите сцену: «футболист в красно-зелёной форме сборной Португалии на стадионе»."
    );
  }

  if (lower.includes("model") && (lower.includes("not found") || lower.includes("does not exist"))) {
    return "Модель генерации изображений недоступна на вашем аккаунте OpenAI.";
  }

  return msg.length > 280 ? `${msg.slice(0, 280)}…` : msg;
}

/** User-facing message — never dump raw API JSON */
export function formatGeminiUserError(raw: string, status?: number): string {
  const msg = extractApiErrorMessage(raw);

  if (isQuotaError(msg, status)) {
    const retry = parseRetrySeconds(msg);
    const wait = retry
      ? ` Подождите ~${retry} сек. и попробуйте снова.`
      : " Подождите 30–60 сек. и попробуйте снова.";
    return (
      "Лимит запросов AI." +
      wait
    );
  }

  if (status === 401 || status === 403 || msg.toLowerCase().includes("api key")) {
    return "Неверный или просроченный API-ключ. Проверьте OPENAI_API_KEY / GEMINI_API_KEY в .env.";
  }

  if (msg.length > 280) {
    return `${msg.slice(0, 280)}…`;
  }

  return msg;
}
