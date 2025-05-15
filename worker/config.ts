/**
 * Configuration for the PDF Chat application backend
 */

// API routes
export const API_ROUTES = {
  // Authentication endpoints
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
  },
  
  // Document endpoints
  DOCUMENTS: {
    BASE: "/api/documents",
    UPLOAD: "/api/documents/upload",
    GET: "/api/documents/:id",
    DELETE: "/api/documents/:id",
  },
  
  // Chat endpoints
  CHAT: {
    SEND_MESSAGE: "/api/chat/message",
    GET_CONVERSATIONS: "/api/chat/conversations",
    GET_MESSAGES: "/api/chat/messages/:conversationId",
  },
};

// R2 bucket configuration
export const STORAGE_CONFIG = {
  // Base folder structure for multitenancy
  FOLDER_STRUCTURE: {
    DOCUMENTS: "documents", // Base folder for all documents
    TENANT_PREFIX: "tenant", // Prefix for tenant folders
  },
  
  // File types and limits
  FILE_LIMITS: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_MIME_TYPES: ["application/pdf"],
  },
};

// AI model configuration
export const AI_CONFIG = {
  // Mistral AI configuration for OCR
  MISTRAL_OCR: {
    MODEL: "mistral-large-latest",
    MAX_TOKENS: 4096,
  },
  
  // AutoRAG configuration
  AUTORAG: {
    SYSTEM_PROMPT: "You are a helpful assistant that answers questions based on the provided PDF documents. Provide accurate information based only on the content of the documents.",
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7,
  },
};

// JWT configuration
export const JWT_CONFIG = {
  EXPIRES_IN: "1d", // 1 day
  REFRESH_EXPIRES_IN: "7d", // 7 days
};

// Error messages
export const ERROR_MESSAGES = {
  AUTHENTICATION: {
    INVALID_CREDENTIALS: "Invalid email or password",
    UNAUTHORIZED: "Unauthorized access",
    TOKEN_EXPIRED: "Token has expired",
    REGISTRATION_FAILED: "Failed to register user",
  },
  DOCUMENTS: {
    UPLOAD_FAILED: "Failed to upload document",
    NOT_FOUND: "Document not found",
    DELETE_FAILED: "Failed to delete document",
    INVALID_FILE_TYPE: "Invalid file type. Only PDF files are accepted",
    FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB",
  },
  CHAT: {
    MESSAGE_FAILED: "Failed to send message",
    CONVERSATION_NOT_FOUND: "Conversation not found",
  },
};