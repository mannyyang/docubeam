import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockEnv } from '../../setup/mocks'
import { FileStorageService } from '../../../worker/services/file-storage-service'

describe('FileStorageService', () => {
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('storeFile', () => {
    it('should store a file with correct path and metadata', async () => {
      const documentId = 'test-doc-id'
      const fileName = 'test.pdf'
      const buffer = new ArrayBuffer(1024)
      const contentType = 'application/pdf'

      const result = await FileStorageService.storeFile(
        documentId,
        fileName,
        buffer,
        contentType,
        mockEnv as any
      )

      expect(result).toBe('documents/test-doc-id/original/test.pdf')
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-doc-id/original/test.pdf',
        buffer,
        {
          httpMetadata: {
            contentType: 'application/pdf'
          }
        }
      )
    })

    it('should store file in custom sub-path', async () => {
      const documentId = 'test-doc-id'
      const fileName = 'result.json'
      const buffer = new ArrayBuffer(512)
      const contentType = 'application/json'

      const result = await FileStorageService.storeFile(
        documentId,
        fileName,
        buffer,
        contentType,
        mockEnv as any,
        'ocr'
      )

      expect(result).toBe('documents/test-doc-id/ocr/result.json')
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-doc-id/ocr/result.json',
        buffer,
        {
          httpMetadata: {
            contentType: 'application/json'
          }
        }
      )
    })

    it('should handle storage errors', async () => {
      mockEnv.PDF_BUCKET.put.mockRejectedValue(new Error('Storage failed'))

      await expect(
        FileStorageService.storeFile(
          'test-doc-id',
          'test.pdf',
          new ArrayBuffer(1024),
          'application/pdf',
          mockEnv as any
        )
      ).rejects.toThrow('Storage failed')
    })
  })

  describe('storeJSON', () => {
    it('should store JSON data with correct formatting', async () => {
      const documentId = 'test-doc-id'
      const fileName = 'metadata.json'
      const data = { id: 'test', name: 'Test Document' }

      const result = await FileStorageService.storeJSON(
        documentId,
        fileName,
        data,
        mockEnv as any
      )

      expect(result).toBe('documents/test-doc-id/metadata.json')
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-doc-id/metadata.json',
        JSON.stringify(data, null, 2),
        {
          httpMetadata: {
            contentType: 'application/json'
          }
        }
      )
    })

    it('should store JSON in sub-path', async () => {
      const documentId = 'test-doc-id'
      const fileName = 'result.json'
      const data = { pages: 5 }

      const result = await FileStorageService.storeJSON(
        documentId,
        fileName,
        data,
        mockEnv as any,
        'ocr'
      )

      expect(result).toBe('documents/test-doc-id/ocr/result.json')
    })
  })

  describe('storeText', () => {
    it('should store text data with correct content type', async () => {
      const documentId = 'test-doc-id'
      const fileName = 'extracted.md'
      const text = '# Test Document\n\nThis is test content.'
      const contentType = 'text/markdown'

      const result = await FileStorageService.storeText(
        documentId,
        fileName,
        text,
        contentType,
        mockEnv as any,
        'ocr'
      )

      expect(result).toBe('documents/test-doc-id/ocr/extracted.md')
      expect(mockEnv.PDF_BUCKET.put).toHaveBeenCalledWith(
        'documents/test-doc-id/ocr/extracted.md',
        text,
        {
          httpMetadata: {
            contentType: 'text/markdown'
          }
        }
      )
    })
  })

  describe('getFile', () => {
    it('should retrieve file successfully', async () => {
      const mockFile = { key: 'test-file' }
      mockEnv.PDF_BUCKET.get.mockResolvedValue(mockFile)

      const result = await FileStorageService.getFile('test/path.pdf', mockEnv as any)

      expect(result).toBe(mockFile)
      expect(mockEnv.PDF_BUCKET.get).toHaveBeenCalledWith('test/path.pdf')
    })

    it('should return null when file not found', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      const result = await FileStorageService.getFile('nonexistent.pdf', mockEnv as any)

      expect(result).toBeNull()
    })

    it('should handle retrieval errors', async () => {
      mockEnv.PDF_BUCKET.get.mockRejectedValue(new Error('Retrieval failed'))

      await expect(
        FileStorageService.getFile('test.pdf', mockEnv as any)
      ).rejects.toThrow('Retrieval failed')
    })
  })

  describe('getJSON', () => {
    it('should retrieve and parse JSON data', async () => {
      const mockData = { id: 'test', name: 'Test' }
      const mockObject = {
        json: vi.fn().mockResolvedValue(mockData)
      }
      mockEnv.PDF_BUCKET.get.mockResolvedValue(mockObject)

      const result = await FileStorageService.getJSON('test.json', mockEnv as any)

      expect(result).toEqual(mockData)
      expect(mockObject.json).toHaveBeenCalled()
    })

    it('should return null when JSON file not found', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      const result = await FileStorageService.getJSON('nonexistent.json', mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('getText', () => {
    it('should retrieve text content', async () => {
      const mockText = 'This is test content'
      const mockObject = {
        text: vi.fn().mockResolvedValue(mockText)
      }
      mockEnv.PDF_BUCKET.get.mockResolvedValue(mockObject)

      const result = await FileStorageService.getText('test.txt', mockEnv as any)

      expect(result).toBe(mockText)
      expect(mockObject.text).toHaveBeenCalled()
    })

    it('should return null when text file not found', async () => {
      mockEnv.PDF_BUCKET.get.mockResolvedValue(null)

      const result = await FileStorageService.getText('nonexistent.txt', mockEnv as any)

      expect(result).toBeNull()
    })
  })

  describe('listObjects', () => {
    it('should list objects with prefix', async () => {
      const mockResult = {
        objects: [
          { key: 'documents/doc1/file1.pdf' },
          { key: 'documents/doc1/file2.pdf' }
        ],
        truncated: false
      }
      mockEnv.PDF_BUCKET.list.mockResolvedValue(mockResult)

      const result = await FileStorageService.listObjects('documents/', mockEnv as any)

      expect(result).toBe(mockResult)
      expect(mockEnv.PDF_BUCKET.list).toHaveBeenCalledWith({
        prefix: 'documents/',
        delimiter: undefined
      })
    })

    it('should list objects with delimiter', async () => {
      const mockResult = {
        objects: [{ key: 'documents/doc1/' }],
        truncated: false
      }
      mockEnv.PDF_BUCKET.list.mockResolvedValue(mockResult)

      const result = await FileStorageService.listObjects('documents/', mockEnv as any, '/')

      expect(result).toBe(mockResult)
      expect(mockEnv.PDF_BUCKET.list).toHaveBeenCalledWith({
        prefix: 'documents/',
        delimiter: '/'
      })
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      await FileStorageService.deleteFile('test/file.pdf', mockEnv as any)

      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('test/file.pdf')
    })

    it('should handle deletion errors', async () => {
      mockEnv.PDF_BUCKET.delete.mockRejectedValue(new Error('Deletion failed'))

      await expect(
        FileStorageService.deleteFile('test.pdf', mockEnv as any)
      ).rejects.toThrow('Deletion failed')
    })
  })

  describe('deleteDocument', () => {
    it('should delete all files for a document', async () => {
      const mockObjects = {
        objects: [
          { key: 'documents/test-doc/original/file.pdf' },
          { key: 'documents/test-doc/metadata.json' },
          { key: 'documents/test-doc/ocr/result.json' }
        ],
        truncated: false
      }
      mockEnv.PDF_BUCKET.list.mockResolvedValue(mockObjects)

      await FileStorageService.deleteDocument('test-doc', mockEnv as any)

      expect(mockEnv.PDF_BUCKET.list).toHaveBeenCalledWith({
        prefix: 'documents/test-doc/'
      })
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledTimes(3)
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc/original/file.pdf')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc/metadata.json')
      expect(mockEnv.PDF_BUCKET.delete).toHaveBeenCalledWith('documents/test-doc/ocr/result.json')
    })

    it('should handle document deletion errors', async () => {
      mockEnv.PDF_BUCKET.list.mockRejectedValue(new Error('List failed'))

      await expect(
        FileStorageService.deleteDocument('test-doc', mockEnv as any)
      ).rejects.toThrow('List failed')
    })
  })
})
