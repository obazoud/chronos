var restler = require('restler');
var querystring = require('querystring');
var sys = require('sys');
var hash = require('node_hash');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';
var domain = '.chronos.fr';

exports.createCouchUser = function(username, password, options) {
  var password_sha = hash.sha1(password + saltvalue);
  restler.post(couchdbaseburl + '/_users', {
    data: JSON.stringify({'_id':'org.couchdb.user:' + username, 'type':'user', 'name':username, 'roles':[], 'password_sha':password_sha, 'salt':saltvalue}),
    headers: { 'Content-Type': 'application/json' }
  })
  .addListener('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .addListener('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.createChronosUser = function(firstname, lastname, mail, password, options) {
    restler.put(couchdburl + '/' + mail, {
      data: JSON.stringify({type:'player', firstname:firstname || '', lastname:lastname || '', mail:mail || '', password:password || '', questions:[ ], reponses:[ ], score:0, lastbonus:0}),
      headers: { 'Content-Type': 'application/json' }
    })
  .addListener('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .addListener('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.getCurrentUser = function(sessionKey, options) {
  restler.get(couchdbaseburl + '/_session', {
    data: '',
    headers: {
      'Domain': domain,
      'Cookie': sessionKey
    }
  })
  .addListener('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .addListener('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.login = function(username, password, options) {
  restler.post(couchdbaseburl + '/_session', {
    data: 'name=' + username + '&password=' + password,
    headers: {
      'Content-Type': 'application/x-www-form-urlencodeddata',
      'Host': 'localhost:8080',
      'Referer': 'http://localhost:8080/_api',
      'Domain': domain
    }
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.putDoc = function(name, json, options) {
  restler.put(couchdburl + '/' + name, {
    data: JSON.stringify(json),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.putDesign = function(name, sessionKey, options) {
  restler.put(couchdburl + '/' + name, {
    data: '',
    headers: {
      'Domain': domain,
      'Cookie': sessionKey
    }
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });
};

exports.getDoc = function(name, sessionKey, options) {
  restler.get(couchdburl + '/' + name, {
    data: '',
    headers: {
      'Domain': domain,
      'Cookie': sessionKey
    }
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data, response);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      options.success(data, response);
    }
  });

};

