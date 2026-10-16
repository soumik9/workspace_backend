import moment from "moment";
import { DurationFilterEnum } from "../../enum";

class MomentService {
    private static instance: MomentService;

    private constructor() { }

    public static getInstance(): MomentService {
        if (!MomentService.instance) {
            MomentService.instance = new MomentService();
        }
        return MomentService.instance;
    }

    /** ───────────────────────────────
     *  Future UNIX timestamp (UTC)
     *  ─────────────────────────────── */
    public futureUnix(
        amount: number,
        unit: moment.unitOfTime.DurationConstructor
    ): number {
        if (amount <= 0) throw new Error("Amount must be greater than 0");

        return moment().utc().add(amount, unit).unix();
    }

    /** ───────────────────────────────
     *  Current Year (UTC)
     *  ─────────────────────────────── */
    public currentYear(): number {
        return Number(moment().utc().format("YYYY"));
    }

    public currentUnix(): number {
        return moment().utc().unix();
    }

    public formatDate(date: number): string {
        return moment.unix(date).utc().format("YYYY-MM-DD");
    }

    public formatTime(date: number): string {
        return moment.unix(date).utc().format("HH:mm:ss");
    }

    public formatUnix(unixTimestamp: number, format: string = "YYYY-MM-DD HH:mm:ss"): string {
        return moment.unix(unixTimestamp).utc().format(format);
    }

    public startOfDayUnix(date: number): number {
        return moment.unix(date).utc().startOf('day').unix();
    }

    public endOfDayUnix(date: number): number {
        return moment.unix(date).utc().endOf('day').unix();
    }

    /** ───────────────────────────────
     *  Date range by duration filter
     *  ─────────────────────────────── */
    public dateRangeByDuration(filter: DurationFilterEnum): {
        startDate: number;
        endDate: number;
        isYearFilter: boolean;
    } {
        let startDate: moment.Moment;
        let endDate: moment.Moment = moment().utc().endOf("day");

        const isYearFilter = /^\d{4}$/.test(filter);

        // 1. Check if filter is a 4-digit Year (e.g., "2024", "2025")
        if (isYearFilter) {
            /**
             * ! dont add .utc() for the year here
             */
            startDate = moment(filter, "YYYY").startOf('year');
            endDate = moment(filter, "YYYY").endOf('year');
        } else {
            switch (filter) {
                case 'today':
                    startDate = moment().utc().startOf('day');
                    break;
                case 'this_week':
                    startDate = moment().utc().startOf('isoWeek'); // isoWeek starts Monday
                    break;
                case 'this_month':
                    startDate = moment().utc().startOf('month');
                    endDate = moment().utc().endOf('month');
                    break;
                case 'last_month':
                    startDate = moment().utc().subtract(1, 'months').startOf('month');
                    endDate = moment().utc().subtract(1, 'months').endOf('month');
                    break;
                case '6_months':
                    // From 6 months ago start, until today
                    startDate = moment().utc().subtract(6, 'months').startOf('month');
                    break;
                default:
                    // Fallback to this month if filter is unknown
                    startDate = moment().utc().startOf('month');
            }
        }

        return {
            startDate: startDate.unix(),
            endDate: endDate.unix(),
            isYearFilter,
        };
    }
}

// Export singleton
export const MomentInstance = MomentService.getInstance();