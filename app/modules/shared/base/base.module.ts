// base.module.ts
import { Router } from 'express';

export abstract class BaseModule<C, R = Router> {
    protected _controller?: C;
    protected _router?: R;

    /**
     * Getter for the controller. 
     * Ensures dependencies are resolved only when the controller is first needed.
     */
    public get controller(): C {
        if (!this._controller) {
            this._controller = this.createController();
        }
        return this._controller;
    }

    /**
     * Getter for the router.
     * Triggers the creation of the controller automatically.
     */
    public get router(): R {
        if (!this._router) {
            this._router = this.createRouter();
        }
        return this._router;
    }

    // Force sub-classes to define these creation methods
    protected abstract createController(): C;
    protected abstract createRouter(): R;
}