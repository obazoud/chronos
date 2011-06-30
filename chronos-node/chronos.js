var journey = require('journey');
var api = require('./chronos-api.js');
var security = require('./security.js');

// Create a router
var router = new(journey.Router)();

// Create the routes
router.get('/api/ping').bind(api.ping);
//router.get('/api/drop').bind(api.dropDatabase);
router.post('/api/user').bind(api.createUser); 
router.post('/api/game').bind(api.newGame);
router.post('/api/login').bind(api.login);
router.get(/^api\/question\/(\d+)$/).filter(security.authorize).bind(api.getQuestion);
router.post(/^api\/answer\/(\d+)$/).filter(security.authorize).bind(api.answerQuestion);
router.get('/api/ranking').filter(security.authorize).bind(api.getRanking);
router.get('/api/score').bind(api.getScore);
router.get('/api/audit').bind(api.audit);
router.get(/^api\/audit\/(\d+)$/).bind(api.auditN);
router.post('/api/tweet').bind(api.tweetHttp);
router.get(/^api\/mail\/([\w|@|\.]+)$/).bind(api.mail);
router.get('/api/frontal').bind(api.frontal);

var responses = [];
var gameStarted = false;

// Create the htt server
var http = require('http');
// var files = new(nodestatic.Server)('./public');

console.log(process.argv);
var applyCluster = true;
if (process.argv.indexOf('--no-cluster') > -1) {
    applyCluster = false;
}

// Prevent node.js crashing
if (process.argv.indexOf('--no-uncaught') <= -1) {
  console.log('Add process.on uncaughtException');
  process.on('uncaughtException', function(err) {
    console.log(err);
  });
} else {
  console.log('Skip process.on uncaughtException');
}

var server = http.createServer(function(req, res) {

  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      result.headers['Server'] = 'Chronos/1.0';
      if (result.headers['Set-Cookie'] == null && req.headers['cookie'] != null) {
        result.headers['Set-Cookie'] = req.headers['cookie'];
      }
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
});

if (applyCluster == true) {
  console.log('Configure Node.js with cluster module (' + applyCluster + ')');
  var cluster = require('cluster');
  cluster(server).listen(8080);
} else {
  console.log('Configure classic Node.js');
  server.listen(8080);
}

console.log('Server running at http://127.0.0.1:8080/');

// New game every 120 seconds
/*
setInterval(function() {
  gameStarted = false;
}, 120000);
*/
