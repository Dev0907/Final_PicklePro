// Data caching utility to prevent dashboard data from resetting to 0
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Get cached data or return fallback
  getOrFallback<T>(key: string, fallback: T): T {
    const cached = this.get<T>(key);
    return cached !== null ? cached : fallback;
  }
}

// Singleton instance
export const dataCache = new DataCache();

// Specific cache keys for dashboard data
export const CACHE_KEYS = {
  USER_STATS: 'user_stats',
  RECENT_MATCHES: 'recent_matches',
  RECENT_BOOKINGS: 'recent_bookings',
  UPCOMING_EVENTS: 'upcoming_events',
  PARTICIPATING_MATCHES: 'participating_matches'
} as const;

// Local storage backup for critical data
export const persistentStorage = {
  set: (key: string, data: any): void => {
    try {
      localStorage.setItem(`picklepro_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  get: <T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): T | null => {
    try {
      const stored = localStorage.getItem(`picklepro_${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      if (now - parsed.timestamp > maxAge) {
        localStorage.removeItem(`picklepro_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('picklepro_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};