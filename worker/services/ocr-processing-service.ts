import { extractTextFromPDF, processOCRResult, storeOCRResults } from "../utils";
import { ProcessedOCRResult, MistralOCRResponse } from "../types";

/**
 * Service for handling OCR processing operations
 */
export class OCRProcessingService {
  /**
   * Process OCR for a document buffer
   * @param documentId The document ID
   * @param buffer The PDF buffer
   * @param env Environment variables
   * @returns The processed OCR result
   */
  static async processDocument(
    documentId: string,
    buffer: ArrayBuffer,
    env: Env
  ): Promise<ProcessedOCRResult> {
    console.log(`[OCR_START] document_id=${documentId} buffer_size=${buffer.byteLength} operation=ocr_processing`);
    
    try {
      // Extract text using Mistral OCR
      console.log(`[OCR_API_START] document_id=${documentId} operation=mistral_api_call`);
      const ocrResult = await this.extractTextFromPDF(buffer, env);
      console.log(`[OCR_API_SUCCESS] document_id=${documentId} pages_processed=${ocrResult.pages?.length || 0} operation=mistral_api_completed`);
      
      // Process the OCR result
      console.log(`[OCR_PROGRESS] document_id=${documentId} operation=processing_results`);
      const processedOCR = this.processOCRResult(ocrResult);
      console.log(`[OCR_PROGRESS] document_id=${documentId} total_pages=${processedOCR.totalPages} total_images=${processedOCR.images.length} operation=results_processed`);
      
      // Store OCR results
      console.log(`[OCR_PROGRESS] document_id=${documentId} operation=storing_results`);
      await this.storeOCRResults(documentId, processedOCR, env);
      console.log(`[OCR_SUCCESS] document_id=${documentId} operation=ocr_completed`);
      
      return processedOCR;
    } catch (error) {
      console.error(`[OCR_ERROR] document_id=${documentId} error_type=processing_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Extract text from PDF using Mistral AI OCR
   * @param buffer The PDF buffer
   * @param env Environment variables
   * @returns The OCR result
   */
  private static async extractTextFromPDF(
    buffer: ArrayBuffer,
    env: Env
  ): Promise<MistralOCRResponse> {
    console.log(`[OCR_API_START] buffer_size=${buffer.byteLength} operation=mistral_extraction`);
    
    try {
      const result = await extractTextFromPDF(buffer, env);
      console.log(`[OCR_API_SUCCESS] pages_extracted=${result.pages?.length || 0} operation=mistral_extraction_completed`);
      return result;
    } catch (error) {
      console.error(`[OCR_API_ERROR] error_type=mistral_api_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Process OCR results into organized format
   * @param ocrResult The raw OCR result
   * @returns The processed OCR result
   */
  private static processOCRResult(ocrResult: MistralOCRResponse): ProcessedOCRResult {
    console.log(`[OCR_PROGRESS] pages_to_process=${ocrResult.pages?.length || 0} operation=result_processing`);
    
    try {
      const result = processOCRResult(ocrResult);
      console.log(`[OCR_PROGRESS] processed_pages=${result.totalPages} processed_images=${result.images.length} text_length=${result.fullText.length} operation=result_processing_completed`);
      return result;
    } catch (error) {
      console.error(`[OCR_ERROR] error_type=result_processing_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Store OCR results in R2
   * @param documentId The document ID
   * @param processedOCR The processed OCR result
   * @param env Environment variables
   */
  private static async storeOCRResults(
    documentId: string,
    processedOCR: ProcessedOCRResult,
    env: Env
  ): Promise<void> {
    console.log(`[OCR_PROGRESS] document_id=${documentId} pages_to_store=${processedOCR.totalPages} images_to_store=${processedOCR.images.length} operation=storing_ocr_results`);
    
    try {
      await storeOCRResults(documentId, processedOCR, env);
      console.log(`[OCR_PROGRESS] document_id=${documentId} operation=ocr_results_stored`);
    } catch (error) {
      console.error(`[OCR_ERROR] document_id=${documentId} error_type=storage_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Validate OCR processing prerequisites
   * @param documentId The document ID
   * @param buffer The PDF buffer
   * @param env Environment variables
   * @throws Error if validation fails
   */
  static validateOCRPrerequisites(
    documentId: string,
    buffer: ArrayBuffer,
    env: Env
  ): void {
    console.log(`[OCR_VALIDATION] document_id=${documentId} buffer_size=${buffer.byteLength} operation=prerequisite_validation`);
    
    if (!documentId) {
      console.error(`[OCR_VALIDATION_ERROR] error_type=missing_document_id`);
      throw new Error("Document ID is required for OCR processing");
    }
    
    if (!buffer || buffer.byteLength === 0) {
      console.error(`[OCR_VALIDATION_ERROR] document_id=${documentId} error_type=invalid_buffer buffer_size=${buffer?.byteLength || 0}`);
      throw new Error("Valid PDF buffer is required for OCR processing");
    }
    
    if (!env.MISTRAL_AI_API_KEY) {
      console.error(`[OCR_VALIDATION_ERROR] document_id=${documentId} error_type=missing_api_key`);
      throw new Error("Mistral AI API key is not configured");
    }
    
    if (!env.PDF_BUCKET) {
      console.error(`[OCR_VALIDATION_ERROR] document_id=${documentId} error_type=missing_storage`);
      throw new Error("PDF storage bucket is not configured");
    }
    
    console.log(`[OCR_VALIDATION_SUCCESS] document_id=${documentId} operation=prerequisites_validated`);
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
    console.log(`[OCR_STATUS] document_id=${documentId} operation=status_check`);
    
    try {
      // Check if OCR results exist
      const ocrObject = await env.PDF_BUCKET.get(`documents/${documentId}/ocr/full-result.json`);
      
      if (!ocrObject) {
        console.log(`[OCR_STATUS] document_id=${documentId} status=not_started`);
        return { status: 'not_started' };
      }
      
      const ocrResult = await ocrObject.json<ProcessedOCRResult>();
      
      // Check if there's an error in metadata
      const metadataObject = await env.PDF_BUCKET.get(`documents/${documentId}/metadata.json`);
      if (metadataObject) {
        const metadata = await metadataObject.json<{ ocrError?: string }>();
        if (metadata.ocrError) {
          console.log(`[OCR_STATUS] document_id=${documentId} status=failed error=${metadata.ocrError}`);
          return { 
            status: 'failed',
            error: metadata.ocrError
          };
        }
      }
      
      console.log(`[OCR_STATUS] document_id=${documentId} status=completed total_pages=${ocrResult.totalPages} has_images=${ocrResult.images.length > 0}`);
      return {
        status: 'completed',
        totalPages: ocrResult.totalPages,
        processedAt: new Date(ocrResult.processedAt),
        hasImages: ocrResult.images.length > 0
      };
    } catch (error) {
      console.error(`[OCR_STATUS_ERROR] document_id=${documentId} error_type=status_check_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      return { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
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
    console.log(`[OCR_RETRY] document_id=${documentId} operation=retry_processing`);
    
    try {
      // Get the original PDF file
      const originalFile = await env.PDF_BUCKET.get(`documents/${documentId}/original`);
      if (!originalFile) {
        throw new Error("Original PDF file not found");
      }
      
      const buffer = await originalFile.arrayBuffer();
      
      // Clear any existing OCR error from metadata
      const metadataObject = await env.PDF_BUCKET.get(`documents/${documentId}/metadata.json`);
      if (metadataObject) {
        const metadata = await metadataObject.json<{ ocrError?: string }>();
        if (metadata.ocrError) {
          delete metadata.ocrError;
          await env.PDF_BUCKET.put(
            `documents/${documentId}/metadata.json`,
            JSON.stringify(metadata),
            {
              httpMetadata: {
                contentType: "application/json",
              },
            }
          );
        }
      }
      
      // Retry OCR processing
      const result = await this.processDocument(documentId, buffer, env);
      console.log(`[OCR_RETRY_SUCCESS] document_id=${documentId} operation=retry_completed`);
      return result;
    } catch (error) {
      console.error(`[OCR_RETRY_ERROR] document_id=${documentId} error_type=retry_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
