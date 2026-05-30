import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';

export const definition = {
  name: 'getSkills',
  description:
    'Retrieve technical skills. Optionally filter by category: language, framework, tool, cloud, or other.',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        enum: ['language', 'framework', 'tool', 'cloud', 'other'],
        description: 'Filter skills by category.',
      },
    },
  },
};

export async function handler(input = {}) {
  const { category } = input;

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

  let skills = (result.Items || []).map((item) => ({
    id: item.SK.replace('SKILL#', ''),
    ...item.data,
  }));

  if (category) {
    skills = skills.filter((skill) => skill.category === category);
  }

  return { skills, count: skills.length };
}
