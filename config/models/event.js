// const UserSchema = require('./user.js');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const stringField = {
  type: String,
  minlength: 1,
  maxlength: 500
};

const EventSchema = new Schema({
  owner: ObjectId,
  event_name: stringField,
  event_type: stringField,
  place: stringField,
  date: stringField
});

module.exports = mongoose.model('Events', EventSchema);
