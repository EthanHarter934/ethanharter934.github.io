# Chat Abuse Protection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bound worst-case Bedrock spend from the public chat endpoint by adding DynamoDB-backed rate limits, payload validation, and a tool-loop cap to the Lambda, plus AWS-level backstops.

**Architecture:** Shared pure validation + a DynamoDB counter-based limiter live in `backend/utils/` (the only shared dir that `package-lambda.js` ships). The Lambda handler enforces validate → per-IP limit → global daily cap → capped Bedrock loop, and returns 429s the frontend renders as friendly terminal messages. One-time AWS CLI commands (throttle, concurrency, TTL, budget) are documented in DEPLOY.md and applied at deploy.

**Tech Stack:** Node.js ES modules, `node:test` + `node:assert` (built-in, no new deps), AWS SDK v3 (`lib-dynamodb` already a dependency), API Gateway HTTP API, AWS Budgets.

**Spec:** `docs/superpowers/specs/2026-07-18-chat-abuse-protection-design.md`

## Global Constraints

- No new npm dependencies; tests use the built-in `node:test` runner
- ES modules (`type: "module"`) throughout the backend
- `backend/middleware/` is NOT packaged into the Lambda zip — shared code must live in `backend/utils/`
- Limits (env-overridable, defaults): per-IP 10 req/min, daily cap 500, max 30 messages, 2,000 chars/message, 20,000 chars total, 5 tool-loop iterations
- Rate limiting fails open: on DynamoDB errors, allow the request and `console.error`
- Existing DynamoDB table `PortfolioData` (composite key `PK`/`SK`), on-demand billing
- All Lambda responses carry `Access-Control-Allow-Origin` from `FRONTEND_ORIGIN` env (fallback `*`)
- Working branch: create `feature/chat-abuse-protection` off `main` before Task 1

---

### Task 1: Shared message validation

**Files:**
- Create: `backend/utils/validateMessages.js`
- Create: `backend/utils/validateMessages.test.js`
- Modify: `backend/config.js` (limit values)
- Modify: `backend/middleware/validateChat.js` (delegate to shared function)
- Modify: `backend/package.json` (test script)

**Interfaces:**
- Consumes: `config` object with `maxMessageCount`, `maxMessageLength`, `maxTotalChars`, `validRoles`
- Produces: `validateMessages(messages, config)` → `{ valid: true }` or `{ valid: false, error: string }` — used by Task 3's Lambda handler and by the Express middleware

- [ ] **Step 1: Create branch**

```bash
git checkout main && git checkout -b feature/chat-abuse-protection
```

- [ ] **Step 2: Write the failing test**

Create `backend/utils/validateMessages.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMessages } from './validateMessages.js';

const config = {
  maxMessageCount: 30,
  maxMessageLength: 2000,
  maxTotalChars: 20000,
  validRoles: ['user', 'assistant'],
};

test('accepts a valid conversation', () => {
  const messages = [
    { role: 'user', content: 'hi' },
    { role: 'assistant', content: 'hello' },
    { role: 'user', content: 'tell me about the projects' },
  ];
  assert.deepEqual(validateMessages(messages, config), { valid: true });
});

test('rejects a non-array', () => {
  assert.equal(validateMessages('nope', config).valid, false);
});

test('rejects an empty array', () => {
  assert.equal(validateMessages([], config).valid, false);
});

test('rejects too many messages', () => {
  const messages = Array.from({ length: 31 }, () => ({ role: 'user', content: 'x' }));
  const result = validateMessages(messages, config);
  assert.equal(result.valid, false);
  assert.match(result.error, /max 30 messages/);
});

test('accepts exactly the max message count', () => {
  const messages = Array.from({ length: 30 }, () => ({ role: 'user', content: 'x' }));
  assert.equal(validateMessages(messages, config).valid, true);
});

test('rejects an invalid role', () => {
  const result = validateMessages([{ role: 'system', content: 'x' }], config);
  assert.equal(result.valid, false);
  assert.match(result.error, /invalid role "system"/);
});

test('rejects non-string content', () => {
  const result = validateMessages([{ role: 'user', content: 42 }], config);
  assert.equal(result.valid, false);
  assert.match(result.error, /must be a string/);
});

test('rejects empty content', () => {
  const result = validateMessages([{ role: 'user', content: '' }], config);
  assert.equal(result.valid, false);
});

test('rejects a message over the per-message length', () => {
  const result = validateMessages([{ role: 'user', content: 'a'.repeat(2001) }], config);
  assert.equal(result.valid, false);
  assert.match(result.error, /exceeds max length of 2000/);
});

test('accepts a message at exactly the per-message length', () => {
  const result = validateMessages([{ role: 'user', content: 'a'.repeat(2000) }], config);
  assert.equal(result.valid, true);
});

test('rejects when total characters exceed the cap', () => {
  // 11 messages x 1,900 chars = 20,900 > 20,000, each under the per-message cap
  const messages = Array.from({ length: 11 }, () => ({ role: 'user', content: 'a'.repeat(1900) }));
  const result = validateMessages(messages, config);
  assert.equal(result.valid, false);
  assert.match(result.error, /total content exceeds max of 20000/);
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
cd backend && node --test utils
```

Expected: FAIL — `Cannot find module ... validateMessages.js`

- [ ] **Step 4: Implement `backend/utils/validateMessages.js`**

```js
// Pure validation shared by the Express middleware (dev) and the Lambda handler
// (prod). Must stay dependency-free: it ships inside the Lambda zip.
export function validateMessages(messages, { maxMessageCount, maxMessageLength, maxTotalChars, validRoles }) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'messages array is required and must not be empty' };
  }

  if (messages.length > maxMessageCount) {
    return { valid: false, error: `max ${maxMessageCount} messages per request, got ${messages.length}` };
  }

  let totalChars = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    if (!validRoles.includes(msg.role)) {
      return {
        valid: false,
        error: `message ${i}: invalid role "${msg.role}", must be one of: ${validRoles.join(', ')}`,
      };
    }

    if (typeof msg.content !== 'string') {
      return { valid: false, error: `message ${i}: content must be a string, got ${typeof msg.content}` };
    }

    if (msg.content.length === 0) {
      return { valid: false, error: `message ${i}: content cannot be empty` };
    }

    if (msg.content.length > maxMessageLength) {
      return {
        valid: false,
        error: `message ${i}: content exceeds max length of ${maxMessageLength} characters (${msg.content.length})`,
      };
    }

    totalChars += msg.content.length;
  }

  if (totalChars > maxTotalChars) {
    return { valid: false, error: `total content exceeds max of ${maxTotalChars} characters (${totalChars})` };
  }

  return { valid: true };
}
```

- [ ] **Step 5: Update `backend/config.js` limits**

In the `config` object, replace the `// Chat Validation` block and add the new keys (keep the existing `// Rate Limiting` keys — the Express dev limiter still uses them):

```js
  // Chat Validation
  maxMessageCount: parseInt(process.env.MAX_MESSAGE_COUNT || '30', 10),
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '2000', 10),
  maxTotalChars: parseInt(process.env.MAX_TOTAL_CHARS || '20000', 10),
  validRoles: ['user', 'assistant'],

  // Abuse protection (Lambda)
  rateLimitPerIpPerMinute: parseInt(process.env.RATE_LIMIT_PER_IP_PER_MINUTE || '10', 10),
  dailyRequestCap: parseInt(process.env.DAILY_REQUEST_CAP || '500', 10),
  maxToolLoopIterations: parseInt(process.env.MAX_TOOL_LOOP_ITERATIONS || '5', 10),
  frontendOrigin: process.env.FRONTEND_ORIGIN || '*',
```

- [ ] **Step 6: Replace `backend/middleware/validateChat.js` body with a delegation**

```js
import config from '../config.js';
import { validateMessages } from '../utils/validateMessages.js';

export function validateChatRequest(req, res, next) {
  const result = validateMessages(req.body.messages, config);

  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  next();
}
```

- [ ] **Step 7: Update the test script in `backend/package.json`**

```json
"test": "node --test utils lambda && node mcp-server/tools/tools.test.js"
```

(`lambda` has no test files until Task 3 — `node --test` accepts the extra directory once it exists; if it errors on a missing dir, use `node --test utils` here and add `lambda` in Task 3.)

- [ ] **Step 8: Run tests to verify they pass**

```bash
cd backend && npm test
```

Expected: all `validateMessages` tests PASS, existing tools tests still PASS

- [ ] **Step 9: Commit**

```bash
git add backend/utils/validateMessages.js backend/utils/validateMessages.test.js backend/config.js backend/middleware/validateChat.js backend/package.json
git commit -m "feat: shared message validation with tightened size caps"
```

---

### Task 2: DynamoDB-backed rate limiter

**Files:**
- Create: `backend/utils/rateLimit.js`
- Create: `backend/utils/rateLimit.test.js`

**Interfaces:**
- Consumes: an injected DynamoDB Document client (anything with `send(command)`) — production wiring happens in Task 3 using `docClient` from `backend/mcp-server/db/dynamoClient.js`
- Produces: `createRateLimiter({ docClient, tableName, perIpPerMinute, dailyCap, now? })` → `async checkRateLimit(ip)` → one of:
  - `{ allowed: true }`
  - `{ allowed: false, retryAfter: <seconds> }` (per-IP limit)
  - `{ allowed: false, dailyCapReached: true }` (global cap)

- [ ] **Step 1: Write the failing test**

Create `backend/utils/rateLimit.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from './rateLimit.js';

// Fake Document client: replays queued counter values and records commands.
function fakeClient(counts) {
  const calls = [];
  return {
    calls,
    send: async (command) => {
      calls.push(command.input);
      return { Attributes: { count: counts.shift() } };
    },
  };
}

const baseOptions = { tableName: 'PortfolioData', perIpPerMinute: 10, dailyCap: 500 };
const T0 = Date.UTC(2026, 6, 18, 12, 0, 30); // fixed clock: 30s into a minute

test('allows a request under both limits and increments both counters', async () => {
  const client = fakeClient([1, 1]);
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => T0 });

  assert.deepEqual(await check('1.2.3.4'), { allowed: true });
  assert.equal(client.calls.length, 2);
  assert.equal(client.calls[0].Key.PK, 'RATELIMIT#1.2.3.4');
  assert.match(client.calls[0].Key.SK, /^WINDOW#\d+$/);
  assert.equal(client.calls[1].Key.PK, 'RATELIMIT#GLOBAL');
  assert.equal(client.calls[1].Key.SK, 'DAY#2026-07-18');
});

test('blocks the 11th request in a window with retryAfter', async () => {
  const client = fakeClient([11]);
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => T0 });

  const result = await check('1.2.3.4');
  assert.equal(result.allowed, false);
  assert.equal(result.retryAfter, 30); // 30s left in the fixed-clock minute
  assert.equal(client.calls.length, 1); // daily counter NOT burned by a blocked IP
});

test('blocks when the daily cap is exceeded', async () => {
  const client = fakeClient([1, 501]);
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => T0 });

  assert.deepEqual(await check('1.2.3.4'), { allowed: false, dailyCapReached: true });
});

test('allows exactly at both limits', async () => {
  const client = fakeClient([10, 500]);
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => T0 });

  assert.deepEqual(await check('1.2.3.4'), { allowed: true });
});

test('different minute windows use different sort keys', async () => {
  const client = fakeClient([1, 1, 1, 1]);
  let time = T0;
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => time });

  await check('1.2.3.4');
  time = T0 + 60_000;
  await check('1.2.3.4');
  assert.notEqual(client.calls[0].Key.SK, client.calls[2].Key.SK);
});

test('fails open when DynamoDB throws', async () => {
  const check = createRateLimiter({
    ...baseOptions,
    docClient: { send: async () => { throw new Error('dynamo down'); } },
    now: () => T0,
  });

  assert.deepEqual(await check('1.2.3.4'), { allowed: true });
});

test('sets a TTL on both counter items', async () => {
  const client = fakeClient([1, 1]);
  const check = createRateLimiter({ ...baseOptions, docClient: client, now: () => T0 });

  await check('1.2.3.4');
  const nowSeconds = Math.floor(T0 / 1000);
  assert.equal(client.calls[0].ExpressionAttributeValues[':exp'], nowSeconds + 300);
  assert.equal(client.calls[1].ExpressionAttributeValues[':exp'], nowSeconds + 48 * 3600);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && node --test utils
```

Expected: FAIL — `Cannot find module ... rateLimit.js`

- [ ] **Step 3: Implement `backend/utils/rateLimit.js`**

```js
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB-backed counters shared across all Lambda containers.
// Increment-then-check: one atomic write per counter; a single request
// narrowly over the limit is acceptable.
export function createRateLimiter({ docClient, tableName, perIpPerMinute, dailyCap, now = () => Date.now() }) {
  async function increment(pk, sk, ttlSeconds) {
    const result = await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: { PK: pk, SK: sk },
        UpdateExpression: 'SET expiresAt = if_not_exists(expiresAt, :exp) ADD #count :one',
        ExpressionAttributeNames: { '#count': 'count' },
        ExpressionAttributeValues: {
          ':exp': Math.floor(now() / 1000) + ttlSeconds,
          ':one': 1,
        },
        ReturnValues: 'UPDATED_NEW',
      }),
    );
    return result.Attributes.count;
  }

  return async function checkRateLimit(ip) {
    try {
      const minute = Math.floor(now() / 60_000);
      const ipCount = await increment(`RATELIMIT#${ip}`, `WINDOW#${minute}`, 300);

      if (ipCount > perIpPerMinute) {
        return {
          allowed: false,
          retryAfter: Math.ceil(((minute + 1) * 60_000 - now()) / 1000),
        };
      }

      // Only count requests that passed the per-IP check, so a single abuser
      // can't burn the global cap for everyone.
      const day = new Date(now()).toISOString().slice(0, 10);
      const dailyCount = await increment('RATELIMIT#GLOBAL', `DAY#${day}`, 48 * 3600);

      if (dailyCount > dailyCap) {
        return { allowed: false, dailyCapReached: true };
      }

      return { allowed: true };
    } catch (error) {
      // Fail open: a DynamoDB blip must not take down the chat.
      console.error('Rate limiter error (failing open):', error);
      return { allowed: true };
    }
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && node --test utils
```

Expected: all rateLimit + validateMessages tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/utils/rateLimit.js backend/utils/rateLimit.test.js
git commit -m "feat: DynamoDB-backed per-IP rate limiter with global daily cap"
```

---

### Task 3: Harden the Lambda handler

**Files:**
- Modify: `backend/lambda/chat.js`
- Create: `backend/lambda/chat.test.js`

**Interfaces:**
- Consumes: `validateMessages(messages, config)` (Task 1), `createRateLimiter(...)` (Task 2), `docClient`/`TABLE_NAME` from `backend/mcp-server/db/dynamoClient.js`, `config` from `backend/config.js`
- Produces: `runConverseLoop(client, messages)` exported for tests; Lambda 429 body shapes the frontend (Task 4) relies on: `{ error, retryAfter }` and `{ error, dailyCapReached: true }`

- [ ] **Step 1: Write the failing test**

Create `backend/lambda/chat.test.js`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { runConverseLoop } from './chat.js';
import config from '../config.js';

// A response that always asks for a tool that doesn't exist (callTool throws,
// the loop records an error toolResult and continues — no AWS calls needed).
const toolUseResponse = {
  stopReason: 'tool_use',
  output: {
    message: {
      role: 'assistant',
      content: [{ toolUse: { toolUseId: 't1', name: 'no_such_tool', input: {} } }],
    },
  },
};

const finalTextResponse = {
  stopReason: 'end_turn',
  output: { message: { role: 'assistant', content: [{ text: 'final answer' }] } },
};

test('returns text immediately when the model does not call tools', async () => {
  let calls = 0;
  const client = { send: async () => { calls += 1; return finalTextResponse; } };

  const reply = await runConverseLoop(client, [{ role: 'user', content: 'hi' }]);
  assert.equal(reply, 'final answer');
  assert.equal(calls, 1);
});

test('caps the tool loop and forces a final text answer', async () => {
  let calls = 0;
  const client = {
    send: async () => {
      calls += 1;
      return calls <= config.maxToolLoopIterations ? toolUseResponse : finalTextResponse;
    },
  };

  const reply = await runConverseLoop(client, [{ role: 'user', content: 'hi' }]);
  assert.equal(calls, config.maxToolLoopIterations + 1);
  assert.equal(reply, 'final answer');
});

test('falls back to a canned reply if the model keeps calling tools past the cap', async () => {
  const client = { send: async () => toolUseResponse };

  const reply = await runConverseLoop(client, [{ role: 'user', content: 'hi' }]);
  assert.equal(typeof reply, 'string');
  assert.ok(reply.length > 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && node --test lambda
```

Expected: FAIL — `runConverseLoop` is not exported (or the loop never terminates and the test times out; `node:test` default timeout will flag it)

- [ ] **Step 3: Rewrite `backend/lambda/chat.js`**

Full new content:

```js
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { toolDefinitions, callTool } from '../mcp-server/index.js';
import { resolveModelId } from '../utils/modelId.js';
import { validateMessages } from '../utils/validateMessages.js';
import { createRateLimiter } from '../utils/rateLimit.js';
import { docClient, TABLE_NAME } from '../mcp-server/db/dynamoClient.js';
import config from '../config.js';

// Haiku 4.5 is the cheapest current Claude model on Bedrock.
// Newer models require a regional inference profile prefix (e.g. us., eu.).
const DEFAULT_MODEL = 'anthropic.claude-haiku-4-5-20251001-v1:0';
const MAX_OUTPUT_TOKENS = Number(process.env.BEDROCK_MAX_TOKENS || 1024);

const SYSTEM_PROMPT = `You are Melchior-1 (M-1 for short), a friendly, knowledgeable assistant embedded in Ethan's developer portfolio.
Your job is to help visitors learn about Ethan's skills, projects, work experience, and education.
Only answer questions relevant to the portfolio. If asked something unrelated, politely redirect.
Keep answers concise and conversational. Use tools to look up accurate, current information before answering.
Never make up projects, skills, or experience that you haven't retrieved from the database.`;

const LOOP_CAP_FALLBACK = "I couldn't finish looking that up — try asking something more specific.";

const MODEL_ID = resolveModelId(process.env.BEDROCK_MODEL_ID, process.env.AWS_REGION);

const checkRateLimit = createRateLimiter({
  docClient,
  tableName: TABLE_NAME,
  perIpPerMinute: config.rateLimitPerIpPerMinute,
  dailyCap: config.dailyRequestCap,
});

function toBedrockMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: [{ text: message.content }],
  }));
}

function extractAssistantText(message) {
  return (message.content || [])
    .filter((block) => block.text)
    .map((block) => block.text)
    .join('\n');
}

function converseCommand(bedrockMessages) {
  return new ConverseCommand({
    modelId: MODEL_ID,
    system: [{ text: SYSTEM_PROMPT }],
    messages: bedrockMessages,
    toolConfig: { tools: toolDefinitions },
    inferenceConfig: { maxTokens: MAX_OUTPUT_TOKENS },
  });
}

async function runTools(assistantMessage, toolCallCache) {
  const toolResultBlocks = [];

  for (const block of assistantMessage.content) {
    if (!block.toolUse) continue;

    const { toolUseId, name, input } = block.toolUse;
    const cacheKey = `${name}:${JSON.stringify(input || {})}`;
    let result;

    if (toolCallCache.has(cacheKey)) {
      result = toolCallCache.get(cacheKey);
    } else {
      try {
        result = await callTool(name, input || {});
        toolCallCache.set(cacheKey, result);
      } catch (error) {
        toolResultBlocks.push({
          toolResult: { toolUseId, status: 'error', content: [{ text: error.message }] },
        });
        continue;
      }
    }

    toolResultBlocks.push({
      toolResult: { toolUseId, content: [{ json: result }] },
    });
  }

  return toolResultBlocks;
}

export async function runConverseLoop(client, messages) {
  const bedrockMessages = toBedrockMessages(messages);
  const toolCallCache = new Map();
  let response;

  for (let iteration = 0; iteration < config.maxToolLoopIterations; iteration++) {
    response = await client.send(converseCommand(bedrockMessages));

    if (response.stopReason !== 'tool_use') {
      return extractAssistantText(response.output.message);
    }

    bedrockMessages.push(response.output.message);
    bedrockMessages.push({
      role: 'user',
      content: await runTools(response.output.message, toolCallCache),
    });
  }

  // Loop cap reached. toolConfig must stay (Bedrock rejects tool blocks in the
  // history without it), so instead instruct the model to answer with what it
  // has. The instruction rides in the same user message as the tool results —
  // roles must alternate.
  bedrockMessages[bedrockMessages.length - 1].content.push({
    text: 'Answer now using only the information you already have. Do not call any more tools.',
  });

  response = await client.send(converseCommand(bedrockMessages));
  return extractAssistantText(response.output.message) || LOOP_CAP_FALLBACK;
}

export async function chat(messages) {
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  return runConverseLoop(client, messages);
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': config.frontendOrigin,
  };

  try {
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body || event;
    const { messages = [] } = body;

    const validation = validateMessages(messages, config);
    if (!validation.valid) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validation.error }) };
    }

    const ip = event.requestContext?.http?.sourceIp || 'unknown';
    const limit = await checkRateLimit(ip);

    if (!limit.allowed) {
      const payload = limit.dailyCapReached
        ? { error: 'Daily request cap reached', dailyCapReached: true }
        : { error: 'Too many requests', retryAfter: limit.retryAfter };
      return { statusCode: 429, headers, body: JSON.stringify(payload) };
    }

    const reply = await chat(messages);

    return { statusCode: 200, headers, body: JSON.stringify({ message: reply }) };
  } catch (error) {
    console.error('Chat handler error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
```

Notes for the implementer:
- `DEFAULT_MODEL` was already unused before this change (`resolveModelId` handles the fallback); keep or drop it, but don't wire it up.
- The old `while (true)` loop and inline tool-processing block are replaced by the capped `for` loop + `runTools` helper. Behavior for non-capped conversations is identical.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend && npm test
```

Expected: chat loop tests PASS (3), utils tests PASS, tools tests PASS. If Task 1 used `node --test utils` only, update the script now to `node --test utils lambda && node mcp-server/tools/tools.test.js`.

- [ ] **Step 5: Verify the dev server still boots**

```bash
cd backend && timeout 5 node server.js || true
```

Expected: "Server started" log line, no import errors (Ctrl-C/timeout kill is fine).

- [ ] **Step 6: Commit**

```bash
git add backend/lambda/chat.js backend/lambda/chat.test.js backend/package.json
git commit -m "feat: Lambda enforces validation, rate limits, loop cap, and CORS origin"
```

---

### Task 4: Frontend 429 handling

**Files:**
- Modify: `frontend/src/components/Terminal.jsx`

**Interfaces:**
- Consumes: Lambda 429 bodies from Task 3 — `{ error, retryAfter }` (rate limited) and `{ error, dailyCapReached: true }` (daily cap)
- Produces: user-visible terminal messages; no exported API

- [ ] **Step 1: Add the message constants**

In `frontend/src/components/Terminal.jsx`, below the existing `ERROR_MESSAGE` constant (line ~11), add:

```js
const RATE_LIMIT_MESSAGE = 'whoa, easy — too many messages at once. give me a minute to cool down.';
const DAILY_CAP_MESSAGE = "I've hit my thinking quota for today. recharging — come back tomorrow.";
```

- [ ] **Step 2: Keep error messages out of the API history**

In `trimForApi` (line ~37), filter out messages flagged as errors so canned failure text never gets replayed to the model:

```js
function trimForApi(messages) {
  return messages
    .filter((message) => (message.role === 'user' || message.role === 'assistant') && !message.error)
    .slice(-MAX_MESSAGE_PAIRS * 2);
}
```

- [ ] **Step 3: Handle 429 in `handleSend`**

In the `try` block (line ~123), after `const data = await response.json();` and before the existing `if (!response.ok) throw ...` line, add:

```js
      if (response.status === 429) {
        const message = data.dailyCapReached ? DAILY_CAP_MESSAGE : RATE_LIMIT_MESSAGE;
        setMessages((prev) => [...prev, { role: 'assistant', content: message, error: true }]);
        return;
      }
```

(The `finally` block still resets `loading` and refocuses the input.)

- [ ] **Step 4: Verify the frontend builds**

```bash
cd frontend && npm run build
```

Expected: build succeeds with no errors.

- [ ] **Step 5: Manual check against the local dev server**

Start `backend` (`npm run dev`) and `frontend` (`npm run dev`), send 11 quick messages in the terminal UI. The Express in-memory limiter allows 20/min, so to see the 429 path locally either temporarily set `rateLimitMaxRequests` to 2 in `backend/config.js`, observe the friendly rate-limit message in the terminal, then revert — or skip and rely on the deployed verification in Task 6.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Terminal.jsx
git commit -m "feat: terminal shows friendly messages for rate-limit and daily-cap 429s"
```

---

### Task 5: Document infra backstops in DEPLOY.md

**Files:**
- Modify: `DEPLOY.md` (append a new section at the end)

**Interfaces:**
- Consumes: nothing from other tasks
- Produces: the exact commands Task 6 runs against AWS

- [ ] **Step 1: Append the section to `DEPLOY.md`**

```markdown
---

## Abuse protection & spend limits

One-time hardening after the stack is up. Values match `backend/config.js`
defaults and `docs/superpowers/specs/2026-07-18-chat-abuse-protection-design.md`.

### DynamoDB TTL (expires rate-limit counter rows)

```bash
aws dynamodb update-time-to-live \
  --table-name PortfolioData \
  --time-to-live-specification "Enabled=true, AttributeName=expiresAt" \
  --region us-west-2
```

### API Gateway throttling (5 req/s, burst 10)

```bash
aws apigatewayv2 update-stage \
  --api-id YOUR_API_ID \
  --stage-name '$default' \
  --default-route-settings ThrottlingRateLimit=5,ThrottlingBurstLimit=10 \
  --region us-west-2
```

### Lambda reserved concurrency (hard parallelism cap)

```bash
aws lambda put-function-concurrency \
  --function-name PortfolioChat \
  --reserved-concurrent-executions 5 \
  --region us-west-2
```

### Lambda CORS origin

The handler reads `FRONTEND_ORIGIN` for its `Access-Control-Allow-Origin`
header. **`--environment` replaces ALL variables** — include every existing
one (check first with
`aws lambda get-function-configuration --function-name PortfolioChat --query Environment --region us-west-2`):

```bash
aws lambda update-function-configuration \
  --function-name PortfolioChat \
  --environment "Variables={DYNAMO_TABLE_NAME=PortfolioData,PROFILE_PK=PROFILE#ethan-harter,BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0,BEDROCK_MAX_TOKENS=1024,FRONTEND_ORIGIN=https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net}" \
  --region us-west-2
```

### Budget alert ($3/month, email at 100% actual + forecasted)

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws budgets create-budget \
  --account-id $ACCOUNT_ID \
  --budget '{"BudgetName":"portfolio-monthly","BudgetLimit":{"Amount":"3","Unit":"USD"},"TimeUnit":"MONTHLY","BudgetType":"COST"}' \
  --notifications-with-subscribers '[
    {"Notification":{"NotificationType":"ACTUAL","ComparisonOperator":"GREATER_THAN","Threshold":100,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"YOUR_EMAIL"}]},
    {"Notification":{"NotificationType":"FORECASTED","ComparisonOperator":"GREATER_THAN","Threshold":100,"ThresholdType":"PERCENTAGE"},"Subscribers":[{"SubscriptionType":"EMAIL","Address":"YOUR_EMAIL"}]}
  ]'
```

### What the Lambda now enforces (no infra action needed)

- 10 requests/minute per IP, 500 requests/day globally (DynamoDB counters,
  fail-open)
- Max 30 messages / 2,000 chars each / 20,000 chars total per request
- Bedrock tool loop capped at 5 iterations
```

- [ ] **Step 2: Commit**

```bash
git add DEPLOY.md
git commit -m "docs: deploy steps for throttling, concurrency, TTL, and budget alert"
```

---

### Task 6: Deploy and verify against the live endpoint

**Requires:** AWS credentials and `infra/config.env` filled in (gitignored — read it for the real API id, region, CloudFront domain). If credentials are unavailable, stop and hand the DEPLOY.md section to the user.

**Files:** none (operational task)

**Interfaces:**
- Consumes: `lambda.zip` from `npm run package`, commands from Task 5's DEPLOY.md section with real values substituted

- [ ] **Step 1: Package and update the Lambda**

```bash
cd backend && npm run package
aws lambda update-function-code --function-name PortfolioChat --zip-file fileb://lambda.zip --region <AWS_REGION from infra/config.env>
```

Expected: `LastUpdateStatus` transitions to `Successful` (`aws lambda get-function-configuration ... --query LastUpdateStatus`).

- [ ] **Step 2: Apply the infra commands**

Run each command from the new DEPLOY.md section with real values from `infra/config.env` (API id via `aws apigatewayv2 get-apis`), and the budget email set to the account owner's email. Skip `create-budget` with a note if a `portfolio-monthly` budget already exists (`aws budgets describe-budgets --account-id $ACCOUNT_ID`).

- [ ] **Step 3: Verify rate limiting on the live endpoint**

```bash
API_URL=<invoke URL from aws apigatewayv2 get-apis>
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API_URL/chat" \
    -H 'Content-Type: application/json' \
    -d '{"messages":[{"role":"user","content":"hi"}]}'
done
```

Expected: ~10 × `200` followed by `429`s (throttle burst may inject a few `429`s earlier — either source of 429 is a pass).

- [ ] **Step 4: Verify a 429 body shape**

```bash
curl -s -X POST "$API_URL/chat" -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
```

Expected (while still in the blocked window): `{"error":"Too many requests","retryAfter":<n>}`

- [ ] **Step 5: Verify validation and CORS**

```bash
curl -s -X POST "$API_URL/chat" -H 'Content-Type: application/json' \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$(python -c 'print("a"*2001)')\"}]}"
curl -s -i -X POST "$API_URL/chat" -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hi"}]}' | grep -i access-control-allow-origin
```

Expected: first returns a 400 with the length error; second shows the CloudFront origin (not `*`).

- [ ] **Step 6: Verify a normal chat from the live site**

Open the site, wait ~1 minute after the hammer test, send one normal message in the terminal. Expected: a real M-1 reply.

- [ ] **Step 7: Check the counters exist**

```bash
aws dynamodb query --table-name PortfolioData \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"RATELIMIT#GLOBAL"}}' \
  --region <AWS_REGION>
```

Expected: one `DAY#<today>` item with a `count` matching roughly the number of test requests that passed the per-IP check.
