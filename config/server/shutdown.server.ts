// server.shutdown.ts
import { Server } from "http";
import { ErrorHandlerInstance } from "../errors";
import { DatabaseInstance } from "./database.server";
import { errorLogger, httpLogger, infoLogger } from "../logger";

export class ShutdownService {
    private static instance: ShutdownService;

    private constructor() { }

    public static getInstance(): ShutdownService {
        if (!ShutdownService.instance) {
            ShutdownService.instance = new ShutdownService();
        }
        return ShutdownService.instance;
    }

    /**
     * Register OS signals and process events for graceful shutdown
     */
    public register(server: Server) {
        const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
        signals.forEach((signal) => {
            process.on(signal, () => this.shutdown(server, signal));
        });

        process.on("uncaughtException", ErrorHandlerInstance.process("uncaughtException"));
        process.on("unhandledRejection", ErrorHandlerInstance.process("unhandledRejection"));
    }

    /**
     * Graceful shutdown handler
     */
    private async shutdown(server: Server, signal: string) {
        infoLogger.info(`${signal} received, starting graceful shutdown`);

        // Force exit timeout
        const forceExit = setTimeout(() => {
            errorLogger.error("Forced exit due to graceful shutdown timeout");
            process.exit(1);
        }, 30000);

        try {
            // Close HTTP server
            if (server) {
                await new Promise<void>((resolve) => server.close(() => resolve()));
                infoLogger.info("HTTP server closed");
            }

            // Close database connection
            await DatabaseInstance.disconnect();

            // Optional: close Redis if exists
            // if (redis) {
            //     await redis.quit();
            //     infoLogger.info("Redis connection closed successfully");
            // }

            clearTimeout(forceExit);
            infoLogger.info("Graceful shutdown completed");

            [infoLogger, httpLogger, errorLogger].forEach((logger) => logger.close());
            process.exit(0);
        } catch (error) {
            errorLogger.error(`Error during graceful shutdown: ${error instanceof Error ? error.message : String(error)}`);
            clearTimeout(forceExit);
            process.exit(1);
        }
    }
}

// Ready-to-use singleton
export const ShutdownInstance = ShutdownService.getInstance();
