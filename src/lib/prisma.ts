import { Prisma, PrismaClient } from "@prisma/client";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1_000;

/** Prisma + Neon cold-start / sleeping DB error codes. */
const CONNECTION_ERROR_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server timed out
  "P1008", // Operations timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database") ||
      message.includes("connection") ||
      message.includes("closed") ||
      message.includes("timeout") ||
      message.includes("econnreset")
    );
  }

  return false;
}

async function withConnectionRetry<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= MAX_ATTEMPTS || !isRetryableConnectionError(error)) {
        throw error;
      }

      console.warn(
        `[prisma] ${label} failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${RETRY_DELAY_MS}ms…`
      );
      await sleep(RETRY_DELAY_MS);
    }
  }

  throw lastError;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return client.$extends({
    name: "connection-retry",
    query: {
      async $allOperations({ model, operation, args, query }) {
        const label = model ? `${model}.${operation}` : operation;
        return withConnectionRetry(() => query(args), label);
      },
    },
  });
}

type PrismaClientExtended = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
