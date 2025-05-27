/// <reference types="@cloudflare/workers-types" />

/**
 * Type definitions for the PDF Chat application backend
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}


// Document types
export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  uploadDate: Date;
  path: string;
  metadata?: PDFMetadata;
}

export interface PDFMetadata {
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface UploadedDocument {
  documentId: string;
  name: string;
  pageCount: number;
  size: number;
  url: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  conversationId: string;
  userId: string;
}

export interface Conversation {
  id: string;
  title: string;
  documentId: string;
  userId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  documentId: string;
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  documentId: string;
  conversationId: string;
}

// AutoRAG types
export interface AutoRAGDocument {
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface AutoRAGChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AutoRAGChatRequest {
  messages: AutoRAGChatMessage[];
  documentId?: string;
  conversationId?: string;
}

export interface AutoRAGChatResponse {
  message: AutoRAGChatMessage;
  conversationId: string;
}

export interface AutoRAGSearchRequest {
  query: string;
  documentId?: string;
  limit?: number;
}

export interface AutoRAGSearchResult {
  documentId: string;
  documentName: string;
  content: string;
  score: number;
}

export interface AutoRAGSearchResponse {
  results: AutoRAGSearchResult[];
}

// API response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}

// Multitenancy types
export interface Tenant {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// OCR types
export interface OCRResult {
  text: string;
  pageCount: number;
  pages: OCRPage[];
}

export interface OCRPage {
  pageNumber: number;
  text: string;
}

// Mistral OCR API types
export interface MistralOCRResponse {
  pages: MistralOCRPage[];
  model: string;
  usage_info: {
    pages_processed: number;
    doc_size_bytes: number | null;
  };
}

export interface MistralOCRPage {
  index: number;
  markdown: string;
  images?: MistralOCRImage[];
  dimensions: {
    dpi: number;
    height: number;
    width: number;
  };
}

export interface MistralOCRImage {
  id: string;
  top_left_x: number;
  top_left_y: number;
  bottom_right_x: number;
  bottom_right_y: number;
  image_base64: string;
}

// Processed OCR types for storage
export interface ProcessedOCRResult {
  totalPages: number;
  fullText: string;
  pages: ProcessedOCRPage[];
  images: ProcessedImage[];
  processedAt: Date;
}

export interface ProcessedOCRPage {
  pageNumber: number;
  markdown: string;
  images: MistralOCRImage[];
  dimensions: {
    dpi: number;
    height: number;
    width: number;
  };
}

export interface ProcessedImage {
  id: string;
  pageNumber: number;
  imageIndex: number;
  boundingBox: {
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
  };
  base64Data: string;
}

// Hono context extensions
export interface AppBindings {
  env: Env;
}
