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
  console.log(`🔄 Starting OCR extraction for PDF (${pdfBuffer.byteLength} bytes)`);
  
  // Check if API key is available
  if (!env.MISTRAL_AI_API_KEY) {
    console.error(`❌ MISTRAL_AI_API_KEY is not set in environment variables`);
    throw new Error("MISTRAL_AI_API_KEY is not configured");
  }
  console.log(`🔑 Mistral API key is available (${env.MISTRAL_AI_API_KEY.substring(0, 10)}...)`);
  
  // Convert the PDF buffer to base64
  const base64PDF = btoa(
    new Uint8Array(pdfBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
  
  console.log(`📄 PDF converted to base64 (${base64PDF.length} characters)`);

  // Create the API request using the correct Mistral OCR format
  const requestBody = {
    model: "mistral-ocr-latest",
    document: {
      type: "document_url",
      document_url: `data:application/pdf;base64,${base64PDF}`
    },
    include_image_base64: true
  };
  
  console.log(`🚀 Sending request to Mistral OCR API...`);
  
  const response = await fetch("https://api.mistral.ai/v1/ocr", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MISTRAL_AI_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  console.log(`📡 Mistral OCR API response status: ${response.status}`);
  console.log(`📡 Mistral OCR API response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Mistral OCR API error response body:`, errorText);
    
    let errorData: { error?: { message?: string } } = {};
    try {
      errorData = JSON.parse(errorText);
    } catch (parseError) {
      console.error("Failed to parse error response as JSON:", parseError);
    }
    
    throw new Error(
      `Failed to extract text from PDF: ${
        errorData.error?.message || "Unknown error"
      }`
    );
  }

  const result = (await response.json()) as MistralOCRResponse;
  console.log(`✅ Mistral OCR API success response received - ${result.pages?.length || 0} pages processed`);
  
  // Log the first page to see the structure
  if (result.pages && result.pages.length > 0) {
    console.log(`📋 First page structure:`, {
      index: result.pages[0].index,
      hasImages: result.pages[0].images?.length || 0,
      imageIds: result.pages[0].images?.map(img => img.id) || []
    });
  }
  
  return result;
}

/**
 * Process OCR results and organize them for storage
 * @param ocrResult The Mistral OCR response
 * @returns Organized OCR data for storage
 */
export function processOCRResult(ocrResult: MistralOCRResponse): ProcessedOCRResult {
  console.log(`🔄 Processing OCR results for ${ocrResult.pages.length} pages`);
  
  // Extract all text into a single markdown document
  const fullText = ocrResult.pages.map((page: MistralOCRPage) => page.markdown).join('\n\n---\n\n');
  
  // Process individual pages (ensure 1-based page numbering)
  const pages: ProcessedOCRPage[] = ocrResult.pages.map((page: MistralOCRPage) => ({
    pageNumber: page.index + 1, // Convert 0-based to 1-based
    markdown: page.markdown,
    images: page.images || [],
    dimensions: page.dimensions
  }));

  // Extract all images with metadata (ensure 1-based page numbering)
  const images: ProcessedImage[] = [];
  ocrResult.pages.forEach((page: MistralOCRPage) => {
    if (page.images && page.images.length > 0) {
      console.log(`📸 Processing ${page.images.length} images from page ${page.index + 1}`);
      page.images.forEach((image: MistralOCRImage, imageIndex: number) => {
        const processedImage = {
          id: image.id,
          pageNumber: page.index + 1, // Convert 0-based to 1-based
          imageIndex,
          boundingBox: {
            topLeftX: image.top_left_x,
            topLeftY: image.top_left_y,
            bottomRightX: image.bottom_right_x,
            bottomRightY: image.bottom_right_y
          },
          base64Data: image.image_base64
        };
        
        console.log(`🖼️ Processed image: page=${processedImage.pageNumber}, index=${processedImage.imageIndex}, id=${processedImage.id}, base64Length=${processedImage.base64Data.length}`);
        images.push(processedImage);
      });
    }
  });

  console.log(`✅ OCR processing complete - ${pages.length} pages, ${images.length} images, ${fullText.length} characters`);

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
  console.log(`💾 Storing OCR results for document ${documentId} to R2...`);
  
  const basePath = `documents/${documentId}/ocr`;

  try {
    // Store the complete OCR result
    console.log(`💾 Storing full OCR result...`);
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
    console.log(`💾 Storing extracted text...`);
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
    console.log(`💾 Storing ${processedOCR.pages.length} individual page files...`);
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
    if (processedOCR.images.length > 0) {
      console.log(`💾 Storing ${processedOCR.images.length} extracted images...`);
      for (const image of processedOCR.images) {
        const pageNumber = image.pageNumber.toString().padStart(3, '0');
        const imageNumber = (image.imageIndex + 1).toString().padStart(3, '0');
        const imagePath = `${basePath}/images/page-${pageNumber}-img-${imageNumber}.base64`;
        
        console.log(`💾 Storing image: ${imagePath} (${image.base64Data.length} chars)`);
        
        await env.PDF_BUCKET.put(
          imagePath,
          image.base64Data,
          {
            httpMetadata: {
              contentType: "text/plain",
            },
          }
        );
      }
    }

    console.log(`✅ Successfully stored all OCR results for document ${documentId} to R2`);
  } catch (error) {
    console.error(`❌ Failed to store OCR results for document ${documentId}:`, error);
    throw error;
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
    console.log(`🔍 Fetching OCR results for document ${documentId}...`);
    
    const ocrObject = await env.PDF_BUCKET.get(
      `documents/${documentId}/ocr/full-result.json`
    );
    
    if (!ocrObject) {
      console.log(`⚠️ No OCR results found for document ${documentId}`);
      return null;
    }

    const ocrResult = await ocrObject.json<ProcessedOCRResult>();
    console.log(`✅ Successfully retrieved OCR results for document ${documentId} - ${ocrResult.images.length} images`);
    return ocrResult;
  } catch (error) {
    console.error(`❌ Error fetching OCR results for document ${documentId}:`, error);
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
    console.log(`🔍 Fetching extracted text for document ${documentId}...`);
    
    const textObject = await env.PDF_BUCKET.get(
      `documents/${documentId}/ocr/extracted-text.md`
    );
    
    if (!textObject) {
      console.log(`⚠️ No extracted text found for document ${documentId}`);
      return null;
    }

    const text = await textObject.text();
    console.log(`✅ Successfully retrieved extracted text for document ${documentId} (${text.length} characters)`);
    return text;
  } catch (error) {
    console.error(`❌ Error fetching text for document ${documentId}:`, error);
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
    console.log(`🔍 Extracting PDF metadata...`);
    
    // Convert ArrayBuffer to Uint8Array for unpdf
    const pdfData = new Uint8Array(pdfBuffer);

    console.log("PDF data length:", pdfData.length);

    // Extract metadata directly using getMeta
    // This is more direct than using getDocumentProxy first
    const metaData = await getMeta(pdfData);

    console.log("✅ Metadata extracted successfully:", JSON.stringify(metaData));

    return metaData;
  } catch (error) {
    console.error("❌ Error extracting PDF metadata:", error);

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
    console.log(`🔍 Extracting PDF text using unpdf...`);
    
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
    console.error("❌ Error extracting PDF text:", error);

    // Return a fallback result
    return {
      totalPages: 0,
      text: shouldMergePages
        ? "Failed to extract text from PDF"
        : ["Failed to extract text from PDF"],
    };
  }
}
