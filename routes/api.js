
/*
 * GET home page.
 */

var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/live');
var passwordHash = require('password-hash');

/*
  exchange : {
    sellerID : _id of seller
    saleDate : ISOFormattedString,
    postDate : ISOFormattedString,
    purchased : 1 or 0
  }

  receipt : {
    exchangeID : _id of exchange,
    buyerID : _id of buyer,
    saleAmount : 9.0,
    reimburseAmount : 5.5
  }

  user : {
    firstName : string of user's first name,
    lastName : string of user's last name,
    cell : string of user's cell number,
    email : string of user's email,
    hash : hashed,
    fourByfour : string of user's 4x4 login,
    ccToken : string of token used by Stripe in transactions,
    receiptsID : [_id of receipt objects] ,
    exchangesID : [_id of exchanges offered ],
    enabled : boolean if user is enabled to make transactions,
    balance : signed floating point value of funds in user account
  }
*/

exports.addUser = function(req, res) {
  var collection = db.get('users'); 

  collection.findOne({email: req.body.email}, function(err, records){
    if (records && records.email == req.body.email) {
      res.json("Email exists already");
      res.end(); 
    } else {
      var hashed = passwordHash.generate(req.body.password)

      var newUser = {
          firstName : req.body.firstName,
          lastName : req.body.lastName,
          cell : req.body.cell,
          email : req.body.email,
          hash : hashed,
          fourByfour : req.body.fourByfour,
          ccToken : "",
          receiptsID : new Array(),
          exchangesID : new Array(),
          enabled : 1,
          balance : 0.0
      };

      collection.insert(newUser, {}, function(err, records){
        if(err){
          res.json(err);
          res.end();
        } else {
          res.json(records);
          res.end();
        }
      });
    }
  });
};

exports.updateUser = function(req, res) {
  var collection = db.get('users');
  var user = {
    firstName : req.body.firstName,
    lastName : req.body.lastName,
    cell : req.body.cell,
    email : req.body.email,
    fourByfour : req.body.fourByfour,
    ccToken : req.body.ccToken,
    enabled : req.body.enabled, 
    balance : req.body.balance
  }

  collection.update({_id : req.body._id}, {$set : user}, {}, function(err, records){
    if(err){
      res.json(err);
    } else {
      res.json({"status" : "success"});
    }
  });
};

exports.loginUser = function(req, res){
  var collection = db.get('users');
  var pswd = req.body.password;
  var query = {email : req.body.email};
  console.log(query);
  collection.findOne({email : req.body.email}, function(err, record){
    if (err) {
      res.end("Error finding user email");
    } else if(record && record.email == req.body.email) {
      if (passwordHash.verify(pswd, record.hash) == true) {
        res.json(record);
      } else {
        res.json("Invalid login");
      }
    } else {
      res.json("Email not found");
    }
  });
};

exports.addExchange = function(req, res){
  var exchanges = db.get('exchanges');
  var users = db.get('users');
  var sID = req.body.sellerID;
  var today = new Date().toISOString();
  var exchange = {
    postDate : today,
    sellerID : sID,
    purchased : 0
  };
  exchanges.insert(exchange, function(err, returnedExchange){
    if(err){
      res.end("Error adding exchange");
    } else {
      users.findById(sID, function(err, returnedUser){
        var userExchanges = returnedUser.exchangesID;
        userExchanges.push(returnedExchange._id.toHexString());
        users.updateById(sID, {$set : {exchangesID : userExchanges}}, function(err, returnedUser){
          if (err){
            res.json(err);
          } else {
            res.json(returnedExchange);
          }
        });
      });
    }
  });
};

exports.removeExchange = function(req, res){
  var sID = req.body.sellerID;
  var exchanges = db.get('exchanges');
  exchanges.remove({sellerID : sID}, function(err, docs){
    if(err){
      res.json(err);
    } else {
      res.json("Success");
    }
  });
};

exports.countExchanges = function(req, res){
  var exchanges = db.get('exchanges');
  exchanges.find({}, function(err, records){
    var count = records.length
    res.json({
      exchangeCount : count
    });
  })
};

exports.buyExchange = function(req, res){
  var exchanges = db.get('exchanges');
  var receipts = db.get('receipts');
  var users = db.get('users');
  var bID = req.body.buyerID;
  var sorter = function(a, b){
      var keyA = new Date(a.postDate),
      keyB = new Date(b.postDate);
      // Compare the 2 dates
      if(keyA < keyB) return -1;
      if(keyA > keyB) return 1;
      return 0;
  };
  users.findOne({_id:bID}, function(err, buyer){
    if (err || buyer.balance < 9.00 || buyer.enabled != 1){
      res.end("Buyer cannot make transaction");
    } else {
      exchanges.find({purchased: { $ne: 1 }}, {sort : {postDate : 1}}, function(err, records){
        if (err) {
          res.end(err);
        } else if (records.length == 0){
          res.end("No exchanges available");
        } else {
          console.log(records);
          var exchange = records[0];
          if (exchange) {
            exchanges.updateById(exchange._id.toHexString(), {purchased : 1, saleDate: new Date().toISOString(), sellerID : exchange.sellerID});
            exchanges.findById(exchange._id.toHexString(), function(err, returnedExchange){
              if (err){
                res.json(err);
              } else {
                var receipt = {
                  exchangeID : exchange._id.toHexString(),
                  buyerID : bID,
                  saleAmount : 9.0,
                  reimburseAmount : 5.5,
                  didReimburse : false,
                  reimburseDate : null
                };
                receipts.insert(receipt, function(err, returnedReceipt){
                  if(err){
                    res.json(err);
                  } else {
                    users.findById(bID, function(err, buyer){
                      if(err){
                        res.json(err);
                      } else {
                        var buyerReceipts = buyer.receiptsID;
                        buyerReceipts.push(returnedReceipt._id.toHexString());
                        var newBal = parseFloat(buyer.balance) - parseFloat(returnedReceipt.saleAmount);
                        users.updateById(bID, {$set: {receiptsID : buyerReceipts, balance:newBal}}, function(err, returnedBuyer){
                          if(err){
                            res.json(err);
                          } else {
                            res.json(returnedBuyer);
                          }
                        });
                      }
                    });
                    users.findById(exchange.sellerID, function(err, seller){
                      if (err){
                        res.json(err);
                      } else {
                        var sellerReceipts = seller.receiptsID;
                        sellerReceipts.push(returnedReceipt._id.toHexString());
                        var newBal = parseFloat(seller.balance) + parseFloat(returnedReceipt.reimburseAmount);
                        users.updateById(exchange.sellerID, {$set : {balance: newBal, receiptsID : sellerReceipts}}, function(err, returnedSeller){
                          if(err){
                            res.json(err);
                          } else {
                            console.log("Seller updated");
                          }
                        });
                      }
                    });
                  }
                });
              };
            });
          }
        }
      });
    }
  });
};
