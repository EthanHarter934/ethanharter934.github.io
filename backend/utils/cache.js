// Simple in-memory cache for portfolio data in Lambda with TTL
import config from '../config.js';

class PortfolioCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  set(key, value) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now());
  }

  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }

    const timestamp = this.timestamps.get(key);
    const isExpired = Date.now() - timestamp > config.cacheExpireTtlMs;

    if (isExpired) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  getStats() {
    return {
      cachedKeys: this.cache.size,
      ttlMs: config.cacheExpireTtlMs,
    };
  }
}

export const portfolioCache = new PortfolioCache();
