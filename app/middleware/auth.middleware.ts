// auth.middleware.ts
import passport from "passport";
import httpStatus from "http-status";
import { ApiError } from "../../config";
import { PassportKeyEnum } from "../../libs/enum";
import { NextFunction, Request, Response, RequestHandler } from "express";

class AuthMiddleware {
    private static instance: AuthMiddleware;

    private constructor() { }

    public static getInstance(): AuthMiddleware {
        if (!AuthMiddleware.instance) {
            AuthMiddleware.instance = new AuthMiddleware();
        }
        return AuthMiddleware.instance;
    }

    // Helper to run passport authentication
    private runPassport(strategies: string[], req: Request, res: Response, next: NextFunction, cb: Function) {
        passport.authenticate(
            strategies,
            { session: false },
            (err: any, user: any, info: any) => {
                // Check for specific strategy errors (e.g., "Tenant database name missing")
                if (err) {
                    return next(err);
                }

                // Check for failed authentication (e.g., Invalid token, User not found)
                if (!user) {
                    return next(new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized access"));
                }

                cb(user);
            }
        )(req, res, next);
    }

    private checkRoles(requiredRoles: string[], user: any): void {
        if (requiredRoles.length && !requiredRoles.includes(user.role)) {
            throw new ApiError(httpStatus.FORBIDDEN, "Forbidden: Insufficient permissions");
        }
    }

    // Main verify middleware
    public verify(authStrategies: PassportKeyEnum[], ...requiredRoles: string[]): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            try {
                this.runPassport(authStrategies, req, res, next, (user: any) => {
                    void (async () => {
                        this.checkRoles(requiredRoles, user);
                        req.entity = {
                            _id: String(user._id), name: user.name, email: user.email,
                            role: user.role, store_id: user.store ? String(user.store) : null,
                        };
                        next();
                    })().catch(next);
                });
            } catch (error) {
                next(error);
            }
        };
    }
}

export const UserAuthMiddleware = (...roles: string[]) => {
    return AuthMiddlewareInstance.verify([PassportKeyEnum.UserAuth], ...roles);
};

export const AuthMiddlewareInstance = AuthMiddleware.getInstance();
