'use strict';

// require dependencies
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const validator = require('validator');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

// connect to database
const configDB = require('./config/database.js');
mongoose.connect(configDB.url); // connect to our database
const Users = require('./models/user.js');

// setup app
const app = express();
const host = process.env.IP || '0.0.0.0';
const port = process.env.PORT || 4000;

const sessionSecret = process.env.SESSION_SECRET || 'e70a1e1ee4b8f662f78';

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(express.static(__dirname + '/public'));

// Configure our app
const store = new MongoDBStore({
  uri: configDB.url,
  collection: 'sessions',
});

app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(session({
  secret: 'thisisasecretsession',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: 'auto',
  },
  store,
}));

function isLoggedIn(req, res, next) {
	if(res.locals.currentUser) {
		next();
	}
}

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

app.get('/', function (req, res) {
	res.render('index.ejs');
});

app.get('/signup', function (req, res) {
	res.render('signup.ejs');
});

app.get('/login', function (req, res) {
	res.render('login.ejs');
});

app.post('/user/register', function (req, res) {
  if(!validator.isEmail(req.body.email)) {
		return res.render('index.ejs', { errors: 'Bad email'});
	}

  if(req.body.email.length < 1 || req.body.email.length > 50) {
		return res.render('index.ejs', { errors: 'Bad email'});
	}

  if(req.body.name.length < 1 || req.body.name.length > 50) {
    return res.render('index.ejs', { errors: 'Bad name'});
  }

  if(req.body.password.length < 1 || req.body.password.length > 50) {
    return res.render('index.ejs', { errors: 'Bad password'});
  }

  var newUser = new Users();
	newUser.name = req.body.name;
	newUser.email = req.body.email;
	newUser.hashed_password = req.body.password;

  newUser.save(function(err, user){

    if(user && !err){
      req.session.userId = user._id;
      res.redirect('/');
      return;
  	}
  	var errors = "Error registering you.";

  });

// end of Register post

});

app.post('/user/login', function (req, res) {
	var user = Users.findOne({email: req.body.email}, function(err, user) {
		if(err || !user) {
      console.log('Invalid email address');
      res.redirect('/login');
      // res.render('index.ejs', {errors: "Invalid email address"});
			return;
		}

    user.comparePassword(req.body.password, function(err, isMatch) {
			if(err || !isMatch){
        console.log('Invalid passowrd');
        res.redirect('/login');
        //res.render('index.ejs', {errors: 'Invalid password'});
				return;
	   		}
		   	else{
				req.session.userId = user._id;
				res.redirect('/');
				return;
		   	}

		});
	});

// end of Log In post

});

app.get('/user/logout', function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
});

// server start
const server = app.listen(port, host, function () {
  console.log(
    'Example app listening at http://%s:%s',
    server.address().address,
    server.address().port
  );
});
