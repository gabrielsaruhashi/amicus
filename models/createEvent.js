const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');

const Events = require('./models/events.js');
// connect to database
const configDB = require('./database.js');
mongoose.connect(configDB.url); // connect to our database

const store = new MongoDBStore({
  uri: configDB.url,
  collection: 'events',
});

function CreateEvent(callback){
  const newEvent = new Events();
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
  }
}

module.exports = {
  createEvent: CreateEvent
};
