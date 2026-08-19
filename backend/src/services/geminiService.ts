import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

/**
 * Sends the full conversation history to Gemini and returns the assistant's reply.
 * History is mapped to Gemini's "user" / "model" role convention.
 */
export async function generateAssistantReply(history: ChatHistoryItem[]): Promise<string> {
  const contents = history.map((item) => ({
    role: item.role === "assistant" ? "model" : "user",
    parts: [{ text: item.content }],
  }));

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents,
  });

  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}
