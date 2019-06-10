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
var flash = require('connect-flash-plus');
var bodyParser = require('body-parser');
var moment = require('moment');



require('dotenv').config();
console.log('The value for CLOUDINARY_URL is :', process.env.CLOUDINARY_URL);
console.log('The value for SENDGRID_USER is :', process.env.SENDGRID_USER);
console.log('The value for SENDGRID_PASSWORD is :', process.env.SENDGRID_PASSWORD);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
app.use(express.urlencoded());
app.locals.moment = require('moment');
// var dbConfig = require('./db.js');
var mongoose = require('mongoose');
// mongoose.connect(dbConfig.url);
mongoose.connect(process.env.MONGODB_URL)
//var mongoose = require('process.env.MONGODB_URL')

// Configuring Passport
var passport = require('passport');
var session = require('express-session');
var sessionStore = new session.MemoryStore;


app.use(session({
    cookie: { maxAge: 3600000 },
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
    res.locals.success = req.flash('success');
    res.locals.errors = req.flash('error');
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
