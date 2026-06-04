import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessageSchema } from "@/lib/validations";
import { RagService } from "@/services/rag.service";
import { truncate } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Params {
  params: { id: string };
}

/**
 * POST /api/chat/sessions/[id]/messages
 * The RAG endpoint: saves the user message, retrieves company-scoped context,
 * generates a grounded answer with citations, saves the assistant message,
 * and returns both messages.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const user = await requireAuth();
    const body = sendMessageSchema.parse(await req.json());

    // Validate the session belongs to this user's company (and this user).
    const session = await prisma.chatSession.findFirst({
      where: { id: params.id, companyId: user.companyId, userId: user.id },
      select: { id: true, title: true, _count: { select: { messages: true } } },
    });
    if (!session) throw Errors.notFound("Chat session");

    // 1) Persist the user message.
    const userMessage = await prisma.chatMessage.create({
      data: { sessionId: session.id, role: "USER", content: body.content },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    // 2) Run retrieval + generation (company-scoped).
    const { answer, sources } = await RagService.answerQuestion(user.companyId, body.content);

    // 3) Persist the assistant message with its citations.
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "ASSISTANT",
        content: answer,
        sources: sources as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, role: true, content: true, sources: true, createdAt: true },
    });

    // 4) Auto-title a brand-new session from its first question; always bump updatedAt.
    await prisma.chatSession.update({
      where: { id: session.id },
      data: {
        updatedAt: new Date(),
        ...(session._count.messages === 0
          ? { title: truncate(body.content, 60) }
          : {}),
      },
    });

    return ok(
      {
        userMessage,
        assistantMessage: {
          ...assistantMessage,
          sources,
          myFeedback: null,
        },
      },
      201,
    );
  });
}
