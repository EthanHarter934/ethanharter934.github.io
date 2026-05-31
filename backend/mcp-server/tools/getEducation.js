import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

export const definition = {
  name: 'getEducation',
  description: 'Retrieve education history from the portfolio.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handler() {
  // Check cache first
  const cacheKey = 'education:all';
  let education = portfolioCache.get(cacheKey);

  if (!education) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PROFILE_PK,
          ':skPrefix': 'EDUCATION#',
        },
      }),
    );

    education = (result.Items || []).map((item) => ({
      id: item.SK.replace('EDUCATION#', ''),
      ...item.data,
    }));

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, education);
  }

  return { education, count: education.length };
}
