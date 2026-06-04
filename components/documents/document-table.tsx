"use client";

import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/common/document-status-badge";
import { useToast } from "@/components/ui/use-toast";
import { api, ApiClientError } from "@/lib/api-client";
import { formatBytes, formatDate } from "@/lib/utils";
import type { DocumentDTO } from "@/lib/document-types";

export function DocumentTable({
  documents,
  isAdmin,
}: {
  documents: DocumentDTO[];
  isAdmin: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
    await queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });
  }

  async function reprocess(id: string) {
    try {
      await api.post(`/api/documents/${id}/reprocess`);
      toast({ title: "Reprocessing", description: "The document was re-queued." });
      await refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not reprocess",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
      });
    }
  }

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This also removes its chunks and embeddings.`)) return;
    try {
      await api.delete(`/api/documents/${id}`);
      toast({ title: "Deleted", description: `"${title}" was removed.` });
      await refresh();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Could not delete",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Uploaded by</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Chunks</TableHead>
            <TableHead className="text-right">Size</TableHead>
            {isAdmin && <TableHead className="w-12" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell>
                <div className="font-medium">{doc.title}</div>
                {doc.status === "FAILED" && doc.errorMessage && (
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {doc.errorMessage}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DocumentStatusBadge status={doc.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{doc.uploadedBy.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(doc.createdAt)}
              </TableCell>
              <TableCell className="text-right tabular-nums">{doc.totalChunks}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">
                {formatBytes(doc.size)}
              </TableCell>
              {isAdmin && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => reprocess(doc.id)}>
                        <RefreshCw className="h-4 w-4" /> Reprocess
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => remove(doc.id, doc.title)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
