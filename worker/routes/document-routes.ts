import { Context, Hono } from "hono";
import { DocumentService } from "../services/document-service";
import { formatSuccessResponse, formatErrorResponse, extractPDFMetadata } from "../utils";
import { API_ROUTES } from "../config";

// Create a new Hono app for document routes
const documentRoutes = new Hono();

/**
 * Upload a PDF document, process it with Mistral AI OCR, and store it in R2
 * POST /api/documents/upload
 */
documentRoutes.post(API_ROUTES.DOCUMENTS.UPLOAD, async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get the form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return c.json(formatErrorResponse("No file provided"), 400);
    }
    
    // Check file type
    if (file.type !== "application/pdf") {
      return c.json(formatErrorResponse("Invalid file type. Only PDF files are accepted"), 400);
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return c.json(formatErrorResponse("File size exceeds the maximum limit of 10MB"), 400);
    }
    
    // Upload the document using the DocumentService
    const result = await DocumentService.uploadDocument(file, c.env);
    
    // Return the document information
    return c.json(formatSuccessResponse(result));
  } catch (error: unknown) {
    console.error("Document upload error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to upload document"), 500);
  }
});

/**
 * Get all documents
 * GET /api/documents
 */
documentRoutes.get(API_ROUTES.DOCUMENTS.BASE, async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get all documents
    const documents = await DocumentService.getDocuments(c.env);
    
    return c.json(formatSuccessResponse(documents));
  } catch (error: unknown) {
    console.error("Get documents error:", error);
    return c.json(formatErrorResponse("Failed to get documents"), 500);
  }
});

/**
 * Get a document by ID
 * GET /api/documents/:id
 */
documentRoutes.get(API_ROUTES.DOCUMENTS.GET, async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get the document
    const document = await DocumentService.getDocument(documentId, c.env);
    
    return c.json(formatSuccessResponse(document));
  } catch (error: unknown) {
    console.error("Get document error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get document"), 500);
  }
});

/**
 * Extract metadata from a PDF document
 * GET /api/documents/:id/metadata
 */
documentRoutes.get("/api/documents/:id/metadata", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get the document
    const document = await DocumentService.getDocument(documentId, c.env);
    
    // Get the PDF file
    const pdfObject = await c.env.PDF_BUCKET.get(document.path);
    
    if (!pdfObject) {
      return c.json(formatErrorResponse("PDF file not found"), 404);
    }
    
    // Extract metadata from the PDF
    const pdfBuffer = await pdfObject.arrayBuffer();
    const pdfMetadata = await extractPDFMetadata(pdfBuffer);
    
    return c.json(formatSuccessResponse(pdfMetadata));
  } catch (error: unknown) {
    console.error("Extract PDF metadata error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to extract PDF metadata"), 500);
  }
});

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
documentRoutes.delete(API_ROUTES.DOCUMENTS.DELETE, async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Delete the document
    await DocumentService.deleteDocument(documentId, c.env);
    
    return c.json(formatSuccessResponse(null));
  } catch (error: unknown) {
    console.error("Delete document error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to delete document"), 500);
  }
});

export default documentRoutes;
