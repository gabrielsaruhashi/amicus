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

  // Load all active events
  function loadActiveEvents(req, res, next) {
    if(!res.locals.user) {
      return next();
    }
    Event.find( { isCompleted: false }, function(err, activeEvent) {
        if(!err) {
          res.locals.event = activeEvent;
        } else {
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
        } else {
          res.redirect('/');
        }
        next();
      }
    );
  }

  // function add new user extra info
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
    newUser.freeDay = "";
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
        const today = new Date();
        const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        const dateTime = date+' '+time;
        userdata.last_login = dateTime;
        userdata.save();
        next();
      });
    }

  }));

  // Homepage
  app.get('/', stormpath.getUser, loadActiveEvents, loadAllEventTypes, function(req, res) {
    if(!res.locals.user){
        res.render('index');
    }
    else {
      // Load extra user data
      Users.findOne({username:res.locals.user.username}, function (err, userdata) {
        if (!err) {
          res.locals.userdata = userdata;
          res.render('index');
        } else {
          console.log('Error');
        }
      });
    }
  });

    // By Type
    app.get('/search/type/:keyword', stormpath.getUser, function(req, res) {
      if(!res.locals.user){
        res.redirect('/');
      }
      else {
        // return the events matching the requested type
        Event.find({ type: req.params.keyword }, function(err, searchedEvents) {
            if(!err) {
              res.locals.searchedEvents = searchedEvents;
              res.render('search');
            } else {
              res.redirect('/');
            }
        });
      }
    });

    // By Date
    app.get('/search/date/:keyword', stormpath.getUser, function(req, res) {
      if(!res.locals.user){
        res.redirect('/');
      }
      else {
        // return the events matching the requested type
        Event.find({ date: req.params.keyword }, function(err, searchedEvents) {
            if(!err) {
              res.locals.searchedEvents = searchedEvents;
              res.render('search');
            } else {
              res.redirect('/');
            }
        });
      }
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
            userdata.freeDay = req.body.freeDay;
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
      newEvent.date = req.body.date;
      var d = new Date(req.body.date);
      newEvent.day = d.toLocaleString ('en-us', {weekday:'long'});
      newEvent.place = req.body.place;
      newEvent.timeStart = req.body.timeStart;
      newEvent.timeEnd = req.body.timeEnd;
      newEvent.feature = 0;
      newEvent.isCompleted = 0;

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

    // Edit event details
    app.get('/event/edit/:id', stormpath.getUser, loadAllEventTypes, function(req, res) {

      Event.findById(req.params.id, function(err, event) {
        if(err || !event) {
          console.log('Error finding task on database.');
          res.redirect('/');
        }
        else {
          res.locals.event = event;
          if (event.owner_username == res.locals.user.username || "duc158" || "enrico" || "gabrielsarahashi1") {
            res.render('events/edit');
          } else {
            res.redirect ('/event/' + req.params.id);
          }

        }
      });

    });

    app.post('/event/edit/:id', stormpath.getUser, loadAllEventTypes, function(req, res) {

      Event.findById(req.params.id, function(err, event) {
        if(err || !event) {
          console.log('Error finding task on database.');
          res.redirect('/');
        }
        else {
          event.name = req.body.name;
          event.type = req.body.type;
          event.description = req.body.description;
          event.place = req.body.place;
          event.date = req.body.date;
          var d = new Date(req.body.date);
          event.day = d.toLocaleString ('en-us', {weekday:'long'});
          event.timeStart = req.body.timeStart;
          event.timeEnd = req.body.timeEnd;
          event.save();
          res.locals.event = event;
          res.render('events/edit');
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
    			res.redirect('back');
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
          res.redirect('back');
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
          res.redirect('back');
        }
        else {
          eventToJoin.member_username.pull(res.locals.user.username);
          eventToJoin.member_name.pull(res.locals.user.fullName);
          eventToJoin.save();
          res.redirect('back');
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
        if(res.locals.user.username == "duc158" || "enrico" || "gabrielsarahashi1") {
          res.render('admin/admin');
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
        			console.log('Error saving event type to the database.');
              res.redirect('/admin');
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

      // Complete an event
      app.post('/event/complete/:id', stormpath.getUser, function(req, res) {

        Event.findById(req.params.id, function(err, completedEvent) {
          if(err || !completedEvent) {
            console.log('Error finding event on database.');
            res.redirect('/admin');
          }
          else {
            completedEvent.completeEvent();
            res.redirect('/admin');
          }
        });
      });
}
