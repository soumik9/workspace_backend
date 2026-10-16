// database.service.ts
import { config } from "./config.server";
import mongoose, { Connection } from "mongoose";
import { errorLogger, infoLogger } from "../logger/log.config";

class DatabaseService {
    private static instance: DatabaseService;
    private connection?: Connection;

    private constructor() { }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    /**
     * Connect to MongoDB using Mongoose
     */
    public async connect(): Promise<Connection> {
        if (this.connection && this.connection.readyState === 1) {
            infoLogger.info("MongoDB already connected");
            return this.connection;
        }

        const uri = `${config.DATABASE.MONGO_URI}/${config.DATABASE.NAME}`;
        try {
            await mongoose.connect(uri, { writeConcern: { w: "majority" } });
            this.connection = mongoose.connection;

            // Setup event listeners
            this.connection.on("error", (err) => errorLogger.error(`MongoDB connection error: ${err}`));
            this.connection.on("disconnected", () => infoLogger.warn(`MongoDB disconnected: ${config.DATABASE.NAME}`));
            this.connection.on("reconnected", () => infoLogger.info(`MongoDB reconnected: ${config.DATABASE.NAME}`));

            infoLogger.info(`Connected to MongoDB: ${config.DATABASE.NAME}`);
            return this.connection;
        } catch (error) {
            errorLogger.error(`Database connection failed: ${error instanceof Error ? error.message : "unknown"}`);
            throw error;
        }
    }

    /**
     * Disconnect from MongoDB gracefully
     */
    public async disconnect(): Promise<void> {
        try {
            if (this.connection?.readyState === 1) {
                await this.connection.close();
                infoLogger.info("MongoDB connection closed gracefully");
            } else {
                infoLogger.info("No active MongoDB connection to close");
            }
        } catch (error) {
            errorLogger.error(`Error closing database connection: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    /**
     * Get current connection state as a string
     */
    public getConnectionState(): string {
        const states: Record<number, string> = {
            0: "disconnected",
            1: "connected",
            2: "connecting",
            3: "disconnecting",
            99: "uninitialized"
        };
        return states[mongoose.connection.readyState] || "unknown";
    }

    /**
     * Get database info
     */
    public getInfo(username = ""): Record<string, any> {
        const connection = mongoose.connection;
        return {
            state: this.getConnectionState(),
            database: connection.db?.databaseName || config.DATABASE.NAME,
            host: connection.host || "N/A",
            collections: Object.keys(connection.collections).length,
            models: Object.keys(mongoose.models).length,
            user: username,
            timestamp: new Date().toISOString()
        };
    }
}

// Ready-to-use singleton
export const DatabaseInstance = DatabaseService.getInstance();
