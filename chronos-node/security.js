var logger = require('util');
var sys = require('sys');

var sessions = {};

exports.authorize = function(req, res) {
  if (!req.headers['cookie']) {
    res.send(401, {}, {error: 'Unauthorized'});
    return false;
  }
  try {
    var session_key = req.headers['cookie'].split('=')[1];
    req.session_key = session_key;

    if (sessions[req.session_key]) {
      req.session = sessions[req.session_key];
    } else {
      res.send(401, {}, {error: 'Unauthorized', "reason": "session not found"});
      return false;
    }
  } catch (err) {
    logger.log("authorize: " + err);
    res.send(401, {}, {error: 'Unauthorized', "reason": err});
    return false;
  }
  return true;
};

exports.newSession = function(req, mail) {
  var session_key = exports.randomString(16);
  sessions[session_key] = {};
  req.session_key = session_key;

  req.session = sessions[session_key];
  req.session.jsonUser = {};
  req.session.mail = mail;
  return session_key;
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
