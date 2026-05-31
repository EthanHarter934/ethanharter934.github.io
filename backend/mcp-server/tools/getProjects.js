import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME, PROFILE_PK } from '../db/dynamoClient.js';
import { portfolioCache } from '../../utils/cache.js';

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

  // Check cache for full project list
  const cacheKey = 'projects:all';
  let projects = portfolioCache.get(cacheKey);

  if (!projects) {
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

    projects = (result.Items || []).map((item) => ({
      id: item.SK.replace('PROJECT#', ''),
      ...item.data,
      featured: item.featured ?? item.data?.featured ?? false,
    }));

    // Cache for 5 minutes
    portfolioCache.set(cacheKey, projects);
  }

  let filtered = projects;

  if (featured === true) {
    filtered = filtered.filter((project) => project.featured);
  }

  if (techStack) {
    const needle = techStack.toLowerCase();
    filtered = filtered.filter((project) =>
      (project.techStack || []).some((tech) => tech.toLowerCase().includes(needle)),
    );
  }

  return { projects: filtered, count: filtered.length };
}
