import { prisma } from "@/lib/prisma";
import { embedText, fallbackTextSearch } from "@/server/memory/embedding-service";
import type { VectorMemoryHit } from "@/server/agent/types";

type SearchParams = {
  userId: string;
  projectId?: string;
  query: string;
  limit?: number;
  threshold?: number;
};

export async function searchVectorMemory(
  params: SearchParams
): Promise<VectorMemoryHit[]> {
  const limit = params.limit ?? 8;
  const threshold = params.threshold ?? 0.65;

  try {
    const embedding = await embedText(params.query);
    const vectorLiteral = `[${embedding.join(",")}]`;

    const rows = await prisma.$queryRawUnsafe<
      {
        id: string;
        source_type: string;
        source_id: string;
        content: string;
        similarity: number;
      }[]
    >(
      `SELECT * FROM match_embeddings(
        $1::vector,
        $2::int,
        $3::float,
        $4::text,
        $5::text
      )`,
      vectorLiteral,
      limit,
      threshold,
      params.userId,
      params.projectId ?? null
    );

    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        sourceType: r.source_type,
        sourceId: r.source_id,
        content: r.content,
        similarity: Number(r.similarity),
      }));
    }
  } catch {
    // pgvector not available — fall through to text search
  }

  try {
    return await fallbackTextSearch({
      userId: params.userId,
      projectId: params.projectId,
      query: params.query,
      limit,
    });
  } catch {
    return [];
  }
}
