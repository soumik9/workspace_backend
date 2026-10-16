// user.interface.ts
import { RoleEnum } from "../../../libs/enum";
import { ICommonModel } from "../shared";

export interface IUser extends ICommonModel {
    name: string;
    email: string;
    password: string;
    role: RoleEnum;
}

export type IUserResponse = Pick<IUser,
    "name" |
    "email" |
    "role" |
    "created_at"
>;