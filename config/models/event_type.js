const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventTypeSchema = new Schema({
  name: String
});

module.exports = mongoose.model('eventType', eventTypeSchema);
