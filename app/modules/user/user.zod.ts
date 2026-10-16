// admin.zod.ts
import { z } from "zod";
import { ZodInstance } from "../../../libs/helper/utils";

class UserZodSchema {
    private static instance: UserZodSchema;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): UserZodSchema {
        if (!UserZodSchema.instance) {
            UserZodSchema.instance = new UserZodSchema();
        }
        return UserZodSchema.instance;
    }


    /** ============================
     * Base Schemas
     * ============================
     */
    public readonly base = z.object({
        name: ZodInstance.preprocess(
            "",
            z.string().nonempty({ message: "Name field is required" })
        ),
        email: z.email({ message: "Email is invalid" }).nonempty({ message: "Email is required" }),
        password: z.string().nonempty({ message: "Password is required" }),
    });

    public readonly baseIdQuery = z.object({
        user_id: ZodInstance.preprocess(
            "",
            z.string().nonempty({ message: "Query: User ID is required" })
        ),
    });

    /** ============================
     * Public Schemas
     * ============================
     */

    public readonly register = z.object({
        body: this.base,
    });

    public readonly getById = z.object({
        query: this.baseIdQuery,
    });

    public readonly login = z.object({
        body: z.object({
            email: z.string().email({ message: "Email is invalid" }).nonempty({ message: "Email is required" }),
            password: z.string().nonempty({ message: "Password is required" }),
        }),
    });

}

// Export singleton instance
export const UserZodSchemaInstance = UserZodSchema.getInstance();