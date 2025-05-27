# Testing Documentation

This document describes the testing setup for the PDF document upload feature with Mistral OCR integration.

## Overview

The test suite validates the implementation of public document uploads with OCR processing, which allows users to upload PDF documents without authentication and automatically extract text using Mistral AI's OCR service. The feature includes:

- Public document upload endpoint
- Mistral OCR integration for text extraction
- Organized R2 storage structure with original PDFs and OCR results
- Multiple API endpoints for accessing OCR data
- Background OCR processing with status tracking

## Test Structure

```
tests/
├── setup/
│   ├── test-env.ts          # Test environment configuration
│   └── mocks.ts             # Mock utilities for Cloudflare Workers & OCR
├── unit/
│   ├── services/
│   │   └── document-service.test.ts  # DocumentService unit tests with OCR
│   └── utils/
│       └── document-utils.test.ts    # Utility function tests
├── integration/
│   └── routes/
│       └── document-routes.test.ts   # API endpoint integration tests with OCR
├── simple.test.ts           # Basic feature validation tests
└── README.md               # This file
```

## Running Tests

### All Tests
```bash
pnpm test
```

### Run Tests Once
```bash
pnpm test:run
```

### Test with UI
```bash
pnpm test:ui
```

### Specific Test Files
```bash
# Run simple validation tests
pnpm vitest run tests/simple.test.ts

# Run utils tests
pnpm vitest run tests/unit/utils/document-utils.test.ts

# Run service tests
pnpm vitest run tests/unit/services/document-service.test.ts

# Run integration tests
pnpm vitest run tests/integration/routes/document-routes.test.ts
```

## Test Categories

### 1. Simple Feature Tests (`tests/simple.test.ts`)
✅ **Working** - Basic validation of the OCR-enabled upload feature:
- Public upload enablement
- OCR folder structure validation
- Mistral OCR model configuration
- New API endpoint existence
- OCR processing features
- File size and type validation

### 2. Utils Tests (`tests/unit/utils/document-utils.test.ts`)
✅ **Working** - Tests utility functions:
- Document path creation
- UUID generation
- OCR processing utilities

### 3. Service Tests
✅ **Updated** - Tests service layer methods with OCR:

**Document Service** (`tests/unit/services/document-service.test.ts`):
- Document upload with OCR processing
- OCR result retrieval
- Extracted text access
- Page-specific content access
- Document metadata updates
- Error handling for OCR failures

**Document Orchestration Service** (`tests/unit/services/document-orchestration-service.test.ts`):
- Complete document workflow orchestration
- File upload with validation and OCR processing
- Document retrieval and metadata management
- OCR status tracking and retry mechanisms
- Document deletion with cleanup
- Error handling across all operations
- Mock isolation and proper test setup

**File Storage Service** (`tests/unit/services/file-storage-service.test.ts`):
- R2 storage operations
- File upload and retrieval
- Organized folder structure validation
- Storage cleanup operations

**Document Validation Service** (`tests/unit/services/document-validation-service.test.ts`):
- File type and size validation
- Document ID validation
- Environment configuration validation
- Error handling for invalid inputs

### 4. Integration Tests (`tests/integration/routes/document-routes.test.ts`)
✅ **Updated** - Tests API endpoints with OCR:
- Upload endpoint with OCR processing
- OCR results endpoint (`/api/documents/:id/ocr`)
- Extracted text endpoint (`/api/documents/:id/text`)
- Page content endpoint (`/api/documents/:id/pages/:pageNumber`)
- OCR status endpoint (`/api/documents/:id/ocr/status`)
- Original file serving
- Document deletion with OCR cleanup

## Key Features Tested

### Public Document Upload with OCR
- ✅ No authentication required
- ✅ File type validation (PDF only)
- ✅ File size limits (10MB max)
- ✅ Organized storage path: `documents/{documentId}/original/` and `documents/{documentId}/ocr/`
- ✅ Background OCR processing with Mistral AI
- ✅ Text URL generation and logging

### OCR Processing Features
- ✅ Mistral OCR API integration (`mistral-ocr-latest`)
- ✅ Organized R2 storage structure
- ✅ Full OCR results with images and metadata
- ✅ Extracted text in markdown format
- ✅ Individual page content access
- ✅ OCR status tracking (processing/completed/failed)
- ✅ Error handling and logging

### API Endpoints
- ✅ `POST /api/documents/upload` - Public upload with OCR
- ✅ `GET /api/documents` - List all documents
- ✅ `GET /api/documents/:id` - Get document by ID
- ✅ `GET /api/documents/:id/file` - Serve original PDF
- ✅ `GET /api/documents/:id/ocr` - Get full OCR results
- ✅ `GET /api/documents/:id/text` - Get extracted text (markdown)
- ✅ `GET /api/documents/:id/pages/:pageNumber` - Get specific page content
- ✅ `GET /api/documents/:id/ocr/status` - Check OCR processing status
- ✅ `GET /api/documents/:id/metadata` - Extract PDF metadata
- ✅ `DELETE /api/documents/:id` - Delete document and OCR data

### R2 Storage Organization
- ✅ `documents/{documentId}/original/` - Original PDF files
- ✅ `documents/{documentId}/ocr/full-result.json` - Complete OCR response
- ✅ `documents/{documentId}/ocr/extracted-text.md` - Consolidated text
- ✅ `documents/{documentId}/ocr/pages/page-XXX.md` - Individual pages
- ✅ `documents/{documentId}/ocr/images/` - Extracted images
- ✅ `documents/{documentId}/metadata.json` - Document metadata

## Test Environment

The tests use:
- **Vitest** as the test runner
- **jsdom** for browser environment simulation
- **Mock utilities** for Cloudflare Workers (R2, D1)
- **Mistral OCR mocks** for testing OCR functionality
- **TypeScript** for type safety

## Mock Data

The tests include comprehensive mock data:
- **Mistral OCR API responses** with pages, images, and metadata
- **Processed OCR results** with organized structure
- **OCR status responses** for different processing states
- **Sample PDF files** created programmatically
- **Mock Cloudflare environment** with R2 and D1
- **Helper functions** for creating test data

## Validation Summary

The test suite successfully validates:
- ✅ Public upload functionality with OCR processing
- ✅ Mistral OCR API integration and response handling
- ✅ Organized R2 storage structure for original and processed content
- ✅ Multiple API endpoints for accessing OCR data
- ✅ Background OCR processing with status tracking
- ✅ Error handling for OCR failures
- ✅ File validation and size limits
- ✅ Document metadata management
- ✅ Complete cleanup on document deletion

## Recent Test Fixes and Improvements

### Mock Configuration Issues Resolved
- **Fixed Document Orchestration Service Tests**: Resolved 12 failing tests caused by improper mock configuration
- **Improved Mock Isolation**: Updated `beforeEach` hooks to properly reset validation mocks between tests
- **Better Error Handling Tests**: Enhanced test scenarios for validation errors and OCR processing failures
- **Consistent Test Setup**: Standardized mock behavior across all service tests

### Test Reliability Improvements
- **Proper Mock Resets**: Each test now properly controls its own mock behavior
- **Isolated Test Execution**: Tests no longer interfere with each other's mock configurations
- **Enhanced Error Scenarios**: Better coverage of edge cases and error conditions
- **Validation Mock Management**: Proper handling of `DocumentValidationService.validateDocumentId` across different test scenarios

### Current Test Status
All **99 tests** across **5 test files** are now passing:
- Document orchestration service: 18 tests ✅
- Document service: 19 tests ✅
- File storage service: 19 tests ✅
- Document validation service: 31 tests ✅
- Document utilities: 12 tests ✅

## New OCR Features Covered

1. **Mistral OCR Integration**: Tests the integration with `mistral-ocr-latest` model
2. **Organized Storage**: Validates the new folder structure for original and OCR content
3. **Multiple Access Methods**: Tests various ways to access OCR data (full results, text only, by page)
4. **Status Tracking**: Validates OCR processing status endpoints
5. **Image Handling**: Tests extraction and storage of images from PDFs
6. **Error Recovery**: Tests handling of OCR processing failures
7. **Background Processing**: Validates asynchronous OCR processing

This provides comprehensive coverage of the OCR-enabled document upload feature and ensures all functionality works correctly with robust test isolation and proper mock management.
