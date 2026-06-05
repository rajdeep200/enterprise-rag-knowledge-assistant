import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client singleton.
 * In dev, Next.js hot-reload would otherwise create a new client on every reload
 * and exhaust the connection pool, so we cache it on globalThis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const DEFAULT_PRISMA_CONNECTION_LIMIT = 10;
const databaseUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.includes("connection_limit=")
    ? process.env.DATABASE_URL
    : `${process.env.DATABASE_URL}${process.env.DATABASE_URL.includes("?") ? "&" : "?"}connection_limit=${process.env.PRISMA_CONNECTION_LIMIT ?? DEFAULT_PRISMA_CONNECTION_LIMIT}`
  : undefined;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
