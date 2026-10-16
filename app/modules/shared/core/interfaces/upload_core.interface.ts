export type IUploadFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename?: string;
    path?: string;
    size?: number;
    buffer?: Buffer;
}

export interface IMulterFiles {
    single?: IUploadFile[] | undefined;
    multiple?: IUploadFile[] | undefined;
    // You can define other fields here as needed
}