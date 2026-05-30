import 'dotenv/config';
import express from 'express';
import { chat } from './lambda/chat.js';

const app = express();
const PORT = process.env.PORT || 3001;

function resolveModelIdForLog() {
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-haiku-4-5-20251001-v1:0';
  if (/^(us|eu|apac|global)\./.test(modelId)) return modelId;
  const region = process.env.AWS_REGION || 'us-east-1';
  let prefix = 'us';
  if (region.startsWith('eu-')) prefix = 'eu';
  else if (region.startsWith('ap-')) prefix = 'apac';
  return `${prefix}.${modelId}`;
}

app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const reply = await chat(messages);
    res.json({ message: reply });
  } catch (error) {
    console.error('POST /api/chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio backend listening on http://localhost:${PORT}`);
  console.log(`Bedrock model: ${resolveModelIdForLog()}`);
});
