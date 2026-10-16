import httpStatus from "http-status";
import { ResponseInstance } from "./core.helper";
import { NextFunction, Request, Response } from "express";
import { errorLogger, infoLogger } from "../../../config";

export interface IParsedQuery {
    page: number;
    limit: number;
    [key: string]: string | number | null;
}

class ParserService {
    private static instance: ParserService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ParserService {
        if (!ParserService.instance) {
            ParserService.instance = new ParserService();
        }
        return ParserService.instance;
    }

    // Parse query 
    public query(query: Record<string, any>): IParsedQuery {
        // Default pagination
        const page = query.page ? parseInt(query.page as string, 10) : 1;
        const limit = query.limit ? parseInt(query.limit as string, 10) : 999999;

        // Optional string keys that should always be string
        const stringKeys = ["workspace_id", "user_id", "search"];
        const extra: Record<string, string> = {};

        stringKeys.forEach((key) => {
            extra[key] = query[key] ? query[key].toString() : "";
        });

        return {
            page,
            limit,
            ...extra,
        };
    }

    // NEW: parsebody
    public body = (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.body && typeof req.body.data === "string") {
                if (req.body.data.length > 5_000_000) {
                    ResponseInstance.error(res, {
                        statusCode: httpStatus.REQUEST_ENTITY_TOO_LARGE,
                        message: "Request data too large",
                        errorMessages: [
                            {
                                path: "",
                                message: "Request data too large",
                            },
                        ],
                        error: null,
                        path: req.originalUrl || "",
                    });
                    return;
                }

                const parsedData = JSON.parse(req.body.data);

                req.body = { ...req.body, ...parsedData };
                infoLogger.info(
                    `URL: ${req.originalUrl}, multipart data parsed`
                );

                delete req.body.data;
            }

            next();
        } catch (error) {
            const err = error as Error;

            if (err instanceof SyntaxError) {
                ResponseInstance.error(res, {
                    statusCode: httpStatus.BAD_REQUEST,
                    message: "Invalid JSON format",
                    errorMessages: [
                        {
                            path: "",
                            message: "Invalid JSON format",
                        },
                    ],
                    error: null,
                    path: req.originalUrl || "",
                });
                return;
            }

            errorLogger.error("Middleware Error:", {
                message: err.message,
                stack: err.stack,
                path: req.path,
                method: req.method,
            });

            ResponseInstance.error(res, {
                statusCode: httpStatus.INTERNAL_SERVER_ERROR,
                message: "Server error processing request",
                errorMessages: [
                    {
                        path: "",
                        message: "Server error processing request",
                    },
                ],
                error: null,
                path: req.originalUrl || "",
            });
        }
    };
}

// Export singleton instance
export const ParserInstance = ParserService.getInstance();
