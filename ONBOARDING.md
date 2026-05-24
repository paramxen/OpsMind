# Developer Onboarding Guide

Welcome to OpsMind AI! This guide will get you up and running in 10 minutes.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git configured
- Text editor (VS Code recommended)

## 5-Minute Setup

### 1. Clone & Install
```bash
git clone <repo>
cd SOP-AI-AGENT
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit .env.local with your values:
# - MONGO_URI: MongoDB Atlas connection
# - REDIS_URL: Redis connection (localhost:6379 for dev)
# - OPENAI_API_KEY: From openai.com
# - JWT_SECRET: Generate a 32+ character secret
```

### 3. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:4000
```

### 4. Test the API
```bash
# Create account
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dev@example.com",
    "password": "TestPassword123!",
    "firstName": "Dev",
    "lastName": "User"
  }'
```

Done! You're running OpsMind AI locally.

## Project Structure Overview

```
src/
├── core/              # Shared utilities
│   ├── config/       # Environment validation
│   ├── database/     # MongoDB connection
│   ├── errors/       # Error types
│   ├── logger/       # Logging setup
│   ├── middleware/   # Express middleware
│   └── security/     # Auth utilities
│
├── modules/           # Feature modules
│   ├── auth/         # Authentication
│   ├── users/        # User management
│   ├── documents/    # Document storage
│   ├── ingestion/    # PDF processing
│   ├── embeddings/   # Vector generation
│   ├── chat/         # Conversations & RAG
│   └── retrieval/    # Vector search
│
├── jobs/              # Background processing
│   └── ingestion.job.ts  # BullMQ worker
│
├── websocket/         # Real-time updates
│   ├── index.ts      # Socket.IO setup
│   └── events.ts     # Event types
│
├── types/             # TypeScript interfaces
├── validations/       # Zod schemas
├── app.ts            # Express app setup
└── index.ts          # Server entry point
```

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/index.ts` | Server entry point, starts DB + jobs + WebSocket |
| `src/app.ts` | Express app, middleware, route registration |
| `src/core/config/index.ts` | Environment validation, all config |
| `src/modules/auth/routes.ts` | Auth endpoints (signup, signin, refresh) |
| `src/modules/ingestion/routes.ts` | Document upload + PDF processing |
| `src/modules/chat/routes.ts` | Chat endpoints + RAG |
| `src/websocket/index.ts` | WebSocket server setup |
| `src/jobs/ingestion.job.ts` | BullMQ worker for async jobs |

## Common Development Tasks

### Adding a New API Endpoint

1. **Create handler** in module's routes file:
```typescript
// src/modules/myfeature/routes.ts
export const myHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await doSomething(req.body);
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

3. **Register route**:
```typescript
router.post('/', requireAuth, myHandler);
```

4. **Test it**:
```bash
curl -X POST http://localhost:4000/api/v1/feature \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"field":"value"}'
```

### Querying the Database

```typescript
import { getDatabase } from '../core/database/index.js';

const db = getDatabase();
const users = await db.collection('users').find({}).toArray();
```

### Emitting WebSocket Events

```typescript
import { emitToUser } from '../websocket/index.js';

// Send notification to specific user
emitToUser(userId, 'notification', {
  type: 'success',
  message: 'Operation completed'
});
```

### Logging

```typescript
import { getLogger } from '../core/logger/index.js';

const logger = getLogger();
logger.info({ userId, action: 'created' }, 'User created account');
logger.warn({ documentId }, 'PDF parsing slow');
logger.error({ err }, 'Critical failure');
```

### Adding Database Index

In `src/core/database/index.ts`, add to `ensureIndexes()`:
```typescript
await collections.myCollection.createIndex({ field: 1 }, { unique: true });
```

## Testing Workflows

### Authentication Flow
```bash
# 1. Signup
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }')

# 2. Signin
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }' | jq -r '.data.accessToken')

# 3. Use token in requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/documents
```

### Document Upload Flow
```bash
# Upload a PDF
curl -X POST http://localhost:4000/api/v1/documents \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@sample.pdf"
# Returns: { documentId, status: "queued" }

# Check processing status
curl http://localhost:4000/api/v1/documents/jobs/<documentId>
```

### Chat with RAG
```bash
# Create conversation with document
CONV=$(curl -s -X POST http://localhost:4000/api/v1/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Analysis",
    "documentIds": ["<documentId>"]
  }' | jq -r '.data.conversationId')

# Send message and get RAG response
curl -X POST http://localhost:4000/api/v1/chat/$CONV/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Summarize the document"}'
```

## Debugging Tips

### Check Build Errors
```bash
npm run type-check
npm run build
```

### View Server Logs
```bash
# Development mode shows detailed logs
npm run dev 2>&1 | grep -E "ERROR|WARN|INFO"
```

### Inspect Database
```bash
# Connect to MongoDB
mongosh "$MONGO_URI"

# Check collections
use opsmind
show collections

# Query documents
db.documents.find().pretty()
db.chunks.findOne()
db.messages.find({ conversationId: ObjectId('...') })
```

### Check Redis
```bash
# Connect to Redis
redis-cli

# View keys
KEYS "*"

# Check job queue
LLEN "bull:ingestion:wait"
LRANGE "bull:ingestion:wait" 0 10
```

### Monitor WebSocket Connections
```typescript
// In src/websocket/index.ts
io.on('connection', (socket) => {
  console.log('Connected:', socket.userId, socket.id);
  // Check io.engine.clientsCount for total connections
});
```

## Running Tests

### Type Safety
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

### Full Build
```bash
npm run build
```

## Docker Development

### Start Local Stack
```bash
docker-compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- App on `localhost:4000`

### View Logs
```bash
docker-compose logs -f app
```

### Stop Stack
```bash
docker-compose down
```

## Useful Commands

```bash
# Development
npm run dev              # Start with hot-reload
npm run build           # Compile TypeScript
npm start               # Run compiled code
npm run type-check      # Check types without building
npm run lint            # Run ESLint
npm run format          # Format code

# Docker
npm run docker:build    # Build image
npm run docker:run      # Run container
npm run docker:compose  # Start docker-compose
npm run docker:compose:down  # Stop docker-compose

# Utility
npm run clean           # Remove dist/ and node_modules
npm run rebuild         # Clean + install + build
```

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Server port | `4000` |
| `MONGO_URI` | MongoDB connection | `mongodb+srv://...` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `OPENAI_API_KEY` | LLM API key | `sk-...` |
| `JWT_SECRET` | Token signing key | 32+ random chars |
| `JWT_EXPIRY` | Access token lifetime | `15m` |
| `LOG_LEVEL` | Log verbosity | `debug`, `info`, `warn`, `error` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:3000,...` |

## File Naming Conventions

- **Files**: `camelCase.ts`
- **Folders**: `kebab-case` (for modules) or `camelCase` (for config)
- **Classes**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` (prefix with `I` optional)

## Code Style Guide

### Imports
```typescript
// External imports first
import express from 'express';
import { z } from 'zod';

// Internal imports
import { getConfig } from '../config/index.js';
import { getLogger } from '../logger/index.js';
```

### Error Handling
```typescript
try {
  const result = await operation();
  return result;
} catch (error) {
  logger.error({ err: error }, 'Operation failed');
  throw new CustomError('User-friendly message');
}
```

### Async/Await
```typescript
// Always use async/await, not .then()
const result = await asyncFunction();
```

### Logging
```typescript
// Always include context
logger.info({ userId, documentId, action }, 'Clear message');
```

## Learning Resources

- **API Docs**: See `docs/API.md` for endpoint reference
- **Architecture**: See `docs/ARCHITECTURE.md` for system design
- **Examples**: See `QUICKSTART.md` for curl examples
- **Deployment**: See `docs/DEPLOYMENT.md` for production setup

## Getting Help

1. **Check the docs**: Most questions answered in `docs/` folder
2. **Review examples**: See curl examples in `QUICKSTART.md`
3. **Inspect types**: Check `src/types/index.ts` for interfaces
4. **Search code**: Use VS Code search for similar patterns
5. **Check logs**: `npm run dev` shows detailed logging

## Next Steps

1. ✅ Get the server running (`npm run dev`)
2. ✅ Test authentication (create account + login)
3. ✅ Explore database structure (MongoDB, Redis)
4. ✅ Review code organization (modules, services)
5. ✅ Make a small code change (test your workflow)
6. ✅ Read architecture guide (`docs/ARCHITECTURE.md`)
7. ✅ Start frontend work (see `frontend/` folder)

## Quick Wins for First Day

- [ ] Get server running locally
- [ ] Create test account
- [ ] Review module structure
- [ ] Run type-check and build
- [ ] Make a small code change
- [ ] Test with curl
- [ ] Read QUICKSTART.md
- [ ] Explore docs/

---

**Welcome to the team! 🚀**

For any questions, refer to the documentation files or review similar patterns in the codebase.
