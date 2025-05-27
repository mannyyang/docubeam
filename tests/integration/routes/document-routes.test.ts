import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import documentRoutes from '../../../worker/routes/document-routes'
import { 
  createMockEnv, 
  createMockFile, 
  mockProcessedOCRResult,
  mockOCRStatusCompleted,
  mockOCRStatusProcessing,
  createMockDocumentWithOCR
} from '../../setup/mocks'

// Mock the DocumentService
vi.mock('../../../worker/services/document-service', () => ({
  DocumentService: {
    uploadDocument: vi.fn(),
    getDocuments: vi.fn(),
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
    getDocumentOCR: vi.fn(),
    getDocumentExtractedText: vi.fn(),
    getDocumentPage: vi.fn(),
  },
}))

// Mock utils
vi.mock('../../../worker/utils', () => ({
  formatSuccessResponse: vi.fn((data) => ({ status: 'success', data })),
  formatErrorResponse: vi.fn((error) => ({ status: 'error', error })),
  extractPDFMetadata: vi.fn().mockResolvedValue({
    info: { Title: 'Test PDF' },
    metadata: {},
  }),
}))

describe('Document Routes with OCR', () => {
  let app: Hono
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    app = new Hono()
    app.route('/', documentRoutes)
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('POST /api/documents/upload', () => {
    it('should successfully upload a PDF file and start OCR processing', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.uploadDocument = vi.fn().mockResolvedValue({
        documentId: 'test-doc-id',
        name: 'test.pdf',
        pageCount: 0, // Initially 0, updated after OCR
        size: 1024,
        url: '/api/documents/test-doc-id/file',
        textUrl: '/api/documents/test-doc-id/text',
        ocrUrl: '/api/documents/test-doc-id/ocr',
        statusUrl: '/api/documents/test-doc-id/ocr/status',
        imagesUrl: '/api/documents/test-doc-id/images',
      })

      const file = createMockFile('test.pdf', 'application/pdf', 1024)
      const formData = new FormData()
      formData.append('file', file)

      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.documentId).toBe('test-doc-id')
      expect(json.data.url).toBe('/api/documents/test-doc-id/file')
      expect(json.data.textUrl).toBe('/api/documents/test-doc-id/text')
      expect(json.data.ocrUrl).toBe('/api/documents/test-doc-id/ocr')
      expect(json.data.statusUrl).toBe('/api/documents/test-doc-id/ocr/status')
      expect(json.data.imagesUrl).toBe('/api/documents/test-doc-id/images')
    })

    it('should reject non-PDF files', async () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)
      const formData = new FormData()
      formData.append('file', file)

      const req = new Request('http://localhost/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
    })
  })

  describe('GET /api/documents/:id/ocr', () => {
    it('should return OCR results when available', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocumentOCR = vi.fn().mockResolvedValue(mockProcessedOCRResult)

      const req = new Request('http://localhost/api/documents/test-doc-id/ocr')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.totalPages).toBe(2)
      expect(json.data.pages).toHaveLength(2)
      expect(json.data.images).toHaveLength(1)
    })

    it('should return 404 when OCR results not available', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocumentOCR = vi.fn().mockResolvedValue(null)

      const req = new Request('http://localhost/api/documents/test-doc-id/ocr')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.error).toContain('OCR results not available')
    })
  })

  describe('GET /api/documents/:id/text', () => {
    it('should return extracted text as markdown', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const extractedText = '# Test Document\n\nThis is extracted text from the PDF.'
      DocumentService.getDocumentExtractedText = vi.fn().mockResolvedValue(extractedText)

      const req = new Request('http://localhost/api/documents/test-doc-id/text')
      const res = await app.request(req, mockEnv)
      const text = await res.text()

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/markdown')
      expect(text).toBe(extractedText)
    })

    it('should return 404 when text not available', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocumentExtractedText = vi.fn().mockResolvedValue(null)

      const req = new Request('http://localhost/api/documents/test-doc-id/text')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.error).toContain('Extracted text not available')
    })
  })

  describe('GET /api/documents/:id/pages/:pageNumber', () => {
    it('should return specific page content', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const pageContent = '# Page 1\n\nThis is the content of page 1.'
      DocumentService.getDocumentPage = vi.fn().mockResolvedValue(pageContent)

      const req = new Request('http://localhost/api/documents/test-doc-id/pages/1')
      const res = await app.request(req, mockEnv)
      const text = await res.text()

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('text/markdown')
      expect(text).toBe(pageContent)
      expect(DocumentService.getDocumentPage).toHaveBeenCalledWith('test-doc-id', 1, mockEnv)
    })

    it('should return 400 for invalid page numbers', async () => {
      const req = new Request('http://localhost/api/documents/test-doc-id/pages/invalid')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.error).toContain('Invalid page number')
    })

    it('should return 400 for page number less than 1', async () => {
      const req = new Request('http://localhost/api/documents/test-doc-id/pages/0')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.status).toBe('error')
      expect(json.error).toContain('Invalid page number')
    })

    it('should return 404 when page not found', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocumentPage = vi.fn().mockResolvedValue(null)

      const req = new Request('http://localhost/api/documents/test-doc-id/pages/999')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
      expect(json.error).toContain('Page not found')
    })
  })

  describe('GET /api/documents/:id/ocr/status', () => {
    it('should return completed status when OCR is done', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocumentOCR = vi.fn().mockResolvedValue(mockProcessedOCRResult)

      const req = new Request('http://localhost/api/documents/test-doc-id/ocr/status')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.status).toBe('completed')
      expect(json.data.totalPages).toBe(2)
      expect(json.data.hasImages).toBe(true)
    })

    it('should return processing status when OCR is in progress', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      // OCR not available yet, but document exists
      DocumentService.getDocumentOCR = vi.fn().mockResolvedValue(null)
      DocumentService.getDocument = vi.fn().mockResolvedValue(createMockDocumentWithOCR())

      const req = new Request('http://localhost/api/documents/test-doc-id/ocr/status')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.status).toBe('processing')
      expect(json.data.message).toContain('OCR processing is in progress')
    })

    it('should return 404 when document does not exist', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      const { NotFoundError } = await import('../../../worker/middleware/error')
      
      DocumentService.getDocumentOCR = vi.fn().mockResolvedValue(null)
      DocumentService.getDocument = vi.fn().mockRejectedValue(new NotFoundError('Document not found'))

      const req = new Request('http://localhost/api/documents/non-existent/ocr/status')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
    })
  })

  describe('GET /api/documents', () => {
    it('should return list of documents with OCR data', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocuments = [
        createMockDocumentWithOCR('doc-1'),
        createMockDocumentWithOCR('doc-2'),
      ]

      DocumentService.getDocuments = vi.fn().mockResolvedValue(mockDocuments)

      const req = new Request('http://localhost/api/documents')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(2)
      expect(json.data[0].path).toContain('/original/')
      expect(json.data[0].pageCount).toBe(2)
    })
  })

  describe('GET /api/documents/:id', () => {
    it('should return document with OCR metadata', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = createMockDocumentWithOCR('test-doc-id')
      DocumentService.getDocument = vi.fn().mockResolvedValue(mockDocument)

      const req = new Request('http://localhost/api/documents/test-doc-id')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.id).toBe('test-doc-id')
      expect(json.data.path).toContain('/original/')
      expect(json.data.pageCount).toBe(2)
    })
  })

  describe('GET /api/documents/:id/file', () => {
    it('should serve the original PDF file', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = createMockDocumentWithOCR('test-doc-id')
      DocumentService.getDocument = vi.fn().mockResolvedValue(mockDocument)

      // Mock R2 bucket get for PDF file
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      })

      const req = new Request('http://localhost/api/documents/test-doc-id/file')
      const res = await app.request(req, mockEnv)

      expect(res.status).toBe(200)
      expect(res.headers.get('Content-Type')).toBe('application/pdf')
      expect(res.headers.get('Content-Disposition')).toContain('inline; filename="test.pdf"')
    })
  })

  describe('DELETE /api/documents/:id', () => {
    it('should successfully delete a document with all OCR data', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.deleteDocument = vi.fn().mockResolvedValue(undefined)

      const req = new Request('http://localhost/api/documents/test-doc-id', {
        method: 'DELETE',
      })
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(DocumentService.deleteDocument).toHaveBeenCalledWith('test-doc-id', mockEnv)
    })
  })

  describe('GET /api/documents/:id/metadata', () => {
    it('should return PDF metadata', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = createMockDocumentWithOCR('test-doc-id')
      DocumentService.getDocument = vi.fn().mockResolvedValue(mockDocument)

      // Mock R2 bucket get for PDF file
      mockEnv.PDF_BUCKET.get.mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
      })

      const req = new Request('http://localhost/api/documents/test-doc-id/metadata')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.info.Title).toBe('Test PDF')
    })
  })
})
