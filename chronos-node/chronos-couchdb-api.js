var restler = require('restler');
var sys = require('sys');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

// document in cache is supposed to be read only!!
// otherwise clone it
var store = {};
var keys = {
    'game': true
};

exports.createChronosUser = function(firstname, lastname, mail, password, options) {
    restler.put(couchdburl + '/' + mail, {
      data: JSON.stringify({type:'player', firstname:firstname || '', lastname:lastname || '', mail:mail || '', password:password || '', questions:[ ], reponses:[ ], score:0, lastbonus:0}),
      headers: { 'Content-Type': 'application/json' }
    })
  .addListener('error', function(data) {
    if (options.error) {
      options.error(data);
    }
  })
  .addListener('complete', function(data) {
    if (options.success) {
      options.success(data);
    }
  });
};

exports.putDoc = function(name, json, options) {
  restler.put(couchdburl + '/' + name, {
    data: JSON.stringify(json),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data) {
    if (keys[name]) {
      this.store[name] = data;
    }
    if (options.success) {
      options.success(data);
    }
  });
};

exports.putDesign = function(name, options) {
  restler.put(couchdburl + '/' + name, {
    data: ''
  })
  .on('error', function(data) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data) {
    if (options.success) {
      options.success(data);
    }
  });
};

exports.getDoc = function(name, options) {
  if (store[name]) {
    if (options.success) {
      options.success(store[name]);
      return;
    }
  }
  restler.get(couchdburl + '/' + name, {
    data: ''
  })
  .on('error', function(data) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data) {
    if (keys[name]) {
      store[name] = data;
    }
    if (options.success) {
      options.success(data);
    }
  });

};

