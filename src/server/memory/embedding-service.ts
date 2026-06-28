import { prisma } from "@/lib/prisma";
import { modelRouter } from "@/server/ai/router";
import { GEMINI_EMBED_DIM } from "@/server/ai/providers/gemini";
import type { VectorMemoryHit } from "@/server/agent/types";

const EMBED_CACHE = new Map<string, number[]>();

export async function embedText(text: string): Promise<number[]> {
  const key = text.slice(0, 200);
  const cached = EMBED_CACHE.get(key);
  if (cached) return cached;

  const provider = modelRouter.forExtraction();
  const vector = await provider.embed(text);
  EMBED_CACHE.set(key, vector);
  return vector;
}

export async function indexEmbedding(data: {
  userId: string;
  projectId?: string | null;
  sourceType: string;
  sourceId: string;
  content: string;
}): Promise<void> {
  const trimmed = data.content.trim();
  if (!trimmed) return;

  let embedding: number[];
  try {
    embedding = await embedText(trimmed);
  } catch {
    return;
  }

  const existing = await prisma.embedding.findFirst({
    where: {
      userId: data.userId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
    },
  });

  const record = existing
    ? await prisma.embedding.update({
        where: { id: existing.id },
        data: {
          content: trimmed,
          projectId: data.projectId ?? null,
        },
      })
    : await prisma.embedding.create({
        data: {
          userId: data.userId,
          projectId: data.projectId ?? null,
          sourceType: data.sourceType,
          sourceId: data.sourceId,
          content: trimmed,
        },
      });

  const vectorLiteral = `[${embedding.join(",")}]`;

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "Embedding" SET embedding = $1::vector WHERE id = $2`,
      vectorLiteral,
      record.id
    );
  } catch {
    // pgvector column may not exist yet — row still created for text fallback
  }
}

export async function indexApprovedMemories(userId: string): Promise<number> {
  const memories = await prisma.memory.findMany({
    where: { userId, status: "APPROVED" },
    select: { id: true, content: true, projectId: true },
  });

  let indexed = 0;
  for (const m of memories) {
    await indexEmbedding({
      userId,
      projectId: m.projectId,
      sourceType: "memory",
      sourceId: m.id,
      content: m.content,
    });
    indexed++;
  }
  return indexed;
}

export async function fallbackTextSearch(params: {
  userId: string;
  projectId?: string;
  query: string;
  limit: number;
}): Promise<VectorMemoryHit[]> {
  const terms = params.query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 2)
    .slice(0, 5);

  if (terms.length === 0) return [];

  const memories = await prisma.memory.findMany({
    where: {
      userId: params.userId,
      status: "APPROVED",
      ...(params.projectId
        ? {
            OR: [{ projectId: params.projectId }, { projectId: null }],
          }
        : {}),
    },
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  const scored = memories
    .map((m) => {
      const lower = m.content.toLowerCase();
      const score = terms.reduce(
        (acc, t) => acc + (lower.includes(t) ? 1 : 0),
        0
      );
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit);

  return scored.map(({ m, score }) => ({
    id: m.id,
    sourceType: "memory",
    sourceId: m.id,
    content: m.content,
    similarity: score / terms.length,
  }));
}

export { GEMINI_EMBED_DIM };
