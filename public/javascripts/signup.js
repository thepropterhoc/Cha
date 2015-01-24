var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/emails');

signup = function(doc) {
    var collection = db.get('emails');
    var newUser = {
        email : doc.elements['email'].value
    };
    collection.insert(newUser, {}, function(err, records){
        
    });
    console.log(doc.elements['email'].value);
}
