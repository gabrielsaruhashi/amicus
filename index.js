'use strict';

// require dependencies
const express = require('express');
const config = require('./config/config.js');

// require controller
var createEventController = require('./controllers/createEventController.js');

// setup app
const app = express();
const host = process.env.IP || '0.0.0.0';
const port = process.env.PORT || 4000;
const sessionSecret = process.env.SESSION_SECRET || 'e70a1e1ee4b8f662f78';

config(app, host, port, sessionSecret);

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(express.static(__dirname + '/public'));

// server start
const server = app.listen(port, host, function () {
  console.log(
    'Example app listening at http://%s:%s',
    server.address().address,
    server.address().port
  );
});
app.get('/newevent', function (req, res) {
  res.render('createevent.ejs');
});

app.post('/newevent', function (req, res) {
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
  })

});
