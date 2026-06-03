import * as getProjects from './tools/getProjects.js';
import * as getSkills from './tools/getSkills.js';
import * as getExperience from './tools/getExperience.js';
import * as getEducation from './tools/getEducation.js';
import * as getActivities from './tools/getActivities.js';
import * as searchPortfolio from './tools/searchPortfolio.js';

const tools = [getProjects, getSkills, getExperience, getEducation, getActivities, searchPortfolio];

export const toolDefinitions = tools.map(({ definition }) => ({
  toolSpec: {
    name: definition.name,
    description: definition.description,
    inputSchema: {
      json: definition.inputSchema,
    },
  },
}));

const toolHandlers = Object.fromEntries(
  tools.map(({ definition, handler }) => [definition.name, handler]),
);

export async function callTool(name, input = {}) {
  const toolHandler = toolHandlers[name];
  if (!toolHandler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return toolHandler(input);
}

export { getProjects, getSkills, getExperience, getEducation, getActivities, searchPortfolio };
