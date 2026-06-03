import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

export const definition = {
  name: 'getActivities',
  description: 'Retrieve sports, athletics, and club involvement from the portfolio, including past and current activities.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter by category: "sports", "clubs", or omit to get all activities',
      },
    },
  },
};

export async function handler(input = {}) {
  const { category } = input;
  const cacheKey = category ? `activities:${category}` : 'activities:all';

  let activities = portfolioCache.get(cacheKey);

  if (!activities) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': PROFILE_PK,
          ':skPrefix': 'ACTIVITY#',
        },
      }),
    );

    let items = (result.Items || []).map((item) => ({
      id: item.SK.replace('ACTIVITY#', ''),
      ...item.data,
    }));

    // Filter by category if specified
    if (category) {
      items = items.filter((item) => item.category === category);
    }

    activities = items;

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, activities);
  }

  return { activities, count: activities.length };
}
