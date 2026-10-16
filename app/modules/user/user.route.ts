// admin.route.ts
import { Router } from 'express';
import { UserController } from './user.controller';
import { ZodInstance } from '../../../libs/helper';
import { UserZodSchemaInstance } from './user.zod';
import { UserAuthMiddleware } from '../../middleware';
import { RoleEnum } from '../../../libs/enum';


export class UserRoutes {
    public readonly router: Router;

    constructor(
        private readonly controller: UserController
    ) {
        this.router = Router();
        this.registerRoutes();
    }

    private registerRoutes(): void {
        this.router.post(
            '/register',
            // UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(UserZodSchemaInstance.register),
            this.controller.register
        );

    }

    public getRouter(): Router {
        return this.router;
    }
}