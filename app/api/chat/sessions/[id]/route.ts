import { NextRequest } from "next/server";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MessageSource } from "@/lib/types";

interface Params {
  params: { id: string };
}

/**
 * GET /api/chat/sessions/[id] — a session with its full message history.
 * Scoped to the caller's company AND user id.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const user = await requireAuth();

    const session = await prisma.chatSession.findFirst({
      where: { id: params.id, companyId: user.companyId, userId: user.id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            content: true,
            sources: true,
            createdAt: true,
            feedback: {
              where: { userId: user.id },
              select: { rating: true },
            },
          },
        },
      },
    });

    if (!session) throw Errors.notFound("Chat session");

    return ok({
      ...session,
      messages: session.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: (m.sources as unknown as MessageSource[] | null) ?? [],
        createdAt: m.createdAt,
        myFeedback: m.feedback[0]?.rating ?? null,
      })),
    });
  });
}

/** DELETE /api/chat/sessions/[id] — delete one of the caller's own sessions. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const user = await requireAuth();

    const session = await prisma.chatSession.findFirst({
      where: { id: params.id, companyId: user.companyId, userId: user.id },
    });
    if (!session) throw Errors.notFound("Chat session");

    await prisma.chatSession.delete({ where: { id: session.id } });
    return ok({ deleted: true });
  });
}
