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
  owner: stringField,
  name: stringField,
  type: stringField,
  place: stringField,
  date: stringField,
  member_id: [String],
  member_name: [String]
});

module.exports = mongoose.model('Events', EventSchema);