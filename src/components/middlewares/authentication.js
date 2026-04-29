const passport = require('passport');
const config = require('../../core/config');
const userService = require('../../components/endpoints/auth/user/service');
const adminService = require('../../components/endpoints/auth/admin/service');
const { errorResponder, errors } = require('../../core/errors');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                // destructure to return non sensitive data
                const {username, email} = await userService.findByEmail(payload.email);
                return done(null, {username, email} || false);
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
                const {email, super_admin} = await adminService.findByEmail(payload.email); 
                
                return done(null, {email, super_admin} || false);
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

                if (!(admin.super_admin && payload.super_admin)) 
                    throw errorResponder(errors.INVALID_CREDENTIALS, "Admin bukan super admin!");

                return done(null, {email: admin.email, super_admin: admin.super_admin} || false);
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
