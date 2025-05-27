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
        hasImages: ocrResults.images.length > 0,
        imageCount: ocrResults.images.length
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
 * Get list of extracted images for a document
 * GET /api/documents/:id/images
 */
documentRoutes.get("/api/documents/:id/images", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    
    // Get OCR results to access image metadata
    const ocrResults = await DocumentService.getDocumentOCR(documentId, c.env);
    
    if (!ocrResults) {
      return c.json(formatErrorResponse("OCR results not available yet. Please try again later."), 404);
    }
    
    // Return image metadata with URLs
    const images = ocrResults.images.map((image) => ({
      id: image.id,
      pageNumber: image.pageNumber,
      imageIndex: image.imageIndex,
      boundingBox: image.boundingBox,
      url: `/api/documents/${documentId}/images/${image.pageNumber}/${image.imageIndex + 1}`
    }));
    
    return c.json(formatSuccessResponse({
      totalImages: images.length,
      images: images
    }));
  } catch (error: unknown) {
    console.error("Get images list error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get images list"), 500);
  }
});

/**
 * Serve a specific extracted image
 * GET /api/documents/:id/images/:pageNumber/:imageNumber
 */
documentRoutes.get("/api/documents/:id/images/:pageNumber/:imageNumber", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    const pageNumber = parseInt(c.req.param("pageNumber"));
    const imageNumber = parseInt(c.req.param("imageNumber"));
    
    console.log(`🖼️ Serving image: document=${documentId}, page=${pageNumber}, image=${imageNumber}`);
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      return c.json(formatErrorResponse("Invalid page number"), 400);
    }
    
    if (isNaN(imageNumber) || imageNumber < 1) {
      return c.json(formatErrorResponse("Invalid image number"), 400);
    }
    
    // Check if document exists
    await DocumentService.getDocument(documentId, c.env);
    
    // Construct the image path in R2
    const pageNumberPadded = pageNumber.toString().padStart(3, '0');
    const imageNumberPadded = imageNumber.toString().padStart(3, '0');
    const imagePath = `documents/${documentId}/ocr/images/page-${pageNumberPadded}-img-${imageNumberPadded}.base64`;
    
    console.log(`🔍 Looking for image at path: ${imagePath}`);
    
    // Get the image from R2
    const imageObject = await c.env.PDF_BUCKET.get(imagePath);
    
    if (!imageObject) {
      console.log(`❌ Image not found at path: ${imagePath}`);
      return c.json(formatErrorResponse("Image not found"), 404);
    }
    
    console.log(`✅ Image found, size: ${imageObject.size} bytes`);
    
    // Get the base64 data
    const base64Data = await imageObject.text();
    console.log(`📄 Base64 data length: ${base64Data.length} characters`);
    console.log(`📄 Base64 data preview: ${base64Data.substring(0, 100)}...`);
    
    try {
      // Handle different base64 formats
      let cleanBase64 = base64Data;
      
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      if (cleanBase64.includes(',')) {
        const parts = cleanBase64.split(',');
        if (parts.length > 1) {
          cleanBase64 = parts[1];
          console.log(`🧹 Removed data URL prefix, new length: ${cleanBase64.length}`);
        }
      }
      
      // Remove all whitespace characters
      cleanBase64 = cleanBase64.replace(/\s/g, '');
      console.log(`🧹 Cleaned base64 data length: ${cleanBase64.length} characters`);
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        console.error(`❌ Invalid base64 format detected`);
        return c.json(formatErrorResponse("Invalid image data format"), 500);
      }
      
      // Decode base64 to binary
      let bytes: Uint8Array;
      try {
        const binaryString = atob(cleanBase64);
        bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        console.log(`🔄 Successfully decoded to ${bytes.length} bytes`);
      } catch (atobError) {
        console.error(`❌ atob() failed:`, atobError);
        return c.json(formatErrorResponse("Failed to decode base64 data"), 500);
      }
      
      // Validate that we have actual image data
      if (bytes.length === 0) {
        console.error(`❌ Decoded image has 0 bytes`);
        return c.json(formatErrorResponse("Empty image data"), 500);
      }
      
      // Detect image format from the first few bytes
      let contentType = "image/png"; // Default
      let fileExtension = "png";
      
      if (bytes.length >= 4) {
        const header = Array.from(bytes.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join('');
        console.log(`🔍 Image header bytes: ${header}`);
        
        // Check for PNG signature (89 50 4E 47)
        if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
          contentType = "image/png";
          fileExtension = "png";
        }
        // Check for JPEG signature (FF D8)
        else if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
          contentType = "image/jpeg";
          fileExtension = "jpg";
        }
        // Check for WebP signature (52 49 46 46)
        else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
          contentType = "image/webp";
          fileExtension = "webp";
        }
        // Check for GIF signature (47 49 46)
        else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
          contentType = "image/gif";
          fileExtension = "gif";
        }
        else {
          console.log(`⚠️ Unknown image format, using PNG as default`);
        }
      }
      
      console.log(`🎨 Detected content type: ${contentType}`);
      
      // Set appropriate headers for image
      c.header("Content-Type", contentType);
      c.header("Content-Disposition", `inline; filename="page-${pageNumber}-image-${imageNumber}.${fileExtension}"`);
      c.header("Content-Length", bytes.length.toString());
      c.header("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
      c.header("Access-Control-Allow-Origin", "*"); // Allow CORS
      
      console.log(`✅ Serving image with ${bytes.length} bytes as ${contentType}`);
      
      // Return the image
      return c.body(bytes);
      
    } catch (decodeError) {
      console.error(`❌ Failed to process image data:`, decodeError);
      console.error(`❌ Error details:`, {
        name: decodeError instanceof Error ? decodeError.name : 'Unknown',
        message: decodeError instanceof Error ? decodeError.message : String(decodeError),
        stack: decodeError instanceof Error ? decodeError.stack : 'No stack trace'
      });
      return c.json(formatErrorResponse("Failed to decode image data"), 500);
    }
  } catch (error: unknown) {
    console.error("Serve image error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to serve image"), 500);
  }
});

/**
 * Get images for a specific page
 * GET /api/documents/:id/pages/:pageNumber/images
 */
documentRoutes.get("/api/documents/:id/pages/:pageNumber/images", async (c: Context<{ Bindings: Env }>) => {
  try {
    const documentId = c.req.param("id");
    const pageNumber = parseInt(c.req.param("pageNumber"));
    
    if (isNaN(pageNumber) || pageNumber < 1) {
      return c.json(formatErrorResponse("Invalid page number"), 400);
    }
    
    // Get OCR results to access image metadata
    const ocrResults = await DocumentService.getDocumentOCR(documentId, c.env);
    
    if (!ocrResults) {
      return c.json(formatErrorResponse("OCR results not available yet. Please try again later."), 404);
    }
    
    // Filter images for the specific page
    const pageImages = ocrResults.images
      .filter(image => image.pageNumber === pageNumber)
      .map((image) => ({
        id: image.id,
        pageNumber: image.pageNumber,
        imageIndex: image.imageIndex,
        boundingBox: image.boundingBox,
        url: `/api/documents/${documentId}/images/${image.pageNumber}/${image.imageIndex + 1}`
      }));
    
    return c.json(formatSuccessResponse({
      pageNumber: pageNumber,
      totalImages: pageImages.length,
      images: pageImages
    }));
  } catch (error: unknown) {
    console.error("Get page images error:", error);
    
    if (error instanceof Error && error.name === "NotFoundError") {
      return c.json(formatErrorResponse(error.message), 404);
    }
    
    return c.json(formatErrorResponse("Failed to get page images"), 500);
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
