// Shared utility for resolving Bedrock model IDs with regional prefixes
const DEFAULT_MODEL_ID = 'anthropic.claude-haiku-4-5-20251001-v1:0';

export function resolveModelId(modelId, region) {
  const id = modelId || DEFAULT_MODEL_ID;

  // If already has regional prefix or is ARN, return as-is
  if (/^(us|eu|apac|global)\./.test(id) || id.startsWith('arn:')) {
    return id;
  }

  // Determine regional prefix based on AWS region
  const awsRegion = region || 'us-east-1';
  let prefix = 'us';

  if (awsRegion.startsWith('eu-')) {
    prefix = 'eu';
  } else if (awsRegion.startsWith('ap-')) {
    prefix = 'apac';
  }

  return `${prefix}.${id}`;
}
