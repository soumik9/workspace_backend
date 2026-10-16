// user.dto.ts
import { Types } from "mongoose";
import { IUser, IUserResponse } from "./user.interface";

// Base DTO
export class UserDto implements IUserResponse {
    _id: Types.ObjectId;
    name: string;
    email: string;
    created_at: number;

    constructor(user: IUser) {
        this._id = user._id! as Types.ObjectId;
        this.name = user.name;
        this.email = user.email;
        this.created_at = Number(user.created_at);
    }
}

// DTO for response
export class UserDtoResponse extends UserDto { }