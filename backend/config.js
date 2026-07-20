// Centralized configuration from environment variables
export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),

  // AWS
  awsRegion: process.env.AWS_REGION || 'us-east-1',

  // Bedrock
  bedrockModelId: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0',
  bedrockMaxTokens: parseInt(process.env.BEDROCK_MAX_TOKENS || '1024', 10),

  // DynamoDB
  dynamoTableName: process.env.DYNAMO_TABLE_NAME || 'PortfolioData',
  profilePk: process.env.PROFILE_PK || 'PROFILE#default',

  // CORS
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',

  // Rate Limiting
  rateLimitWindowMs: 2 * 1000, // 2 seconds
  rateLimitMaxRequests: 1,

  // Chat Validation
  maxMessageCount: 50,
  maxMessageLength: 4096,
  validRoles: ['user', 'assistant'],

  // Caching (Phase 3)
  cacheExpireTtlMs: 5 * 60 * 1000, // 5 minutes

  // Debug
  isDebug: process.env.DEBUG === 'true',
};

// Validate critical config on startup
export function validateConfig() {
  const required = ['dynamoTableName', 'profilePk', 'bedrockModelId'];
  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required config: ${missing.join(', ')}`);
  }

  if (config.bedrockMaxTokens < 100 || config.bedrockMaxTokens > 4096) {
    console.warn('⚠️  bedrockMaxTokens outside typical range (100-4096)');
  }

  if (config.port < 1024) {
    console.warn('⚠️  port < 1024 requires elevated privileges');
  }
}

export default config;
