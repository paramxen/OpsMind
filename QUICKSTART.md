# Quick Reference Guide

## Starting the Server

### Development
```bash
npm install
npm run dev
```
Runs on http://localhost:4000 with hot-reload

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker-compose up -d
```
- App: http://localhost:4000
- MongoDB: localhost:27017
- Redis: localhost:6379

## API Examples

### Create Account
```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
# Returns: { accessToken, refreshToken, user }
```

### Upload Document (with token)
```bash
curl -X POST http://localhost:4000/api/v1/documents \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "files=@document.pdf"
# Returns: { documentId, status: "queued" } - async processing
```

### Create Conversation
```bash
curl -X POST http://localhost:4000/api/v1/chat \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Document Analysis",
    "documentIds": ["<DOCUMENT_ID>"]
  }'
# Returns: { conversationId, ... }
```

### Send Message with RAG
```bash
curl -X POST http://localhost:4000/api/v1/chat/<CONVERSATION_ID>/messages \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Summarize the document"
  }'
# Returns: { message, response, citations }
```

## WebSocket Connection

### Connect and Listen (JavaScript/Node.js)
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: accessToken
  }
});

// Connected
socket.on('authenticated', (data) => {
  console.log('Connected:', data.userId);
});

// Listen for document processing
socket.on('document:processing:progress', (data) => {
  console.log(`Upload ${data.progress}% complete`);
});

// Listen for chat streaming
socket.on('chat:response:chunk', (data) => {
  console.log('Assistant chunk:', data.content);
});

// Listen for notifications
socket.on('notification', (notif) => {
  console.log(notif.type, notif.message);
});

// Disconnect
socket.disconnect();
```

## Environment Variables

Copy `.env.example` to `.env.local` and set:

**Required:**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/opsmind
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
JWT_SECRET=a-32-character-secret-key-for-jwt-signing
```

**Optional (defaults shown):**
```
NODE_ENV=development
PORT=4000
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
RATE_LIMIT_MAX_REQUESTS=100
EMBEDDING_BATCH_SIZE=16
```

## Project Structure

```
src/
  core/              # Infrastructure
    config/          # Environment variables (Zod)
    database/        # MongoDB setup
    errors/          # Error types
    logger/          # Pino logging
    middleware/      # Express middleware
    security/        # Crypto utilities
  modules/           # Features
    auth/            # User authentication
    documents/       # Document management
    ingestion/       # PDF processing
    embeddings/      # Vector generation
    chat/            # Conversations & RAG
  jobs/              # Background work
    ingestion.job.ts # BullMQ worker
  websocket/         # Real-time
  types/             # TypeScript interfaces
  validations/       # Zod schemas
```

## Common Tasks

### Add New API Endpoint

1. **Create route handler** in `src/modules/<feature>/routes.ts`:
```typescript
export const handleRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Your logic
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
```

2. **Add validation schema** in `src/validations/index.ts`:
```typescript
export const MySchema = z.object({
  field: z.string().min(1),
});
```

3. **Register route** in `src/modules/<feature>/routes.ts`:
```typescript
router.post('/', requireAuth, handleRequest);
```

### Add Database Index

In `src/core/database/index.ts`:
```typescript
await collections.myCollection.createIndex({ field: 1 }, { unique: true });
```

### Log Information

```typescript
import { getLogger } from '../core/logger/index.js';

const logger = getLogger();
logger.info({ userId, documentId }, 'User uploaded document');
logger.warn({ err }, 'Failed to process');
logger.error({ err }, 'Critical error');
logger.debug({ data }, 'Debug info');
```

### Emit WebSocket Event

```typescript
import { emitToUser } from '../websocket/index.js';

emitToUser(userId, 'notification', {
  type: 'success',
  message: 'Document processed successfully'
});
```

## Troubleshooting

### Server won't start
```bash
# Check logs
npm run dev 2>&1 | grep ERROR

# Verify env vars
echo $MONGO_URI $OPENAI_API_KEY $JWT_SECRET

# Check ports
lsof -i :4000
```

### MongoDB connection error
```bash
# Verify connection string
mongosh "$MONGO_URI"

# Check network access (if using Atlas)
# Go to Atlas > Network Access > Add IP Address
```

### OpenAI API error
```bash
# Verify API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

### PDF parsing fails
- Ensure file is valid PDF
- Check file size (<50MB)
- Verify pdf-parse is installed: `npm list pdf-parse`

### Jobs not processing
```bash
# Check Redis connection
redis-cli PING  # Should return PONG

# Check job queue
redis-cli KEYS "bull:ingestion:*"
redis-cli LLEN "bull:ingestion:wait"
```

## Database Queries

### Connect to MongoDB
```bash
mongosh "$MONGO_URI"
use opsmind
```

### Check collections
```javascript
show collections
db.documents.find().limit(5)
db.chunks.countDocuments()
db.messages.find({ conversationId: ObjectId('...') })
```

### Index status
```javascript
db.documents.getIndexes()
```

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Verify JWT_SECRET is 32+ characters
- [ ] Restrict CORS_ORIGIN to frontend domain
- [ ] Enable MongoDB backups
- [ ] Configure Redis persistence
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS (reverse proxy)
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
- [ ] Test health endpoint: `GET /health`

## Performance Tuning

### Increase concurrency
In `src/jobs/ingestion.job.ts`:
```typescript
concurrency: 4  // From default 2
```

### Adjust chunk size
In `src/modules/ingestion/chunk.service.ts`:
```typescript
const CHUNK_TOKEN_LIMIT = 2000;  // From default 1000
const CHUNK_OVERLAP = 200;        // From default 100
```

### Batch embeddings
In `.env.local`:
```
EMBEDDING_BATCH_SIZE=32  # From default 16
```

### Connection pooling
In `src/core/database/index.ts`:
```typescript
maxPoolSize: 50,  // From default 20
minPoolSize: 10,  // From default 5
```

## Resources

- **API Docs**: See `docs/API.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **Deployment**: See `docs/DEPLOYMENT.md`
- **Full Summary**: See `BUILD_SUMMARY.md`

## Support

- TypeScript errors: Run `npm run type-check`
- Format code: Run `npm run format`
- Lint code: Run `npm run lint`
- Build: Run `npm run build`

---
For detailed information, see the documentation files in the `docs/` directory.
