/** A retrieved chunk + similarity, as returned by the vector search service. */
export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber: number | null;
  chunkIndex: number;
  similarity: number; // 0..1 (cosine similarity)
}

/** Citation stored on an assistant message and rendered as a source card. */
export interface MessageSource {
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  chunkIndex: number;
  snippet: string;
  score: number;
}

/** Public-safe user shape sent to the client. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  companyId: string;
  companyName: string;
}
