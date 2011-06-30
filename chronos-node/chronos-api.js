var restler = require('restler');
var host = '127.0.0.1';
var port = 5984;
var username = 'superadmin';
var password = 'supersecret';
var couchdbAdminurl = 'http://superadmin:supersecret@127.0.0.1:5984';
var couchdburl = 'http://' + host + ':' + port;

exports.createUser = function(req, res, params) {
  // curl -i -X PUT http://superadmin:supersecret@127.0.0.1:5984/_config/admins/anna -d '"secret"'
  console.log('Creating user: ' + req);
  console.log('Creating user: ' + res);
  console.log('Creating user: ' + params);
  console.log('Creating user: ' + params.mail);
  var url = couchdbAdminurl + '/_config/admins/' + params.mail;
  console.log('url: ' + url);
  restler.put(url, { data : params.password })
    .on('complete', function (data) {
      console.log('complete:' + data);
    })
    .on('error', function(data) {
      console.log('error:' + data);
  });

  // Si un utilisateur ayant la même adresse mail existe déjà, une erreur est retournée
  // if (params.mail == 'mail.existant@test.com') {
  //  res.send(400);
  // }
  // console.log(params);
  // res.send(201, {}, {firstname:params.firstname, lastname:params.lastname, mail:params.mail, password:params.password});
}

exports.newGame = function(req, res, params) {
  // Clé d'authentification non reconnue : 401
  if (params.authentication_key == 'unknown') {
    res.send(401);
  }
  // Autre erreur : 401
  res.send(201, {}, {authentication_key:params.authentication_key, parameters:params.parameters});
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
