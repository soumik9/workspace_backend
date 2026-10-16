import crypto from "crypto";

class RandomService {
    private static instance: RandomService;

    private constructor() { }

    public static getInstance(): RandomService {
        if (!RandomService.instance) {
            RandomService.instance = new RandomService();
        }
        return RandomService.instance;
    }

    /** ───────────────────────────────
     *  Crypto-Secure Random Password
     *  ─────────────────────────────── */
    public generatePassword(
        length: number,
        options?: {
            uppercase?: boolean;
            lowercase?: boolean;
            numbers?: boolean;
            symbols?: boolean;
        }
    ): string {
        if (length <= 0) throw new Error("Password length must be greater than 0");

        const {
            uppercase = true,
            lowercase = true,
            numbers = true,
            symbols = true,
        } = options || {};

        let chars = "";
        if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
        if (numbers) chars += "0123456789";
        if (symbols) chars += "!@#$%^&*()";

        if (!chars) throw new Error("No character sets enabled!");

        const bytes = crypto.randomBytes(length);
        return Array.from(bytes)
            .map((b) => chars[b % chars.length])
            .join("");
    }

    /** ───────────────────────────────
     *  Crypto-Secure OTP (digits only)
     *  ─────────────────────────────── */
    public generateOTP(length: number): string {
        if (length <= 0) throw new Error("Length must be greater than 0");

        const digits = "0123456789";
        const bytes = crypto.randomBytes(length);

        return Array.from(bytes)
            .map((b) => digits[b % digits.length])
            .join("");
    }


    /** ───────────────────────────────
     *  Generic Random String
     *  ─────────────────────────────── */
    public generateString(length: number, characters: string): string {
        if (!characters || characters.length === 0) {
            throw new Error("Character set cannot be empty");
        }

        const bytes = crypto.randomBytes(length);
        return Array.from(bytes)
            .map((b) => characters[b % characters.length])
            .join("");
    }
}

// Export singleton
export const RandomInstance = RandomService.getInstance();
