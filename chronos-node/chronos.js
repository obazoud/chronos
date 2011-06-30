var sys = require('sys');
var fs = require('fs');
var logger = require('util');
var router = require('./router');

var chronosSettings = require('./conf/settings.js').create();
// Show settings
logger.log('Loading Chronos settings: ' + sys.inspect(chronosSettings, false));

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

// Create the routes
logger.log('Creating Routes');
// admin
router.get('/api/ping', api.ping);
router.get('/api/frontal', api.frontal);
router.get('/api/couchdb', api.couchdb);
// app
router.post('/api/user', api.createUser); 
router.post('/api/game', api.newGame);
router.post('/api/login', api.login);
router.get(/^\/api\/question\/(\d+)$/, api.getQuestion);
router.post(/^\/api\/answer\/(\d+)$/, api.answerQuestion);
router.get('/api/ranking', api.getRanking);
router.get('/api/score', api.getScore);
router.get(/^\/api\/audit$/, api.audit);
router.get(/^\/api\/audit\/(\d+)$/, api.auditN);

// Create the http server
logger.log('Creating Http server');
var http = require('http');
module.exports = http.createServer(function(req, res) {
  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    req.incomeDate = Date.now();
    router.handle(req, res, body, function(result) {
      result.headers['Server'] = 'Chronos/1.0';
      if (result.headers['Set-Cookie'] == null && req.headers['cookie'] != null) {
        result.headers['Set-Cookie'] = req.headers['cookie'];
      }
      result.headers["Date"] = new(Date)().toUTCString();
      if (result.body) {
        if (typeof(result.body) !== 'string') {
          result.headers["Content-Type"] = "application/json";
          result.body = JSON.stringify(result.body);
        }
        result.headers['Content-Length'] = Buffer.byteLength(result.body);
      } else {
        delete(result.headers["Content-Type"]);
      }

      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
});

if (!chronosSettings.cluster.activate) {
  logger.log('Configure Node.js with *no* workers.');
  module.exports.listen(chronosSettings.port, chronosSettings.hostname);
  logger.log('Server running at http://' + chronosSettings.hostname + ':' + chronosSettings.port);
}
