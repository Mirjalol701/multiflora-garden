"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { applyActionRateLimit } from "@/lib/rate-limit";
import { sanitizeHtml } from "@/lib/sanitize";
import { logSecurityEvent } from "@/lib/security-logger";
import { verifyTurnstileFromHeaders } from "@/lib/turnstile";
import { CallbackSchema, type CallbackInput } from "@/lib/validations";

type CallbackResult =
  | { success: true }
  | { success: false; error: string };

export async function createCallbackRequest(
  data: CallbackInput
): Promise<CallbackResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const rate = await applyActionRateLimit(headersList, "CALLBACK");
  if (!rate.success) {
    logSecurityEvent("rate_limit_exceeded", {
      ip,
      endpoint: "createCallbackRequest",
      tier: "CALLBACK",
      retryAfter: rate.retryAfter,
    });
    return {
      success: false,
      error: "Слишком много заявок. Попробуйте позже.",
    };
  }

  if (data.website?.trim()) {
    logSecurityEvent("honeypot_triggered", { ip, endpoint: "createCallbackRequest" });
    return { success: true };
  }

  const parsed = CallbackSchema.safeParse(data);

  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message;
    return {
      success: false,
      error: firstError ?? "Проверьте правильность заполнения формы",
    };
  }

  const turnstileOk = await verifyTurnstileFromHeaders(
    parsed.data.turnstileToken ?? "",
    headersList
  );
  if (!turnstileOk) {
    logSecurityEvent("turnstile_verification_failed", {
      ip,
      endpoint: "createCallbackRequest",
    });
    return {
      success: false,
      error: "Не удалось подтвердить защиту от ботов. Попробуйте снова.",
    };
  }

  const name = sanitizeHtml(parsed.data.name);
  const phone = sanitizeHtml(parsed.data.phone);

  try {
    await prisma.callbackRequest.create({
      data: {
        name,
        phone,
        status: "NEW",
      },
      select: { id: true },
    });

    revalidatePath("/");
    revalidatePath("/contacts");

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Не удалось отправить заявку. Попробуйте позже.",
    };
  }
}
