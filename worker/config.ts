/**
 * Configuration for the PDF Chat application backend
 */

// API routes
export const API_ROUTES = {
  // Document endpoints
  DOCUMENTS: {
    BASE: "/api/documents",
    UPLOAD: "/api/documents/upload",
    GET: "/api/documents/:id",
    DELETE: "/api/documents/:id",
    OCR: "/api/documents/:id/ocr",
    TEXT: "/api/documents/:id/text",
    PAGE: "/api/documents/:id/pages/:pageNumber",
    OCR_STATUS: "/api/documents/:id/ocr/status",
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
  // Base folder structure
  FOLDER_STRUCTURE: {
    DOCUMENTS: "documents", // Base folder for all documents
    ORIGINAL: "original",   // Original PDF files
    OCR: "ocr",            // OCR results and processed content
    PAGES: "pages",        // Individual page content
    IMAGES: "images",      // Extracted images
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
    MODEL: "mistral-ocr-latest",
    INCLUDE_IMAGES: true,
  },
  
  // AutoRAG configuration
  AUTORAG: {
    SYSTEM_PROMPT: "You are a helpful assistant that answers questions based on the provided PDF documents. Provide accurate information based only on the content of the documents.",
    MAX_TOKENS: 2048,
    TEMPERATURE: 0.7,
  },
};

// Error messages
export const ERROR_MESSAGES = {
  DOCUMENTS: {
    UPLOAD_FAILED: "Failed to upload document",
    NOT_FOUND: "Document not found",
    DELETE_FAILED: "Failed to delete document",
    INVALID_FILE_TYPE: "Invalid file type. Only PDF files are accepted",
    FILE_TOO_LARGE: "File size exceeds the maximum limit of 10MB",
    OCR_NOT_READY: "OCR processing not completed yet",
    OCR_FAILED: "OCR processing failed",
  },
  CHAT: {
    MESSAGE_FAILED: "Failed to send message",
    CONVERSATION_NOT_FOUND: "Conversation not found",
  },
};
