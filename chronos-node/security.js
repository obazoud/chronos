var crypto = require('crypto');
var key = '1hv4pmT';

exports.authorize = function(req, res) {
  if (!req.headers['cookie']) {
    res.send(401, {}, {error: 'Unauthorized'});
    return false;
  }
  var session_key = exports.decrypt(req.headers['cookie'].split('=')[1]);
  var sessionkeyjson;
  try {
    sessionkeyjson = JSON.parse(session_key);
    req.jsonUser = sessionkeyjson;
  } catch (err) {
    res.send(401, {}, {error: 'Unauthorized'});
    return false;
  }
  return true;
};

exports.encode = function(data) {
  return exports.crypt(JSON.stringify(data));
};


exports.crypt = function(text) {
  var cipher = crypto.createCipher('aes-128-cbc', key);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
};

exports.decrypt = function(text) {
  var decipher = crypto.createDecipher('aes-128-cbc', key);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
};

exports.randomString = function randomString(stringLength) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string = '';
  for (var i = 0; i < stringLength; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      string += chars.substring(rnum,rnum+1);
  }
  return string;
};


/*
var text = "{'test':'crypto'}";
var crypted = exports.crypt(text);
console.log(crypted);
var decypted = exports.decrypt(crypted);
console.log(decypted);
*/
/*
console.log(exports.randomString(8));
*/

