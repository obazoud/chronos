var sys = require('sys');
var events = require('events');
var emitter = new events.EventEmitter();
var logger = require('util');
var chronosSettings = require('./conf/settings.js').create();

// TODO Think about multiples nodes instances
// TODO Think about multiples servers

// nbquestions : le nombre de questions à jouer. 
// Doit être inférieur ou égal au nombre de questions présentes dans le fichier (élement <usi:questions>). 
// --> Ce paramètre est considéré comme inutile. Nous jouerons toujours 20 questions.
var numberOfQuestions = 20;

var os = require('os');
// TODO integrer le mecanisme de fail-over
//var redis = require("redis").createClient(6379, "192.168.1.1");
//var subscriber = require("redis").createClient(6379, "192.168.1.1");
//var publisher = require("redis").createClient(6379, "192.168.1.1");
var redis = require("redis").createClient(chronosSettings.redis.port, chronosSettings.redis.host);
var subscriber = require("redis").createClient(chronosSettings.redis.port, chronosSettings.redis.host);
var publisher = require("redis").createClient(chronosSettings.redis.port, chronosSettings.redis.host);

var channel = '#chronos';

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

// state 0: RAS
// state 1: game starts
// state 2: warmup starts
// state 3: warmup ends
// state 4: questionsEnds
// state 5: ??
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
  this.pendings = {};
  this.timers = [];

  this.initGame = function(newGame) {
    // Force init game
    // reload data after crash
    logger.log('State changed state: ' + this.state + ' -> ' + 1);
    this.state = 1;
    this.pendings = {
      "1":[],"2":[],"3":[],"4":[],"5":[],"6":[],"7":[],"8":[],"9":[],"10":[],
      "11":[],"12":[],"13":[],"14":[],"15":[],"16":[],"17":[],"18":[],"19":[],
      "20":[]
    };

    this.sessions = [];
    for (var t = 0; t < this.timers; t++) {
      clearTimeout(this.timers[t]);
    }
    redis.hset("context", "state", this.state);
    this.game = newGame;
    this.nbusersthreshold = parseInt(this.game.gamesession.parameters.nbusersthreshold);
    this.logintimeout = parseInt(this.game.gamesession.parameters.logintimeout) * 1000;
    this.questiontimeframe = parseInt(this.game.gamesession.parameters.questiontimeframe) * 1000;
    this.synchrotime = parseInt(this.game.gamesession.parameters.synchrotime) * 1000;
  };

  this.warmupStarts = function(now1) {
    // Force to use local time
    // ntp sucks
    var now = Date.now();
    if (this.state == 1) {
      logger.log('State changed state: ' + this.state + ' -> ' + 2);
      this.state = 2;
      redis.hset("context", "state", this.state);
      this.warmupStartDate = now;
      this.warmupEndDate = now + parseInt(this.logintimeout);
      this.sessions[0] = this.warmupStartDate;
      this.sessions[1] = this.warmupEndDate;
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

      logger.log('sessions0: ' + this.sessions[0] + ' / ' + new Date(this.sessions[0]));
      logger.log('sessions1: ' + this.sessions[1] + ' / ' + new Date(this.sessions[1]));
      for (var i = 2; i <= numberOfQuestions + 1; i++) {
        this.sessions[i] = this.sessions[i - 1] + this.questiontimeframe + this.synchrotime;
        logger.log('sessions' + i + ': ' + this.sessions[i] + ' / ' + new Date(this.sessions[i]));
      }
      // Creating timers question N > 1
      for (var k = 2; k <= numberOfQuestions; k++) {
        var timerId = setTimeout(questionTimer, this.sessions[k] - now, k);
        this.timers.push(timerId);
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

  this.pushQuestion = function(ctx) {
    this.pendings[ctx.n].push(ctx);
  };

// TODO
//  this.persist = function() {
//  };

  this.retrieve = function() {
    // TODO at node startup get state from redis
    // TODO block everything during loading...
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
         logger.log("Something wrong here (if your Redis is empty, forget this message) " + err2);
         return;
      }
    });
  
  };
}

var gameState = new GameState();
// TODO reload stuff when node up
// TODO or after a reboot
gameState.retrieve();

/** Initialize game **/
// TODO callback ?
exports.initGame = function(game) {
  redis.del("context");
  redis.del("players");
  redis.hset("context", "numberOfPlayers", 0);
  redis.set("game", JSON.stringify(game));
  // TODO to save or to save ?
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

// TODO : 'once' works with a 2nd game ?
emitter.once("warmupStarted", function() {
  var now = Date.now();
  logger.log("Warmup started... ");
  gameState.warmupStarts(now);
  // logger.log(sys.inspect(gameState,false));

  redis.hsetnx("context", "warmupStartDate", gameState.warmupStartDate);
  redis.hsetnx("context", "warmupEndDate", gameState.warmupEndDate);
  // TODO to save or to save ?
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
    var now = Date.now();
    if (parseInt(numberOfPlayers) >= parseInt(gameState.nbusersthreshold) || now >= gameState.warmupEndDate) {
      logger.log("numberOfPlayers: " + numberOfPlayers);
      logger.log("gameState.nbusersthreshold: " + gameState.nbusersthreshold);
      logger.log("now: " + now);
      logger.log("gameState.warmupEndDate: " + gameState.warmupEndDate);
      if (gameState.state == 2) {
        var now = Date.now();
        logger.log("warmup timer stopped");
        gameState.warmupEnds(now);

        var message = {
          'event': 'warmupEnds',
          'warmupEnd': now
        };
        publisher.publish(channel, JSON.stringify(message));
        questionTimer(1);
      }
    } else {
      // TODO : timeout ?
      setTimeout(warmupLoop, 20);
    }
  });
};

/** Timer Question K **/
function questionTimer(k) {
  var start = Date.now();
  var count = gameState.pendings[k].length;
  for (var i = 0; i < count; i++) {
    var ctx = gameState.pendings[k][i];
    // TODO ctx.req.resume();
    ctx.res.send(200, {}, ctx.question);
    ctx.fired = true;
    // TODO ctx.res.end();
  }

  logger.log('Fire question: ' + k + ' (' + count + ') in ' + (Date.now() - start) + ' ms.');
}

/** get question N **/
exports.getQuestion = function(req, res, n) {
  var now = Date.now();
  var sessionNMoins1 = gameState.sessions[n - 1];
  var sessionN = gameState.sessions[n];

  if (now >= sessionNMoins1 && now <= sessionN) {
    if (n == 1) {
      var q = gameState.game.gamesession.questions.question[n - 1];
      var question = {};
      question.question = q.label;
      for (var j = 0; j < q.choice.length; j++) {
        question['answer_' + (j+1)] = q.choice[j];
      }
      question.score = "" + 0 + "";
      var ctx = {
          n: n,
          timestamp: now,
          req: req,
          res: res,
          question: question
      };
      gameState.pushQuestion(ctx);
      var t = Date.now() - now;
      if (t > 350) {
        logger.log('getQuestion ' + n + ' tooks ' + (Date.now() - now) + ' ms. ' + '[' + req.jsonUser.login + ']');
      }
    } else {
      this.getScore(req.jsonUser.login, {
        error: function(err) {
          res.send(400);
        },
        success: function(score) {
          var q = gameState.game.gamesession.questions.question[n - 1];
          var question = {};
          question.question = q.label;
          for (var j = 0; j < q.choice.length; j++) {
            question['answer_' + (j+1)] = q.choice[j];
          }
          question.score = "" + score + "";
          var ctx = {
              n: n,
              timestamp: now,
              req: req,
              res: res,
              question: question
          };
          gameState.pushQuestion(ctx);
          // TODO
          //req.connection.setTimeout(gameState.questiontimeframe + gameState.synchrotime);
          //req.connection.on('timeout', function() {
          //    ctx = {};
          //});
          // req.pause();
        }
      });
    }
  } else {
    logger.log('getQuestion ' + n + ', missing time frame for: ' + (now - sessionNMoins1) + ' ms. ' + '[' + req.jsonUser.login + ']');
    res.send(400);
  }
};

/** answer question N **/
exports.answerQuestion = function(req, res, n, params) {
  var now = Date.now();
  var login = req.jsonUser.login;
  var sessionN = gameState.sessions[n];
  var maxTime = gameState.sessions[n + 1] - gameState.synchrotime;

  if (now >= sessionN && now <= maxTime) {
    var q = gameState.game.gamesession.questions.question[n-1];
    this.updatingScore(req.jsonUser.lastname, req.jsonUser.firstname, login, n, params.answer, q.goodchoice, q.qvalue, {
      error: function(data) {
        res.send(400);
      },
      success: function(score) {
      var score = 11;
      var answer = {};
      answer.are_u_right= "" + (q.goodchoice == params.answer) + "";
      answer.good_answer = q.choice[q.goodchoice - 1];
      answer.score = "" + score + "";

      res.send(201, {}, answer);
      }
    });
  } else {
    logger.log('answerQuestion ' + n + ' missing for ' + (now - maxTime) + ' ms. ' + '[' + login + ']');
    res.send(400);
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

/** Updating Score with good/bad answer question and bonus **/
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
