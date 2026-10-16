// passport.init.ts
import passport from "passport";
import { config } from "../server";
import { PassportKeyEnum } from "../../libs/enum";
import { Strategy, ExtractJwt } from "passport-jwt";
import { AdminPassportService } from "../../libs/helper";

// Register Strategies
export const passportInit = () => {
    const jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.TOKEN.SECRET,
    };

    // Super Admin
    passport.use(
        PassportKeyEnum.AdminAuth,
        new Strategy(jwtOptions, AdminPassportService.verify)
    );

};