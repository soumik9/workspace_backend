// admin.service.ts
import { Model } from "mongoose";
import { UserDtoResponse } from "./user.dto";
import { IUser } from "./user.interface";
import { BaseService } from "../shared";

// Inject the model instead of importing it directly
export class UserService extends BaseService<IUser> {
    constructor(
        userModel: Model<IUser>,
    ) {
        super("User", userModel, UserDtoResponse);
    }

}