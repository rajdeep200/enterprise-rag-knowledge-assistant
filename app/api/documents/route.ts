export const dynamic = "force-dynamic";

import { ok, handleRoute } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/documents
 * Lists documents for the caller's company only (multi-tenant scoped).
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireAuth();

    const documents = await prisma.document.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        fileName: true,
        status: true,
        size: true,
        totalPages: true,
        totalChunks: true,
        errorMessage: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return ok(documents);
  });
}
