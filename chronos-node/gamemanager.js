var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');

// TODO Think about multiples nodes instances
// TODO Think about multiples servers

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
  this.sessions = [];
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
      logger.log('State changed state: ' + this.state + ' -> ' + 2);
      this.state = 2;
      this.warmupStartDate = now;
      this.warmupEndDate = now + parseInt(this.logintimeout);
      this.sessions[0] = now;
      this.sessions[1] = now + parseInt(this.logintimeout);
      this.questionEncours = 1;
    } else {
      logger.log('Already in state 2');
    }
  };

  this.warmupEnds = function(now) {
    if (this.state == 2) {
      logger.log('State changed state: ' + this.state + ' -> ' + 3);
      this.state = 3;
      this.sessions[1] = now;
      for (i = 2; i <= numberOfQuestions + 1; i++) {
        this.sessions[i] = this.sessions[i - 1] + this.questiontimeframe + this.synchrotime;
      }
    } else {
      logger.log('Already in state 3');
    }
  };

//  this.persist = function() {
//  };

  this.retrieve = function() {
    // TODO : at node startup get state from redis
  };

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
        // logger.log(sys.inspect(gameState, false));
      break;
    case 'warmupStarts':
        gameState.warmupStarts(json.warmupStartDate);
        // logger.log(sys.inspect(gameState, false));
      break;
    case 'warmupEnds':
        gameState.warmupEnds(json.warmupEnd);
        // logger.log(sys.inspect(gameState, false));
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

// TODO : 'once' works with a 2nd game ?
emitter.once("warmupStarted", function() {
  var now = new Date().getTime();
  logger.log("Warmup started... ");
  gameState.warmupStarts(now);
  // logger.log(sys.inspect(gameState,false));

  redis.hsetnx("context", "warmupStartDate", gameState.warmupStartDate);
  redis.hsetnx("context", "warmupEndDate", gameState.warmupEndDate);
  redis.hsetnx("context", "session_0" , gameState.session_0);
  redis.hsetnx("context", "session_1" , gameState.session_1);
  redis.hsetnx("context", "questionEncours", 1);
  redis.save();

  var message = {
    'event': 'warmupStarts',
    'warmupStartDate': gameState.warmupStartDate,
  };
  publisher.publish(channel, JSON.stringify(message));

  warmupLoop();
});

function warmupLoop () {
  redis.hmget("context", "numberOfPlayers", function(err, numberOfPlayers) {
    var now = new Date().getTime();
    if (parseInt(numberOfPlayers) >= parseInt(gameState.nbusersthreshold) || now >= gameState.warmupEndDate) {
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
emitter.on('warmupEnd', function(success) {
  if (gameState.state == 2) {
    logger.log("warmup timer stopped");
    var now = new Date().getTime();
    logger.log("initialize timeFrames: " + new Date(now));
    gameState.warmupEnds(now);

    // logger.log("timeFrames:" + gameState.sessions);
    // TODO : hsetnx ? exception is for index 1
    redis.hmset("context",
      "session_1", gameState.sessions[1],
      "session_2", gameState.sessions[2],
      "session_3", gameState.sessions[3],
      "session_4", gameState.sessions[4],
      "session_5", gameState.sessions[5],
      "session_6", gameState.sessions[6],
      "session_7", gameState.sessions[7],
      "session_8", gameState.sessions[8],
      "session_9", gameState.sessions[9],
      "session_10", gameState.sessions[10],
      "session_11", gameState.sessions[11],
      "session_12", gameState.sessions[12],
      "session_13", gameState.sessions[13],
      "session_14", gameState.sessions[14],
      "session_15", gameState.sessions[15],
      "session_16", gameState.sessions[16],
      "session_17", gameState.sessions[17],
      "session_18", gameState.sessions[18],
      "session_19", gameState.sessions[19],
      "session_20", gameState.sessions[20],
      "session_21", gameState.sessions[21],
      function() {
        logger.log("Initialize timeFrames done.");
        redis.save();
    });

    if (success) {
      logger.log("warmupEnd: First success.");
      success();
    }
    var message = {
      'event': 'warmupEnds',
      'warmupEnd': now,
    };

    publisher.publish(channel, JSON.stringify(message));
  } else {
    logger.log("warmupEnd: success.");
    if (success) {
      // logger.log(success);
      success();
    }
  }
});

function setTimeoutForTimeFrame(timeout, login, n, success, fail) {
  setTimeout(setTimeoutForTimeFrameCB, timeout, login, n, success, fail);
};

function setTimeoutForTimeFrame1(timeout, login,  n, success, fail) {
  setTimeout(setTimeoutForTimeFrameCB1, timeout, login, n, success, fail);
};

function setTimeoutForTimeFrameCB(login, n, success, fail) {
  logger.log("------> time out for answering question : (" + login + ") " + n);
  emitter.emit("questionEncours" + n, n);
  emitter.emit("sendQuestions", login, n, success, fail);
};

function setTimeoutForTimeFrameCB1(login, n, success, fail) {
  logger.log("------> (CB1) time out for answering question : (" + login + ") " + n);
  emitter.emit("warmupEnd", success, fail);
};

// TODO with a new game, register again ?
for (var k = 1; k <= 20; k++) {
  emitter.once("questionEncours" + k, function (n) {
    gameState.questionEncours = n;
    logger.log('Once questionEncours ' + n);
    // TODO and others node do that ?
    redis.hincrby("context", "questionEncours", 1);
  });
}

emitter.on("sendQuestions", function(login, n, success, fail) {
  // logger.log(login + ": sending question (" + n + ") : " + gameState.questionEncours + "/" + numberOfQuestions);

  if (gameState.questionEncours > numberOfQuestions) {
    logger.log(login + ": emitting event for end of game (no more questions)");
    emitter.emit("endOfGame");
    fail();
  } else {
    success();
  }

});

/** Get question N **/
exports.getQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();
  logger.log("getQuestion " + n + " -> " + login);
  // TODO check questEncours value ?
  var sessionNMoins1 = gameState.sessions[n - 1];
  var sessionN = gameState.sessions[n];

  // logger.log(login + ": sessionNMoins1: " + new Date(sessionNMoins1));
  // logger.log(login + ": sessionN: " + new Date(sessionN));
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
}

/** Answer Question N **/
exports.answerQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();
  redis.hmget("context", "questionEncours", function(err, params) {
    var questionEncours = parseInt(params[0]);
    var sessionN = gameState.sessions[n];
    var sessionNplus1 = gameState.sessions[n + 1];

    if (now >= sessionN && now < (sessionNplus1 - gameState.synchrotime)) {
      logger.log(login + " answers question : " + n)
      success();
    } else {
      logger.log("n = " + n + ', login:' + login);
      logger.log("questionEncours = " + questionEncours);
      logger.log("  now = " + new Date(now) );
      logger.log("  quizSessions[n] = " + new Date(sessionN));
      logger.log("  quizSessions[n+1] = " + new Date(sessionNplus1));
      logger.log("  quizSessions[n+1] - synchro  = " + new Date(sessionNplus1 - gameState.synchrotime));

      fail();
      if (n =! questionEncours) {
        logger.log("answered question is not the current one.");
      } else if (now > sessionN - gameState.synchrotime) {
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

/** Get Score **/
exports.getScore = function(login, options) {
  redis.hget("players", login + ":score", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      // logger.log("Get score: " + reply)
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

/** Updationg Score with good/bad answer question and bonus **/
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

      // logger.log("updatingScore: " + score)
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
  return gameState.game;
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


/** Register users **/
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

/** Is a user logged ? **/
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

/** Get all answers **/
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
