// workspace.interface.ts
import { Types } from "mongoose";
import { ICommonModel } from "../shared";
import { WorkspaceItemType } from "../../../libs/enum";

export interface IWorkspace extends ICommonModel {
    name: string;
    type: WorkspaceItemType;
    parent: Types.ObjectId | null;
    content?: string;
    user: Types.ObjectId;
}

export type IWorkspaceResponse = Pick<IWorkspace,
    "name" |
    "type" |
    "parent" |
    "content" |
    "created_at" |
    "updated_at"
> & {
    user: {
        name: string;
        email: string;
    }
};
