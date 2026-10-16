// workspace.service.ts
import { Model } from "mongoose";
import { BaseService } from "../shared/base/base.service";
import { WorkspaceDtoResponse } from "./workspace.dto";
import { IWorkspace } from "./workspace.interface";

// Inject the model instead of importing it directly
export class WorkspaceService extends BaseService<IWorkspace> {
    constructor(
        userModel: Model<IWorkspace>,
    ) {
        super("Workspace", userModel, WorkspaceDtoResponse);
    }


    public getItemWithParentIds = async ({ workspace_id, user_id }: {
        workspace_id: string;
        user_id: string;
    }): Promise<Set<string>> => {
        const ids = new Set<string>([String(workspace_id)]);
        let parentIds = [workspace_id];

        while (parentIds.length > 0) {
            const children = await this.getAll({
                query: {
                    user: user_id,
                    parent: { $in: parentIds }
                },
                select: "_id",
            });
            parentIds = children.map(child => String(child._id)).filter(id => !ids.has(id));
            parentIds.forEach(id => ids.add(String(id)));
        }

        return ids;
    }
}
