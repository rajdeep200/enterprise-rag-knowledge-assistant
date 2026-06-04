"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { api } from "@/lib/api-client";
import { cn, formatDateTime } from "@/lib/utils";
import type { ChatSessionListItemDTO } from "@/lib/chat-types";

export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => api.get<ChatSessionListItemDTO[]>("/api/chat/sessions"),
  });

  return (
    <div className="flex w-72 shrink-0 flex-col border-r bg-card">
      <div className="border-b p-3">
        <Button className="w-full" onClick={() => router.push("/dashboard/chat")}>
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4">
            <LoadingSpinner />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No conversations yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {sessions.map((s) => {
              const active = pathname === `/dashboard/chat/${s.id}`;
              return (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/chat/${s.id}`}
                    className={cn(
                      "block rounded-lg px-3 py-2 transition-colors",
                      active ? "bg-primary/10" : "hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span
                        className={cn(
                          "truncate text-sm",
                          active ? "font-medium text-primary" : "text-foreground",
                        )}
                      >
                        {s.title}
                      </span>
                    </div>
                    <p className="mt-0.5 pl-5 text-xs text-muted-foreground">
                      {formatDateTime(s.updatedAt)}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
