import { formatGeminiUserError } from "@/lib/ai-errors";

export { parseRetrySeconds } from "@/lib/ai-errors";

export class GeminiApiError extends Error {
  readonly status: number;
  readonly userMessage: string;

  constructor(raw: string, status: number) {
    const userMessage = formatGeminiUserError(raw, status);
    super(userMessage);
    this.name = "GeminiApiError";
    this.status = status;
    this.userMessage = userMessage;
  }
}
