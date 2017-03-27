const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const stringField = {
  type: String,
  minlength: 1,
  maxlength: 50,
};

const EventSchema = new Schema({
  event_id: {
    type: Number,
    minlength: 1,
    maxlength: 50,
  };
  event_name: stringField
  event_type: stringField,
  place: stringField,
  date: stringField
});


module.exports = mongoose.model('Events', UserSchema);
