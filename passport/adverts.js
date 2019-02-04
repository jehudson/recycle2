var Advert = require('../models/adverts');
var bCrypt = require('bcrypt-nodejs');

var newAdvert = new Advert(req.body);
newAdvert.username =req.session.user;



console.log('monty', req.session.address);
newAdvert.location = req.session.address;
newAdvert.email = req.session.email;

newAdvert.save()
 .then(item =>{
   req.flash('message', 'Your post has been made successfully');

   res.redirect('/home');


 })
 .catch(err =>{
   res.status(400).send("Unable to save to database");
 });
