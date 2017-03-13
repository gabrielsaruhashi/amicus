'use strict';

const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const routes = require('./controllers/routes.js')

app.set('view engine', 'ejs'); // set up ejs for templating
app.use(express.static(__dirname + '/public'));

app.get('/', routes.home);

// server start
app.listen(port);
console.log('The magic happens on port ' + port);
