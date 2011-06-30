// TODO integrer le mecanisme de fail-over
var redis = require("redis").createClient();

// TODO a virer lors de l integration du mecanisme de fail over
redis.on("error", function (err) {
    logger.log("Error " + err);
});

var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');

// nbquestions : le nombre de questions à jouer. 
// Doit être inférieur ou égal au nombre de questions présentes dans le fichier (élement <usi:questions>). 
// --> Ce paramètre est considéré comme inutile. Nous jouerons toujours 20 questions.
var numberOfQuestions = 20;

exports.initGame = function(game) {
  redis.del("context");
  redis.hmset("context",
    "maxGamers",parseInt(game.gamesession.parameters.nbusersthreshold),
    "numberOfPlayers",0,
    "dureeWarmup", (parseInt(game.gamesession.parameters.logintimeout) * 1000),
    "questionTimeFrame" , (parseInt(game.gamesession.parameters.questiontimeframe) * 1000),
    "synchroTimeDuration" , (parseInt(game.gamesession.parameters.synchrotime) * 1000)
  );
  redis.del("players");
  redis.set("game", JSON.stringify(game));
  redis.save();
};

/** Warmup quizz **/
exports.warmup = function() {
  emitter.emit('warmupStarted');
  redis.hincrby("context", "numberOfPlayers", 1, function(err,counter){
    redis.hmget("context", "maxGamers", function(err, max){
      if(parseInt(counter) == parseInt(max)) {
        emitter.emit('warmupEnd');
      }
    });
  });
};

emitter.once("warmupStarted",function(){
  var now = new Date().getTime();
  logger.log("Warmup started... ");

  redis.hmget("context","dureeWarmup",function(err,dureeWarmup){
    redis.hsetnx("context" ,"dateFinWarmup", (now + parseInt(dureeWarmup)));
      setTimeout(function(){
        emitter.emit("warmupEnd");
      }, parseInt(dureeWarmup));

    redis.hmset("context",
      "session_" + 0 , now,
      "session_" + 1 ,now + parseInt(dureeWarmup));
    redis.save();
  });

  redis.hsetnx("context", "questionEncours", 1);
});

/**
gere l evenement d arret de la phase de warmup en :
    1. arretant le timer
    2. repondant a tout les utilisateurs
    3. definitions des fenetres de sessions de reponses
*/
emitter.once('warmupEnd',function(){
  logger.log("warmup timer stopped");
  var now = new Date().getTime();
  // emitter.emit("sendQuestions"); // envoi de la question 1

  redis.hmget("context", "synchroTimeDuration", "questionTimeFrame", function(err, params) {
    var synchroTimeDuration = parseInt(params[1]);
    var questionTimeFrame = parseInt(params[2]);

    // initialisation des timeFrames des questions
    redis.hset("context", "session_" + 1 , now);
    var quizSessions = [];

    quizSessions[1] = now;
    for(i = 2; i<= (numberOfQuestions + 1); i++) {
      quizSessions[i] = quizSessions[i-1] + questionTimeFrame + synchroTimeDuration;
    }

    for(j = 2; j <= (numberOfQuestions + 1); j++) {
      redis.hset("context", "session_" + j  , quizSessions[j]);
    }
    redis.save();

  });
});

function setTimeoutForTimeFrame(timeout, n, success) {
  setTimeout(setTimeoutForTimeFrameCB, timeout, n, success);
};

function setTimeoutForTimeFrameCB(n, success) {
  logger.log("------> time out for answering question : " + n);
  redis.hincrby("context", "questionEncours", 1);
  emitter.emit("sendQuestions", n, success);
};

emitter.on("sendQuestions", function(n, success) {
  redis.hmget("context","questionEncours", function(err,params) {
    var questionEncours = parseInt(params[0]);
    logger.log("sending question (" + n + ") : " + questionEncours + "/" + numberOfQuestions);

    if (questionEncours >= numberOfQuestions) {
      logger.log("emitting event for end of game (no more questions)");
      emitter.emit("endOfGame");
    } else {
      success();
    }

  });
});

/*
    sert la question n
*/
exports.getQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();
  logger.log("getQuestion " + n + " -> " + login);

  redis.hmget("context",
    "questionEncours",
    "session_" + (n-1),
    "session_" + n,
    function(err,params) {
      var questionEncours = parseInt(params[0]);
      var sessionNMoins1 = parseInt(params[2]);
      var sessionN = parseInt(params[3]);

      if ((n <= numberOfQuestions) && (now >= sessionNMoins1 && now < sessionN)) {
        timeout = sessionN - now;
        logger.log(login + " is waiting for question : " + n + ', timeout ' + timeout + ' ms.');
        setTimeoutForTimeFrame(timeout, n, success);
      } else {
        logger.log("failed for question : " + n);
        fail();
    }
  });
}

/*

*/
exports.answerQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();
  redis.hmget("context", "questionEncours", "synchroTimeDuration", "session_" + n, "session_" + (n + 1), function(err, params) {
    var questionEncours = parseInt(params[0]);
    var synchroTimeDuration = parseInt(params[1]);
    var sessionN = parseInt(params[2]);
    var sessionNplus1 = parseInt(params[3]);

    if (now >= sessionN && now < (sessionNplus1 - synchroTimeDuration)) {
      logger.log(login + " answers question : " + n)
      success();
    } else {
      logger.log("n = " + n + ', login:' + login);
      logger.log("questionEncours = " + questionEncours);
      logger.log("  now = " + new Date(now) );
      logger.log("  quizSessions[n] = " + new Date(sessionN));
      logger.log("  quizSessions[n+1] = " + new Date(sessionNplus1));
      logger.log("  quizSessions[n+1] - synchro  = " + new Date(sessionNplus1 - synchroTimeDuration));

      fail();
      if (n =! questionEncours) {
        logger.log("answered question is not the current one.");
      } else if (now > sessionN- synchroTimeDuration) {
        logger.log("time for answering question is finished.");
      } else {
        logger.log("unexpected problem on answerQuestion.");
      }
    }
  });
}

emitter.on("endOfGame",function() {
  logger.log("event endOfGame recu.");
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

exports.getNumberOfPlayers = function(options) {
  redis.hmget("context", "numberOfPlayers", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      if (options && options.success) {
        options.success(parseInt(reply));
      }
    }
  });
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
