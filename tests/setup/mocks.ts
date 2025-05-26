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

// Mock Mistral AI response
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
