var model  = require('../models/createEvent.js');

function executeCreateEvent(req,res, next) {
  model.createEvent(req, res, next);
}



module.exports = {
  executeCreateEvent : executeCreateEvent
}
