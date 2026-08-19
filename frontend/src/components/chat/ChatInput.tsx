import { FormEvent, KeyboardEvent, useState } from "react";
import { SendIcon } from "../icons";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  function submit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2 border-t border-gray-200 bg-white p-3 sm:p-4">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message AskFlow AI..."
        rows={1}
        disabled={disabled}
        className="max-h-40 min-h-[44px] flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-gray-50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Send message"
      >
        <SendIcon className="h-5 w-5" />
      </button>
    </form>
  );
}
