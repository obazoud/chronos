var restler = require('restler');
var querystring = require('querystring');
var xml2json = require('./xml2json.js');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var couchdAdminburl = 'http://' + host + ':' + port + '/_config/admins/';
var username = 'superadmin';
var password = 'supersecret';

exports.createUser = function(req, res, params) {
  var url = couchdAdminburl + params.mail;
  // console.log('url: ' + url);
  // org.couchdb.user ?
  restler.put(url, {
        username: username,
        password: password,
        data: JSON.stringify(params.password)
      }
    )
   .on('error', function(data) {
      res.send(400, {}, data);
    })
    .on('complete', function (data) {
      var url = couchdburl + '/' + params.mail;
      
      restler.put(url, {
        data: JSON.stringify({type:'player', firstname:params.firstname || '', lastname:params.lastname || '', mail:params.mail || '', password:params.password || ''}),
        headers: { 'Content-Type': 'application/json' }
      })
      .on('error', function(data) {
        // if user already exists, couchdb sends: {"error":"conflict","reason":"Document update conflict."}
        // so no need to test if a user exists via a HEAD request
        // via _design/validate, errors occurs if one of the parameter is not valid
        res.send(400, {}, data);
      })
      .on('complete', function (data) {
        console.log('data: ' + data);
        res.send(201, {}, data);
      });
    });
}

exports.newGame = function(req, res, params) {
  var url = couchdburl + '/game';
  var gameXML = params.parameters;
  // gameXML = gameXML.replace(/usi:/g, "");
  var paramsJSON = xml2json.parse(gameXML);
  paramsJSON['type'] = 'game';
  paramsJSON['authentication_key'] = params.authentication_key || '';
  delete paramsJSON['value'];
  console.log('paramsJSON: ' + paramsJSON);
  restler.put(url, {
    data: JSON.stringify(paramsJSON),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data) {
    if (JSON.parse(data).reason == 'Authentication key is not recognized.') {
      res.send(401, {}, data);
    } else {
      res.send(400, {}, data);
    }
  })
  .on('complete', function (data) {
    console.log('data: ' + data);
    res.send(201);
  });
}


exports.login = function(req, res, params) {
  var url = couchdbaseburl + '/_session';
  restler.post(url, {
    data: 'name=' + params.mail + '&password=' + params.password,
    headers: {
      'Content-Type': 'application/x-www-form-urlencodeddata',
      'Host': 'localhost:8080',
      'Referer': 'http://localhost:8080/_api'
    }
  })
  .on('error', function(data) {
    if (data.error == 'unauthorized') {
      res.send(401, {}, data);
    }
    res.send(400, {}, data);
  })
  .on('complete', function (data) {
    console.log('data: ' + data);
    res.send(201);
  });
}

exports.getQuestion = function(req, res, n) {
  // Clé de session non reconnue : 401
  // Non respect de la séquence ou autre erreur : 400
  res.send(200, {}, {question:n, answer_1:'answer_1', answer_2:'answer_2', score:42});
}

exports.answerQuestion = function(req, res, n, params) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  params.answer // number
  res.send(201, {}, {are_u_right:true, good_answer:'good_answer', score:42});
}

exports.getRanking = function(req, res) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  res.send(200, {}, {});
}

exports.getScore = function(req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {score:42, ranking:42});
}

exports.audit = function(req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answers:[42,42,42,42], good_answers:[42,42,42,42]});
}

exports.audit = function(req, res, n, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answer:42, good_answer:42, question:'question'});
}
