import config from '../config.js';

// Simple in-memory rate limiter for IP-based throttling
const requestCounts = new Map();

function getClientIp(req) {
  // Try to get real IP from CloudFront/proxy headers
  return (
    req.headers['cloudfront-viewer-address'] ||
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function cleanExpiredEntries() {
  const now = Date.now();
  const expiredIps = [];

  for (const [ip, timestamps] of requestCounts.entries()) {
    const recent = timestamps.filter((t) => now - t < config.rateLimitWindowMs);
    if (recent.length === 0) {
      expiredIps.push(ip);
    } else {
      requestCounts.set(ip, recent);
    }
  }

  // Clean up expired IPs
  expiredIps.forEach((ip) => requestCounts.delete(ip));
}

// Core sliding-window check, shared by the Express middleware below and
// the Lambda handler (which has no req/res to hang middleware off of).
export function checkRateLimit(clientIp) {
  const now = Date.now();

  // Periodically clean old entries to prevent memory leak
  if (requestCounts.size > 10000) {
    cleanExpiredEntries();
  }

  const timestamps = requestCounts.get(clientIp) || [];
  const windowStart = now - config.rateLimitWindowMs;

  // Remove timestamps outside the current window
  const recentRequests = timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (recentRequests.length >= config.rateLimitMaxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((recentRequests[0] + config.rateLimitWindowMs - now) / 1000),
    };
  }

  // Add current request timestamp
  recentRequests.push(now);
  requestCounts.set(clientIp, recentRequests);

  return {
    allowed: true,
    remaining: config.rateLimitMaxRequests - recentRequests.length,
    reset: Math.ceil((recentRequests[0] + config.rateLimitWindowMs) / 1000),
  };
}

export function rateLimiter(req, res, next) {
  const clientIp = getClientIp(req);
  const result = checkRateLimit(clientIp);

  if (!result.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
      message: `Rate limit exceeded. Max ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds.`,
    });
  }

  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', config.rateLimitMaxRequests);
  res.setHeader('X-RateLimit-Remaining', result.remaining);
  res.setHeader('X-RateLimit-Reset', result.reset);

  next();
}

export function getRateLimiterStats() {
  return {
    trackedIps: requestCounts.size,
    config: {
      windowMs: config.rateLimitWindowMs,
      maxRequests: config.rateLimitMaxRequests,
    },
  };
}
