import { NextRequest } from "next/server";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileStorageService } from "@/services/file-storage.service";

interface Params {
  params: { id: string };
}

/** GET /api/documents/[id] — single document detail, company-scoped. */
export async function GET(_req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const user = await requireAuth();

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: user.companyId },
      select: {
        id: true,
        title: true,
        fileName: true,
        status: true,
        size: true,
        mimeType: true,
        totalPages: true,
        totalChunks: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!document) throw Errors.notFound("Document");
    return ok(document);
  });
}

/** DELETE /api/documents/[id] — ADMIN-only. Removes record (chunks cascade) + file. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const admin = await requireAdmin();

    const document = await prisma.document.findFirst({
      where: { id: params.id, companyId: admin.companyId },
    });
    if (!document) throw Errors.notFound("Document");

    // Chunks are removed via onDelete: Cascade in the schema.
    await prisma.document.delete({ where: { id: document.id } });
    await FileStorageService.delete(document.filePath);

    return ok({ deleted: true });
  });
}
