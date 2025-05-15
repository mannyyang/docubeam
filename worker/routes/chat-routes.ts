import { Context, Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ChatService } from "../services/chat-service";
import { formatSuccessResponse, formatErrorResponse } from "../utils";
import { API_ROUTES } from "../config";
import { sendMessageSchema } from "../schemas";

// Create a new Hono app for chat routes
const chatRoutes = new Hono();

/**
 * Send a chat message
 * POST /api/chat/message
 */
chatRoutes.post(
  API_ROUTES.CHAT.SEND_MESSAGE, 
  zValidator("json", sendMessageSchema), 
  async (c: Context<{ Bindings: Env }>) => {
    try {
      // In a real app, this would come from auth
      const userId = "user-123";
      const tenantId = "default-tenant";
      
      // Get the request body
      const body = await c.req.json();
      
      // Create the chat request
      const chatRequest = {
        documentId: body.documentId,
        message: body.message,
        conversationId: body.conversationId,
      };
      
      // Send the message
      const result = await ChatService.sendMessage(
        chatRequest,
        userId,
        tenantId,
        c.env
      );
      
      return c.json(formatSuccessResponse(result));
    } catch (error: unknown) {
      console.error("Chat message error:", error);
      
      if (error instanceof Error) {
        return c.json(formatErrorResponse(error.message), 500);
      }
      
      return c.json(formatErrorResponse("Failed to send message"), 500);
    }
  }
);

/**
 * Get conversations
 * GET /api/chat/conversations
 */
chatRoutes.get(API_ROUTES.CHAT.GET_CONVERSATIONS, async (c: Context<{ Bindings: Env }>) => {
  try {
    // In a real app, this would come from auth
    const userId = "user-123";
    const tenantId = "default-tenant";
    
    // Get the document ID from the query params (optional)
    const documentId = c.req.query("documentId");
    
    // Get the conversations
    const conversations = await ChatService.getConversations(
      userId,
      tenantId,
      c.env,
      documentId
    );
    
    return c.json(formatSuccessResponse(conversations));
  } catch (error: unknown) {
    console.error("Get conversations error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to get conversations"), 500);
  }
});

/**
 * Get messages for a conversation
 * GET /api/chat/messages/:conversationId
 */
chatRoutes.get(API_ROUTES.CHAT.GET_MESSAGES, async (c: Context<{ Bindings: Env }>) => {
  try {
    // In a real app, this would come from auth
    const userId = "user-123";
    
    // Get the conversation ID from the params
    const conversationId = c.req.param("conversationId");
    
    if (!conversationId) {
      return c.json(formatErrorResponse("Conversation ID is required"), 400);
    }
    
    // Get the messages
    const messages = await ChatService.getMessages(
      conversationId,
      userId,
      c.env
    );
    
    return c.json(formatSuccessResponse(messages));
  } catch (error: unknown) {
    console.error("Get messages error:", error);
    
    if (error instanceof Error) {
      if (error.name === "NotFoundError") {
        return c.json(formatErrorResponse(error.message), 404);
      }
      
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to get messages"), 500);
  }
});

export default chatRoutes;
