import { ChatInterface } from "@/features/chat/ChatInterface";

export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="relative flex h-[calc(100vh-8rem)] flex-col">
      <ChatInterface projectId={params.id} />
    </div>
  );
}
