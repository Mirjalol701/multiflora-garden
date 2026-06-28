"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeHtml, sanitizeMarkdown } from "@/lib/sanitize";
import { logSecurityEvent } from "@/lib/security-logger";
import { createShareToken } from "@/lib/share-token";

const MAX_PUBLISHED_ARTIFACTS_PER_DAY = 20;

export async function publishArtifactShare(data: {
  title: string;
  content: string;
  type?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    logSecurityEvent("unauthorized_action", {
      action: "publishArtifactShare",
    });
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const publishedToday = await prisma.artifact.count({
    where: {
      userId,
      isPublic: true,
      createdAt: { gte: dayStart },
    },
  });

  if (publishedToday >= MAX_PUBLISHED_ARTIFACTS_PER_DAY) {
    logSecurityEvent("artifact_publish_limit_exceeded", {
      userId,
      publishedToday,
    });
    throw new Error("Daily publish limit exceeded");
  }

  const token = createShareToken();

  const artifact = await prisma.artifact.create({
    data: {
      userId,
      title: sanitizeHtml(data.title),
      content: sanitizeMarkdown(data.content),
      type: data.type ?? "document",
      shareToken: token,
      isPublic: true,
    },
    select: { shareToken: true },
  });

  return { token: artifact.shareToken! };
}

export async function getSharedArtifact(token: string) {
  const artifact = await prisma.artifact.findFirst({
    where: { shareToken: token, isPublic: true },
    select: {
      title: true,
      content: true,
      type: true,
      createdAt: true,
      version: true,
    },
  });
  return artifact;
}

export async function completeOnboarding(data: {
  userRole: string;
  projectName: string;
  projectInstructions?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };

  const userId = session.user.id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingCompleted: true,
      userRole: data.userRole,
    },
  });

  await prisma.project.create({
    data: {
      userId,
      name: data.projectName,
      instructions: data.projectInstructions,
    },
  });

  return { success: true as const };
}

export async function skipOnboarding() {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  });

  return { success: true as const };
}

function shouldSkipForeignResource(
  existing: { userId: string | null } | null,
  userId: string,
  resourceType: string,
  resourceId: string
): boolean {
  if (!existing) return false;
  if (existing.userId !== userId) {
    logSecurityEvent("idor_attempt", {
      userId,
      attackerUserId: userId,
      targetResourceId: resourceId,
      resourceType,
    });
    return true;
  }
  return false;
}

export async function syncWorkspaceToDb(state: {
  projects: { id: string; name: string; description?: string; instructions?: string; color: string }[];
  chats: { id: string; title: string; projectId?: string | null; mode: string; messages: { role: string; content: string }[] }[];
  artifacts: { id: string; title: string; content: string; type: string; projectId?: string | null; chatId?: string | null; shareToken?: string | null; isPublic?: boolean; version?: number }[];
  memories: { id: string; content: string; status: string; projectId?: string | null; source?: string }[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };
  const userId = session.user.id;

  try {
    for (const p of state.projects) {
      const existing = await prisma.project.findUnique({
        where: { id: p.id },
        select: { userId: true },
      });
      if (shouldSkipForeignResource(existing, userId, "project", p.id)) {
        continue;
      }

      await prisma.project.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          userId,
          name: sanitizeHtml(p.name),
          description: p.description ? sanitizeMarkdown(p.description) : undefined,
          instructions: p.instructions ? sanitizeMarkdown(p.instructions) : undefined,
          color: p.color,
        },
        update: {
          name: sanitizeHtml(p.name),
          description: p.description ? sanitizeMarkdown(p.description) : undefined,
          instructions: p.instructions ? sanitizeMarkdown(p.instructions) : undefined,
          color: p.color,
        },
      });
    }

    for (const c of state.chats) {
      const existingChat = await prisma.aiChat.findUnique({
        where: { id: c.id },
        select: { userId: true },
      });
      if (shouldSkipForeignResource(existingChat, userId, "chat", c.id)) {
        continue;
      }

      await prisma.aiChat.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          userId,
          projectId: c.projectId ?? null,
          title: sanitizeHtml(c.title),
          mode: c.mode,
        },
        update: {
          title: sanitizeHtml(c.title),
          projectId: c.projectId ?? null,
          mode: c.mode,
        },
      });

      await prisma.aiMessage.deleteMany({ where: { chatId: c.id } });
      if (c.messages.length > 0) {
        await prisma.aiMessage.createMany({
          data: c.messages.map((m, i) => ({
            id: `${c.id}-m${i}`,
            chatId: c.id,
            role: m.role,
            content: sanitizeMarkdown(m.content),
          })),
        });
      }
    }

    for (const a of state.artifacts) {
      const existingArtifact = await prisma.artifact.findUnique({
        where: { id: a.id },
        select: { userId: true },
      });
      if (shouldSkipForeignResource(existingArtifact, userId, "artifact", a.id)) {
        continue;
      }

      await prisma.artifact.upsert({
        where: { id: a.id },
        create: {
          id: a.id,
          userId,
          projectId: a.projectId ?? null,
          chatId: a.chatId ?? null,
          title: sanitizeHtml(a.title),
          content: sanitizeMarkdown(a.content),
          type: a.type,
          shareToken: a.shareToken ?? null,
          isPublic: a.isPublic,
          version: a.version,
        },
        update: {
          title: sanitizeHtml(a.title),
          content: sanitizeMarkdown(a.content),
          type: a.type,
          projectId: a.projectId ?? null,
          chatId: a.chatId ?? null,
          shareToken: a.shareToken ?? null,
          isPublic: a.isPublic,
          version: a.version,
        },
      });
    }

    for (const m of state.memories) {
      const existingMemory = await prisma.memory.findUnique({
        where: { id: m.id },
        select: { userId: true },
      });
      if (shouldSkipForeignResource(existingMemory, userId, "memory", m.id)) {
        continue;
      }

      await prisma.memory.upsert({
        where: { id: m.id },
        create: {
          id: m.id,
          userId,
          projectId: m.projectId ?? null,
          content: sanitizeMarkdown(m.content),
          status: m.status,
          source: m.source ?? null,
        },
        update: {
          content: sanitizeMarkdown(m.content),
          status: m.status,
          projectId: m.projectId ?? null,
          source: m.source ?? null,
        },
      });
    }

    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}

export async function loadWorkspaceFromDb() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true, userRole: true },
    });

    const [projects, chats, artifacts, memories] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.aiChat.findMany({
        where: { userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.artifact.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.memory.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return {
      onboardingCompleted: user?.onboardingCompleted ?? false,
      userRole: user?.userRole as "founder" | "dev" | "researcher" | "creator" | null,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? undefined,
        instructions: p.instructions ?? undefined,
        color: p.color,
        createdAt: p.createdAt.toISOString(),
      })),
      chats: chats.map((c) => ({
        id: c.id,
        title: c.title,
        projectId: c.projectId,
        mode: c.mode as "chat" | "cowork" | "code",
        createdAt: c.createdAt.toISOString(),
        messages: c.messages.map((m, i) => ({
          id: `${c.id}-m${i}`,
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      })),
      artifacts: artifacts.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        type: a.type as "document" | "code" | "plan",
        projectId: a.projectId,
        chatId: a.chatId,
        shareToken: a.shareToken,
        isPublic: a.isPublic,
        version: a.version,
        createdAt: a.createdAt.toISOString(),
      })),
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        status: m.status as "PENDING" | "APPROVED" | "REJECTED",
        projectId: m.projectId,
        source: m.source ?? undefined,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  } catch {
    return null;
  }
}
