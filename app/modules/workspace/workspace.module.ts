// workspace.module.ts
import { Router } from 'express';
import { WorkspaceController } from './workspace.controller';
import { BaseModule } from '../shared/base';
import { WorkspaceService } from './workspace.service';
import { Workspace } from './workspace.model';
import { WorkspaceRoutes } from './workspace.route';

class WorkspaceModule extends BaseModule<WorkspaceController> {

    // Lazy load local service
    private _service?: WorkspaceService;
    public get service(): WorkspaceService {
        if (!this._service) {
            this._service = new WorkspaceService(Workspace);
        }
        return this._service;
    }

    // Create Controller
    protected createController(): WorkspaceController {
        return new WorkspaceController(
            this.service,
        );
    }

    // Create Router
    protected createRouter(): Router {
        return new WorkspaceRoutes(this.controller).getRouter();
    }
}

export const WorkspaceModuleInstance = new WorkspaceModule();