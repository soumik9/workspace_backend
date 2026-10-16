import mongoose from "mongoose";
import { ZodError } from "zod";
import { config } from "../server";
import { errorLogger } from "../logger";
import { IErrorMessage, IErrorResponse, IGenericErrorMessage, IGenericErrorResponse } from "../../app/modules/shared";

/** Custom API Error Class */
export class ApiError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message?: string, stack?: string) {
        super(message);
        this.statusCode = statusCode;

        if (stack) this.stack = stack;
        else Error.captureStackTrace(this, this.constructor);
    }
}

/** Centralized Error Handling Service */
class ErrorHandlerService {
    private static instance: ErrorHandlerService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): ErrorHandlerService {
        if (!ErrorHandlerService.instance) {
            ErrorHandlerService.instance = new ErrorHandlerService();
        }
        return ErrorHandlerService.instance;
    }

    /** Handle Mongoose CastError (invalid ObjectId) */
    public cast(error: mongoose.Error.CastError): IErrorResponse {
        const errors: IErrorMessage[] = [
            { path: error.path, message: 'Passed id is invalid!' },
        ];

        return {
            statusCode: 400,
            message: 'Cast Error occurs!',
            errorMessages: errors,
        };
    }

    /** Handle Mongoose ValidationError */
    public validation(error: mongoose.Error.ValidationError): IErrorResponse {
        const errors: IErrorMessage[] = Object.values(error.errors).map(
            (el: mongoose.Error.ValidatorError | mongoose.Error.CastError) => ({
                path: el.path,
                message: el.message,
            })
        );

        return {
            statusCode: 400,
            message: errors[0]?.message || 'Validation Error',
            errorMessages: errors,
        };
    }

    /** Handle Zod validation errors */
    public zod(error: ZodError): IGenericErrorResponse {
        const errors: IGenericErrorMessage[] = error.issues.map(issue => ({
            path: issue.path.length > 0 ? issue.path.join('.') : '',
            message: issue.message,
        }));

        return {
            statusCode: 400,
            message: errors[0]?.message || 'Validation Error',
            errorMessages: errors,
        };
    }

    /** Handle uncaught process errors */
    public process(errorType: string): (error: Error | any) => void {
        return (error: Error | any) => {
            errorLogger.error(
                `${errorType}: ${error instanceof Error ? error.stack || error.message : String(error)}`
            );

            // Only exit process in production
            if (config.ENV === 'production') {
                process.exit(1);
            }
        };
    }
}

/** Singleton instance */
export const ErrorHandlerInstance = ErrorHandlerService.getInstance();
