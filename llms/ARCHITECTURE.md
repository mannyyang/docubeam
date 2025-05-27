# Product Architecture Documentation

This document provides a comprehensive overview of the PDF Chat Website AI architecture, including system design, component interactions, data flow, and technical implementation details.

## System Overview

The PDF Chat Website AI is a full-stack application that enables users to upload PDF documents, extract text using OCR, and engage in AI-powered conversations about the document content. The system is built on Cloudflare's edge computing platform with a React frontend and Cloudflare Workers backend.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │ Cloudflare      │    │ External APIs   │
│   (Frontend)    │◄──►│ Workers         │◄──►│ - Mistral AI    │
│                 │    │ (Backend)       │    │ - AutoRAG       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Static Assets   │    │ Cloudflare R2   │    │ D1 Database     │
│ (CDN)           │    │ (File Storage)  │    │ (Metadata)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with React Router v7
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Custom component library with MagicUI animations
- **Build Tool**: Vite
- **TypeScript**: Full type safety across the application

### Backend
- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono.js for HTTP routing
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **AI Services**: Mistral AI for OCR, AutoRAG for chat

### Infrastructure
- **Platform**: Cloudflare Workers Platform
- **CDN**: Cloudflare Global Network
- **Edge Computing**: Distributed across 300+ locations
- **Security**: Built-in DDoS protection, WAF, SSL/TLS

## Application Architecture

### Frontend Architecture

```
app/
├── components/           # Reusable UI components
│   ├── chat/            # Chat interface components
│   ├── layout/          # Layout components
│   ├── magicui/         # Animated UI components
│   ├── pdf/             # PDF-specific components
│   ├── sections/        # Landing page sections
│   └── ui/              # Base UI components
├── config/              # Frontend configuration
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── routes/              # React Router routes
├── services/            # API service layer
└── types/               # TypeScript type definitions
```

**Key Frontend Components:**
- **PDF Upload**: Drag-and-drop interface with validation
- **Document List**: Grid view of uploaded documents
- **Chat Interface**: Real-time conversation with AI
- **Document Viewer**: PDF metadata and content display

### Backend Architecture

```
worker/
├── routes/              # HTTP route handlers
│   ├── document-routes.ts    # Document CRUD operations
│   ├── chat-routes.ts        # Chat functionality
│   ├── metadata-routes.ts    # Document metadata
│   ├── health-routes.ts      # Health checks
│   └── waitlist-routes.ts    # Waitlist management
├── services/            # Business logic layer
│   ├── document-orchestration-service.ts  # Main orchestrator
│   ├── file-storage-service.ts           # R2 operations
│   ├── ocr-processing-service.ts         # Mistral OCR
│   ├── document-validation-service.ts    # Input validation
│   ├── document-metadata-service.ts      # Metadata management
│   ├── document-retrieval-service.ts     # Data retrieval
│   └── chat-service.ts                   # AI chat logic
├── middleware/          # HTTP middleware
├── db/                  # Database schema and operations
├── utils/               # Utility functions
└── types.ts             # TypeScript definitions
```

## Data Flow Architecture

### Document Upload Flow

```
1. User uploads PDF → Frontend validation
2. File sent to /api/documents/upload
3. DocumentOrchestrationService.uploadDocument()
4. File validation (type, size, format)
5. Store original file in R2: documents/{id}/original/
6. Create metadata record in D1
7. Trigger OCR processing (Mistral AI)
8. Store OCR results in R2: documents/{id}/ocr/
9. Update metadata with OCR status
10. Return document URLs to frontend
```

### Chat Flow

```
1. User sends message → Chat interface
2. Message sent to /api/chat/message
3. ChatService processes request
4. Retrieve relevant document context
5. Send to AutoRAG with context
6. Stream AI response back to user
7. Store conversation in D1
```

### OCR Processing Flow

```
1. PDF uploaded to R2 storage
2. OCRProcessingService.processDocument()
3. Convert PDF to images/text
4. Send to Mistral AI OCR API
5. Process response (pages, images, text)
6. Store structured results:
   - documents/{id}/ocr/full-result.json
   - documents/{id}/ocr/extracted-text.md
   - documents/{id}/ocr/pages/page-XXX.md
   - documents/{id}/ocr/images/
7. Update document metadata
```

## Storage Architecture

### R2 Storage Structure

```
documents/
└── {document-id}/
    ├── original/
    │   └── {filename}.pdf          # Original uploaded file
    ├── ocr/
    │   ├── full-result.json        # Complete OCR response
    │   ├── extracted-text.md       # Consolidated text
    │   ├── pages/
    │   │   ├── page-001.md         # Individual page content
    │   │   ├── page-002.md
    │   │   └── ...
    │   └── images/
    │       ├── page-001-img-001.png
    │       ├── page-001-img-002.png
    │       └── ...
    └── metadata.json               # Document metadata
```

### D1 Database Schema

```sql
-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  page_count INTEGER DEFAULT 0,
  ocr_status TEXT DEFAULT 'pending',
  ocr_error TEXT,
  storage_path TEXT NOT NULL
);

-- Chat conversations
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  document_id TEXT REFERENCES documents(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT REFERENCES conversations(id),
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Waitlist
CREATE TABLE waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Service Layer Architecture

### Document Orchestration Service
**Purpose**: Main coordinator for document operations
**Responsibilities**:
- Orchestrate upload workflow
- Coordinate between validation, storage, and OCR services
- Handle error recovery and cleanup
- Manage document lifecycle

### File Storage Service
**Purpose**: R2 storage operations
**Responsibilities**:
- Upload/download files to/from R2
- Organize file structure
- Generate signed URLs
- Handle storage cleanup

### OCR Processing Service
**Purpose**: Mistral AI OCR integration
**Responsibilities**:
- Convert PDFs for OCR processing
- Interface with Mistral AI API
- Process and structure OCR results
- Handle OCR errors and retries

### Document Validation Service
**Purpose**: Input validation and security
**Responsibilities**:
- Validate file types and sizes
- Sanitize file names
- Validate document IDs
- Environment configuration validation

### Chat Service
**Purpose**: AI-powered chat functionality
**Responsibilities**:
- Process chat messages
- Retrieve document context
- Interface with AutoRAG
- Manage conversation state

## API Architecture

### RESTful API Design

```
GET    /api/documents              # List all documents
POST   /api/documents/upload       # Upload new document
GET    /api/documents/:id          # Get document metadata
DELETE /api/documents/:id          # Delete document
GET    /api/documents/:id/file     # Download original file
GET    /api/documents/:id/ocr      # Get OCR results
GET    /api/documents/:id/text     # Get extracted text
GET    /api/documents/:id/pages/:n # Get specific page content
GET    /api/documents/:id/ocr/status # Get OCR processing status

POST   /api/chat/message           # Send chat message
GET    /api/chat/conversations     # List conversations
GET    /api/chat/messages/:id      # Get conversation messages

POST   /api/waitlist               # Join waitlist
GET    /health                     # Health check
```

### Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  code?: number
}
```

## Security Architecture

### Authentication & Authorization
- **Current**: Public access (no authentication required)
- **Future**: JWT-based authentication with Cloudflare Access
- **File Access**: Signed URLs for secure file access

### Data Protection
- **Encryption**: TLS 1.3 for all communications
- **File Storage**: Server-side encryption in R2
- **Database**: Encrypted at rest in D1
- **API Keys**: Stored as environment variables

### Input Validation
- **File Types**: Strict PDF-only validation
- **File Size**: 10MB maximum limit
- **Content Sanitization**: XSS protection
- **Rate Limiting**: Cloudflare built-in protection

## Performance Architecture

### Caching Strategy
- **Static Assets**: CDN caching with long TTL
- **API Responses**: Edge caching for metadata
- **File Storage**: R2 global distribution
- **Database**: D1 read replicas

### Optimization Techniques
- **Code Splitting**: React lazy loading
- **Image Optimization**: Cloudflare Image Resizing
- **Bundle Optimization**: Tree shaking and minification
- **Edge Computing**: Sub-50ms response times globally

### Scalability Considerations
- **Horizontal Scaling**: Automatic with Cloudflare Workers
- **Database Scaling**: D1 automatic scaling
- **Storage Scaling**: R2 unlimited capacity
- **Global Distribution**: 300+ edge locations

## Monitoring & Observability

### Logging Architecture
- **Structured Logging**: JSON format with correlation IDs
- **Log Categories**: Upload, OCR, Chat, Route, Error events
- **Log Aggregation**: Cloudflare Analytics and Logs
- **Real-time Monitoring**: Wrangler tail for development

### Metrics & Analytics
- **Performance Metrics**: Response times, error rates
- **Business Metrics**: Upload success rates, OCR completion
- **User Analytics**: Document usage patterns
- **Infrastructure Metrics**: Worker invocations, storage usage

### Error Handling
- **Custom Error Classes**: Structured error types
- **Error Recovery**: Automatic retries for transient failures
- **Error Reporting**: Detailed error logs with context
- **Graceful Degradation**: Fallback mechanisms

## Deployment Architecture

### CI/CD Pipeline
```
1. Code Push → GitHub
2. Automated Tests → Vitest
3. Build Process → Vite + TypeScript
4. Deploy to Staging → Cloudflare Workers
5. Integration Tests → Automated
6. Deploy to Production → Cloudflare Workers
```

### Environment Management
- **Development**: Local development with Wrangler
- **Staging**: Preview deployments for testing
- **Production**: Global edge deployment

### Configuration Management
- **Environment Variables**: Cloudflare Workers secrets
- **Feature Flags**: Runtime configuration
- **API Keys**: Secure secret management

## Future Architecture Considerations

### Planned Enhancements
1. **Authentication System**: User accounts and document ownership
2. **Real-time Chat**: WebSocket support for live conversations
3. **Document Collaboration**: Multi-user document sharing
4. **Advanced OCR**: Support for more file types
5. **Analytics Dashboard**: Usage insights and metrics

### Scalability Roadmap
1. **Microservices**: Split services into separate Workers
2. **Event-Driven Architecture**: Pub/Sub for async processing
3. **Multi-tenant Architecture**: Isolated customer environments
4. **Global Data Replication**: Regional data residency

### Technology Evolution
1. **AI Model Upgrades**: Latest Mistral AI capabilities
2. **Edge AI**: On-device processing for privacy
3. **Vector Database**: Semantic search capabilities
4. **Streaming Architecture**: Real-time data processing

This architecture provides a solid foundation for a scalable, secure, and performant PDF chat application while maintaining flexibility for future enhancements and growth.
