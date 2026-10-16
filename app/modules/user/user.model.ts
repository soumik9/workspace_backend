// admin.model.ts
import validator from "validator";
import { NextFunction } from 'connect';
import { Schema, model } from 'mongoose';
import { IUser } from "./user.interface";
import { CommonSchema } from "../shared/core/core.model";
import { ModelEnum, RoleEnum } from "../../../libs/enum";
import { SecurityInstance } from "../../../libs/helper";

const UserSchema = new Schema<IUser>({
    name: {
        type: String,
        required: [true, 'First Name field is required']
    },
    email: {
        type: String,
        required: [true, 'Email field is required'],
        unique: true,
        sparse: true,
        set: (value: string | undefined) => value?.trim() || undefined,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email.'],
    },
    password: {
        type: String,
        required: [true, 'Password field is required'],
    },
    role: {
        type: String,
        default: RoleEnum.User,
    },
});

// Inherit from CommonSchema
UserSchema.add(CommonSchema);

// create or save works for both
UserSchema.pre("save", async function (next: NextFunction) {
    if (!this.isModified("password")) {
        return next();
    }

    const password = this.password;
    const hashedPassword = await SecurityInstance.generateHash(String(password));
    this.password = hashedPassword;
    next();
});

export const User = model<IUser>(ModelEnum.User, UserSchema);