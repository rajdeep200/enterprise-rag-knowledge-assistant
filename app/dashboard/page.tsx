"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  CheckCircle2,
  XCircle,
  MessagesSquare,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentStatusBadge } from "@/components/common/document-status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { api } from "@/lib/api-client";
import { formatDateTime, truncate } from "@/lib/utils";
import type { AnalyticsOverviewDTO } from "@/lib/analytics-types";

export default function DashboardOverviewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.get<AnalyticsOverviewDTO>("/api/analytics/overview"),
  });

  return (
    <div>
      <PageHeader title="Overview" description="A snapshot of your knowledge base and usage." />
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
              <StatCard
                label="Questions asked"
                value={data.totalQuestions}
                icon={MessagesSquare}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent questions</CardTitle>
                  <Link
                    href="/dashboard/chat"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Open chat <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.recentQuestions.length === 0 ? (
                    <EmptyState
                      icon={MessagesSquare}
                      title="No questions yet"
                      description="Ask your first question in the chat."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {data.recentQuestions.map((q) => (
                        <li key={q.id} className="flex items-start gap-3">
                          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm">{truncate(q.content, 90)}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDateTime(q.createdAt)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">Recent documents</CardTitle>
                  <Link
                    href="/dashboard/documents"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View all <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.recentDocuments.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No documents yet"
                      description="Upload a PDF to build your knowledge base."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {data.recentDocuments.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{d.title}</p>
                            <p className="text-xs text-muted-foreground">
                              by {d.uploadedBy} · {formatDateTime(d.createdAt)}
                            </p>
                          </div>
                          <DocumentStatusBadge status={d.status} />
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
