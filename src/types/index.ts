// PDF Document types
export interface PDFDocument {
  id: string;
  name: string;
  uploadDate: Date;
  size: number;
  pageCount: number;
  url?: string;
  metadata?: PDFMetadata;
}

export interface PDFMetadata {
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

// Chat message types
export interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

// API response types
export interface APIResponse<T> {
  data?: T;
  error?: string;
  status: "success" | "error";
}

export interface UploadResponse {
  documentId: string;
  name: string;
  pageCount: number;
  size: number;
}

export interface ChatResponse {
  message: ChatMessage;
  documentId: string;
}
