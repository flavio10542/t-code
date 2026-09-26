export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface LlmResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}
