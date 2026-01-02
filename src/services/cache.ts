import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 60,
      checkperiod: 120,
      useClones: false,
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || 0);
  }

  del(key: string): void {
    this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService();
