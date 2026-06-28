import { prisma } from "@/lib/prisma";

export type AdminStats = {
  totalUsers: number;
  newUsersToday: number;
  newUsersWeek: number;
  newUsersMonth: number;
  totalChats: number;
  chatsThisWeek: number;
  totalArtifacts: number;
  artifactsThisWeek: number;
  totalCallbacks: number;
  pendingCallbacks: number;
  totalMemories: number;
  totalProjects: number;
  allUsers: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: Date;
    userRole: string | null;
    providers: string[];
  }[];
  recentUsers: {
    id: string;
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: Date;
    userRole: string | null;
  }[];
  recentCallbacks: {
    id: string;
    name: string;
    phone: string;
    createdAt: Date;
    status: string;
  }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalChats,
    chatsThisWeek,
    totalArtifacts,
    artifactsThisWeek,
    totalCallbacks,
    pendingCallbacks,
    totalMemories,
    totalProjects,
    allUsersRaw,
    recentCallbacks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
    prisma.aiChat.count(),
    prisma.aiChat.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.artifact.count(),
    prisma.artifact.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.callbackRequest.count(),
    prisma.callbackRequest.count({
      where: {
        status: { notIn: ["done", "DONE", "completed", "COMPLETED"] },
      },
    }),
    prisma.memory.count(),
    prisma.project.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        userRole: true,
        accounts: { select: { provider: true } },
      },
    }),
    prisma.callbackRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const allUsers = allUsersRaw.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt,
    userRole: user.userRole,
    providers: user.accounts.map((a) => a.provider),
  }));

  return {
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    totalChats,
    chatsThisWeek,
    totalArtifacts,
    artifactsThisWeek,
    totalCallbacks,
    pendingCallbacks,
    totalMemories,
    totalProjects,
    allUsers,
    recentUsers: allUsers.slice(0, 10),
    recentCallbacks,
  };
}
