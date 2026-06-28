import { prisma } from "@/lib/prisma";

const DEV_FALLBACK_ADMIN_EMAILS = [
  "mirjieshkere@gmail.com",
  "mirjieshkeree@gmail.com",
];

function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (fromEnv.length > 0) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return DEV_FALLBACK_ADMIN_EMAILS;
  }

  return [];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

export function resolveUserRole(
  dbRole: string | null | undefined,
  email: string | null | undefined
): string | null {
  if (dbRole === "admin" || isAdminEmail(email)) return "admin";
  return dbRole ?? null;
}

export async function ensureAdminAccess(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  let resolvedEmail = email?.toLowerCase();

  if (!resolvedEmail) {
    const byId = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, userRole: true },
    });
    resolvedEmail = byId?.email?.toLowerCase();
    if (byId?.userRole === "admin") return true;
  }

  if (isAdminEmail(resolvedEmail)) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { userRole: "admin" },
      });
    } catch {
      // User row may not exist yet — env allowlist still grants access
    }
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { userRole: true, email: true },
  });

  if (!user) return false;

  if (isAdminEmail(user.email)) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { userRole: "admin" },
      });
    } catch {
      /* ignore */
    }
    return true;
  }

  return user.userRole === "admin";
}
