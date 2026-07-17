import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

export const definition = {
  name: 'getSkills',
  description:
    'Retrieve technical skills. Optionally filter by category: ai, language, framework, tool, cloud, or other. The ai category covers LLM integration, MCP, model fine-tuning, and computer vision skills.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['ai', 'language', 'framework', 'tool', 'cloud', 'other'],
        description: 'Filter skills by category.',
      },
    },
  },
};

export async function handler(input = {}) {
  const { category } = input;

  // Check cache for full skills list
  const cacheKey = 'skills:all';
  let skills = portfolioCache.get(cacheKey);

  if (!skills) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PROFILE_PK,
          ':skPrefix': 'SKILL#',
        },
      }),
    );

    skills = (result.Items || []).map((item) => ({
      id: item.SK.replace('SKILL#', ''),
      ...item.data,
    }));

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, skills);
  }

  let filtered = skills;

  if (category) {
    filtered = filtered.filter((skill) => skill.category === category);
  }

  return { skills: filtered, count: filtered.length };
}
