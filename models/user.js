var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
  id: String,
  fullname: String,
  username: String,
  password: String,
  email: String,
  location: String
});
