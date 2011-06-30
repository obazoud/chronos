var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');

// TODO integrer le mecanisme de fail-over
var redis = require("redis").createClient();
var subscriber = require("redis").createClient();
var publisher = require("redis").createClient();

// TODO a virer lors de l integration du mecanisme de fail over
redis.on("error", function (err) {
    logger.log("Error " + err);
});
subscriber.on("error", function (err) {
    logger.log("Error " + err);
});
publisher.on("error", function (err) {
    logger.log("Error " + err);
});

// state 0: RAS
// state 1: game starts
// state 2: warmup starts
// state 3: warmup ends
// state 4: questions
// state 5: game ends
function GameState() {
  this.game = {};
  this.nbusersthreshold = 0;
  this.logintimeout = 0;
  this.questiontimeframe = 0;
  this.synchrotime = 0;
  this.state = 0;
  this.warmupStartDate = 0;
  this.warmupEndDate = 0;
  this.session_0 = 0;
  this.session_1 = 0;
  this.questionEncours = 0;
  
  this.initGame = function(newGame) {
    this.state = 1;
    this.game = newGame;
    this.nbusersthreshold = parseInt(this.game.gamesession.parameters.nbusersthreshold);
    this.logintimeout = parseInt(this.game.gamesession.parameters.logintimeout) * 1000;
    this.questiontimeframe = parseInt(this.game.gamesession.parameters.questiontimeframe) * 1000;
    this.synchrotime = parseInt(this.game.gamesession.parameters.synchrotime) * 1000;
  };

  this.warmupStarts = function(now) {
    if (this.state == 1) {
      logger.log('State changed state:' + this.state + ' -> ' + 2);
      this.state = 2;
      this.warmupStartDate = now;
      this.warmupEndDate = now + parseInt(this.logintimeout);
      this.session_0 = now;
      this.session_1 = now + parseInt(this.logintimeout);
      this.questionEncours = 1;
    } else {
      logger.log('Already in state 2');
    }
  };

//  this.persist = function() {
//  };

//  this.retrieve = function() {
//  };

}

var gameState = new GameState();

var channel = '#chronos';
subscriber.subscribe(channel);

subscriber.on("subscribe", function (channel, count) {
  logger.log('Client subscribed to channel ' + channel + ', ' + count + ' total subscriptions.');
});

// TODO: unsubcribe on exit ?
subscriber.on("unsubscribe", function (channel, count) {
    console.log('Client unsubscribed from ' + channel + ', ' + count + ' total subscriptions.');
});

subscriber.on('message', function(channel, message) {
  logger.log(channel + ': ' + message);
  var json = JSON.parse(message);
  switch (json.event) {
    case 'initGame':
        gameState.initGame(json.message);
        logger.log(sys.inspect(gameState, false));
      break;
    case 'warmupStarts':
        gameState.warmupStarts(json.warmupStartDate);
        logger.log(sys.inspect(gameState, false));
      break;
    default:
      logger.log('Unknow event:' + json.event);
      break;
  }
});

// nbquestions : le nombre de questions à jouer. 
// Doit être inférieur ou égal au nombre de questions présentes dans le fichier (élement <usi:questions>). 
// --> Ce paramètre est considéré comme inutile. Nous jouerons toujours 20 questions.
var numberOfQuestions = 20;

/** Initialize game **/
exports.initGame = function(game) {
  redis.del("context");
  redis.hmset("context",
    "nbusersthreshold", parseInt(game.gamesession.parameters.nbusersthreshold),
    "numberOfPlayers", 0,
    "logintimeout", (parseInt(game.gamesession.parameters.logintimeout) * 1000),
    "questiontimeframe", (parseInt(game.gamesession.parameters.questiontimeframe) * 1000),
    "synchrotime", (parseInt(game.gamesession.parameters.synchrotime) * 1000)
  );
  redis.del("players");
  redis.set("game", JSON.stringify(game));
  redis.save();
  // TODO: callback save ?
  var message = {
    'event': 'initGame',
    'message': game
  };
  publisher.publish(channel, JSON.stringify(message));
};

/** Warmup quizz **/
exports.warmup = function() {
  emitter.emit('warmupStarted');
  redis.hincrby("context", "numberOfPlayers", 1);
};

emitter.once("warmupStarted", function() {
  var now = new Date().getTime();
  logger.log("Warmup started... ");
  gameState.warmupStarts(now);

  redis.hsetnx("context", "warmupStartDate", gameState.warmupStartDate);
  redis.hsetnx("context", "warmupEndDate", gameState.warmupEndDate);
  redis.hsetnx("context", "session_0" , gameState.session_0);
  redis.hsetnx("context", "session_1" , gameState.session_1);
  redis.hsetnx("context", "questionEncours", 1);
  redis.save();

  logger.log(sys.inspect(gameState,false));

  var message = {
    'event': 'warmupStarts',
    'warmupStartDate': gameState.warmupStartDate,
  };
  publisher.publish(channel, JSON.stringify(message));
  warmupLoop();
});

function warmupLoop () {
    redis.hmget("context", "numberOfPlayers", function(err, numberOfPlayers) {
      if (parseInt(numberOfPlayers) >= parseInt(gameState.nbusersthreshold)) {
        emitter.emit("warmupEnd");
      } else {
        // TODO : timeout ?
        setTimeout(warmupLoop, 250);
      }
    });
};

/**
gere l evenement d arret de la phase de warmup en :
    1. arretant le timer
    2. repondant a tout les utilisateurs
    3. definitions des fenetres de sessions de reponses
*/
emitter.once('warmupEnd', function(success) {
  logger.log("warmup timer stopped");
  var now = new Date().getTime();

  redis.hmget("context", "synchrotime", "questiontimeframe", function(err, params) {
    var synchrotime = parseInt(params[0]);
    var questiontimeframe = parseInt(params[1]);

    // initialisation des timeFrames des questions
    logger.log("initialize timeFrames." + now);
    var quizSessions = [];
    quizSessions[1] = now;
    for (i = 2; i <= numberOfQuestions+1; i++) {
      quizSessions[i] = quizSessions[i-1] + questiontimeframe + synchrotime;
    }
    // logger.log("timeFrames:" + quizSessions);
    redis.hmset("context",
      "session_1", quizSessions[1],
      "session_2", quizSessions[2],
      "session_3", quizSessions[3],
      "session_4", quizSessions[4],
      "session_5", quizSessions[5],
      "session_6", quizSessions[6],
      "session_7", quizSessions[7],
      "session_8", quizSessions[8],
      "session_9", quizSessions[9],
      "session_10", quizSessions[10],
      "session_11", quizSessions[11],
      "session_12", quizSessions[12],
      "session_13", quizSessions[13],
      "session_14", quizSessions[14],
      "session_15", quizSessions[15],
      "session_16", quizSessions[16],
      "session_17", quizSessions[17],
      "session_18", quizSessions[18],
      "session_19", quizSessions[19],
      "session_20", quizSessions[20],
      "session_21", quizSessions[21],
      function() {
        logger.log("initialize timeFrames done.");
        if (success) {
          success();
        }
        redis.save();
    });
  });
});

function setTimeoutForTimeFrame(timeout, login, n, success, fail) {
  setTimeout(setTimeoutForTimeFrameCB, timeout, login, n, success, fail);
};

function setTimeoutForTimeFrame1(timeout, login,  n, success, fail) {
  setTimeout(setTimeoutForTimeFrameCB1, timeout, login, n, success, fail);
};

function setTimeoutForTimeFrameCB(login, n, success, fail) {
  logger.log("------> time out for answering question : (" + login + ") " + n);
  redis.hincrby("context", "questionEncours", 1, function(err, params) {
    emitter.emit("sendQuestions", login, n, success, fail);
  });
};

function setTimeoutForTimeFrameCB1(login, n, success, fail) {
  emitter.emit("warmupEnd", success, fail);
};

emitter.on("sendQuestions", function(login, n, success, fail) {
  redis.hmget("context","questionEncours", function(err,params) {
    var questionEncours = parseInt(params[0]);
    logger.log(login + ": sending question (" + n + ") : " + questionEncours + "/" + numberOfQuestions);

    if (questionEncours > numberOfQuestions) {
      logger.log(login + ": emitting event for end of game (no more questions)");
      emitter.emit("endOfGame");
      fail();
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
      var sessionNMoins1 = parseInt(params[1]);
      var sessionN = parseInt(params[2]);

      logger.log(login + ": sessionNMoins1: " + new Date(sessionNMoins1));
      logger.log(login + ": sessionN: " + new Date(sessionN));
      if (n <= numberOfQuestions && now >= sessionNMoins1 && now < sessionN) {
        timeout = sessionN - now;
        logger.log(login + ": is waiting for question : " + n + ', timeout ' + timeout + ' ms.');
        if (n == 1) {
          setTimeoutForTimeFrame1(timeout, login, n, success, fail);
        } else {
          setTimeoutForTimeFrame(timeout, login, n, success, fail);
        }
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
  redis.hmget("context", "questionEncours", "synchrotime", "session_" + n, "session_" + (n + 1), function(err, params) {
    var questionEncours = parseInt(params[0]);
    var synchrotime = parseInt(params[1]);
    var sessionN = parseInt(params[2]);
    var sessionNplus1 = parseInt(params[3]);

    if (now >= sessionN && now < (sessionNplus1 - synchrotime)) {
      logger.log(login + " answers question : " + n)
      success();
    } else {
      logger.log("n = " + n + ', login:' + login);
      logger.log("questionEncours = " + questionEncours);
      logger.log("  now = " + new Date(now) );
      logger.log("  quizSessions[n] = " + new Date(sessionN));
      logger.log("  quizSessions[n+1] = " + new Date(sessionNplus1));
      logger.log("  quizSessions[n+1] - synchro  = " + new Date(sessionNplus1 - synchrotime));

      fail();
      if (n =! questionEncours) {
        logger.log("answered question is not the current one.");
      } else if (now > sessionN- synchrotime) {
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
