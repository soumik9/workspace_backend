import z from "zod";
import { ServerEnvironmentEnum } from "../../libs/enum";
import { EnvInstance } from "../../libs/helper/core/env.helper";

// Load env
EnvInstance.load();

const requiredString = (msg: string) => z.string().nonempty({ error: msg });
const requiredNumber = (msg: string) => z.string().nonempty({ error: msg }).transform((v) => Number(v));

// Define required environment variables
const EnvSchema = z.object({
    NODE_ENV: z.enum(Object.values(ServerEnvironmentEnum)).default(ServerEnvironmentEnum.Development),
    PORT: requiredString("PORT is required."),

    // Token
    TOKEN_SECRET: requiredString("Token secret is required."),
    TOKEN_SECRET_EXPIRES_IN: requiredString("Token secret expiration is required."),

    // Hashing
    BCRYPT_SALT_ROUND: requiredNumber("Bcrypt salt round is required."),

    // Database
    MONGODB_URI: requiredString("Mongo URI is required."),
    MONGODB_DATABASE_NAME: requiredString("MongoDB database name is required."),

    OPENAI_API_KEY: z.string().default(""),
    OPENAI_MODEL: z.string().nonempty().default("gpt-4.1-mini"),

    // URLs
    BASE_URL: requiredString("Base URL is required."),
});

// Validate environment variables
const parsedConfig = EnvInstance.validate(EnvSchema);

// Export the environment variables
export const config = {
    PORT: parsedConfig.PORT,
    ENV: parsedConfig.NODE_ENV || 'development',
    TOKEN: {
        SECRET: parsedConfig.TOKEN_SECRET,
        EXPIRES_IN: parsedConfig.TOKEN_SECRET_EXPIRES_IN,
    },
    BCRYPT: {
        SALT_ROUND: parsedConfig.BCRYPT_SALT_ROUND,
    },
    DATABASE: {
        MONGO_URI: parsedConfig.MONGODB_URI,
        NAME: parsedConfig.MONGODB_DATABASE_NAME,
    },

    AI: {
        KEY: parsedConfig.OPENAI_API_KEY,
        MODEL: parsedConfig.OPENAI_MODEL,
    },
    URL: {
        BASE: parsedConfig.BASE_URL,
    },
};
