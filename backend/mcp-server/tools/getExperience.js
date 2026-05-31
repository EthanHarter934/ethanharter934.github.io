import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

export const definition = {
  name: 'getExperience',
  description: 'Retrieve work experience entries from the portfolio.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handler() {
  // Check cache first
  const cacheKey = 'experience:all';
  let experience = portfolioCache.get(cacheKey);

  if (!experience) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PROFILE_PK,
          ':skPrefix': 'EXPERIENCE#',
        },
      }),
    );

    experience = (result.Items || []).map((item) => ({
      id: item.SK.replace('EXPERIENCE#', ''),
      ...item.data,
    }));

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, experience);
  }

  return { experience, count: experience.length };
}
