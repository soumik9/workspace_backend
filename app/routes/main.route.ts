// app/routes/index.ts
import { Router } from 'express';
import { UserModuleInstance } from '../modules/user';
import { WorkspaceModuleInstance } from '../modules/workspace';

class MainRouter {
    private readonly router: Router;

    constructor() {
        this.router = Router();
        this.registerRoutes();
    }

    private registerRoutes(): void {
        const apiRoutes: any[] = [
            { path: "/user", route: UserModuleInstance.router },
            { path: "/workspace", route: WorkspaceModuleInstance.router },
        ];

        apiRoutes.forEach((route) => {
            this.router.use(route.path, route.route);
        });
    }

    public getRouter(): Router {
        return this.router;
    }
}

export const MainRoutesInstance = new MainRouter();
