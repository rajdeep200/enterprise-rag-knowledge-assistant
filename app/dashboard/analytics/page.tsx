"use client";

import { useQuery } from "@tanstack/react-query";
import {
  MessagesSquare,
  FileText,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { AnalyticsOverviewDTO } from "@/lib/analytics-types";

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.get<AnalyticsOverviewDTO>("/api/analytics/overview"),
  });

  const totalFeedback = data ? data.feedback.helpful + data.feedback.notHelpful : 0;
  const helpfulPct =
    totalFeedback > 0 ? Math.round((data!.feedback.helpful / totalFeedback) * 100) : 0;

  return (
    <div>
      <PageHeader title="Analytics" description="Usage and quality metrics for your workspace." />
      <div className="space-y-6 p-6">
        {isLoading || !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total questions" value={data.totalQuestions} icon={MessagesSquare} />
              <StatCard label="Total documents" value={data.totalDocuments} icon={FileText} />
              <StatCard
                label="Processed"
                value={data.processedDocuments}
                icon={CheckCircle2}
                accent="text-emerald-600"
              />
              <StatCard
                label="Failed"
                value={data.failedDocuments}
                icon={XCircle}
                accent="text-red-600"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Feedback summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalFeedback === 0 ? (
                    <EmptyState
                      icon={ThumbsUp}
                      title="No feedback yet"
                      description="Helpful / not helpful ratings will appear here."
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <ThumbsUp className="h-4 w-4 text-emerald-600" /> Helpful
                        </div>
                        <span className="font-semibold tabular-nums">{data.feedback.helpful}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <ThumbsDown className="h-4 w-4 text-red-600" /> Not helpful
                        </div>
                        <span className="font-semibold tabular-nums">{data.feedback.notHelpful}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full bg-emerald-500" style={{ width: `${helpfulPct}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {helpfulPct}% of {totalFeedback} ratings were helpful
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Most recent questions</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.recentQuestions.length === 0 ? (
                    <EmptyState icon={MessagesSquare} title="No questions yet" />
                  ) : (
                    <ul className="space-y-3">
                      {data.recentQuestions.map((q) => (
                        <li key={q.id} className="border-b pb-2 last:border-0">
                          <p className="text-sm">{q.content}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(q.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
