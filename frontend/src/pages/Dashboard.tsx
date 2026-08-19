import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { ChatIcon, PlusIcon } from "../components/icons";

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversationCount, setConversationCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const firstName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  useEffect(() => {
    let cancelled = false;

    api
      .countConversations()
      .then(({ count }) => {
        if (!cancelled) setConversationCount(count);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load stats");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleStartNewChat() {
    setStarting(true);
    setError(null);
    try {
      const { conversation } = await api.createConversation("New chat");
      navigate(`/chat?conversation=${conversation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start a new chat");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName} 👋</h1>
      <p className="mt-1 text-sm text-gray-500">Here's a quick look at your AskFlow AI activity.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <ChatIcon className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total AI conversations</p>
          </div>
          <p className="mt-4 text-3xl font-bold text-gray-900">
            {conversationCount === null ? "—" : conversationCount}
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <PlusIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Ready for a new conversation?</p>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              Jump straight into a fresh AI chat session.
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartNewChat}
            disabled={starting}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" />
            {starting ? "Starting..." : "Start new chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
