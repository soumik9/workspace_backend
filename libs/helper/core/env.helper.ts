import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { ServerEnvironmentEnum } from "../../enum";

/**
 * @class EnvService
 * Handles loading and validating environment variables based on NODE_ENV
 */
class EnvService {
    private static instance: EnvService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): EnvService {
        if (!EnvService.instance) {
            EnvService.instance = new EnvService();
        }
        return EnvService.instance;
    }

    /** ───────────────────────────────
     * Load environment variables from .env files
     * ─────────────────────────────── */
    public load(): void {
        const defaultEnvPath = path.join(process.cwd(), ".env");
        if (fs.existsSync(defaultEnvPath)) {
            dotenv.config({ path: defaultEnvPath });
            console.log("Loaded default environment configuration from .env");
        }

        const NODE_ENV = process.env.NODE_ENV || ServerEnvironmentEnum.Development;

        const envFiles: Record<string, string> = {
            production: ".env.production",
            staging: ".env.staging",
            development: ".env.local",
            test: ".env.test",
        };

        const envFile = envFiles[NODE_ENV] || ".env.local";
        const envPath = path.join(process.cwd(), envFile);

        if (!fs.existsSync(envPath)) {
            if (fs.existsSync(defaultEnvPath)) {
                console.warn(`Environment file ${envFile} not found, using default .env file`);
            } else {
                console.warn(`No environment files found. Using process.env values only.`);
            }
        } else {
            dotenv.config({ path: envPath });
            console.log(`Loaded environment configuration from ${envFile}`);
        }
    }

    /** ───────────────────────────────
     * Validate environment variables using a Zod schema
     * @param schema Zod schema to validate process.env
     * @returns validated environment object
     * ─────────────────────────────── */
    public validate(schema: any): any {
        const parsed = schema.safeParse(process.env);
        if (!parsed.success) {
            const errorMessage = parsed.error.issues
                .map((issue: any) => `${issue.path.join(".")} - ${issue.message}`)
                .join(", ");
            throw new Error(`Invalid environment variables: ${errorMessage}`);
        }

        return parsed.data;
    }
}

/** Singleton export */
export const EnvInstance = EnvService.getInstance();
