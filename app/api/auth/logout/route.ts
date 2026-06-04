export const dynamic = "force-dynamic";

import { ok, handleRoute } from "@/lib/api-response";
import { clearAuthCookie } from "@/lib/auth";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  return handleRoute(async () => {
    clearAuthCookie();
    return ok({ loggedOut: true });
  });
}
