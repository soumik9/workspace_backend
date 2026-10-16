export type IGenericErrorMessage = {
    path: string | number;
    message: string;
};

export type IGenericErrorResponse = {
    statusCode: number;
    message: string;
    errorMessages: IGenericErrorMessage[];
};

export type IErrorMessage = {
    path: string | number;
    message: string;
};

export type IErrorResponse = {
    statusCode: number;
    message: string;
    errorMessages: IErrorMessage[];
    stack?: string;
    path?: string;
    error?: Error | null;
};