import type { MessageSource } from "@/lib/types";

export type FeedbackRating = "HELPFUL" | "NOT_HELPFUL";

export interface ChatMessageDTO {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources: MessageSource[];
  createdAt: string;
  myFeedback?: FeedbackRating | null;
}

export interface ChatSessionDetailDTO {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageDTO[];
}

export interface ChatSessionListItemDTO {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export interface SendMessageResponse {
  userMessage: ChatMessageDTO;
  assistantMessage: ChatMessageDTO;
}
