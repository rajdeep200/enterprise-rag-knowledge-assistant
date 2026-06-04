import { FileText } from "lucide-react";
import type { MessageSource } from "@/lib/types";

export function SourceCard({ source, index }: { source: MessageSource; index: number }) {
  return (
    <div className="rounded-lg border bg-background p-3 text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">{source.documentTitle}</span>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {Math.round(source.score * 100)}% match
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Source {index + 1}
        {source.pageNumber != null ? ` · Page ${source.pageNumber}` : ""}
      </p>
      <p className="mt-2 line-clamp-3 text-xs text-muted-foreground">“{source.snippet}”</p>
    </div>
  );
}
