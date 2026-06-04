/**
 * Standalone BullMQ worker process.
 * Run with: `npm run worker` (dev, watch) or `npm run worker:prod`.
 *
 * It consumes jobs from the document-processing queue and runs the full
 * extract → chunk → embed → store pipeline via DocumentProcessingService.
 */
import "dotenv/config"; // load .env before any module reads process.env
import { Worker, type Job } from "bullmq";
import {
  DOCUMENT_QUEUE_NAME,
  createRedisClient,
  type DocumentJobData,
} from "@/workers/queue";
import { DocumentProcessingService } from "@/services/document-processing.service";

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 2);

const worker = new Worker<DocumentJobData>(
  DOCUMENT_QUEUE_NAME,
  async (job: Job<DocumentJobData>) => {
    const { documentId } = job.data;
    console.log(`[worker] Processing document ${documentId} (job ${job.id})`);
    await DocumentProcessingService.processDocument(documentId);
    console.log(`[worker] Finished document ${documentId}`);
  },
  {
    connection: createRedisClient(),
    concurrency,
  },
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

console.log(
  `[worker] Document processing worker started (concurrency=${concurrency}). Waiting for jobs…`,
);

// Graceful shutdown
async function shutdown() {
  console.log("[worker] Shutting down…");
  await worker.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
