"use client";

import * as React from "react";
import { Bot, User, ThumbsUp, ThumbsDown } from "lucide-react";
import { SourceCard } from "@/components/chat/source-card";
import { cn } from "@/lib/utils";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import type { ChatMessageDTO, FeedbackRating } from "@/lib/chat-types";

export function ChatMessageBubble({ message }: { message: ChatMessageDTO }) {
  const isUser = message.role === "USER";
  const { toast } = useToast();
  const [feedback, setFeedback] = React.useState<FeedbackRating | null>(message.myFeedback ?? null);
  const [submitting, setSubmitting] = React.useState(false);

  async function sendFeedback(rating: FeedbackRating) {
    setSubmitting(true);
    const previous = feedback;
    setFeedback(rating); // optimistic
    try {
      await api.post(`/api/messages/${message.id}/feedback`, { rating });
    } catch (err) {
      setFeedback(previous);
      toast({
        variant: "destructive",
        title: "Couldn't save feedback",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("max-w-[80%] space-y-3", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground"
              : "border bg-card text-card-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Source citations (assistant only) */}
        {!isUser && message.sources.length > 0 && (
          <div className="w-full space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sources</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.sources.map((s, i) => (
                <SourceCard key={`${s.documentId}-${s.chunkIndex}`} source={s} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Feedback (assistant only) */}
        {!isUser && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Was this helpful?</span>
            <button
              disabled={submitting}
              onClick={() => sendFeedback("HELPFUL")}
              className={cn(
                "rounded-md border p-1.5 transition-colors hover:bg-muted",
                feedback === "HELPFUL" && "border-emerald-300 bg-emerald-50 text-emerald-600",
              )}
              aria-label="Helpful"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={submitting}
              onClick={() => sendFeedback("NOT_HELPFUL")}
              className={cn(
                "rounded-md border p-1.5 transition-colors hover:bg-muted",
                feedback === "NOT_HELPFUL" && "border-red-300 bg-red-50 text-red-600",
              )}
              aria-label="Not helpful"
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
