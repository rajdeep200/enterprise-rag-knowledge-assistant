import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Prisma Client singleton.
 * In dev, Next.js hot-reload would otherwise create a new client on every reload
 * and exhaust the connection pool, so we cache it on globalThis.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const buildDatabaseUrl = (rawUrl: string) => {
  const desiredLimit = env.PRISMA_CONNECTION_LIMIT;

  try {
    const parsedUrl = new URL(rawUrl);
    const currentLimit = Number(parsedUrl.searchParams.get("connection_limit") ?? 0);

    if (!currentLimit || currentLimit < desiredLimit) {
      parsedUrl.searchParams.set("connection_limit", String(desiredLimit));
    }

    return parsedUrl.toString();
  } catch {
    if (rawUrl.includes("connection_limit=")) {
      return rawUrl.replace(/(connection_limit=)(\d+)/, `$1${desiredLimit}`);
    }

    return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}connection_limit=${desiredLimit}`;
  }
};

const databaseUrl = process.env.DATABASE_URL ? buildDatabaseUrl(process.env.DATABASE_URL) : undefined;

const redactDatabaseUrl = (rawUrl?: string) => {
  if (!rawUrl) return "<missing>";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.password) {
      parsed.password = "*****";
    }
    return parsed.toString();
  } catch {
    return rawUrl.replace(/(postgresql:\/\/[^:]+):[^@]+@/, "$1:*****@");
  }
};

console.info(
  `[prisma] effective DATABASE_URL=${redactDatabaseUrl(databaseUrl)} PRISMA_CONNECTION_LIMIT=${env.PRISMA_CONNECTION_LIMIT}`,
);

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
