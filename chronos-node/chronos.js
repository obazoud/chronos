var journey = require('journey');
var api = require('./chronos-api-mongodb.js');

// Create a router
var router = new(journey.Router);

// Create the routes
router.get('/api/drop').bind(api.dropDatabase);
router.post('/api/user').bind(api.createUser); 
router.post('/api/game').bind(api.newGame);
router.post('/api/login').bind(api.login);
router.get(/^api\/question\/(\d+)$/).bind(api.getQuestion);
router.post(/^api\/answer\/(\d+)$/).bind(api.answerQuestion);
router.get('/api/ranking').bind(api.getRanking);
router.get('/api/score').bind(api.getScore);
router.get('/api/audit').bind(api.audit);
router.get(/^api\/audit\/(\d+)$/).bind(api.audit);

var responses = new Array();
var results = new Array();

// Create the htt server
var http = require('http');
http.createServer(function(req, res) {
  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    /*
    router.handle(req, body, function(result) {
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
    */
    router.handle(req, body, function(result) {
      responses.push(res);
      results.push(result);
      if (responses.length > 100) {
        for (i=0;i<responses.length;i++) {
          responses[i].writeHead(results[i].status, results[i].headers);
          responses[i].end(results[i].body);
        }
      }
    });
  });
}).listen(8080);
console.log('Server running at http://127.0.0.1:8080/');
