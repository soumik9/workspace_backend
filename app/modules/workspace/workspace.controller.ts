// workspace.controller.ts
import httpStatus from "http-status";
import { Types } from "mongoose";
import { ApiError } from "../../../config";
import { WorkspaceItemType } from "../../../libs/enum";
import { WorkspaceService } from "./workspace.service";
import { Request, RequestHandler, Response } from "express";
import { ParserInstance, ResponseInstance } from "../../../libs/helper/core";
import { IWorkspaceResponse } from "./workspace.interface";

export class WorkspaceController {
    constructor(
        private readonly service: WorkspaceService,
    ) { }

    // get data with pagination & filter
    public readonly getFilteredPaginated: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const user = req.entity?._id;
            const { page, limit, search } = ParserInstance.query(req.query);
            const searchText = typeof search === "string" ? search.trim() : "";

            const result = await this.service.getFilteredPaginated({
                page,
                limit,
                query: {
                    user,
                    ...(searchText ? {
                        name: {
                            $regex: searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                            $options: "i"
                        }
                    } : {}),
                },
                populate: {
                    path: "user",
                    select: "name email"
                },
                filterWithDto: true,
            });

            ResponseInstance.success<IWorkspaceResponse[]>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Workspace items retrieved successfully!",
                meta: result.meta,
                data: result.data,
            });
        }
    );

    // get single data by id
    public readonly getSingle: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const user = req.entity?._id;
            const { workspace_id } = ParserInstance.query(req.query);

            const result = await this.service.findOrThrow({
                query: {
                    _id: workspace_id,
                    user,
                },
                isItemShouldExist: true,
                populate: {
                    path: "user",
                    select: "name email"
                },
                filterWithDto: true,
            });

            ResponseInstance.success<IWorkspaceResponse>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Workspace item retrieved successfully!",
                data: result,
            });
        }
    );

    // create controller
    public readonly createSingle: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const user = req.entity?._id;

            const body = req.body;
            const parent = body.parent ?? null;

            await this.service.findOrThrow({
                query: {
                    user,
                    parent,
                    name: body.name
                },
                isConflicted: true,
                conflictMessage: "An item with this name already exists in this folder!",
            });

            const result = await this.service.createOne({
                data: {
                    name: body.name,
                    type: body.type,
                    parent,
                    user,
                    ...(body.type === WorkspaceItemType.File ? { content: body.content ?? "" } : {}),
                },
                populate: {
                    path: "user",
                    select: "name email"
                },
                filterWithDto: true,
            });

            ResponseInstance.success<any>(res, {
                statusCode: httpStatus.CREATED,
                success: true,
                message: "Workspace item created successfully!",
                data: result,
            });
        }
    );

    // update controller
    public readonly updateSingle: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const body = req.body ?? {};
            const user = req.entity?._id;
            const { workspace_id } = ParserInstance.query(req.query);
            if (typeof workspace_id !== "string" || !Types.ObjectId.isValid(workspace_id)) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Workspace ID is invalid!");
            }

            const workspace = await this.service.findOrThrow({
                query: { _id: workspace_id, user },
                isItemShouldExist: true,
            });
            if (body.content !== undefined && workspace.type !== WorkspaceItemType.File) {
                throw new ApiError(httpStatus.BAD_REQUEST, "Content is allowed for files only!");
            }
            if (body.name !== undefined) {
                await this.service.findOrThrow({
                    query: {
                        _id: { $ne: workspace_id },
                        user,
                        parent: workspace.parent,
                        name: body.name,
                    },
                    isConflicted: true,
                    conflictMessage: "An item with this name already exists in this folder!",
                });
            }

            const result = await this.service.updateOne({
                query: {
                    _id: workspace_id,
                    user
                },
                data: {
                    ...(body.name !== undefined ? { name: body.name } : {}),
                    ...(body.content !== undefined ? { content: body.content } : {}),
                },
                populate: "user",
                filterWithDto: true,
            });

            ResponseInstance.success<any>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Workspace item updated successfully!",
                data: result,
            });
        }
    );

    // delete controller
    public readonly deleteSingle: RequestHandler = ResponseInstance.catchAsync(
        async (req: Request, res: Response) => {

            const user = req.entity?._id;
            const { workspace_id } = ParserInstance.query(req.query);

            await this.service.findOrThrow({
                query: {
                    _id: workspace_id,
                    user
                },
                isItemShouldExist: true,
            });

            const ids = await this.service.getItemWithParentIds({
                workspace_id: String(workspace_id),
                user_id: String(user)
            })

            await this.service.deleteMany({
                user,
                _id: { $in: [...ids] }
            });

            ResponseInstance.success<{
                deleted_item_id: string
            }>(res, {
                statusCode: httpStatus.OK,
                success: true,
                message: "Workspace item deleted successfully!",
                data: {
                    deleted_item_id: String(workspace_id)
                },
            });
        }
    );
}
