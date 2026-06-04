import { ChatPanel } from "@/components/chat/chat-panel";

/** New chat. A session is created automatically when the first message is sent. */
export default function NewChatPage() {
  return <ChatPanel initialSessionId={null} />;
}
