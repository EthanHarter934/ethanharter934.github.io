# Chat Abuse Protection — Design Spec

**Date:** 2026-07-18
**Status:** Approved

## Problem

The deployed chat path (API Gateway → `PortfolioChat` Lambda → Bedrock) has no
abuse protection. The rate limiter and message validation middleware only run on
the local Express dev server (`backend/server.js`); the Lambda handler
(`backend/lambda/chat.js`) checks only that `messages` is a non-empty array.
Anyone with the API Gateway URL can:

1. Send arbitrarily large payloads (no message count/length caps) — large
   input-token costs per request
2. Hammer at any rate (no API Gateway throttling configured)
3. Trigger the unbounded tool loop (`while (true)` until the model stops
   calling tools)

Goal: bound worst-case Bedrock spend to pocket change while genuine visitors
never notice a limit.

## Decisions

- **Scope:** both code-level (Lambda) and infra-level (AWS) protection
- **Rate-limit storage:** DynamoDB-backed (existing `PortfolioData` table),
  chosen over in-memory because Lambda containers don't share memory and cold
  starts reset counters
- **Budget alert threshold:** $3/month

## Design

### 1. Lambda request flow (in order)

1. **Extract caller IP** from `event.requestContext.http.sourceIp`
   (API Gateway-provided; not spoofable via headers)
2. **Validate payload** — refactor `backend/middleware/validateChat.js` rules
   into a shared pure function used by both the Express middleware and the
   Lambda handler:
   - max 30 messages per request
   - max 2,000 characters per message
   - max 20,000 characters total
   - roles restricted to `user` / `assistant`
   - invalid → 400 with a specific error message
3. **Per-IP rate limit** — atomic DynamoDB counter, **10 requests/minute per
   IP**. Over limit → 429 with `retryAfter` (seconds until the window resets)
4. **Global daily cap** — atomic DynamoDB counter, **500 requests/day across
   all IPs**. Over cap → 429 with a `dailyCapReached: true` flag so the
   frontend can show a distinct message
5. **Call Bedrock** with the tool loop capped at **5 iterations** (replaces
   `while (true)`). On hitting the cap, append an instruction to answer with
   the information already gathered and make one final call. (`toolConfig`
   must stay — Bedrock rejects requests whose history contains tool blocks
   without it.) If the model still tries to call tools, return a fallback
   string instead
6. **CORS**: response header `Access-Control-Allow-Origin` set from a
   `FRONTEND_ORIGIN` env var instead of `*`

### 2. DynamoDB schema (existing `PortfolioData` table, PK/SK composite)

| Item | PK | SK | Notes |
|---|---|---|---|
| Per-IP window | `RATELIMIT#<ip>` | `WINDOW#<epoch-minute>` | `ADD count 1`, `expiresAt` TTL now+5 min |
| Global daily | `RATELIMIT#GLOBAL` | `DAY#<yyyy-mm-dd>` (UTC) | `ADD count 1`, `expiresAt` TTL now+48 h |

- Counters use `UpdateItem` with `ADD` and `ReturnValues: UPDATED_NEW`; the
  returned count is compared against the limit (increment-then-check; a
  narrowly-over-limit final request is acceptable)
- **Fail-open:** if the counter write throws, allow the request and log the
  error — a DynamoDB blip must not take down the chat
- Deploy step: enable TTL on attribute `expiresAt`

### 3. Infra backstops (one-time CLI commands, documented in DEPLOY.md)

- **API Gateway stage throttling:** rate 5 req/s, burst 10
  (`update-stage --default-route-settings`)
- **Lambda reserved concurrency:** 5
- **AWS Budget:** $3/month, email alerts at 100% actual and 100% forecasted

### 4. Frontend (`frontend/src/components/Terminal.jsx`)

Handle 429 distinctly from other errors:

- Rate-limited: friendly "M-1 is getting a lot of traffic — try again in a
  minute" style message
- Daily cap (`dailyCapReached`): "M-1 is resting until tomorrow" style message

Exact copy chosen at implementation time to match the terminal's voice.

### 5. Configuration

New/changed values in `backend/config.js` (env-overridable):

| Key | Default |
|---|---|
| `rateLimitPerIpPerMinute` | 10 |
| `dailyRequestCap` | 500 |
| `maxMessageCount` | 30 |
| `maxMessageLength` | 2000 |
| `maxTotalChars` | 20000 |
| `maxToolLoopIterations` | 5 |
| `frontendOrigin` | from `FRONTEND_ORIGIN` env |

Express dev server keeps its existing in-memory limiter for local use; the
DynamoDB limiter is used by the Lambda handler.

## Why genuine visitors are unaffected

- A real chat sends ~3–6 requests/minute; the per-IP limit is 10
- A busy legitimate day is ~250 requests site-wide; the daily cap is 500
- Message caps (30 × 2,000 chars) far exceed real terminal usage
- Limits fail open on infrastructure errors

## Worst-case spend after this change

Daily cap (500) × worst-case per-request cost (~20K input chars ≈ 5K tokens +
1,024 output tokens on Haiku 4.5 ≈ $0.01) ≈ **$5/day absolute ceiling**, with
the $3/month budget alert firing long before sustained abuse adds up. Typical
worst case is far lower because the per-IP limit forces abuse to be
distributed.

## Testing

- **Unit tests** (mocked DynamoDB client): validator boundaries (count, length,
  total, roles), limiter at/over limit, window rollover, daily cap, fail-open
  on DynamoDB error, tool-loop cap
- **Manual verification:** hammer the deployed endpoint with curl until 429s
  appear; confirm `retryAfter`; confirm a normal chat still works from the
  site; confirm CORS header on the response

## Out of scope

- AWS WAF (~$5+/month — costs more than the bill it would protect)
- API keys / auth (public visitor chat; keys would be exposed in the client)
- CAPTCHA (hostile to the terminal UX for marginal benefit)
