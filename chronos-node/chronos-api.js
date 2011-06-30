var restler = require('restler');
var querystring = require('querystring');

var host = '127.0.0.1';
var port = 5984;
var couchdburl = 'http://' + host + ':' + port + '/thechallenge';
var couchdAdminburl = 'http://' + host + ':' + port + '/_config/admins/';
var username = 'superadmin';
var password = 'supersecret';

exports.createUser = function(req, res, params) {
  var url = couchdAdminburl + params.mail;
  // console.log('url: ' + url);

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
        res.send(201);
      });
    });
}

exports.newGame = function(req, res, params) {
  var url = couchdburl + '/game';
  restler.put(url, {
    data: JSON.stringify({type:'game', authentication_key:params.authentication_key || '', parameters:params.parameters || ''}),
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
    res.send(201);
  });
}

exports.login = function(req, res, params) {
  // Si l'utilisateur n'existe pas ou si l'utilisateur est déjà loggé : 400
  if (params.mail == 'deja.logge@test.com') {
    res.send(400);
  }
  // Lorsque le code de retour est OK, un cookie de session non persistant, nommé 'session_key' est placé dans l'entête HTTP. 
  // La valeur de ce cookie est une clé générée pour authentifier l'utilisateur lors des différents appels faits pendant la suite du jeu.
  res.send(201, {}, {mail:params.mail, password:params.password});
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
