var restler = require('restler');
var sys = require('sys');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

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

exports.putDesign = function(name, options) {
  restler.put(couchdburl + '/' + name, {
    data: ''
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

exports.getDoc = function(name, options) {
  restler.get(couchdburl + '/' + name, {
    data: ''
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

