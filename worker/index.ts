import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { extractTextFromPDF, formatSuccessResponse, formatErrorResponse, generateUUID, createDocumentPath, extractPDFMetadata } from "./utils";
import { ChatService } from "./services/chat-service";
import { API_ROUTES } from "./config";
import { ChatRequest } from "./types";

// Create a new Hono app
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware
app.use("*", cors());

// Health check endpoint
app.get("/api/health", (c) => {
  return c.json({ status: "ok" });
});

// Public routes (no auth required)

/**
 * Upload a PDF document, process it with Mistral AI OCR, and store it in R2
 * POST /api/documents/upload
 */
app.post("/api/documents/upload", async (c) => {
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
    
    // Generate a document ID
    const documentId = generateUUID();
    
    // Create a tenant ID (in a real app, this would come from authentication)
    const tenantId = "default-tenant";
    
    // Create the document path
    const documentPath = createDocumentPath(tenantId, documentId);
    
    // Get the file buffer
    const buffer = await file.arrayBuffer();
    
    // Upload the file to R2
    await c.env.PDF_BUCKET.put(`${documentPath}/${file.name}`, buffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    // Extract text from the PDF using Mistral AI OCR
    const text = await extractTextFromPDF(buffer, c.env);
    
    // Store the extracted text in R2
    await c.env.PDF_BUCKET.put(
      `${documentPath}/text.txt`,
      text,
      {
        httpMetadata: {
          contentType: "text/plain",
        },
      }
    );
    
    // Create the document metadata
    const document = {
      id: documentId,
      name: file.name,
      size: file.size,
      uploadDate: new Date(),
      tenantId,
      path: `${documentPath}/${file.name}`,
      textPath: `${documentPath}/text.txt`,
    };
    
    // Store the document metadata in R2
    await c.env.PDF_BUCKET.put(
      `${documentPath}/metadata.json`,
      JSON.stringify(document),
      {
        httpMetadata: {
          contentType: "application/json",
        },
      }
    );
    
    // Return the document information
    return c.json(formatSuccessResponse({
      documentId,
      name: file.name,
      size: file.size,
    }));
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
app.get("/api/documents", async (c) => {
  try {
    // In a real app, we would get the tenant ID from authentication
    const tenantId = "default-tenant";
    
    // List all objects in the tenant's documents folder
    const objects = await c.env.PDF_BUCKET.list({
      prefix: `documents/${tenantId}/`,
      delimiter: "/",
    });
    
    // Extract document IDs from the object keys
    const documentIds = new Set<string>();
    for (const object of objects.objects) {
      const parts = object.key.split("/");
      if (parts.length >= 3) {
        documentIds.add(parts[2]);
      }
    }
    
    // Define the document type
    interface DocumentMetadata {
      id: string;
      name: string;
      size: number;
      uploadDate: string;
      tenantId: string;
      path: string;
      textPath: string;
    }
    
    // Fetch metadata for each document
    const documents: DocumentMetadata[] = [];
    for (const documentId of documentIds) {
      try {
        const metadataObject = await c.env.PDF_BUCKET.get(
          `documents/${tenantId}/${documentId}/metadata.json`
        );
        
        if (metadataObject) {
          const metadata = await metadataObject.json() as DocumentMetadata;
          documents.push(metadata);
        }
      } catch (error) {
        console.error(`Error fetching metadata for document ${documentId}:`, error);
      }
    }
    
    // Sort documents by upload date (newest first)
    documents.sort(
      (a: DocumentMetadata, b: DocumentMetadata) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );
    
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
app.get("/api/documents/:id", async (c) => {
  try {
    const documentId = c.req.param("id");
    const tenantId = "default-tenant"; // In a real app, this would come from auth
    
    // Get the document metadata
    const metadataObject = await c.env.PDF_BUCKET.get(
      `documents/${tenantId}/${documentId}/metadata.json`
    );
    
    if (!metadataObject) {
      return c.json(formatErrorResponse("Document not found"), 404);
    }
    
    const document = await metadataObject.json();
    
    return c.json(formatSuccessResponse(document));
  } catch (error: unknown) {
    console.error("Get document error:", error);
    return c.json(formatErrorResponse("Failed to get document"), 500);
  }
});

/**
 * Extract metadata from a PDF document
 * GET /api/documents/:id/metadata
 */
app.get("/api/documents/:id/metadata", async (c) => {
  try {
    const documentId = c.req.param("id");
    const tenantId = "default-tenant"; // In a real app, this would come from auth
    
    // Get the document metadata
    const metadataObject = await c.env.PDF_BUCKET.get(
      `documents/${tenantId}/${documentId}/metadata.json`
    );
    
    if (!metadataObject) {
      return c.json(formatErrorResponse("Document not found"), 404);
    }
    
    const document = await metadataObject.json();
    
    // Get the PDF file
    const pdfObject = await c.env.PDF_BUCKET.get((document as { path: string }).path);
    
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
app.delete("/api/documents/:id", async (c) => {
  try {
    const documentId = c.req.param("id");
    const tenantId = "default-tenant"; // In a real app, this would come from auth
    
    // Check if the document exists
    const metadataObject = await c.env.PDF_BUCKET.get(
      `documents/${tenantId}/${documentId}/metadata.json`
    );
    
    if (!metadataObject) {
      return c.json(formatErrorResponse("Document not found"), 404);
    }
    
    // List all objects in the document folder
    const objects = await c.env.PDF_BUCKET.list({
      prefix: `documents/${tenantId}/${documentId}/`,
    });
    
    // Delete all objects
    for (const object of objects.objects) {
      await c.env.PDF_BUCKET.delete(object.key);
    }
    
    return c.json(formatSuccessResponse(null));
  } catch (error: unknown) {
    console.error("Delete document error:", error);
    return c.json(formatErrorResponse("Failed to delete document"), 500);
  }
});

// Define the chat message schema
const chatMessageSchema = z.object({
  documentId: z.string().min(1),
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

/**
 * Send a chat message
 * POST /api/chat/message
 */
app.post(API_ROUTES.CHAT.SEND_MESSAGE, zValidator("json", chatMessageSchema), async (c) => {
  try {
    // In a real app, this would come from auth
    const userId = "user-123";
    const tenantId = "default-tenant";
    
    // Get the request body
    const body = await c.req.json<z.infer<typeof chatMessageSchema>>();
    
    // Create the chat request
    const chatRequest: ChatRequest = {
      documentId: body.documentId,
      message: body.message,
      conversationId: body.conversationId,
    };
    
    // Send the message
    const result = await ChatService.sendMessage(
      chatRequest,
      userId,
      tenantId,
      c.env
    );
    
    return c.json(formatSuccessResponse(result));
  } catch (error: unknown) {
    console.error("Chat message error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to send message"), 500);
  }
});

/**
 * Get conversations
 * GET /api/chat/conversations
 */
app.get(API_ROUTES.CHAT.GET_CONVERSATIONS, async (c) => {
  try {
    // In a real app, this would come from auth
    const userId = "user-123";
    const tenantId = "default-tenant";
    
    // Get the document ID from the query params (optional)
    const documentId = c.req.query("documentId");
    
    // Get the conversations
    const conversations = await ChatService.getConversations(
      userId,
      tenantId,
      c.env,
      documentId
    );
    
    return c.json(formatSuccessResponse(conversations));
  } catch (error: unknown) {
    console.error("Get conversations error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to get conversations"), 500);
  }
});

/**
 * Get messages for a conversation
 * GET /api/chat/messages/:conversationId
 */
app.get(API_ROUTES.CHAT.GET_MESSAGES, async (c) => {
  try {
    // In a real app, this would come from auth
    const userId = "user-123";
    
    // Get the conversation ID from the params
    const conversationId = c.req.param("conversationId");
    
    if (!conversationId) {
      return c.json(formatErrorResponse("Conversation ID is required"), 400);
    }
    
    // Get the messages
    const messages = await ChatService.getMessages(
      conversationId,
      userId,
      c.env
    );
    
    return c.json(formatSuccessResponse(messages));
  } catch (error: unknown) {
    console.error("Get messages error:", error);
    
    if (error instanceof Error) {
      if (error.name === "NotFoundError") {
        return c.json(formatErrorResponse(error.message), 404);
      }
      
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to get messages"), 500);
  }
});

/**
 * Extract metadata from a PDF file directly (without saving to R2)
 * POST /api/metadata/extract
 */
app.post("/api/metadata/extract", async (c) => {
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
    
    // Extract metadata from the PDF
    const pdfMetadata = await extractPDFMetadata(buffer);
    
    return c.json(formatSuccessResponse({
      filename: file.name,
      size: file.size,
      metadata: pdfMetadata
    }));
  } catch (error: unknown) {
    console.error("Extract PDF metadata error:", error);
    
    if (error instanceof Error) {
      return c.json(formatErrorResponse(error.message), 500);
    }
    
    return c.json(formatErrorResponse("Failed to extract PDF metadata"), 500);
  }
});

// Export the Hono app as the default export
export default app;
