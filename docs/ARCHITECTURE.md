# OpsMind AI - Complete Architecture Guide

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Auth | Documents | Chat | Real-time Updates (WebSocket)  │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP/WebSocket
┌────────────────────────▼────────────────────────────────────────┐
│                    Backend (Node.js/Express)                     │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐       │
│  │   Auth Svc     │ │ Document Svc   │ │  Chat Svc      │       │
│  │ - JWT tokens   │ │ - PDF parsing  │ │ - RAG pipeline │       │
│  │ - Password mgmt│ │ - Chunking     │ │ - Citations    │       │
│  └────────────────┘ └────────────────┘ └────────────────┘       │
│  ┌────────────────────────────────────────────────────────┐     │
│  │          Job Queue (BullMQ)                             │     │
│  │  - Async PDF ingestion (parallelized)                  │     │
│  │  - Embedding generation (batched, retried)             │     │
│  │  - Progress tracking & failure handling                │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         WebSocket (Socket.IO)                           │     │
│  │  - Document processing updates                         │     │
│  │  - Chat streaming responses                            │     │
│  │  - Real-time notifications                             │     │
│  └────────────────────────────────────────────────────────┘     │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
     ┌───────▼────────┐          ┌──────────▼─────────┐
     │  MongoDB Atlas │          │  Redis Queue      │
     │  - Users       │          │  - Job persistence│
     │  - Documents   │          │  - Rate limiting  │
     │  - Chunks      │          │  - Cache          │
     │  - Vector idx  │          │  - WebSocket data │
     │  - Chats       │          │                   │
     │  - Messages    │          │                   │
     └────────────────┘          └───────────────────┘
             │
     ┌───────▼────────────────┐
     │  External Services     │
     │  - OpenAI (GPT-4, Embed)
     │  - Possibly: Gemini, Claude
     └────────────────────────┘
```

## Data Flow

### 1. Document Ingestion Pipeline

```
User Upload
    ↓
[API] POST /documents (multipart)
    ↓
[Multer] File validation & storage
    ↓
[Service] Create document entry + hash (dedup)
    ↓
[Job] Add to BullMQ ingestion queue (202 Accepted)
    ↓
[Worker] Process async:
    ├─ Extract PDF text + metadata
    ├─ Split into chunks (1000 tokens, 100 overlap)
    ├─ Batch embed chunks (16 at a time, retry 3x)
    ├─ Store with vectors in MongoDB
    └─ Update document status (uploaded→processing→completed)
    ↓
[WebSocket] Emit progress events to client
    ↓
Client UI updates in real-time
```

### 2. Chat & RAG Pipeline

```
User Message
    ↓
[API] POST /chat/:conversationId/messages
    ↓
[Service] Retrieve message + context:
    ├─ Get recent conversation history (last 10 msgs)
    ├─ Extract query vector via embedding
    ├─ Vector search MongoDB (cosine similarity)
    ├─ Retrieve top 5 relevant chunks
    └─ Build 3000-char context window
    ↓
[Service] Generate response:
    ├─ Build system prompt (zero-hallucination)
    ├─ Call GPT-4-turbo with context + history
    ├─ Extract citations from returned content
    └─ Store message + response in DB
    ↓
[WebSocket] Stream response chunks in real-time
    ↓
Client displays answer + citations with links
```

### 3. Authentication Flow

```
POST /auth/signin {email, password}
    ↓
[Service] Find user + verify password (bcrypt, constant-time)
    ↓
[Service] Generate token pair:
    ├─ Access token: 15 minutes (JWT HS256)
    ├─ Refresh token: 7 days (stored + hashed)
    └─ Return both to client
    ↓
Client stores tokens (localStorage/sessionStorage)
    ↓
All subsequent requests include: Authorization: Bearer <accessToken>
    ↓
[Middleware] Verify token + extract userId → attach to req.user
    ↓
Protected endpoints validate req.user.userId
```

## Technology Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript execution |
| Framework | Express.js | HTTP server & routing |
| Language | TypeScript | Type safety & DX |
| Database | MongoDB Atlas | Document storage + vector search |
| Cache/Queue | Redis + BullMQ | Async jobs + session data |
| Auth | JWT + bcrypt | Secure auth |
| Validation | Zod | Input validation at runtime |
| Logging | Pino | Structured JSON logging |
| File Upload | Multer | Multipart form handling |
| PDF | pdf-parse | PDF text extraction |
| Embeddings | OpenAI API | Vector generation |
| Chat | OpenAI API | GPT-4 responses |
| Real-time | Socket.IO | WebSocket communication |
| Security | Helmet.js | HTTP security headers |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 | React meta-framework |
| UI Library | React 19 | Component library |
| Language | TypeScript | Type safety |
| HTTP | Axios | API requests |
| Real-time | Socket.IO client | WebSocket events |
| Styling | Tailwind CSS | Utility CSS |
| Forms | Native HTML | Input handling |
| State | React hooks | Local state management |

## API Endpoints

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/signin` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Documents
- `POST /documents` - Upload files (multipart, async job queue)
- `GET /documents` - List user documents
- `GET /documents/:documentId/chunks` - Get chunks
- `GET /documents/jobs/:jobId` - Check ingestion status

### Chat
- `POST /chat` - Create conversation
- `GET /chat` - List conversations
- `GET /chat/:conversationId/messages` - Get messages
- `DELETE /chat/:conversationId` - Delete conversation
- `POST /chat/:conversationId/messages` - Send message & get RAG response

### System
- `GET /health` - Health check

## Database Schema

### Users
```javascript
{
  _id: ObjectId,
  email: String, // unique
  password: String, // bcrypt hashed
  firstName: String,
  lastName: String,
  role: 'user' | 'admin',
  status: 'active' | 'suspended',
  refreshTokenHash: String, // hash of refresh token
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: email (unique), status, createdAt
```

### Documents
```javascript
{
  _id: ObjectId,
  documentId: String,
  userId: ObjectId,
  filename: String,
  contentHash: String, // SHA256 for dedup
  sourceType: 'pdf',
  status: 'uploaded' | 'processing' | 'completed' | 'failed',
  chunkCount: Number,
  error: String,
  uploadedAt: Date,
  processedAt: Date,
  updatedAt: Date
}
// Indexes: contentHash (unique), userId, status, createdAt
```

### Chunks
```javascript
{
  _id: ObjectId,
  documentId: ObjectId,
  chunkIndex: Number,
  text: String,
  embedding: [3072 Numbers], // text-embedding-3-large dimension
  sourceFilename: String,
  pageNumbers: [Numbers],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: documentId, embedding (vector search - Atlas only)
```

### Conversations
```javascript
{
  _id: ObjectId,
  conversationId: String,
  userId: ObjectId,
  title: String,
  documentIds: [ObjectId],
  messageCount: Number,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: userId, createdAt
```

### Messages
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId,
  role: 'user' | 'assistant',
  content: String,
  citations: [{
    chunkIndex: Number,
    text: String,
    source: String,
    relevance: Number
  }],
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: conversationId, createdAt
```

## Error Handling

### Error Hierarchy
```
AppError (base, 500)
├─ ValidationError (400)
├─ AuthenticationError (401)
├─ AuthorizationError (403)
├─ NotFoundError (404)
├─ ConflictError (409)
├─ RateLimitError (429)
├─ InternalServerError (500)
└─ ExternalServiceError (502)
```

All errors return consistent JSON:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Security Features

1. **Authentication**
   - JWT with 15-minute expiry (+ 7-day refresh)
   - Bcrypt password hashing (12 rounds salt)
   - Constant-time comparison
   - Secure secret in environment

2. **Authorization**
   - Role-based access control (RBAC)
   - User ownership checks on documents/chats

3. **Data Protection**
   - Input validation with Zod (all endpoints)
   - SQL injection prevention (no SQL)
   - Rate limiting (100 req/15min by default)

4. **Transport Security**
   - HTTPS enforced (via reverse proxy)
   - CORS configured to whitelist origins
   - Helmet.js for HTTP security headers
   - CSRF protection via SameSite cookies

5. **API Security**
   - Content-Type validation
   - File type validation (PDF only)
   - File size limits (50MB)
   - Unique file hash deduplication

## Performance Optimizations

1. **Database**
   - Connection pooling (5-20 connections)
   - Compound indexes for queries
   - Vector search with cosine similarity

2. **Embedding Generation**
   - Batched requests (default 16 chunks)
   - Retry with exponential backoff
   - Cached embeddings

3. **Job Queue**
   - Async processing (don't block HTTP)
   - Parallel worker (concurrency: 2)
   - Failed job handling + cleanup

4. **API Response**
   - Consistent JSON structure
   - Pagination support
   - HTTP status codes

5. **Caching**
   - Redis for session data
   - Optional: Client-side caching

## Monitoring & Logging

### Structured Logging
```
[INFO] User login: userId=... email=...
[WARN] Embedding failed: documentId=... attempt=2/3
[ERROR] Database connection: err=...
```

Levels: debug, info, warn, error

### Health Metrics
- Request count
- Error rate
- Job queue depth
- Database connection pool
- Memory usage

### Alerts
- Failed ingestion jobs (retry exhausted)
- High error rates (5% threshold)
- Queue backlog (>100 pending)
- Low memory (<100MB free)

## Deployment Considerations

1. **Containerization**
   - Multi-stage Docker build
   - 150MB production image
   - Health checks included

2. **Orchestration**
   - Kubernetes-ready (stateless service)
   - Horizontal scaling possible
   - Session affinity optional (stateless JWT)

3. **Database**
   - MongoDB Atlas (managed service)
   - Vector search enabled
   - Daily backups

4. **Secrets**
   - Environment variables
   - Integration with AWS Secrets Manager, GCP Secret Manager, Azure Keyvault

5. **CI/CD**
   - GitHub Actions workflow
   - Build → Test → Deploy
   - Security scanning

## Future Enhancements

1. **Authentication**
   - OAuth2 (Google, GitHub)
   - MFA (TOTP, SMS)
   - SSO support

2. **Features**
   - Document search (hybrid: vector + keyword)
   - Streaming responses (SSE)
   - Conversation sharing
   - Custom embeddings (LLaMA, local)
   - Multi-language support

3. **Performance**
   - Query caching layer
   - Embedding cache
   - Rate limiting per user tier
   - Background reranking

4. **Operations**
   - Admin dashboard
   - Usage analytics
   - Team management
   - API quotas

5. **Infrastructure**
   - Multi-region deployment
   - CDN for static assets
   - Database replication
   - Disaster recovery plan
