
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/emails');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(function(req,res,next){
    req.db = db;
    next();
  });
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/signup', routes.signup);
app.get('/about', routes.about);
app.post('/add', routes.add);
app.get('/success', routes.success);

app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
