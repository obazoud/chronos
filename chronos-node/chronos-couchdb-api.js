var restler = require('restler');
var querystring = require('querystring');
var xml2json = require('./xml2json.js');
var sys = require('sys');
var hash = require('node_hash');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

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


