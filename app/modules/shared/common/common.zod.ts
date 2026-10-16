import z from "zod";
import { ZodInstance } from "../../../../libs/helper/utils";

// Zod Schema
export const SendEmailSchema = z.object({
    toEmail: z.email({ message: "Invalid email address" }).nonempty({ message: "TO Email is required" }),
    subject: z.string({ message: "Subject is required" }).nonempty({ message: "Subject is required" }),
    template: z.string({ message: "Template is required" }).nonempty({ message: "Template is required" }),
    data: z.record(z.string(), z.any()).optional(),
    fromEmail: z.email({ message: "Invalid email address" }).nonempty({ message: "From Email is required" }).optional(),
    isUseCache: z.boolean().optional(),
});

// Phone Country Zod Schema
export const PhoneCountryZodSchema = z.object({
    code: ZodInstance.preprocess(
        "", z
            .string()
            .nonempty({ message: "Country code is required" })
    ),
    name: ZodInstance.preprocess(
        "", z
            .string()
            .nonempty({ message: "Country name is required" })
    ),
    dial_code: ZodInstance.preprocess(
        "", z
            .string()
            .nonempty({ message: "Country dial code is required" })
    ),
});