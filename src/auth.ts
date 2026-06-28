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
      }
      if (token.id) {
        const email = (token.email as string | undefined) ?? user?.email ?? undefined;
        if (isAdminEmail(email)) {
          token.userRole = "admin";
        } else if (user?.id || token.userRole === undefined) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { userRole: true, email: true },
          });
          token.userRole = resolveUserRole(
            dbUser?.userRole,
            email ?? dbUser?.email
          );
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.userRole = (token.userRole as string | null) ?? null;
      }
      return session;
    },
  },
});
