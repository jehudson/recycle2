var mongoose = require('mongoose');
var dataTables = require('mongoose-datatables');

var Schema = mongoose.Schema

var PostsSchema = new Schema ({
  id: String,
  timestamp: Date,
  username: String,
  location: String,
  email: String,
  messagetype: String,
  shortdescription: String,
  longdescription: String,
  image_url: String,
  image_id: String,
  expired: { type: Boolean, default: false}
});

PostsSchema.plugin(dataTables);

var posts = mongoose.model('posts', PostsSchema);

module.exports = posts;
