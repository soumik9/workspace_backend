// upload.helper.ts
import fs from "fs";
import path from "path";
import multer from "multer";
import { Request } from "express";

export class MulterUploadService {
    private static instance: MulterUploadService;
    private readonly uploadDir = path.join(__dirname, "../../public/files/");
    private readonly allowedExt = /jpg|jpeg|png|webp|svg/;

    private uploader: multer.Multer;

    private constructor() {
        this.ensureDir();

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, "public/files");
            },
            filename: (req, file, cb) => {
                const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                cb(null, `${unique}-${file.originalname}`);
            }
        });

        const fileFilter = (
            req: Request,
            file: Express.Multer.File,
            cb: (error: any, accept: boolean) => void
        ) => {
            const ext = path.extname(file.originalname).toLowerCase();

            if (this.allowedExt.test(ext)) {
                cb(null, true);
            } else {
                cb(new Error("Must be a jpg/png/jpeg/webp/svg file"), false);
            }
        };

        this.uploader = multer({
            storage,
            fileFilter
        });
    }

    public static getInstance(): MulterUploadService {
        if (!MulterUploadService.instance) {
            MulterUploadService.instance = new MulterUploadService();
        }
        return MulterUploadService.instance;
    }

    public getUploader(): multer.Multer {
        return this.uploader;
    }

    private ensureDir() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }
}

// Export ready-to-use uploader
export const MulterUploadInstance = MulterUploadService.getInstance();