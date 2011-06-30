var journey = require('journey');
var api = require('./twitter-api.js');

// Create a router
var router = new(journey.Router)();

// Create the routes
router.get('/api/ping').bind(api.ping);
router.post('/api/tweet').bind(api.tweetHttp);

// Create the htt server
var http = require('http');

var server = http.createServer(function(req, res) {
  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      result.headers["Server"] = 'Chronos Twitter/1.0';
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');

