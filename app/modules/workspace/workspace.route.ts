import rateLimit from 'express-rate-limit';
// workspace.route.ts
import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { UserAuthMiddleware } from '../../middleware';
import { RoleEnum } from '../../../libs/enum';
import { ZodInstance } from '../../../libs/helper/utils';
import { WorkspaceZodSchemaInstance } from './workspace.zod';

export class WorkspaceRoutes {
    public readonly router: Router;

    constructor(
        private readonly controller: WorkspaceController
    ) {
        this.router = Router();
        this.registerRoutes();
    }

    private registerRoutes(): void {
        this.router.get(
            '/',
            UserAuthMiddleware(RoleEnum.User),
            this.controller.getFilteredPaginated
        );

        this.router.get(
            '/single',
            UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(WorkspaceZodSchemaInstance.getById),
            this.controller.getSingle
        );

        this.router.post(
            '/create',
            UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(WorkspaceZodSchemaInstance.create),
            this.controller.createSingle
        );

        this.router.patch(
            '/update',
            UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(WorkspaceZodSchemaInstance.update),
            this.controller.updateSingle
        );

        this.router.delete(
            '/delete',
            UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(WorkspaceZodSchemaInstance.getById),
            this.controller.deleteSingle
        );

        this.router.post(
            '/summarize',
            UserAuthMiddleware(RoleEnum.User),
            ZodInstance.validateRequest(WorkspaceZodSchemaInstance.summarize),
            this.controller.summarize
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}