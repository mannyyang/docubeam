import { generateUUID } from "../utils";
import { PDFDocument, UploadedDocument, ProcessedOCRResult } from "../types";
import { FileStorageService } from "./file-storage-service";
import { DocumentValidationService } from "./document-validation-service";
import { OCRProcessingService } from "./ocr-processing-service";
import { DocumentMetadataService } from "./document-metadata-service";
import { DocumentRetrievalService } from "./document-retrieval-service";

/**
 * Main orchestration service that coordinates document operations
 * This service maintains the same public API as the original DocumentService
 */
export class DocumentOrchestrationService {
  /**
   * Upload a PDF document with full processing pipeline
   * @param file The PDF file
   * @param env Environment variables
   * @returns The uploaded document information
   */
  static async uploadDocument(
    file: File,
    env: Env
  ): Promise<UploadedDocument> {
    console.log(`[UPLOAD_START] document=${file?.name || 'undefined'} size=${file?.size || 0} type=${file?.type || 'undefined'} operation=document_upload`);
    
    try {
      // Step 1: Validate the file and environment
      DocumentValidationService.validateFile(file);
      DocumentValidationService.validateEnvironment(env);
      DocumentValidationService.validateFileName(file.name);
      
      // Step 2: Generate document ID and prepare metadata
      const documentId = generateUUID();
      console.log(`[UPLOAD_PROGRESS] document_id=${documentId} step=id_generated`);
      
      // Step 3: Store the original file
      const buffer = await file.arrayBuffer();
      DocumentValidationService.validateBuffer(buffer, 100); // Minimum 100 bytes
      
      await FileStorageService.storeFile(
        documentId,
        file.name,
        buffer,
        file.type,
        env,
        'original'
      );
      console.log(`[UPLOAD_PROGRESS] document_id=${documentId} step=file_stored`);
      
      // Step 4: Create initial metadata
      const document: PDFDocument = {
        id: documentId,
        name: file.name,
        size: file.size,
        pageCount: 0, // Will be updated after OCR
        uploadDate: new Date(),
        path: `documents/${documentId}/original/${file.name}`,
      };
      
      await DocumentMetadataService.createMetadata(documentId, document, env);
      console.log(`[UPLOAD_PROGRESS] document_id=${documentId} step=metadata_created`);
      
      // Step 5: Process OCR synchronously
      console.log(`[UPLOAD_PROGRESS] document_id=${documentId} step=starting_ocr`);
      try {
        const processedOCR = await OCRProcessingService.processDocument(documentId, buffer, env);
        
        // Update metadata with page count
        await DocumentMetadataService.updatePageCount(documentId, processedOCR.totalPages, env);
        console.log(`[UPLOAD_PROGRESS] document_id=${documentId} step=ocr_completed pages=${processedOCR.totalPages}`);
      } catch (ocrError) {
        console.error(`[UPLOAD_ERROR] document_id=${documentId} step=ocr_failed error_name=${ocrError instanceof Error ? ocrError.name : 'Unknown'} error_message=${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
        
        // Store error in metadata but don't fail the upload
        await DocumentMetadataService.setOCRError(
          documentId,
          ocrError instanceof Error ? ocrError.message : "Unknown OCR error",
          env
        );
      }
      
      // Step 6: Generate resource URLs
      const urls = DocumentRetrievalService.generateDocumentURLs(documentId);
      
      const result: UploadedDocument = {
        documentId: documentId,
        name: file.name,
        pageCount: 0, // Will be updated after OCR
        size: file.size,
        url: urls.documentUrl,
        textUrl: urls.textUrl,
        ocrUrl: urls.ocrUrl,
        statusUrl: urls.statusUrl,
        imagesUrl: urls.imagesUrl,
      };
      
      console.log(`[UPLOAD_SUCCESS] document_id=${documentId} operation=document_upload_completed`);
      return result;
    } catch (error) {
      console.error(`[UPLOAD_ERROR] error_type=upload_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_document_ocr`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await DocumentRetrievalService.getOCRResults(documentId, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=ocr_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_extracted_text`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await DocumentRetrievalService.getExtractedText(documentId, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=text_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
    console.log(`[RETRIEVAL_START] document_id=${documentId} page_number=${pageNumber} operation=get_document_page`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      DocumentValidationService.validatePageNumber(pageNumber);
      
      return await DocumentRetrievalService.getPageContent(documentId, pageNumber, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} page_number=${pageNumber} error_type=page_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all documents
   * @param env Environment variables
   * @returns All documents
   */
  static async getDocuments(env: Env): Promise<PDFDocument[]> {
    console.log(`[RETRIEVAL_START] operation=get_all_documents`);
    
    try {
      return await DocumentMetadataService.getAllMetadata(env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] error_type=get_all_documents_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_document`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await DocumentMetadataService.getMetadata(documentId, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=get_document_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
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
    console.log(`[DELETE_START] document_id=${documentId} operation=delete_document`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      
      // Verify document exists
      await DocumentMetadataService.getMetadata(documentId, env);
      
      // Delete all files for the document
      await FileStorageService.deleteDocument(documentId, env);
      
      console.log(`[DELETE_SUCCESS] document_id=${documentId} operation=document_deleted`);
    } catch (error) {
      console.error(`[DELETE_ERROR] document_id=${documentId} error_type=deletion_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get OCR processing status for a document
   * @param documentId The document ID
   * @param env Environment variables
   * @returns OCR status information
   */
  static async getOCRStatus(
    documentId: string,
    env: Env
  ): Promise<{
    status: 'not_started' | 'processing' | 'completed' | 'failed';
    totalPages?: number;
    processedAt?: Date;
    hasImages?: boolean;
    error?: string;
  }> {
    console.log(`[STATUS_START] document_id=${documentId} operation=get_ocr_status`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await OCRProcessingService.getOCRStatus(documentId, env);
    } catch (error) {
      console.error(`[STATUS_ERROR] document_id=${documentId} error_type=status_check_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Retry OCR processing for a failed document
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The processed OCR result
   */
  static async retryOCRProcessing(
    documentId: string,
    env: Env
  ): Promise<ProcessedOCRResult> {
    console.log(`[RETRY_START] document_id=${documentId} operation=retry_ocr_processing`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      
      const result = await OCRProcessingService.retryOCRProcessing(documentId, env);
      
      // Update metadata with new page count
      await DocumentMetadataService.updatePageCount(documentId, result.totalPages, env);
      
      // Clear any existing OCR error
      await DocumentMetadataService.clearOCRError(documentId, env);
      
      console.log(`[RETRY_SUCCESS] document_id=${documentId} operation=ocr_retry_completed`);
      return result;
    } catch (error) {
      console.error(`[RETRY_ERROR] document_id=${documentId} error_type=retry_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      
      // Store retry error in metadata
      await DocumentMetadataService.setOCRError(
        documentId,
        error instanceof Error ? error.message : "OCR retry failed",
        env
      );
      
      throw error;
    }
  }

  /**
   * Get document images
   * @param documentId The document ID
   * @param env Environment variables
   * @returns Array of image information
   */
  static async getDocumentImages(
    documentId: string,
    env: Env
  ): Promise<Array<{
    id: string;
    pageNumber: number;
    imageIndex: number;
    path: string;
    boundingBox: {
      topLeftX: number;
      topLeftY: number;
      bottomRightX: number;
      bottomRightY: number;
    };
  }> | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_document_images`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await DocumentRetrievalService.getDocumentImages(documentId, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=images_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get original document file
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The file object or null if not found
   */
  static async getOriginalFile(
    documentId: string,
    env: Env
  ): Promise<R2Object | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_original_file`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      
      // Get document metadata to find the original file name
      const metadata = await DocumentMetadataService.getMetadata(documentId, env);
      
      return await DocumentRetrievalService.getOriginalFile(documentId, metadata.name, env);
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=original_file_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Search within document text
   * @param documentId The document ID
   * @param query The search query
   * @param env Environment variables
   * @returns Search results with context
   */
  static async searchDocument(
    documentId: string,
    query: string,
    env: Env
  ): Promise<Array<{
    pageNumber: number;
    context: string;
    matchIndex: number;
  }> | null> {
    console.log(`[SEARCH_START] document_id=${documentId} query=${query} operation=search_document`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      
      if (!query || query.trim().length === 0) {
        throw new Error("Search query is required");
      }
      
      return await DocumentRetrievalService.searchDocumentText(documentId, query.trim(), env);
    } catch (error) {
      console.error(`[SEARCH_ERROR] document_id=${documentId} query=${query} error_type=search_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get document summary
   * @param documentId The document ID
   * @param env Environment variables
   * @returns Summary of document content
   */
  static async getDocumentSummary(
    documentId: string,
    env: Env
  ): Promise<{
    hasText: boolean;
    hasImages: boolean;
    pageCount: number;
    imageCount: number;
    textLength: number;
  } | null> {
    console.log(`[SUMMARY_START] document_id=${documentId} operation=get_document_summary`);
    
    try {
      DocumentValidationService.validateDocumentId(documentId);
      return await DocumentRetrievalService.getDocumentSummary(documentId, env);
    } catch (error) {
      console.error(`[SUMMARY_ERROR] document_id=${documentId} error_type=summary_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
