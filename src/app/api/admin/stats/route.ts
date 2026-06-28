import { auth } from "@/auth";
import { ensureAdminAccess, isAdminEmail } from "@/lib/admin-access";
import { getAdminStats } from "@/lib/admin-stats";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  let userId = session?.user?.id;

  if (!userId && email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    userId = user?.id;
  }

  if (!userId && !isAdminEmail(email)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowed =
    isAdminEmail(email) ||
    (userId ? await ensureAdminAccess(userId, email) : false);

  if (!allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const stats = await getAdminStats();
  return Response.json(stats);
}
