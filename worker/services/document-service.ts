import {
  createDocumentPath,
  generateUUID,
  extractTextFromPDF,
  processOCRResult,
  storeOCRResults,
  getOCRResults,
  getDocumentText
} from "../utils";
import {
  PDFDocument,
  UploadedDocument,
  ProcessedOCRResult
} from "../types";
import { ERROR_MESSAGES, STORAGE_CONFIG } from "../config";
import { NotFoundError, ValidationError } from "../middleware/error";

/**
 * Document service for handling document operations
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
    // Validate the file
    if (!file) {
      throw new ValidationError("No file provided");
    }
    
    // Check file type
    if (!STORAGE_CONFIG.FILE_LIMITS.ACCEPTED_MIME_TYPES.includes(file.type)) {
      throw new ValidationError(ERROR_MESSAGES.DOCUMENTS.INVALID_FILE_TYPE);
    }
    
    // Check file size
    if (file.size > STORAGE_CONFIG.FILE_LIMITS.MAX_FILE_SIZE) {
      throw new ValidationError(ERROR_MESSAGES.DOCUMENTS.FILE_TOO_LARGE);
    }
    
    // Generate a document ID
    const documentId = generateUUID();
    
    // Create the document path
    const documentPath = createDocumentPath(documentId);
    
    // Upload the file to R2 in the organized structure
    const buffer = await file.arrayBuffer();
    await env.PDF_BUCKET.put(`${documentPath}/original/${file.name}`, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Process OCR in the background (async)
    this.processDocumentOCR(documentId, buffer, env).catch(error => {
      console.error(`OCR processing failed for document ${documentId}:`, error);
    });
    
    // Create the document metadata with initial values
    const document: PDFDocument = {
      id: documentId,
      name: file.name,
      size: file.size,
      pageCount: 0, // Will be updated after OCR processing
      uploadDate: new Date(),
      path: `${documentPath}/original/${file.name}`,
    };
    
    // Store the document metadata in R2
    await env.PDF_BUCKET.put(
      `${documentPath}/metadata.json`,
      JSON.stringify(document),
      {
        httpMetadata: {
          contentType: "application/json",
        },
      }
    );
    
    // Generate the document URL (points to the file endpoint)
    const documentUrl = `/api/documents/${documentId}/file`;
    
    // Return the uploaded document
    return {
      documentId: documentId,
      name: file.name,
      pageCount: 0, // Will be updated after OCR processing
      size: file.size,
      url: documentUrl,
    };
  }

  /**
   * Process OCR for a document (async background task)
   * @param documentId The document ID
   * @param buffer The PDF buffer
   * @param env Environment variables
   */
  static async processDocumentOCR(
    documentId: string,
    buffer: ArrayBuffer,
    env: Env
  ): Promise<void> {
    try {
      console.log(`Starting OCR processing for document ${documentId}`);
      
      // Extract text using Mistral OCR
      const ocrResult = await extractTextFromPDF(buffer, env);
      
      // Process the OCR result
      const processedOCR = processOCRResult(ocrResult);
      
      // Store OCR results in organized structure
      await storeOCRResults(documentId, processedOCR, env);
      
      // Update document metadata with page count
      await this.updateDocumentMetadata(documentId, {
        pageCount: processedOCR.totalPages
      }, env);
      
      console.log(`OCR processing completed for document ${documentId}. Pages: ${processedOCR.totalPages}`);
    } catch (error) {
      console.error(`OCR processing failed for document ${documentId}:`, error);
      
      // Store error information in metadata
      await this.updateDocumentMetadata(documentId, {
        ocrError: error instanceof Error ? error.message : "Unknown OCR error"
      }, env);
    }
  }

  /**
   * Update document metadata
   * @param documentId The document ID
   * @param updates Partial updates to apply
   * @param env Environment variables
   */
  static async updateDocumentMetadata(
    documentId: string,
    updates: Partial<PDFDocument & { ocrError?: string }>,
    env: Env
  ): Promise<void> {
    try {
      // Get existing metadata
      const existingDoc = await this.getDocument(documentId, env);
      
      // Merge updates
      const updatedDoc = { ...existingDoc, ...updates };
      
      // Store updated metadata
      await env.PDF_BUCKET.put(
        `documents/${documentId}/metadata.json`,
        JSON.stringify(updatedDoc),
        {
          httpMetadata: {
            contentType: "application/json",
          },
        }
      );
    } catch (error) {
      console.error(`Failed to update metadata for document ${documentId}:`, error);
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
    return await getOCRResults(documentId, env);
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
    return await getDocumentText(documentId, env);
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
    try {
      const pageNumberPadded = pageNumber.toString().padStart(3, '0');
      const pageObject = await env.PDF_BUCKET.get(
        `documents/${documentId}/ocr/pages/page-${pageNumberPadded}.md`
      );
      
      if (!pageObject) {
        return null;
      }

      return await pageObject.text();
    } catch (error) {
      console.error(`Error fetching page ${pageNumber} for document ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Get all documents
   * @param env Environment variables
   * @returns All documents
   */
  static async getDocuments(env: Env): Promise<PDFDocument[]> {
    // List all objects in the documents folder
    const objects = await env.PDF_BUCKET.list({
      prefix: `documents/`,
      delimiter: "/",
    });
    
    // Extract document IDs from the object keys
    const documentIds = new Set<string>();
    for (const object of objects.objects) {
      const parts = object.key.split("/");
      if (parts.length >= 2) {
        documentIds.add(parts[1]);
      }
    }
    
    // Fetch metadata for each document
    const documents: PDFDocument[] = [];
    for (const documentId of documentIds) {
      try {
        const metadataObject = await env.PDF_BUCKET.get(
          `documents/${documentId}/metadata.json`
        );
        
        if (metadataObject) {
          const metadata = await metadataObject.json<PDFDocument>();
          documents.push(metadata);
        }
      } catch (error) {
        console.error(`Error fetching metadata for document ${documentId}:`, error);
      }
    }
    
    // Sort documents by upload date (newest first)
    return documents.sort(
      (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
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
    // Get the document metadata
    const metadataObject = await env.PDF_BUCKET.get(
      `documents/${documentId}/metadata.json`
    );
    
    if (!metadataObject) {
      throw new NotFoundError(ERROR_MESSAGES.DOCUMENTS.NOT_FOUND);
    }
    
    const document = await metadataObject.json<PDFDocument>();
    
    return document;
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
    // Verify that the document exists
    await this.getDocument(documentId, env);
    
    // List all objects in the document folder in R2
    const objects = await env.PDF_BUCKET.list({
      prefix: `documents/${documentId}/`,
    });
    
    // Delete all objects from R2
    for (const object of objects.objects) {
      await env.PDF_BUCKET.delete(object.key);
    }
  }
}
