var crypto = require('crypto');
var logger = require('util');
// TODO key modulo game id ?
var key = 'F28i4Lk';

exports.authorize = function(req, res) {
  if (!req.headers['cookie']) {
    res.send(401, {}, {error: 'Unauthorized'});
    return false;
  }
  try {
    var cookieContent = req.headers['cookie'].split(';');
    //logger.log("> cookieContent: " + cookieContent);
    req.login = exports.decrypt(cookieContent[1].split('=')[1]);
    var rawUserData = exports.decrypt(cookieContent[0].split('=')[1]);
    var rawUserDataParts = rawUserData.split(/;/);
    req.jsonUser = {"login": req.login, "firstname": rawUserDataParts[0], "lastname": rawUserDataParts[1], "score": parseInt(rawUserDataParts[2]), "lastbonus": parseInt(rawUserDataParts[3]), "lastquestion": parseInt(rawUserDataParts[4]) };
    //logger.log("> User: " + JSON.stringify(req.jsonUser));
  } catch (err) {
    logger.log("authorize: " + err);
    res.send(401, {}, {error: 'Unauthorized', "reason": err});
    return false;
  }
  return true;
};

exports.encode = function(mail) {
  return exports.crypt(mail);
};

exports.encodeScore = function(firstname, lastname, score, lastbonus, lastquestion) {
  //logger.log("encodeScore: " + firstname + ';' + lastname + ';' + score + ';' + lastbonus + ';' + lastquestion);
  return exports.crypt(firstname + ';' + lastname + ';' + score + ';' + lastbonus + ';' + lastquestion);
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

