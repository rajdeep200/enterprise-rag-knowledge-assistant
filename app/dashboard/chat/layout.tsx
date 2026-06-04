import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar />
      <div className="flex h-full flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
