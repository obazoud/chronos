var journey = require('journey');
var api = require('./chronos-api.js');
var security = require('./security.js');
var tools = require("./tools.js");
var logger = require('util');

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
router.get('/api/couchdb').bind(api.couchdb);

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
  logger.log('Add process.on uncaughtException');
  process.on('uncaughtException', function(err) {
    logger.log(err);
  });
} else {
  logger.log('Skip process.on uncaughtException');
}

process.on('exit', function () {
  logger.log('Bye bye Chronos server.');
});

var server = http.createServer(function(req, res) {
  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // logger.log(Date.now() + ' >>');
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      result.headers['Server'] = 'Chronos/1.0';
      if (result.headers['Set-Cookie'] == null && req.headers['cookie'] != null) {
        result.headers['Set-Cookie'] = req.headers['cookie'];
      }
      res.writeHead(result.status, result.headers);
      res.end(result.body);
      //logger.log(Date.now() + ' <<');
    });
  });
});

if (applyCluster == true) {
  logger.log('Configure Node.js with cluster module (' + applyCluster + ')');
  var cluster = require('cluster');
  cluster(server)
    .set('workers', 4)
    .listen(8080, process.argv[0]);
  logger.log('Server running at http://' + process.argv[0] + ':8080');
} else {
  logger.log('Configure Node.js with *no* workers.');
  server.listen(8080);
  logger.log('Server running at http://127.0.0.1:8080');
}


