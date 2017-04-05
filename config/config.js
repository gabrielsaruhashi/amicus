'use strict';
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const stormpath = require('express-stormpath');

// connect to database
const configDB = require('./database.js');

mongoose.Promise = global.Promise;
mongoose.connect(configDB.url); // connect to our database

// require models
const Event = require('./models/event.js');

const Users = require('./models/userdata.js');

function loadAllEvents(req, res, next) {
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

function addNewUser(account, req, res, next){

      var newUser = new Users();
      newUser.username = account.username;
      newUser.firstname = account.givenName;
      newUser.lastname = account.surname;
      newUser.email = account.email;
      newUser.college = "";
      newUser.classyear = "";
      newUser.phone = "";
      newUser.interests = "";

      newUser.save(function(err, userdata){

          if(err || !userdata) {
            console.log('Error saving task to the database.');
      		} else {
      		  console.log('New User: '+userdata.username);
      		}
      });
      next();
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
    web: {
      register: {
        form: {
          fields: {
            username: {
              enabled: true
            }
          }
        }
      }
    },
    apiKey: {
      id: stormpathInfo.id,
      secret: stormpathInfo.secret
    },
    application: {
      href: stormpathInfo.href
    },
    postRegistrationHandler: addNewUser
  }));

  app.get('/', stormpath.getUser, loadAllEvents, function(req, res) {
    res.render('index');
  });

  app.get('/event/create', stormpath.getUser, loadAllEvents, function(req, res) {
    if(!res.locals.user){
      res.redirect('/');
    } else {
      res.render('create_event');
    }
  });

  app.get('/profile/:username', stormpath.getUser, function (req, res) {
    if(!res.locals.user){
      res.redirect('/');
    } else {
      Users.findOne({username:req.params.username}, function (err, userdata) {
        if (err) {
          res.redirect('/');// handle error
        }
        if(userdata != null)
        {
          res.locals.userdata = userdata;
          res.render('profile', {'userid':req.user.username});
        }
        else
        {
          res.redirect('/');// handle error
        }
      });
    }
  });

  app.post('/profile/edit', stormpath.getUser, function (req, res) {

    Users.findOne({username:req.body.username}, function (err, userdata) {
        if (err) {
          console.log('error');
        }
        if(userdata != null)
        {
          userdata.classyear = req.body.classyear;
          userdata.college = req.body.college;
          userdata.phone = req.body.phone;
          userdata.interests = req.body.interests;
          userdata.save();
          res.locals.userdata = userdata;
          res.render('profile', {'userid':req.body.username});
        }
        else
        {
          console.log('error');
          res.redirect('/');
        }
      });
  });


  // Event

  // Create a new event
  app.post('/event/create', stormpath.getUser, function (req, res) {

  	var newEvent = new Event();
    newEvent.owner_id = res.locals.user.href;
    newEvent.owner_username = res.locals.user.username;
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

  // Delete an event
  app.post('/event/delete/:id', function(req, res) {

    Event.findById(req.params.id, function(err, eventToRemove) {
  		if(err || !eventToRemove) {
  			console.log('Error finding task on database.');
  			res.redirect('/');
  		}
  		else {
  			eventToRemove.remove();
  			res.redirect('/');
  		}
  	});
  });

  // Join an event
  app.post('/event/join/:id', stormpath.getUser, function(req, res) {

    Event.findById(req.params.id, function(err, eventToJoin) {
      if(err || !eventToJoin) {
        console.log('Error finding task on database.');
        res.redirect('/');
      }
      else {
        eventToJoin.member_id.push(res.locals.user.href);
        eventToJoin.member_name.push(res.locals.user.fullName);
        eventToJoin.save();
        res.redirect('/');
      }
    });

  });

  // Withdraw from an event
  app.post('/event/withdraw/:id', stormpath.getUser, function(req, res) {

    Event.findById(req.params.id, function(err, eventToJoin) {
      if(err || !eventToJoin) {
        console.log('Error finding task on database.');
        res.redirect('/');
      }
      else {
        eventToJoin.member_id .pull(res.locals.user.href);
        eventToJoin.member_name.pull(res.locals.user.fullName);
        eventToJoin.save();
        res.redirect('/');
      }
    });

  });

}
