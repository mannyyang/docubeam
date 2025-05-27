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
 * Serve the actual PDF file
 * GET /api/documents/:id/file
 */
documentRoutes.get("/api/documents/:id/file", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get the document
    const document = await DocumentService.getDocument(documentId, c.env);
    
    // Get the PDF file from R2
    const pdfObject = await c.env.PDF_BUCKET.get(document.path);
    
    if (!pdfObject) {
      return c.json(formatErrorResponse("PDF file not found"), 404);
    }
    
    // Get the file content
    const pdfBuffer = await pdfObject.arrayBuffer();
    
    // Set appropriate headers for PDF file
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `inline; filename="${document.name}"`);
    c.header("Content-Length", pdfBuffer.byteLength.toString());
    
    // Return the PDF file
    return c.body(pdfBuffer);
  } catch (error: unknown) {
    console.error("Serve PDF file error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to serve PDF file"), 500);
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
 * Get OCR results for a document
 * GET /api/documents/:id/ocr
 */
documentRoutes.get("/api/documents/:id/ocr", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get OCR results
    const ocrResults = await DocumentService.getDocumentOCR(documentId, c.env);
    
    if (!ocrResults) {
      return c.json(formatErrorResponse("OCR results not available yet. Please try again later."), 404);
    }
    
    return c.json(formatSuccessResponse(ocrResults));
  } catch (error: unknown) {
    console.error("Get OCR results error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get OCR results"), 500);
  }
});

/**
 * Get extracted text for a document
 * GET /api/documents/:id/text
 */
documentRoutes.get("/api/documents/:id/text", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get extracted text
    const extractedText = await DocumentService.getDocumentExtractedText(documentId, c.env);
    
    if (!extractedText) {
      return c.json(formatErrorResponse("Extracted text not available yet. Please try again later."), 404);
    }
    
    // Return as plain text
    c.header("Content-Type", "text/markdown");
    return c.text(extractedText);
  } catch (error: unknown) {
    console.error("Get extracted text error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get extracted text"), 500);
  }
});

/**
 * Get a specific page's content
 * GET /api/documents/:id/pages/:pageNumber
 */
documentRoutes.get("/api/documents/:id/pages/:pageNumber", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    const pageNumber = parseInt(c.req.param("pageNumber"));
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      return c.json(formatErrorResponse("Invalid page number"), 400);
    }
    
    // Get page content
    const pageContent = await DocumentService.getDocumentPage(documentId, pageNumber, c.env);
    
    if (!pageContent) {
      return c.json(formatErrorResponse("Page not found or OCR not completed yet"), 404);
    }
    
    // Return as plain text
    c.header("Content-Type", "text/markdown");
    return c.text(pageContent);
  } catch (error: unknown) {
    console.error("Get page content error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get page content"), 500);
  }
});

/**
 * Get OCR processing status for a document
 * GET /api/documents/:id/ocr/status
 */
documentRoutes.get("/api/documents/:id/ocr/status", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Check if OCR results exist
    const ocrResults = await DocumentService.getDocumentOCR(documentId, c.env);
    
    if (ocrResults) {
      return c.json(formatSuccessResponse({
        status: "completed",
        totalPages: ocrResults.totalPages,
        processedAt: ocrResults.processedAt,
        hasImages: ocrResults.images.length > 0
      }));
    }
    
    // Check if document exists
    await DocumentService.getDocument(documentId, c.env);
    
    return c.json(formatSuccessResponse({
      status: "processing",
      message: "OCR processing is in progress. Please check back later."
    }));
  } catch (error: unknown) {
    console.error("Get OCR status error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get OCR status"), 500);
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
