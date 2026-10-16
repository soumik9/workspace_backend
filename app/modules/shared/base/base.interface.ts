import { FilterQuery, PopulateOptions } from "mongoose";

export interface IBaseFindParams<T> {
    query: FilterQuery<T>;
    isItemShouldExist?: boolean;
    isConflicted?: boolean;
    filterWithDto?: boolean;
    conflictMessage?: string;
    notFoundMessage?: string;
    mapper?: (item: T) => any;
    dbName?: string;
    populate?: PopulateOptions | PopulateOptions[];
    cacheKey?: string;
}