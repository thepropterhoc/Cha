
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' })
};

exports.signup = function(req, res){
	res.render('signup', {});
};

exports.about = function(req, res){
	res.render('about', {});
};