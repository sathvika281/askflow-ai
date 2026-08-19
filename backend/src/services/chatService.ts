import { supabaseAdmin } from "../lib/supabase";
import { HttpError } from "../middleware/errorHandler";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new HttpError(500, `Failed to list conversations: ${error.message}`);
  return data ?? [];
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("*")
    .single();

  if (error) throw new HttpError(500, `Failed to create conversation: ${error.message}`);
  return data;
}

export async function getConversation(userId: string, conversationId: string): Promise<Conversation> {
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new HttpError(404, "Conversation not found");
  return data;
}

export async function listMessages(userId: string, conversationId: string): Promise<Message[]> {
  await getConversation(userId, conversationId);

  const { data, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw new HttpError(500, `Failed to list messages: ${error.message}`);
  return data ?? [];
}

export async function addMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({ conversation_id: conversationId, role, content })
    .select("*")
    .single();

  if (error) throw new HttpError(500, `Failed to save message: ${error.message}`);
  return data;
}

export async function touchConversation(conversationId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) throw new HttpError(500, `Failed to update conversation: ${error.message}`);
}

export async function deleteConversation(userId: string, conversationId: string): Promise<void> {
  await getConversation(userId, conversationId);

  const { error } = await supabaseAdmin.from("conversations").delete().eq("id", conversationId);

  if (error) throw new HttpError(500, `Failed to delete conversation: ${error.message}`);
}

export async function countConversations(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) throw new HttpError(500, `Failed to count conversations: ${error.message}`);
  return count ?? 0;
}
