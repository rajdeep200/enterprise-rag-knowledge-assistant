export const dynamic = "force-dynamic";

import { ok, handleRoute } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";

/** GET /api/auth/me — returns the current authenticated user (never the password hash). */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireAuth();
    return ok(user);
  });
}
