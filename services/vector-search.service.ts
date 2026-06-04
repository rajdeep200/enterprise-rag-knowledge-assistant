import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { EmbeddingService } from "@/services/embedding.service";
import type { RetrievedChunk } from "@/lib/types";

/**
 * VectorSearchService — pgvector cosine similarity search, strictly company-scoped.
 *
 * pgvector exposes `<=>` as cosine DISTANCE (0 = identical, 2 = opposite).
 * We convert to a 0..1 similarity with `1 - distance` for display/thresholds.
 */
export const VectorSearchService = {
  /**
   * Find the chunks most similar to `query` within a single company.
   * Multi-tenant safety: companyId is bound into the WHERE clause — Company A can
   * never retrieve Company B's chunks.
   */
  async searchSimilarChunks(
    companyId: string,
    query: string,
    limit = 5,
  ): Promise<RetrievedChunk[]> {
    const queryEmbedding = await EmbeddingService.generateEmbedding(query);
    const vectorLiteral = EmbeddingService.toVectorLiteral(queryEmbedding);

    // Raw query: Prisma can't express the `<=>` operator or the vector cast.
    // Parameters are bound (not string-concatenated) to prevent SQL injection.
    const rows = await prisma.$queryRaw<
      Array<{
        chunkId: string;
        documentId: string;
        documentTitle: string;
        content: string;
        pageNumber: number | null;
        chunkIndex: number;
        distance: number;
      }>
    >(Prisma.sql`
      SELECT
        c."id"            AS "chunkId",
        c."documentId"    AS "documentId",
        d."title"         AS "documentTitle",
        c."content"       AS "content",
        c."pageNumber"    AS "pageNumber",
        c."chunkIndex"    AS "chunkIndex",
        (c."embedding" <=> ${vectorLiteral}::vector) AS "distance"
      FROM "document_chunks" c
      JOIN "documents" d ON d."id" = c."documentId"
      WHERE c."companyId" = ${companyId}
        AND d."status" = 'PROCESSED'
        AND c."embedding" IS NOT NULL
      ORDER BY c."embedding" <=> ${vectorLiteral}::vector
      LIMIT ${limit}
    `);

    return rows.map((r) => ({
      chunkId: r.chunkId,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      content: r.content,
      pageNumber: r.pageNumber,
      chunkIndex: r.chunkIndex,
      similarity: Number((1 - r.distance).toFixed(4)),
    }));
  },
};
