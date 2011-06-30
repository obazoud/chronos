var redis = require("redis").createClient();   // TODO integrer le mecanisme de fail-over

redis.on("error", function (err) {
    logger.log("Error " + err);
});

var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');

var responses = [];
responses[0] = [];
responses[1] = [];


var timerId;
var qTimer;

exports.initGame = function(game) {
    
    redis.del("context");

    redis.hmset("context"
                        , "maxGamers",parseInt(game.gamesession.parameters.nbusersthreshold)
                        , "numberOfPlayers",0
                        , "dureeWarmup", ( parseInt(game.gamesession.parameters.logintimeout) * 1000)
                        , "numberOfQuestions", parseInt(game.gamesession.parameters.nbquestions)
                        , "questionTimeFrame" , ( parseInt(game.gamesession.parameters.questiontimeframe) * 1000)
                        , "synchroTimeDuration" , ( parseInt(game.gamesession.parameters.synchrotime) * 1000)
                        );    


    redis.del("players");
    redis.set("game", JSON.stringify(game));

    redis.save();
    /**
    Timer active une tache de fond qui s execute tous les X ms
    pour verfier si on depasser le temps de warmup ou atteint le nombre
    maximum de joueurs.
    */    
    timerId = setInterval(function(){
        gameState(
        	function(){
	            	//logger.log("en attente du debut du jeu...");
        	}
        	,function(){
        	    	emitter.emit('warmupEnd',timerId);
        	}
        	,null);
        
    },20);// TODO redefinir cette periode en benchmarquant
};

exports.getGame = function(options) {
  redis.get("game", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      if (options && options.success) {
        options.success(JSON.parse(reply));
      }
    }
  });
};

function gameState(beforeStartCallback,afterStartCallback,params){
    redis.hmget("context","dateFinWarmup","maxGamers","numberOfPlayers",function(err,replies){

	// TODO recuperer une seule fois et mettre en variable globales
        var dateFinWarmup = parseInt(replies[0]);
        var maxGamers = parseInt(replies[1]);
        var numberOfPlayers = parseInt(replies[2]);

        if (dateFinWarmup == null || numberOfPlayers ==  null) {
            logger.log("date fin w et/ou num player nulls");
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
  redis.hset('players', mail + ':login', "1", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      redis.hincrby('players', 'logged', 1);
      if (options && options.success) {
        options.success();
      }
    }
  });
}

exports.isLogin = function(mail, options) {
  return redis.hexists('players', mail + ':login', function(err, reply) {
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

exports.logged = function(mail, options) {
  redis.hincrby('players', mail + ':login', -1, function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      var value = parseInt(reply);
      if (value >= 0) {
        redis.hincrby('players', 'logged', -1, function(err, reply2) {
          if (err) {
            if (options && options.error) {
              options.error(err);
            }
          } else {
            if (options && options.success) {
              options.success(reply2);
            }
          }
        });
      } else {
        redis.hget('players', 'logged', function(err, reply2) {
          if (err) {
            if (options && options.error) {
              options.error(err);
            }
          } else {
            if (options && options.success) {
              options.success(reply2);
            }
          }
        });
      }
    }
  });
}

/**
gere les demandes d inscription au quiz
*/
exports.warmup = function() {
    logger.log("Warmup started... ");
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

    logger.log("Game started...");
    var now = new Date().getTime();
    redis.hmget("context","dureeWarmup",function(err,dureeWarmup){
	redis.hsetnx("context"
	        ,"dateFinWarmup", (now + parseInt(dureeWarmup))
	    );

        redis.hmset("context",
                        "session_" + 0 , now,
                        "session_" + 1 ,now + parseInt(dureeWarmup));
        redis.save();
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
    logger.log("warmup timer stopped");
    emitter.emit("sendQuestions",qTimer); // envoi de la question 1
    
    redis.hmget("context","numberOfQuestions","synchroTimeDuration","questionTimeFrame","dateFinWarmup",function(err,params){

	    var numberOfQuestions = parseInt(params[0]);
	    var synchroTimeDuration = parseInt(params[1]);
	    var questionTimeFrame = parseInt(params[2]);
	    var dateFinWarmup = parseInt(params[3]);

	    for(q=2;q<=numberOfQuestions;q++){
		    responses[q] = [];// verfifier si avec le comportement asynch ca peux poser des problemes
	    }

	    // initialisation des timeFrames des questions
	    var now = new Date().getTime();
        redis.hset("context",
                        "session_" + 1 , now);


        var quizSessions = [];

        quizSessions[1] = now;
        for(i=2; i<=(numberOfQuestions+1) ; i++){
             quizSessions[i] = quizSessions[i-1] + questionTimeFrame + synchroTimeDuration;
              
        }

        for (k=0;k<quizSessions;k++) {
          logger.log('Dump quizSessions[k] ' + ' -> ' + new Date(quizSessions[k]));
        }
        for(j=2; j<=(numberOfQuestions+1) ; j++){
		    redis.hset("context",
                        "session_" + j  , quizSessions[j]);
	    }
        redis.save();

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

                // logger.log("checking end of time for question : " + n);
                var now = new Date().getTime();
                redis.hget("context","session_"+n,function(err,sessionN){    // FIXME une charge en plus pour redis
                    logger.log('now: ' + new Date(now) + ' -> sessionN: ' + new Date(sessionN));
                    if(now >= sessionN){
                            logger.log("emitting event for sending question : " + n);
                            emitter.emit("sendQuestions",qTimer);
                            if( n < numberOfQuestions ) {
				    redis.hincrby("context","questionEncours",1);
            logger.log("hincrby 1 questionEncours");
			    }
                    }
                });

            });

        }
        ,null);
        
    },100);// TODO redefinir cette periode 
   
});


emitter.on("sendQuestions",function(){
     redis.hmget("context","questionEncours","numberOfQuestions",function(err,params){
	
	var n = parseInt(params[0]);
	var numberOfQuestions = parseInt(params[1]);
	
        logger.log("sending question : " + n + "/" + numberOfQuestions);
    	 
	if (n >= numberOfQuestions){
            logger.log("emitting event for end of game (no more questions)");
            emitter.emit("endOfGame",qTimer);
    	}
	// TODO make this asynch
    	responses[n].forEach(function(callback){
            callback();
    	}); 
     });
        
});

/*
    sert la question n
*/
exports.getQuestion = function(n, success, fail ) {
   logger.log("getQuestion " + n);
   var now = new Date().getTime();	
   gameState(
        function() {
            redis.hmget("context","questionEncours",function(err,c){
                if(c==1){
                    responses[1].push(success);
                }            
            });
        }
        ,function(){

            redis.hmget("context","synchroTimeDuration","numberOfQuestions","session_" + (n-1),"session_" + n ,function(err,params){
		    
	    var synchroTimeDuration = parseInt(params[0]);
	    var numberOfQuestions = parseInt(params[1]);
	    var sessionNMoins1 = parseInt(params[2]);
	    var sessionN = parseInt(params[3]);

		   
		   if((n<=numberOfQuestions) && (now >= sessionNMoins1 && now <= sessionN)){
		    	logger.log("a user waiting for question : " + n)
	                responses[n].push(success);
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
exports.answerQuestion = function(n, success, fail) { 
     gameState(	
	function(){
	        error();
	}
        ,function(){
	    var now = new Date().getTime();
	    
		redis.hmget("context","questionEncours","synchroTimeDuration","session_" + n,"session_" + (n+1) ,function(err,params){
			    
		    var questionEncours = parseInt(params[0]);
		    var synchroTimeDuration = parseInt(params[1]);
		    var sessionN = parseInt(params[2]);
		    var sessionNplus1 = parseInt(params[3]);


		    if(now >= sessionN && now <= (sessionNplus1- synchroTimeDuration)){
		    	logger.log("a user answers question : " + n)
	                success();
		    }else{

			logger.log("n = " + n);
			logger.log("questionEncours = " + questionEncours);
			logger.log("  now = " + new Date(now) );
			logger.log("  quizSessions[n] = " + new Date(sessionN));
			logger.log("  quizSessions[n+1] = " + new Date(sessionNplus1));
			logger.log("  quizSessions[n+1] - synchro  = " + new Date(sessionNplus1 - synchroTimeDuration));
				
			fail();			
			if(n=!questionEncours){
				logger.log("answered question is not the current one.");		    	
			}else if (now > sessionN- synchroTimeDuration ){
				logger.log("time for answering question is finished.");
			}else{
				logger.log("unexpected problem on answerQuestion.");
			}			
			
		    }
	    });
        }
        ,null
    );
}

emitter.on("endOfGame",function(){
	clearTimeout(qTimer);	
});

exports.getScore = function(login, options) {
  redis.hget("players", login + ":score", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      logger.log("Get score: " + reply)
      if (options && options.success) {
        if (reply == null) {
          options.success(0);
        } else {
          options.success(parseInt(reply));
        }
      }
    }
  });
}

exports.updatingScore = function(lastname, firstname, login, question, reponse, correct, questionValue, options) {
  redis.hmget("players", login + ":score", login + ':lastbonus', function(err, replies) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      var score = 0;
      var lastbonus = 0;

      if (replies[0]) {
        score = parseInt(replies[0]);
      }
      if (replies[1]) {
        lastbonus = parseInt(replies[1]);
      }

      if (reponse == correct) {
        var bonus = lastbonus;
        lastbonus = lastbonus + 1;
        var inc = questionValue + bonus;
        score = score + inc;
      } else {
        lastbonus = 0;
      }
      logger.log("updatingScore: " + score)
      redis.hmset("players", login + ":score", score, login + ':lastbonus', lastbonus, login + ':q:' + question, reponse);
      var token = JSON.stringify({"lastname":lastname, "firstname":firstname, "mail":login});
      redis.zadd("scores", -score, token, function(err, updated) {
        if (err) {
          if (options && options.error) {
            options.error(err);
          }
        } else {
          if (options && options.success) {
            options.success(score);
          }
        }
      });
    }
  });
};

exports.getAnswer = function(login, n, options) {
  redis.hmget("players",
    login + ':q:' + n,
    function(err, reply) {
      if (err) {
        if (options && options.error) {
          options.error(err);
        }
      } else {
        if (options && options.success) {
          if (reply == null) {
            options.success(0);
          } else {
            options.success(parseInt(reply));
          }
        }
      }
    }
  );
};

exports.getAnswers = function(login, options) {
  redis.hmget("players",
    login + ':q:1',
    login + ':q:2',
    login + ':q:3',
    login + ':q:4',
    login + ':q:5',
    login + ':q:6',
    login + ':q:7',
    login + ':q:8',
    login + ':q:9',
    login + ':q:10',
    login + ':q:11',
    login + ':q:12',
    login + ':q:13',
    login + ':q:14',
    login + ':q:15',
    login + ':q:16',
    login + ':q:17',
    login + ':q:18',
    login + ':q:19',
    login + ':q:20',
    function(err, replies) {
      if (err) {
        if (options && options.error) {
          options.error(err);
        }
      } else {
        if (options && options.success) {
          var answers = new Array();
          for (i = 0; i < 19; i++) {
            if (replies[i] == null) {
              answers[i] = 0;
            } else {
              answers[i] = parseInt(replies[i]);
            }
          }
          options.success(answers);
        }
      }
    }
  );
};
