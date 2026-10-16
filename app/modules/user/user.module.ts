// user.module.ts
import { Router } from 'express';
import { BaseModule } from '../shared/base';
import { User } from './user.model';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserRoutes } from './user.route';

class UserModule extends BaseModule<UserController> {

    // Lazy load local service
    private _service?: UserService;
    public get service(): UserService {
        if (!this._service) {
            this._service = new UserService(User);
        }
        return this._service;
    }

    // Create Controller
    protected createController(): UserController {
        return new UserController(
            this.service,
        );
    }

    // Create Router
    protected createRouter(): Router {
        return new UserRoutes(this.controller).getRouter();
    }
}

export const UserModuleInstance = new UserModule();