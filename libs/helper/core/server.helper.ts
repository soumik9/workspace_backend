// services/ServerUtility.service.ts
import os from "os";
import path from "path";
import moment from "moment";
import { Application, Request } from "express";
import { DatabaseInstance } from "../../../config";

class ServerUtilityService {
    private static instance: ServerUtilityService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ServerUtilityService {
        if (!ServerUtilityService.instance) {
            ServerUtilityService.instance = new ServerUtilityService();
        }
        return ServerUtilityService.instance;
    }

    /** Get full request URL */
    public url(req: Request): string {
        return `${req.protocol}://${req.get("host")}${req.originalUrl}`;
    }

    /** Get base request URL */
    public baseUrl(req: Request): string {
        return `${req.protocol}://${req.get("host")}`;
    }

    /** Get application root path */
    public rootPath(): string {
        return process.cwd();
    }

    /** Get absolute file path from relative path */
    public getLocalFilePath(relativePath: string): string {
        const normalizedPath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
        return path.join(this.rootPath(), normalizedPath);
    }

    /** Get server health metrics */
    public async getHealth(app: Application) {
        const uptimeInSeconds = Math.floor(process.uptime());
        const formatTime = (value: number) => String(value).padStart(2, "0");

        const uptimeFormatted = (() => {
            const hours = Math.floor(uptimeInSeconds / 3600);
            const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
            const seconds = uptimeInSeconds % 60;
            return `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
        })();

        const memoryUsage = process.memoryUsage();
        const rssMB = (memoryUsage.rss / 1024 / 1024).toFixed(1);
        const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
        const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(1);

        const loadAverages = os.loadavg().map((n) => n.toFixed(2)).join(" / ");

        const dbInfo = await DatabaseInstance.getInfo("healthcheck");
        const isReady = app.locals.ready === true;

        return {
            uptime: uptimeFormatted,
            timestampUtc: moment().utc().format("YYYY-MM-DD HH:mm:ss"),
            processId: process.pid,
            environment: process.env.NODE_ENV || "development",
            nodeVersion: process.version,
            rssMB,
            heapUsedMB,
            heapTotalMB,
            loadAverages,
            platform: `${os.platform()} ${os.release()} (${os.arch()})`,
            cpuCores: os.cpus().length,
            isReady,
            statusText: isReady ? "Ready" : "Not Ready",
            statusColor: isReady ? "#16a34a" : "#dc2626",
            isDbConnected: dbInfo.state === "connected",
        };
    }
}

// Export singleton instance
export const ServerUtilityInstance = ServerUtilityService.getInstance();