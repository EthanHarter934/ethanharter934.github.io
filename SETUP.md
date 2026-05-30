# Portfolio Setup Guide

## Prerequisites

- Node.js 18+
- AWS CLI configured (`aws configure`)
- AWS account with Bedrock access enabled for Claude models (AWS Console → Bedrock → Model access → enable **Claude Haiku 4.5**)

## Local Development

1. Clone the repo

2. Install frontend deps:
   ```bash
   cd frontend && npm install
   ```

3. Install backend deps:
   ```bash
   cd backend && npm install
   ```

4. Copy `backend/.env.example` to `backend/.env` and fill in:
   - `AWS_REGION`
   - `DYNAMO_TABLE_NAME`
   - `PROFILE_PK`
   - `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (or use AWS SSO / `aws configure` instead)
   - `BEDROCK_MODEL_ID` (default: `anthropic.claude-haiku-4-5-20251001-v1:0` — prefixed automatically, e.g. `us.anthropic.claude-haiku-4-5-20251001-v1:0`)
   - `BEDROCK_MAX_TOKENS` (default: `1024` — caps response length to control cost)

5. Start backend:
   ```bash
   cd backend && node server.js
   ```

6. Start frontend (in a second terminal):
   ```bash
   cd frontend && npm run dev
   ```

7. Visit http://localhost:5173

The Vite dev server proxies `/api/*` requests to the backend at `http://localhost:3001`.

## Seed the database

After creating the `PortfolioData` DynamoDB table (see Phase 4 deploy checklist):

```bash
cd backend && npm run seed
```

Or with an explicit profile key:

```bash
PROFILE_PK="PROFILE#ethan-harter" node backend/scripts/seed.js
```

Review and update your real data in `backend/scripts/seed.js` before running against production.

## Deploy

Full step-by-step instructions (console + CLI): **[DEPLOY.md](./DEPLOY.md)**

Quick summary:

1. Create `PortfolioData` DynamoDB table and enable point-in-time recovery
2. Seed: `cd backend && npm run seed`
3. Create `PortfolioChatRole` IAM role (see `infra/policies/`)
4. Package & deploy Lambda: `cd backend && npm run package`
5. Create HTTP API with `POST /chat` → Lambda
6. Build frontend with `frontend/.env.production` (`VITE_API_URL` = API Gateway URL)
7. Upload `frontend/dist/` to S3 + CloudFront

After deploy, set `frontend/.env.production`:

```env
VITE_API_URL=https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com
```
