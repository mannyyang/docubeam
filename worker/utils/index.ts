import { SignJWT } from "jose";
import { AuthTokens, JWTPayload } from "../types";
import {
  getMeta,
  extractText,
  getDocumentProxy,
  getResolvedPDFJS,
} from "unpdf";

/**
 * Generate a unique ID
 * @returns A unique ID string
 */
export function generateId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/**
 * Generate a UUID v4
 * @returns A UUID v4 string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate JWT tokens for authentication
 * @param payload The JWT payload
 * @param secret The JWT secret
 * @returns Access and refresh tokens
 */
export async function generateTokens(
  payload: Omit<JWTPayload, "iat" | "exp">,
  secret: string
): Promise<AuthTokens> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 60 * 60 * 24; // 1 day in seconds
  const refreshExpiresIn = 60 * 60 * 24 * 7; // 7 days in seconds

  // Create the access token
  const accessToken = await new SignJWT({
    ...payload,
    iat: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(now + expiresIn)
    .sign(new TextEncoder().encode(secret));

  // Create the refresh token
  const refreshToken = await new SignJWT({
    ...payload,
    iat: now,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(now + refreshExpiresIn)
    .sign(new TextEncoder().encode(secret));

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Create a folder path for a tenant's document
 * @param tenantId The tenant ID
 * @param documentId The document ID
 * @returns The folder path
 */
export function createDocumentPath(
  tenantId: string,
  documentId: string
): string {
  return `documents/${tenantId}/${documentId}`;
}

/**
 * Extract text from a PDF document using Mistral AI
 * @param pdfBuffer The PDF buffer
 * @param env The environment
 * @returns The extracted text
 */
export async function extractTextFromPDF(
  pdfBuffer: ArrayBuffer,
  env: Env
): Promise<string> {
  // Convert the PDF buffer to base64
  const base64PDF = btoa(
    new Uint8Array(pdfBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  // Create the API request
  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MISTRAL_AI_API_KEY}`,
    },
    body: JSON.stringify({
      file: base64PDF,
      model: "mistral-large-latest",
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as {
      error?: { message?: string };
    };
    throw new Error(
      `Failed to extract text from PDF: ${
        errorData.error?.message || "Unknown error"
      }`
    );
  }

  const result = (await response.json()) as { text: string };
  return result.text;
}

/**
 * Format an API response
 * @param data The response data
 * @returns A formatted API response
 */
export function formatSuccessResponse<T>(data: T) {
  return {
    status: "success" as const,
    data,
  };
}

/**
 * Format an API error response
 * @param error The error message
 * @returns A formatted API error response
 */
export function formatErrorResponse(error: string) {
  return {
    status: "error" as const,
    error,
  };
}

/**
 * Extract metadata from a PDF document using unpdf
 * @param pdfBuffer The PDF buffer
 * @returns The extracted metadata
 */
export async function extractPDFMetadata(pdfBuffer: ArrayBuffer): Promise<{
  info: Record<string, unknown>;
  metadata: Record<string, unknown>;
}> {
  try {
    // Convert ArrayBuffer to Uint8Array for unpdf
    const pdfData = new Uint8Array(pdfBuffer);

    console.log("PDF data length:", pdfData.length);

    // Extract metadata directly using getMeta
    // This is more direct than using getDocumentProxy first
    const metaData = await getMeta(pdfData);

    console.log("Metadata extracted successfully:", JSON.stringify(metaData));

    return metaData;
  } catch (error) {
    console.error("Error extracting PDF metadata:", error);

    // Create a fallback metadata object
    const fallbackMetadata = {
      info: {
        Title: "Unknown",
        Author: "Unknown",
        CreationDate: "Unknown",
        Producer: "Unknown",
        Creator: "Unknown",
        Error: error instanceof Error ? error.message : "Unknown error",
      },
      metadata: {},
    };

    return fallbackMetadata;
  }
}

/**
 * Extract text and annotations from a PDF document using unpdf
 * @param pdfBuffer The PDF buffer
 * @param shouldMergePages Whether to merge all pages into a single string
 * @returns The extracted text, annotations, and total pages
 */
export async function extractPDFText(
  pdfBuffer: ArrayBuffer,
  shouldMergePages: boolean = true
): Promise<{
  totalPages: number;
  text: string | string[];
  annotations?: string[];
}> {
  try {
    // Convert ArrayBuffer to Uint8Array for unpdf
    const pdfData = new Uint8Array(pdfBuffer);

    console.log("PDF data length:", pdfData.length);

    // Get the document proxy
    const pdf = await getDocumentProxy(pdfData);

    console.log("PDF document proxy created successfully");

    // Extract text from the PDF
    let textResult;
    if (shouldMergePages) {
      textResult = await extractText(pdf, { mergePages: true });
    } else {
      textResult = await extractText(pdf, { mergePages: false });
    }

    console.log(
      `Text extracted successfully. Total pages: ${textResult.totalPages}`
    );

    // Try to extract annotations
    const annotations: string[] = [];

    // Get the PDF.js module to access more advanced features
    await getResolvedPDFJS();

    // Loop through each page to extract annotations
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const tc = await page.getAnnotations();
        annotations.push(...tc);

        console.log(JSON.stringify(tc, null, 2));

      } catch (pageError) {
        console.error(
          `Error extracting annotations from page ${i}:`,
          pageError
        );
      }
    }

    console.log(`Annotations extracted: ${annotations.length}`);

    return {
      ...textResult,
      annotations: annotations.length > 0 ? annotations : undefined,
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);

    // Return a fallback result
    return {
      totalPages: 0,
      text: shouldMergePages
        ? "Failed to extract text from PDF"
        : ["Failed to extract text from PDF"],
    };
  }
}
