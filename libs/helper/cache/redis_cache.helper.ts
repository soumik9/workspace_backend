// app/modules/shared/cache/providers/redis.provider.ts
import Redis from "ioredis";
import httpStatus from "http-status";
import { ApiError, config, errorLogger } from "../../../config";
import { ICacheEntry, ICacheProvider } from "./local_cache.helper";

export class RedisCacheProvider implements ICacheProvider {
    private client: Redis;

    constructor() {
        // Initialize with AWS ElastiCache or standard Redis URI
        this.client = new Redis(config.CACHE.REDIS_URI as string);

        this.client.on("error", (err: Error) => {
            errorLogger.error("Redis Cache Error:", err);
        });
    }

    private getNamespace() {
        return `${config.CACHE.PREFIX}_${process.env.NODE_ENV}:`;
    }

    public async set(entries: ICacheEntry[], defaultTtl: number = 604800): Promise<void> {
        try {
            // Using pipeline for optimal performance during bulk inserts
            const pipeline = this.client.pipeline();

            entries.forEach(({ key, value, ttl }) => {
                const namespacedKey = `${this.getNamespace()}${key}`;
                const stringValue = JSON.stringify(value);
                const expiry = ttl ?? defaultTtl;

                pipeline.set(namespacedKey, stringValue, "EX", expiry);
            });

            await pipeline.exec();
        } catch (error) {
            errorLogger.error("Redis Cache: Failed to set keys", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Redis: Error setting values");
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        try {
            const namespacedKey = `${this.getNamespace()}${key}`;
            const data = await this.client.get(namespacedKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            errorLogger.error(`Redis Cache: Error getting key ${key}`, error);
            return null;
        }
    }

    public async remove(keys: string[]): Promise<void> {
        if (!keys.length) return;
        const namespaced = keys.map((k) => `${this.getNamespace()}${k}`);
        await this.client.del(...namespaced);
    }

    public async invalidate(patterns: string | string[]): Promise<void> {
        const namespace = this.getNamespace();
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];

        for (const pattern of patternArray) {
            // WARNING: KEYS command is blocking. For production, consider using SCAN.
            // Keeping it simple here for pattern matching requirement.
            const keys = await this.client.keys(`${namespace}${pattern}*`);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
    }

    public async clearAll(): Promise<void> {
        await this.client.flushdb();
    }

    public async getAll(): Promise<Record<string, any>> {
        // WARNING: Highly discouraged in production Redis environments.
        // Used here only to satisfy the interface requirements.
        const keys = await this.client.keys(`${this.getNamespace()}*`);
        const result: Record<string, any> = {};

        if (keys.length > 0) {
            const values = await this.client.mget(...keys);
            keys.forEach((key: string, index: number) => {
                result[key] = values[index] ? JSON.parse(values[index] as string) : null;
            });
        }

        return result;
    }
}