import { NextRequest } from "next/server";
import { ok, handleRoute } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSessionSchema } from "@/lib/validations";

/**
 * GET /api/chat/sessions — the caller's own chat sessions within their company.
 */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireAuth();

    const sessions = await prisma.chatSession.findMany({
      where: { companyId: user.companyId, userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return ok(sessions);
  });
}

/**
 * POST /api/chat/sessions — create a new (empty) chat session.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const user = await requireAuth();
    const body = createSessionSchema.parse(await req.json().catch(() => ({})));

    const session = await prisma.chatSession.create({
      data: {
        companyId: user.companyId,
        userId: user.id,
        title: body.title ?? "New chat",
      },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });

    return ok(session, 201);
  });
}
