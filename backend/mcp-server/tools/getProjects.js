import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';

export const definition = {
  name: 'getProjects',
  description:
    'Retrieve portfolio projects. Optionally filter by featured status or a specific technology in the tech stack.',
  inputSchema: {
    type: 'object',
    properties: {
      featured: {
        type: 'boolean',
        description: 'If true, return only featured projects.',
      },
      techStack: {
        type: 'string',
        description: 'Filter projects that include this technology (case-insensitive).',
      },
    },
  },
};

export async function handler(input = {}) {
  const { featured, techStack } = input;

  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': PROFILE_PK,
        ':skPrefix': 'PROJECT#',
      },
    }),
  );

  let projects = (result.Items || []).map((item) => ({
    id: item.SK.replace('PROJECT#', ''),
    ...item.data,
    featured: item.featured ?? item.data?.featured ?? false,
  }));

  if (featured === true) {
    projects = projects.filter((project) => project.featured);
  }

  if (techStack) {
    const needle = techStack.toLowerCase();
    projects = projects.filter((project) =>
      (project.techStack || []).some((tech) => tech.toLowerCase().includes(needle)),
    );
  }

  return { projects, count: projects.length };
}
