import { API_ENDPOINTS } from "../config/app-config";
import { APIResponse, UploadResponse, ChatResponse, PDFDocument } from "../types";

/**
 * Service for handling API calls to the backend
 */
export class ApiService {
  /**
   * Upload a PDF document
   */
  static async uploadDocument(file: File): Promise<APIResponse<UploadResponse>> {
    try {
      console.log(`Uploading file: ${file.name}`);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.UPLOAD, {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to upload document");
      }
      
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      return {
        status: "error",
        error: "Failed to upload document. Please try again.",
      };
    }
  }

  /**
   * Get all documents for the current user
   */
  static async getDocuments(): Promise<APIResponse<PDFDocument[]>> {
    try {
      console.log("Fetching documents");
      
      const response = await fetch(API_ENDPOINTS.DOCUMENTS.BASE);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch documents");
      }
      
      // Convert uploadDate strings to Date objects
      if (data.status === "success" && Array.isArray(data.data)) {
        data.data = data.data.map((doc: Partial<PDFDocument> & { uploadDate: string }) => ({
          ...doc,
          uploadDate: new Date(doc.uploadDate),
        }));
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return {
        status: "error",
        error: "Failed to fetch documents. Please try again.",
      };
    }
  }

  /**
   * Delete a document
   */
  static async deleteDocument(documentId: string): Promise<APIResponse<void>> {
    try {
      console.log(`Deleting document: ${documentId}`);
      
      const deleteUrl = API_ENDPOINTS.DOCUMENTS.DELETE.replace(':id', documentId);
      const response = await fetch(deleteUrl, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete document");
      }
      
      return data;
    } catch (error) {
      console.error("Error deleting document:", error);
      return {
        status: "error",
        error: "Failed to delete document. Please try again.",
      };
    }
  }

  /**
   * Send a message to chat with a document
   */
  /**
   * Get a document by ID
   */
  static async getDocument(documentId: string): Promise<APIResponse<PDFDocument>> {
    try {
      console.log(`Fetching document: ${documentId}`);
      
      const url = API_ENDPOINTS.DOCUMENTS.GET.replace(':id', documentId);
      const response = await fetch(url);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch document");
      }
      
      // Convert uploadDate string to Date object
      if (data.status === "success" && data.data) {
        data.data.uploadDate = new Date(data.data.uploadDate);
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching document:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to fetch document",
      };
    }
  }

  /**
   * Get PDF metadata for a stored document
   */
  static async getPDFMetadata(documentId: string): Promise<APIResponse<Record<string, unknown>>> {
    try {
      console.log(`Fetching metadata for document: ${documentId}`);
      
      const url = `/api/documents/${documentId}/metadata`;
      const response = await fetch(url);
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch PDF metadata");
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching PDF metadata:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to fetch PDF metadata",
      };
    }
  }
  
  /**
   * Extract metadata directly from a PDF file without storing it
   */
  static async extractPDFMetadata(file: File): Promise<APIResponse<{
    filename: string;
    size: number;
    metadata: {
      info: Record<string, unknown>;
      metadata: Record<string, unknown>;
    };
    text: {
      totalPages: number;
      content: string | string[];
      annotations?: string[];
    };
  }>> {
    try {
      console.log(`Extracting metadata from file: ${file.name}`);
      
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/metadata/extract", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract PDF metadata");
      }
      
      return data;
    } catch (error) {
      console.error("Error extracting PDF metadata:", error);
      return {
        status: "error",
        error: error instanceof Error ? error.message : "Failed to extract PDF metadata",
      };
    }
  }

  /**
   * Send a message to chat with a document
   */
  static async sendChatMessage(
    documentId: string,
    message: string
  ): Promise<APIResponse<ChatResponse>> {
    try {
      console.log(`Sending message for document ${documentId}: ${message}`);
      
      const response = await fetch(API_ENDPOINTS.CHAT.SEND_MESSAGE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          message,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }
      
      // Convert timestamp string to Date object
      if (data.status === "success" && data.data?.message) {
        data.data.message.timestamp = new Date(data.data.message.timestamp);
      }
      
      return data;
    } catch (error) {
      console.error("Error sending chat message:", error);
      return {
        status: "error",
        error: "Failed to send message. Please try again.",
      };
    }
  }
}
