import { supabase } from "./supabaseClient";
import type { Conversation, Message } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new ApiError(401, "Not authenticated");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: response.statusText }));
    throw new ApiError(response.status, body.error ?? "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  listConversations: () => request<{ conversations: Conversation[] }>("/api/conversations"),

  countConversations: () => request<{ count: number }>("/api/conversations/count"),

  createConversation: (title?: string) =>
    request<{ conversation: Conversation }>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  deleteConversation: (id: string) =>
    request<void>(`/api/conversations/${id}`, { method: "DELETE" }),

  listMessages: (conversationId: string) =>
    request<{ messages: Message[] }>(`/api/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    request<{ userMessage: Message; assistantMessage: Message }>(
      `/api/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    ),
};

export { ApiError };
