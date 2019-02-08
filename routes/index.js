var express = require('express');
var router = express.Router();

var posts = require('../models/posts');

var bCrypt = require('bcrypt-nodejs');
var User = require('../models/user');







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
		failureFlash : true
	}));

/* Browse Items */
router.post('/browse_items', isAuthenticated, function(req, res) {
  posts.dataTables({
    limit: req.body.length,
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




	router.post('/adverts', isAuthenticated, function(req, res){

   var newAdvert = new posts(req.body);
	 newAdvert.username =req.session.user;



 console.log('monty', req.session.address);
 	newAdvert.location = req.session.address;
	newAdvert.email = req.session.email;
	newAdvert.timestamp = new Date;

   newAdvert.save()
	 	.then(item =>{
			res.locals.post = req.flash();
		 	res.render('home');

	 	})
	 	.catch(err =>{
		 	res.status(400).send("Unable to save to database");
	 	});
	});

	router.get('/adverts', function(req, res) {
		res.render('home',{message: req.flash('message')});
	});

	/* GET Registration Page */
	router.get('/signup', function(req, res) {
		res.render('register',{message: req.flash('message')});
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
		res.locals.message = req.flash();

		res.render('home', { user: req.user, avatar_field: process.env.AVATAR_FIELD });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});



	return router;
}
