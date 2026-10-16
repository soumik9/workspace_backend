import { config } from "../../../config";
import { RedisCacheProvider } from "./redis_cache.helper";
import { ICacheProvider, LocalCacheProvider } from "./local_cache.helper";


class CacheManager {
    private static instance: CacheManager;
    public provider: ICacheProvider;

    private constructor() {
        // Decide provider based on environment variable
        const driver = process.env.CACHE_DRIVER || 'local';

        switch (driver.toLowerCase()) {
            case 'redis':
                this.provider = new RedisCacheProvider();
                break;
            case 'local':
            default:
                this.provider = new LocalCacheProvider();
                break;
        }
    }

    // Singleton wrapper for the manager
    public static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }
        return CacheManager.instance;
    }
}

// Export the selected provider instance directly for ease of use
export const CacheService = CacheManager.getInstance().provider;