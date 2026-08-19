import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { Message } from "../types";
import { MessageBubble } from "../components/chat/MessageBubble";
import { TypingIndicator } from "../components/chat/TypingIndicator";
import { ChatInput } from "../components/chat/ChatInput";
import { ChatIcon, PlusIcon } from "../components/icons";

export function Chatbot() {
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get("conversation");

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setLoadingHistory(true);
    setError(null);

    api
      .listMessages(conversationId)
      .then(({ messages }) => {
        if (!cancelled) {
          setMessages(messages);
          scrollToBottom();
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load conversation");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, scrollToBottom]);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const { conversation } = await api.createConversation("New chat");
    setSearchParams({ conversation: conversation.id });
    return conversation.id;
  }

  async function handleSend(content: string) {
    setError(null);
    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId ?? "",
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);
    scrollToBottom();
    setSending(true);

    try {
      const id = await ensureConversation();
      const { userMessage, assistantMessage } = await api.sendMessage(id, content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        userMessage,
        assistantMessage,
      ]);
      scrollToBottom();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
      setError(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleNewChat() {
    setSearchParams({});
    setMessages([]);
    setError(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <ChatIcon className="h-5 w-5 text-brand-600" />
          <h1 className="text-base font-semibold text-gray-900">AI Chatbot</h1>
        </div>
        <button
          type="button"
          onClick={handleNewChat}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <PlusIcon className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
            <ChatIcon className="mb-3 h-10 w-10" />
            <p className="text-sm">Start the conversation by sending a message below.</p>
          </div>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}

        {sending && <TypingIndicator />}
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 sm:mx-6">
          {error}
        </div>
      )}

      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
