const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 

module.exports = function(passport) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      proxy: true
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          return done(null, user);
        } else {
          const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(randomPassword, salt);

          user = await User.create({
            username: profile.displayName,
            email: profile.emails[0].value,
            password: hashedPassword,
            isVerified: true,
          });
          
          return done(null, user);
        }
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  ));
};