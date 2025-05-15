import { z } from "zod";

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

/**
 * Document schemas
 */
export const uploadDocumentSchema = z.object({
  file: z.any(), // This will be validated in the route handler
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
  data: z.any().optional(),
  error: z.string().optional(),
});

export const authResponseSchema = apiResponseSchema.extend({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }).optional(),
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