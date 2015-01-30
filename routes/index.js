
/*
 * GET home page.
 */

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/emails');

exports.add = function(req, res) {
	var collection = db.get('emails'); 

	var newUser = {
      email : req.body.email
  };

  collection.insert(newUser, {}, function(err, records){
  	if(err){
  		res.end('{"error" : "something went terribly wrong", "status" : 500}');
  	} else {
  		res.end('{"success" : "Updated Successfully", "status" : 200}');
  	}
  });
};

exports.success = function(req, res){
	res.render('success');
};

exports.index = function(req, res){
  res.render('index')
};

exports.signup = function(req, res){
	res.render('signup');
};

exports.about = function(req, res){
	res.render('about', {});
};