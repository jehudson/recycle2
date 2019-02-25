var express = require('express');
var router = express.Router();
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var moment = require('moment');
var options = {
  auth: {
    api_user: process.env.SENDGRID_USER,
    api_key: process.env.SENDGRID_PASSWORD
  }
}

// Generates hash using bCrypt
var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

var posts = require('../models/posts');

var bCrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var LocalStrategy   = require('passport-local').Strategy;
const multer = require("multer");
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const storage = cloudinaryStorage({
cloudinary: cloudinary,
folder: "tlera",
allowedFormats: ["jpg", "png", "gif"],
transformation: [{ width: 600, height: 400, crop: "limit" }]
});
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const parser = multer({ storage: storage });




var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
    failureFlash: true
	}));


  /* Browse Items */
  router.post('/browse_items', isAuthenticated, function(req, res) {
    posts.dataTables({
      limit: req.body.length,
      find: {expired: false, username: req.session.user},
      skip: req.body.start,
  		order: req.body.order,
      columns: req.body.columns
    }).then(function (table) {
      res.json({
  			data: table.data,
  			recordsFiltered: table.total,
        recordsTotal: table.total
  		}); // table.total, table.data
    });
  });

  /* Recent Posts */
  router.post('/recent_posts', isAuthenticated, function(req, res) {

  	posts.dataTables({
  	   limit: req.body.length,
       find: {expired : false},
  		 find: ({username : req.session.user}),

  	   skip: req.body.start,
  		 order: req.body.order,
  	   columns: req.body.columns
  	 }).then(function (table) {
  	   res.json({
  			data: table.data,
  			recordsFiltered: table.total,
  	    recordsTotal: table.total
  		}); // table.total, table.data
  	});
  });



router.post('/ChangePassword', isAuthenticated, function(req, res) {
	console.log(req.body);

	User.findOneAndUpdate(
		{username: req.session.user},{
			$set: {
			email: req.body.email,
			mobile: req.body.mobile,
			email_alerts: req.body.email_alerts
		}
		}, {
			upsert: true
		}, (err, result) => {
			if (err) return res.send(err)
			console.log(result)
		});
		res.render('index',{message: req.flash('message')});
});

router.get('/ForgotPassword', function(req, res) {

  res.render('change_password', {
    user: req.user
  });

});

router.get('/view_post/:id', function(req, res) {
  posts.findOne({ _id : req.params.id}, function (err, posts) {

    res.render('view_post', {
      posts: posts


    });
  });

});

router.get('/expire_post/:id', function(req, res) {
  posts.findOneAndUpdate(
    {_id: req.params.id},{
      $set: {
      expired: true,
      }
    }, {
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      console.log(result)
    });

    res.render( 'home', {
        user: req.user

       });
})

router.get('/edit_post/:id', function(req, res) {
  posts.findOne({ _id : req.params.id}, function (err, posts) {

    res.render('edit_post', {
      posts: posts
    });
  });
});




router.post('/ForgotPassword', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user)  {

        req.session.sessionFlash = {
          type: 'success',
          message: 'No account with this email address exists'
        }
        return res.redirect(301, '/home');

        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport(sgTransport(options));

      var mailOptions = {
        to: user.email,
        from: 'webmaster@tewkesburylodge.org.uk',
        subject: 'TLERA Recycle Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.session.sessionFlash = {
          type: 'success',
          message: 'An e-mail has been sent to ' + user.email + ' with further instructions.'
        }
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/home');
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {

          req.session.sessionFlash = {
            type: 'success',
            message: 'Password reset token is invalid or has expired.'
          }
          return res.redirect('back');
        }

        user.password = createHash(req.body.password);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
			var smtpTransport = nodemailer.createTransport(sgTransport(options));
      var mailOptions = {
        to: user.email,
        from: 'webmaster@tewkesburylodge.org.uk',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {

        req.session.sessionFlash = {
          type: 'success',
          message: 'Success! Your password has been changed.'
        }
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/ForgotPassword');
    }
    res.render('reset', {
      user: req.user
    });
  });
});

/* my settings */
router.get('/settings', isAuthenticated, function(req, res) {


  posts.find({username: req.session.user, expired: false}, function(err, result) {
    if (err) throw err;
    console.log(result);


    res.render('settings', {
      user: req.user,
      result: result,
      title: "fishballs"
    });
  });

});

/* my settings */
router.get('/ForgotPassword', isAuthenticated, function(req, res) {
  res.render('home', {
        user: req.user
     });
});




	router.post('/new_post', isAuthenticated, parser.single('image_file'), function(req, res){

	console.log(req.file) // to see what is returned to you
	const image_array = {};




  var newAdvert = new posts(req.body);
	try {
		newAdvert.image_url = req.file.url;
	}
	catch(error) {
		newAdvert.image_url = "https://dummyimage.com/50/fafafa/fafafa";
	}
	try {
			newAdvert.image_id = req.file.public_id;
	}
	catch(error) {
		newAdvert.image_id = "";
	}

		newAdvert.username =req.session.user;
	 	console.log('monty', req.session.address);
	 	newAdvert.location = req.session.address;
		newAdvert.email = req.session.email;
		newAdvert.timestamp = new Date;





  newAdvert.save()
		.then(item =>{

    req.flash('success', "Your new post was successful")
		res.redirect('../home');

	 	})
	 	.catch(err =>{
		 	res.status(400).send("Unable to save to database");
	 	});
	});

	router.post('/ChangeDetails', isAuthenticated, function(req, res) {
		console.log(req.body);

		User.findOneAndUpdate(
			{username: req.session.user},{
				$set: {
				email: req.body.email,
				mobile: req.body.mobile,
				email_alerts: req.body.email_alerts
			}
			}, {
				upsert: true
			}, (err, result) => {
	  		if (err) return res.send(err)
				console.log(result)
			});
      req.flash('success', "You have changed your details")
      res.redirect('../home');
		});











	/* GET Registration Page */
	router.get('/signup', function(req, res) {
		res.render('register',  {message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
//		req.flash('success', 'Registration successfully');
    posts.find({username: req.session.user, expired: false}, function(err, user_posts) {
      if (err) throw err;
      console.log(user_posts);


      res.render('home', {
        user: req.user,
        user_posts: user_posts
      });
    });
  });

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

  router.post('/leave-recycle', function(req, res) {
    User.findOneAndDelete(
      {username: req.session.user},
      function(err, result) {
        if (err) return res.send(err)
        console.log(result)
  // deleted at most one tank document

      });


    req.logout();
    res.redirect('/');
  })


	return router;
}
