import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';

export const definition = {
  name: 'getExperience',
  description: 'Retrieve work experience entries from the portfolio.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function handler() {
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

  const experience = (result.Items || []).map((item) => ({
    id: item.SK.replace('EXPERIENCE#', ''),
    ...item.data,
  }));

  return { experience, count: experience.length };
}
