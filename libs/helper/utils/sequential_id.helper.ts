import { Model } from "mongoose";
import httpStatus from "http-status";
import { ApiError } from "../../../config";

export interface IIdGenerator {
    prefix: string;
    fieldName: string;
    includeYear?: boolean;
    digitLength?: number;
    useCurrentYear?: boolean;
}

class SequentialService {
    private static instance: SequentialService;
    private constructor() { }

    public static getInstance(): SequentialService {
        if (!SequentialService.instance) {
            SequentialService.instance = new SequentialService();
        }
        return SequentialService.instance;
    }

    /** --------------------------
     * Utilities
     * -------------------------- */

    /** Increment alphabet A → B → C ... */
    private nextLetter(letter: string): string {
        return String.fromCharCode(letter.charCodeAt(0) + 1);
    }

    /** Pad to fixed digit length */
    private pad(num: number, digits: number): string {
        return num.toString().padStart(digits, "0");
    }

    /** Reset to prefix + currentYear + "0001" */
    private baseId(prefix: string, year: string, length: number, includeYear: boolean) {
        return includeYear
            ? `${prefix}${year}${this.pad(1, length)}`
            : `${prefix}${this.pad(1, length)}`;
    }

    /** --------------------------
     * Main Generator
     * -------------------------- */
    public async generateId<T>(model: Model<T>, opts: IIdGenerator): Promise<string> {
        const {
            prefix,
            fieldName,
            includeYear = true,
            digitLength = 4,
            useCurrentYear = true
        } = opts;

        const currentYear = new Date().getFullYear().toString();
        const yearLen = includeYear ? 4 : 0;

        try {
            const latest = await model
                .findOne({}, { [fieldName]: 1 })
                .sort({ [fieldName]: -1 })
                .lean();

            if (!latest) {
                return this.baseId(prefix, currentYear, digitLength, includeYear);
            }

            const lastId = latest[fieldName as keyof typeof latest] as string;

            // Pre-built regex patterns
            const numericPattern = new RegExp(
                `^${prefix}(\\d{${yearLen}})(\\d{${digitLength}})$`
            );
            const alphaPattern = new RegExp(
                `^${prefix}(\\d{${yearLen}})([A-Z])(\\d{${digitLength}})$`
            );

            /** 1️⃣ NUMERIC MODE — ex: NLC20250001 */
            const numeric = lastId.match(numericPattern);
            if (numeric) {
                const lastYear = includeYear ? numeric[1] : currentYear;
                let seqNum = parseInt(String(numeric[2]), 10);

                // New year → reset
                if (includeYear && useCurrentYear && lastYear !== currentYear) {
                    return this.baseId(prefix, currentYear, digitLength, includeYear);
                }

                // Max reached → Switch to alpha "A0001"
                if (seqNum >= Math.pow(10, digitLength) - 1) {
                    return includeYear
                        ? `${prefix}${currentYear}A${this.pad(1, digitLength)}`
                        : `${prefix}A${this.pad(1, digitLength)}`;
                }

                // Normal increment
                return includeYear
                    ? `${prefix}${lastYear}${this.pad(seqNum + 1, digitLength)}`
                    : `${prefix}${this.pad(seqNum + 1, digitLength)}`;
            }

            /** 2️⃣ ALPHA MODE — ex: NLC2025A0001 */
            const alpha = lastId.match(alphaPattern);
            if (alpha) {
                const lastYear = includeYear ? alpha[1] : currentYear;
                let alphaLetter = alpha[2];
                let seqNum = parseInt(String(alpha[3]), 10);

                // New year → reset
                if (includeYear && useCurrentYear && lastYear !== currentYear) {
                    return this.baseId(prefix, currentYear, digitLength, includeYear);
                }

                // Max number → increment letter (A → B), reset number
                if (seqNum >= Math.pow(10, digitLength) - 1) {
                    alphaLetter = this.nextLetter(String(alphaLetter));
                    seqNum = 1;
                } else {
                    seqNum += 1;
                }

                return includeYear
                    ? `${prefix}${lastYear}${alphaLetter}${this.pad(seqNum, digitLength)}`
                    : `${prefix}${alphaLetter}${this.pad(seqNum, digitLength)}`;
            }

            /** 3️⃣ INVALID → RESET CLEANLY */
            return this.baseId(prefix, currentYear, digitLength, includeYear);

        } catch (err) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Error generating ${opts.fieldName}`
            );
        }
    }
}

export const SequentialInstance = SequentialService.getInstance();
