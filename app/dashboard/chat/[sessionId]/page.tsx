import { ChatPanel } from "@/components/chat/chat-panel";

/** Existing chat session detail — loads message history and continues the conversation. */
export default function ChatSessionPage({ params }: { params: { sessionId: string } }) {
  // `key` forces a fresh ChatPanel (and history fetch) when switching sessions.
  return <ChatPanel key={params.sessionId} initialSessionId={params.sessionId} />;
}
