import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createMockEnv, 
  createMockFile, 
  mockMistralOCRResponse, 
  mockProcessedOCRResult,
  createMockDocumentWithOCR,
  createMockOCRR2Objects
} from '../../setup/mocks'

// Mock the utils module first
vi.mock('../../../worker/utils', () => ({
  createDocumentPath: vi.fn((id: string) => `documents/${id}`),
  generateUUID: vi.fn(() => 'test-document-id'),
  extractTextFromPDF: vi.fn().mockResolvedValue(mockMistralOCRResponse),
  processOCRResult: vi.fn().mockReturnValue(mockProcessedOCRResult),
  storeOCRResults: vi.fn().mockResolvedValue(undefined),
  getOCRResults: vi.fn().mockResolvedValue(mockProcessedOCRResult),
  getDocumentText: vi.fn().mockResolvedValue('# Test Document\n\nThis is extracted text from the PDF.'),
}))

// Mock the error classes
vi.mock('../../../worker/middleware/error', () => ({
  ValidationError: class ValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  },
  NotFoundError: class NotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'NotFoundError'
    }
  },
}))

// Import after mocking
const { DocumentService } = await import('../../../worker/services/document-service')
const { ValidationError, NotFoundError } = await import('../../../worker/middleware/error')

describe('DocumentService', () => {
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('uploadDocument', () => {
    it('should successfully upload a valid PDF file with OCR processing', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      
      const result = await DocumentService.uploadDocument(file, mockEnv as any)

      expect(result).toEqual({
        documentId: 'test-document-id',
        name: 'test.pdf',
        pageCount: 0, // Initially 0, updated after OCR
        size: 1024,
        url: '/api/documents/test-document-id/file',
      })

      // Verify R2 operations - original file and metadata
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledTimes(2) // Original PDF + metadata
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-document-id/original/test.pdf',
        expect.any(ArrayBuffer),
        { httpMetadata: { contentType: 'application/pdf' } }
      )
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-document-id/metadata.json',
        expect.any(String),
        { httpMetadata: { contentType: 'application/json' } }
      )
    })

    it('should reject non-PDF files', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)

      await expect(
        DocumentService.uploadDocument(file, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })

    it('should reject files larger than 10MB', async () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024)

      await expect(
        DocumentService.uploadDocument(file, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })

    it('should reject when no file is provided', async () => {
      await expect(
        DocumentService.uploadDocument(null as any, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('processDocumentOCR', () => {
    it('should process OCR and return text URL', async () => {
      const documentId = 'test-doc-id'
      const buffer = new ArrayBuffer(1024)

      const textUrl = await DocumentService.processDocumentOCR(documentId, buffer, mockEnv as any)

      expect(textUrl).toBe('/api/documents/test-doc-id/text')
      
      // Verify OCR processing was called
      const { extractTextFromPDF, processOCRResult, storeOCRResults } = await import('../../../worker/utils')
      expect(extractTextFromPDF).toHaveBeenCalledWith(buffer, mockEnv)
      expect(processOCRResult).toHaveBeenCalledWith(mockMistralOCRResponse)
      expect(storeOCRResults).toHaveBeenCalledWith(documentId, mockProcessedOCRResult, mockEnv)
    })

    it('should handle OCR processing errors', async () => {
      const documentId = 'test-doc-id'
      const buffer = new ArrayBuffer(1024)
      
      // Mock OCR failure
      const { extractTextFromPDF } = await import('../../../worker/utils')
      vi.mocked(extractTextFromPDF).mockRejectedValueOnce(new Error('OCR failed'))

      await expect(
        DocumentService.processDocumentOCR(documentId, buffer, mockEnv as any)
      ).rejects.toThrow('OCR failed')
    })
  })

  describe('getDocumentOCR', () => {
    it('should return OCR results when available', async () => {
      const result = await DocumentService.getDocumentOCR('test-doc-id', mockEnv as any)

      expect(result).toEqual(mockProcessedOCRResult)
      
      const { getOCRResults } = await import('../../../worker/utils')
      expect(getOCRResults).toHaveBeenCalledWith('test-doc-id', mockEnv)
    })

    it('should return null when OCR results not available', async () => {
      const { getOCRResults } = await import('../../../worker/utils')
      vi.mocked(getOCRResults).mockResolvedValueOnce(null)

      const result = await DocumentService.getDocumentOCR('test-doc-id', mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('getDocumentExtractedText', () => {
    it('should return extracted text when available', async () => {
      const result = await DocumentService.getDocumentExtractedText('test-doc-id', mockEnv as any)

      expect(result).toBe('# Test Document\n\nThis is extracted text from the PDF.')
      
      const { getDocumentText } = await import('../../../worker/utils')
      expect(getDocumentText).toHaveBeenCalledWith('test-doc-id', mockEnv)
    })

    it('should return null when text not available', async () => {
      const { getDocumentText } = await import('../../../worker/utils')
      vi.mocked(getDocumentText).mockResolvedValueOnce(null)

      const result = await DocumentService.getDocumentExtractedText('test-doc-id', mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('getDocumentPage', () => {
    it('should return page content when available', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        text: vi.fn().mockResolvedValue('# Page 1 Content\n\nThis is page 1.')
      })

      const result = await DocumentService.getDocumentPage('test-doc-id', 1, mockEnv as any)

      expect(result).toBe('# Page 1 Content\n\nThis is page 1.')
      expect(mockEnv.PDF_BUCKET.get).toHaveBeenCalledWith(
        'documents/test-doc-id/ocr/pages/page-001.md'
      )
    })

    it('should return null when page not found', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      const result = await DocumentService.getDocumentPage('test-doc-id', 1, mockEnv as any)

      expect(result).toBeNull()
    })

    it('should handle page numbers correctly with padding', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        text: vi.fn().mockResolvedValue('Page content')
      })

      await DocumentService.getDocumentPage('test-doc-id', 15, mockEnv as any)

      expect(mockEnv.PDF_BUCKET.get).toHaveBeenCalledWith(
        'documents/test-doc-id/ocr/pages/page-015.md'
      )
    })
  })

  describe('getDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      mockEnv.PDF_BUCKET.list.mockResolvedValue({
        objects: [],
        truncated: false,
      })

      const result = await DocumentService.getDocuments(mockEnv as any)

      expect(result).toEqual([])
      expect(mockEnv.PDF_BUCKET.list).toHaveBeenCalledWith({
        prefix: 'documents/',
        delimiter: '/',
      })
    })

    it('should return documents with OCR data when they exist', async () => {
      const mockDocument = createMockDocumentWithOCR('test-doc-1')

      mockEnv.PDF_BUCKET.list.mockResolvedValue({
        objects: createMockOCRR2Objects('test-doc-1'),
        truncated: false,
      })

      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockDocument),
      })

      const result = await DocumentService.getDocuments(mockEnv as any)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockDocument)
      expect(result[0].path).toContain('/original/')
    })
  })

  describe('getDocument', () => {
    it('should return document when it exists', async () => {
      const mockDocument = createMockDocumentWithOCR('test-doc-1')

      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockDocument),
      })

      const result = await DocumentService.getDocument('test-doc-1', mockEnv as any)

      expect(result).toEqual(mockDocument)
      expect(mockEnv.PDF_BUCKET.get).toHaveBeenCalledWith(
        'documents/test-doc-1/metadata.json'
      )
    })

    it('should throw NotFoundError when document does not exist', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      await expect(
        DocumentService.getDocument('non-existent', mockEnv as any)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteDocument', () => {
    it('should successfully delete an existing document with OCR data', async () => {
      const mockDocument = createMockDocumentWithOCR('test-doc-1')

      // Mock document exists
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockDocument),
      })

      // Mock list objects for deletion (including OCR files)
      mockEnv.PDF_BUCKET.list.mockResolvedValue({
        objects: createMockOCRR2Objects('test-doc-1'),
        truncated: false,
      })

      await DocumentService.deleteDocument('test-doc-1', mockEnv as any)

      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledTimes(7) // All OCR files
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/original/test.pdf')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/metadata.json')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/ocr/full-result.json')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/ocr/extracted-text.md')
    })

    it('should throw NotFoundError when trying to delete non-existent document', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      await expect(
        DocumentService.deleteDocument('non-existent', mockEnv as any)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateDocumentMetadata', () => {
    it('should update document metadata with OCR results', async () => {
      const existingDoc = createMockDocumentWithOCR('test-doc-id')
      
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(existingDoc),
      })

      await DocumentService.updateDocumentMetadata('test-doc-id', {
        pageCount: 5
      }, mockEnv as any)

      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-doc-id/metadata.json',
        expect.stringContaining('"pageCount":5'),
        { httpMetadata: { contentType: 'application/json' } }
      )
    })

    it('should handle metadata update errors gracefully', async () => {
      mockEnv.PDF_BUCKET.get.mockRejectedValue(new Error('R2 error'))

      // Should not throw, just log error
      await expect(
        DocumentService.updateDocumentMetadata('test-doc-id', { pageCount: 5 }, mockEnv as any)
      ).resolves.toBeUndefined()
    })
  })
})
