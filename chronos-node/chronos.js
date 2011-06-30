var journey = require('journey');

// Create a router
var router = new(journey.Router);

// Create the routes
router.post('/api/user').bind(function (req, res, params) {
  // Si un utilisateur ayant la même adresse mail existe déjà, une erreur est retournée
  if (params.mail == 'mail.existant@test.com') {
    res.send(400);
  }
  res.send(201, {}, {firstname:params.firstname, lastname:params.lastname, mail:params.mail, password:params.password});
});
router.post('/api/game').bind(function (req, res, params) {
  // Clé d'authentification non reconnue : 401
  if (params.authentication_key == 'unknown') {
    res.send(401);
  }
  // Autre erreur : 401
  res.send(201, {}, {authentication_key:params.authentication_key, parameters:params.parameters});
});
router.post('/api/login').bind(function (req, res, params) {
  // Si l'utilisateur n'existe pas ou si l'utilisateur est déjà loggé : 400
  if (params.mail == 'deja.logge@test.com') {
    res.send(400);
  }
  // Lorsque le code de retour est OK, un cookie de session non persistant, nommé 'session_key' est placé dans l'entête HTTP. 
  // La valeur de ce cookie est une clé générée pour authentifier l'utilisateur lors des différents appels faits pendant la suite du jeu.
  res.send(201, {}, {mail:params.mail, password:params.password});
});
router.get(/^api\/question\/(\d+)$/).bind(function (req, res, n) {
  // Clé de session non reconnue : 401
  // Non respect de la séquence ou autre erreur : 400
  res.send(200, {}, {question:"question", answer_1:"answer_1", answer_2:"answer_2", score:42});
});
router.post(/^api\/answer\/(\d+)$/).bind(function (req, res, n, params) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  params.answer // number
  res.send(201, {}, {are_u_right:true, good_answer:"good_answer", score:42});
});
router.get('/api/ranking').bind(function (req, res) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  res.send(200, {}, {});
});
router.get('/api/score').bind(function (req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {score:42, ranking:42});
}); 
router.get('/api/audit').bind(function (req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answers:[42,42,42,42], good_answers:[42,42,42,42]});
});
router.get(/^api\/audit\/(\d+)"/).bind(function (req, res, n, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answer:42, good_answer:42, question:"question"});
});

var http = require('http');
http.createServer(function (req, res) {
  var body = "";

  req.on('data', function (chunk) { 
    body += chunk; 
  });

  req.on('end', function () {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
}).listen(8080);
console.log('Server running at http://127.0.0.1:8080/');
