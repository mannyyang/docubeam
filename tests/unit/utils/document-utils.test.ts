import { describe, it, expect } from 'vitest'
import { createDocumentPath, generateUUID } from '../../../worker/utils'

describe('Document Utils', () => {
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
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      
      expect(uuid1).not.toBe(uuid2)
    })
  })
})
