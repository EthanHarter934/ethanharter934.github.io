# Phase 4 — AWS Deployment Guide

This guide walks through deploying the portfolio chatbot to AWS. All examples use **`us-west-2`** (Oregon) — change the region if you prefer another.

Replace placeholders:
- `ACCOUNT_ID` — your 12-digit AWS account ID
- `YOUR_API_ID` — from API Gateway after creation
- `YOUR_CLOUDFRONT_DOMAIN` — CloudFront domain after creation

---

## Pre-flight checklist

- [ ] AWS CLI installed and configured (`aws sts get-caller-identity`)
- [ ] Bedrock **Model access** enabled for **Claude Haiku 4.5**
- [ ] Reviewed `backend/scripts/seed.js` with your real data
- [ ] Copied `infra/config.example.env` → `infra/config.env` and filled in values

---

## 1. DynamoDB table

### Console

1. **DynamoDB** → **Tables** → **Create table**
2. Table name: `PortfolioData`
3. Partition key: `PK` (String), Sort key: `SK` (String)
4. Table settings: **On-demand** capacity
5. Create table
6. Open the table → **Backups** → **Point-in-time recovery** → **Edit** → Enable

### CLI

```bash
aws dynamodb create-table \
  --table-name PortfolioData \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2

aws dynamodb update-continuous-backups \
  --table-name PortfolioData \
  --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true \
  --region us-west-2
```

Wait until the table status is **ACTIVE**:

```bash
aws dynamodb describe-table --table-name PortfolioData --region us-west-2 --query "Table.TableStatus"
```

---

## 2. Seed the database

Update `backend/scripts/seed.js` with your real projects, skills, experience, and education. Then run:

```bash
cd backend
npm install
npm run seed
```

Your `backend/.env` must have valid AWS credentials and:

```env
AWS_REGION=us-west-2
DYNAMO_TABLE_NAME=PortfolioData
PROFILE_PK=PROFILE#ethan-harter
```

Verify items were written:

```bash
aws dynamodb query \
  --table-name PortfolioData \
  --key-condition-expression "PK = :pk" \
  --expression-attribute-values '{":pk":{"S":"PROFILE#ethan-harter"}}' \
  --region us-west-2 \
  --max-items 3
```

---

## 3. IAM role for Lambda

### Console

1. **IAM** → **Roles** → **Create role**
2. Trusted entity: **AWS service** → **Lambda**
3. Attach a custom inline policy (paste from `infra/policies/lambda-permissions.json`, replacing `REGION` and `ACCOUNT_ID`)
4. Role name: `PortfolioChatRole`

Also attach **AWSLambdaBasicExecutionRole** (managed policy) for CloudWatch Logs, or keep the inline logs statement in the custom policy.

### CLI

```bash
# Get your account ID
aws sts get-caller-identity --query Account --output text

# Create role
aws iam create-role \
  --role-name PortfolioChatRole \
  --assume-role-policy-document file://infra/policies/lambda-trust-policy.json

# Attach custom policy (replace REGION and ACCOUNT_ID first)
# On Windows PowerShell, edit the file manually, then:
aws iam put-role-policy \
  --role-name PortfolioChatRole \
  --policy-name PortfolioChatPolicy \
  --policy-document file://infra/policies/lambda-permissions.json
```

Edit `infra/policies/lambda-permissions.json` before running — replace `REGION` with `us-west-2` and `ACCOUNT_ID` with your account ID.

---

## 4. Lambda function

### Package the code

```bash
cd backend
npm install
npm run package
```

This creates `backend/lambda.zip` (may take 1–2 minutes on Windows due to `node_modules` size).

### Console

1. **Lambda** → **Create function**
2. Name: `PortfolioChat`
3. Runtime: **Node.js 20.x**
4. Architecture: **x86_64**
5. Execution role: **Use existing role** → `PortfolioChatRole`
6. Create function
7. **Code** → **Upload from** → `.zip file` → upload `backend/lambda.zip`
8. **Runtime settings** → Handler: `lambda/chat.handler`
9. **Configuration** → **General** → Memory: **512 MB**, Timeout: **30 sec**
10. **Configuration** → **Environment variables**:

| Key | Value |
|-----|-------|
| `DYNAMO_TABLE_NAME` | `PortfolioData` |
| `PROFILE_PK` | `PROFILE#ethan-harter` |
| `BEDROCK_MODEL_ID` | `anthropic.claude-haiku-4-5-20251001-v1:0` |
| `BEDROCK_MAX_TOKENS` | `1024` |

(`AWS_REGION` is set automatically by Lambda.)

### CLI

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws lambda create-function \
  --function-name PortfolioChat \
  --runtime nodejs20.x \
  --role arn:aws:iam::${ACCOUNT_ID}:role/PortfolioChatRole \
  --handler lambda/chat.handler \
  --zip-file fileb://backend/lambda.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment "Variables={DYNAMO_TABLE_NAME=PortfolioData,PROFILE_PK=PROFILE#ethan-harter,BEDROCK_MODEL_ID=anthropic.claude-haiku-4-5-20251001-v1:0,BEDROCK_MAX_TOKENS=1024}" \
  --region us-west-2
```

Test the function:

```bash
aws lambda invoke \
  --function-name PortfolioChat \
  --region us-west-2 \
  --cli-binary-format raw-in-base64-out \
  --payload '{"body":"{\"messages\":[{\"role\":\"user\",\"content\":\"What projects has Ethan built?\"}]}"}' \
  response.json

cat response.json
```

---

## 5. API Gateway (HTTP API)

### Console

1. **API Gateway** → **Create API** → **HTTP API** → Build
2. **Integrations** → Add integration → **Lambda** → `PortfolioChat`
3. **Routes** → Add route: `POST /chat` → integration: `PortfolioChat`
4. **CORS** → Configure:
   - Access-Control-Allow-Origin: your frontend URL (e.g. `https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net`)
   - Allow methods: `POST, OPTIONS`
   - Allow headers: `Content-Type`
5. **Deploy** → Stage: `$default` (auto-deploy)
6. Copy the **Invoke URL** (e.g. `https://abc123.execute-api.us-west-2.amazonaws.com`)

### CLI

```bash
# Create HTTP API with Lambda proxy integration
API_ID=$(aws apigatewayv2 create-api \
  --name PortfolioChatApi \
  --protocol-type HTTP \
  --cors-configuration AllowOrigins="https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type" \
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

# Allow API Gateway to invoke Lambda
aws lambda add-permission \
  --function-name PortfolioChat \
  --statement-id apigateway-invoke \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-west-2:${ACCOUNT_ID}:${API_ID}/*" \
  --region us-west-2

echo "API URL: https://${API_ID}.execute-api.us-west-2.amazonaws.com"
```

Test:

```bash
curl -X POST "https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/chat" \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"What are Ethan's top skills?\"}]}"
```

---

## 6. Frontend — S3 + CloudFront

### Build with production API URL

```bash
cp frontend/.env.production.example frontend/.env.production
```

Edit `frontend/.env.production`:

```env
VITE_API_URL=https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com
```

Build:

```bash
cd frontend
npm install
npm run build
```

Output is in `frontend/dist/`.

### S3 bucket (Console)

1. **S3** → **Create bucket**
2. Name: `ethan-portfolio-frontend-ACCOUNT_ID` (globally unique)
3. Region: `us-west-2`
4. **Block all public access**: ON (CloudFront will access via OAC)
5. Create bucket
6. Upload all files from `frontend/dist/` (keep folder structure; `index.html` at root)

### S3 bucket (CLI)

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET=ethan-portfolio-frontend-${ACCOUNT_ID}

aws s3 mb s3://${BUCKET} --region us-west-2

aws s3 sync frontend/dist/ s3://${BUCKET}/ --delete
```

### CloudFront (Console)

1. **CloudFront** → **Create distribution**
2. Origin domain: your S3 bucket (not the website endpoint)
3. Origin access: **Origin access control settings (recommended)** → Create OAC
4. Default root object: `index.html`
5. Viewer protocol policy: **Redirect HTTP to HTTPS**
6. Create distribution
7. Copy the **Distribution domain name**
8. Go back to S3 → bucket → **Permissions** → paste the bucket policy CloudFront suggests (or use `infra/policies/s3-bucket-policy.json`, replacing `S3_BUCKET_NAME`, `ACCOUNT_ID`, and `CLOUDFRONT_DISTRIBUTION_ID`)

### CloudFront (CLI — simplified)

CloudFront CLI setup is verbose; the console is easier for the first deploy. After creating the distribution, update the S3 bucket policy using the template in `infra/policies/s3-bucket-policy.json`.

### Single-page app routing

In CloudFront → **Error pages**, add:

| HTTP error | Response page | Response code |
|------------|---------------|---------------|
| 403 | `/index.html` | 200 |
| 404 | `/index.html` | 200 |

This ensures client-side routing works if you add routes later.

---

## 7. Update CORS with your real domain

After CloudFront is live, update API Gateway CORS to allow your CloudFront URL:

**Console:** API Gateway → your API → CORS → edit `AllowOrigins`

**CLI:**

```bash
aws apigatewayv2 update-api \
  --api-id YOUR_API_ID \
  --cors-configuration AllowOrigins="https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",AllowMethods="POST,OPTIONS",AllowHeaders="Content-Type" \
  --region us-west-2
```

Rebuild and re-upload the frontend if you change `.env.production`.

---

## 8. Cost tips

| Service | Cost profile |
|---------|--------------|
| DynamoDB on-demand | Free tier covers light traffic; pennies at portfolio scale |
| Lambda | Free tier: 1M requests/month |
| API Gateway HTTP | ~$1 per million requests |
| Bedrock Haiku 4.5 | Cheapest Claude model; ~$0.001 per short chat with 1024 token cap |
| S3 + CloudFront | Pennies for a static portfolio |

Set a **AWS Budgets** alert at $5/month in **Billing → Budgets** to catch unexpected usage.

---

## Infrastructure checklist

- [ ] **DynamoDB table** — `PortfolioData` in `us-west-2`, on-demand, PITR enabled
- [ ] **Database seeded** — `npm run seed` completed
- [ ] **IAM role** — `PortfolioChatRole` with DynamoDB read + Bedrock invoke + logs
- [ ] **Lambda** — `PortfolioChat`, Node.js 20.x, 512 MB, 30s, env vars set
- [ ] **API Gateway** — HTTP API, `POST /chat` → Lambda, CORS configured
- [ ] **Frontend** — built with `VITE_API_URL`, uploaded to S3
- [ ] **CloudFront** — distribution with OAC, SPA error pages
- [ ] **End-to-end test** — chat works on live CloudFront URL

---

## Redeploying after code changes

**Backend:**

```bash
cd backend && npm run package
aws lambda update-function-code \
  --function-name PortfolioChat \
  --zip-file fileb://lambda.zip \
  --region us-west-2
```

**Frontend:**

```bash
cd frontend && npm run build
aws s3 sync dist/ s3://YOUR_BUCKET/ --delete
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```
