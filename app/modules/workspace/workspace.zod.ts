// workspace.zod.ts
import { z } from "zod";
import { WorkspaceItemType } from "../../../libs/enum";

class WorkspaceZodSchema {
    private static instance: WorkspaceZodSchema;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): WorkspaceZodSchema {
        if (!WorkspaceZodSchema.instance) {
            WorkspaceZodSchema.instance = new WorkspaceZodSchema();
        }
        return WorkspaceZodSchema.instance;
    }

    /** ============================
     * Base Schemas
     * ============================
     */
    private readonly name = z.string({ error: "Name must be a string" })
        .trim().nonempty({ message: "Name field is required" });

    public readonly base = z.object({
        name: this.name,
        type: z.enum(WorkspaceItemType, { error: "Type must be folder or file" }),
        parent: z.string().nullable().optional(),
        content: z.string({ error: "Content must be a string" }).optional(),
    }).strict();

    public readonly baseIdQuery = z.object({
        workspace_id: z
            .string()
            .nonempty({ message: "Query: Workspace ID is required" }),
    });

    /** ============================
     * Public Schemas
     * ============================
     */
    public readonly getById = z.object({
        query: this.baseIdQuery,
    });

    public readonly create = z.object({
        body: z.preprocess(value => value === undefined ? {} : value, this.base.superRefine((body, ctx) => {
            if (body.type === WorkspaceItemType.Folder && body.content !== undefined) {
                ctx.addIssue({
                    code: "custom",
                    path: ["content"],
                    message: "Content is allowed for files only",
                });
            }
        })),
    });

    public readonly update = z.object({
        query: this.baseIdQuery,
        body: z.preprocess(value => value === undefined ? {} : value, z.object({
            name: this.name.optional(),
            content: z.string({ error: "Content must be a string" }).optional(),
        }).strict().refine(body => body.name !== undefined || body.content !== undefined, {
            message: "Provide name or content to update",
        })),
    });
}

// Export singleton instance
export const WorkspaceZodSchemaInstance = WorkspaceZodSchema.getInstance();
