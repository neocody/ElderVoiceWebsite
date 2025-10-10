import { LRUCache } from "lru-cache";
import { Request, Response, NextFunction } from "express";

// In-memory caching service for performance optimization
export class CacheService {
  private cache: LRUCache<string, any>;
  private ttlCache: LRUCache<string, any>;

  // Statistics tracking properties
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private ttlCacheHits: number = 0;
  private ttlCacheMisses: number = 0;

  constructor() {
    // Main cache with 1000 items max, 1 hour TTL
    this.cache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
    });

    // Short-term cache for frequent operations (5 minutes TTL)
    this.ttlCache = new LRUCache({
      max: 500,
      ttl: 1000 * 60 * 5, // 5 minutes
    });
  }

  // Get from cache
  get(key: string): any {
    const result = this.cache.get(key);
    if (result !== undefined) {
      this.cacheHits++;
    } else {
      this.cacheMisses++;
    }
    return result;
  }

  // Set in cache
  set(key: string, value: any, ttl?: number): void {
    if (ttl) {
      this.cache.set(key, value, { ttl });
    } else {
      this.cache.set(key, value);
    }
  }

  // Get from short-term cache
  getShort(key: string): any {
    const result = this.ttlCache.get(key);
    if (result !== undefined) {
      this.ttlCacheHits++;
    } else {
      this.ttlCacheMisses++;
    }
    return result;
  }

  // Set in short-term cache
  setShort(key: string, value: any): void {
    this.ttlCache.set(key, value);
  }

  // Delete from cache
  delete(key: string): void {
    this.cache.delete(key);
    this.ttlCache.delete(key);
  }

  // Clear all caches
  clear(): void {
    this.cache.clear();
    this.ttlCache.clear();
    // Reset statistics
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.ttlCacheHits = 0;
    this.ttlCacheMisses = 0;
  }

  // Cache statistics
  getStats() {
    const totalMainRequests = this.cacheHits + this.cacheMisses;
    const totalTtlRequests = this.ttlCacheHits + this.ttlCacheMisses;

    return {
      mainCache: {
        size: this.cache.size,
        max: this.cache.max,
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: totalMainRequests > 0 ? this.cacheHits / totalMainRequests : 0,
      },
      shortTermCache: {
        size: this.ttlCache.size,
        max: this.ttlCache.max,
        hits: this.ttlCacheHits,
        misses: this.ttlCacheMisses,
        hitRate:
          totalTtlRequests > 0 ? this.ttlCacheHits / totalTtlRequests : 0,
      },
      // Combined statistics for convenience
      hits: this.cacheHits + this.ttlCacheHits,
      misses: this.cacheMisses + this.ttlCacheMisses,
      hitRate:
        totalMainRequests + totalTtlRequests > 0
          ? (this.cacheHits + this.ttlCacheHits) /
            (totalMainRequests + totalTtlRequests)
          : 0,
      size: this.cache.size + this.ttlCache.size,
    };
  }

  // Cached function wrapper
  async cachedFunction<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  // User-specific cache methods
  getUserCacheKey(userId: string, key: string): string {
    return `user:${userId}:${key}`;
  }

  getUserData(userId: string, key: string): any {
    return this.get(this.getUserCacheKey(userId, key));
  }

  setUserData(userId: string, key: string, value: any, ttl?: number): void {
    this.set(this.getUserCacheKey(userId, key), value, ttl);
  }

  deleteUserData(userId: string, key: string): void {
    this.delete(this.getUserCacheKey(userId, key));
  }

  // API response caching
  cacheApiResponse(
    endpoint: string,
    params: Record<string, any>,
    response: any,
    ttl = 300000
  ): void {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    this.set(key, response, ttl);
  }

  getCachedApiResponse(endpoint: string, params: Record<string, any>): any {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.get(key);
  }

  // Database query caching
  cacheQuery(query: string, params: any[], result: any, ttl = 600000): void {
    const key = `query:${Buffer.from(query + JSON.stringify(params)).toString(
      "base64"
    )}`;
    this.set(key, result, ttl);
  }

  getCachedQuery(query: string, params: any[]): any {
    const key = `query:${Buffer.from(query + JSON.stringify(params)).toString(
      "base64"
    )}`;
    return this.get(key);
  }
}

// Global cache instance
export const cacheService = new CacheService();

// Cache middleware for Express
export function cacheMiddleware(ttl = 300000) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `${req.method}:${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cached = cacheService.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      cacheService.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
}
