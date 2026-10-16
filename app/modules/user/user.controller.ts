// user.controller.ts
import httpStatus from "http-status";
import { Request, RequestHandler, Response } from "express";
import { UserService } from "./user.service";
import { ResponseInstance } from "../../../libs/helper/core";

export class UserController {
    constructor(
        private readonly service: UserService,
    ) { }

    // create controller
    public readonly register: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const body = req.body;
            await this.service.findOrThrow({
                query: { email: body.email },
                isConflicted: true,
                conflictMessage: "You are already registered!",
            });

            // create user
            const result = await this.service.createOne({
                data: {
                    ...body,
                },
                filterWithDto: true,
            });

            ResponseInstance.success<any>(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                message: "User created successfully!",
                data: result,
            });
        }
    );






}