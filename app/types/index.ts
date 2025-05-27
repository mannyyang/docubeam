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
  url: string;
  textUrl: string;
  ocrUrl: string;
  statusUrl: string;
  imagesUrl: string;
}

export interface ChatResponse {
  message: ChatMessage;
  documentId: string;
}

// Waitlist response type
export interface WaitlistResponse {
  success: boolean;
  message: string;
}

// Image types
export interface DocumentImage {
  id: string;
  pageNumber: number;
  imageIndex: number;
  boundingBox: {
    topLeftX: number;
    topLeftY: number;
    bottomRightX: number;
    bottomRightY: number;
  };
  url: string;
}

export interface ImagesResponse {
  totalImages: number;
  images: DocumentImage[];
}

export interface PageImagesResponse {
  pageNumber: number;
  totalImages: number;
  images: DocumentImage[];
}

// OCR Status types
export interface OCRStatus {
  status: "processing" | "completed";
  totalPages?: number;
  processedAt?: string;
  hasImages?: boolean;
  imageCount?: number;
  message?: string;
}
