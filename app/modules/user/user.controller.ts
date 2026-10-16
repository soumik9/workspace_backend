// user.controller.ts
import httpStatus from "http-status";
import { Request, RequestHandler, Response } from "express";
import { UserService } from "./user.service";
import { ResponseInstance } from "../../../libs/helper/core";
import { SecurityInstance } from "../../../libs/helper";
import { ApiError } from "../../../config";
import { IUserResponse } from "./user.interface";
import { UserDtoResponse } from "./user.dto";

export class UserController {
    constructor(
        private readonly service: UserService,
    ) { }

    // @controller: register
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

    // @controller: login
    public readonly login: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const { email, password } = req.body;
            const user = await this.service.findOrThrow({
                query: { email },
                filterWithDto: false
            });

            // checking is valid password
            const isMatched = user && await SecurityInstance.compareHash(password, String(user.password));
            if (!isMatched)
                throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials!');

            // generating token
            const token = SecurityInstance.generateToken({
                ...(user.email ? { email: user.email } : {}),
                _id: String(user._id),
                role: user.role
            }, false);

            ResponseInstance.success<IUserResponse & { access_token: string }>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Login Success!',
                data: {
                    access_token: token as string,
                    ...(new UserDtoResponse(user)),
                },
            });
        }
    );

    // @controller: profile
    public readonly getProfile: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const result = await this.service.findOrThrow({
                query: {
                    _id: req.entity?._id
                },
                isItemShouldExist: true,
                filterWithDto: true,
            });

            ResponseInstance.success<IUserResponse>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: 'Profile retrieved successfully!',
                data: result,
            });
        }
    );
}