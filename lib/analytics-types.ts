/** Client-facing shape of the analytics overview (dates arrive as ISO strings over JSON). */
export interface AnalyticsOverviewDTO {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  processingDocuments: number;
  totalQuestions: number;
  totalSessions: number;
  feedback: { helpful: number; notHelpful: number };
  recentQuestions: Array<{ id: string; content: string; createdAt: string }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";
    createdAt: string;
    uploadedBy: string;
  }>;
}
