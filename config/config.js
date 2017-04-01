'use strict';
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const stormpath = require('express-stormpath');

// connect to database
const configDB = require('./database.js');
mongoose.connect(configDB.url); // connect to our database

// require models
const Event = require('./models/event.js');

function loadUserEvents(req, res, next) {
  if(!res.locals.user) {
    return next();
  }

  Event.find( function(err, event) {
      if(!err) {
        res.locals.event = event;
      }
      else {
        res.render('index', { errors: 'Error loading task.'} );
      }
      next();
    }
  );
}

module.exports = function (app, host, port, sessionSecret) {

  // Configure our app
  app.use(cookieParser()); // read cookies (needed for auth)
  app.use(bodyParser.json()); // get information from html forms
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

  // init stormpath
  const stormpathInfo = require('./stormpath.js');
  app.use(stormpath.init(app, {
    apiKey: {
      id: stormpathInfo.id,
      secret: stormpathInfo.secret
    },
    application: {
      href: stormpathInfo.href
    }
  }));

  app.get('/', stormpath.getUser, loadUserEvents, function(req, res) {
    res.render('index');
  });

  // Event

  // Create a new event
  app.post('/event/create', stormpath.getUser, function (req, res) {

  	var newEvent = new Event();
    newEvent.owner_id = res.locals.user.href;
    newEvent.owner = res.locals.user.fullName;
    newEvent.name = req.body.name;
    newEvent.type = req.body.type;
    newEvent.day = req.body.day;
    newEvent.place = req.body.place;
    newEvent.time = req.body.time;

    newEvent.save(function(err, event){

      if(event && !err){
        if(err || !event) {
    			res.render('/', { errors: 'Error saving task to the database.'} );
    		} else {
    			res.redirect('/');
    		}
      }
    });

  });

}
