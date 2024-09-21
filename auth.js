const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./db'); // Assurez-vous d'importer votre pool de connexion à la base de données
require('dotenv').config();

// Configure Passport to use Google OAuth 2.0
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        user = await pool.query('INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *', [email, profile.displayName]);
        user = user.rows[0]; // Assurez-vous de définir user ici
      } else {
        user = user.rows[0]; // Assurez-vous de définir user ici
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));

// Serialize user into the sessions
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      done(null, user.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });

module.exports = passport;