var sys = require('sys');
var fs = require('fs');
var logger = require('util');
var journey = require('journey');

var chronosSettings = require('./conf/settings.js').create();
// Show settings
logger.log('Loading Chronos settings: ' + sys.inspect(chronosSettings, false));

var security = require('./security.js');
var api = require('./chronos-api.js');

// Prevent node.js crashing
if (chronosSettings.uncaughtException) {
  logger.log('Add process.on uncaughtException');
  process.on('uncaughtException', function(err) {
    logger.log(err);
  });
} else {
  logger.log('Skipping process.on uncaughtException');
}

// node.js exit
process.on('exit', function () {
  logger.log('Bye bye Chronos server.');
});


// Create a router
logger.log('Creating Router');
var router = new(journey.Router)();

// Create the routes
logger.log('Creating Routes');
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

// Create the http server
logger.log('Creating Http server');
var http = require('http');
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

// Node Cluster ?
if (chronosSettings.cluster.activate) {
  logger.log('Configure Node.js with cluster module (' + chronosSettings.cluster.workers + ' workers).');
  var cluster = require('cluster');
  cluster(server)
    .set('workers', chronosSettings.cluster.workers)
    .listen(chronosSettings.port, chronosSettings.hostname);
  logger.log('Server running at http://' + chronosSettings.hostname + ':' + chronosSettings.port);
} else {
  logger.log('Configure Node.js with *no* workers.');
  server.listen(chronosSettings.port, chronosSettings.hostname);
  logger.log('Server running at http://' + chronosSettings.hostname + ':' + chronosSettings.port);
}


