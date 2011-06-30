var journey = require('journey');
// var nodestatic = require('node-static');
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
router.get(/^api\/audit\/(\d+)$/).bind(api.audit);

var responses = [];
var gameStarted = false;

// Create the htt server
var http = require('http');
// var files = new(nodestatic.Server)('./public');

var server = http.createServer(function(req, res) {

  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
//      if (result.status === 404) {
//        files.serve(req, res, function (err, result) {
//          if (err && (err.status === 404)) {
//            res.writeHead(404);
//            res.end('File not found.');
//          }
//        });
//        return;
//      }
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
});//.listen(8080);

var cluster = require('cluster');
cluster(server).listen(8080);

console.log('Server running at http://127.0.0.1:8080/');

// New game every 120 seconds
/*
setInterval(function() {
  gameStarted = false;
}, 120000);
*/
