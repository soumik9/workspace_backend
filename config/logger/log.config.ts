import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { ServerEnvironmentEnum } from "../../libs/enum";

type LogLevel = "error" | "warn" | "info" | "http" | "verbose" | "debug" | "silly";

export class LoggerService {
    private static instance: LoggerService;
    private loggers: Map<string, winston.Logger> = new Map();

    private environment = process.env.NODE_ENV || "development";
    private logDirectory = path.join(process.cwd(), "logs");

    private redactKeys = [
        "password", "pass", "token", "authorization",
        "apikey", "x-api-key", "secret", "client_secret"
    ];

    private rawLevel = Symbol.for("level");
    private colorizer = winston.format.colorize();

    private constructor() {
        this.ensureLogDir();
        this.applyColorScheme();
    }

    // Singleton getter
    public static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private ensureLogDir() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory);
        }
    }

    private applyColorScheme() {
        winston.addColors({
            error: "red",
            warn: "yellow",
            info: "green",
            http: "cyan",
            verbose: "blue",
            debug: "magenta",
            silly: "gray",
        });
    }

    // Timestamp format
    private timestampFormat = winston.format.timestamp({
        format: () => new Date().toISOString(),
    });

    // Add stack traces in dev mode
    private errorsWithStack = winston.format.errors({
        stack: this.environment === ServerEnvironmentEnum.Development,
    });

    // Redaction
    private redact = winston.format((info) => {
        const mask = (value: any): any => {
            if (!value || typeof value !== "object") return value;
            if (Array.isArray(value)) return value.map(mask);

            const result: Record<string, any> = {};
            for (const [k, val] of Object.entries(value)) {
                result[k] = this.redactKeys.includes(k.toLowerCase())
                    ? "[REDACTED]"
                    : mask(val);
            }
            return result;
        };

        if (typeof info.message === "object") {
            info.message = mask(info.message);
        }

        const { message, level, timestamp, stack, ...rest } = info;
        const safeMeta = mask(rest);

        return { message, level, timestamp, stack, ...safeMeta };
    });

    // Console formatter
    private consoleFormat = winston.format.printf((info: any) => {
        const raw = (info[this.rawLevel] || info.level) as string;
        const label = this.colorizer.colorize(raw, raw.toUpperCase());

        const msg = typeof info.message === "object"
            ? JSON.stringify(info.message)
            : String(info.message);

        const meta = info.env || info.logger
            ? ` | META: ${JSON.stringify({ env: info.env, logger: info.logger })}`
            : "";

        const stack = info.stack ? `\nSTACK: ${info.stack}` : "";

        return `[${label}] ${info.timestamp} | ${msg}${meta}${stack}`;
    });

    private consoleTransport(level: LogLevel) {
        return new winston.transports.Console({
            level,
            format: winston.format.combine(
                this.timestampFormat,
                this.errorsWithStack,
                winston.format.splat(),
                this.redact(),
                this.consoleFormat
            ),
        });
    }

    private rotatingFileTransport(baseName: string, level: LogLevel) {
        const dir = path.join(this.logDirectory, baseName);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        return new DailyRotateFile({
            level,
            dirname: dir,
            filename: `%DATE%-${baseName}.log`,
            datePattern: "DD-MM-YYYY",
            zippedArchive: true,
            maxSize: "50m",
            maxFiles: "30d",
            auditFile: path.join(dir, `.audit-${baseName}.json`),
            createSymlink: true,
            symlinkName: `${baseName}.log`,
            format: winston.format.combine(
                this.timestampFormat,
                this.errorsWithStack,
                winston.format.splat(),
                this.redact(),
                this.consoleFormat
            ),
        });
    }

    // **Main API** — registry-based logger fetcher
    public getLogger(name: string, level: LogLevel = "info"): winston.Logger {
        if (this.loggers.has(name)) {
            return this.loggers.get(name)!;
        }

        const logger = winston.createLogger({
            level,
            levels: winston.config.npm.levels,
            defaultMeta: {
                env: this.environment,
                logger: name,
            },
            transports: [
                this.consoleTransport(level),
                this.rotatingFileTransport(name, level),
            ],
            exitOnError: false,
        });

        this.loggers.set(name, logger);
        return logger;
    }
}

const LoggerInstance = LoggerService.getInstance();

export const infoLogger = LoggerInstance.getLogger("combined", "info");
export const httpLogger = LoggerInstance.getLogger("http", "http");
export const errorLogger = LoggerInstance.getLogger("error", "error");

// module specific loggers can be created as needed
// const userLogger = LoggerInstance.getLogger("user-module", "debug");