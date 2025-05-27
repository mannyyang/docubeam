import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createMockEnv, 
  createMockFile, 
  mockProcessedOCRResult,
  createMockDocumentWithOCR
} from '../../setup/mocks'

// Mock the DocumentOrchestrationService
vi.mock('../../../worker/services/document-orchestration-service', () => ({
  DocumentOrchestrationService: {
    uploadDocument: vi.fn().mockResolvedValue({
      documentId: '123e4567-e89b-12d3-a456-426614174000',
      name: 'test.pdf',
      pageCount: 0,
      size: 1024,
      url: '/api/documents/123e4567-e89b-12d3-a456-426614174000/file',
      textUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/text',
      ocrUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/ocr',
      statusUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/ocr/status',
      imagesUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/images',
    }),
    getDocumentOCR: vi.fn().mockResolvedValue(mockProcessedOCRResult),
    getDocumentExtractedText: vi.fn().mockResolvedValue('# Test Document\n\nThis is extracted text.'),
    getDocumentPage: vi.fn().mockResolvedValue('# Page 1 Content'),
    getDocuments: vi.fn().mockResolvedValue([createMockDocumentWithOCR('123e4567-e89b-12d3-a456-426614174000')]),
    getDocument: vi.fn().mockResolvedValue(createMockDocumentWithOCR('123e4567-e89b-12d3-a456-426614174000')),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
  }
}))

// Mock the DocumentMetadataService for updateDocumentMetadata
vi.mock('../../../worker/services/document-metadata-service', () => ({
  DocumentMetadataService: {
    updateMetadata: vi.fn().mockResolvedValue(undefined),
  }
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
  const validDocumentId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('uploadDocument', () => {
    it('should successfully upload a valid PDF file with OCR processing', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      
      const result = await DocumentService.uploadDocument(file, mockEnv as any)

      expect(result).toEqual({
        documentId: validDocumentId,
        name: 'test.pdf',
        pageCount: 0,
        size: 1024,
        url: `/api/documents/${validDocumentId}/file`,
        textUrl: `/api/documents/${validDocumentId}/text`,
        ocrUrl: `/api/documents/${validDocumentId}/ocr`,
        statusUrl: `/api/documents/${validDocumentId}/ocr/status`,
        imagesUrl: `/api/documents/${validDocumentId}/images`,
      })

      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.uploadDocument).toHaveBeenCalledWith(file, mockEnv)
    })

    it('should reject non-PDF files', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.uploadDocument).mockRejectedValueOnce(new ValidationError('Invalid file type'))

      await expect(
        DocumentService.uploadDocument(file, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })

    it('should reject files larger than 10MB', async () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024)
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.uploadDocument).mockRejectedValueOnce(new ValidationError('File too large'))

      await expect(
        DocumentService.uploadDocument(file, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })

    it('should reject when no file is provided', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.uploadDocument).mockRejectedValueOnce(new ValidationError('No file provided'))

      await expect(
        DocumentService.uploadDocument(null as any, mockEnv as any)
      ).rejects.toThrow(ValidationError)
    })
  })

  describe('getDocumentOCR', () => {
    it('should return OCR results when available', async () => {
      const result = await DocumentService.getDocumentOCR(validDocumentId, mockEnv as any)

      expect(result).toEqual(mockProcessedOCRResult)
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocumentOCR).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should return null when OCR results not available', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.getDocumentOCR).mockResolvedValueOnce(null)

      const result = await DocumentService.getDocumentOCR(validDocumentId, mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('getDocumentExtractedText', () => {
    it('should return extracted text when available', async () => {
      const result = await DocumentService.getDocumentExtractedText(validDocumentId, mockEnv as any)

      expect(result).toBe('# Test Document\n\nThis is extracted text.')
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocumentExtractedText).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should return null when text not available', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.getDocumentExtractedText).mockResolvedValueOnce(null)

      const result = await DocumentService.getDocumentExtractedText(validDocumentId, mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('getDocumentPage', () => {
    it('should return page content when available', async () => {
      const result = await DocumentService.getDocumentPage(validDocumentId, 1, mockEnv as any)

      expect(result).toBe('# Page 1 Content')
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocumentPage).toHaveBeenCalledWith(validDocumentId, 1, mockEnv)
    })

    it('should return null when page not found', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.getDocumentPage).mockResolvedValueOnce(null)

      const result = await DocumentService.getDocumentPage(validDocumentId, 1, mockEnv as any)

      expect(result).toBeNull()
    })

    it('should handle page numbers correctly with padding', async () => {
      await DocumentService.getDocumentPage(validDocumentId, 15, mockEnv as any)

      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocumentPage).toHaveBeenCalledWith(validDocumentId, 15, mockEnv)
    })
  })

  describe('getDocuments', () => {
    it('should return empty array when no documents exist', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.getDocuments).mockResolvedValueOnce([])

      const result = await DocumentService.getDocuments(mockEnv as any)

      expect(result).toEqual([])
      expect(DocumentOrchestrationService.getDocuments).toHaveBeenCalledWith(mockEnv)
    })

    it('should return documents with OCR data when they exist', async () => {
      const mockDocument = createMockDocumentWithOCR(validDocumentId)

      const result = await DocumentService.getDocuments(mockEnv as any)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockDocument)
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocuments).toHaveBeenCalledWith(mockEnv)
    })
  })

  describe('getDocument', () => {
    it('should return document when it exists', async () => {
      const result = await DocumentService.getDocument(validDocumentId, mockEnv as any)

      expect(result.id).toBe(validDocumentId)
      
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.getDocument).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should throw NotFoundError when document does not exist', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.getDocument).mockRejectedValueOnce(new NotFoundError('Document not found'))

      await expect(
        DocumentService.getDocument('non-existent', mockEnv as any)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('deleteDocument', () => {
    it('should successfully delete an existing document with OCR data', async () => {
      await DocumentService.deleteDocument(validDocumentId, mockEnv as any)

      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      expect(DocumentOrchestrationService.deleteDocument).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should throw NotFoundError when trying to delete non-existent document', async () => {
      const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')
      vi.mocked(DocumentOrchestrationService.deleteDocument).mockRejectedValueOnce(new NotFoundError('Document not found'))

      await expect(
        DocumentService.deleteDocument('non-existent', mockEnv as any)
      ).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateDocumentMetadata', () => {
    it('should update document metadata with OCR results', async () => {
      await DocumentService.updateDocumentMetadata(validDocumentId, {
        pageCount: 5
      }, mockEnv as any)

      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.updateMetadata).toHaveBeenCalledWith(
        validDocumentId,
        { pageCount: 5 },
        mockEnv
      )
    })

    it('should handle metadata update errors gracefully', async () => {
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      vi.mocked(DocumentMetadataService.updateMetadata).mockRejectedValueOnce(new Error('R2 error'))

      // Should not throw, just log error
      await expect(
        DocumentService.updateDocumentMetadata(validDocumentId, { pageCount: 5 }, mockEnv as any)
      ).rejects.toThrow('R2 error')
    })
  })
})
