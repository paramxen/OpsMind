# OpsMind AI - Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Redis
- OpenAI API key

### Setup

1. **Clone and install:**
```bash
git clone <repo>
cd SOP-AI-AGENT
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Build TypeScript:**
```bash
npm run build
```

4. **Start development server:**
```bash
npm run dev
```

Server runs on `http://localhost:4000`

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t opsmind-ai .

# Run container
docker run -p 4000:4000 \
  -e MONGO_URI=mongodb://... \
  -e REDIS_URL=redis://... \
  -e OPENAI_API_KEY=sk-... \
  -e JWT_SECRET=your-secret-32-chars \
  opsmind-ai
```

### Docker Compose (with MongoDB & Redis)

```bash
docker-compose up -d
```

This starts:
- MongoDB on port 27017
- Redis on port 6379
- OpsMind app on port 4000

Access health check: `http://localhost:4000/health`

## Environment Variables

### Required
```
MONGO_URI              MongoDB connection string
REDIS_URL             Redis URL
OPENAI_API_KEY        OpenAI API key
JWT_SECRET            Min 32 characters for JWT signing
```

### Optional
```
NODE_ENV              development|production (default: development)
PORT                  Server port (default: 4000)
LOG_LEVEL             debug|info|warn|error (default: info)
CORS_ORIGIN           Comma-separated allowed origins
RATE_LIMIT_MAX_REQUESTS   Max requests per window (default: 100)
```

## Production Deployment

### Heroku

1. **Install Heroku CLI:**
```bash
npm install -g heroku
heroku login
```

2. **Create app and set variables:**
```bash
heroku create opsmind-ai
heroku config:set MONGO_URI=...
heroku config:set REDIS_URL=...
heroku config:set OPENAI_API_KEY=...
heroku config:set JWT_SECRET=...
```

3. **Deploy:**
```bash
git push heroku main
```

### AWS ECS

1. **Build and push to ECR:**
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t opsmind-ai .
docker tag opsmind-ai:latest <account>.dkr.ecr.us-east-1.amazonaws.com/opsmind-ai:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/opsmind-ai:latest
```

2. **Create ECS task and service**
3. **Configure RDS for MongoDB Atlas** (or use MongoDB Atlas directly)
4. **Configure ElastiCache for Redis**
5. **Configure Application Load Balancer**

### Google Cloud Run

```bash
gcloud auth login
gcloud config set project <project-id>

# Build and push
gcloud builds submit --tag gcr.io/<project-id>/opsmind-ai

# Deploy
gcloud run deploy opsmind-ai \
  --image gcr.io/<project-id>/opsmind-ai \
  --platform managed \
  --region us-central1 \
  --set-env-vars MONGO_URI=...,REDIS_URL=...,OPENAI_API_KEY=...
```

## Database Migration

### MongoDB Atlas Setup

1. Create cluster at mongodb.com/cloud
2. Create database user
3. Add IP to whitelist
4. Get connection string
5. Set `MONGO_URI` environment variable

### Create Indexes

Indexes are automatically created on server startup via `ensureIndexes()`:
- Users: unique email index
- Documents: hash-based deduplication
- Chunks: vector search index (Atlas only)
- Conversations/Messages: user and date indexes

## Monitoring

### Health Check
```bash
curl http://localhost:4000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-05-23T...",
  "environment": "production"
}
```

### Logging

Structured logs with Pino:
```
[INFO] Document created: documentId=... userId=...
[ERROR] Processing failed: err=... jobId=...
```

Configure log level with `LOG_LEVEL` env var.

## Performance Tuning

### MongoDB
- Enable compression in connection string
- Use connection pooling (configured: min 5, max 20)
- Monitor query performance in Atlas UI

### Redis
- Use Redis cluster for horizontal scaling
- Set appropriate key TTLs
- Monitor memory usage

### Node.js
- Use clustering with PM2 for multi-core
- Set `NODE_ENV=production`
- Enable gzip compression (configured)

### BullMQ Jobs
- Adjust `EMBEDDING_BATCH_SIZE` for concurrency (default: 16)
- Monitor job queue depth
- Set up alerting for failed jobs

## Security

### Production Checklist
- [ ] JWT_SECRET is 32+ random characters
- [ ] CORS_ORIGIN is restricted to frontend domain
- [ ] Rate limiting enabled (429 on excess)
- [ ] HTTPS enforced (terminate SSL at load balancer)
- [ ] MongoDB authentication enabled
- [ ] Redis authentication enabled
- [ ] API keys stored in secret manager
- [ ] Database backups enabled
- [ ] WAF rules configured
- [ ] Security headers enabled (Helmet.js)

### Secrets Management

**AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name opsmind/production \
  --secret-string '{"MONGO_URI":"...","OPENAI_API_KEY":"..."}'
```

**GCP Secret Manager:**
```bash
echo -n "sk-..." | gcloud secrets create OPENAI_API_KEY --data-file=-
```

## Scaling

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Use session affinity if needed for WebSocket connections
- Scale database separately

### Vertical Scaling
- Increase Node.js heap size: `NODE_OPTIONS="--max-old-space-size=2048"`
- Upgrade database tier
- Increase Redis memory

### Auto-scaling
Configure based on:
- CPU usage (target: 70%)
- Memory usage (target: 80%)
- Request count (scale up at 1000 req/s)

## Rollback Procedure

```bash
# If deployment fails
heroku releases
heroku rollback v<previous-version>

# Or redeploy previous git commit
git revert HEAD
git push heroku main
```

## Troubleshooting

### Server won't start
```bash
# Check logs
npm run dev 2>&1 | grep ERROR

# Verify env vars
echo $MONGO_URI $REDIS_URL $JWT_SECRET
```

### Jobs failing
```bash
# Check BullMQ dashboard (if installed)
# Monitor Redis
redis-cli KEYS "bull:ingestion:*"
redis-cli LRANGE "bull:ingestion:failed" 0 10
```

### High latency
```bash
# Check MongoDB
mongosh <connection-string> --eval "db.serverStatus().connections"

# Check Redis
redis-cli INFO stats
```

## Backup & Recovery

### Database Backup
- MongoDB Atlas: Enable daily backups
- Download snapshots to S3/GCS

### Recovery
```bash
# Restore from MongoDB Atlas backup
# 1. Go to Atlas Console
# 2. Cluster > Backup
# 3. Select snapshot
# 4. Restore to new cluster or time-travel
```
