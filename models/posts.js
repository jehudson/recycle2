var mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');

var Schema = mongoose.Schema

var PostsSchema = new Schema ({
  id: String,
  timestamp: String,
  username: String,
  location: String,
  email: String,
  messagetype: String,
  shortdescription: String,
  longdescription: String,
  image: {data: Buffer, contentType: String}
});

PostsSchema.plugin(dataTables);

var posts = mongoose.model('posts', PostsSchema);

module.exports = posts;
