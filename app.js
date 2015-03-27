
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/emails');
var http = require('http');
var https = require('https');
var fs = require("fs");
var bodyParser  = require('body-parser');

var privateKey = fs.readFileSync('/home/ubuntu/privateKey.pem').toString();
var cert = fs.readFileSync('/home/ubuntu/cha.crt').toString();
var auths = [fs.readFileSync('/home/ubuntu/g1.crt').toString(), fs.readFileSync('/home/ubuntu/g2.crt').toString(), fs.readFileSync('/home/ubuntu/g3.crt').toString()];

var app = module.exports = express();


// Configuration

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(function(req,res,next){
  req.db = db;
  next();
});
app.use(express.static(__dirname + '/public'));

function requireHTTPS(req, res, next) {
    if (!req.secure) {
        //FYI this should work for local development as well
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}
app.use(requireHTTPS);

app.get('/', routes.index);
app.get('/signup', routes.signup);
app.get('/about', routes.about);
app.post('/add', routes.add);
app.get('/success', routes.success);

https.createServer({
    key: privateKey,
    cert: cert,
    ca: auths
}, app).listen(443);

/*app.listen(80, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
*/