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

router.get('/test').bind(fake);
router.get('/test/warmup').bind(warmup);
router.get(/^test\/question\/(\d+)$/).bind(getQuestion);
router.get(/^test\/answer\/(\d+)$/).bind(answerQuestion);



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

// TODO il fo garantir que les donnees soient ds redis avant leur utilisation !

server.listen(8080);
console.log('Server running at http://127.0.0.1:8080/');

function fake(req,resp){
    resp.send(200,{},"c note, mais je suis un fake!") ;
}

var dureeWarmup = 10000; // dans redis
var numberOfQuestions = 5; // dans redis
var questionTimeFrame = 5000; // dans redis
var synchroTimeDuration = 2000; // dans redis

var counter = 1; // dans redis

//var dateFinWarmup = new Date().getTime() + dureeWarmup; // dans redis
var responses = [];
responses[0] = [];

var quizSessions = []; // dans redis

function initGame(/*config*/){
    
    redis.hmset("context"
                        ,"maxGamers",15
                        ,"dateFinWarmup", (new Date().getTime() + dureeWarmup)
                        ,"questionEncours",0
                        );    
                        
    redis.set("numberOfPlayers",0);
    
    /**
    Timer active une tache de fond qui s execute tous les X ms
    pour verfier si on depasser le temps de warmup ou atteint le nombre
    maximum de joueurs.
    */    
    var timerId = setInterval(function(){
        gameState(
        	function(){
	            	console.log("warmup en cours...");
        	}
        	,function(){
        	    	emitter.emit('warmupEnd',timerId);
        	}
        	,null);
        
    	},1000);// TODO redefinir cette periode par ex 5O ms
}

initGame();

/**
 exemple d utilisation de cette fonction
 
  gameState(function(params){
        console.log("before : " + params.signal);
    }
    ,function(params){
        console.log("after : " + params.signal);
    }
    , {signal:"test"}
);
*/
// TODO a renommer
function gameState(beforeStartCallback,afterStartCallback,params){
    redis.hmget("context","dateFinWarmup","maxGamers","numberOfPlayers",function(err,replies){
        var dateFinWarmup = replies[0];
        var maxGamers = replies[1];
        var numberOfPlayers = replies[2];
        //console.log("dateFinWarmup = " + dateFinWarmup  );
        if(numberOfPlayers >= maxGamers || new Date().getTime() >= dateFinWarmup){
            afterStartCallback(params);    
        }else{
            beforeStartCallback(params);
        }
    });
}




/**
gere les demandes d inscription au quiz
*/
function warmup(req,resp){
     restler.get('http://127.0.0.1:8080/test')
       .on('complete', function(data) {
            gameState(function(){
                responses[0].push(resp);
                redis.incr("numberOfPlayers",function(err,counter){
                    redis.hmget("context","maxGamers",function(err,max){
                        if(counter==max){
                            emitter.emit('warmupEnd',timerId);
                        }    
                    });
                });
            }
            ,function(){
                console.log("sending immediatly");
                resp.send(400,{},"temps de reponse depasse!");
            }
            ,null);
        });
}

/**
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
        resp.send(200,{},"que le jeu commence");    
    });
    for(q=0;q<=numberOfQuestions;q++){
        responses[q] = [];// verfifier si avec le comportement asynch ca peux poser des problemes    
    }
    // initialisation des time frames des questions
    quizSessions[0] = new Date().getTime();
    for(i=1; i<numberOfQuestions ; i++){
        quizSessions[i] = quizSessions[i-1] + synchroTimeDuration + questionTimeFrame;
    }
    
    redis.hincrby("context","questionEncours",1,function(err,c){
	console.log("current question is now : " + c);
    });
    
    
});


/**
Timer active une tache de fond qui s execute tous les X ms
pour verfier si on a depasse le temps de la question en cours.
*/    
var qTimer = setInterval(function(){
    gameState(function(){
        // rien a faire
    }
    ,function(){
        redis.hmget("context","questionEncours",function(err,n){
            console.log("checking end of time for question : " + n);
            var now = new Date().getTime();
            if(now >= quizSessions[n]){
                console.log("emitting event for sending question : " + n);
                emitter.emit("sendQuestions",qTimer);
            
            }else if(now > quizSessions[numberOfQuestions]){
	       console.log("emitting event for end of game");
               emitter.emit("endOfGame",qTimer);
	    }
        });
        
    }
    ,null);
    
},500);// TODO redefinir cette periode 

emitter.on("sendQuestions",function(){
     redis.hmget("context","questionEncours",function(err,n){
        console.log("sending question : " + n + "/" + numberOfQuestions);
	if( n > numberOfQuestions){
               console.log("emitting event for end of game");
               emitter.emit("endOfGame",qTimer);
	}else{
		redis.hincrby("context","questionEncours",1);          
	}
	responses[n].forEach(function(resp){
		    resp.send(200,{},"question " + n);    
	}); 
     });
        
});

/*
    sert la question n
*/
function getQuestion(req,resp,n){
    gameState(
        function(){
            resp.send(400,{},"le jeu n a pas encore commence ");
        }
        ,function(){
            var now = new Date().getTime();
            redis.hmget("context","questionEncours",function(err,c){
	    	    if(n <= 0 || n > numberOfQuestions){
                        resp.send(400,{},"le numero de la question demande est incorrect.");
		    }else if (n>c){
			resp.send(400,{},"question demande n est pas encore atteinte.");
		    }else if(now >= quizSessions[n-1] && now <= (quizSessions[n]- synchroTimeDuration)){
		        console.log("a user requests question : " + n)
		        responses[n].push(resp);
		        //resp.send(200,{},"voici la question " + n);
		    }else if (now > (quizSessions[n]- synchroTimeDuration)){
		        resp.send(400,{},"vous avez rate la question " + n);
		    }else{
		    	resp.send(400,{},"requete incoherente.");
		    }
	    });
	    
        }
        ,null
    );
}


/*

*/
function answerQuestion(req,resp,n){
    
     gameState(
	function(){
	   resp.send(400,{},"le jeu n a pas encore commence ");
	}
        ,function(){
	    var now = new Date().getTime();
	    if(n <= 0 || n > numberOfQuestions){
	        resp.send(400,{},"le numero de la question a la quelle vous repondez est incorrect.");
	    }else if(now >= quizSessions[n-1] && now <= (quizSessions[n]- synchroTimeDuration)){
	        console.log("a user answers question : " + n)
		resp.send(200,{},"voici votre score ... et la reponse correcte a la derniere question...  ");
	    }else if (now > (quizSessions[n]- synchroTimeDuration)){
	        resp.send(400,{},"vous avez rate la question " + n);
	    }else {
	    	resp.send(400,{},"Requete incoherente.")
	    }
        }
        ,null
    );
}

emitter.on("endOfGame",function(){
	clearTimeout(qTimer);	
});

