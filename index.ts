import express, { Application } from 'express';
import { CoreServiceInstance } from './app/modules/shared';
import { FileInstance } from './libs/helper'; // dont up the file
import { ServerMiddlewareInstance } from './app/middleware';
import { GlobalErrorInstance, ServerBootstrapInstance } from './config';
import { MainRoutesInstance } from './app/routes/main.route';

class App {
    public app: Application;

    constructor() {
        this.app = express();
    }

    public async init(): Promise<void> {
        // 1. Setup Middlewares
        ServerMiddlewareInstance.register(this.app);

        // 2. Static Files
        this.app.use('/public', FileInstance.exists, express.static('public'));

        // basic routes
        this.app.get("/", CoreServiceInstance.welcome);

        // all routes
        this.app.use('/api/v1', MainRoutesInstance.getRouter());

        // 5. Error Handlers
        this.app.use(GlobalErrorInstance.handler());
        this.app.use(CoreServiceInstance.notFound);
    }
}

// Start the application
const start = async () => {
    try {
        const application = new App();
        await application.init();
        await ServerBootstrapInstance.bootstrap(application.app);
    } catch (error) {
        console.error("FATAL: System failed to start", error);
        process.exit(1);
    }
};

start();