var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cloudinary = require('cloudinary');
var multer = require('multer');
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');
var async = require('async');
var crypto = require('crypto');
var flash = require('express-flash');

require('dotenv').config();
console.log('The value for CLOUDINARY_URL is :', process.env.CLOUDINARY_URL);
console.log('The value for SENDGRID_USER is :', process.env.SENDGRID_USER);
console.log('The value for SENDGRID_PASSWORD is :', process.env.SENDGRID_PASSWORD);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

var dbConfig = require('./db.js');
var mongoose = require('mongoose');
mongoose.connect(dbConfig.url);

// Configuring Passport
var passport = require('passport');
var session = require('express-session');
var sessionStore = new session.MemoryStore;
app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));
app.use(passport.initialize());
app.use(passport.session());


app.use(flash());

// Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Custom flash middleware -- from Ethan Brown's book, 'Web Development with Node & Express'
app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});





// Route that incorporates flash messages from either req.flash(type) or res.locals.flash
app.get('/', function( req, res ) {
    res.render('index', { expressFlash: req.flash('success'), sessionFlash: res.locals.sessionFlash });
});


app.use(function(req, res, next){
    res.locals.success_messages = req.flash('success_messages');
    res.locals.error_messages = req.flash('error_messages');
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser('MrWillyWarmer'));
app.use(express.static(path.join(__dirname, 'public')));


var routes = require('./routes/index')(passport);
app.use('/', routes);


/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
//app.use(function(req, res, next) {
//  next(createError(404));
//});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
