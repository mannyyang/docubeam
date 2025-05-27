import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  createDocumentPath, 
  generateUUID, 
  processOCRResult,
  formatSuccessResponse,
  formatErrorResponse
} from '../../../worker/utils'
import { mockMistralOCRResponse, mockProcessedOCRResult } from '../../setup/mocks'

// Mock crypto.randomUUID for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
})

describe('Document Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createDocumentPath', () => {
    it('should create correct document path', () => {
      const documentId = 'test-doc-123'
      const path = createDocumentPath(documentId)
      
      expect(path).toBe('documents/test-doc-123')
    })

    it('should handle different document IDs', () => {
      const documentId = 'another-doc-456'
      const path = createDocumentPath(documentId)
      
      expect(path).toBe('documents/another-doc-456')
    })
  })

  describe('generateUUID', () => {
    it('should generate a UUID string', () => {
      const uuid = generateUUID()
      
      expect(typeof uuid).toBe('string')
      expect(uuid.length).toBeGreaterThan(0)
      expect(uuid).toBe('test-uuid-123')
    })

    it('should generate unique UUIDs on multiple calls', () => {
      vi.mocked(crypto.randomUUID)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2')

      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      
      expect(uuid1).toBe('uuid-1')
      expect(uuid2).toBe('uuid-2')
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('processOCRResult', () => {
    it('should process Mistral OCR response correctly', () => {
      const result = processOCRResult(mockMistralOCRResponse)
      
      expect(result.totalPages).toBe(2)
      expect(result.pages).toHaveLength(2)
      expect(result.images).toHaveLength(1)
      expect(result.fullText).toContain('# Test Document')
      expect(result.fullText).toContain('## Page 2')
      expect(result.processedAt).toBeInstanceOf(Date)
    })

    it('should convert 0-based page indices to 1-based page numbers', () => {
      const result = processOCRResult(mockMistralOCRResponse)
      
      expect(result.pages[0].pageNumber).toBe(1) // 0-based index 0 -> 1-based page 1
      expect(result.pages[1].pageNumber).toBe(2) // 0-based index 1 -> 1-based page 2
    })

    it('should handle pages with images correctly', () => {
      const result = processOCRResult(mockMistralOCRResponse)
      
      const imageOnPage1 = result.images[0]
      expect(imageOnPage1.pageNumber).toBe(1)
      expect(imageOnPage1.imageIndex).toBe(0)
      expect(imageOnPage1.id).toBe('img-001')
      expect(imageOnPage1.boundingBox).toEqual({
        topLeftX: 100,
        topLeftY: 200,
        bottomRightX: 300,
        bottomRightY: 400
      })
    })

    it('should combine all page text with separators', () => {
      const result = processOCRResult(mockMistralOCRResponse)
      
      expect(result.fullText).toBe(
        '# Test Document\n\nThis is a test document with some content.\n\n---\n\n## Page 2\n\nThis is the second page of the document.'
      )
    })
  })

  describe('formatSuccessResponse', () => {
    it('should format success response correctly', () => {
      const data = { id: 'test', name: 'Test Document' }
      const response = formatSuccessResponse(data)
      
      expect(response).toEqual({
        status: 'success',
        data: { id: 'test', name: 'Test Document' }
      })
    })

    it('should handle different data types', () => {
      const stringData = 'test string'
      const arrayData = [1, 2, 3]
      const nullData = null
      
      expect(formatSuccessResponse(stringData)).toEqual({
        status: 'success',
        data: 'test string'
      })
      
      expect(formatSuccessResponse(arrayData)).toEqual({
        status: 'success',
        data: [1, 2, 3]
      })
      
      expect(formatSuccessResponse(nullData)).toEqual({
        status: 'success',
        data: null
      })
    })
  })

  describe('formatErrorResponse', () => {
    it('should format error response correctly', () => {
      const error = 'Something went wrong'
      const response = formatErrorResponse(error)
      
      expect(response).toEqual({
        status: 'error',
        error: 'Something went wrong'
      })
    })

    it('should handle different error messages', () => {
      const validationError = 'Invalid file type'
      const notFoundError = 'Document not found'
      
      expect(formatErrorResponse(validationError)).toEqual({
        status: 'error',
        error: 'Invalid file type'
      })
      
      expect(formatErrorResponse(notFoundError)).toEqual({
        status: 'error',
        error: 'Document not found'
      })
    })
  })
})
