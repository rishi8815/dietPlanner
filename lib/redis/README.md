# Redis Module Documentation

This document explains the Redis caching and rate limiting implementation in the application.

## 📁 Folder Structure

```
lib/redis/
├── index.ts        # Main entry point (exports everything)
├── types.ts        # TypeScript interfaces
├── config.ts       # Configuration (TTL, rate limits, etc.)
├── keys.ts         # Key naming conventions and builders
├── provider.ts     # Redis client implementation (Upstash)
├── cache.ts        # Caching service with patterns
└── rateLimit.ts    # Rate limiting service
```

## 🚀 Quick Start

### Caching

```typescript
import { cache, cacheKeys, CACHE_TTL } from '@/lib/redis';

// Simple cache-aside pattern (recommended)
const data = await cache.getOrSet(
  cacheKeys.userProfile(userId),
  () => fetchFromDatabase(userId),
  { ttl: CACHE_TTL.namespaces.profile }
);

// Manual get/set
const cached = await cache.get<UserProfile>(key);
await cache.set(key, data, { ttl: 300 });

// Cache invalidation
await cache.invalidateByTag(tagKeys.userProfile(userId));
```

### Rate Limiting

```typescript
import { rateLimitGemini, rateLimitWrite, checkRateLimit } from '@/lib/redis';

// Pre-configured rate limiters
const result = await rateLimitGemini(userId);
if (!result.success) {
  throw new Error(`Rate limited. Retry in ${result.retryAfter}s`);
}

// Custom rate limit
const result = await checkRateLimit({
  identifier: userId,
  limit: 20,
  window: 60, // 20 requests per 60 seconds
});
```

## ⚙️ Configuration

Edit `lib/redis/config.ts` to adjust:

| Setting | Description |
|---------|-------------|
| `CACHE_TTL.namespaces` | TTL per data type (profile, meals, etc.) |
| `RATE_LIMIT.endpoints` | Rate limits per endpoint type |
| `KEY_PREFIX.app` | App prefix for all keys |

## 🔄 Migrating to Self-Hosted Redis

When you're ready to migrate from Upstash to your own Redis VPS:

### Step 1: Install ioredis

```bash
npm install ioredis
# or
bun add ioredis
```

### Step 2: Update Environment Variables

```env
# Remove Upstash vars and add:
REDIS_HOST=your-vps-ip
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS=false
```

### Step 3: Create Self-Hosted Provider

Create a new file `lib/redis/providers/selfhosted.ts`:

```typescript
import Redis from 'ioredis';
import type { RedisProvider, SetOptions } from '../types';

export class SelfHostedRedisProvider implements RedisProvider {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async get<T = string>(key: string): Promise<T | null> {
    const result = await this.client.get(key);
    if (!result) return null;
    try {
      return JSON.parse(result) as T;
    } catch {
      return result as unknown as T;
    }
  }

  async set(key: string, value: string | number | object, options?: SetOptions): Promise<'OK' | null> {
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (options?.ex) {
      return await this.client.set(key, stringValue, 'EX', options.ex);
    }
    return await this.client.set(key, stringValue);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return await this.client.del(...keys);
  }

  // ... implement other methods following the same pattern
}
```

### Step 4: Update Provider Factory

In `lib/redis/provider.ts`, update the factory:

```typescript
import { SelfHostedRedisProvider } from './providers/selfhosted';

export function getRedisProvider(): RedisProvider {
  if (!redisInstance) {
    switch (REDIS_CONFIG.provider) {
      case 'upstash':
        redisInstance = new UpstashRedisProvider();
        break;
      case 'self-hosted':
        redisInstance = new SelfHostedRedisProvider();
        break;
      default:
        redisInstance = new UpstashRedisProvider();
    }
  }
  return redisInstance;
}
```

### Step 5: Update Config

In `lib/redis/config.ts`:

```typescript
export const REDIS_CONFIG = {
  provider: 'self-hosted' as const,  // Change from 'upstash'
  // ...
};
```

## 📊 Cache Strategies Used

### 1. Cache-Aside (Lazy Loading)
- Check cache first
- On miss, fetch from DB and cache
- Used for most GET operations

### 2. Stale-While-Revalidate
- Return stale data immediately
- Refresh in background
- Used for profile data (UX optimization)

### 3. Tag-Based Invalidation
- Group related cache entries with tags
- Invalidate all at once on mutation
- Example: All meals for a user

## 🛡️ Rate Limiting Algorithm

We use **Sliding Window** rate limiting:

```
Time Window: [now - window_size, now]

1. Remove entries older than window start
2. Count remaining entries
3. If count >= limit, reject
4. Otherwise, add new entry and allow
```

Benefits over Fixed Window:
- No burst at window boundaries
- More accurate rate control
- Fairer to users

## 🔑 Key Naming Convention

All keys follow this pattern:

```
{app}:{type}:{namespace}:{identifier}:{specifics}
```

Examples:
- `n8n:cache:profile:user123`
- `n8n:cache:meals:user123:2024-01-15`
- `n8n:rl:gemini:user123`
- `n8n:tag:user:user123`

## 📈 Performance Tips

1. **Use pipelines for batch operations**
   ```typescript
   const pipeline = redis.pipeline();
   pipeline.get(key1);
   pipeline.get(key2);
   const results = await pipeline.exec();
   ```

2. **Set appropriate TTLs**
   - Shorter for frequently changing data
   - Longer for stable data (reduces API calls)

3. **Cache only what's needed**
   - Don't cache entire large objects
   - Consider caching derived/computed values

4. **Monitor cache hit rate**
   ```typescript
   const stats = cache.getStats();
   console.log(`Hit rate: ${stats.hitRate * 100}%`);
   ```

## 🐛 Debugging

Enable verbose logging in development:

```typescript
// In provider.ts, add logging:
private async execute<T>(command: string[]): Promise<T> {
  if (__DEV__) {
    console.log('Redis:', command.join(' '));
  }
  // ...
}
```

## 🔒 Security Notes

1. **Never expose Redis credentials client-side** (we use `EXPO_PUBLIC_` which is technically exposed, but Upstash tokens have rate limits)

2. **For production VPS Redis:**
   - Enable TLS
   - Use strong passwords
   - Restrict IP access with firewall
   - Consider Redis ACLs

3. **Rate limiting protects against:**
   - API abuse
   - DDoS attacks
   - Expensive operation abuse (AI calls)
