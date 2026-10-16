// plugins/sequentialId.plugin.ts
import { CallbackError, Schema } from "mongoose";
import { IIdGenerator, SequentialInstance } from "../../../../libs/helper";

interface PluginOptions extends IIdGenerator { }

export function sequentialIdPlugin(schema: Schema, options: PluginOptions) {
    const { fieldName } = options;

    schema.pre("save", async function (next) {
        try {
            // Skip if ID already exists (update or manually set)
            if (this[fieldName]) return next();

            // Generate new sequential ID
            const id = await SequentialInstance.generateId(this.constructor as any, options);

            this[fieldName] = id;
            next();
        } catch (error) {
            return next(error as CallbackError);
        }
    });
}

/** 
import mongoose, { Schema } from "mongoose";
import { sequentialIdPlugin } from "../plugins/sequentialId.plugin";

const LoanSchema = new Schema(
    {
        loanId: { type: String, unique: true },
        amount: Number,
        customer: String
    },
    { timestamps: true }
);

LoanSchema.plugin(sequentialIdPlugin, {
    prefix: "NLC",
    fieldName: "loanId",
    includeYear: true,
    digitLength: 4,
    useCurrentYear: true
});

export const Loan = mongoose.model("Loan", LoanSchema);
*/