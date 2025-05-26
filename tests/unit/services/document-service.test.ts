import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockEnv, createMockFile, mockMistralResponse } from '../../setup/mocks'

// Mock the utils module first
vi.mock('../../../worker/utils', () => ({
  createDocumentPath: vi.fn((id: string) => `documents/${id}`),
  generateUUID: vi.fn(() => 'test-document-id'),
  extractTextFromPDF: vi.fn().mockResolvedValue(mockMistralResponse.text),
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
    it('should successfully upload a valid PDF file', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      
      const result = await DocumentService.uploadDocument(file, mockEnv as any)

      expect(result).toEqual({
        documentId: 'test-document-id',
        name: 'test.pdf',
        pageCount: 0,
        size: 1024,
      })

      // Verify R2 operations
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledTimes(3) // PDF file, text, metadata
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-document-id/test.pdf',
        expect.any(ArrayBuffer),
        { httpMetadata: { contentType: 'application/pdf' } }
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

    it('should return documents when they exist', async () => {
      const mockDocument = {
        id: 'test-doc-1',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-1/test.pdf',
      }

      mockEnv.PDF_BUCKET.list.mockResolvedValue({
        objects: [
          { key: 'documents/test-doc-1/test.pdf' },
          { key: 'documents/test-doc-1/metadata.json' },
        ],
        truncated: false,
      })

      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockDocument),
      })

      const result = await DocumentService.getDocuments(mockEnv as any)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockDocument)
    })
  })

  describe('getDocument', () => {
    it('should return document when it exists', async () => {
      const mockDocument = {
        id: 'test-doc-1',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-1/test.pdf',
      }

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
    it('should successfully delete an existing document', async () => {
      const mockDocument = {
        id: 'test-doc-1',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-1/test.pdf',
      }

      // Mock document exists
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockDocument),
      })

      // Mock list objects for deletion
      mockEnv.PDF_BUCKET.list.mockResolvedValue({
        objects: [
          { key: 'documents/test-doc-1/test.pdf' },
          { key: 'documents/test-doc-1/text.txt' },
          { key: 'documents/test-doc-1/metadata.json' },
        ],
        truncated: false,
      })

      await DocumentService.deleteDocument('test-doc-1', mockEnv as any)

      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledTimes(3)
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/test.pdf')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/text.txt')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc-1/metadata.json')
    })

    it('should throw NotFoundError when trying to delete non-existent document', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      await expect(
        DocumentService.deleteDocument('non-existent', mockEnv as any)
      ).rejects.toThrow(NotFoundError)
    })
  })
})
