import { vi } from 'vitest'

// Mock types for Cloudflare Workers
interface MockR2Bucket {
  put: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  list: ReturnType<typeof vi.fn>
}

interface MockD1Database {
  prepare: ReturnType<typeof vi.fn>
  exec: ReturnType<typeof vi.fn>
  dump: ReturnType<typeof vi.fn>
  batch: ReturnType<typeof vi.fn>
}

interface MockEnv {
  PDF_BUCKET: MockR2Bucket
  WAITLIST_DB: MockD1Database
  MISTRAL_AI_API_KEY: string
  CLOUDFLARE_ACCOUNT_ID: string
  CLOUDFLARE_DATABASE_ID: string
  CLOUDFLARE_API_TOKEN: string
}

// Mock R2 Bucket
export const createMockR2Bucket = () => ({
  put: vi.fn().mockResolvedValue(undefined),
  get: vi.fn().mockResolvedValue({
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
  }),
  delete: vi.fn().mockResolvedValue(undefined),
  list: vi.fn().mockResolvedValue({
    objects: [],
    truncated: false,
  }),
})

// Mock D1 Database
export const createMockD1Database = () => ({
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnThis(),
    first: vi.fn().mockResolvedValue(null),
    all: vi.fn().mockResolvedValue({ results: [] }),
    run: vi.fn().mockResolvedValue({ success: true }),
  }),
  exec: vi.fn().mockResolvedValue([]),
  dump: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
  batch: vi.fn().mockResolvedValue([]),
})

// Mock Cloudflare Environment
export const createMockEnv = (): MockEnv => ({
  PDF_BUCKET: createMockR2Bucket(),
  WAITLIST_DB: createMockD1Database(),
  MISTRAL_AI_API_KEY: 'test-mistral-key',
  CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
  CLOUDFLARE_DATABASE_ID: 'test-db-id',
  CLOUDFLARE_API_TOKEN: 'test-api-token',
})

// Mock File object for testing
export const createMockFile = (
  name: string = 'test.pdf',
  type: string = 'application/pdf',
  size: number = 1024
): File => {
  const content = new Uint8Array(size).fill(65) // Fill with 'A' characters
  const buffer = content.buffer
  
  const mockFile = {
    name,
    type,
    size,
    arrayBuffer: vi.fn().mockResolvedValue(buffer),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue('mock text'),
    slice: vi.fn(),
    lastModified: Date.now(),
    webkitRelativePath: '',
  } as unknown as File
  
  return mockFile
}

// Mock PDF buffer for testing
export const createMockPDFBuffer = (): ArrayBuffer => {
  // Simple PDF header for testing
  const pdfHeader = '%PDF-1.4\n'
  const encoder = new TextEncoder()
  return encoder.encode(pdfHeader).buffer
}

// Mock Mistral OCR API response
export const mockMistralOCRResponse = {
  pages: [
    {
      index: 0,
      markdown: '# Test Document\n\nThis is a test document with some content.',
      images: [
        {
          id: 'img-001',
          top_left_x: 100,
          top_left_y: 200,
          bottom_right_x: 300,
          bottom_right_y: 400,
          image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ],
      dimensions: {
        dpi: 200,
        height: 2200,
        width: 1700
      }
    },
    {
      index: 1,
      markdown: '## Page 2\n\nThis is the second page of the document.',
      images: [],
      dimensions: {
        dpi: 200,
        height: 2200,
        width: 1700
      }
    }
  ],
  model: 'mistral-ocr-latest',
  usage_info: {
    pages_processed: 2,
    doc_size_bytes: 1024
  }
}

// Mock processed OCR result
export const mockProcessedOCRResult = {
  totalPages: 2,
  fullText: '# Test Document\n\nThis is a test document with some content.\n\n## Page 2\n\nThis is the second page of the document.',
  pages: [
    {
      pageNumber: 1,
      markdown: '# Test Document\n\nThis is a test document with some content.',
      images: [
        {
          id: 'img-001',
          top_left_x: 100,
          top_left_y: 200,
          bottom_right_x: 300,
          bottom_right_y: 400,
          image_base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        }
      ],
      dimensions: {
        dpi: 200,
        height: 2200,
        width: 1700
      }
    },
    {
      pageNumber: 2,
      markdown: '## Page 2\n\nThis is the second page of the document.',
      images: [],
      dimensions: {
        dpi: 200,
        height: 2200,
        width: 1700
      }
    }
  ],
  images: [
    {
      id: 'img-001',
      pageNumber: 1,
      imageIndex: 0,
      boundingBox: {
        topLeftX: 100,
        topLeftY: 200,
        bottomRightX: 300,
        bottomRightY: 400
      },
      base64Data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    }
  ],
  processedAt: new Date('2024-01-01T12:00:00Z')
}

// Mock Mistral AI response (legacy - for backward compatibility)
export const mockMistralResponse = {
  text: 'This is extracted text from the PDF document.',
}

// Mock PDF metadata response
export const mockPDFMetadata = {
  info: {
    Title: 'Test Document',
    Author: 'Test Author',
    CreationDate: '2024-01-01',
    Producer: 'Test Producer',
    Creator: 'Test Creator',
  },
  metadata: {},
}

// Mock OCR status responses
export const mockOCRStatusProcessing = {
  status: 'processing',
  message: 'OCR processing is in progress. Please check back later.'
}

export const mockOCRStatusCompleted = {
  status: 'completed',
  totalPages: 2,
  processedAt: new Date('2024-01-01T12:00:00Z'),
  hasImages: true
}

export const mockOCRStatusFailed = {
  status: 'failed',
  error: 'OCR processing failed due to invalid PDF format'
}

// Helper function to create mock R2 objects for OCR structure
export const createMockOCRR2Objects = (documentId: string) => [
  { key: `documents/${documentId}/original/test.pdf` },
  { key: `documents/${documentId}/metadata.json` },
  { key: `documents/${documentId}/ocr/full-result.json` },
  { key: `documents/${documentId}/ocr/extracted-text.md` },
  { key: `documents/${documentId}/ocr/pages/page-001.md` },
  { key: `documents/${documentId}/ocr/pages/page-002.md` },
  { key: `documents/${documentId}/ocr/images/page-001-img-001.base64` },
]

// Helper function to create mock document with OCR data
export const createMockDocumentWithOCR = (documentId: string = 'test-doc-id') => ({
  id: documentId,
  name: 'test.pdf',
  size: 1024,
  pageCount: 2,
  uploadDate: new Date('2024-01-01'),
  path: `documents/${documentId}/original/test.pdf`,
})
