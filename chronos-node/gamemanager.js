var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');

// nbquestions : le nombre de questions à jouer. 
var numberOfQuestions = 20;

var os = require('os');
var redis = require("redis").createClient(6379, "192.168.1.1");
var subscriber = require("redis").createClient(6379, "192.168.1.1");
var publisher = require("redis").createClient(6379, "192.168.1.1");

var channel = '#chronos';

redis.on("error", function (err) {
    logger.log("Error " + err);
});
subscriber.on("error", function (err) {
    logger.log("Error " + err);
});
publisher.on("error", function (err) {
    logger.log("Error " + err);
});

subscriber.subscribe(channel);

subscriber.on("subscribe", function (channel, count) {
  logger.log('Client subscribed to channel ' + channel + ', ' + count + ' total subscriptions.');
});

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

// state 0: RAS
// state 1: game starts
// state 2: warmup starts
// state 3: warmup ends
// state 4: questionsEnds
// state 5: ??
function GameState() {
  this.game = {};
  this.gameFragments = {};
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
    // Force init game
    // reload data after crash
    logger.log('State changed state: ' + this.state + ' -> ' + 1);
    this.state = 1;
    redis.hset("context", "state", this.state);
    this.game = newGame;
    this.nbusersthreshold = parseInt(this.game.gamesession.parameters.nbusersthreshold);
    this.logintimeout = parseInt(this.game.gamesession.parameters.logintimeout) * 1000;
    this.questiontimeframe = parseInt(this.game.gamesession.parameters.questiontimeframe) * 1000;
    this.synchrotime = parseInt(this.game.gamesession.parameters.synchrotime) * 1000;
    this.questionEncours = 0;

    for(var i = 0; i < numberOfQuestions; i++) {
      var q = this.game.gamesession.questions.question[i];
      this.gameFragments[i] = {};
      this.gameFragments[i].question = q.label;
      for (var j = 0; j < q.choice.length; j++) {
        this.gameFragments[i]['answer_' + (j+1)] = q.choice[j];
      }
    }
  };

  this.warmupStarts = function(now1) {
    // Force to use local time
    // ntp sucks
    var now = new Date().getTime();
    if (this.state == 1) {
      logger.log('State changed state: ' + this.state + ' -> ' + 2);
      this.state = 2;
      redis.hset("context", "state", this.state);
      this.warmupStartDate = now;
      this.warmupEndDate = now + parseInt(this.logintimeout);
      this.sessions[0] = this.warmupStartDate;
      this.sessions[1] = this.warmupEndDate;
      this.questionEncours = 1;
    } else {
      logger.log('Already in state 2');
    }
  };

  this.warmupEnds = function(now) {
    if (this.state == 2) {
      logger.log('State changed state: ' + this.state + ' -> ' + 3);
      this.state = 3;
      redis.hset("context", "state", this.state);
      this.sessions[1] = now;
      for (i = 2; i <= numberOfQuestions + 1; i++) {
        this.sessions[i] = this.sessions[i - 1] + this.questiontimeframe + this.synchrotime;
        logger.log('sessions' + i + ': ' + this.sessions[i] + ' / ' + new Date(this.sessions[i]));
      }
    } else {
      logger.log('Already in state 3');
    }
  };

  this.questionsEnds = function(now) {
    if (this.state == 3) {
      logger.log('State changed state: ' + this.state + ' -> ' + 4);
      this.state = 5;
      redis.hset("context", "state", this.state);
    } else {
      // logger.log('Already in state 4');
    }
  };

//  this.persist = function() {
//  };

  this.retrieve = function() {
    logger.log("****** Game manager loads data from database ******");
    this.state == 0;
    that = this;
    redis.get("game", function(err, rgame) {
      try {
        // reinit game
        that.initGame(JSON.parse(rgame));
        // TODO: ...
      logger.log("****** Game manager loads data from database: DONE ******");
      } catch (err2) {
         logger.log("Something wrong here -> " + err2);
         return;
      }
    });
  
  };
}

var gameState = new GameState();
gameState.retrieve();

/** Initialize game **/
exports.initGame = function(game) {
  redis.del("context");
  redis.del("players");
  redis.hset("context", "numberOfPlayers", 0);
  redis.set("game", JSON.stringify(game));
  // redis.save();

  // Init locally first !
  gameState.initGame(game);
  var message = {
    'event': 'initGame',
    'message': game
  };
  publisher.publish(channel, JSON.stringify(message));
};

/** Warmup quizz **/
exports.warmup = function() {
  redis.hincrby("context", "numberOfPlayers", 1);
  emitter.emit('warmupStarted');
};

emitter.once("warmupStarted", function() {
  var now = new Date().getTime();
  logger.log("Warmup started... ");
  gameState.warmupStarts(now);
  // logger.log(sys.inspect(gameState,false));

  redis.hsetnx("context", "warmupStartDate", gameState.warmupStartDate);
  redis.hsetnx("context", "warmupEndDate", gameState.warmupEndDate);
  // redis.save();

  var message = {
    'event': 'warmupStarts',
    'warmupStartDate': gameState.warmupStartDate
  };
  publisher.publish(channel, JSON.stringify(message));

  warmupLoop();
});

function warmupLoop () {
  redis.hmget("context", "numberOfPlayers", function(err, numberOfPlayers) {
    var now = new Date().getTime();
    if (parseInt(numberOfPlayers) >= parseInt(gameState.nbusersthreshold) || now >= gameState.warmupEndDate) {
      logger.log("numberOfPlayers: " + numberOfPlayers);
      logger.log("gameState.nbusersthreshold: " + gameState.nbusersthreshold);
      logger.log("now: " + now);
      logger.log("gameState.warmupEndDate: " + gameState.warmupEndDate);
      emitter.emit("warmupEnd");
    } else {
      setTimeout(warmupLoop, 1000);
    }
  });
};

/** warmupEnd **/
emitter.on('warmupEnd', function(success) {
  if (gameState.state == 2) {
    var now = new Date().getTime();
    logger.log("warmup timer stopped");
    gameState.warmupEnds(now);

    if (success) {
      success();
    }

    var message = {
      'event': 'warmupEnds',
      'warmupEnd': now
    };

    publisher.publish(channel, JSON.stringify(message));
  } else {
    if (success) {
      success();
    }
  }
});

/** Callback getQuestion **/
function setTimeoutForTimeFrame(timeout, login, n, success) {
  setTimeout(setTimeoutForTimeFrameCB, timeout, login, n, success);
  // logger.log(Date.now() + " login " + login + " waiting for " + timeout + "ms.");
};

function setTimeoutForTimeFrameCB(login, n, success) {
  gameState.questionEncours = n;
  if (n == 1) {
    emitter.emit("warmupEnd", success);
  } else {
    // if (gameState.questionEncours >= numberOfQuestions) {
    //  gameState.questionsEnds();
    //}
    success();
  }
};

/** Get question N **/
exports.getQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();

  var sessionNMoins1 = gameState.sessions[n - 1];
  var sessionN = gameState.sessions[n];

  if (n <= numberOfQuestions && now >= sessionNMoins1 && now <= sessionN) {
    setTimeoutForTimeFrame(sessionN - now, login, n, success);
  } else {
    logger.log("failed for question : " + n + ', login:' + login);
    logger.log("questionEncours = " + gameState.questionEncours);
    logger.log("  Missing for " + (now - sessionNMoins1) + ' ms.');
    fail();
  }
};

/** Answer Question N **/
exports.answerQuestion = function(n, login, success, fail) {
  var now = new Date().getTime();
  var sessionN = gameState.sessions[n];
  var sessionNplus1 = gameState.sessions[n + 1];

  if (now >= sessionN && now <= (sessionNplus1 - gameState.synchrotime)) {
    // logger.log(login + " answers question : " + n)
    success();
  } else {
    logger.log("n = " + n + ', login:' + login);
    logger.log("  Missing for " + (now - (sessionNplus1 - gameState.synchrotime)) + ' ms.');

    fail();
  }
};

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

      var token = JSON.stringify({"lastname":lastname, "firstname":firstname, "mail":login});
      // logger.log("Score " + login + ": " + token + ", " + score);
      redis.hmset("players", login + ":score", score, login + ':lastbonus', lastbonus, login + ':q:' + question, reponse);
      redis.zadd("scores", -score, token);
      options.success(score);
    }
  });
};

exports.getGame = function() {
  return gameState.game;
};

exports.getGameFragment = function(q) {
  return gameState.gameFragments[q - 1];
};

exports.getAnswer = function(login, n, options) {
  redis.hmget("players", login + ':q:' + n, function(err, reply) {
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
  });
};


/** Register users **/
exports.login = function(mail, options) {
  redis.hsetnx('players', mail + ':login', "1", function(err, reply) {
    if (err) {
      if (options && options.error) {
        options.error(err);
      }
    } else {
      if (parseInt(reply) == 1) {
        redis.hincrby('players', 'logged', 1);
        options.success(true);
      } else {
        options.success(false);
      }
    }
  });
};

/** Unregister users **/
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
};

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
          for (i = 0; i < numberOfQuestions; i++) {
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
