import { Queue, type ConnectionOptions } from "bullmq";
import IORedis from "ioredis";
import { env } from "@/lib/env";

export const DOCUMENT_QUEUE_NAME = "document-processing";

export interface DocumentJobData {
  documentId: string;
}

/**
 * Shared Redis connection options for BullMQ.
 * `maxRetriesPerRequest: null` is required by BullMQ for blocking commands.
 */
export const redisConnection: ConnectionOptions = {
  // ioredis accepts a URL string; BullMQ also accepts ConnectionOptions.
  // We build an IORedis instance lazily where needed (worker) and pass options here.
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
} as unknown as ConnectionOptions;

/** Factory for a raw ioredis client (used by the worker process). */
export function createRedisClient(): IORedis {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}

// Queue singleton (used by API routes to enqueue processing jobs).
const globalForQueue = globalThis as unknown as { documentQueue?: Queue<DocumentJobData> };

export const documentQueue =
  globalForQueue.documentQueue ??
  new Queue<DocumentJobData>(DOCUMENT_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.documentQueue = documentQueue;
}

/** Enqueue a document for background processing. */
export async function enqueueDocumentProcessing(documentId: string): Promise<void> {
  await documentQueue.add(
    "process-document",
    { documentId },
    { jobId: `doc:${documentId}:${Date.now()}` },
  );
}
