var GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../../core/config');

passport.use(new GoogleStrategy({
    clientID: config.secret.google_client_id,
    clientSecret: config.secret.google_client_secret,
    callbackURL: `${config.base_url.backend}/api/auth/user/google/callback`
  },

//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
));