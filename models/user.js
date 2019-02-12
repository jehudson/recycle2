var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  id: String,
  fullname: String,
  username: String,
  password: String,
  email: String,
  email_alerts: Boolean,
  location: String,
  mobile: String
});
