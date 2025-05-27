import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  createMockEnv, 
  createMockFile, 
  mockProcessedOCRResult,
  createMockDocumentWithOCR
} from '../../setup/mocks'

// Mock all the service dependencies
vi.mock('../../../worker/services/file-storage-service', () => ({
  FileStorageService: {
    storeFile: vi.fn().mockResolvedValue('documents/123e4567-e89b-12d3-a456-426614174000/original/test.pdf'),
    deleteDocument: vi.fn().mockResolvedValue(undefined),
  }
}))

vi.mock('../../../worker/services/document-validation-service', () => ({
  DocumentValidationService: {
    validateFile: vi.fn(),
    validateEnvironment: vi.fn(),
    validateFileName: vi.fn(),
    validateBuffer: vi.fn(),
    validateDocumentId: vi.fn(),
    validatePageNumber: vi.fn(),
  }
}))

vi.mock('../../../worker/services/ocr-processing-service', () => ({
  OCRProcessingService: {
    processDocument: vi.fn().mockResolvedValue(mockProcessedOCRResult),
    getOCRStatus: vi.fn().mockResolvedValue({
      status: 'completed',
      totalPages: 2,
      processedAt: new Date(),
      hasImages: true
    }),
    retryOCRProcessing: vi.fn().mockResolvedValue(mockProcessedOCRResult),
  }
}))

vi.mock('../../../worker/services/document-metadata-service', () => ({
  DocumentMetadataService: {
    createMetadata: vi.fn().mockResolvedValue('documents/123e4567-e89b-12d3-a456-426614174000/metadata.json'),
    updatePageCount: vi.fn().mockResolvedValue(undefined),
    setOCRError: vi.fn().mockResolvedValue(undefined),
    clearOCRError: vi.fn().mockResolvedValue(undefined),
    getMetadata: vi.fn().mockResolvedValue(createMockDocumentWithOCR('123e4567-e89b-12d3-a456-426614174000')),
    getAllMetadata: vi.fn().mockResolvedValue([createMockDocumentWithOCR('123e4567-e89b-12d3-a456-426614174000')]),
  }
}))

vi.mock('../../../worker/services/document-retrieval-service', () => ({
  DocumentRetrievalService: {
    generateDocumentURLs: vi.fn().mockReturnValue({
      documentUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/file',
      textUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/text',
      ocrUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/ocr',
      statusUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/ocr/status',
      imagesUrl: '/api/documents/123e4567-e89b-12d3-a456-426614174000/images'
    }),
    getOCRResults: vi.fn().mockResolvedValue(mockProcessedOCRResult),
    getExtractedText: vi.fn().mockResolvedValue('# Test Document\n\nThis is extracted text.'),
    getPageContent: vi.fn().mockResolvedValue('# Page 1 Content'),
    getDocumentImages: vi.fn().mockResolvedValue([]),
    getOriginalFile: vi.fn().mockResolvedValue({ key: 'test-file' }),
    searchDocumentText: vi.fn().mockResolvedValue([]),
    getDocumentSummary: vi.fn().mockResolvedValue({
      hasText: true,
      hasImages: false,
      pageCount: 2,
      imageCount: 0,
      textLength: 100
    }),
  }
}))

// Mock the utils
vi.mock('../../../worker/utils', () => ({
  generateUUID: vi.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}))

// Import after mocking
const { DocumentOrchestrationService } = await import('../../../worker/services/document-orchestration-service')

describe('DocumentOrchestrationService', () => {
  let mockEnv: ReturnType<typeof createMockEnv>
  const validDocumentId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(async () => {
    mockEnv = createMockEnv()
    vi.clearAllMocks()
    
    // Reset validation mock to not throw by default
    const { DocumentValidationService } = await import('../../../worker/services/document-validation-service')
    vi.mocked(DocumentValidationService.validateDocumentId).mockImplementation(() => {})
  })

  describe('uploadDocument', () => {
    it('should successfully upload a valid PDF file with OCR processing', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      
      const result = await DocumentOrchestrationService.uploadDocument(file, mockEnv as any)

      expect(result).toEqual({
        documentId: validDocumentId,
        name: 'test.pdf',
        pageCount: 0, // Initially 0, updated after OCR
        size: 1024,
        url: `/api/documents/${validDocumentId}/file`,
        textUrl: `/api/documents/${validDocumentId}/text`,
        ocrUrl: `/api/documents/${validDocumentId}/ocr`,
        statusUrl: `/api/documents/${validDocumentId}/ocr/status`,
        imagesUrl: `/api/documents/${validDocumentId}/images`,
      })

      // Verify all validation steps were called
      const { DocumentValidationService } = await import('../../../worker/services/document-validation-service')
      expect(DocumentValidationService.validateFile).toHaveBeenCalledWith(file)
      expect(DocumentValidationService.validateEnvironment).toHaveBeenCalledWith(mockEnv)
      expect(DocumentValidationService.validateFileName).toHaveBeenCalledWith('test.pdf')

      // Verify file storage
      const { FileStorageService } = await import('../../../worker/services/file-storage-service')
      expect(FileStorageService.storeFile).toHaveBeenCalled()

      // Verify metadata creation
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.createMetadata).toHaveBeenCalled()

      // Verify OCR processing
      const { OCRProcessingService } = await import('../../../worker/services/ocr-processing-service')
      expect(OCRProcessingService.processDocument).toHaveBeenCalled()
    })

    it('should handle OCR processing errors gracefully', async () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      
      // Mock OCR failure
      const { OCRProcessingService } = await import('../../../worker/services/ocr-processing-service')
      vi.mocked(OCRProcessingService.processDocument).mockRejectedValueOnce(new Error('OCR failed'))

      const result = await DocumentOrchestrationService.uploadDocument(file, mockEnv as any)

      // Should still return successful upload
      expect(result.documentId).toBe(validDocumentId)
      
      // Should store OCR error in metadata
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.setOCRError).toHaveBeenCalledWith(
        validDocumentId,
        'OCR failed',
        mockEnv
      )
    })

    it('should handle validation errors', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      
      // Mock validation failure
      const { DocumentValidationService } = await import('../../../worker/services/document-validation-service')
      vi.mocked(DocumentValidationService.validateFile).mockImplementation(() => {
        throw new Error('Invalid file type')
      })

      await expect(
        DocumentOrchestrationService.uploadDocument(file, mockEnv as any)
      ).rejects.toThrow('Invalid file type')
    })
  })

  describe('getDocumentOCR', () => {
    it('should return OCR results when available', async () => {
      const result = await DocumentOrchestrationService.getDocumentOCR(validDocumentId, mockEnv as any)

      expect(result).toEqual(mockProcessedOCRResult)
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getOCRResults).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should handle invalid document ID', async () => {
      const { DocumentValidationService } = await import('../../../worker/services/document-validation-service')
      vi.mocked(DocumentValidationService.validateDocumentId).mockImplementation(() => {
        throw new Error('Invalid document ID')
      })

      await expect(
        DocumentOrchestrationService.getDocumentOCR('invalid-id', mockEnv as any)
      ).rejects.toThrow('Invalid document ID')
    })
  })

  describe('getDocumentExtractedText', () => {
    it('should return extracted text when available', async () => {
      const result = await DocumentOrchestrationService.getDocumentExtractedText(validDocumentId, mockEnv as any)

      expect(result).toBe('# Test Document\n\nThis is extracted text.')
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getExtractedText).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })

  describe('getDocumentPage', () => {
    it('should return page content when available', async () => {
      const result = await DocumentOrchestrationService.getDocumentPage(validDocumentId, 1, mockEnv as any)

      expect(result).toBe('# Page 1 Content')
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getPageContent).toHaveBeenCalledWith(validDocumentId, 1, mockEnv)
    })
  })

  describe('getDocuments', () => {
    it('should return all documents', async () => {
      const result = await DocumentOrchestrationService.getDocuments(mockEnv as any)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe(validDocumentId)
      
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.getAllMetadata).toHaveBeenCalledWith(mockEnv)
    })
  })

  describe('getDocument', () => {
    it('should return document when it exists', async () => {
      const result = await DocumentOrchestrationService.getDocument(validDocumentId, mockEnv as any)

      expect(result.id).toBe(validDocumentId)
      
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.getMetadata).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })

  describe('deleteDocument', () => {
    it('should successfully delete an existing document', async () => {
      await DocumentOrchestrationService.deleteDocument(validDocumentId, mockEnv as any)

      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.getMetadata).toHaveBeenCalledWith(validDocumentId, mockEnv)
      
      const { FileStorageService } = await import('../../../worker/services/file-storage-service')
      expect(FileStorageService.deleteDocument).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })

  describe('getOCRStatus', () => {
    it('should return OCR status', async () => {
      const result = await DocumentOrchestrationService.getOCRStatus(validDocumentId, mockEnv as any)

      expect(result.status).toBe('completed')
      expect(result.totalPages).toBe(2)
      
      const { OCRProcessingService } = await import('../../../worker/services/ocr-processing-service')
      expect(OCRProcessingService.getOCRStatus).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })

  describe('retryOCRProcessing', () => {
    it('should retry OCR processing and update metadata', async () => {
      const result = await DocumentOrchestrationService.retryOCRProcessing(validDocumentId, mockEnv as any)

      expect(result).toEqual(mockProcessedOCRResult)
      
      const { OCRProcessingService } = await import('../../../worker/services/ocr-processing-service')
      expect(OCRProcessingService.retryOCRProcessing).toHaveBeenCalledWith(validDocumentId, mockEnv)
      
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.updatePageCount).toHaveBeenCalledWith(validDocumentId, 2, mockEnv)
      expect(DocumentMetadataService.clearOCRError).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })

    it('should handle retry failures', async () => {
      const { OCRProcessingService } = await import('../../../worker/services/ocr-processing-service')
      vi.mocked(OCRProcessingService.retryOCRProcessing).mockRejectedValueOnce(new Error('Retry failed'))

      await expect(
        DocumentOrchestrationService.retryOCRProcessing(validDocumentId, mockEnv as any)
      ).rejects.toThrow('Retry failed')
      
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.setOCRError).toHaveBeenCalledWith(
        validDocumentId,
        'Retry failed',
        mockEnv
      )
    })
  })

  describe('getDocumentImages', () => {
    it('should return document images', async () => {
      const result = await DocumentOrchestrationService.getDocumentImages(validDocumentId, mockEnv as any)

      expect(result).toEqual([])
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getDocumentImages).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })

  describe('getOriginalFile', () => {
    it('should return original file', async () => {
      const result = await DocumentOrchestrationService.getOriginalFile(validDocumentId, mockEnv as any)

      expect(result).toEqual({ key: 'test-file' })
      
      const { DocumentMetadataService } = await import('../../../worker/services/document-metadata-service')
      expect(DocumentMetadataService.getMetadata).toHaveBeenCalledWith(validDocumentId, mockEnv)
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getOriginalFile).toHaveBeenCalled()
    })
  })

  describe('searchDocument', () => {
    it('should search document text', async () => {
      const result = await DocumentOrchestrationService.searchDocument(validDocumentId, 'test query', mockEnv as any)

      expect(result).toEqual([])
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.searchDocumentText).toHaveBeenCalledWith(validDocumentId, 'test query', mockEnv)
    })

    it('should handle empty search query', async () => {
      await expect(
        DocumentOrchestrationService.searchDocument(validDocumentId, '', mockEnv as any)
      ).rejects.toThrow('Search query is required')
    })
  })

  describe('getDocumentSummary', () => {
    it('should return document summary', async () => {
      const result = await DocumentOrchestrationService.getDocumentSummary(validDocumentId, mockEnv as any)

      expect(result).toEqual({
        hasText: true,
        hasImages: false,
        pageCount: 2,
        imageCount: 0,
        textLength: 100
      })
      
      const { DocumentRetrievalService } = await import('../../../worker/services/document-retrieval-service')
      expect(DocumentRetrievalService.getDocumentSummary).toHaveBeenCalledWith(validDocumentId, mockEnv)
    })
  })
})
