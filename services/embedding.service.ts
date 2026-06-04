import { openai } from "@/lib/openai";
import { env, EMBEDDING_DIMENSIONS } from "@/lib/env";
import { AppError } from "@/lib/api-response";

/**
 * EmbeddingService — wraps OpenAI embeddings and pgvector serialization.
 */
export const EmbeddingService = {
  /** Generate a single embedding vector for a piece of text. */
  async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.generateEmbeddings([text]);
    if (!embedding) throw new AppError("Failed to generate embedding.", 502);
    return embedding;
  },

  /**
   * Generate embeddings for many texts in a single batched request.
   * Order of the returned vectors matches the order of `texts`.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      const response = await openai.embeddings.create({
        model: env.OPENAI_EMBEDDING_MODEL,
        input: texts,
      });
      // The API returns items with an `index`; sort defensively to preserve order.
      return response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    } catch (err) {
      console.error("[EmbeddingService] OpenAI embeddings error:", err);
      throw new AppError("Embedding generation failed (OpenAI API error).", 502);
    }
  },

  /**
   * Serialize a JS number[] into the pgvector text literal: "[0.1,0.2,...]".
   * Used when inserting via raw SQL because Prisma can't bind the vector type directly.
   */
  toVectorLiteral(embedding: number[]): string {
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new AppError(
        `Embedding has ${embedding.length} dims, expected ${EMBEDDING_DIMENSIONS}.`,
        500,
      );
    }
    return `[${embedding.join(",")}]`;
  },
};
