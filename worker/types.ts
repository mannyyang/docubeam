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

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserRegistration extends UserCredentials {
  name: string;
}

// Authentication types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  tenantId: string;
  iat: number; // Issued at
  exp: number; // Expiration time
}

// Document types
export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  uploadDate: Date;
  userId: string;
  tenantId: string;
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

// Hono context extensions
export interface AppBindings {
  env: Env;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  tenantId: string;
}