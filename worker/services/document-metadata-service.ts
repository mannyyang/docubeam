import { FileStorageService } from "./file-storage-service";
import { PDFDocument } from "../types";
import { NotFoundError } from "../middleware/error";
import { ERROR_MESSAGES } from "../config";

/**
 * Service for handling document metadata operations
 */
export class DocumentMetadataService {
  /**
   * Create document metadata
   * @param documentId The document ID
   * @param metadata The document metadata
   * @param env Environment variables
   * @returns The stored metadata path
   */
  static async createMetadata(
    documentId: string,
    metadata: PDFDocument,
    env: Env
  ): Promise<string> {
    console.log(`[METADATA_START] document_id=${documentId} operation=create_metadata`);
    
    try {
      const path = await FileStorageService.storeJSON(
        documentId,
        'metadata.json',
        metadata,
        env
      );
      
      console.log(`[METADATA_SUCCESS] document_id=${documentId} path=${path} operation=metadata_created`);
      return path;
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=creation_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get document metadata
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The document metadata
   */
  static async getMetadata(
    documentId: string,
    env: Env
  ): Promise<PDFDocument> {
    console.log(`[METADATA_START] document_id=${documentId} operation=get_metadata`);
    
    try {
      const metadata = await FileStorageService.getJSON<PDFDocument>(
        `documents/${documentId}/metadata.json`,
        env
      );
      
      if (!metadata) {
        console.error(`[METADATA_ERROR] document_id=${documentId} error_type=not_found`);
        throw new NotFoundError(ERROR_MESSAGES.DOCUMENTS.NOT_FOUND);
      }
      
      console.log(`[METADATA_SUCCESS] document_id=${documentId} operation=metadata_retrieved`);
      return metadata;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update document metadata
   * @param documentId The document ID
   * @param updates Partial updates to apply
   * @param env Environment variables
   * @returns The updated metadata
   */
  static async updateMetadata(
    documentId: string,
    updates: Partial<PDFDocument & { ocrError?: string }>,
    env: Env
  ): Promise<PDFDocument> {
    console.log(`[METADATA_START] document_id=${documentId} update_keys=${Object.keys(updates).join(',')} operation=update_metadata`);
    
    try {
      // Get existing metadata
      const existingMetadata = await this.getMetadata(documentId, env);
      
      // Merge updates
      const updatedMetadata = { ...existingMetadata, ...updates };
      
      // Store updated metadata
      await FileStorageService.storeJSON(
        documentId,
        'metadata.json',
        updatedMetadata,
        env
      );
      
      console.log(`[METADATA_SUCCESS] document_id=${documentId} operation=metadata_updated`);
      return updatedMetadata;
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=update_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Update document page count after OCR processing
   * @param documentId The document ID
   * @param pageCount The page count
   * @param env Environment variables
   */
  static async updatePageCount(
    documentId: string,
    pageCount: number,
    env: Env
  ): Promise<void> {
    console.log(`[METADATA_START] document_id=${documentId} page_count=${pageCount} operation=update_page_count`);
    
    try {
      await this.updateMetadata(documentId, { pageCount }, env);
      console.log(`[METADATA_SUCCESS] document_id=${documentId} page_count=${pageCount} operation=page_count_updated`);
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=page_count_update_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Set OCR error in metadata
   * @param documentId The document ID
   * @param error The error message
   * @param env Environment variables
   */
  static async setOCRError(
    documentId: string,
    error: string,
    env: Env
  ): Promise<void> {
    console.log(`[METADATA_START] document_id=${documentId} error_message=${error} operation=set_ocr_error`);
    
    try {
      await this.updateMetadata(documentId, { ocrError: error }, env);
      console.log(`[METADATA_SUCCESS] document_id=${documentId} operation=ocr_error_set`);
    } catch (updateError) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=ocr_error_update_failed error_name=${updateError instanceof Error ? updateError.name : 'Unknown'} error_message=${updateError instanceof Error ? updateError.message : String(updateError)}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Clear OCR error from metadata
   * @param documentId The document ID
   * @param env Environment variables
   */
  static async clearOCRError(
    documentId: string,
    env: Env
  ): Promise<void> {
    console.log(`[METADATA_START] document_id=${documentId} operation=clear_ocr_error`);
    
    try {
      const metadata = await this.getMetadata(documentId, env);
      
      // Remove ocrError property if it exists
      if ('ocrError' in metadata) {
        const { ocrError, ...cleanMetadata } = metadata as PDFDocument & { ocrError?: string };
        
        await FileStorageService.storeJSON(
          documentId,
          'metadata.json',
          cleanMetadata,
          env
        );
        
        console.log(`[METADATA_SUCCESS] document_id=${documentId} operation=ocr_error_cleared`);
      } else {
        console.log(`[METADATA_INFO] document_id=${documentId} operation=no_ocr_error_to_clear`);
      }
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=ocr_error_clear_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      // Don't throw - this is not critical
    }
  }

  /**
   * Check if document exists
   * @param documentId The document ID
   * @param env Environment variables
   * @returns True if document exists, false otherwise
   */
  static async documentExists(
    documentId: string,
    env: Env
  ): Promise<boolean> {
    console.log(`[METADATA_START] document_id=${documentId} operation=check_existence`);
    
    try {
      await this.getMetadata(documentId, env);
      console.log(`[METADATA_SUCCESS] document_id=${documentId} exists=true operation=existence_checked`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        console.log(`[METADATA_SUCCESS] document_id=${documentId} exists=false operation=existence_checked`);
        return false;
      }
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=existence_check_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get all document metadata
   * @param env Environment variables
   * @returns Array of all document metadata
   */
  static async getAllMetadata(env: Env): Promise<PDFDocument[]> {
    console.log(`[METADATA_START] operation=get_all_metadata`);
    
    try {
      // List all documents
      const objects = await FileStorageService.listObjects('documents/', env, '/');
      
      // Extract document IDs from the object keys
      const documentIds = new Set<string>();
      for (const object of objects.objects) {
        const parts = object.key.split('/');
        if (parts.length >= 2) {
          documentIds.add(parts[1]);
        }
      }
      
      console.log(`[METADATA_PROGRESS] document_count=${documentIds.size} operation=document_ids_extracted`);
      
      // Fetch metadata for each document
      const documents: PDFDocument[] = [];
      for (const documentId of documentIds) {
        try {
          const metadata = await this.getMetadata(documentId, env);
          documents.push(metadata);
        } catch (error) {
          console.error(`[METADATA_ERROR] document_id=${documentId} error_type=metadata_fetch_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
          // Continue with other documents
        }
      }
      
      // Sort documents by upload date (newest first)
      documents.sort(
        (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      );
      
      console.log(`[METADATA_SUCCESS] documents_retrieved=${documents.length} operation=all_metadata_retrieved`);
      return documents;
    } catch (error) {
      console.error(`[METADATA_ERROR] error_type=get_all_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Delete document metadata
   * @param documentId The document ID
   * @param env Environment variables
   */
  static async deleteMetadata(
    documentId: string,
    env: Env
  ): Promise<void> {
    console.log(`[METADATA_START] document_id=${documentId} operation=delete_metadata`);
    
    try {
      // Verify document exists first
      await this.getMetadata(documentId, env);
      
      // Delete metadata file
      await FileStorageService.deleteFile(
        `documents/${documentId}/metadata.json`,
        env
      );
      
      console.log(`[METADATA_SUCCESS] document_id=${documentId} operation=metadata_deleted`);
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=deletion_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get document metadata with OCR status
   * @param documentId The document ID
   * @param env Environment variables
   * @returns Document metadata with OCR status
   */
  static async getMetadataWithOCRStatus(
    documentId: string,
    env: Env
  ): Promise<PDFDocument & { 
    ocrStatus?: 'not_started' | 'processing' | 'completed' | 'failed';
    ocrError?: string;
  }> {
    console.log(`[METADATA_START] document_id=${documentId} operation=get_metadata_with_ocr_status`);
    
    try {
      const metadata = await this.getMetadata(documentId, env);
      
      // Check if OCR results exist
      const ocrExists = await FileStorageService.getFile(
        `documents/${documentId}/ocr/full-result.json`,
        env
      );
      
      let ocrStatus: 'not_started' | 'processing' | 'completed' | 'failed' = 'not_started';
      let ocrError: string | undefined;
      
      if (ocrExists) {
        ocrStatus = 'completed';
      } else if ('ocrError' in metadata) {
        ocrStatus = 'failed';
        ocrError = (metadata as PDFDocument & { ocrError?: string }).ocrError;
      }
      
      console.log(`[METADATA_SUCCESS] document_id=${documentId} ocr_status=${ocrStatus} operation=metadata_with_ocr_status_retrieved`);
      
      return {
        ...metadata,
        ocrStatus,
        ocrError
      };
    } catch (error) {
      console.error(`[METADATA_ERROR] document_id=${documentId} error_type=metadata_with_ocr_status_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
