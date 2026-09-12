export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string | Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  messageCount?: number;
}

export interface ConversationWithMessages extends ConversationSummary {
  messages: ChatMessage[];
}

export interface SavedTrip {
  id: string;
  conversationId?: string | null;
  title: string;
  destination?: string | null;
  duration?: string | null;
  summary?: string | null;
  itinerary: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface SuggestedPromptItem {
  id: string;
  title: string;
  prompt: string;
  category: "itinerary" | "budget" | "hidden-gems" | "packing" | "logistics" | "couples";
  iconName?: string;
  previewTag?: string;
}
