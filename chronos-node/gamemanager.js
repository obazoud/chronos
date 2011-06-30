var redis = require("redis").createClient();
redis.on("error", function (err) {
    console.log("Error " + err);
});

var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();

var responses = [];
responses[0] = [];
responses[1] = [];

var quizSessions = []; // dans redis

var timerId;
var qTimer;

exports.initGame = function(config){
    
    redis.hmset("context"
                        , "maxGamers",parseInt(config.nbusersthreshold)
                        , "numberOfPlayers",0
			, "dureeWarmup", ( parseInt(config.logintimeout) * 1000)
			, "numberOfQuestions", parseInt(config.nbquestions)
			, "questionTimeFrame" , ( parseInt(config.questiontimeframe) * 1000)
			, "synchroTimeDuration" , ( parseInt(config.synchrotime) * 1000)
                        );    
                          
    redis.hdel("context", "questionEncours");
    redis.hdel("context", "dateFinWarmup");
    redis.del("login");

    redis.save();
    /**
    Timer active une tache de fond qui s execute tous les X ms
    pour verfier si on depasser le temps de warmup ou atteint le nombre
    maximum de joueurs.
    */    
    timerId = setInterval(function(){
        gameState(
        	function(){
	            	console.log("warmup en cours...");
        	}
        	,function(){
        	    	emitter.emit('warmupEnd',timerId);
        	}
        	,null);
        
    	},1000);// TODO redefinir cette periode en benchmarquant
}


// TODO a renommer
function gameState(beforeStartCallback,afterStartCallback,params){
    redis.hmget("context","dateFinWarmup","maxGamers","numberOfPlayers",function(err,replies){

        var dateFinWarmup = parseInt(replies[0]);
        var maxGamers = parseInt(replies[1]);
        var numberOfPlayers = parseInt(replies[2]);

        if (dateFinWarmup == null || numberOfPlayers ==  null) {
            console.log("date fin w et/ou num player nulls");
        } else {        
          if( ( numberOfPlayers >= maxGamers && responses[1].length >= maxGamers ) || new Date().getTime() >= dateFinWarmup) {
                afterStartCallback(params);    
            }else{
                beforeStartCallback(params);
            }
        }
    });
}

/**
Enregistre les users logues
*/
exports.login = function(mail, options) {
  redis.hset("login", mail, "1", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(data);
      }
    } else {
      if (options && options.success) {
        options.success();
      }
    }
  });
}

exports.isLogin = function(mail, options) {
  return redis.hexists("login", mail, function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      var exist = (reply == 1);
      if (options && options.success) {
        options.success(exist);
      }
    }
  });
}

/**
gere les demandes d inscription au quiz
*/
exports.warmup = function() {
    console.log("Warmup started... ");
    emitter.emit('gameStarted',timerId);

    gameState(function(){
        
        redis.hincrby("context", "numberOfPlayers",1, function(err,counter){
            redis.hmget("context","maxGamers",function(err,max){
                if(parseInt(counter)==parseInt(max)){
                    emitter.emit('warmupEnd',timerId);
                }   
            });
            });
    }
    ,function(){
        // rien  
    }
    ,null);
};

emitter.once("gameStarted",function(timerId){

    console.log("Game started...");

    redis.hmget("context","dureeWarmup",function(err,dureeWarmup){
	redis.hsetnx("context"
	        ,"dateFinWarmup", (new Date().getTime() + parseInt(dureeWarmup))
	    );
	
	});

    redis.hsetnx("context" ,"questionEncours",1);    
        

});

/**
gere l evenement d arret de la phase de warmup en :
    1. arretant le timer
    2. repondant a tout les utilisateurs
    3. definitions des fenetres de sessions de reponses
*/
emitter.once('warmupEnd',function(timerId){

    clearTimeout(timerId);
    console.log("warmup timer stopped");
    emitter.emit("sendQuestions",qTimer); // envoi de la question 1
    
    redis.hmget("context","numberOfQuestions","synchroTimeDuration","questionTimeFrame",function(err,params){

	    var numberOfQuestions = parseInt(params[0]);
	    var synchroTimeDuration = parseInt(params[1]);
	    var questionTimeFrame = parseInt(params[2]);

	    for(q=2;q<=numberOfQuestions;q++){
		responses[q] = [];// verfifier si avec le comportement asynch ca peux poser des problemes    
	    }
	    // initialisation des time frames des questions
	    quizSessions[0] = new Date().getTime();
	    for(i=1; i<=numberOfQuestions ; i++){
		quizSessions[i] = quizSessions[i-1] + synchroTimeDuration + questionTimeFrame;
	    }
	    
    });
    /**
    Timer active une tache de fond qui s execute tous les X ms
    pour verfier si on a depasse le temps de la question en cours.
    */    
    qTimer = setInterval(function(){
        gameState(function(){
            // rien a faire
        }
        ,function(){
            redis.hmget("context","questionEncours","numberOfQuestions",function(err,params){

		var n = parseInt(params[0]);
		var numberOfQuestions = parseInt(params[1]);

                console.log("checking end of time for question : " + n);
                var now = new Date().getTime();
		                
		if(now >= quizSessions[n]){
                    console.log("emitting event for sending question : " + n);
                    emitter.emit("sendQuestions",qTimer);
        	    redis.hincrby("context","questionEncours",1);          
		    
                }else if(now > quizSessions[numberOfQuestions]){
	            console.log("emitting event for end of game (end of time)");
                    emitter.emit("endOfGame",qTimer);
	        }
            });
            
        }
        ,null);
        
    },500);// TODO redefinir cette periode 
   
});


emitter.on("sendQuestions",function(){
     redis.hmget("context","questionEncours","numberOfQuestions",function(err,params){
	
	var n = parseInt(params[0]);
	var numberOfQuestions = parseInt(params[1]);
	
        console.log("sending question : " + n + "/" + numberOfQuestions);
    	 
	if (n >= numberOfQuestions){
            console.log("emitting event for end of game (no more questions)");
            emitter.emit("endOfGame",qTimer);
    	}
    	responses[n].forEach(function(callback){
            callback();
    	}); 
     });
        
});

/*
    sert la question n
*/
exports.getQuestion = function(n, success, fail ) {
   console.log("getQuestion " + n);

    gameState(
        function() {
            redis.hmget("context","questionEncours",function(err,c){
                if(c==1){
                    responses[1].push(success);
                }            
            });
        }
        ,function(){
            var now = new Date().getTime();
            redis.hmget("context","synchroTimeDuration","numberOfQuestions","questionEncours",function(err,params){
		    
		    var synchroTimeDuration = parseInt(params[0]);
		    var numberOfQuestions = parseInt(params[1]);
		    var questionEncours = parseInt(params[2]);

	    	    if(n <= 0 || n > numberOfQuestions){
			console.log("--->" + fail);// TODO BUG Sur la function fail (undefined)
	                fail();
		    }else if(now >= quizSessions[n-1] && now <= (quizSessions[n]- synchroTimeDuration)){
		        console.log("a user requests question : " + n)
	                responses[n].push(success);
		    }else if (now > (quizSessions[n]- synchroTimeDuration)){
		        fail();
		    }else{
		    	fail();
		    }
	    });
	    
        }
        ,null
    );
}


/*

*/
exports.answerQuestion = function(n, success, error) {
     gameState(	
	function(){
	        error();
	}
        ,function(){
	    var now = new Date().getTime();
	    
		redis.hmget("context","questionEncours","numberOfQuestions","synchroTimeDuration",function(err,params){
			    
		    var questionEncours = parseInt(params[0]);
		    var numberOfQuestions = parseInt(params[1]);
		    var synchroTimeDuration = parseInt(params[2]);

		    if(n <= 0 || n > numberOfQuestions){
			error(); 
		    }else if(now >= quizSessions[n-1] && now <= (quizSessions[n]- synchroTimeDuration)){
			console.log("a user answers question : " + n)
			success();
		    }else if (now > (quizSessions[n]- synchroTimeDuration)){
			error();
		    }else {
		    	error();
		    }
	    });
        }
        ,null
    );
}

emitter.on("endOfGame",function(){
	clearTimeout(qTimer);	
	// TODO il faut libere/gerer ttes les demande joueurs pas encore traites.
});

