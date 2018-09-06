var Advert = require('../models/adverts');
var bCrypt = require('bcrypt-nodejs');

var newAdvert = new Advert();

newAdvert.message-type =req.param('message-type');
newAdvert.shortdescription =req.param('shortdescription');
newAdvert.longdescription =req.param('longdescription');

// save the Advert
newAdvert.save(function(err) {
    if (err){
        console.log('Error in Saving Advert: '+err);
        throw err;
    }
    console.log('Advert added succesfully');
    return done(null, newAdvert);
});
