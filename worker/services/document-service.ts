import { DocumentOrchestrationService } from "./document-orchestration-service";
import {
  PDFDocument,
  UploadedDocument,
  ProcessedOCRResult
} from "../types";

/**
 * Document service for handling document operations
 * This is now a wrapper around DocumentOrchestrationService for backward compatibility
 * @deprecated Use DocumentOrchestrationService directly for new code
 */
export class DocumentService {
  /**
   * Upload a PDF document
   * @param file The PDF file
   * @param env Environment variables
   * @returns The uploaded document
   */
  static async uploadDocument(
    file: File,
    env: Env
  ): Promise<UploadedDocument> {
    return DocumentOrchestrationService.uploadDocument(file, env);
  }

  /**
   * Get OCR results for a document
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The OCR results or null if not available
   */
  static async getDocumentOCR(
    documentId: string,
    env: Env
  ): Promise<ProcessedOCRResult | null> {
    return DocumentOrchestrationService.getDocumentOCR(documentId, env);
  }

  /**
   * Get extracted text for a document
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The extracted text or null if not available
   */
  static async getDocumentExtractedText(
    documentId: string,
    env: Env
  ): Promise<string | null> {
    return DocumentOrchestrationService.getDocumentExtractedText(documentId, env);
  }

  /**
   * Get a specific page's content
   * @param documentId The document ID
   * @param pageNumber The page number (1-indexed)
   * @param env Environment variables
   * @returns The page content or null if not found
   */
  static async getDocumentPage(
    documentId: string,
    pageNumber: number,
    env: Env
  ): Promise<string | null> {
    return DocumentOrchestrationService.getDocumentPage(documentId, pageNumber, env);
  }

  /**
   * Get all documents
   * @param env Environment variables
   * @returns All documents
   */
  static async getDocuments(env: Env): Promise<PDFDocument[]> {
    return DocumentOrchestrationService.getDocuments(env);
  }
  
  /**
   * Get a document by ID
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The document
   */
  static async getDocument(
    documentId: string,
    env: Env
  ): Promise<PDFDocument> {
    return DocumentOrchestrationService.getDocument(documentId, env);
  }
  
  /**
   * Delete a document
   * @param documentId The document ID
   * @param env Environment variables
   */
  static async deleteDocument(
    documentId: string,
    env: Env
  ): Promise<void> {
    return DocumentOrchestrationService.deleteDocument(documentId, env);
  }

  /**
   * Update document metadata
   * @param documentId The document ID
   * @param updates Partial updates to apply
   * @param env Environment variables
   * @deprecated This method is deprecated, use DocumentMetadataService directly
   */
  static async updateDocumentMetadata(
    documentId: string,
    updates: Partial<PDFDocument & { ocrError?: string }>,
    env: Env
  ): Promise<void> {
    // Import here to avoid circular dependencies
    const { DocumentMetadataService } = await import("./document-metadata-service");
    await DocumentMetadataService.updateMetadata(documentId, updates, env);
  }
}
