import {
  createDocumentPath,
  generateUUID,
  extractTextFromPDF
} from "../utils";
import {
  PDFDocument,
  UploadedDocument
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
    
    // Upload the file to R2 for backup/storage
    const buffer = await file.arrayBuffer();
    await env.PDF_BUCKET.put(`${documentPath}/${file.name}`, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Extract text from the PDF using Mistral AI
    const text = await extractTextFromPDF(buffer, env);
    
    // Store the extracted text in R2
    await env.PDF_BUCKET.put(
      `${documentPath}/text.txt`,
      text,
      {
        httpMetadata: {
          contentType: "text/plain",
        },
      }
    );
    
    // Use our generated document ID
    const finalDocumentId = documentId;
    
    // Create the document metadata
    const document: PDFDocument = {
      id: finalDocumentId,
      name: file.name,
      size: file.size,
      pageCount: 0, // We don't know the page count yet, AutoRAG handles this internally
      uploadDate: new Date(),
      path: `${documentPath}/${file.name}`,
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
    
    // Return the uploaded document
    return {
      documentId: finalDocumentId,
      name: file.name,
      pageCount: 0, // We don't know the page count yet
      size: file.size,
    };
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
