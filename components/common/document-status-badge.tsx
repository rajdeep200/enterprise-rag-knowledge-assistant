import { Badge } from "@/components/ui/badge";

type Status = "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED";

const map: Record<Status, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  UPLOADED: { label: "Queued", variant: "secondary" },
  PROCESSING: { label: "Processing", variant: "warning" },
  PROCESSED: { label: "Processed", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

export function DocumentStatusBadge({ status }: { status: Status }) {
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
