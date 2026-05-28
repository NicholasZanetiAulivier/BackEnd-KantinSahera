const passport = require('passport');
const config = require('../../core/config');
const userService = require('../endpoints/auth/user/service');
const adminService = require('../endpoints/auth/admin/service');
const jwtService = require('../endpoints/auth/token/service');
const { errorResponder, errors } = require('../../core/errors');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { userPayload, adminPayload } = require('../../utils/jwt-payload');
const { parseUserId, parseAdminId } = require('../../utils/id-parser');
const { logger } = require('../../core/logger')
const jwt = require('jsonwebtoken');

// invalidJti = async (jti) => {
//     const invalid = await jwtService.isInvalidJti(jti);

//     if (invalid) throw errorResponder(errors.INVALID_TOKEN, "Token yang diberikan tidak valid!");
// }

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                // await invalidJti(payload.jti);

                const user = userPayload(await userService.findById(parseUserId(payload.user_id)));

                return done(null, { ...user, exp: payload.exp, jti: payload.jti } || false);
            } catch (err) {
                logger.error('Error di User JWT', { err })
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
                // await invalidJti(payload.jti);

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
                // await invalidJti(payload.jti);

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

const passportUserJwt = (req, res, next) => {
    passport.authenticate('user', { session: false }, function (err, user, info) {
        if (err) throw err;
        if (!user) {
            throw errorResponder(errors.UNAUTHORIZED);
        }

        req.user = user;

        return next();
    })(req, res, next);
}
const passportAdminJwt = (req, res, next) => {
    passport.authenticate('admin', { session: false }, function (err, user, info) {
        if (err) throw err;
        if (!user) {
            throw errorResponder(errors.UNAUTHORIZED);
        }

        req.user = user;

        return next();
    })(req, res, next);
}
const passportSuperJwt = (req, res, next) => {
    passport.authenticate('superadmin', { session: false }, function (err, user, info) {
        if (err) throw err;
        if (!user) {
            throw errorResponder(errors.UNAUTHORIZED);
        }

        req.user = user;

        return next();
    })(req, res, next);
}

const userOptionalAuth = (req, res, next) => {
    passport.authenticate('user', { session: false }, function (err, user, info) {
        if (err) throw err;
        if (user) {
            req.user = user;
        }

        return next();
    })(req, res, next);
};

const adminOptionalAuth = (req, res, next) => {
    passport.authenticate('admin', { session: false }, function (err, admin, info) {
        if (err) throw err;
        if (admin) {
            req.admin = admin;
        }

        return next();
    })(req, res, next);
};

// default attach ke req.user
const adminOrUser = (req, res, next) => {
    passport.authenticate(['admin', 'user'], { session: false }, function (err, user, info) {
        if (err) throw err;
        if (!user) {
            throw errorResponder(errors.UNAUTHORIZED);
        }

        req.user = user;

        return next();
    })(req, res, next);
}

// you MUST mount this after passport middleware
function isAccountVerified(req, res, next) {
    try {
        const message = "Anda tidak diizinkan mengakses fitur ini karena email Anda belum terverifikasi!";
        const account = req.user;

        // undefined anggap 401 aja
        if (!account) throw errorResponder(errors.ACCOUNT_UNVERIFIED, message);

        if (!account.verified) throw errorResponder(errors.ACCOUNT_UNVERIFIED, message);

        return next();
    } catch (err) {
        return next(err);
    }
}

module.exports = {
    passportUserJwt,
    passportAdminJwt,
    passportSuperJwt,
    userOptionalAuth,
    adminOptionalAuth,
    adminOrUser,
    isAccountVerified
};
