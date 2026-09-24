import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

export const definition = {
  name: 'getAwards',
  description:
    'Retrieve awards, competition wins, scholarships, and honors from the portfolio, with dates and the related project where there is one.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handler() {
  // Check cache first
  const cacheKey = 'awards:all';
  let awards = portfolioCache.get(cacheKey);

  if (!awards) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PROFILE_PK,
          ':skPrefix': 'AWARD#',
        },
      }),
    );

    awards = (result.Items || []).map((item) => ({
      id: item.SK.replace('AWARD#', ''),
      ...item.data,
    }));

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, awards);
  }

  return { awards, count: awards.length };
}
