import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';

export const definition = {
  name: 'searchPortfolio',
  description:
    'Search across all portfolio entities (projects, skills, experience, education) by keyword.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Keyword or phrase to search for across portfolio data.',
      },
    },
    required: ['query'],
  },
};

function collectSearchableText(item) {
  const data = item.data || {};
  const values = Object.values(data).flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (value && typeof value === 'object') return Object.values(value).map(String);
    return value != null ? [String(value)] : [];
  });
  return values.join(' ').toLowerCase();
}

export async function handler(input = {}) {
  const { query } = input;
  if (!query || !query.trim()) {
    return { results: [], count: 0, query: query || '' };
  }

  const needle = query.trim().toLowerCase();

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': PROFILE_PK,
      },
    }),
  );

  const results = (result.Items || [])
    .filter((item) => collectSearchableText(item).includes(needle))
    .map((item) => ({
      type: item.type,
      id: item.SK,
      ...item.data,
      featured: item.featured ?? item.data?.featured,
    }));

  return { results, count: results.length, query };
}
