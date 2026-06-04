// Import the implementation directly to avoid pdf-parse's index.js debug harness,
// which tries to read a local test PDF when the module is required at the top level.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunking";
import { FileStorageService } from "@/services/file-storage.service";
import { EmbeddingService } from "@/services/embedding.service";

/**
 * DocumentProcessingService — the heavy lifting that runs inside the BullMQ worker.
 *
 * Pipeline: PROCESSING → extract text → chunk → embed → store chunks → PROCESSED.
 * Any failure flips the document to FAILED with a human-readable errorMessage.
 */
export const DocumentProcessingService = {
  async processDocument(documentId: string): Promise<void> {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      throw new Error(`Document ${documentId} not found.`);
    }

    try {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "PROCESSING", errorMessage: null },
      });

      // 1) Read file + extract text
      const buffer = await FileStorageService.read(document.filePath);
      const { text, totalPages } = await extractPdfText(buffer);

      if (!text || text.trim().length === 0) {
        throw new Error("No extractable text found in the PDF (it may be scanned/image-only).");
      }

      // 2) Chunk
      const chunks = chunkText(text);
      if (chunks.length === 0) {
        throw new Error("Document produced no usable text chunks.");
      }

      // 3) Embed (batched) — chunk the batches so very large docs don't hit request limits
      const embeddings = await embedInBatches(chunks, 96);

      // 4) Store chunks (replace any previous chunks for idempotent reprocessing)
      await persistChunks({
        documentId: document.id,
        companyId: document.companyId,
        chunks,
        embeddings,
      });

      // 5) Mark processed
      await prisma.document.update({
        where: { id: documentId },
        data: {
          status: "PROCESSED",
          totalPages,
          totalChunks: chunks.length,
          errorMessage: null,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown processing error.";
      console.error(`[DocumentProcessing] Failed for ${documentId}:`, err);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED", errorMessage: message },
      });
      // Re-throw so BullMQ records the job as failed (and can retry per worker config).
      throw err;
    }
  },
};

async function extractPdfText(buffer: Buffer): Promise<{ text: string; totalPages: number }> {
  try {
    const parsed = await pdfParse(buffer);
    return { text: parsed.text, totalPages: parsed.numpages };
  } catch (err) {
    console.error("[DocumentProcessing] PDF extraction error:", err);
    throw new Error("Failed to extract text from PDF.");
  }
}

async function embedInBatches(chunks: string[], batchSize: number): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const vectors = await EmbeddingService.generateEmbeddings(batch);
    out.push(...vectors);
  }
  return out;
}

/**
 * Delete existing chunks for the document, then insert the new ones with embeddings.
 * Embeddings are written via raw SQL because pgvector's `vector` type can't be bound
 * through the normal Prisma create API.
 */
async function persistChunks(params: {
  documentId: string;
  companyId: string;
  chunks: string[];
  embeddings: number[][];
}): Promise<void> {
  const { documentId, companyId, chunks, embeddings } = params;

  await prisma.$transaction(async (tx) => {
    await tx.documentChunk.deleteMany({ where: { documentId } });

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i]!;
      const vectorLiteral = EmbeddingService.toVectorLiteral(embeddings[i]!);
      await tx.$executeRaw(Prisma.sql`
        INSERT INTO "document_chunks"
          ("id", "documentId", "companyId", "content", "pageNumber", "chunkIndex", "embedding", "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${documentId},
          ${companyId},
          ${content},
          ${null},
          ${i},
          ${vectorLiteral}::vector,
          NOW()
        )
      `);
    }
  });
}
