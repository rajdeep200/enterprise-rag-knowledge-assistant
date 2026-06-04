export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { enqueueDocumentProcessing } from "@/workers/queue";

interface Params {
  params: { id: string };
}

/**
 * POST /api/documents/[id]/reprocess — ADMIN-only.
 * Re-queues a document for processing (useful for FAILED docs). The worker
 * deletes any existing chunks before re-inserting, so reprocessing is idempotent.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const admin = await requireAdmin();

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: admin.companyId },
    });
    if (!document) throw Errors.notFound("Document");

    if (document.status === "PROCESSING") {
      throw Errors.badRequest("Document is already being processed.");
    }

    await prisma.document.update({
      where: { id: document.id },
      data: { status: "UPLOADED", errorMessage: null },
    });
    await enqueueDocumentProcessing(document.id);

    return ok({ requeued: true });
  });
}
