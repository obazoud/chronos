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
router.get('/test').bind(fake);
router.get(/^test\/question\/(\d+)$/).bind(getQuestion);


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

function fake(req,resp){
    resp.send(200,{},"c note, mais je suis un fake!") ;
}

var counter = 1; // sera mis dans redis
var dureeWarmup = 10000;
var dateFinWarmup = new Date().getTime() + dureeWarmup;
var responses = [];
responses[0] = [];

var numberOfQuestions = 5; 

var questionTimeFrame = 5000;
var synchroTimeDuration = 2000;
var quizSessions = []; // sera mis dans redis
var currentQuestion = 0;


function warmup(req,resp){
     restler.get('http://127.0.0.1:8080/test')
       .on('complete', function(data) {
            if(!gameStarted()){
                counter++;
                responses[0] = [];
                responses[0].push(resp);
            }else{
                console.log("sending immediatly");
                resp.send(400,{},"temps de reponse depasse!");
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
    
    // initialisation des time frames des questions
    quizSessions[0] = new Date().getTime();
    for(i=1; i<numberOfQuestions ; i++){
        quizSessions[i] = quizSessions[i-1] + synchroTimeDuration + questionTimeFrame;
    }
    currentQuestion = 1;
});


var timerId = setInterval(function(){
        if(counter==15 || new Date().getTime() >= dateFinWarmup){
            emitter.emit('warmupEnd',timerId);
        }else{
            console.log("waiting... " + counter);
        }    
},1000);

function gameStarted(){
    return (counter==15);
}

function getQuestion(req,resp,n){
    var now = new Date().getTime();
    // voir avec pierre les cas
    if(now >=quizSessions[n-1] && now <= (quizSessions[n-1]- synchroTimeDuration)){
        resp.send(200,{},"voici la question " + n);
    }else if (now < quizSessions[n-1]){
        resp.send(400,{},"vous avez rate la question " + n);
    }
}
