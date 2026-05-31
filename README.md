# Ethan Harter's Portfolio

A full-stack portfolio website with an **AI-powered chatbot** that answers questions about Ethan's projects, skills, experience, and education using Claude Haiku 4.5 via AWS Bedrock.

**Live Demo**: [Coming Soon](#) | **Code Quality**: ✅ Production Ready | **License**: MIT

---

## 🎯 Overview

This application showcases:
- **Frontend**: React + Vite responsive portfolio interface
- **Backend**: Express server with AWS Lambda support
- **AI Engine**: Claude Haiku 4.5 via AWS Bedrock with tool-based queries
- **Database**: DynamoDB for portfolio data storage
- **Deployment**: AWS (Lambda + API Gateway + S3 + CloudFront)

**Key Features**:
- 🤖 AI chatbot for portfolio Q&A
- 📱 Mobile-responsive design
- ⚡ Fast local development server
- 🔒 Production-ready AWS deployment
- 💰 Cost-optimized (uses cheapest Claude model)
- 🔧 Easy data customization via seed script

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│              Portfolio Display + Chat Widget                │
│        (http://localhost:5173 or CloudFront CDN)            │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│              Backend (Express or Lambda)                    │
│                 POST /api/chat handler                      │
│        (http://localhost:3001 or API Gateway)              │
└────────────────────────┬────────────────────────────────────┘
                         │ AWS SDK
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
    ┌────────────┐ ┌─────────────┐ ┌──────────────┐
    │ Bedrock    │ │ DynamoDB    │ │ CloudWatch   │
    │ (Claude)   │ │ (Portfolio) │ │ (Logs)       │
    └────────────┘ └─────────────┘ └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- AWS account with Bedrock access (Claude Haiku 4.5)
- AWS CLI configured (`aws configure`)

### Local Development

1. **Clone and install**:
```bash
git clone https://github.com/ethanharter934/ethanharter934.github.io.git
cd ethanharter934.github.io

cd frontend && npm install
cd ../backend && npm install
```

2. **Configure environment**:
```bash
cp backend/.env.example backend/.env
```

Fill in `backend/.env`:
```env
AWS_REGION=us-west-2
DYNAMO_TABLE_NAME=PortfolioData
PROFILE_PK=PROFILE#ethan-harter
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_MAX_TOKENS=1024
```

3. **Start backend** (Terminal 1):
```bash
cd backend
node server.js
# Listening on http://localhost:3001
```

4. **Start frontend** (Terminal 2):
```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

5. **Open browser**:
- Portfolio: http://localhost:5173
- Chat widget: Click "Chat" button in sidebar
- Try asking: "What are my projects?"

---

## 🛠️ Development

### Project Structure

```
.
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 # Main app router
│   │   ├── pages/Home.jsx          # Portfolio page
│   │   ├── components/
│   │   │   ├── Education.jsx
│   │   │   ├── Skills.jsx
│   │   │   ├── Experience.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ChatWidget.jsx      # Chat interface
│   │   │   └── ...
│   │   └── hooks/useScrollToSection.js
│   ├── vite.config.js              # Vite proxy to backend
│   └── package.json
│
├── backend/
│   ├── server.js                   # Express dev server
│   ├── lambda/
│   │   └── chat.js                 # Lambda handler + Bedrock logic
│   ├── mcp-server/
│   │   ├── index.js                # Tool registry
│   │   ├── db/dynamoClient.js
│   │   └── tools/
│   │       ├── getProjects.js      # Tool: fetch projects
│   │       ├── getSkills.js        # Tool: fetch skills
│   │       ├── getExperience.js    # Tool: fetch experience
│   │       ├── getEducation.js     # Tool: fetch education
│   │       └── searchPortfolio.js  # Tool: search content
│   ├── scripts/
│   │   ├── seed.js                 # Load demo data
│   │   └── package-lambda.js       # Package for AWS
│   └── package.json
│
├── infra/
│   ├── policies/
│   │   ├── lambda-trust-policy.json
│   │   ├── lambda-permissions.json
│   │   └── s3-bucket-policy.json
│   └── config.example.env
│
├── CODE_REVIEW.md                  # Code review findings
├── OPTIMIZATION_PLAN.md            # Planned improvements
├── SETUP.md                        # Setup guide
├── DEPLOY.md                       # AWS deployment guide
└── README.md                       # This file
```

### Common Tasks

#### Update Portfolio Data

Edit `backend/scripts/seed.js` with your real information:
- Projects (with GitHub links, tech stack)
- Skills (languages, frameworks, tools)
- Experience (internships, work history)
- Education (degree, GPA, coursework)

Then seed:
```bash
cd backend
npm run seed
```

#### Add a New Portfolio Section

1. Create component in `frontend/src/components/NewSection.jsx`
2. Add tool in `backend/mcp-server/tools/getNewSection.js`
3. Import in `frontend/src/pages/Home.jsx`
4. Add data type to seed.js
5. Register tool in `backend/mcp-server/index.js`

#### Test Chat Locally

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about your projects"}]}'
```

---

## 🚢 Deployment

### One-Time Setup

1. **Prerequisites** ✅
   - AWS account with Bedrock access enabled for Claude Haiku 4.5
   - AWS CLI configured
   - Review `infra/policies/*.json` and replace placeholders

2. **Create DynamoDB table**:
```bash
aws dynamodb create-table \
  --table-name PortfolioData \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name PortfolioData \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-west-2
```

3. **Seed database**:
```bash
cd backend && npm run seed
```

4. **Create IAM role** (`PortfolioChatRole`):
   - Trust policy: `infra/policies/lambda-trust-policy.json`
   - Inline policy: `infra/policies/lambda-permissions.json` (edit to add your region/account)

5. **Package & deploy Lambda**:
```bash
cd backend && npm run package
# Creates backend/lambda.zip

aws lambda create-function \
  --function-name PortfolioChat \
  --runtime nodejs20.x \
  --role arn:aws:iam::ACCOUNT_ID:role/PortfolioChatRole \
  --handler lambda/chat.handler \
  --zip-file fileb://lambda.zip \
  --timeout 30 --memory-size 512 \
  --region us-west-2 \
  --environment "Variables={DYNAMO_TABLE_NAME=PortfolioData,PROFILE_PK=PROFILE#ethan-harter,BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0,BEDROCK_MAX_TOKENS=1024}"
```

6. **Create API Gateway**:
```bash
API_ID=$(aws apigatewayv2 create-api \
  --name PortfolioChatApi \
  --protocol-type HTTP \
  --region us-west-2 \
  --query ApiId --output text)

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

INTEGRATION_ID=$(aws apigatewayv2 create-integration \
  --api-id $API_ID \
  --integration-type AWS_PROXY \
  --integration-uri arn:aws:lambda:us-west-2:${ACCOUNT_ID}:function:PortfolioChat \
  --payload-format-version 2.0 \
  --region us-west-2 \
  --query IntegrationId --output text)

aws apigatewayv2 create-route \
  --api-id $API_ID \
  --route-key "POST /chat" \
  --target integrations/$INTEGRATION_ID \
  --region us-west-2

aws apigatewayv2 create-stage \
  --api-id $API_ID \
  --stage-name '$default' \
  --auto-deploy \
  --region us-west-2

echo "API URL: https://${API_ID}.execute-api.us-west-2.amazonaws.com"
```

7. **Build & deploy frontend**:
```bash
cp frontend/.env.production.example frontend/.env.production
# Edit frontend/.env.production with your API Gateway URL
# VITE_API_URL=https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com

cd frontend && npm run build

# Create S3 bucket
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET=ethan-portfolio-frontend-${ACCOUNT_ID}
aws s3 mb s3://${BUCKET} --region us-west-2

# Upload frontend
aws s3 sync frontend/dist/ s3://${BUCKET}/ --delete
```

8. **Create CloudFront distribution**:
   - Origin: S3 bucket (with Origin Access Control)
   - Default root: `index.html`
   - Error pages: 403 & 404 → `/index.html` (status 200)
   - Viewer policy: Redirect HTTP to HTTPS

### After Deployment

**Test end-to-end**:
```bash
curl -X POST "https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about your background"}]}'
```

**Update CORS** in API Gateway to CloudFront domain (required for production):
```bash
aws apigatewayv2 update-api \
  --api-id YOUR_API_ID \
  --cors-configuration AllowOrigins="https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type" \
  --region us-west-2
```

### Redeploying After Code Changes

**Backend**:
```bash
cd backend && npm run package
aws lambda update-function-code \
  --function-name PortfolioChat \
  --zip-file fileb://lambda.zip \
  --region us-west-2
```

**Frontend**:
```bash
cd frontend && npm run build
aws s3 sync dist/ s3://YOUR_BUCKET/ --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*" \
  --region us-west-2
```

### Full Deployment Guide

See **[DEPLOY.md](./DEPLOY.md)** for complete step-by-step instructions with:
- Console and CLI options for each service
- Troubleshooting tips
- Cost optimization recommendations
- Infrastructure checklist

---

## 💡 How the Chatbot Works

### Tool-Based AI Architecture

The chatbot uses **Claude's tool-calling** to ground responses in real portfolio data:

1. **User asks**: "What are your recent projects?"
2. **Claude decides**: "I need to call getProjects"
3. **System calls**: `getProjects()` → queries DynamoDB
4. **Claude receives**: Project data (title, description, tech stack)
5. **Claude responds**: Natural language summary with actual data

**Available Tools**:
- `getProjects()` - All portfolio projects
- `getSkills()` - Skills by category (language, framework, tool)
- `getExperience()` - Work history
- `getEducation()` - Education & coursework
- `searchPortfolio()` - Full-text search across all data

### Token Optimization

- **Model**: Claude Haiku 4.5 (cheapest, fastest Claude)
- **Max tokens**: 1024 (caps response length to ~500 words)
- **Typical cost**: ~$0.001 per chat exchange
- **Free tier**: First 1M Bedrock tokens/month

---

## 📈 Performance

| Metric | Value | Notes |
|--------|-------|-------|
| Initial page load | ~1.2s | Vite + React, no backend calls |
| First chat response | ~2-3s | Includes DynamoDB + Bedrock |
| Subsequent chats | ~1-2s | Cached DynamoDB queries |
| Lambda cold start | ~3-5s | Node.js 20.x with dependencies |
| Bedrock latency | ~500ms | Claude Haiku is fast |

**Optimization opportunities**: See [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md)

---

## 🔒 Security

### Current Implementation
- ✅ Input validation on messages
- ✅ System prompt prevents off-topic requests
- ✅ No credentials in frontend code
- ✅ AWS IAM for Lambda permissions
- ✅ HTTPS enforced via CloudFront

### Recommended Additions
- 🔲 Rate limiting on API (prevent abuse)
- 🔲 Request signing (optional for public portfolio)
- 🔲 CORS restrictions (update after CloudFront deploy)

See [CODE_REVIEW.md](./CODE_REVIEW.md) for detailed security assessment.

---

## 🧪 Testing

Currently: No automated tests  
Recommended: Unit + integration tests for tool handlers

```bash
# Future test command
npm run test
```

See [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md#phase-4-testing--quality-assurance-week-4) for testing roadmap.

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [SETUP.md](./SETUP.md) | Local development setup |
| [DEPLOY.md](./DEPLOY.md) | AWS deployment (detailed) |
| [CODE_REVIEW.md](./CODE_REVIEW.md) | Code quality analysis |
| [OPTIMIZATION_PLAN.md](./OPTIMIZATION_PLAN.md) | Planned improvements |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool
- **React Router 7** - Client-side routing
- **React Markdown 10** - Format AI responses
- **Tailwind CSS** (assumed) - Styling

### Backend
- **Node.js 20** - Runtime
- **Express 5** - Server framework
- **AWS SDK v3** - AWS integration
  - `@aws-sdk/client-bedrock-runtime` - Claude API
  - `@aws-sdk/client-dynamodb` - DynamoDB queries
- **dotenv** - Environment config

### Infrastructure
- **AWS Lambda** - Serverless backend
- **AWS API Gateway** - HTTP API
- **AWS DynamoDB** - NoSQL database
- **AWS Bedrock** - Claude AI model
- **AWS S3** - Static frontend hosting
- **AWS CloudFront** - CDN

---

## 📋 Environment Variables

### Local Development (`backend/.env`)
```env
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
DYNAMO_TABLE_NAME=PortfolioData
PROFILE_PK=PROFILE#ethan-harter
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_MAX_TOKENS=1024
PORT=3001
```

### Production (Lambda environment variables)
```env
DYNAMO_TABLE_NAME=PortfolioData
PROFILE_PK=PROFILE#ethan-harter
BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0
BEDROCK_MAX_TOKENS=1024
```
*(AWS_REGION set automatically by Lambda)*

### Frontend (optional, for production)
```env
VITE_API_URL=https://your-api-gateway-url.execute-api.us-west-2.amazonaws.com
```

---

## 💰 Cost Estimate

**Monthly usage** (1,000 chats/month):

| Service | Unit Cost | Usage | Monthly |
|---------|-----------|-------|---------|
| Lambda | $0.0000002/sec | 2,000s | ~$0.40 |
| Bedrock Haiku | $0.001 per 1K tokens | 1M tokens | ~$1 |
| DynamoDB | Free tier | 100 writes/reads | $0 |
| API Gateway | $0.0035 per M requests | 1,000 | <$0.01 |
| CloudFront | ~$0.085/GB | 10GB | ~$0.85 |
| S3 | <$0.50/month | Static files | <$0.50 |
| **Total** | | | **~$3/month** |

Set a **$5 budget alert** in AWS Billing to catch unexpected usage.

---

## 🐛 Troubleshooting

### Chat not responding?
1. Check backend is running: `curl http://localhost:3001/api/chat`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Check Bedrock access: Enable Claude Haiku 4.5 in AWS console

### DynamoDB queries failing?
1. Verify table exists: `aws dynamodb describe-table --table-name PortfolioData`
2. Check IAM permissions: Role should allow `dynamodb:Query`, `dynamodb:Scan`
3. Seed data: `cd backend && npm run seed`

### Lambda timing out?
1. Increase timeout: Lambda → Configuration → General → Timeout (30s minimum)
2. Check Bedrock API latency
3. Check DynamoDB cold starts (on-demand billing helps here)

### Frontend not connecting to backend?
1. Check proxy config: `frontend/vite.config.js` should have `/api` → `localhost:3001`
2. Check CORS headers in production
3. Check CloudFront distribution is serving `index.html` for SPA routing

---

## 📝 License

MIT © 2026 Ethan Harter

---

**Built with ❤️ using React, Node.js, and Claude**

