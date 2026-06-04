import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleRoute, AppError } from "@/lib/api-response";
import { verifyPassword, signToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

/**
 * POST /api/auth/login
 * Verifies credentials and sets the HTTP-only session cookie.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        passwordHash: true,
        company: { select: { name: true } },
      },
    });

    // Use a single generic message so we don't reveal whether the email exists.
    const invalid = new AppError("Invalid email or password.", 401);
    if (!user) throw invalid;

    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw invalid;

    const token = await signToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
    });
  });
}
