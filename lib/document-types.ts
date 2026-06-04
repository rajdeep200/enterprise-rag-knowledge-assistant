/** Client-facing document shape returned by GET /api/documents. */
export interface DocumentDTO {
  id: string;
  title: string;
  fileName: string;
  status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
  size: number;
  totalPages: number | null;
  totalChunks: number;
  errorMessage: string | null;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}
