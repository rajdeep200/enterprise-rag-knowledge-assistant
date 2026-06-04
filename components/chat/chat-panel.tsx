"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SendHorizonal, Bot, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ChatMessageBubble } from "@/components/chat/chat-message-bubble";
import { EmptyState } from "@/components/common/empty-state";
import { api, ApiClientError } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import type {
  ChatMessageDTO,
  ChatSessionDetailDTO,
  SendMessageResponse,
} from "@/lib/chat-types";

const SUGGESTIONS = [
  "Do I need approval for 4 days leave?",
  "What are the onboarding steps for new employees?",
  "How should support handle failed payments?",
  "What is the API rate limit?",
];

export function ChatPanel({ initialSessionId }: { initialSessionId: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [sessionId, setSessionId] = React.useState<string | null>(initialSessionId);
  const [messages, setMessages] = React.useState<ChatMessageDTO[]>([]);
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Load history when viewing an existing session.
  const { data: session } = useQuery({
    queryKey: ["chat-session", initialSessionId],
    queryFn: () => api.get<ChatSessionDetailDTO>(`/api/chat/sessions/${initialSessionId}`),
    enabled: !!initialSessionId,
  });

  React.useEffect(() => {
    if (session) setMessages(session.messages);
  }, [session]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");

    // Optimistic user bubble.
    const optimistic: ChatMessageDTO = {
      id: `tmp-${Date.now()}`,
      role: "USER",
      content,
      sources: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      // Create a session on the first message of a brand-new chat.
      let activeId = sessionId;
      let createdNew = false;
      if (!activeId) {
        const created = await api.post<{ id: string }>("/api/chat/sessions", {});
        activeId = created.id;
        setSessionId(activeId);
        createdNew = true;
      }

      const res = await api.post<SendMessageResponse>(
        `/api/chat/sessions/${activeId}/messages`,
        { content },
      );

      // Replace optimistic user message with the persisted pair.
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        res.userMessage,
        res.assistantMessage,
      ]);

      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["analytics-overview"] });

      // Reflect the new session in the URL without a full reload.
      if (createdNew && activeId) {
        window.history.replaceState(null, "", `/dashboard/chat/${activeId}`);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
      toast({
        variant: "destructive",
        title: "Message failed",
        description: err instanceof ApiClientError ? err.message : "Please try again.",
      });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 p-6">
          {messages.length === 0 && !sending ? (
            <div className="pt-10">
              <EmptyState
                icon={Sparkles}
                title="Ask your company knowledge base"
                description="Answers are generated only from your uploaded documents, with source citations."
              />
              <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-lg border bg-card px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <ChatMessageBubble key={m.id} message={m} />)
          )}

          {sending && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching documents…
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about your documents…"
            rows={1}
            className="max-h-40 min-h-[44px] resize-none"
          />
          <Button
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={!input.trim() || sending}
            onClick={() => void send(input)}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
