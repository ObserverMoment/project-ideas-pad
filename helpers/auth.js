// This will export an object of helper functions which you can use throughout your app.
module.exports = {
  ensureAuthenticated: (req, res, next) => {
    // When using passport you have access to an isAuthenticated method on the req object. It returns true if the user is logged in.
    if (req.isAuthenticated()) {
      // If the user is logged in then they can view this page and you can call the next middleware with next().
      next();
    } else {
      // If they are not logged in, send them to the login page with a message displaying explaining why.
      req.flash('error_msg', 'Please log in or register to view this page');
      res.redirect('/users/login');
    }
  }
}
