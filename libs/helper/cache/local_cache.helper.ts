import NodeCache from "node-cache";
import httpStatus from "http-status";
import { CacheTimeEnum } from "../../enum";
import { ApiError, config, errorLogger } from "../../../config";

export interface ICacheEntry {
    key: string;
    value: any;
    ttl?: number;
}

export interface ICacheProvider {
    set(entries: ICacheEntry[], defaultTtl?: number): Promise<void>;
    get<T>(key: string): Promise<T | null>;
    remove(keys: string[]): Promise<void>;
    invalidate(patterns: string | string[]): Promise<void>;
    clearAll(): Promise<void>;
    getAll(): Promise<Record<string, any>>;
}

export class LocalCacheProvider implements ICacheProvider {
    private cache: NodeCache;

    constructor() {
        this.cache = new NodeCache({
            stdTTL: 0,
            checkperiod: 120,
            useClones: false,
        });
    }

    private getNamespace() {
        return `${config.CACHE.PREFIX}_${process.env.NODE_ENV}:`;
    }

    public async set(entries: ICacheEntry[], defaultTtl: number = CacheTimeEnum.OneWeek): Promise<void> {
        try {
            entries.forEach(({ key, value, ttl }) => {
                const namespacedKey = `${this.getNamespace()}${key}`;
                this.cache.set(namespacedKey, value, ttl ?? defaultTtl);
            });
        } catch (error) {
            errorLogger.error("Local Cache: Failed to set keys", error);
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Local Cache: Error setting values");
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        const namespacedKey = `${this.getNamespace()}${key}`;
        return this.cache.get<T>(namespacedKey) ?? null;
    }

    public async remove(keys: string[]): Promise<void> {
        const namespaced = keys.map((k) => `${this.getNamespace()}${k}`);
        this.cache.del(namespaced);
    }

    public async invalidate(patterns: string | string[]): Promise<void> {
        const namespace = this.getNamespace();
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];
        const allKeys = this.cache.keys();
        const toDelete: string[] = [];

        patternArray.forEach((pattern) => {
            const targetPrefix = namespace + pattern;
            allKeys.forEach((key) => {
                if (key.startsWith(targetPrefix)) {
                    toDelete.push(key);
                }
            });
        });

        if (toDelete.length) this.cache.del(toDelete);
    }

    public async clearAll(): Promise<void> {
        this.cache.flushAll();
    }

    public async getAll(): Promise<Record<string, any>> {
        const result: Record<string, any> = {};
        const keys = this.cache.keys();
        keys.forEach((key) => {
            result[key] = this.cache.get(key);
        });
        return result;
    }
}