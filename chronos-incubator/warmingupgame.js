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

var dureeWarmup = 10000; // dans redis
var numberOfQuestions = 5; // dans redis
var maxGamers = 15; // dans redis
var questionTimeFrame = 5000; // dans redis
var synchroTimeDuration = 2000; // dans redis

var counter = 1; // dans redis

var dateFinWarmup = new Date().getTime() + dureeWarmup; // dans redis
var responses = [];
responses[0] = [];

var quizSessions = []; // dans redis
var currentQuestion = 0; // dans redis


/*
gere les demandes d inscription au quiz
*/
function warmup(req,resp){
     restler.get('http://127.0.0.1:8080/test')
       .on('complete', function(data) {
            if(!gameStarted()){
                counter++;
                responses[0].push(resp);
                if(counter==maxGamers){
                    emitter.emit('warmupEnd',timerId);
                }
            }else{ // TODO a verfifier
                console.log("sending immediatly");
                resp.send(400,{},"temps de reponse depasse!");
            }
        });
}

/*
gere l evenement d arret de la phase de warmup en :
    1. arretant le timer
    2. repondant a tout les utilisateurs
    3. definitions des fenetres de sessions de reponses
*/
emitter.once('warmupEnd',function(timerId){
    clearTimeout(timerId);
    console.log("warmup timer stopped");
    
    responses[0].forEach(function(resp){
        console.log("sending...");
        resp.send(200,{},"question 1");    
    });
    responses[0] = [];// verfifier si avec le comportement asynch ca peux poser des problemes
    
    // initialisation des time frames des questions
    quizSessions[0] = new Date().getTime();
    for(i=1; i<numberOfQuestions ; i++){
        quizSessions[i] = quizSessions[i-1] + synchroTimeDuration + questionTimeFrame;
    }
    currentQuestion = 1;
});

/*
Timer active une tache de fond qui s execute tous les X ms
pour verfier si on depasser le temps de warmup ou atteint le nombre
maximum de joueurs.
*/
var timerId = setInterval(function(){
        if(gameStarted()){
            emitter.emit('warmupEnd',timerId);
        }else{
            console.log("waiting... " + counter);
        }    
},1000);

function gameStarted(){
    return (counter == maxGamers || new Date().getTime() >= dateFinWarmup);
}


/*

*/
function getQuestion(req,resp,n){
    var now = new Date().getTime();
    // voir avec pierre les cas
    if(!gameStarted()){
        resp.send(400,{},"le jeu n a pas encore commence ");
    }
    if(n <= 0 || n > numberOfQuestions){
        resp.send(400,{},"le numero de la question demande est incorrect.");
    }
    if(now >= quizSessions[n-1] && now <= (quizSessions[n]- synchroTimeDuration)){
        resp.send(200,{},"voici la question " + n);
    }else if (now > quizSessions[n]){
        resp.send(400,{},"vous avez rate la question " + n);
    }
}






