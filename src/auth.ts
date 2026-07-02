import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import authConfig from "@/auth.config";
import { isAdminEmail, resolveUserRole } from "@/lib/admin-access";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      } else if (!token.id && token.sub) {
        token.id = token.sub;
      }
      if (token.id) {
        const email = (token.email as string | undefined) ?? user?.email ?? undefined;
        if (isAdminEmail(email)) {
          token.userRole = "admin";
        } else if (user?.id || token.userRole === undefined) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { id: token.id as string },
              select: { userRole: true, email: true },
            });
            token.userRole = resolveUserRole(
              dbUser?.userRole,
              email ?? dbUser?.email
            );
          } catch (error) {
            console.error("[auth] jwt db lookup failed:", error);
          }
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const id =
          (token.id as string | undefined) ?? (token.sub as string | undefined);
        if (id) {
          session.user.id = id;
        }
        session.user.userRole = (token.userRole as string | null) ?? null;
      }
      return session;
    },
  },
});
