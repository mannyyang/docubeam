import { FileStorageService } from "./file-storage-service";
import { getOCRResults, getDocumentText } from "../utils";
import { ProcessedOCRResult } from "../types";

/**
 * Service for handling document content retrieval operations
 */
export class DocumentRetrievalService {
  /**
   * Get OCR results for a document
   * @param documentId The document ID
   * @param env Environment variables
   * @returns The OCR results or null if not available
   */
  static async getOCRResults(
    documentId: string,
    env: Env
  ): Promise<ProcessedOCRResult | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_ocr_results`);
    
    try {
      const result = await getOCRResults(documentId, env);
      
      if (result) {
        console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} pages=${result.totalPages} images=${result.images.length} operation=ocr_results_retrieved`);
      } else {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} operation=ocr_results_not_found`);
      }
      
      return result;
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
  static async getExtractedText(
    documentId: string,
    env: Env
  ): Promise<string | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_extracted_text`);
    
    try {
      const text = await getDocumentText(documentId, env);
      
      if (text) {
        console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} text_length=${text.length} operation=extracted_text_retrieved`);
      } else {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} operation=extracted_text_not_found`);
      }
      
      return text;
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
  static async getPageContent(
    documentId: string,
    pageNumber: number,
    env: Env
  ): Promise<string | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} page_number=${pageNumber} operation=get_page_content`);
    
    try {
      const pageNumberPadded = pageNumber.toString().padStart(3, '0');
      const text = await FileStorageService.getText(
        `documents/${documentId}/ocr/pages/page-${pageNumberPadded}.md`,
        env
      );
      
      if (text) {
        console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} page_number=${pageNumber} text_length=${text.length} operation=page_content_retrieved`);
      } else {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} page_number=${pageNumber} operation=page_content_not_found`);
      }
      
      return text;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} page_number=${pageNumber} error_type=page_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get original document file
   * @param documentId The document ID
   * @param fileName The original file name
   * @param env Environment variables
   * @returns The file object or null if not found
   */
  static async getOriginalFile(
    documentId: string,
    fileName: string,
    env: Env
  ): Promise<R2Object | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} file_name=${fileName} operation=get_original_file`);
    
    try {
      const file = await FileStorageService.getFile(
        `documents/${documentId}/original/${fileName}`,
        env
      );
      
      if (file) {
        console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} file_name=${fileName} operation=original_file_retrieved`);
      } else {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} file_name=${fileName} operation=original_file_not_found`);
      }
      
      return file;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} file_name=${fileName} error_type=file_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get document images from OCR processing
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
      const ocrResults = await this.getOCRResults(documentId, env);
      
      if (!ocrResults || ocrResults.images.length === 0) {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} operation=no_images_found`);
        return null;
      }
      
      const images = ocrResults.images.map(image => {
        const pageNumber = image.pageNumber.toString().padStart(3, '0');
        const imageNumber = (image.imageIndex + 1).toString().padStart(3, '0');
        const path = `documents/${documentId}/ocr/images/page-${pageNumber}-img-${imageNumber}.base64`;
        
        return {
          id: image.id,
          pageNumber: image.pageNumber,
          imageIndex: image.imageIndex,
          path,
          boundingBox: image.boundingBox
        };
      });
      
      console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} image_count=${images.length} operation=document_images_retrieved`);
      return images;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=images_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Get a specific image from OCR processing
   * @param documentId The document ID
   * @param pageNumber The page number
   * @param imageIndex The image index on the page
   * @param env Environment variables
   * @returns The image base64 data or null if not found
   */
  static async getImage(
    documentId: string,
    pageNumber: number,
    imageIndex: number,
    env: Env
  ): Promise<string | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} page_number=${pageNumber} image_index=${imageIndex} operation=get_image`);
    
    try {
      const pageNumberPadded = pageNumber.toString().padStart(3, '0');
      const imageNumber = (imageIndex + 1).toString().padStart(3, '0');
      const imagePath = `documents/${documentId}/ocr/images/page-${pageNumberPadded}-img-${imageNumber}.base64`;
      
      const imageData = await FileStorageService.getText(imagePath, env);
      
      if (imageData) {
        console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} page_number=${pageNumber} image_index=${imageIndex} data_length=${imageData.length} operation=image_retrieved`);
      } else {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} page_number=${pageNumber} image_index=${imageIndex} operation=image_not_found`);
      }
      
      return imageData;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} page_number=${pageNumber} image_index=${imageIndex} error_type=image_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Generate URLs for document resources
   * @param documentId The document ID
   * @returns Object containing various resource URLs
   */
  static generateDocumentURLs(documentId: string): {
    documentUrl: string;
    textUrl: string;
    ocrUrl: string;
    statusUrl: string;
    imagesUrl: string;
  } {
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=generate_urls`);
    
    const urls = {
      documentUrl: `/api/documents/${documentId}/file`,
      textUrl: `/api/documents/${documentId}/text`,
      ocrUrl: `/api/documents/${documentId}/ocr`,
      statusUrl: `/api/documents/${documentId}/ocr/status`,
      imagesUrl: `/api/documents/${documentId}/images`
    };
    
    console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} operation=urls_generated`);
    return urls;
  }

  /**
   * Get document content summary
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
    console.log(`[RETRIEVAL_START] document_id=${documentId} operation=get_document_summary`);
    
    try {
      const ocrResults = await this.getOCRResults(documentId, env);
      
      if (!ocrResults) {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} operation=no_ocr_results_for_summary`);
        return null;
      }
      
      const summary = {
        hasText: ocrResults.fullText.length > 0,
        hasImages: ocrResults.images.length > 0,
        pageCount: ocrResults.totalPages,
        imageCount: ocrResults.images.length,
        textLength: ocrResults.fullText.length
      };
      
      console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} page_count=${summary.pageCount} image_count=${summary.imageCount} text_length=${summary.textLength} operation=document_summary_retrieved`);
      return summary;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} error_type=summary_retrieval_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
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
  static async searchDocumentText(
    documentId: string,
    query: string,
    env: Env
  ): Promise<Array<{
    pageNumber: number;
    context: string;
    matchIndex: number;
  }> | null> {
    console.log(`[RETRIEVAL_START] document_id=${documentId} query=${query} operation=search_document_text`);
    
    try {
      const text = await this.getExtractedText(documentId, env);
      
      if (!text) {
        console.log(`[RETRIEVAL_NOT_FOUND] document_id=${documentId} operation=no_text_for_search`);
        return null;
      }
      
      const results: Array<{
        pageNumber: number;
        context: string;
        matchIndex: number;
      }> = [];
      
      // Simple text search with context
      const queryLower = query.toLowerCase();
      const textLower = text.toLowerCase();
      let searchIndex = 0;
      
      while (true) {
        const matchIndex = textLower.indexOf(queryLower, searchIndex);
        if (matchIndex === -1) break;
        
        // Extract context around the match
        const contextStart = Math.max(0, matchIndex - 100);
        const contextEnd = Math.min(text.length, matchIndex + query.length + 100);
        const context = text.substring(contextStart, contextEnd);
        
        // Try to determine page number (basic approach)
        const textBeforeMatch = text.substring(0, matchIndex);
        const pageBreaks = textBeforeMatch.split('---').length;
        const pageNumber = Math.max(1, pageBreaks);
        
        results.push({
          pageNumber,
          context,
          matchIndex
        });
        
        searchIndex = matchIndex + 1;
      }
      
      console.log(`[RETRIEVAL_SUCCESS] document_id=${documentId} query=${query} matches=${results.length} operation=document_search_completed`);
      return results;
    } catch (error) {
      console.error(`[RETRIEVAL_ERROR] document_id=${documentId} query=${query} error_type=search_failed error_name=${error instanceof Error ? error.name : 'Unknown'} error_message=${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
