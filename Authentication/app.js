// Imports
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var express = require('express');
var logger = require('morgan');
var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var session = require('express-session');
var mongoose = require('mongoose');
var User = require('./models/user');
var usersRouter = require('./routes/users');
require('dotenv').config();

// DB config

if (process.env.MONGODB_URL){
  var mongoDB = process.env.MONGODB_URL;
}
else{
  var mongoDB = 'mongodb://localhost:27017/ProjetoEW';
}

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 5000 });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error.'));
db.once('open', function () { console.log("Connection to MongoDB successful") });

// Passport config
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.AUTHENTICATION_URL}/users/facebook/callback`
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOne({ providerId: profile.id, provider: 'facebook' })
      .then(resposta => {
        if (resposta) { 
          // O utilizador já existe
          return cb(null, resposta);
        } else {
          const email = profile.emails ? profile.emails[0].value : '';

          User.findOne({ email: email })
            .then(existingUser => {
              if (existingUser) {
                return cb(null, null);
              } else {
                const newUser = new User({
                  providerId: profile.id,
                  provider: 'facebook',
                  name: profile.name.givenName,
                  surname: profile.name.familyName,
                  email: email,
                  level: 'consumer',
                  active: true,
                  dateCreated: new Date().toISOString().substring(0, 19),
                  dateLastAccess: new Date().toISOString().substring(0, 19),
                  history: [],
                  favorites: []
                });

                User.create(newUser)
                  .then(dados => {
                    return cb(null, dados);
                  })
                  .catch(erro => {
                    return cb(erro, null);
                  });
              }
            })
            .catch(erro => {
              // Trate o erro, se necessário
              return cb(erro, null);
            });

        }
      })
      .catch(erro => {
        return cb(erro, null)
      });
  }
));
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_APP_ID,
  clientSecret: process.env.GOOGLE_APP_SECRET,
  callbackURL: `${process.env.AUTHENTICATION_URL}/users/google/callback`
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOne({ providerId: profile.id, provider: 'google' })
      .then(resposta => {
        if (resposta) {
          // Utilizador já existe, devolve o utilizador existente
          return cb(null, resposta);
        } else {
          // O utilizador não existe, cria um novo utilizador com as informações do Google
          const email = profile.emails ? profile.emails[0].value : ''; // Extrai o primeiro email, se disponível
          
          User.findOne({ email: email })
            .then(existingUser => {
              if (existingUser) {
                return cb(null,null);
              } else {
                const newUser = new User({
                  providerId: profile.id,
                  provider: 'google',
                  name: profile.name.givenName,
                  surname: profile.name.familyName,
                  email: email,
                  level: 'consumer',
                  active: true,
                  dateCreated: new Date().toISOString().substring(0, 19),
                  dateLastAccess: new Date().toISOString().substring(0, 19),
                  history: [],
                  favorites: []
                });
          
                User.create(newUser)
                  .then(dados => {
                    return cb(null, dados);
                  })
                  .catch(erro => {
                    return cb(erro, null);
                  });
              }
            })
            .catch(erro => {
              // Trate o erro, se necessário
              return cb(erro, null);
            });
        }        
      })
      .catch(erro => {
        return cb(erro, null)
      })
  }
));

var app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
app.use(session({
  secret: process.env.SESSION_KEY,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.session());
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.jsonp({ error: err.message });
});

module.exports = app;
