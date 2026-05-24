# OpsMind AI - API Documentation

## Base URL
```
http://localhost:4000/api/v1
```

## Authentication

All API endpoints (except `/auth/signup` and `/auth/signin`) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

### Get Tokens (Login)
```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "userId": "...",
      "email": "user@example.com",
      "role": "user"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Create Account
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Refresh Token
```bash
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

## Document Management

### Upload Documents
```bash
POST /documents
Content-Type: multipart/form-data
Authorization: Bearer <token>

Files: [file1.pdf, file2.pdf, ...]
Max 5 files, max 50MB per file

Response (202 Accepted):
{
  "success": true,
  "data": {
    "results": [
      {
        "documentId": "...",
        "fileName": "document.pdf",
        "status": "queued",
        "message": "Document queued for ingestion"
      }
    ],
    "summary": {
      "total": 1,
      "queued": 1,
      "failed": 0
    }
  }
}
```

### List Documents
```bash
GET /documents?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "documents": [
      {
        "documentId": "...",
        "userId": "...",
        "filename": "document.pdf",
        "status": "completed",
        "uploadedAt": "2024-05-23T...",
        "processedAt": "2024-05-23T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### Get Document Chunks
```bash
GET /documents/:documentId/chunks
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "documentId": "...",
    "chunkCount": 15,
    "chunks": [
      {
        "chunkIndex": 0,
        "text": "...",
        "pageNumbers": [1, 2]
      }
    ]
  }
}
```

### Check Ingestion Job Status
```bash
GET /documents/jobs/:jobId

Response:
{
  "success": true,
  "data": {
    "jobId": "...",
    "state": "active|completed|failed|delayed",
    "progress": 75,
    "attempts": 1
  }
}
```

## Chat & RAG

### Create Conversation
```bash
POST /chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "My Conversation",
  "documentIds": ["doc1", "doc2"]
}

Response:
{
  "success": true,
  "data": {
    "conversationId": "...",
    "userId": "...",
    "title": "My Conversation",
    "documentIds": ["doc1", "doc2"],
    "messageCount": 0,
    "createdAt": "2024-05-23T..."
  }
}
```

### List Conversations
```bash
GET /chat?page=1&limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "conversations": [
      {
        "conversationId": "...",
        "title": "...",
        "messageCount": 5,
        "createdAt": "2024-05-23T...",
        "updatedAt": "2024-05-23T..."
      }
    ],
    "pagination": { ... }
  }
}
```

### Send Message & Get RAG Response
```bash
POST /chat/:conversationId/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "What is in the document?"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": {
      "messageId": "...",
      "conversationId": "...",
      "role": "user",
      "content": "What is in the document?",
      "createdAt": "2024-05-23T..."
    },
    "response": {
      "messageId": "...",
      "role": "assistant",
      "content": "Based on the documents, ...",
      "citations": [
        {
          "chunkIndex": 0,
          "text": "...",
          "source": "document.pdf",
          "relevance": 0.95
        }
      ]
    }
  }
}
```

### Get Conversation Messages
```bash
GET /chat/:conversationId/messages?page=1&limit=20
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "conversationId": "...",
    "messages": [
      {
        "messageId": "...",
        "role": "user|assistant",
        "content": "...",
        "citations": [...],
        "createdAt": "2024-05-23T..."
      }
    ],
    "pagination": { ... }
  }
}
```

## WebSocket Events

Connect to WebSocket:
```javascript
const socket = io('http://localhost:4000', {
  auth: {
    token: accessToken
  }
});

// Listen for authentication
socket.on('authenticated', (data) => {
  console.log('Connected:', data.userId);
});

// Listen for document processing
socket.on('document:processing:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});

// Listen for chat responses
socket.on('chat:response:chunk', (data) => {
  console.log('Chunk:', data.content);
});

// Listen for notifications
socket.on('notification', (notification) => {
  console.log(notification.type, notification.message);
});
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed: Invalid email format"
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Resource not found"
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "error": "Document with same content already exists"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "error": "Too many requests, please try again later"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created |
| 202 | Accepted - Request accepted for processing |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - No/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 502 | Bad Gateway - External service error |

## Examples

### Complete Upload & Chat Workflow

```javascript
// 1. Login
const authRes = await fetch('http://localhost:4000/api/v1/auth/signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const { data: { accessToken } } = await authRes.json();

// 2. Upload document
const formData = new FormData();
formData.append('files', pdfFile);

const uploadRes = await fetch('http://localhost:4000/api/v1/documents', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: formData
});
const { data: { results } } = await uploadRes.json();
const documentId = results[0].documentId;

// 3. Create conversation with document
const convRes = await fetch('http://localhost:4000/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    title: 'Document Analysis',
    documentIds: [documentId]
  })
});
const { data: { conversationId } } = await convRes.json();

// 4. Send message with RAG
const msgRes = await fetch(
  `http://localhost:4000/api/v1/chat/${conversationId}/messages`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      content: 'Summarize the document'
    })
  }
);
const { data } = await msgRes.json();
console.log('Assistant:', data.response.content);
console.log('Citations:', data.response.citations);
```
