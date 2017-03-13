'use strict';

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const configDB = require('./config/database.js');
const mongoose = require('mongoose');
const app = express();

const host = process.env.IP || '0.0.0.0';
const port = process.env.PORT || 4000;
const sessionSecret = process.env.SESSION_SECRET || 'e70a1e1ee4b8f662f78';

mongoose.connect(configDB.url); // connect to our database

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(express.static(__dirname + '/public'));

// setup session with passport
app.use(session({
    secret: sessionSecret, // session secret
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./config/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// server start
const server = app.listen(port, host, function () {
  console.log(
    'Example app listening at http://%s:%s',
    server.address().address,
    server.address().port
  );
});
