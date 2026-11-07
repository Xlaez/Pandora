import { DService, logger } from '@dolphjs/dolph';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';
import { env } from '../configs/env.config';

interface FallbackEntry {
    value: string;
    expiresAt: number | null;
}

@DService()
export class RedisService {
    private client: Redis | null = null;
    private isReady = false;
    private fallbackStore = new Map<string, FallbackEntry>();

    constructor() {
        if (env.nodeEnv !== 'test') {
            this.initClient();
        }
    }

    private initClient(): void {
        try {
            this.client = new Redis(env.redisUrl, {
                maxRetriesPerRequest: 2,
                enableOfflineQueue: false,
                lazyConnect: false,
                retryStrategy: (times: number) => {
                    if (times > 5) return null;
                    return Math.min(times * 200, 1000);
                },
            });

            this.client.on('ready', () => {
                this.isReady = true;
            });

            this.client.on('error', () => {
                this.isReady = false;
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`Redis initialization fell back to memory store: ${message}`);
            this.isReady = false;
        }
    }

    private cleanExpired(key: string): void {
        const entry = this.fallbackStore.get(key);
        if (entry && entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
            this.fallbackStore.delete(key);
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (this.client && this.isReady) {
            if (ttlSeconds && ttlSeconds > 0) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, value);
            }
            return;
        }

        this.fallbackStore.set(key, {
            value,
            expiresAt: ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
        });
    }

    async get(key: string): Promise<string | null> {
        if (this.client && this.isReady) {
            return this.client.get(key);
        }

        this.cleanExpired(key);
        return this.fallbackStore.get(key)?.value ?? null;
    }

    async del(key: string): Promise<void> {
        if (this.client && this.isReady) {
            await this.client.del(key);
            return;
        }

        this.fallbackStore.delete(key);
    }

    async getTtl(key: string): Promise<number> {
        if (this.client && this.isReady) {
            const ttl = await this.client.ttl(key);
            return Math.max(0, ttl);
        }

        this.cleanExpired(key);
        const entry = this.fallbackStore.get(key);
        if (!entry || entry.expiresAt === null) return 0;
        return Math.max(0, Math.ceil((entry.expiresAt - Date.now()) / 1000));
    }

    async acquireLock(lockName: string, ttlSeconds = 10): Promise<string | null> {
        const key = `pandora:lock:${lockName}`;
        const token = randomUUID();

        if (this.client && this.isReady) {
            const result = await this.client.set(key, token, 'EX', ttlSeconds, 'NX');
            return result === 'OK' ? token : null;
        }

        this.cleanExpired(key);
        if (this.fallbackStore.has(key)) {
            return null;
        }

        this.fallbackStore.set(key, {
            value: token,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
        return token;
    }

    async releaseLock(lockName: string, token: string): Promise<void> {
        const key = `pandora:lock:${lockName}`;

        if (this.client && this.isReady) {
            const luaScript = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;
            await this.client.eval(luaScript, 1, key, token);
            return;
        }

        this.cleanExpired(key);
        const entry = this.fallbackStore.get(key);
        if (entry && entry.value === token) {
            this.fallbackStore.delete(key);
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit().catch(() => undefined);
            this.client = null;
            this.isReady = false;
        }
        this.fallbackStore.clear();
    }
}

