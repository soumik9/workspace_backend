// file-compress.helper.ts
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';
import { randomBytes } from 'crypto';
import { errorLogger } from '../logger';
import { IUploadFile } from '../../app/modules/shared';

export type FilesObject = {
    [fieldname: string]: IUploadFile[] | undefined;
};

class FileCompressorService {
    private static instance: FileCompressorService;

    private readonly OUTPUT_DIR = path.join(__dirname, '../../public/files');
    private readonly MAX_WIDTH = 1920;
    private readonly MAX_HEIGHT = 1920;
    private readonly TARGET_SIZE = 200 * 1024; // 200 KB

    private constructor() { }

    public static getInstance(): FileCompressorService {
        if (!FileCompressorService.instance) {
            FileCompressorService.instance = new FileCompressorService();
        }
        return FileCompressorService.instance;
    }

    private async ensureDir(dir: string) {
        await fs.mkdir(dir, { recursive: true });
    }

    private randomName(original: string) {
        const ext = path.extname(original) || '';
        const name = `${Date.now()}-${randomBytes(4).toString('hex')}`;
        return `${name}${ext}`;
    }
    /**
    * Compress & convert every raster image → WebP
    * Keeps SVG unchanged.
    */
    private async compressAndSave(file: IUploadFile): Promise<{ filename: string; filepath: string }> {
        if (!file.buffer) throw new Error("No buffer found for file");

        const mimetype = file.mimetype?.toLowerCase() ?? "";
        const originalExt = path.extname(file.originalname).toLowerCase();

        await this.ensureDir(this.OUTPUT_DIR);

        // Always output .webp unless SVG
        const isSVG = mimetype === "image/svg+xml" || originalExt === ".svg";
        const outExt = isSVG ? originalExt : ".webp";

        const filename = `${Date.now()}-${randomBytes(4).toString("hex")}${outExt}`;
        const outFilePath = path.join(this.OUTPUT_DIR, filename);

        // ---- SVG stays as-is ----
        if (isSVG) {
            await fs.writeFile(outFilePath, file.buffer);
            return { filename, filepath: outFilePath };
        }

        // --- Base image ---
        const baseImage = sharp(file.buffer, { failOnError: false }).rotate();
        const meta = await baseImage.metadata().catch(() => ({} as any));

        // Resize overly large images
        if ((meta.width && meta.width > this.MAX_WIDTH) || (meta.height && meta.height > this.MAX_HEIGHT)) {
            baseImage.resize({
                width: this.MAX_WIDTH,
                height: this.MAX_HEIGHT,
                fit: "inside",
                withoutEnlargement: true
            });
        }

        // --- WebP Compression ---
        const TARGET_SIZE = this.TARGET_SIZE; // 150KB target
        let quality = 80;
        let output: Buffer = file.buffer;

        while (quality >= 40) {
            output = await baseImage.clone().webp({
                quality,
                effort: 6,             // balanced CPU usage
                alphaQuality: 80,
                smartSubsample: true
            }).toBuffer();

            if (output.byteLength <= TARGET_SIZE) break;
            quality -= 10;
        }

        await fs.writeFile(outFilePath, output);

        return { filename, filepath: outFilePath };
    }


    // PUBLIC API
    public async handle(files: FilesObject | undefined): Promise<void> {
        if (!files || Object.keys(files).length === 0) return;

        await this.ensureDir(this.OUTPUT_DIR);
        const fieldNames = Object.keys(files);

        await Promise.all(
            fieldNames.map(async (field) => {
                const arr = files[field];
                if (!arr || arr.length === 0) return;

                await Promise.all(
                    arr.map(async (file) => {
                        try {
                            if (file.buffer) {
                                const { filename } = await this.compressAndSave(file);
                                file.filename = filename;
                                file.path = path.join('public', 'files', filename);
                            }
                        } catch (err) {
                            errorLogger.error(
                                `File compression error: ${err instanceof Error ? err.message : String(err)}`
                            );
                            throw err;
                        }
                    })
                );
            })
        );
    }
}

// Export singleton
export const FileCompressorInstance = FileCompressorService.getInstance();
