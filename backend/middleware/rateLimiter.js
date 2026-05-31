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

export function rateLimiter(req, res, next) {
  const clientIp = getClientIp(req);
  const now = Date.now();

  // Periodically clean old entries to prevent memory leak
  if (requestCounts.size > 10000) {
    cleanExpiredEntries();
  }

  // Initialize or get existing timestamps for this IP
  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, []);
  }

  const timestamps = requestCounts.get(clientIp);
  const windowStart = now - config.rateLimitWindowMs;

  // Remove timestamps outside the current window
  const recentRequests = timestamps.filter((t) => t > windowStart);

  // Check if limit exceeded
  if (recentRequests.length >= config.rateLimitMaxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil((recentRequests[0] + config.rateLimitWindowMs - now) / 1000),
      message: `Rate limit exceeded. Max ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000} seconds.`,
    });
  }

  // Add current request timestamp
  recentRequests.push(now);
  requestCounts.set(clientIp, recentRequests);

  // Add rate limit info to response headers
  res.setHeader('X-RateLimit-Limit', config.rateLimitMaxRequests);
  res.setHeader('X-RateLimit-Remaining', config.rateLimitMaxRequests - recentRequests.length);
  res.setHeader('X-RateLimit-Reset', Math.ceil((recentRequests[0] + config.rateLimitWindowMs) / 1000));

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
