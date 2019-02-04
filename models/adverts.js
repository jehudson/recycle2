var mongoose = require('mongoose');

module.exports = mongoose.model('posts',{
  id: String,
  username: String,
  location: String,
  email: String,
  messagetype: String,
  shortdescription: String,
  longdescription: String,
  image: {data: Buffer, contentType: String}

});
