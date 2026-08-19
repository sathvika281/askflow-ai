import { Router } from "express";
import { z } from "zod";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";
import { generateAssistantReply } from "../services/geminiService";
import {
  addMessage,
  countConversations,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  listMessages,
  touchConversation,
} from "../services/chatService";

export const chatRouter = Router();

chatRouter.use(requireAuth);

const createConversationSchema = z.object({
  title: z.string().trim().min(1).max(200).default("New chat"),
});

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty").max(8000),
});

// GET /api/conversations — list the current user's conversations
chatRouter.get("/conversations", async (req: AuthenticatedRequest, res, next) => {
  try {
    const conversations = await listConversations(req.userId!);
    res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/count — total conversation count (for dashboard card)
chatRouter.get("/conversations/count", async (req: AuthenticatedRequest, res, next) => {
  try {
    const count = await countConversations(req.userId!);
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations — start a new chat
chatRouter.post("/conversations", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title } = createConversationSchema.parse(req.body ?? {});
    const conversation = await createConversation(req.userId!, title);
    res.status(201).json({ conversation });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:id/messages — full history for a conversation
chatRouter.get("/conversations/:id/messages", async (req: AuthenticatedRequest, res, next) => {
  try {
    const messages = await listMessages(req.userId!, req.params.id);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/conversations/:id
chatRouter.delete("/conversations/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    await deleteConversation(req.userId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:id/messages — send a message and get the AI reply
chatRouter.post("/conversations/:id/messages", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { content } = sendMessageSchema.parse(req.body);
    const conversationId = req.params.id;

    // Ensures the conversation belongs to this user (throws 404 otherwise)
    await getConversation(req.userId!, conversationId);

    const userMessage = await addMessage(conversationId, "user", content);

    const history = await listMessages(req.userId!, conversationId);
    const replyText = await generateAssistantReply(
      history.map((m) => ({ role: m.role, content: m.content }))
    );

    const assistantMessage = await addMessage(conversationId, "assistant", replyText);
    await touchConversation(conversationId);

    res.status(201).json({ userMessage, assistantMessage });
  } catch (err) {
    next(err);
  }
});
