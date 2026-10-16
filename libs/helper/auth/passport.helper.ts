import { Model } from "mongoose";
import httpStatus from "http-status";
import { ModelEnum } from "../../enum";
import { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../../../config";
import { Admin, IAdmin } from "../../../app/modules";

// 1. Factory now accepts payload to allow dynamic DB resolution
type ModelFactory<T> = (payload: JwtPayload) => Model<T> | Promise<Model<T>>;

export class PassportService<T> {
    private static instances: Map<string, PassportService<any>> = new Map();

    private constructor(
        private readonly getModel: ModelFactory<T>,
        private readonly entityType: string = "default"
    ) { }

    public static getInstance<U>(
        name: string,
        getModel: ModelFactory<U>,
        entityType: string,
    ): PassportService<U> {
        if (!this.instances.has(name)) {
            this.instances.set(name, new PassportService<U>(getModel, entityType));
        }
        return this.instances.get(name)!;
    }

    public verify = async (
        payload: JwtPayload,
        done: (err: any, user?: T | false) => void
    ): Promise<void> => {
        try {
            // 2. Pass the payload into the factory to resolve the specific DB
            const model = await this.getModel(payload);
            if (!model) {
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Model resolution failed");
            }

            const user = await model.findOne({ _id: payload._id }).lean<T>();
            if (!user) {
                return done(
                    new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!"),
                    false
                );
            }

            // Inject the source type and dbName directly into the user object
            (user as any).type = this.entityType || "default";
            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    };
}

// --- Usage Implementation ---

// 1. Admin (Static DB)
export const AdminPassportService = PassportService.getInstance<IAdmin>(
    ModelEnum.Admin,
    () => Admin,
    "admin"
);