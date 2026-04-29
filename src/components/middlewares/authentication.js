const passport = require('passport');
const passportJwt = require('passport-jwt');
const config = require('../../core/config');
const userRepository = require('../../components/endpoints/auth/user/repository');

passport.use(
    'user',
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: config.secret.user,
        },

        async (payload, done) => {
            try {
                const user = await userRepository.findEmail(payload.email);
                return done(null, user || false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

const passportUserJwt = passport.authenticate('user', {session: false});

module.exports = {
    passportUserJwt,
}
