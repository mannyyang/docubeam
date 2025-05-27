import {
  getMeta,
  extractText,
  getDocumentProxy,
  getResolvedPDFJS,
} from "unpdf";
import type {
  MistralOCRResponse,
  ProcessedOCRResult,
  ProcessedOCRPage,
  ProcessedImage,
  MistralOCRPage,
  MistralOCRImage
} from "../types";

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
 * Create a folder path for a document
 * @param documentId The document ID
 * @returns The folder path
 */
export function createDocumentPath(documentId: string): string {
  return `documents/${documentId}`;
}

/**
 * Extract text from a PDF document using Mistral AI OCR
 * @param pdfBuffer The PDF buffer
 * @param env The environment
 * @returns The OCR result with pages and extracted content
 */
export async function extractTextFromPDF(
  pdfBuffer: ArrayBuffer,
  env: Env
): Promise<MistralOCRResponse> {
  // Convert the PDF buffer to base64
  const base64PDF = btoa(
    new Uint8Array(pdfBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );

  // Create the API request using the correct Mistral OCR format
  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MISTRAL_AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:application/pdf;base64,${base64PDF}`
      },
      include_image_base64: true
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

  const result = (await response.json()) as MistralOCRResponse;
  return result;
}

/**
 * Process OCR results and organize them for storage
 * @param ocrResult The Mistral OCR response
 * @returns Organized OCR data for storage
 */
export function processOCRResult(ocrResult: MistralOCRResponse): ProcessedOCRResult {
  // Extract all text into a single markdown document
  const fullText = ocrResult.pages.map((page: MistralOCRPage) => page.markdown).join('\n\n---\n\n');
  
  // Process individual pages
  const pages: ProcessedOCRPage[] = ocrResult.pages.map((page: MistralOCRPage) => ({
    pageNumber: page.index,
    markdown: page.markdown,
    images: page.images || [],
    dimensions: page.dimensions
  }));

  // Extract all images with metadata
  const images: ProcessedImage[] = [];
  ocrResult.pages.forEach((page: MistralOCRPage) => {
    if (page.images && page.images.length > 0) {
      page.images.forEach((image: MistralOCRImage, imageIndex: number) => {
        images.push({
          id: image.id,
          pageNumber: page.index,
          imageIndex,
          boundingBox: {
            topLeftX: image.top_left_x,
            topLeftY: image.top_left_y,
            bottomRightX: image.bottom_right_x,
            bottomRightY: image.bottom_right_y
          },
          base64Data: image.image_base64
        });
      });
    }
  });

  return {
    totalPages: ocrResult.pages.length,
    fullText,
    pages,
    images,
    processedAt: new Date()
  };
}

/**
 * Store OCR results in organized R2 structure
 * @param documentId The document ID
 * @param processedOCR The processed OCR result
 * @param env The environment
 */
export async function storeOCRResults(
  documentId: string,
  processedOCR: ProcessedOCRResult,
  env: Env
): Promise<void> {
  const basePath = `documents/${documentId}/ocr`;

  // Store the complete OCR result
  await env.PDF_BUCKET.put(
    `${basePath}/full-result.json`,
    JSON.stringify(processedOCR, null, 2),
    {
      httpMetadata: {
        contentType: "application/json",
      },
    }
  );

  // Store the consolidated markdown text
  await env.PDF_BUCKET.put(
    `${basePath}/extracted-text.md`,
    processedOCR.fullText,
    {
      httpMetadata: {
        contentType: "text/markdown",
      },
    }
  );

  // Store individual page markdown files
  for (const page of processedOCR.pages) {
    const pageNumber = page.pageNumber.toString().padStart(3, '0');
    await env.PDF_BUCKET.put(
      `${basePath}/pages/page-${pageNumber}.md`,
      page.markdown,
      {
        httpMetadata: {
          contentType: "text/markdown",
        },
      }
    );
  }

  // Store extracted images
  for (const image of processedOCR.images) {
    const pageNumber = image.pageNumber.toString().padStart(3, '0');
    const imageNumber = (image.imageIndex + 1).toString().padStart(3, '0');
    await env.PDF_BUCKET.put(
      `${basePath}/images/page-${pageNumber}-img-${imageNumber}.base64`,
      image.base64Data,
      {
        httpMetadata: {
          contentType: "text/plain",
        },
      }
    );
  }
}

/**
 * Get OCR results for a document
 * @param documentId The document ID
 * @param env The environment
 * @returns The processed OCR result or null if not found
 */
export async function getOCRResults(
  documentId: string,
  env: Env
): Promise<ProcessedOCRResult | null> {
  try {
    const ocrObject = await env.PDF_BUCKET.get(
      `documents/${documentId}/ocr/full-result.json`
    );
    
    if (!ocrObject) {
      return null;
    }

    const ocrResult = await ocrObject.json<ProcessedOCRResult>();
    return ocrResult;
  } catch (error) {
    console.error(`Error fetching OCR results for document ${documentId}:`, error);
    return null;
  }
}

/**
 * Get extracted text for a document
 * @param documentId The document ID
 * @param env The environment
 * @returns The extracted text or null if not found
 */
export async function getDocumentText(
  documentId: string,
  env: Env
): Promise<string | null> {
  try {
    const textObject = await env.PDF_BUCKET.get(
      `documents/${documentId}/ocr/extracted-text.md`
    );
    
    if (!textObject) {
      return null;
    }

    return await textObject.text();
  } catch (error) {
    console.error(`Error fetching text for document ${documentId}:`, error);
    return null;
  }
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
