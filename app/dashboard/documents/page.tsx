"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DocumentTable } from "@/components/documents/document-table";
import { UploadDropzone } from "@/components/documents/upload-dropzone";
import { EmptyState } from "@/components/common/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@/lib/api-client";
import type { DocumentDTO } from "@/lib/document-types";

export default function DocumentsPage() {
  const { data: user } = useCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: () => api.get<DocumentDTO[]>("/api/documents"),
    // Poll while anything is still processing so statuses update live.
    refetchInterval: (query) =>
      query.state.data?.some((d) => d.status === "PROCESSING" || d.status === "UPLOADED")
        ? 4000
        : false,
  });

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload and manage the documents in your knowledge base."
        action={isAdmin ? <UploadDropzone /> : undefined}
      />
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : !documents || documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description={
              isAdmin
                ? "Upload your first PDF to start building your knowledge base."
                : "An admin hasn't uploaded any documents yet."
            }
            action={isAdmin ? <UploadDropzone /> : undefined}
          />
        ) : (
          <DocumentTable documents={documents} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
