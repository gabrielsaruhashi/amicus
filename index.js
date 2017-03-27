'use strict';

// require dependencies
const express = require('express');
const config = require('./config/config.js');

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
  res.render('newevent.ejs');
});
