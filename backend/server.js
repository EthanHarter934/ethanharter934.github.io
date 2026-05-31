import 'dotenv/config';
import express from 'express';
import { chat } from './lambda/chat.js';
import { validateChatRequest } from './middleware/validateChat.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { resolveModelId } from './utils/modelId.js';
import { logger } from './utils/logger.js';
import config, { validateConfig } from './config.js';

const app = express();
validateConfig();

function resolveModelIdForLog() {
  return resolveModelId(config.bedrockModelId, config.awsRegion);
}

app.use(express.json());

app.post('/api/chat', rateLimiter, validateChatRequest, async (req, res) => {
  try {
    const { messages } = req.body;

    logger.info('Chat request received', {
      messageCount: messages.length,
      lastMessage: messages[messages.length - 1]?.content?.substring(0, 50),
    });

    const reply = await chat(messages);

    logger.info('Chat response generated', {
      responseLength: reply.length,
    });

    res.json({ message: reply });
  } catch (error) {
    logger.error('Chat request failed', error, {
      messageCount: req.body?.messages?.length,
    });
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(config.port, () => {
  logger.info('Server started', {
    port: config.port,
    bedrockModel: resolveModelIdForLog(),
  });
});
