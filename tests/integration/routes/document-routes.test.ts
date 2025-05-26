import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'
import documentRoutes from '../../../worker/routes/document-routes'
import { createMockEnv, createMockFile } from '../../setup/mocks'

// Mock the DocumentService
vi.mock('../../../worker/services/document-service', () => ({
  DocumentService: {
    uploadDocument: vi.fn(),
    getDocuments: vi.fn(),
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
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

describe('Document Routes', () => {
  let app: Hono
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    app = new Hono()
    app.route('/', documentRoutes)
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('POST /api/documents/upload', () => {
    it('should successfully upload a PDF file', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.uploadDocument = vi.fn().mockResolvedValue({
        documentId: 'test-doc-id',
        name: 'test.pdf',
        pageCount: 1,
        size: 1024,
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

    it('should reject files larger than 10MB', async () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024)
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

    it('should reject requests without files', async () => {
      const formData = new FormData()

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

  describe('GET /api/documents', () => {
    it('should return list of documents', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocuments = [
        {
          id: 'doc-1',
          name: 'test1.pdf',
          size: 1024,
          pageCount: 1,
          uploadDate: new Date('2024-01-01'),
          path: 'documents/doc-1/test1.pdf',
        },
        {
          id: 'doc-2',
          name: 'test2.pdf',
          size: 2048,
          pageCount: 2,
          uploadDate: new Date('2024-01-02'),
          path: 'documents/doc-2/test2.pdf',
        },
      ]

      DocumentService.getDocuments = vi.fn().mockResolvedValue(mockDocuments)

      const req = new Request('http://localhost/api/documents')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toHaveLength(2)
    })

    it('should return empty array when no documents exist', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      DocumentService.getDocuments = vi.fn().mockResolvedValue([])

      const req = new Request('http://localhost/api/documents')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data).toEqual([])
    })
  })

  describe('GET /api/documents/:id', () => {
    it('should return document when it exists', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = {
        id: 'test-doc-id',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-id/test.pdf',
      }

      DocumentService.getDocument = vi.fn().mockResolvedValue(mockDocument)

      const req = new Request('http://localhost/api/documents/test-doc-id')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.status).toBe('success')
      expect(json.data.id).toBe('test-doc-id')
    })

    it('should return 404 when document does not exist', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      const { NotFoundError } = await import('../../../worker/middleware/error')
      
      DocumentService.getDocument = vi.fn().mockRejectedValue(new NotFoundError('Document not found'))

      const req = new Request('http://localhost/api/documents/non-existent')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
    })
  })

  describe('DELETE /api/documents/:id', () => {
    it('should successfully delete a document', async () => {
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

    it('should return 404 when trying to delete non-existent document', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      const { NotFoundError } = await import('../../../worker/middleware/error')
      
      DocumentService.deleteDocument = vi.fn().mockRejectedValue(new NotFoundError('Document not found'))

      const req = new Request('http://localhost/api/documents/non-existent', {
        method: 'DELETE',
      })
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
    })
  })

  describe('GET /api/documents/:id/metadata', () => {
    it('should return PDF metadata', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = {
        id: 'test-doc-id',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-id/test.pdf',
      }

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

    it('should return 404 when PDF file not found in R2', async () => {
      const { DocumentService } = await import('../../../worker/services/document-service')
      
      const mockDocument = {
        id: 'test-doc-id',
        name: 'test.pdf',
        size: 1024,
        pageCount: 1,
        uploadDate: new Date('2024-01-01'),
        path: 'documents/test-doc-id/test.pdf',
      }

      DocumentService.getDocument = vi.fn().mockResolvedValue(mockDocument)
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      const req = new Request('http://localhost/api/documents/test-doc-id/metadata')
      const res = await app.request(req, mockEnv)
      const json = await res.json()

      expect(res.status).toBe(404)
      expect(json.status).toBe('error')
    })
  })
})
