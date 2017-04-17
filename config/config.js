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
const eventType = require('./models/event_type.js');

  // Load all events
  function loadAllEvents(req, res, next) {
    if(!res.locals.user) {
      return next();
    }

    Event.find( function(err, event) {
        if(!err) {
          res.locals.event = event;
        }
        else {
          res.redirect('/');
        }
        next();
      }
    );
  }

  // Load all event type
  function loadAllEventTypes(req, res, next) {
    if(!res.locals.user) {
      return next();
    }

    eventType.find( function(err, eventType) {
        if(!err) {
          res.locals.types = eventType;
        }
        else {
          res.redirect('/');
        }
        next();
      }
    );
  }

  // Load all events that the user created
  function loadUserEvents(req, res, next) {
    if(!res.locals.user) {
      return next();
    }
    Event.find({ $or:[
			{owner_username: res.locals.user.username},
			{member_username: { "$in" : [res.locals.user.username] } }
		]}, function(err, userevent) {
        if(!err) {
          res.locals.userevent = userevent;
        }
        else {
          res.redirect('/');
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
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date+' '+time;
      newUser.last_login = dateTime;
      newUser.events_joined = 0;
      newUser.events_created = 0;

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
    postRegistrationHandler: addNewUser,
    postLoginHandler: function (account, req, res, next) {
    Users.findOne({username:account.username}, function (err,userdata) {
      if(err || !userdata) {
            console.log('Error saving task to the database.');
      }
      var today = new Date();
      var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
      var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var dateTime = date+' '+time;
      userdata.last_login = dateTime;
      userdata.save();
    next();
    });
  }

  }));

  app.get('/', stormpath.getUser, loadAllEvents, loadAllEventTypes, function(req, res) {
    res.render('index');
  });

  // User

    // Show the profile page
    app.get('/:username/profile', stormpath.getUser, function (req, res) {
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
            res.render('users/profile', {'userid':req.user.username});
          }
          else
          {
            res.redirect('/');// handle error
          }
        });
      }
    });

    // Edit the profile page
    app.post('/:username/profile/edit', stormpath.getUser, function (req, res) {

      Users.findOne({username:req.body.username}, function (err, userdata) {
          if (err) {
            console.log('error');
          }
          if(userdata != null)
          {
            userdata.college = req.body.college;
            userdata.classyear = req.body.classyear;
            userdata.phone = req.body.phone;
            userdata.interests = req.body.interests;
            userdata.save();
            res.locals.userdata = userdata;
            res.render('users/profile', {'userid':req.body.username});
          }
          else
          {
            console.log('error');
            res.redirect('/');
          }
        });
    });

    // Show the user event
    app.get('/:username/event', stormpath.getUser, loadUserEvents, function (req, res) {
      if(!res.locals.user){
        res.redirect('/');
      } else {
        res.render('users/event');
      }
    });

  // Event

    // Create a new event
    app.get('/event/create', stormpath.getUser, loadAllEvents, loadAllEventTypes, function(req, res) {
      if(!res.locals.user){
        res.redirect('/');
      } else {
        res.render('events/create');
      }
    });

    app.post('/event/create', stormpath.getUser, function (req, res) {

    	var newEvent = new Event();
      newEvent.owner_id = res.locals.user.href;
      newEvent.owner_username = res.locals.user.username;
      newEvent.owner = res.locals.user.fullName;
      newEvent.name = req.body.name;
      newEvent.type = req.body.type;
      newEvent.description = req.body.description;
      newEvent.day = req.body.day;
      newEvent.place = req.body.place;
      newEvent.time = req.body.time;
      newEvent.feature = 0;

      newEvent.save(function(err, event){

        if(event && !err){
          if(err || !event) {
      			res.render('/', { errors: 'Error saving task to the database.'} );
      		} else {
      			res.redirect('/');
      		}
        }
      });

      Users.findOne({username:res.locals.user.username}, function (err,userdata) {
        if(err || !userdata) {
              console.log('Error saving task to the database.');
        }
        userdata.events_created = userdata.events_created + 1;
        userdata.save();
      });
    });

    // Show event details
    app.get('/event/:id', stormpath.getUser, function(req, res) {

      Event.findById(req.params.id, function(err, event) {
    		if(err || !event) {
    			console.log('Error finding task on database.');
    			res.redirect('/');
    		}
    		else {
    			res.locals.event = event;
    			res.render('events/detail');
    		}
    	});

    });

    // Delete an event
    app.get('/event/delete/:id', stormpath.getUser, function(req, res) {

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

      Users.findOne({username:res.locals.user.username}, function (err,userdata) {
        if(err || !userdata) {
              console.log('Error saving task to the database.');
        }
        userdata.events_created = userdata.events_created - 1;
        userdata.save();
      });
    });

    // Join an event
    app.get('/event/join/:id', stormpath.getUser, function(req, res) {

      Event.findById(req.params.id, function(err, eventToJoin) {
        if(err || !eventToJoin) {
          console.log('Error finding task on database.');
          res.redirect('/');
        }
        else {
          eventToJoin.member_username.push(res.locals.user.username);
          eventToJoin.member_name.push(res.locals.user.fullName);
          eventToJoin.save();
          res.redirect('/');
        }
      });
      Users.findOne({username:res.locals.user.username}, function (err,userdata) {
        if(err || !userdata) {
              console.log('Error saving task to the database.');
        }
        userdata.events_joined = userdata.events_joined + 1;
        userdata.save();
      });

    });

    // Withdraw from an event
    app.get('/event/withdraw/:id', stormpath.getUser, function(req, res) {

      Event.findById(req.params.id, function(err, eventToJoin) {
        if(err || !eventToJoin) {
          console.log('Error finding task on database.');
          res.redirect('/');
        }
        else {
          eventToJoin.member_username.pull(res.locals.user.username);
          eventToJoin.member_name.pull(res.locals.user.fullName);
          eventToJoin.save();
          res.redirect('/');
        }
      });

      Users.findOne({username:res.locals.user.username}, function (err,userdata) {
        if(err || !userdata) {
              console.log('Error saving task to the database.');
        }
        userdata.events_joined = userdata.events_joined - 1;
        userdata.save();
      });

    });

    // Admin function

      // Admin page
      app.get('/admin', stormpath.getUser, loadAllEvents, loadAllEventTypes, function(req, res) {
        if(res.locals.user.username == "duc158" || "enrico" || "gabriel") {
          res.render('admin');
        } else {
          res.redirect('/');
        }
      });

      // Create new event type
      app.post('/admin/event/type/add', stormpath.getUser, function (req, res) {

      	var newEventType = new eventType();
        newEventType.name = req.body.name;

        newEventType.save(function(err, event){

          if(event && !err){
            if(err || !event) {
        			res.render('/admin', { errors: 'Error saving task to the database.'} );
        		} else {
        			res.redirect('/admin');
        		}
          }
        });
      });

      // Feature an event
      app.post('/event/feature/:id', stormpath.getUser, function(req, res) {

        Event.findById(req.params.id, function(err, eventToFeature) {
          if(err || !eventToFeature) {
            console.log('Error finding task on database.');
            res.redirect('/admin');
          }
          else {
            eventToFeature.feature = 1 - eventToFeature.feature;
            eventToFeature.save();
            res.redirect('/admin');
          }
        });

      });


}
