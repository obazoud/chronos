var redis = require("redis").createClient();
redis.on("error", function (err) {
    console.log("Error " + err);
});

var sys = require('sys'),
    restler = require('restler')
    
var journey = require('journey');
var router = new(journey.Router)();
var events = require('events');

var emitter = new events.EventEmitter();

router.get('/test/warmup').bind(warmup);

var http = require('http');

var server = http.createServer(function(req, res) {

  var body = '';

  req.on('data', function(chunk) { 
    body += chunk; 
  });

  req.on('end', function() {
    // Dispatch the request to router
    router.handle(req, body, function(result) {
      result.headers["Server"] = 'Chronos/1.0';
      res.writeHead(result.status, result.headers);
      res.end(result.body);
    });
  });
});

server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

var questionEnCours = 1;
var responses = [][];

var questionTimeFrameStart = 0;
var questionTimeFrameEnd = 0;

var synchroTimeFrameStart = 0;
var synchroTimeFrameEnd = 0;


function warmup(req,resp){
     restler.get('https://twaud.io/')
       .on('complete', function(data) {
            if(!gameStarted()){
                responses[0].push(resp);
            }else{
                console.log("sending immediatly");
                resp.send(200,{},"temps de reponse depasse!");
            }
        });
}

emitter.once('warmupEnd',function(timerId){
    responses[0].forEach(function(resp){
        console.log("sending...");
        resp.send(200,{},"question 1");    
    });
    responses[0] = [];// verfifier si avec le comportement asynch ca peux poser des problemes
    clearTimeout(timerId);
    console.log("warmup timer stopped");
});

// les joueurs doivent repondre dans l intervalle questionTimeFrame
emitter.on('questionTimeFrameStart',function(){
    questionTimeFrameStart = new Date().getTime();    
    questionEnCours++;
});

emitter.on('questionTimeFrameEnd');

// l application doit repondre dans l intervalle synchroTime
emitter.on('synchroTimeFrameStart');
emitter.on('synchroTimeFrameEnd');




var counter = 1;
var timerId = setInterval(function(){
        if(counter==50){
            emitter.emit('warmupEnd',timerId);
        }else{
            console.log("waiting... " + counter++);
        }    
},1000);

function gameStarted(){
    return (counter==50);
}

