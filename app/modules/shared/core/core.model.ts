import moment from "moment";
import { Schema } from "mongoose";

// Common schema for common fields
export const CommonSchema = new Schema({
    created_at: {
        type: Number,
        default: () => moment().utc().unix(),
    },
    updated_at: {
        type: Number,
        default: () => moment().utc().unix(),
    },
});

CommonSchema.statics.isExistsById = async function (id: string, select: string) {
    const isExists = await this.findById(id).select(select).lean();
    return isExists;
};

CommonSchema.pre("save", function (next) {
    this.updated_at = moment().utc().unix();
    if (this.isNew) {
        this.created_at = moment().utc().unix();
    }
    next();
});

// Middleware for update operations
CommonSchema.pre(
    ["updateOne", "findOneAndUpdate", "updateMany"],
    function (next) {
        this.set({ updated_at: moment().utc().unix() });
        next();
    }
);