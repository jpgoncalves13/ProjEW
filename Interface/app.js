var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var env = require('./config/env');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors()); // Habilita o CORS em todas as rotas


app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());

app.use('/bootstrap/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/bootstrap/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/fontawesome/css', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/css')));
app.use('/fontawesome/js', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/js')));
app.use('/fontawesome/webfonts', express.static(path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/webfonts')));
app.use('/jquery/js', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/public/css', express.static(path.join(__dirname, 'public/css')));
app.use('/public/js', express.static(path.join(__dirname, 'public/js')));

app.use('/users', usersRouter);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

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
