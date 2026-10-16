import z from "zod";
import httpStatus from "http-status";
import { ApiError, errorLogger } from "../../../config";
import { NextFunction, Request, Response } from "express";

class ZodService {
    private static instance: ZodService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ZodService {
        if (!ZodService.instance) {
            ZodService.instance = new ZodService();
        }
        return ZodService.instance;
    }

    //  Preprocess value with default
    public preprocess(defaultValue: any, schema: any) {
        return z.preprocess((value) => value === undefined ? defaultValue : value, schema);
    }


    //  Validate payload against schema
    public validateSchema<T>(schema: any, payload: unknown): T {
        const result = schema.safeParse(payload);

        if (!result.success) {
            const message = result.error.issues
                .map((issue: any) => issue.message)
                .join(", ");
            throw new ApiError(httpStatus.BAD_REQUEST, message);
        }

        return result.data as T;
    }

    /** Express middleware for validating request */
    public validateRequest(schema: any) {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                if (!schema) {
                    errorLogger.error(`Zod Schema is undefined: ${req.originalUrl}`);
                    return next(new Error("Validation schema is undefined"));
                }

                const parsed = await schema.parseAsync({
                    body: req.body,
                    query: req.query,
                    params: req.params,
                    cookies: req.cookies,
                });

                if (parsed.body !== undefined) req.body = parsed.body;
                // Express 5 exposes query as a getter; replace it on this request.
                if (parsed.query !== undefined) {
                    Object.defineProperty(req, "query", { value: parsed.query, writable: true, configurable: true });
                }
                if (parsed.params !== undefined) req.params = parsed.params;
                next();
            } catch (error) {
                next(error);
            }
        };
    }
}

// Export singleton
export const ZodInstance = ZodService.getInstance();
