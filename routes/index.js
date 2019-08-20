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


var Recaptcha = require('express-recaptcha').RecaptchaV2;
//import Recaptcha from 'express-recaptcha'
//var recaptcha = new Recaptcha('6Lcn1a8UAAAAAHci69EG8dE0NoqhCzBdRQkNVTmo', '6Lcn1a8UAAAAAMA7BwF32-ivOfdm7ncKE747aw51');
var recaptcha = new Recaptcha('6LdDD6AUAAAAAH4FF4f5p1qDbHvnOiOKPxzlDSWk', '6LdDD6AUAAAAAEykpL8LoSEhjCb10jm-t9dX12Ij');



var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler
	// Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  
	if (req.isAuthenticated())
		return next();
  // if the user is not authenticated then redirect him to the login page
  req.session.returnTo = req.path;
	res.redirect( `/` );
}






module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
      res.render('index', { message: req.flash('message') });
	});

	
	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {failureRedirect: '/',
  failureFlash: true}), function(req, res) {
    res.redirect(req.session.returnTo || '/home');
		delete req.session.returnTo;
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

router.post('/change_post/:id', function(req, res) {
  posts.findOneAndUpdate(
    {_id: req.params.id},{

      $set: {
        shortdescription: req.body.shortdescription,
        longdescription: req.body.longdescription
      }
    }, {
      upsert: true
    }, (err, result) => {
      if (err) return res.send(err)
      console.log(result)
      req.flash('success', 'Your post has been updated');
      return res.redirect( '/home');
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
        req.flash('success', ' Your post has been removed');
      return res.redirect( '/home');
    });


});

router.get('/edit_post/:id', function(req, res) {
  posts.findOne({ _id : req.params.id}, function (err, posts) {

    res.render('edit_post', {
      posts: posts
    });
  });
});

router.get('/respond_post/:id',  isAuthenticated, function(req, res) {
  posts.findOne({ _id : req.params.id}, function (err, posts) {

    res.render('respond_post', {
      posts: posts
    });
  });
});

router.get('/respond_post_email/:id',  isAuthenticated, function(req, res) {
  posts.findOne({ _id : req.params.id}, function (err, posts) {

    res.render('respond_post_email', {
      posts: posts
    });
  });
});

const {check, validationResult} = require('express-validator');

router.post('/reset_password', isAuthenticated, [
  check('password', 'Password must have at least eight characters').not().isEmpty().isLength({min: 5}),
  check('confirm', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
],  (req, res, done) => {
  const errors = validationResult(req);
  

  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.array());
  
  } else {
   
    User.findOne({username: req.session.user}, function(err, user) {
      if (!user) {

        req.session.sessionFlash = {
          type: 'error',
          message: 'Something has gone wrong'
        }
        return res.redirect('back');
      }
      user.password = createHash(req.body.password);
      
      user.save(function (err) {
        if(err) {
          req.flash('error', 'Your password could not be changed, please try again')
        }
      });
      req.flash('success', ' Your password has been changed');
      res.send({});

    });
  
    
    
    
  
  }

    
  
});





router.post('/post_enquiry/:id', isAuthenticated, function(req, res, done) {
  posts.findOne({_id : req.params.id}, function (err, posts) {

    var post_id = req.params.id
    var smtpTransport = nodemailer.createTransport(sgTransport(options));
    var mailOptions = {
      to: posts.email,
      from: 'webmaster@tewkesburylodge.org.uk',
      subject: req.body.subject,
      text: req.body.postenquiry + '\n\n Please reply directly to ' + req.session.email,
      html: req.body.postenquiry + "<br><br> <p>Please reply directly to " + req.session.email + "</p><p>Regards<br/>TLERA Webmaster"
    };
    smtpTransport.sendMail(mailOptions, function(err) {
      done(err, 'done');
    })
    
    delete req.session.returnTo;
    req.flash('success', ' An email has been sent in response to your enquiry');
    
    return res.redirect('/home');
    

  });

  
});

router.get('/email_alerts/:id', isAuthenticated, function(req, res, done) {
  posts.findOne({_id : req.params.id}, function (err, posts) {
    User.find({"email_alerts": "on"}, ).then(function(users) {
      users.forEach(function(user) {
        var smtpTransport = nodemailer.createTransport(sgTransport(options));
        var mailOptions = {
          to: user.email,
          from: 'webmaster@tewkesburylodge.org.uk',
          subject: 'TLERA ReCycle Alert: ' + posts.messagetype,
          text: 'Posted: ' + posts.timestamp + '\n\n' + posts.shortdescription + '\n\n' + posts.longdescription + '\n\n' + posts.image_url,
          html: "<p><strong>Posted: </strong>" + posts.timestamp + "</p><p><strong>Location: </strong>" + posts.location + "</p><p><strong>Description: </strong>" + posts.shortdescription + "</p><p><strong>Details: </strong>"
            + posts.longdescription +  "<p><img src=\"" + posts.image_url + "\" alt=\"post image\" ></p><p><a  style=\"font-size: 50px;\" href=\"http://recycle.tewkesburylodge.org.uk/respond_post_email/" + posts._id + "\">Respond to post</a></p><p>If you do not want to receive any more post alerts, please log in at <a href=\"http://recycle.tewkesburylodge.org.uk\">TLERA ReCycle</a> and change your settings. <p>Regards<br/>TLERA Webmaster</p>"
        };
        info = smtpTransport.sendMail(mailOptions, function(err) {
          console.log("Message sent: ");
          done(err, 'done');
        })
      });
    });
    req.flash('success', ' An email alert has been sent to subscribers');
    res.redirect('/home');
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
        return res.redirect( '/home');

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
            type: 'error',
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
router.get('/ForgotPassword', isAuthenticated, function(req, res) {
  res.render('home', {
        user: req.user
     });
});




router.post('/new_post', isAuthenticated,  function(req, res){


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
    newAdvert.shortdescription = req.body.shortdescription;
    newAdvert.longdescription = req.body.longdescription;
    newAdvert.image_url = req.body.image_url;
    
    newAdvert.save(function (error, newAdvert) {

      post_id = newAdvert._id

      if (error) {
          // Return Error Message
      } else {
           req.flash('success', " Your new post was successful")
	         res.redirect('/email_alerts/' + post_id);
      }
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
      req.flash('success', " You have changed your details")
      res.redirect('../home');
		});











	/* GET Registration Page */
	router.get('/signup', recaptcha.middleware.render, function(req, res) {
		res.render('register',  {
      message: req.flash('message'),
      captcha : req.recaptcha
    });
  });
  
 
  /* Handle Registration POST */
  
  router.post("/signup", recaptcha.middleware.verify, captchaVerification,
  [
    check('password', 'Password must have at least eight characters').not().isEmpty().isLength({min: 8}),
    check('confirm', 'Passwords do not match').custom((value, {req}) => (value === req.body.password)),

  ], 
  (req, res, next) => {
    // Check validation.
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      
      
      res.render('register', {
        errors: errors.array()
      });
     
      
    }
    // if validation is successful, call next() to go on with passport authentication.
    next();
  },
  passport.authenticate("signup", {
    successRedirect: "/home",
    failureRedirect: "/signup",
    failureFlash: true,
    successFlash: ' Registration successful, welcome to Recycle on the Hill'
  })
);


  

function captchaVerification(req, res, next) {
  if (req.recaptcha.error) {

      req.flash('message', " Please tick the reCAPTCHA box if you are human")
      res.redirect('/signup');
  } else {
      return next();
  }
}

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
//		req.flash('success', 'Registration successfully');
    posts.find({username: req.session.user, expired: false}, function(err, user_posts) {
      posts.find({expired: false}, function(err, all_posts){
        res.render('home', {
          user: req.user,
          user_posts: user_posts,
          all_posts: all_posts
        });
      });
    });

  });

  /* GET Home Page */
	router.get('/home-posts', isAuthenticated, function(req, res){
//		req.flash('success', 'Registration successfully');
    posts.find({username: req.session.user, expired: false}, function(err, user_posts) {
      posts.find({expired: false}, function(err, all_posts){
        res.render('home-posts', {
          user: req.user,
          user_posts: user_posts,
          all_posts: all_posts
        });
      });
    });

  });

  /* Forgotten Password */
  router.get('/forgot_password', function(req, res) {
		res.render('forgot_password');
	});


	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

  router.post('/leave-recycle', function(req, res) {
    posts.deleteMany({username: req.session.user, expired: false}, function (err, result) {
      if (err ) return res.send(err)
      console.log(result)
    })
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
