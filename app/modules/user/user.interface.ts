// user.interface.ts
import { ICommonModel } from "../shared";

export interface IUser extends ICommonModel {
    name: string;
    email: string;
    password: string;
}

export type IUserResponse = Pick<IUser,
    "name" |
    "email"
>;