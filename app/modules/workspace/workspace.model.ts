// workspace.model.ts
import { Schema, model } from 'mongoose';
import { IWorkspace } from "./workspace.interface";
import { ModelEnum, WorkspaceItemType } from "../../../libs/enum";
import { CommonSchema } from "../shared/core/core.model";

const WorkspaceSchema = new Schema<IWorkspace>({
    name: {
        type: String,
        required: [true, 'Name field is required'],
        trim: true,
    },
    type: {
        type: String,
        enum: {
            values: Object.values(WorkspaceItemType),
            message: '{VALUE} is not supported, must be one of ' + Object.values(WorkspaceItemType).join(', '),
        },
        required: [true, 'Type field is required'],
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: ModelEnum.Workspace,
        default: null,
    },
    content: {
        type: String,
        default: "",
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: ModelEnum.User,
        required: [true, 'User field is required'],
    }
});

// Inherit from CommonSchema
WorkspaceSchema.add(CommonSchema);

export const Workspace = model<IWorkspace>(ModelEnum.Workspace, WorkspaceSchema);
