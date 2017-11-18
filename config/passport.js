const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load the UserSchema.
require('../models/User');
const User = mongoose.model('users');

const initializePassport = (passport) => {
  passport.use( new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
  }, (req, email, password, done) => {
    // This is where you customise the user database checking and the redirects / messages etc.
    // First check that a user exists.
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          return done(null, false, { message: `Sorry, there is no account with the email ${email}.` });
        }
        // Then check the password using bcrypt....args: inputted password / hashed password / callback function.
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (isMatch) {
            req.flash('success_msg', `Hi ${user.firstName}, what ideas do you have today?`);
            return done(null, user);
          } else {
            req.flash('form_email', email);
            return done(null, false, { message: 'Sorry, the password you have entered does not match that email address.' })
          }
        })
      });
  }));
  // You also want to add the following serialization functions to the passport instance when you are initializing it.
  // These will be used during the users session for authentication, rather than having to resend all the user data every time.
  // Uses a cookie.
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
}

module.exports = initializePassport;
