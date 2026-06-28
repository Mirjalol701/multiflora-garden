-- Zyron: pgvector extension + embedding column
-- Run via: npx prisma migrate deploy (or db push + manual SQL on Neon)

CREATE EXTENSION IF NOT EXISTS vector;

-- Prisma creates Embedding table; add vector column if missing
ALTER TABLE "Embedding" ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS embedding_hnsw_idx
  ON "Embedding" USING hnsw (embedding vector_cosine_ops);

-- Semantic search RPC used by vector-search.ts
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(768),
  match_count int DEFAULT 8,
  match_threshold float DEFAULT 0.65,
  filter_user_id text DEFAULT NULL,
  filter_project_id text DEFAULT NULL
)
RETURNS TABLE (
  id text,
  source_type text,
  source_id text,
  content text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    e.id,
    e."sourceType" AS source_type,
    e."sourceId" AS source_id,
    e.content,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM "Embedding" e
  WHERE e.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR e."userId" = filter_user_id)
    AND (
      filter_project_id IS NULL
      OR e."projectId" = filter_project_id
      OR e."projectId" IS NULL
    )
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;
