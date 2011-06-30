var crypto = require('crypto');
var key = '1hv4pmT';

Unauthorized = function (msg) {
    this.status = 401;
    this.headers = {};
    this.body = { error: msg || 'Unauthorized' };
};

exports.authorize = function(req, body, cb) {
  if (!req.headers['cookie']) {
    return cb(new Unauthorized());
  }
  var session_key = exports.decrypt(req.headers['cookie'].split('=')[1]);
  var sessionkeyjson;
  try {
    sessionkeyjson = JSON.parse(session_key);
    req.jsonUser = sessionkeyjson;
  } catch (err) {
    return cb(new Unauthorized());
  }
  return cb(null);
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

/*
var text = "{'test':'crypto'}";
var crypted = exports.crypt(text);
console.log(crypted);
var decypted = exports.decrypt(crypted);
console.log(decypted);
*/

