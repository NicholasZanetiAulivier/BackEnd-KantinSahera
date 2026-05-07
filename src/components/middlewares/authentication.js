const passport = require('passport');
const config = require('../../core/config');
const userService = require('../endpoints/auth/user/service');
const adminService = require('../endpoints/auth/admin/service');
const jwtService = require('../endpoints/auth/jwt/service');
const { errorResponder, errors } = require('../../core/errors');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { userPayload, adminPayload } = require('../../utils/jwt-payload');
const { parseUserId, parseAdminId } = require('../../utils/id-parser');

invalidJti = async (jti) => {
    const invalid = await jwtService.isInvalidJti(jti);

    if (invalid) throw errorResponder(errors.INVALID_TOKEN, "Token yang diberikan tidak valid!");
}

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                await invalidJti(payload.jti);
                
                const user = userPayload(await userService.findById(parseUserId(payload.user_id)));

                return done(null, { ...user, exp: payload.exp, jti: payload.jti } || false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

passport.use(
    'admin',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.admin,
        },

        async (payload, done) => {
            try {
                await invalidJti(payload.jti);
                
                const admin = adminPayload(await adminService.findById(parseAdminId(payload.admin_id)));

                return done(null, { ...admin, exp: payload.exp, jti: payload.jti } || false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

passport.use(
    'superadmin',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.admin,
        },

        async (payload, done) => {
            try {
                await invalidJti(payload.jti);

                const admin = adminPayload(await adminService.findById(parseAdminId(payload.admin_id)));

                if (!(admin.super_admin && payload.super_admin))
                    throw errorResponder(errors.INVALID_CREDENTIALS, "Admin bukan super admin!");

                return done(null, { ...admin, exp: payload.exp, jti: payload.jti } || false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

const passportUserJwt = passport.authenticate('user', { session: false });
const passportAdminJwt = passport.authenticate('admin', { session: false });
const passportSuperJwt = passport.authenticate('superadmin', { session: false });

module.exports = {
    passportUserJwt,
    passportAdminJwt,
    passportSuperJwt,
};
