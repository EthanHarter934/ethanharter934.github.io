import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { toolDefinitions, callTool } from '../mcp-server/index.js';
import { resolveModelId } from '../utils/modelId.js';

// Haiku 4.5 is the cheapest current Claude model on Bedrock.
// Newer models require a regional inference profile prefix (e.g. us., eu.).
const DEFAULT_MODEL = 'anthropic.claude-haiku-4-5-20251001-v1:0';
const MAX_OUTPUT_TOKENS = Number(process.env.BEDROCK_MAX_TOKENS || 1024);

const SYSTEM_PROMPT = `You are Melchior-1 (M-1 for short), a friendly, knowledgeable assistant embedded in Ethan's developer portfolio.
Your job is to help visitors learn about Ethan's skills, projects, work experience, and education.
Only answer questions relevant to the portfolio. If asked something unrelated, politely redirect.
Keep answers concise and conversational. Use tools to look up accurate, current information before answering.
Never make up projects, skills, or experience that you haven't retrieved from the database.`;

const MODEL_ID = resolveModelId(process.env.BEDROCK_MODEL_ID, process.env.AWS_REGION);

function toBedrockMessages(messages) {
  return messages.map((message) => ({
    role: message.role,
    content: [{ text: message.content }],
  }));
}

function extractAssistantText(message) {
  return (message.content || [])
    .filter((block) => block.text)
    .map((block) => block.text)
    .join('\n');
}

async function runConverseLoop(client, messages) {
  let bedrockMessages = toBedrockMessages(messages);
  let response;
  const toolCallCache = new Map();

  while (true) {
    response = await client.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: SYSTEM_PROMPT }],
        messages: bedrockMessages,
        toolConfig: { tools: toolDefinitions },
        inferenceConfig: { maxTokens: MAX_OUTPUT_TOKENS },
      }),
    );

    if (response.stopReason !== 'tool_use') {
      break;
    }

    bedrockMessages.push(response.output.message);

    const toolResultBlocks = [];

    for (const block of response.output.message.content) {
      if (!block.toolUse) continue;

      const { toolUseId, name, input } = block.toolUse;

      // Create cache key from tool name and input
      const cacheKey = `${name}:${JSON.stringify(input || {})}`;
      let result;

      // Check if we've already called this tool with same input in this conversation
      if (toolCallCache.has(cacheKey)) {
        result = toolCallCache.get(cacheKey);
      } else {
        try {
          result = await callTool(name, input || {});
          toolCallCache.set(cacheKey, result);
        } catch (error) {
          toolResultBlocks.push({
            toolResult: {
              toolUseId,
              status: 'error',
              content: [{ text: error.message }],
            },
          });
          continue;
        }
      }

      toolResultBlocks.push({
        toolResult: {
          toolUseId,
          content: [{ json: result }],
        },
      });
    }

    bedrockMessages.push({
      role: 'user',
      content: toolResultBlocks,
    });
  }

  return extractAssistantText(response.output.message);
}

export async function chat(messages) {
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });

  return runConverseLoop(client, messages);
}

export const handler = async (event) => {
  try {
    const body =
      typeof event.body === 'string' ? JSON.parse(event.body) : event.body || event;
    const { messages = [] } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'messages array is required' }),
      };
    }

    const reply = await chat(messages);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: reply }),
    };
  } catch (error) {
    console.error('Chat handler error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
};
