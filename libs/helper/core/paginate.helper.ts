import { IApiResponseMeta } from "../../../app/modules/shared";

interface IPaginatedProp {
    model: any;
    query?: Record<string, any>;
    page?: number | string;
    limit?: number | string;
    sort?: Record<string, any>;
    populate?: string | Record<string, any>;
    dtoClass?: any;
}

class PaginationService {
    private static instance: PaginationService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): PaginationService {
        if (!PaginationService.instance) {
            PaginationService.instance = new PaginationService();
        }
        return PaginationService.instance;
    }

    /** ───────────────────────────────
     *  Mongoose Model Pagination
     *  ─────────────────────────────── */
    public async auto<T>({
        model,
        query = {},
        page = 1,
        limit = 10,
        sort = { created_at: -1 },
        populate = '',
        dtoClass,
    }: IPaginatedProp): Promise<{ data: T; meta: IApiResponseMeta }> {
        const currentPage = parseInt(page as any) || 1;
        const pageSize = parseInt(limit as any) || 10;

        const totalItems = await model.countDocuments(query);
        const totalPages = Math.ceil(totalItems / pageSize);

        let dataQuery = model.find(query)
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .sort(sort)
            .lean();

        if (populate) dataQuery = dataQuery.populate(populate);
        const rawData = await dataQuery;

        // map to DTO if provided
        const data = dtoClass
            ? rawData.map((item: T) => new dtoClass(item))
            : rawData;

        return {
            data,
            meta: {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                page_size: pageSize,
                has_next_page: currentPage < totalPages,
                has_previous_page: currentPage > 1,
            },
        };
    }

    /** ───────────────────────────────
     *  Manual Array Pagination
     *  ─────────────────────────────── */
    public manual<T>(data: T[], page = 1, limit = 10) {
        const currentPage = parseInt(page as any) || 1;
        const pageSize = parseInt(limit as any) || 10;

        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / pageSize);

        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = data.slice(startIndex, endIndex);

        return {
            data: paginatedData,
            meta: {
                total_items: totalItems,
                total_pages: totalPages,
                current_page: currentPage,
                page_size: pageSize,
                has_next_page: currentPage < totalPages,
                has_previous_page: currentPage > 1,
            },
        };
    }
}

// Export singleton
export const PaginationInstance = PaginationService.getInstance();
