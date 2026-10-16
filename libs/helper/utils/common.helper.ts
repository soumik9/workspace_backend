class CommonHelperService {
    private static instance: CommonHelperService;

    private constructor() { }

    public static getInstance(): CommonHelperService {
        if (!CommonHelperService.instance) {
            CommonHelperService.instance = new CommonHelperService();
        }
        return CommonHelperService.instance;
    }

    public round(num: number): number {
        return Number(num.toFixed(2));
    }

    public buildSortedParams = (obj: any) => {
        if (!obj || typeof obj !== 'object') return String(obj);
        return JSON.stringify(Object.keys(obj).sort().reduce((acc, key) => {
            acc[key] = obj[key];
            return acc;
        }, {} as any));
    }
}

// Export singleton
export const CommonHelperInstance = CommonHelperService.getInstance();