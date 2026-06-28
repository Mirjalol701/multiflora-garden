"use server";

import { auth } from "@/auth";
import { indexEmbedding } from "@/server/memory/embedding-service";

export async function indexMemoryEmbedding(data: {
  memoryId: string;
  content: string;
  projectId?: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { success: false as const };

  try {
    await indexEmbedding({
      userId: session.user.id,
      projectId: data.projectId,
      sourceType: "memory",
      sourceId: data.memoryId,
      content: data.content,
    });
    return { success: true as const };
  } catch {
    return { success: false as const };
  }
}
