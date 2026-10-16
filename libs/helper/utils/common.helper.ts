import moment from "moment";
import { DurationFilterEnum } from "../../enum";

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

    // Generate chart data
    public getChartData({
        filter, isYearFilter, startDate, salesMap, currency
    }: {
        filter: DurationFilterEnum;
        isYearFilter: boolean;
        startDate: number;
        salesMap: Map<string, number>;
        currency: string;
    }) {
        // 4. Build the Final Structure (Filling in Zeros)
        const chartData: { name: string | number, value: number, year: string, currency: string }[] = [];
        const startMoment = moment.unix(startDate).utc();

        if (filter === DurationFilterEnum.ThisMonth || filter === DurationFilterEnum.LastMonth) {
            const daysInMonth = moment.unix(startDate).daysInMonth();
            const year = startMoment.format('YYYY');
            for (let i = 1; i <= daysInMonth; i++) {
                const dayKey = i.toString();
                chartData.push({
                    name: i,
                    value: salesMap.get(dayKey) || 0,
                    year,
                    currency
                });
            }
        } else if (isYearFilter) {
            // Loop Jan - Dec
            const months = moment.months(); // ["January", ... "December"]
            const year = startMoment.format('YYYY');
            months.forEach(month => {
                chartData.push({
                    name: month,
                    value: salesMap.get(month) || 0,
                    year,
                    currency
                });
            });
        } else if (filter === DurationFilterEnum.ThisWeek) {
            // Loop 7 days starting from the calculated startDate
            const tempDate = moment.unix(startDate).utc();
            for (let i = 0; i < 7; i++) {
                const dayName = tempDate.format('dddd');
                const year = tempDate.format('YYYY');

                chartData.push({
                    name: dayName,
                    value: salesMap.get(dayName) || 0,
                    year,
                    currency
                });
                tempDate.add(1, 'day');
            }
        } else if (filter === DurationFilterEnum.SixMonths) {
            // Loop last 6 months dynamically (e.g. Aug, Sep, Oct, Nov, Dec, Jan)
            for (let i = 5; i >= 0; i--) {
                const targetDate = moment().utc().subtract(i, 'months');
                const monthName = targetDate.format('MMMM');
                const year = targetDate.format('YYYY');

                chartData.push({
                    name: monthName,
                    value: salesMap.get(monthName) || 0,
                    year,
                    currency
                });
            }
            // reverse the data
            chartData.reverse();
        } else if (filter === DurationFilterEnum.Today) {
            const dayName = moment.unix(startDate).utc().format('dddd');
            const year = startMoment.format('YYYY');

            chartData.push({
                name: dayName,
                value: salesMap.get(dayName) || 0,
                year,
                currency
            });
        }

        return chartData;
    }
}

// Export singleton
export const CommonHelperInstance = CommonHelperService.getInstance();