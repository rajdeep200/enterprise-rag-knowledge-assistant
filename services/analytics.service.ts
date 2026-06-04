import { prisma } from "@/lib/prisma";

export interface AnalyticsOverview {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  processingDocuments: number;
  totalQuestions: number;
  totalSessions: number;
  feedback: { helpful: number; notHelpful: number };
  recentQuestions: Array<{ id: string; content: string; createdAt: Date }>;
  recentDocuments: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: Date;
    uploadedBy: string;
  }>;
}

/**
 * AnalyticsService — every aggregate is scoped to a single companyId.
 */
export const AnalyticsService = {
  async getOverview(companyId: string): Promise<AnalyticsOverview> {
    const [
      totalDocuments,
      processedDocuments,
      failedDocuments,
      processingDocuments,
      totalQuestions,
      totalSessions,
      helpful,
      notHelpful,
      recentQuestions,
      recentDocuments,
    ] = await Promise.all([
      prisma.document.count({ where: { companyId } }),
      prisma.document.count({ where: { companyId, status: "PROCESSED" } }),
      prisma.document.count({ where: { companyId, status: "FAILED" } }),
      prisma.document.count({ where: { companyId, status: "PROCESSING" } }),
      prisma.chatMessage.count({
        where: { role: "USER", session: { companyId } },
      }),
      prisma.chatSession.count({ where: { companyId } }),
      prisma.answerFeedback.count({
        where: { rating: "HELPFUL", user: { companyId } },
      }),
      prisma.answerFeedback.count({
        where: { rating: "NOT_HELPFUL", user: { companyId } },
      }),
      prisma.chatMessage.findMany({
        where: { role: "USER", session: { companyId } },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, content: true, createdAt: true },
      }),
      prisma.document.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          uploadedBy: { select: { name: true } },
        },
      }),
    ]);

    return {
      totalDocuments,
      processedDocuments,
      failedDocuments,
      processingDocuments,
      totalQuestions,
      totalSessions,
      feedback: { helpful, notHelpful },
      recentQuestions,
      recentDocuments: recentDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        createdAt: d.createdAt,
        uploadedBy: d.uploadedBy.name,
      })),
    };
  },
};
