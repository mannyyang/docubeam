import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createMockFile, createMockEnv } from '../../setup/mocks'
import { DocumentValidationService } from '../../../worker/services/document-validation-service'
import { ValidationError } from '../../../worker/middleware/error'

// Mock the config
vi.mock('../../../worker/config', () => ({
  ERROR_MESSAGES: {
    DOCUMENTS: {
      INVALID_FILE_TYPE: 'Invalid file type',
      FILE_TOO_LARGE: 'File too large'
    }
  },
  STORAGE_CONFIG: {
    FILE_LIMITS: {
      ACCEPTED_MIME_TYPES: ['application/pdf'],
      MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB
    }
  }
}))

describe('DocumentValidationService', () => {
  let mockEnv: ReturnType<typeof createMockEnv>

  beforeEach(() => {
    mockEnv = createMockEnv()
    vi.clearAllMocks()
  })

  describe('validateFile', () => {
    it('should validate a valid PDF file', () => {
      const file = createMockFile('test.pdf', 'application/pdf', 1024)

      expect(() => {
        DocumentValidationService.validateFile(file)
      }).not.toThrow()
    })

    it('should throw ValidationError for null file', () => {
      expect(() => {
        DocumentValidationService.validateFile(null as any)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid file type', () => {
      const file = createMockFile('test.txt', 'text/plain', 1024)

      expect(() => {
        DocumentValidationService.validateFile(file)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for file too large', () => {
      const file = createMockFile('large.pdf', 'application/pdf', 11 * 1024 * 1024)

      expect(() => {
        DocumentValidationService.validateFile(file)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for empty file', () => {
      const file = createMockFile('empty.pdf', 'application/pdf', 0)

      expect(() => {
        DocumentValidationService.validateFile(file)
      }).toThrow(ValidationError)
    })
  })

  describe('validateDocumentId', () => {
    it('should validate a valid UUID', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000'

      expect(() => {
        DocumentValidationService.validateDocumentId(validUUID)
      }).not.toThrow()
    })

    it('should throw ValidationError for empty document ID', () => {
      expect(() => {
        DocumentValidationService.validateDocumentId('')
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for non-string document ID', () => {
      expect(() => {
        DocumentValidationService.validateDocumentId(123 as any)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for invalid UUID format', () => {
      expect(() => {
        DocumentValidationService.validateDocumentId('invalid-uuid')
      }).toThrow(ValidationError)
    })
  })

  describe('validatePageNumber', () => {
    it('should validate a valid page number', () => {
      expect(() => {
        DocumentValidationService.validatePageNumber(1)
      }).not.toThrow()
    })

    it('should validate page number within max pages', () => {
      expect(() => {
        DocumentValidationService.validatePageNumber(5, 10)
      }).not.toThrow()
    })

    it('should throw ValidationError for non-integer page number', () => {
      expect(() => {
        DocumentValidationService.validatePageNumber(1.5)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for page number less than 1', () => {
      expect(() => {
        DocumentValidationService.validatePageNumber(0)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for page number exceeding max pages', () => {
      expect(() => {
        DocumentValidationService.validatePageNumber(15, 10)
      }).toThrow(ValidationError)
    })
  })

  describe('validateFileName', () => {
    it('should validate a valid file name', () => {
      expect(() => {
        DocumentValidationService.validateFileName('test-document.pdf')
      }).not.toThrow()
    })

    it('should throw ValidationError for empty file name', () => {
      expect(() => {
        DocumentValidationService.validateFileName('')
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for file name with dangerous characters', () => {
      expect(() => {
        DocumentValidationService.validateFileName('test<script>.pdf')
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for file name too long', () => {
      const longName = 'a'.repeat(256) + '.pdf'
      
      expect(() => {
        DocumentValidationService.validateFileName(longName)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for reserved file names', () => {
      expect(() => {
        DocumentValidationService.validateFileName('CON.pdf')
      }).toThrow(ValidationError)
    })
  })

  describe('validateEnvironment', () => {
    it('should validate a valid environment', () => {
      expect(() => {
        DocumentValidationService.validateEnvironment(mockEnv as any)
      }).not.toThrow()
    })

    it('should throw ValidationError for missing PDF_BUCKET', () => {
      const invalidEnv = { ...mockEnv, PDF_BUCKET: undefined }

      expect(() => {
        DocumentValidationService.validateEnvironment(invalidEnv as any)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for missing MISTRAL_AI_API_KEY', () => {
      const invalidEnv = { ...mockEnv, MISTRAL_AI_API_KEY: undefined }

      expect(() => {
        DocumentValidationService.validateEnvironment(invalidEnv as any)
      }).toThrow(ValidationError)
    })
  })

  describe('validateBuffer', () => {
    it('should validate a valid buffer', () => {
      const buffer = new ArrayBuffer(1024)

      expect(() => {
        DocumentValidationService.validateBuffer(buffer)
      }).not.toThrow()
    })

    it('should validate buffer with minimum size', () => {
      const buffer = new ArrayBuffer(1024)

      expect(() => {
        DocumentValidationService.validateBuffer(buffer, 512)
      }).not.toThrow()
    })

    it('should throw ValidationError for null buffer', () => {
      expect(() => {
        DocumentValidationService.validateBuffer(null as any)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for empty buffer', () => {
      const buffer = new ArrayBuffer(0)

      expect(() => {
        DocumentValidationService.validateBuffer(buffer)
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for buffer smaller than minimum', () => {
      const buffer = new ArrayBuffer(256)

      expect(() => {
        DocumentValidationService.validateBuffer(buffer, 512)
      }).toThrow(ValidationError)
    })
  })

  describe('validateContentType', () => {
    it('should validate a valid content type', () => {
      expect(() => {
        DocumentValidationService.validateContentType('application/pdf')
      }).not.toThrow()
    })

    it('should validate content type in allowed list', () => {
      expect(() => {
        DocumentValidationService.validateContentType('application/pdf', ['application/pdf', 'text/plain'])
      }).not.toThrow()
    })

    it('should throw ValidationError for empty content type', () => {
      expect(() => {
        DocumentValidationService.validateContentType('')
      }).toThrow(ValidationError)
    })

    it('should throw ValidationError for content type not in allowed list', () => {
      expect(() => {
        DocumentValidationService.validateContentType('text/plain', ['application/pdf'])
      }).toThrow(ValidationError)
    })
  })
})
