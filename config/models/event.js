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
  description: stringField,
  place: stringField,
  day: stringField,
  date: stringField,
  timeStart: stringField,
  timeEnd: stringField,
  member_username: [String],
  member_name: [String],
  feature: Boolean,
  isCompleted: Boolean,
});

//This method will be responsible for task completion.
EventSchema.methods.completeEvent = function(err) {
	if(!err) {
		this.isCompleted = !(this.isCompleted);
		this.save();
	}
	else {
		console.log('Error completing an event.');
	}
	return;
};

module.exports = mongoose.model('Events', EventSchema);
