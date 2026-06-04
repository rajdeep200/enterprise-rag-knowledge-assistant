import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { FileStorageService } from "@/services/file-storage.service";
import { enqueueDocumentProcessing } from "@/workers/queue";
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from "@/lib/validations";

export const runtime = "nodejs";

/**
 * POST /api/documents/upload  (multipart/form-data, field "file")
 * ADMIN-only. Validates the file, stores it, creates the Document record,
 * and enqueues a background processing job.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const admin = await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw Errors.badRequest("No file provided. Attach a PDF under the 'file' field.");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw Errors.badRequest("Invalid file type. Only PDF files are supported.");
    }
    if (file.size === 0) {
      throw Errors.badRequest("The uploaded file is empty.");
    }
    if (file.size > MAX_FILE_SIZE) {
      throw Errors.badRequest("File is too large. Maximum size is 20 MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { filePath } = await FileStorageService.save({
      companyId: admin.companyId,
      originalName: file.name,
      buffer,
    });

    const title = file.name.replace(/\.[^.]+$/, "");

    const document = await prisma.document.create({
      data: {
        companyId: admin.companyId,
        uploadedById: admin.id,
        title,
        fileName: file.name,
        filePath,
        mimeType: file.type,
        size: file.size,
        status: "UPLOADED",
      },
    });

    await enqueueDocumentProcessing(document.id);

    return ok(
      {
        id: document.id,
        title: document.title,
        status: document.status,
      },
      201,
    );
  });
}
