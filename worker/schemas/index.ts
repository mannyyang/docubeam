import { z } from "zod";

/**
 * Waitlist schemas
 */
export const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const waitlistResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * Document schemas
 */
export const uploadDocumentSchema = z.object({
  // @ts-ignore - File object validation handled in route handler
  file: z.unknown(), // This will be validated in the route handler
});

export const getDocumentSchema = z.object({
  id: z.string().uuid("Invalid document ID"),
});

export const deleteDocumentSchema = z.object({
  id: z.string().uuid("Invalid document ID"),
});

/**
 * Chat schemas
 */
export const sendMessageSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  message: z.string().min(1, "Message cannot be empty"),
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
});

export const getConversationsSchema = z.object({
  documentId: z.string().uuid("Invalid document ID").optional(),
});

export const getMessagesSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID"),
});

/**
 * Response schemas
 */
export const apiResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  // @ts-ignore - Generic data field can be any type
  data: z.unknown().optional(),
  error: z.string().optional(),
});


export const documentResponseSchema = apiResponseSchema.extend({
  data: z.object({
    id: z.string().uuid(),
    name: z.string(),
    size: z.number(),
    pageCount: z.number(),
    uploadDate: z.date(),
  }).optional(),
});

export const documentsListResponseSchema = apiResponseSchema.extend({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      size: z.number(),
      pageCount: z.number(),
      uploadDate: z.date(),
    })
  ).optional(),
});

export const chatResponseSchema = apiResponseSchema.extend({
  data: z.object({
    message: z.object({
      id: z.string(),
      content: z.string(),
      role: z.enum(["user", "assistant"]),
      timestamp: z.date(),
    }),
    documentId: z.string().uuid(),
    conversationId: z.string().uuid(),
  }).optional(),
});

export const conversationsListResponseSchema = apiResponseSchema.extend({
  data: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      documentId: z.string().uuid(),
      createdAt: z.date(),
      updatedAt: z.date(),
    })
  ).optional(),
});

export const messagesListResponseSchema = apiResponseSchema.extend({
  data: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      role: z.enum(["user", "assistant"]),
      timestamp: z.date(),
    })
  ).optional(),
});
