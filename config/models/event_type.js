const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const EventTypeSchema = new Schema({
  type: String
});

module.exports = mongoose.model('EventTypes', EventTypeSchema);
