import { Types } from "mongoose";

// common model
export interface ICommonModel {
    _id?: string | Types.ObjectId;
    created_at?: number;
    updated_at?: number;
    __v?: number;
}

export interface IApiResponseMeta {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next_page: boolean;
    has_previous_page: boolean;
};

export interface IApiReponse<T> {
    statusCode: number;
    success: boolean;
    message?: string | null;
    meta?: IApiResponseMeta | null;
    data?: T | null;
};

