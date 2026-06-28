import { getClientIpFromHeaders } from "@/lib/rate-limit";

type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes"?: string[];
};

export async function verifyTurnstileToken(
  token: string,
  ip: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[turnstile] TURNSTILE_SECRET_KEY not set — skipping in dev");
      return true;
    }
    return false;
  }

  if (!token?.trim()) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret,
          response: token,
          remoteip: ip !== "unknown" ? ip : undefined,
        }),
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch {
    return false;
  }
}

export async function verifyTurnstileFromHeaders(
  token: string,
  headers: Headers
): Promise<boolean> {
  const ip = getClientIpFromHeaders(headers);
  return verifyTurnstileToken(token, ip);
}
