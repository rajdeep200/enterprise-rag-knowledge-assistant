export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validations";

interface Params {
  params: { messageId: string };
}

/**
 * POST /api/messages/[messageId]/feedback
 * Helpful / Not helpful rating on an assistant message. Upserts so a user can
 * change their mind. Verifies the message belongs to the user's company + session.
 */
export async function POST(req: NextRequest, { params }: Params) {
  return handleRoute(async () => {
    const user = await requireAuth();
    const body = feedbackSchema.parse(await req.json());

    // Ensure the message exists, is an assistant message, and is reachable by this user.
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: params.messageId,
        role: "ASSISTANT",
        session: { companyId: user.companyId, userId: user.id },
      },
      select: { id: true },
    });
    if (!message) throw Errors.notFound("Message");

    const feedback = await prisma.answerFeedback.upsert({
      where: { messageId_userId: { messageId: message.id, userId: user.id } },
      create: {
        messageId: message.id,
        userId: user.id,
        rating: body.rating,
        comment: body.comment,
      },
      update: { rating: body.rating, comment: body.comment },
      select: { id: true, rating: true },
    });

    return ok(feedback, 201);
  });
}
