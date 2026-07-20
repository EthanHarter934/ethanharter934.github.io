import config from '../config.js';

// Core validation, shared by the Express middleware below and the Lambda
// handler (which has no req/res to hang middleware off of).
export function validateMessages(messages) {
  // Check if messages array exists
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'messages array is required and must not be empty' };
  }

  // Check message count limit
  if (messages.length > config.maxMessageCount) {
    return {
      valid: false,
      error: `max ${config.maxMessageCount} messages per request, got ${messages.length}`,
    };
  }

  // Validate each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // Check role
    if (!config.validRoles.includes(msg.role)) {
      return {
        valid: false,
        error: `message ${i}: invalid role "${msg.role}", must be one of: ${config.validRoles.join(', ')}`,
      };
    }

    // Check content exists and is string
    if (typeof msg.content !== 'string') {
      return {
        valid: false,
        error: `message ${i}: content must be a string, got ${typeof msg.content}`,
      };
    }

    // Check content length
    if (msg.content.length === 0) {
      return { valid: false, error: `message ${i}: content cannot be empty` };
    }

    if (msg.content.length > config.maxMessageLength) {
      return {
        valid: false,
        error: `message ${i}: content exceeds max length of ${config.maxMessageLength} characters (${msg.content.length})`,
      };
    }
  }

  return { valid: true };
}

export function validateChatRequest(req, res, next) {
  const result = validateMessages(req.body.messages);

  if (!result.valid) {
    return res.status(400).json({ error: result.error });
  }

  next();
}
