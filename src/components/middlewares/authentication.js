const passport = require('passport');
const config = require('../../core/config');
const userService = require('../../components/endpoints/auth/user/service');
const adminService = require('../../components/endpoints/auth/admin/service');
const { errorResponder, errors } = require('../../core/errors');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { userPayload, adminPayload } = require('../../utils/jwt-payload');

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                const user = userPayload(await userService.findById(parseUserId(payload.user_id)));
                return done(null, user || false);
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
                const admin = adminPayload(await adminService.findById(parseAdminId(payload.admin_id)));

                return done(null, admin || false);
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
                const admin = adminPayload(await adminService.findById(parseAdminId(payload.admin_id)));

                if (!(admin.super_admin && payload.super_admin))
                    throw errorResponder(errors.INVALID_CREDENTIALS, "Admin bukan super admin!");

                return done(null, admin || false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

const passportUserJwt = passport.authenticate('user', { session: false });
const passportAdminJwt = passport.authenticate('admin', { session: false });
const passportSuperJwt = passport.authenticate('superadmin', { session: false });

function parseUserId(userId) {
    const id = userId.split(config.keys_prefix.user_id);
    console.log(id);
    const idWithoutPrefix = id[1] || null;

    if (idWithoutPrefix) return idWithoutPrefix;
    else throw errorResponder(errors.BAD_ID, "ID payload bukan ID User yang valid!");
}

function parseAdminId(adminId) {
    const id = adminId.split(config.keys_prefix.admin_id);
    const idWithoutPrefix = id[1] || null;

    if (idWithoutPrefix) return idWithoutPrefix;
    else throw errorResponder(errors.BAD_ID, "ID payload bukan ID Admin yang valid!");
}

module.exports = {
    passportUserJwt,
    passportAdminJwt,
    passportSuperJwt,
    parseUserId,
    parseAdminId,
};
