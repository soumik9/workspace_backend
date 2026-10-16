import cors from "cors";
import moment from "moment";
import helmet from "helmet";
import passport from "passport";
import { ParserInstance } from "../../libs/helper/core/parse.helper";
import express, { Application, NextFunction, Request, Response } from "express";
import { config, httpLogger, errorLogger, MulterUploadInstance, FileCompressorInstance, passportInit, } from "../../config";

class ServerMiddlewareService {
    private static instance: ServerMiddlewareService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ServerMiddlewareService {
        if (!ServerMiddlewareService.instance) {
            ServerMiddlewareService.instance = new ServerMiddlewareService();
        }
        return ServerMiddlewareService.instance;
    }

    // Core public method to register all global middlewares
    public register(app: Application) {
        app.use(express.json());
        app.use(cors());
        app.use(express.urlencoded({ extended: true }));

        app.use(
            helmet({
                crossOriginResourcePolicy: { policy: "cross-origin" },
            })
        );

        app.use(async (req: Request, res: Response, next: NextFunction) => {
            try {
                if (req.files && Object.keys(req.files).length > 0) {
                    await FileCompressorInstance.handle(req.files as any);
                }
                next();
            } catch (err) {
                errorLogger.error(
                    `Global file compression error: ${err instanceof Error ? err.message : String(err)
                    }`
                );
                next(err);
            }
        });

        app.use(
            MulterUploadInstance.getUploader().fields([
                { name: "single", maxCount: 1 },
                { name: "multiple", maxCount: 10 },
            ])
        );

        app.use(this.handleRequestLog);
        app.use(ParserInstance.body);

        passportInit();
        app.use(passport.initialize());
    }

    // Logging Middleware
    private handleRequestLog = (req: Request, res: Response, next: NextFunction) => {
        const { method } = req;
        const startTime = moment();

        res.on("finish", () => {
            const endTime = moment();
            const duration = moment.duration(endTime.diff(startTime)).asMilliseconds();
            const message = `${method} ${config.URL.BASE + req.originalUrl} ${res.statusCode} - ${duration}ms | ${req.ip}`;
            httpLogger.http(message);
        });
        next();
    };
}

// Export singleton
export const ServerMiddlewareInstance = ServerMiddlewareService.getInstance();
