import { openai } from "@/lib/openai";
import { env } from "@/lib/env";
import { AppError } from "@/lib/api-response";
import { truncate } from "@/lib/utils";
import { VectorSearchService } from "@/services/vector-search.service";
import type { MessageSource, RetrievedChunk } from "@/lib/types";

const SYSTEM_PROMPT = `You are an internal company knowledge assistant.
Answer the user's question only using the provided context.
If the answer is not available in the context, say:
'I could not find this information in the uploaded company documents.'
Do not guess.
Do not use outside knowledge.
Always include source references when available.
Keep answers clear and concise.`;

export const NO_ANSWER_MESSAGE =
  "I could not find this information in the uploaded company documents.";

// Below this cosine similarity we treat retrieval as "no relevant context found".
const MIN_SIMILARITY = 0.2;

export interface RagResult {
  answer: string;
  sources: MessageSource[];
}

/**
 * RagService — retrieval-augmented generation, company-scoped end to end.
 */
export const RagService = {
  async answerQuestion(companyId: string, question: string): Promise<RagResult> {
    // 1) Retrieve top relevant chunks for THIS company only.
    const chunks = await VectorSearchService.searchSimilarChunks(companyId, question, 5);
    const relevant = chunks.filter((c) => c.similarity >= MIN_SIMILARITY);

    // 2) No usable context → return the canonical "not found" answer (no LLM call,
    //    so the model can never hallucinate an answer or fabricate citations).
    if (relevant.length === 0) {
      return { answer: NO_ANSWER_MESSAGE, sources: [] };
    }

    // 3) Build the context block in the required "Source N" format.
    const context = buildContext(relevant);

    // 4) Call the chat model.
    let answer: string;
    try {
      const completion = await openai.chat.completions.create({
        model: env.OPENAI_CHAT_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Context from company documents:\n\n${context}\n\nQuestion: ${question}`,
          },
        ],
      });
      answer =
        completion.choices[0]?.message?.content?.trim() || NO_ANSWER_MESSAGE;
    } catch (err) {
      console.error("[RagService] OpenAI chat error:", err);
      throw new AppError("The AI service is temporarily unavailable. Please try again.", 502);
    }

    // 5) Citations come ONLY from retrieved chunks — never invented by the model.
    const sources: MessageSource[] = relevant.map((c) => toSource(c));

    return { answer, sources };
  },
};

function buildContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((c, i) => {
      const pageLine = c.pageNumber != null ? `Page: ${c.pageNumber}\n` : "";
      return `Source ${i + 1}:\nDocument: ${c.documentTitle}\n${pageLine}Content: ${c.content}`;
    })
    .join("\n\n");
}

function toSource(c: RetrievedChunk): MessageSource {
  return {
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    pageNumber: c.pageNumber,
    chunkIndex: c.chunkIndex,
    snippet: truncate(c.content, 240),
    score: c.similarity,
  };
}
