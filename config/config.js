/*jslint node: true */
'use strict';
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const validator = require('validator');

// connect to database
const configDB = require('./database.js');
mongoose.connect(configDB.url); // connect to our database
const Users = require('./models/user.js');
const Event = require('./models/event.js');

const store = new MongoDBStore({
  uri: configDB.url,
  collection: 'sessions',
});

function isLoggedIn(req, res, next) {
	if(res.locals.currentUser) {
		next();
	}
}

module.exports = function (app, host, port, sessionSecret) {

  // Configure our app
  app.use(cookieParser()); // read cookies (needed for auth)
  app.use(bodyParser.json()); // get information from html forms
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

  app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: 'auto',
    },
    store,
  }));

  app.use(function(req, res, next) {;
    if(req.session.userId) {
      Users.findById(req.session.userId, function(err, user) {
        if(!err) {
          res.locals.currentUser = user;
        }
        next();
      });
    }
    else {
      next();
    }
  });

  // routes
  app.get('/', function (req, res) {
  	res.render('index.ejs');
  });

  app.get('/signup', function (req, res) {
  	res.render('signup.ejs');
  });

  app.get('/login', function (req, res) {
  	res.render('login.ejs');
  });

  app.post('/signup', function (req, res) {

    // email validation
    if(!validator.isEmail(req.body.email)) {
  		return res.render('signup.ejs', { errors: 'Invalid email.'});
  	}

    // compare password and passwordConfirmation
    if(req.body.password != req.body.passwordConfirmation) {
      return res.render('signup.ejs', { errors: 'Password does not match.'});
    }

    const newUser = new Users();
  	newUser.name = req.body.name;
  	newUser.email = req.body.email;
  	newUser.hashed_password = req.body.password;

    newUser.save(function(err, user){

      if(user && !err){
        req.session.userId = user._id;
        res.redirect('/');
        return;
    	}

      return res.render('signup.ejs', {errors: 'Cannot register you.'});

    });

  // end of Register post
  });

  app.post('/login', function (req, res) {

    // find user in the database
    const user = Users.findOne({email: req.body.email}, function(err, user) {
  		if(err || !user) {
        res.render('login.ejs', {errors: "Invalid email address"});
  			return;
  		}

      // compare input password with harshed password saved
      user.comparePassword(req.body.password, function(err, isMatch) {
  			if(err || !isMatch){
          res.render('login.ejs', {errors: 'Password does not match.'});
  				return;
  	   		} else {
  				req.session.userId = user._id;
  				res.redirect('/');
  				return;
  		   	}

  		});
  	});

  // end of Log In post

  });

  app.get('/logout', function(req, res){
    req.session.destroy(function(){
      res.redirect('/');
    });
  });

  // Event

  app.post('/event/create', function (req, res) {

  	var newEvent = new Event();
    console.log('Hello');
  	newEvent.owner = res.locals.currentUser;
    newEvent.event_name = req.body.event_name;
    newEvent.event_type = req.body.event_type;
    newEvent.day = req.body.day;
    newEvent.place = req.body.place;
    newEvent.place = req.body.time;

    newEvent.save(function(err, user){

      if(user && !err){
        req.session.userId = user._id;
        res.redirect('/');
        return;
      }
    })

  });

}
