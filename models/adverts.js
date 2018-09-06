var mongoose = require('mongoose');

module.exports = mongoose.model('posts',{
  id: String,
  username: String,
  location: String,
  messagetype: String,
  shortdescription: String,
  longdescription: String
});
