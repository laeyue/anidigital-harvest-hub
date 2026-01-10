"use client";

import ChatConversation from "@/pages/app/ChatConversation";

export default function ChatConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  return <ChatConversation conversationId={params.conversationId} />;
}

