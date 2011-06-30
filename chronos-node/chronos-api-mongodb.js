var Db = require('./lib/mongodb').Db,
    Connection = require('./lib/mongodb').Connection
    Server = require('./lib/mongodb').Server,
    BSON = require('./lib/mongodb').BSONNative;

var host = 'localhost';
var port = Connection.DEFAULT_PORT;

console.log('Connecting to ' + host + ':' + port);

var db = new Db('chronos-mongodb', new Server(host, port, {}), {native_parser:true});  
db.open(function(err, db) {
  db.dropDatabase(function(err, result) {
    console.log('Dropping database: ' + result);
    db.close();
  });
});

exports.createUser = function(req, res, params) {
  console.log('Creating user: ' + params);
  // de 2 à 50 caractères
  // TODO
  db.open(function(err, db) {
    db.collection('user', function(err, collection) {
      collection.count({'mail':params.mail}, function(err, count) {
        // Si un utilisateur ayant la même adresse mail existe déjà, une erreur est retournée
        if (count > 0) {
          db.close();
          res.send(400, {}, {error:'Ce mail est déjà enregistré.'});
        }
        else {
          collection.insert({'firstname':params.firstname,'lastname':params.lastname,'mail':params.mail,'password':params.password});
          db.close();
          res.send(201);
        }
      });
    });
  });
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
