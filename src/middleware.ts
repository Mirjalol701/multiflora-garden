import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import {
  applyMiddlewareRateLimit,
  getClientIpFromRequest,
  resolveMiddlewareLimitTier,
} from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

const { auth } = NextAuth(authConfig);

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const ip = getClientIpFromRequest(req);

  if (pathname.startsWith("/api/public")) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Layer 1: IP rate limit BEFORE auth (see RATE_LIMITS in @/lib/rate-limit)
  const limitTier = resolveMiddlewareLimitTier(pathname);
  if (limitTier) {
    const rateLimitResponse = await applyMiddlewareRateLimit(req, limitTier);
    if (rateLimitResponse) {
      logSecurityEvent("rate_limit_exceeded", {
        ip,
        endpoint: pathname,
        tier: limitTier,
        retryAfter: rateLimitResponse.headers.get("Retry-After"),
      });
      return withSecurityHeaders(rateLimitResponse);
    }
  }

  // STEP 2: Auth check (after rate limit)
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/public")
  ) {
    if (!req.auth?.user?.id) {
      logSecurityEvent("unauthorized_api_access", {
        ip,
        endpoint: pathname,
        method: req.method,
      });
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Unauthorized", message: "Authentication required" },
          { status: 401 }
        )
      );
    }
  }

  return withSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
