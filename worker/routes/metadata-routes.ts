import { Context, Hono } from "hono";
import { formatSuccessResponse, formatErrorResponse, extractPDFMetadata, extractPDFText } from "../utils";

// Create a new Hono app for metadata routes
const metadataRoutes = new Hono();

/**
 * Extract metadata from a PDF file directly (without saving to R2)
 * POST /api/metadata/extract
 */
metadataRoutes.post("/api/metadata/extract", async (c: Context<{ Bindings: Env }>) => {
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
    
    // Get the file buffer
    const buffer = await file.arrayBuffer();
    
    // Clone the buffer for each operation to avoid detached ArrayBuffer issues
    const metadataBuffer = buffer.slice(0);
    const textBuffer = buffer.slice(0);
    
    // Extract metadata from the PDF
    const pdfMetadata = await extractPDFMetadata(metadataBuffer);
    
    // Extract text from the PDF
    const pdfText = await extractPDFText(textBuffer, true);
    
    return c.json(formatSuccessResponse({
      filename: file.name,
      size: file.size,
      metadata: pdfMetadata,
      text: {
        totalPages: pdfText.totalPages,
        content: pdfText.text,
        annotations: pdfText.annotations
      }
    }));
  } catch (error: unknown) {
    console.error("Extract PDF metadata error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to extract PDF metadata"), 500);
  }
});

export default metadataRoutes;
