import { NextResponse, type NextRequest } from "next/server";
import {
  applyMiddlewareRateLimit,
  getClientIpFromRequest,
  resolveMiddlewareLimitTier,
} from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-logger";

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com",
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

/**
 * Edge middleware: rate limits + security headers only.
 * Auth is enforced in route handlers (Node runtime) — NextAuth JWT decode on Edge
 * can crash with CompressionStream errors on Vercel for logged-in users.
 */
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = getClientIpFromRequest(req);

  if (pathname.startsWith("/api/public")) {
    return withSecurityHeaders(NextResponse.next());
  }

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

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
