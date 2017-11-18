const router = require('express').Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { ensureAuthenticated } = require('../helpers/auth');

// Load the UserSchema.
require('../models/User');
// Then access it via mongoose.model and save it into a variable.
const User = mongoose.model('users');

router.get('/login', (req, res) => {
  res.render('login');
});

router.post('/login', (req, res, next) => {
  // Some validation, error checking and insert attack protection.
  // use passport to check the user login and the setup a logged in session.
  passport.authenticate('local', {
    successRedirect: '/ideas',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next); // Remember to immediately invoke this passport function and pass it the request, response and next args.
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', (req, res) => {
  // Some validation and error checking.
  let errors = []; // This will be filled up with error objects.
  // Check if the user confirmed password.
  if (req.body.password !== req.body.confirmPassword) {
    errors.push({ message: "Your passwords did not match. Please try again" });
  }
  // Is password long enough? In real deploy this would also check password strength.
  if (req.body.password.length < 6) {
    errors.push({ message: "Your password should be at least 6 characters long"} );
  }

  if (errors.length > 0) {
    res.render('register', {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      errors: errors });
  } else {
    // Also check if the email is already registered in the database.
    // Continue the verification process only after the mongoose Promise has fulfilled and triggered .then().
    User.findOne({ email: req.body.email })
      .then((user) => {
        // If the user already exists the send them back to the register page with an error message.
        if (!user) {
          // Encrypt data and send it to the database. Then re-direct to a new account landing page.
          // Use bycrypt to generate a salt and then a hash.
          bcrypt.genSalt(14, (err,salt) => {
            bcrypt.hash(req.body.password, salt, (err, hash) => {
              if (err) throw err;
              // You now have a salted hash which you can save to the database.
              let newUser = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                password: hash
              });
              // The mongoose .save() returns a Promise that will be fulfilled once the database has been written to.
              newUser.save()
                .then((user) => {
                  req.flash('success_msg', `Thank you for registering, ${user.firstName}. You can now log in!`);
                  res.redirect('/users/login');
                })
                .catch((err) => {
                  if (err) throw err;
                  req.flash('error_msg', 'Sorry, there was a problem registering your account. Please try again or contact us.');
                  res.redirect('/users/register');
                })
            })
          });
        } else {
          console.log('User already exists');
          req.flash('error_msg', 'This email address has already been registered. Please try a different email.');
          res.redirect('/users/register');
        }
      })
      .catch((err) => {if (err) throw err;} )
  }
});

// The middleware helper function here will avoid weird errors if the user types this route directly
// into the url bar when they are not logged in.
router.get('/logout', ensureAuthenticated, (req, res) => {
  // Extra check to avoid crashes if the req.user attribute does not exist for some reason.
  if (req.user) {
    req.flash('success_msg', `See you again soon, ${req.user.firstName}.`)
  }
  req.logout();
  res.redirect('/users/login');
});

module.exports = router;
