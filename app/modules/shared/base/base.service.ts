// base.service.ts
import httpStatus from "http-status";
import { IApiResponseMeta } from "../core";
import { ApiError } from "../../../../config";
import { IBaseFindParams } from "./base.interface";
import { PaginationInstance } from "../../../../libs/helper";
import { Model, FilterQuery, ClientSession, PopulateOptions } from "mongoose";

export abstract class BaseService<T> {
    constructor(
        protected readonly entityName: string,
        protected readonly model: Model<T>,
        protected readonly defaultMapper: any,
    ) { }

    // find or throw
    public async findOrThrow({
        query,
        isItemShouldExist = false,
        isConflicted = false,
        filterWithDto = false,
        conflictMessage = `${this.entityName} already exists!`,
        notFoundMessage = `${this.entityName} not found!`,
        populate,
    }: IBaseFindParams<T>): Promise<any> {

        let dbQuery = this.model.findOne(query).lean();
        if (populate) {
            dbQuery = dbQuery.populate(populate);
        }
        const queryItem = await dbQuery;
        const item = (queryItem && filterWithDto) ? new this.defaultMapper(queryItem as T) : queryItem;

        // Conflict check: Item exists when it shouldn't
        if (isConflicted && item) {
            throw new ApiError(httpStatus.CONFLICT, conflictMessage);
        }

        // Existence check: Item doesn't exist when it should
        if (isItemShouldExist && !item) {
            throw new ApiError(httpStatus.NOT_FOUND, notFoundMessage);
        }

        return item;
    }

    // create one data 
    public async createOne<R = T>({ data, filterWithDto = false, session, populate }: {
        data: Record<string, any>;
        filterWithDto?: boolean;
        populate?: PopulateOptions | PopulateOptions[];
        session?: ClientSession;
    }): Promise<R> {
        const docs = await this.model.create(
            Array.isArray(data) ? data : [data],
            { ...(session && { session }) }
        );
        // Guard against undefined/empty results
        if (!docs || docs.length === 0) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `${this.entityName} creation failed!`);
        }

        let savedDoc = docs[0];
        if (populate) {
            await this.model.populate(savedDoc, populate);
        }

        const plainObject = savedDoc?.toObject();
        return filterWithDto ? new this.defaultMapper(plainObject as T) : (plainObject as R);
    }

    // create multiple data
    public async createMany<R = T>({ data, filterWithDto = false, session, populate }: {
        data: Record<string, any>[];
        filterWithDto?: boolean;
        populate?: PopulateOptions | PopulateOptions[];
        session?: ClientSession;
    }): Promise<R[]> {

        // Guard against empty payloads
        if (!Array.isArray(data) || data.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Data array cannot be empty for ${this.entityName} multi-creation!`);
        }

        // Mongoose create() accepts an array of objects to insert multiple documents
        const docs = await this.model.create(
            data,
            { ...(session && { session }) }
        );

        // Guard against undefined/empty results
        if (!docs || docs.length === 0) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `${this.entityName} multi-creation failed!`);
        }

        // Mongoose populate accepts an array of documents directly
        if (populate) {
            await this.model.populate(docs, populate);
        }

        // Map over the documents to convert to objects and optionally apply the DTO
        return docs.map((doc) => {
            const plainObject = doc.toObject();
            return filterWithDto
                ? (new this.defaultMapper(plainObject as T) as unknown as R)
                : (plainObject as unknown as R);
        });
    }

    // get all
    public async getAll<R = T>({
        query = {}, filterWithDto = false, populate, sort, select
    }: {
        query?: FilterQuery<T>;
        filterWithDto?: boolean;
        populate?: PopulateOptions | PopulateOptions[];
        sort?: string | Record<string, 1 | -1 | 'asc' | 'desc'>;
        select?: string | Record<string, any>;
    }): Promise<R[]> {

        const docs = await this.model.find(query).select(select || {}).sort(sort || {}).lean();
        if (populate) {
            await this.model.populate(docs, populate);
        }
        return filterWithDto ? docs.map(doc => new this.defaultMapper(doc as T)) : (docs as R[]);
    }

    // get filtered and paginated
    public async getFilteredPaginated({
        page = 1, limit = 10, query = {}, filterWithDto = false, populate, sort,
        cacheKey
    }: {
        page: number;
        limit: number;
        query: FilterQuery<T>;
        filterWithDto?: boolean;
        populate?: PopulateOptions | PopulateOptions[];
        sort?: Record<string, any>;
        cacheKey?: string;
    }): Promise<{ data: any[]; meta: IApiResponseMeta }> {
        const result = (await PaginationInstance.auto({
            model: this.model,
            page,
            limit,
            query,
            ...(populate ? { populate } : {}),
            dtoClass: filterWithDto ? this.defaultMapper : undefined,
            ...(sort ? { sort } : {})
        })) as { data: any[]; meta: IApiResponseMeta };
        return result;
    }

    // update one method
    public async updateOne<R = T>({
        query, data, filterWithDto = false, updatedData, populate, session,
        options = { new: true, runValidators: true }, isErrorThrow = true
    }: {
        query: FilterQuery<T>;
        data: Record<string, any>;
        filterWithDto?: boolean;
        updatedData?: Record<string, any>;
        populate?: string | Record<string, any>;
        session?: ClientSession;
        options?: Record<string, any>;
        isErrorThrow?: boolean;
    }): Promise<R> {

        const updateQuery: Record<string, any> = { ...updatedData };
        if (Object.keys(data).length > 0) {
            updateQuery.$set = data;
        }

        const result = await this.model.findOneAndUpdate(
            query,
            updateQuery,
            {
                ...options,
                ...(session && { session })
            }
        );

        if (!result && isErrorThrow) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `${this.entityName} not found for update!`
            );
        }

        // Handle population if requested
        if (populate) {
            const paths = Array.isArray(populate) ? populate : [populate];
            for (const path of paths) {
                await (result as any).populate({
                    path: path as string,
                });
            }
        }

        return filterWithDto ? new this.defaultMapper(result as T) : (result?.toObject() as R);
    }

    // update many method
    public async updateMany({
        query, data = {}, updatedData, session, options = { runValidators: true }, errorThrow = true
    }: {
        query: FilterQuery<T>;
        data?: Record<string, any>;
        updatedData?: Record<string, any>;
        session?: ClientSession;
        options?: Record<string, any>;
        errorThrow?: boolean;
    }) {

        const updateQuery: Record<string, any> = { ...updatedData };

        // If standard data is passed, wrap it in $set
        if (Object.keys(data).length > 0) {
            updateQuery.$set = data;
        }

        // Execute the updateMany operation
        const result = await this.model.updateMany(
            query,
            updateQuery,
            {
                ...options,
                ...(session && { session })
            }
        );

        if (result.matchedCount === 0 && errorThrow) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `No ${this.entityName}s found matching the query to update!`
            );
        }

        return result; // Returns { acknowledged: true, matchedCount: X, modifiedCount: Y, ... }
    }

    // delete one method
    public async deleteOne(query: FilterQuery<T>): Promise<boolean> {
        const result = await this.model.deleteOne(query);
        if (result.deletedCount === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, `${this.entityName} not found for deletion!`);
        }
        return true;
    }

    // delete many method
    public async deleteMany(query: FilterQuery<T>, session?: ClientSession): Promise<number> {
        const result = await this.model.deleteMany(query, { ...(session && { session }) });
        return result.deletedCount;
    }

    // count method
    public async count({ query = {}, session }: {
        query?: FilterQuery<T>;
        session?: ClientSession;
    }): Promise<number> {
        return this.model.countDocuments(query, { ...(session && { session }) });
    }

    // aggregate method
    public async aggregate<R = any>(pipeline: any[]): Promise<R[]> {
        return this.model.aggregate<R>(pipeline).exec();
    }
}