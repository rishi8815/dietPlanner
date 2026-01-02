/**
 * Redis Provider - Upstash Implementation
 * 
 * This file contains the actual Redis client implementation.
 * Currently configured for Upstash REST API.
 * 
 * To migrate to self-hosted Redis:
 * 1. Install ioredis: npm install ioredis
 * 2. Create a new provider class (SelfHostedRedisProvider)
 * 3. Update the factory function to return the new provider based on config
 */

import { REDIS_CONFIG, PERFORMANCE } from './config';
import type { RedisProvider, SetOptions, ScanOptions, RedisPipeline } from './types';

// ============================================
// Upstash REST API Client
// ============================================

class UpstashRedisProvider implements RedisProvider {
    private baseUrl: string;
    private token: string;
    private commandTimeout: number;

    constructor() {
        this.baseUrl = REDIS_CONFIG.upstash.url;
        this.token = REDIS_CONFIG.upstash.token;
        this.commandTimeout = PERFORMANCE.commandTimeout;

        // Debug logging
        console.log('🔧 Redis Config:', {
            url: this.baseUrl ? `${this.baseUrl.substring(0, 30)}...` : 'NOT SET',
            tokenSet: !!this.token,
            tokenLength: this.token?.length || 0,
        });

        if (!this.baseUrl || !this.token) {
            console.warn('⚠️ Redis: Upstash credentials not configured. Caching disabled.');
        } else {
            console.log('✅ Redis: Upstash configured successfully');
        }
    }

    /**
     * Check if Redis is properly configured
     */
    isConfigured(): boolean {
        return Boolean(this.baseUrl && this.token);
    }

    /**
     * Execute a Redis command via Upstash REST API
     */
    private async execute<T>(command: string[]): Promise<T> {
        if (!this.isConfigured()) {
            throw new Error('Redis not configured');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.commandTimeout);

        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(command),
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Redis error: ${error}`);
            }

            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            return result.result as T;
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Execute multiple commands in a pipeline
     */
    private async executePipeline(commands: string[][]): Promise<unknown[]> {
        if (!this.isConfigured()) {
            throw new Error('Redis not configured');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.commandTimeout);

        try {
            const response = await fetch(`${this.baseUrl}/pipeline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commands),
                signal: controller.signal,
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Redis pipeline error: ${error}`);
            }

            const results = await response.json();
            return results.map((r: { result?: unknown; error?: string }) => {
                if (r.error) throw new Error(r.error);
                return r.result;
            });
        } finally {
            clearTimeout(timeout);
        }
    }

    // ============================================
    // Basic Operations
    // ============================================

    async get<T = string>(key: string): Promise<T | null> {
        try {
            const result = await this.execute<string | null>(['GET', key]);
            if (result === null) return null;

            // Try to parse as JSON, return as-is if not valid JSON
            try {
                return JSON.parse(result) as T;
            } catch {
                return result as unknown as T;
            }
        } catch (error) {
            console.error('Redis GET error:', error);
            return null;
        }
    }

    async set(key: string, value: string | number | object, options?: SetOptions): Promise<'OK' | null> {
        try {
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            const command = ['SET', key, stringValue];

            if (options?.ex) {
                command.push('EX', String(options.ex));
            } else if (options?.px) {
                command.push('PX', String(options.px));
            }

            if (options?.nx) {
                command.push('NX');
            } else if (options?.xx) {
                command.push('XX');
            }

            return await this.execute<'OK'>(command);
        } catch (error) {
            console.error('Redis SET error:', error);
            return null;
        }
    }

    async del(...keys: string[]): Promise<number> {
        try {
            return await this.execute<number>(['DEL', ...keys]);
        } catch (error) {
            console.error('Redis DEL error:', error);
            return 0;
        }
    }

    async exists(...keys: string[]): Promise<number> {
        try {
            return await this.execute<number>(['EXISTS', ...keys]);
        } catch (error) {
            console.error('Redis EXISTS error:', error);
            return 0;
        }
    }

    // ============================================
    // Expiration
    // ============================================

    async expire(key: string, seconds: number): Promise<0 | 1> {
        try {
            return await this.execute<0 | 1>(['EXPIRE', key, String(seconds)]);
        } catch (error) {
            console.error('Redis EXPIRE error:', error);
            return 0;
        }
    }

    async ttl(key: string): Promise<number> {
        try {
            return await this.execute<number>(['TTL', key]);
        } catch (error) {
            console.error('Redis TTL error:', error);
            return -2;
        }
    }

    // ============================================
    // Hash Operations
    // ============================================

    async hget<T = string>(key: string, field: string): Promise<T | null> {
        try {
            const result = await this.execute<string | null>(['HGET', key, field]);
            if (result === null) return null;

            try {
                return JSON.parse(result) as T;
            } catch {
                return result as unknown as T;
            }
        } catch (error) {
            console.error('Redis HGET error:', error);
            return null;
        }
    }

    async hset(key: string, field: string, value: string | number): Promise<number> {
        try {
            const stringValue = typeof value === 'number' ? String(value) : value;
            return await this.execute<number>(['HSET', key, field, stringValue]);
        } catch (error) {
            console.error('Redis HSET error:', error);
            return 0;
        }
    }

    async hgetall<T = Record<string, string>>(key: string): Promise<T | null> {
        try {
            const result = await this.execute<string[]>(['HGETALL', key]);
            if (!result || result.length === 0) return null;

            // Convert array to object
            const obj: Record<string, string> = {};
            for (let i = 0; i < result.length; i += 2) {
                obj[result[i]] = result[i + 1];
            }
            return obj as T;
        } catch (error) {
            console.error('Redis HGETALL error:', error);
            return null;
        }
    }

    async hdel(key: string, ...fields: string[]): Promise<number> {
        try {
            return await this.execute<number>(['HDEL', key, ...fields]);
        } catch (error) {
            console.error('Redis HDEL error:', error);
            return 0;
        }
    }

    // ============================================
    // List Operations
    // ============================================

    async lpush(key: string, ...values: string[]): Promise<number> {
        try {
            return await this.execute<number>(['LPUSH', key, ...values]);
        } catch (error) {
            console.error('Redis LPUSH error:', error);
            return 0;
        }
    }

    async rpush(key: string, ...values: string[]): Promise<number> {
        try {
            return await this.execute<number>(['RPUSH', key, ...values]);
        } catch (error) {
            console.error('Redis RPUSH error:', error);
            return 0;
        }
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
        try {
            return await this.execute<string[]>(['LRANGE', key, String(start), String(stop)]);
        } catch (error) {
            console.error('Redis LRANGE error:', error);
            return [];
        }
    }

    async llen(key: string): Promise<number> {
        try {
            return await this.execute<number>(['LLEN', key]);
        } catch (error) {
            console.error('Redis LLEN error:', error);
            return 0;
        }
    }

    // ============================================
    // Sorted Set Operations (for Rate Limiting)
    // ============================================

    async zadd(key: string, score: number, member: string): Promise<number> {
        try {
            return await this.execute<number>(['ZADD', key, String(score), member]);
        } catch (error) {
            console.error('Redis ZADD error:', error);
            return 0;
        }
    }

    async zremrangebyscore(key: string, min: number, max: number): Promise<number> {
        try {
            return await this.execute<number>([
                'ZREMRANGEBYSCORE',
                key,
                String(min),
                String(max)
            ]);
        } catch (error) {
            console.error('Redis ZREMRANGEBYSCORE error:', error);
            return 0;
        }
    }

    async zcard(key: string): Promise<number> {
        try {
            return await this.execute<number>(['ZCARD', key]);
        } catch (error) {
            console.error('Redis ZCARD error:', error);
            return 0;
        }
    }

    async zcount(key: string, min: number, max: number): Promise<number> {
        try {
            return await this.execute<number>([
                'ZCOUNT',
                key,
                String(min),
                String(max)
            ]);
        } catch (error) {
            console.error('Redis ZCOUNT error:', error);
            return 0;
        }
    }

    // ============================================
    // Increment Operations
    // ============================================

    async incr(key: string): Promise<number> {
        try {
            return await this.execute<number>(['INCR', key]);
        } catch (error) {
            console.error('Redis INCR error:', error);
            return 0;
        }
    }

    async incrby(key: string, increment: number): Promise<number> {
        try {
            return await this.execute<number>(['INCRBY', key, String(increment)]);
        } catch (error) {
            console.error('Redis INCRBY error:', error);
            return 0;
        }
    }

    // ============================================
    // Key Pattern Operations
    // ============================================

    async keys(pattern: string): Promise<string[]> {
        try {
            return await this.execute<string[]>(['KEYS', pattern]);
        } catch (error) {
            console.error('Redis KEYS error:', error);
            return [];
        }
    }

    async scan(cursor: number, options?: ScanOptions): Promise<[string, string[]]> {
        try {
            const command = ['SCAN', String(cursor)];
            if (options?.match) {
                command.push('MATCH', options.match);
            }
            if (options?.count) {
                command.push('COUNT', String(options.count));
            }
            return await this.execute<[string, string[]]>(command);
        } catch (error) {
            console.error('Redis SCAN error:', error);
            return ['0', []];
        }
    }

    // ============================================
    // Pipeline Operations
    // ============================================

    pipeline(): RedisPipeline {
        const commands: string[][] = [];

        const pipelineInstance: RedisPipeline = {
            get: (key: string) => {
                commands.push(['GET', key]);
                return pipelineInstance;
            },
            set: (key: string, value: string, options?: SetOptions) => {
                const cmd = ['SET', key, value];
                if (options?.ex) cmd.push('EX', String(options.ex));
                commands.push(cmd);
                return pipelineInstance;
            },
            del: (...keys: string[]) => {
                commands.push(['DEL', ...keys]);
                return pipelineInstance;
            },
            expire: (key: string, seconds: number) => {
                commands.push(['EXPIRE', key, String(seconds)]);
                return pipelineInstance;
            },
            incr: (key: string) => {
                commands.push(['INCR', key]);
                return pipelineInstance;
            },
            exec: async () => {
                if (commands.length === 0) return [];
                return this.executePipeline(commands);
            },
        };

        return pipelineInstance;
    }

    // ============================================
    // Health Check
    // ============================================

    async ping(): Promise<'PONG'> {
        try {
            return await this.execute<'PONG'>(['PING']);
        } catch (error) {
            console.error('Redis PING error:', error);
            throw error;
        }
    }
}

// ============================================
// Provider Factory
// ============================================

let redisInstance: RedisProvider | null = null;

/**
 * Get the Redis provider instance (singleton)
 * 
 * When migrating to self-hosted Redis:
 * 1. Add a case for 'self-hosted' in the switch statement
 * 2. Return a new SelfHostedRedisProvider instance
 */
export function getRedisProvider(): RedisProvider {
    if (!redisInstance) {
        switch (REDIS_CONFIG.provider) {
            case 'upstash':
                redisInstance = new UpstashRedisProvider();
                break;
            // Future: Add self-hosted provider
            // case 'self-hosted':
            //     redisInstance = new SelfHostedRedisProvider();
            //     break;
            default:
                redisInstance = new UpstashRedisProvider();
        }
    }
    return redisInstance;
}

/**
 * Check if Redis is available and configured
 */
export function isRedisAvailable(): boolean {
    const provider = getRedisProvider();
    return (provider as UpstashRedisProvider).isConfigured?.() ?? true;
}

// Export singleton instance
export const redis = getRedisProvider();
