import { ok, handleRoute } from "@/lib/api-response";
import { requireAuth } from "@/lib/auth";
import { AnalyticsService } from "@/services/analytics.service";

/** GET /api/analytics/overview — company-scoped dashboard/analytics metrics. */
export async function GET() {
  return handleRoute(async () => {
    const user = await requireAuth();
    const overview = await AnalyticsService.getOverview(user.companyId);
    return ok(overview);
  });
}
