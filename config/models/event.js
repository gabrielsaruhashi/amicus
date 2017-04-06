// const UserSchema = require('./user.js');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stringField = {
  type: String,
  minlength: 1,
  maxlength: 500
};

const EventSchema = new Schema({
  owner_id: stringField,
  owner_username: stringField,
  owner: stringField,
  name: stringField,
  type: stringField,
  place: stringField,
  day: stringField,
  time: stringField,
  member_username: [String],
  member_name: [String],
  feature: Boolean,
});

module.exports = mongoose.model('Events', EventSchema);
