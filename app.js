
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var api = require('./routes/api');

var monk = require('monk');
var http = require('http');
var https = require('https');
var fs = require("fs");
var bodyParser  = require('body-parser');
var expressSession = require('express-session');
var cookieParser = require('cookie-parser');
var forceSSL = require('express-force-ssl');
var favicon = require('serve-favicon');

/*
var privateKey = fs.readFileSync('/home/ubuntu/privateKey.pem').toString();
var cert = fs.readFileSync('/home/ubuntu/cha.crt').toString();
var auths = [fs.readFileSync('/home/ubuntu/g1.crt').toString(), fs.readFileSync('/home/ubuntu/g2.crt').toString(), fs.readFileSync('/home/ubuntu/g3.crt').toString()];
*/
var app = module.exports = express();

// Configuration


app.use(favicon(__dirname + '/public/images/icon.ico'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});

app.use(cookieParser());
app.use(expressSession({secret:'somesecrettokenhere'}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: false
})); 
app.use(express.static(__dirname + '/public'));

//app.use(forceSSL);

function restrict(req, res, next) {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
  if (req.session && req.session.user) {
    next();
  } else {                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
    res.json({
      status : "Error",
      description : "User not logged in"
    });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
  }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
}      

app.get('/', routes.index);
app.get('/signup', routes.signup);
app.get('/about', routes.about);
app.post('/add', routes.add);
app.get('/success', routes.success);


app.post('/api/users/add', api.addUser);
app.post('/api/users/update', api.updateUser);
app.post('/api/users/login', api.loginUser);
app.get('/api/exchanges/count', api.countExchanges);
app.post('/api/exchanges/add', restrict, api.addExchange);
app.post('/api/exchanges/buy', restrict, api.buyExchange);

/*
https.createServer({
    key: privateKey,
    cert: cert,
    ca: auths
}, app).listen(443);
*/


app.get('*', function(req, res){
  res.send("Page not found!", 404);
});

app.post('*', function(req, res){
  res.send("Page not found!", 404);
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

http.createServer(app).listen(1000, 'localhost', function(){
  console.log("Listening!");
});

app.listen(80, function(){
  console.log("Express server listening on port 80 in %s mode", app.settings.env);
});

