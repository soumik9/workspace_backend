import path from "path";
import httpStatus from "http-status";
import { defaultImagePath } from "../../constant";
import { FnFileReturnTypeEnum } from "../../enum";
import { NextFunction, Request, Response } from "express";
import { config, errorLogger, infoLogger } from "../../../config";
import { ResponseInstance, ServerUtilityInstance } from "../core";
import { promises as fsPromises, existsSync, mkdirSync } from "fs";
import { ICommonDoc, IUploadFile } from "../../../app/modules/shared";

class FileService {
    private static instance: FileService;

    private constructor() { }

    /** Singleton accessor */
    public static getInstance(): FileService {
        if (!FileService.instance) {
            FileService.instance = new FileService();
        }
        return FileService.instance;
    }

    // Move single or multiple files into target folder 
    public async move(
        file: ICommonDoc | ICommonDoc[],
        destinationFolder: string
    ): Promise<ICommonDoc | ICommonDoc[]> {
        try {
            const publicBasePath = path.join(process.cwd(), "public");
            const targetDirectory = path.join(publicBasePath, destinationFolder);

            if (!existsSync(targetDirectory)) {
                mkdirSync(targetDirectory, { recursive: true });
            }

            const moveSingle = async (doc: ICommonDoc): Promise<ICommonDoc> => {
                const fileName = path.basename(doc.path);
                const destinationPath = path.join(targetDirectory, fileName);

                await fsPromises.rename(doc.path, destinationPath);

                const updatedDoc: ICommonDoc = {
                    ...doc,
                    path: `public/${destinationFolder}/${fileName}`,
                };

                infoLogger.info(`File moved to: ${updatedDoc.path}`);
                return updatedDoc;
            };

            // ---- Array case
            if (Array.isArray(file)) {
                return await Promise.all(file.map(moveSingle));
            }

            // ---- Single file case
            return await moveSingle(file);
        } catch (err) {
            const errMsg = `Error moving file(s): ${err instanceof Error ? err.message : err}`;
            errorLogger.error(errMsg);
            throw new Error(errMsg);
        }
    }


    /** Extract full paths from multer upload result */
    public paths<T extends FnFileReturnTypeEnum.Single | FnFileReturnTypeEnum.Multiple>(
        files: any,
        type: T,
        field?: string
    ): Promise<T extends FnFileReturnTypeEnum.Single ? ICommonDoc | null : ICommonDoc[]> {
        if (!files || Object.keys(files).length === 0) {
            return Promise.resolve(
                type === FnFileReturnTypeEnum.Single ? undefined : []
            ) as any;
        }

        const mapFile = (file: IUploadFile): ICommonDoc => ({
            path: file.path || "",
            original_name: file.originalname,
            unique_name: file.filename || "", // adjust based on multer config
        });

        if (type === FnFileReturnTypeEnum.Single) {
            let file: IUploadFile | undefined;

            if (Array.isArray(files)) file = files[0];
            else if (files[field!] && Array.isArray(files[field!])) file = files[field!][0];
            else if (files[field!]) file = files[field!];

            return (file ? mapFile(file) : null) as any;
        }

        // Multiple files
        if (files[field!] && Array.isArray(files[field!])) {
            return files[field!].map(mapFile) as any;
        }

        return [] as any;
    }

    /** Delete single or multiple files */
    public async delete(filePaths: string | string[]): Promise<void> {
        const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
        if (paths.length === 0) return;

        await Promise.all(
            paths.map(async (file) => {
                try {
                    await fsPromises.unlink(file);
                    infoLogger.info(`File deleted: ${file}`);
                } catch (err) {
                    const code = (err as NodeJS.ErrnoException).code;
                    const isNotFound = code === "ENOENT";
                    const logger = isNotFound ? errorLogger.warn : errorLogger.error;
                    const msg = isNotFound
                        ? `File not found: ${file}`
                        : `Failed to delete file: ${file} - ${(err as Error).message}`;

                    logger(msg);
                }
            })
        );
    }

    /** Build full URLs for documents */
    public url<T extends FnFileReturnTypeEnum>(
        paths: T extends FnFileReturnTypeEnum.Single
            ? string | undefined
            : string[] | undefined,
        type: T,
        isUseLiveUrl: boolean = false,
    ): T extends FnFileReturnTypeEnum.Single ? string : string[] {

        const baseUrl = isUseLiveUrl ? config.URL.BASE_LIVE : config.URL.BASE;
        let fallback = `${config.URL.BASE}/${defaultImagePath}`;

        // const baseUrl = isUseLiveUrl ? process.env.BASE_LIVE_URL : process.env.BASE_URL;
        // let fallback = `${process.env.BASE_URL}/${defaultImagePath}`;

        if (type === FnFileReturnTypeEnum.Single) {
            if (!paths) return fallback as any;

            const pathStr = paths as string;
            return `${baseUrl}/${pathStr}` as any;
        }

        if (!Array.isArray(paths)) {
            return [fallback] as any;
        }

        return paths.map((p) => `${baseUrl}/${p}`) as any;
    }

    // NEW: PUBLIC FILE EXISTENCE CHECK MIDDLEWARE
    public exists = async (
        req: Request, res: Response, next: NextFunction
    ) => {
        try {
            const decodedPath = decodeURI(req.originalUrl);
            const filePath = ServerUtilityInstance.getLocalFilePath(decodedPath);

            // Prevent path traversal outside /public/
            if (!filePath.startsWith(ServerUtilityInstance.rootPath())) {
                ResponseInstance.error(res, {
                    statusCode: httpStatus.UNAUTHORIZED,
                    message: "Access Denied",
                    errorMessages: [{
                        path: "",
                        message: "Invalid file path requested",
                    }],
                    error: null,
                    path: req.originalUrl || "",
                });
                return;
            }

            await fsPromises.access(filePath, fsPromises.constants.F_OK);
            next();
        } catch {
            ResponseInstance.error(res, {
                statusCode: httpStatus.NOT_FOUND,
                message: "File Not Found",
                error: null,
                errorMessages: [{
                    path: config.ENV === "production" ? "" : req.originalUrl,
                    message: "Image not found or has been deleted.",
                }],
                path: req.originalUrl || "",
            });
        }
    };

    /**
     * Handles file upload, move, and cleanup on failure
     * @param files - req.files
     * @param destFolder - folder path to move the file
     */
    public async handleSingleUpload(files: any, destFolder: string, field?: string) {
        let uploadedFile: ICommonDoc | null = null;
        let movedFile: ICommonDoc | null = null;

        try {
            if (!files)
                return { movedFile: null, cleanup: async () => { } };

            uploadedFile = await this.paths(files, FnFileReturnTypeEnum.Single, field);

            if (uploadedFile) {
                movedFile = await this.move(uploadedFile, destFolder) as ICommonDoc;
            }

            // Cleanup function to delete files on error
            const cleanup = async () => {
                if (movedFile?.path) await this.delete(movedFile.path);
                if (uploadedFile?.path) await this.delete(uploadedFile.path);
            };

            return { movedFile, cleanup };
        } catch (err) {
            // Ensure cleanup if something fails
            if (uploadedFile?.path) await this.delete(uploadedFile.path);
            if (movedFile?.path) await this.delete(movedFile.path);
            throw err;
        }
    }
}

// Export singleton
export const FileInstance = FileService.getInstance();