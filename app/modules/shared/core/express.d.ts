import express from 'express';
import { Types } from 'mongoose';
import { AdminRoleEnum } from '../../../../libs/enum';

declare global {
    namespace Express {
        interface Request {
            files?: Express.Multer.File[] | Express.Multer.File;
            entity?: {
                _id: string;
                name: string;
                email: string | undefined;
                role: AdminRoleEnum;
                store_id: string | null;
            };
            store_id?: string;
        }
    }
}
