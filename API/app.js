var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');

// Conexão à BD
var mongoose = require('mongoose');
if (process.env.MONGODB_URL){
  var mongoDB = process.env.MONGODB_URL;
}
else{
  var mongoDB = 'mongodb://localhost:27017/ProjetoEW';
}

mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error...'));
db.on('open', function() { console.log("Conexão ao MongoDB realizada com sucesso...") })

var indexRouter = require('./routes/index');

var app = express();

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({limit: '50mb', extended: true  }));

app.use('/api', indexRouter);

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
  res.json({error : err});
});

module.exports = app;
