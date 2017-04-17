const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stringField = {
  type: String,
  minlength: 0,
  maxlength: 500
};

const UserSchema = new Schema({
  username: stringField,
  type: stringField,
  firstname: stringField,
  lastname: stringField,
  email: stringField,
  college: stringField,
  classyear: stringField,
  phone: stringField,
  interests: stringField,
  last_login: stringField,
  events_joined: Number,
  events_created: Number
});

module.exports = mongoose.model('User', UserSchema);
