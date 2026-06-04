import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleRoute, Errors } from "@/lib/api-response";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { registerSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

/**
 * POST /api/auth/register
 * Creates a new company workspace + its first ADMIN user, then logs them in.
 */
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = registerSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw Errors.badRequest("An account with that email already exists.");

    const passwordHash = await hashPassword(body.password);

    // Ensure a unique slug for the new company workspace.
    const baseSlug = slugify(body.companyName) || "workspace";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${n++}`;
    }

    // The first user of a workspace becomes its ADMIN.
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: "ADMIN",
        company: { create: { name: body.companyName, slug } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        company: { select: { name: true } },
      },
    });

    const token = await signToken({
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
    });
    await setAuthCookie(token);

    return ok(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
      },
      201,
    );
  });
}
