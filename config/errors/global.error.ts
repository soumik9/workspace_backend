import { ZodError } from 'zod';
import { config } from '../server';
import httpStatus from 'http-status';
import { MulterError } from 'multer';
import { errorLogger } from '../logger';
import { ResponseInstance } from '../../libs/helper';
import { ServerEnvironmentEnum } from '../../libs/enum';
import { IErrorMessage } from '../../app/modules/shared';
import { ApiError, ErrorHandlerInstance } from './custom.error';
import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

type KnownErrors = 'ValidationError' | 'CastError' | 'TokenExpiredError' | 'JsonWebTokenError';

export class GlobalErrorService {
    private static instance: GlobalErrorService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): GlobalErrorService {
        if (!GlobalErrorService.instance) {
            GlobalErrorService.instance = new GlobalErrorService();
        }
        return GlobalErrorService.instance;
    }

    /** Express error handler middleware */
    public handler(): ErrorRequestHandler {
        return (error: any, req: Request, res: Response, next: NextFunction): any => {
            const { statusCode, message, errorMessages } = this.processError(error, req);

            // Log error in non-production
            if (config.ENV !== ServerEnvironmentEnum.Production) {
                errorLogger.error(`[ERROR] : ${error instanceof Error ? error.stack || error.message : error}`);
            }

            return ResponseInstance.error(res, {
                statusCode,
                message,
                errorMessages,
                error,
                path: req.originalUrl || '',
            });
        };
    }

    /** Process error and map to standardized format */
    private processError(error: any, req: Request) {
        let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Something went wrong';
        let errorMessages: IErrorMessage[] = [];

        // Known Mongoose / JWT errors
        const errorHandlers: Record<KnownErrors, () => void> = {
            ValidationError: () => {
                const result = ErrorHandlerInstance.validation(error);
                statusCode = result.statusCode;
                message = result.message;
                errorMessages = result.errorMessages;
            },
            CastError: () => {
                const result = ErrorHandlerInstance.cast(error);
                statusCode = result.statusCode;
                message = result.message;
                errorMessages = result.errorMessages;
            },
            TokenExpiredError: () => {
                statusCode = httpStatus.UNAUTHORIZED;
                message = 'Your session has expired. Please log in again.';
                errorMessages = [{ path: '', message: 'Session has expired' }];
            },
            JsonWebTokenError: () => {
                statusCode = httpStatus.BAD_REQUEST;
                message = 'Invalid authentication token';
                errorMessages = [{ path: '', message: 'Session has invalid request' }];
            },
        };

        if (error?.name && errorHandlers[error.name as KnownErrors]) {
            errorHandlers[error.name as KnownErrors]();
        } else if (error instanceof ZodError) {
            const result = ErrorHandlerInstance.zod(error);
            statusCode = result.statusCode;
            message = result.message;
            errorMessages = result.errorMessages;
        } else if (error instanceof MulterError) {
            statusCode = httpStatus.BAD_REQUEST;
            message = 'File upload error';
            errorMessages = [{ path: '', message: error.message || 'Error uploading file' }];
        } else if (error instanceof ApiError) {
            statusCode = error.statusCode;
            message = error.message;
            errorMessages = [{ path: '', message: error.message || 'API Error' }];
        } else if (error instanceof Error) {
            statusCode = httpStatus.INTERNAL_SERVER_ERROR;
            message = config.ENV === ServerEnvironmentEnum.Production
                ? 'An unexpected error occurred'
                : error.message;
            errorMessages = [{ path: '', message: error.message || 'Unknown error' }];
        }

        return { statusCode, message, errorMessages };
    }
}

/** Singleton instance for middleware usage */
export const GlobalErrorInstance = GlobalErrorService.getInstance();
