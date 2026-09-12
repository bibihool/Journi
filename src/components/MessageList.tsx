"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types/chat";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onOpenMap: (destination: string) => void;
  conversationId?: string;
  conversationTitle?: string;
}

export function MessageList({
  messages,
  isStreaming,
  onOpenMap,
  conversationId,
  conversationTitle,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll smoothly to bottom when streaming or new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 w-full overflow-y-auto py-4 space-y-2">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        return (
          <MessageItem
            key={message.id || index}
            message={message}
            isStreaming={isStreaming && isLastMessage && message.role === "assistant"}
            onOpenMap={onOpenMap}
            conversationId={conversationId}
            conversationTitle={conversationTitle}
          />
        );
      })}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}
