// home.controller.ts
import httpStatus from "http-status";
import { Request, Response } from "express";
import { ResponseInstance, } from "../../../../libs/helper/core";

class CoreService {
    private static instance: CoreService;

    private constructor() { }

    public static getInstance(): CoreService {
        if (!CoreService.instance) {
            CoreService.instance = new CoreService();
        }
        return CoreService.instance;
    }

    /**
     * GET /
     */
    public welcome(req: Request, res: Response) {
        ResponseInstance.success(res, {
            statusCode: httpStatus.OK,
            success: true,
            message: "Welcome to the API",
        });
    }

    /**
     * Not Found Handler
     */
    public notFound(req: Request, res: Response) {
        ResponseInstance.error(res, {
            statusCode: httpStatus.NOT_FOUND,
            message: "Not Found",
            errorMessages: [],
        });
    }
}

// Export singleton
export const CoreServiceInstance = CoreService.getInstance();
