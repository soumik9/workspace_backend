import { config } from "../../../config";
import { ServerEnvironmentEnum } from "../../enum";
import { IApiReponse, IErrorResponse } from "../../../app/modules/shared";
import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * @class ApiResponseService
 * Centralized service for handling API responses and async errors.
 */
class ResponseService {
    private static instance: ResponseService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ResponseService {
        if (!ResponseService.instance) {
            ResponseService.instance = new ResponseService();
        }
        return ResponseService.instance;
    }

    /** ───────────────────────────────
     *  Catch async errors in routes
     *  ─────────────────────────────── */
    public catchAsync(fn: RequestHandler): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            try {
                await fn(req, res, next);
            } catch (error) {
                next(error);
            }
        };
    }

    /** ───────────────────────────────
     *  Send standardized success response
     *  ─────────────────────────────── */
    public success<T>(res: Response, data: IApiReponse<T>): void {
        const responseData = {
            status_code: data.statusCode,
            success: true,
            message: data.message ?? null,
            meta: data.meta ?? null,
            data: data.data ?? null,
        };

        res.status(data.statusCode).json(responseData);
    }

    /** ───────────────────────────────
     *  Send standardized error response
     *  ─────────────────────────────── */
    public error(res: Response, data: IErrorResponse): void {
        const responseData = {
            status_code: data.statusCode,
            success: false,
            message: data.message ?? "Something went wrong!",
            error_messages: data.errorMessages ?? [],
            stack: config.ENV !== ServerEnvironmentEnum.Production ? data.error?.stack ?? null : undefined,
            path: data.path ?? "",
        };

        res.status(data.statusCode).json(responseData);
    }
}

/** Singleton export */
export const ResponseInstance = ResponseService.getInstance();
