/**
 * Rate limiting — two intentional layers:
 *
 * 1. Middleware (IP-based, before auth)
 *    - AI_IP:    /api/chat, /api/agent/* — blocks unauthenticated spam & bots
 *    - AUTH:     /api/auth/*              — protects login/signup brute-force
 *    - GENERAL:  all other /api/*         — baseline API protection
 *
 * 2. Route handlers (user-based, after auth)
 *    - AI_USER:  /api/chat, /api/agent/* — caps per-user AI cost/abuse
 *
 * Middleware and handler counters are separate by design: an IP can hit the
 * IP ceiling before auth runs (401 → 429), while authenticated users also
 * have a tighter per-user ceiling below the IP ceiling.
 *
 * Edge-safe: in-memory Map + Web APIs only (no Node crypto/fs).
 */

import { NextResponse, type NextRequest } from "next/server";
import { logSecurityEvent } from "@/lib/security-logger";

type RateLimitTierConfig = {
  key: (identifier: string) => string;
  limit: number;
  windowMs: number;
  description: string;
};

export const RATE_LIMITS = {
  /** Middleware — AI endpoints per IP (blocks bots/spam before auth). */
  AI_IP: {
    key: (ip: string) => `ai:ip:${ip}`,
    limit: 30,
    windowMs: 60_000,
    description: "AI endpoints per IP (blocks bots/spam)",
  },
  /** Route handler — AI endpoints per user (blocks authenticated cost abuse). */
  AI_USER: {
    key: (userId: string) => `ai:user:${userId}`,
    limit: 15,
    windowMs: 60_000,
    description: "AI endpoints per user (blocks cost abuse)",
  },
  /** Middleware — auth endpoints per IP. */
  AUTH: {
    key: (ip: string) => `auth:ip:${ip}`,
    limit: 20,
    windowMs: 60_000,
    description: "Auth endpoints per IP",
  },
  /** Server action — callback form submissions per IP. */
  CALLBACK: {
    key: (ip: string) => `callback:ip:${ip}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
    description: "Callback form submissions per IP",
  },
  /** Middleware — general API endpoints per IP. */
  GENERAL: {
    key: (ip: string) => `general:ip:${ip}`,
    limit: 60,
    windowMs: 60_000,
    description: "General API endpoints per IP",
  },
} as const satisfies Record<string, RateLimitTierConfig>;

export type MiddlewareRateLimitTier = "AI_IP" | "AUTH" | "GENERAL";
export type HandlerRateLimitTier = "AI_USER";
export type ActionRateLimitTier = "CALLBACK";

type BucketEntry = {
  timestamps: number[];
};

const buckets = new Map<string, BucketEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function maxWindowMs(): number {
  return Math.max(...Object.values(RATE_LIMITS).map((t) => t.windowMs));
}

function cleanupBuckets(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const window = maxWindowMs();
  for (const [key, entry] of buckets.entries()) {
    entry.timestamps = entry.timestamps.filter((ts) => now - ts < window);
    if (entry.timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}

function resolveClientIp(headers: Headers): string {
  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  if (process.env.NODE_ENV === "development") {
    const forwarded = headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0]?.trim() || "unknown";
    }
  }

  return "unknown";
}

export function getClientIpFromRequest(req: NextRequest | Request): string {
  return resolveClientIp(req.headers);
}

export function getClientIpFromHeaders(headers: Headers): string {
  return resolveClientIp(headers);
}

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfter: number };

function slidingWindowCheck(
  key: string,
  limit: number,
  windowMs: number,
  now: number
): RateLimitResult {
  cleanupBuckets(now);

  let entry = buckets.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    buckets.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfter = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1000)
    );
    return { success: false, retryAfter };
  }

  entry.timestamps.push(now);
  return { success: true };
}

function checkTier(
  tier: RateLimitTierConfig,
  identifier: string,
  now = Date.now()
): RateLimitResult {
  return slidingWindowCheck(tier.key(identifier), tier.limit, tier.windowMs, now);
}

function tooManyRequestsResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    }
  );
}

function logRateLimitHit(
  tierName: string,
  details: Record<string, unknown> & { retryAfter: number }
): void {
  console.warn(`[rate-limit] Blocked ${tierName}`, details);
  logSecurityEvent("rate_limit_hit", { tier: tierName, ...details });
}

/** Layer 1 — middleware IP limit. Returns 429 response or null if allowed. */
export async function applyMiddlewareRateLimit(
  req: NextRequest | Request,
  tier: MiddlewareRateLimitTier
): Promise<NextResponse | null> {
  const config = RATE_LIMITS[tier];
  const ip = getClientIpFromRequest(req);
  const result = checkTier(config, ip);

  if (!result.success) {
    const endpoint =
      req instanceof Request && "url" in req ? new URL(req.url).pathname : "unknown";
    logRateLimitHit(tier, {
      ip,
      endpoint,
      retryAfter: result.retryAfter,
    });
    return tooManyRequestsResponse(result.retryAfter);
  }

  return null;
}

/** Layer 2 — authenticated user limit in AI route handlers. */
export async function applyHandlerRateLimit(
  userId: string,
  tier: HandlerRateLimitTier = "AI_USER"
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[tier];
  const result = checkTier(config, userId);

  if (!result.success) {
    logRateLimitHit(tier, {
      userId,
      retryAfter: result.retryAfter,
    });
  }

  return result;
}

/** Server actions — IP limit from request headers (e.g. callback form). */
export async function applyActionRateLimit(
  headers: Headers,
  tier: ActionRateLimitTier
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[tier];
  const ip = getClientIpFromHeaders(headers);
  const result = checkTier(config, ip);

  if (!result.success) {
    logRateLimitHit(tier, {
      ip,
      retryAfter: result.retryAfter,
    });
  }

  return result;
}

export function resolveMiddlewareLimitTier(
  pathname: string
): MiddlewareRateLimitTier | null {
  if (!pathname.startsWith("/api/")) {
    return null;
  }
  if (pathname.startsWith("/api/auth")) {
    return "AUTH";
  }
  if (pathname.startsWith("/api/public")) {
    return null;
  }
  if (pathname.startsWith("/api/chat") || pathname.startsWith("/api/agent")) {
    return "AI_IP";
  }
  return "GENERAL";
}
