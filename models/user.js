var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  id: String,
  fullname: String,
  username: String,
  password: String,
  email: String,
  email_alerts: String,
  location: String,
  mobile: String
});
