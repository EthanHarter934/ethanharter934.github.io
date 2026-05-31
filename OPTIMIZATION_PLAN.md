# Optimization Plan: Portfolio Chatbot

**Prepared**: May 31, 2026  
**Target**: Q3 2026  
**Priority Level**: Medium (stability before scalability)

---

## Phase 1: Security & Stability (Week 1-2)

### 1.1 Fix CORS Configuration

**Current State**: Lambda returns `Access-Control-Allow-Origin: *`  
**Problem**: Allows requests from any origin, violates security best practices  
**Solution**: Make origin configurable, default to CloudFront domain

**Implementation**:
```javascript
// backend/lambda/chat.js
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

const corsHeader = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Content-Type': 'application/json'
};
```

**Testing**: 
- Local: Request from `http://localhost:5173` should work
- Production: Only CloudFront domain should work

**Owner**: Ethan  
**Effort**: 30 minutes  
**Risk**: Low (already documented in DEPLOY.md step 7)

---

### 1.2 Add Input Validation

**Current State**: Messages array checked for existence, but not content  
**Problem**: No protection against malformed, oversized, or malicious input  
**Solution**: Add validation layer with sensible limits

**Implementation**:
```javascript
// backend/middleware/validateChat.js
export function validateChatRequest(req, res, next) {
  const { messages } = req.body;
  
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  
  if (messages.length > 50) {
    return res.status(400).json({ error: 'max 50 messages per request' });
  }
  
  for (const msg of messages) {
    if (typeof msg.content !== 'string' || msg.content.length > 4096) {
      return res.status(400).json({ error: 'message content must be string, max 4096 chars' });
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return res.status(400).json({ error: 'invalid role' });
    }
  }
  
  next();
}
```

**Limits Rationale**:
- 50 messages: Prevents abuse, keeps token count manageable
- 4096 chars: Reasonable for user input, still under typical limits
- These match typical API best practices

**Testing**:
- Valid message passes through
- Invalid role rejected
- Too many messages rejected
- Oversized message rejected

**Owner**: Ethan  
**Effort**: 1 hour  
**Risk**: Low (validation only, no logic changes)

---

### 1.3 Add Request Rate Limiting

**Current State**: No throttling on API requests  
**Problem**: Could be abused to rack up Bedrock costs  
**Solution**: Implement IP-based rate limiting

**Implementation**:
```javascript
// backend/middleware/rateLimiter.js
const requestCounts = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute per IP

export function rateLimiter(req, res, next) {
  const clientIp = req.ip;
  const now = Date.now();
  
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }
  
  const timestamps = requestCounts.get(clientIp);
  const windowStart = now - WINDOW_MS;
  
  // Remove old entries
  const recentRequests = timestamps.filter(t => t > windowStart);
  requestCounts.set(clientIp, recentRequests);
  
  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'too many requests' });
  }
  
  recentRequests.push(now);
  next();
}
```

**Note**: For production with CloudFront, should use CloudFront client IP header.

**Testing**:
- Make 20 requests from same IP: succeeds
- Make 21st request: returns 429
- After 60 seconds: request count resets

**Owner**: Ethan  
**Effort**: 1.5 hours  
**Risk**: Medium (could block legitimate traffic if limits too strict)

---

## Phase 2: Code Quality & Maintainability (Week 2-3)

### 2.1 Extract Shared Model ID Resolution

**Current State**: Model ID prefix logic duplicated in `server.js` and `chat.js`  
**Problem**: DRY violation, hard to maintain  
**Solution**: Create shared utility module

**Implementation**:
```javascript
// backend/utils/modelId.js
export function resolveModelId(modelId, region) {
  const id = modelId || 'anthropic.claude-haiku-4-5-20251001-v1:0';
  
  if (/^(us|eu|apac|global)\./.test(id) || id.startsWith('arn:')) {
    return id;
  }
  
  const r = region || 'us-east-1';
  let prefix = 'us';
  if (r.startsWith('eu-')) prefix = 'eu';
  else if (r.startsWith('ap-')) prefix = 'apac';
  
  return `${prefix}.${id}`;
}
```

**Usage**:
```javascript
// In server.js and chat.js
import { resolveModelId } from './utils/modelId.js';

const MODEL_ID = resolveModelId(
  process.env.BEDROCK_MODEL_ID,
  process.env.AWS_REGION
);
```

**Testing**:
- Verify regional prefixes are correct
- Verify regional ARNs pass through unchanged

**Owner**: Ethan  
**Effort**: 30 minutes  
**Risk**: Low (pure refactoring)

---

### 2.2 Implement Structured Logging

**Current State**: Console.log for errors only  
**Problem**: Hard to debug, no structured format, no timestamps  
**Solution**: Create logging utility for consistent format

**Implementation**:
```javascript
// backend/utils/logger.js
export const logger = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...data
    }));
  },
  error: (message, error = {}) => {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: error.message || String(error),
      stack: error.stack
    }));
  }
};
```

**Usage in server.js**:
```javascript
app.post('/api/chat', async (req, res) => {
  logger.info('Chat request received', { 
    messagesCount: req.body.messages?.length 
  });
  try {
    // ... chat logic
    logger.info('Chat response sent', { responseLength: reply.length });
  } catch (error) {
    logger.error('Chat request failed', error);
  }
});
```

**Testing**:
- Logs should include timestamp
- Error logs include stack trace
- Can pipe to CloudWatch in Lambda

**Owner**: Ethan  
**Effort**: 1.5 hours  
**Risk**: Low (logging only, no logic changes)

---

### 2.3 Consolidate Environment Configuration

**Current State**: Scattered env vars, defaults duplicated  
**Problem**: Hard to see all configuration at a glance  
**Solution**: Create centralized config module

**Implementation**:
```javascript
// backend/config.js
const config = {
  port: process.env.PORT || 3001,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 
    'anthropic.claude-haiku-4-5-20251001-v1:0',
  bedrockMaxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '1024'),
  dynamoTableName: process.env.DYNAMO_TABLE_NAME || 'PortfolioData',
  profilePk: process.env.PROFILE_PK || 'PROFILE#default',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  rateLimitWindow: 60 * 1000, // 1 minute
  rateLimitMax: 20,
  maxMessageCount: 50,
  maxMessageLength: 4096,
};

export default config;
```

**Testing**:
- Verify all env vars have sensible defaults
- Verify numeric parsing works

**Owner**: Ethan  
**Effort**: 1 hour  
**Risk**: Low (consolidation only)

---

## Phase 3: Performance Optimization (Week 3-4)

### 3.1 Add Portfolio Data Caching in Lambda

**Current State**: Every chat call queries DynamoDB for project/skill data  
**Problem**: Unnecessary latency and DynamoDB reads  
**Solution**: Cache profile data in Lambda's `/tmp` with TTL

**Implementation**:
```javascript
// backend/utils/cache.js
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cache = { data: null, timestamp: null };

export function setCache(key, value) {
  cache = { data: { [key]: value }, timestamp: Date.now() };
}

export function getCache(key) {
  if (!cache.data || Date.now() - cache.timestamp > CACHE_TTL_MS) {
    return null;
  }
  return cache.data[key];
}

export function clearCache() {
  cache = { data: null, timestamp: null };
}
```

**Integration in chat.js**:
```javascript
import { getCache, setCache } from './cache.js';

async function getPortfolioData() {
  const cached = getCache('portfolio');
  if (cached) return cached;
  
  const data = await queryDynamoDb();
  setCache('portfolio', data);
  return data;
}
```

**Testing**:
- First call hits DynamoDB
- Second call uses cache
- Cache expires after 5 minutes
- Cache survives across Lambda invocations (within same container)

**Owner**: Ethan  
**Effort**: 2 hours  
**Risk**: Medium (cache invalidation complexity, but 5-min TTL is safe)

**Benefit**: 
- ~50-70% faster tool response for repeat questions
- ~30-40% reduction in DynamoDB read costs

---

### 3.2 Implement Tool Response Deduplication

**Current State**: If user asks about projects twice, tool called twice  
**Problem**: Unnecessary Bedrock invocations  
**Solution**: Track tool calls within single chat sequence

**Implementation**:
```javascript
// In backend/lambda/chat.js - modify runConverseLoop
const toolCallCache = new Map();

async function runConverseLoop(client, messages) {
  let bedrockMessages = toBedrockMessages(messages);
  let response;

  while (true) {
    response = await client.send(/* ... */);
    
    if (response.stopReason !== 'tool_use') break;
    
    const toolResultBlocks = [];
    
    for (const block of response.output.message.content) {
      if (!block.toolUse) continue;
      
      const cacheKey = `${block.toolUse.name}:${JSON.stringify(block.toolUse.input)}`;
      
      let result;
      if (toolCallCache.has(cacheKey)) {
        result = toolCallCache.get(cacheKey);
      } else {
        result = await callTool(block.toolUse.name, block.toolUse.input);
        toolCallCache.set(cacheKey, result);
      }
      
      // ... rest of logic
    }
  }
}
```

**Testing**:
- Ask "What are my projects?" twice in same chat
- Should only call tool once
- Second reference uses cached result

**Owner**: Ethan  
**Effort**: 1.5 hours  
**Risk**: Low (cache is local to single chat)

**Benefit**:
- Faster response for follow-up questions
- Reduced Bedrock API calls

---

### 3.3 Lazy Load Frontend Components

**Current State**: Home.jsx renders all sections on load  
**Problem**: Initial page load includes unneeded components below fold  
**Solution**: Use React.lazy for sections

**Implementation**:
```javascript
// frontend/src/pages/Home.jsx
import { Suspense, lazy } from 'react';

const Education = lazy(() => import('../components/Education'));
const Skills = lazy(() => import('../components/Skills'));
const Experience = lazy(() => import('../components/Experience'));
const Projects = lazy(() => import('../components/Projects'));

function LoadingPlaceholder() {
  return <div className="loading-placeholder">Loading...</div>;
}

// In render:
<Suspense fallback={<LoadingPlaceholder />}>
  <Education />
</Suspense>
```

**Testing**:
- Measure Time to Interactive before/after
- Verify sections load when scrolled into view

**Owner**: Ethan  
**Effort**: 1 hour  
**Risk**: Low (Suspense is well-supported)

**Benefit**:
- Estimated 15-25% faster initial paint on slow connections
- Better mobile experience

---

## Phase 4: Testing & Quality Assurance (Week 4)

### 4.1 Add Unit Tests for Tool Handlers

**Current State**: No tests  
**Problem**: Tool handler regressions undetected  
**Solution**: Jest tests for each tool

**Implementation**: Create `backend/mcp-server/tools/__tests__/` directory

**Example test** (`getProjects.test.js`):
```javascript
import { handler } from '../getProjects.js';

describe('getProjects', () => {
  it('returns all projects when input is empty', async () => {
    const result = await handler({});
    expect(Array.isArray(result.projects)).toBe(true);
    expect(result.projects.length).toBeGreaterThan(0);
  });
  
  it('filters by featured flag', async () => {
    const result = await handler({ featured: true });
    result.projects.forEach(p => {
      expect(p.featured).toBe(true);
    });
  });
});
```

**Coverage Target**: 80%+ for critical paths  
**Owner**: Ethan  
**Effort**: 3-4 hours  
**Risk**: Low (testing only)

---

### 4.2 Add Integration Tests

**Current State**: No integration tests  
**Problem**: Chat flow not tested end-to-end  
**Solution**: Test full request-response cycle

**Example** (`backend/__tests__/chat.integration.test.js`):
```javascript
describe('POST /api/chat integration', () => {
  it('responds to portfolio questions', async () => {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'What are my projects?' }
        ]
      })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBeTruthy();
  });
});
```

**Coverage Target**: Happy path + error cases  
**Owner**: Ethan  
**Effort**: 2-3 hours  
**Risk**: Low (testing only)

---

### 4.3 Set Up Pre-commit Hooks

**Current State**: No validation before commits  
**Problem**: Lint errors, missing tests merged to main  
**Solution**: Husky + lint-staged

**Implementation**:
```bash
npm install husky lint-staged --save-dev
npx husky install
```

**`.husky/pre-commit`**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
```

**`package.json`**:
```json
"lint-staged": {
  "backend/**/*.js": "eslint",
  "frontend/src/**/*.jsx": "eslint"
}
```

**Owner**: Ethan  
**Effort**: 1 hour  
**Risk**: Low (development tool)

---

## Phase 5: Documentation & Deployment (Ongoing)

### 5.1 Add API Documentation

**Current State**: Limited endpoint docs  
**Solution**: OpenAPI/Swagger spec

**File**: `backend/openapi.yaml`

```yaml
openapi: 3.0.0
info:
  title: Portfolio Chat API
  version: 1.0.0
paths:
  /api/chat:
    post:
      summary: Send a chat message
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        enum: [user, assistant]
                      content:
                        type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
```

**Owner**: Ethan  
**Effort**: 1-2 hours

---

### 5.2 Update Deployment Guide

**Current State**: DEPLOY.md is good, but could include optimizations  
**Additions**:
- Cache expiration strategy
- Rate limit tuning recommendations
- Monitoring & alerting setup

**Owner**: Ethan  
**Effort**: 1 hour

---

## Implementation Timeline

```
Week 1-2: Security & Stability
  ├─ Fix CORS (30 min)
  ├─ Input validation (1 hr)
  └─ Rate limiting (1.5 hrs)

Week 2-3: Code Quality
  ├─ Extract model ID utility (30 min)
  ├─ Structured logging (1.5 hrs)
  └─ Config consolidation (1 hr)

Week 3-4: Performance
  ├─ Data caching (2 hrs)
  ├─ Tool deduplication (1.5 hrs)
  └─ Lazy loading (1 hr)

Week 4: Testing & QA
  ├─ Unit tests (4 hrs)
  ├─ Integration tests (3 hrs)
  └─ Pre-commit hooks (1 hr)

Ongoing: Documentation
  ├─ API docs (2 hrs)
  └─ Deploy guide updates (1 hr)

Total Estimated Effort: ~22-25 hours
```

---

## Success Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Security Issues | 1 (CORS) | 0 | Week 1 |
| Code Duplication | 2 instances | 0 | Week 2 |
| Test Coverage | 0% | 80%+ | Week 4 |
| Response Time (w/ cache) | ~2s | ~500ms | Week 3 |
| Uptime | - | 99.9% | Ongoing |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Rate limiting too strict | Start with high limit (20/min), monitor and adjust |
| Cache invalidation issues | Short TTL (5 min) ensures data freshness |
| Breaking changes in tests | Run full integration tests before deploying |
| Performance regression | Compare metrics before/after optimization |

---

## Conclusion

This optimization plan balances **security, maintainability, and performance**. Starting with critical security fixes ensures the app is production-ready, while subsequent phases improve developer experience and end-user performance.

**Recommended start date**: June 3, 2026  
**Expected completion**: June 30, 2026  
**Deployment window**: Post-completion, with 1-week validation period

