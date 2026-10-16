// workspace.dto.ts
import { Types } from "mongoose";
import { IWorkspace, IWorkspaceResponse } from "./workspace.interface";
import { WorkspaceItemType } from "../../../libs/enum";
import { IUser } from "../user";

// Base DTO
export class WorkspaceDto implements IWorkspaceResponse {
    _id: Types.ObjectId;
    name: string;
    type: WorkspaceItemType;
    parent: Types.ObjectId | null;
    user: IWorkspaceResponse["user"];
    content?: string;
    created_at: number;
    updated_at: number;

    constructor(workspace: IWorkspace) {

        const user = workspace.user as unknown as IUser;

        this._id = workspace._id! as Types.ObjectId;
        this.name = workspace.name;
        this.type = workspace.type;
        this.parent = workspace.parent;
        if (workspace.type === 'file') {
            this.content = workspace.content ?? "";
        }
        this.user = {
            name: user.name ?? "",
            email: user.email ?? "",
        };
        this.created_at = Number(workspace.created_at);
        this.updated_at = Number(workspace.updated_at);
    }
}

// DTO for response
export class WorkspaceDtoResponse extends WorkspaceDto { }
