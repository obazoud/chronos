//var journey = require('journey');
//var api = require('./chronos-api-mongodb.js');

// Create a router
//var router = new(journey.Router);

// Create the routes
/*
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
*/

var responses = [];
var gameStarted = false;

// Create the htt server
var http = require('http');
var server = http.createServer(function(req, res) {
  /*
  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
  */
  if (gameStarted) {
    console.log(new Date() + 'new player after game started');
    res.writeHead(200, {'Content-Type':'application/json'});
    res.end("{'question':'question', 'answer_1':'answer_1', 'answer_2':'answer_2', 'answer_3':'answer_3', 'answer_4':'answer_4', 'score':42}");
  }
  else {
    console.log(new Date() + ':pushing new player in wait list:' + responses.length);
    responses.push(res);
    if (responses.length > 500) {
      console.log(new Date() + ': starting new game!');
      gameStarted = true;
      while (responses.length) {
        response = responses.shift();
        response.writeHead(200, {'Content-Type':'application/json'});
        response.end("{'question':'question', 'answer_1':'answer_1', 'answer_2':'answer_2', 'answer_3':'answer_3', 'answer_4':'answer_4', 'score':42}");
      }
    }
  }
});//.listen(8080);

// Create multi-core server manager
var cluster = require('cluster');
cluster(server)//.listen(8080);
  .use(cluster.stats())
  .use(cluster.repl(8888))
  .listen(8080);
/*
  .use(cluster.logger('logs'))
  .use(cluster.pidfiles('pids'))
  .use(cluster.cli())
*/
console.log('Server running at http://127.0.0.1:8080/');

// New game every 120 seconds
setInterval(function() {
  gameStarted = false;
}, 120000);
