import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import { ZodInstance } from "../utils";
import { ServerEnvironmentEnum } from "../../enum";
import handlebars, { TemplateDelegate } from "handlebars";
import { ISendEmail, SendEmailSchema } from "../../../app/modules/shared";
import { config, infoLogger, ApiError, TransporterInstance } from "../../../config";

class EmailService {
    private static instance: EmailService;
    private templateCache: Record<string, TemplateDelegate> = {};
    private transporterVerified = false;

    private constructor(private useCache: boolean = true) { }

    /** Singleton accessor */
    public static getInstance(useCache: boolean = true): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService(useCache);
        }
        return EmailService.instance;
    }

    /** Render a Handlebars template with optional caching */
    public renderTemplate({
        templateName, data, useCache = true
    }: {
        templateName: string, data: Record<string, any>, useCache?: boolean
    }): string {
        if (this.useCache && this.templateCache[templateName]) {
            return this.templateCache[templateName](data);
        }

        const env = config.ENV ?? ServerEnvironmentEnum.Development;
        const viewsBase =
            env === ServerEnvironmentEnum.Development
                ? path.resolve(process.cwd(), "app", "views")
                : path.resolve(process.cwd(), "views");

        const filePath = path.join(viewsBase, `${templateName}.template.hbs`);

        if (!fs.existsSync(filePath)) {
            throw new ApiError(
                httpStatus.NOT_FOUND,
                `Template "${templateName}" not found at path: ${filePath}`
            );
        }

        const source = fs.readFileSync(filePath, "utf8");
        const template = handlebars.compile(source);

        if (useCache) {
            this.templateCache[templateName] = template;
        }

        return template(data);
    }

    /** Ensure transporter is verified once */
    private async verifyTransporter() {
        if (!this.transporterVerified) {
            await TransporterInstance.verify();
            this.transporterVerified = true;
            infoLogger.info("Mail server is ready to send messages");
        }
    }

    /** Send email with template rendering */
    public async send({
        payload, useCache = this.useCache }: {
            payload: ISendEmail, useCache?: boolean
        }): Promise<any> {

        const validatedPayload = ZodInstance.validateSchema<ISendEmail>(SendEmailSchema, payload);
        const { toEmail, subject, template, data, fromEmail } = validatedPayload;

        try {
            await this.verifyTransporter();

            const htmlContent = this.renderTemplate({
                templateName: template,
                data: data || {},
                useCache: useCache ?? this.useCache
            });
            if (!htmlContent) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Template not found");
            }

            const response = await TransporterInstance.sendMail({
                from: fromEmail ?? config.MAIL.FROM,
                to: toEmail,
                subject,
                html: htmlContent,
            });

            infoLogger.info(`Email sent to ${toEmail} | Message ID: ${response.messageId}`);
            return response;
        } catch (error) {
            throw new ApiError(
                httpStatus.INTERNAL_SERVER_ERROR,
                `Failed to send email: ${error instanceof Error ? error.message : "unknown"}`
            );
        }
    }

    /** Clear cached templates */
    public clearCache(templateName?: string) {
        if (templateName) {
            delete this.templateCache[templateName];
        } else {
            this.templateCache = {};
        }
    }
}

// Export singleton
export const EmailInstance = EmailService.getInstance();