// server.bootstrap.ts
import { Server } from "http";
import { Application } from "express";
import { errorLogger, infoLogger } from "../logger";
import { config, DatabaseInstance, ShutdownInstance } from ".";

class ServerBootstrap {
    private static instance: ServerBootstrap;
    private server?: Server;

    private constructor() { }

    public static getInstance(): ServerBootstrap {
        if (!ServerBootstrap.instance) {
            ServerBootstrap.instance = new ServerBootstrap();
        }
        return ServerBootstrap.instance;
    }

    /**
     * Bootstrap the server: connect DB, start server, register handlers
     */
    public async bootstrap(app: Application): Promise<Server> {
        app.locals.ready = false;

        try {
            await DatabaseInstance.connect();
            this.server = await this.startServer(app);
            ShutdownInstance.register(this.server);

            app.locals.ready = true;
            return this.server;
        } catch (error) {
            errorLogger.error(
                `Failed to bootstrap application: ${error instanceof Error ? error.message : String(error)
                }`
            );
            process.exit(1);
        }
    }

    /**
     * Returns server instance if it exists
     */
    public getServer(): Server | undefined {
        return this.server;
    }

    /**
     * Private method: actually start Express server
     */
    private startServer(app: Application): Promise<Server> {
        return new Promise((resolve) => {
            const server = app.listen(config.PORT, () => {
                infoLogger.info(`Server running at: ${config.URL.BASE}`);
                resolve(server);
            });
        });
    }
}

// Ready-to-use singleton
export const ServerBootstrapInstance = ServerBootstrap.getInstance();
