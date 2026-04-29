const passport = require('passport');
const passportJwt = require('passport-jwt');
const JwtStrategy = passportJwt.Strategy;
const ExtractJwt = passportJwt.ExtractJwt;
const config = require('../../core/config');
const userService = require('../../components/endpoints/auth/user/service');
const adminService = require('../../components/endpoints/auth/admin/service');
const { errorResponder, errors } = require('../../core/errors');

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                const user = await userService.findByEmail(payload.email);
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
                const admin = await adminService.findByEmail(payload.email); 0
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
                const admin = await adminService.findByEmail(payload.email);
                console.log(admin);
                if (!(admin.super_admin && payload.super_admin)) throw errorResponder(errors.INVALID_CREDENTIALS, "Admin bukan super admin!");
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

module.exports = {
    passportUserJwt,
    passportAdminJwt,
    passportSuperJwt,
};
