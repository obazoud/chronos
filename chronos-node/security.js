var nibbler = require('./externals/nibbler');

Unauthorized = function (msg) {
    this.status = 401;
    this.headers = {};
    this.body = { error: msg || 'Unauthorized' };
};

exports.authorize = function(req, body, cb) {
  if (!req.headers['cookie']) {
    return cb(new Unauthorized());
  }
  var session_key = nibbler.b64decode(req.headers['cookie'].split('=')[1]);
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
  return nibbler.b64encode(JSON.stringify(data));
};
