import config from '../config.js';

export function validateChatRequest(req, res, next) {
  const { messages } = req.body;

  // Check if messages array exists
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required and must not be empty' });
  }

  // Check message count limit
  if (messages.length > config.maxMessageCount) {
    return res.status(400).json({
      error: `max ${config.maxMessageCount} messages per request, got ${messages.length}`,
    });
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Check role
    if (!config.validRoles.includes(msg.role)) {
      return res.status(400).json({
        error: `message ${i}: invalid role "${msg.role}", must be one of: ${config.validRoles.join(', ')}`,
      });
    }

    // Check content exists and is string
    if (typeof msg.content !== 'string') {
      return res.status(400).json({
        error: `message ${i}: content must be a string, got ${typeof msg.content}`,
      });
    }

    // Check content length
    if (msg.content.length === 0) {
      return res.status(400).json({
        error: `message ${i}: content cannot be empty`,
      });
    }

    if (msg.content.length > config.maxMessageLength) {
      return res.status(400).json({
        error: `message ${i}: content exceeds max length of ${config.maxMessageLength} characters (${msg.content.length})`,
      });
    }
  }

  next();
}
