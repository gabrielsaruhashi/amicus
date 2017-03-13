/*jslint node: true */

'use strict';
module.exports = function(app, passport) {

    // home page
    app.get('/', function(req, res) {
        res.render('index.ejs', {signupMessage: ''});
    });

    // SIGNUP =================================
    // process the signup form
    app.post('/signup', function (req, res) {

      var newUser = new User();
      newUser.name = req.body.name;
      newUser.email = req.body.email;
      newUser.password = newUser.generateHash(req.body.password);

      newUser.save(function(err) {
          if (err)
              return done(err);

          return done(null, newUser);
      });

    });

    // login
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/task', // redirect to the secure  section
        failureRedirect : '/', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // logout
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/profile', isLoggedIn, function(req, res) {
      res.render('profile.ejs', {});
    });

    // route middleware to ensure user is logged in
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated())
            return next();
        res.redirect('/#signin');
    }

};
