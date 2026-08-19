import type { Message } from "../../types";

export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
          isUser
            ? "rounded-br-sm bg-brand-600 text-white"
            : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
