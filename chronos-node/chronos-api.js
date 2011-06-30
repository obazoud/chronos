var sys = require('sys');
var os = require('os');
var twitterapi = require('./twitter/twitter-api.js');
var xml2json = require('./externals/xml2json.js');
var chronosCouch = require('./chronos-couchdb-api.js');
var security = require('./security.js');
var ranking = require("./ranking.js");
var gamemanager = require('./gamemanager.js');
var logger = require('util');
var chronosSettings = require('./conf/settings.js').create();

var authentication_key = '12IndR6r5V5618';

// nbquestions : le nombre de questions à jouer. 
// Doit être inférieur ou égal au nombre de questions présentes dans le fichier (élement <usi:questions>). 
// --> Ce paramètre est considéré comme inutile. Nous jouerons toujours 20 questions.
var numberOfQuestions = 20;

// HAProxy
exports.ping = function(req, res) {
  res.send(200, {}, 'pong');
};

exports.frontal = function(req, res) {
  res.send(200, {}, os.hostname());
};

exports.couchdb = function(req, res) {
  chronosCouch.config({
    success: function(config) {
      res.send(200, {}, config);
    }
  });
};

function validateField(field, mandatory, minlength, maxlength, value) {
  message = "Problems field " + field;
  if (mandatory && !field) {
      return message + ' (mandatory)';
  }
  var data = field || '';

  if (minlength && data.length < minlength) {
    return message + ' (minlength)';
  }
  if (maxlength && data.length > maxlength) {
    return message + ' (maxlength)';
  }
  if (value && data != value) {
    return message + ' (value)';
  }
};

var players = [];
var playerBatch = 15000;

exports.createUser = function(req, res, body) {
  var params = JSON.parse(body);
//  if (validateField(params.firstname, true, 2, 50) || validateField(params.lastname, true, 2, 50) || validateField(params.mail, true, 2, 50) || validateField(params.password, true, 2, 50)) {
//    res.send(400, {}, message);
//  } else {
    chronosCouch.head(params.mail, {
      error: function(data) {
        logger.log("FAILED(400)");
        res.send(400, {}, data);
      },
      success: function(data, id) {
        if (id != null) {
          logger.log("FAILED(400)");
          res.send(400, {}, data);
        } else {
          var player = {_id:params.mail, firstname:params.firstname || '', lastname:params.lastname || '', password:params.password || ''};
          players.unshift(player);
          // Not now but only if user is logged
          // ranking.addUser(params.lastname,params.firstname,params.mail,function(err,added) {
          res.send(201);
        }
      }
    });
//  }
};

setInterval(function() {
  //logger.log("Bulk players ?");
  if (players.length > 0) {
    //logger.log("Read to bulk players");
    var playerIndex = Math.max(0, players.length - playerBatch);
    var playerNumber = Math.min(players.length, playerBatch);
    var playersToBatch = players.splice(playerIndex, playerNumber);

    chronosCouch.bulk(playersToBatch, {
      error: function(data) {
        players.unshift(playersToBatch);
        //logger.log("Error" + data);
      },
      success: function(data) {
        //logger.log("Error" + data);
      }
    });
  }
}, 5000);

exports.newGame = function(req, res, body) {
  var params = JSON.parse(body);
  var paramsJSON = processGameXML(params.authentication_key, params.parameters);
  putGame(req, res, params, paramsJSON);
};

function putGame(req, res, params, paramsJSON) {
  // check authentication_key
  var message = validateField(paramsJSON.authentication_key, true, 2, 50, authentication_key);
  if (message) {
    res.send(401, {}, message);
  } else {
    logger.log("A new game is coming.");
    logger.log("Game successfully added.");
    // TODO callback ?
    gamemanager.initGame(paramsJSON);
    ranking.initRanking();
    res.send(201);
  }
};

function processGameXML(authentication_key, parameters) {
  var gameXML = parameters.replace(/ xmlns:usi/g, " usi").replace(/ xmlns:xsi/g, " xsi").replace(/ xsi:schemaLocation/g, " schemaLocation").replace(/usi:/g, "");
  gameXML = gameXML.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");

  var paramsJSON = xml2json.parse(gameXML);
  paramsJSON.authentication_key = authentication_key || '';

  // clean
  delete paramsJSON.value;
  delete paramsJSON.gamesession.usi;
  delete paramsJSON.gamesession.xsi;
  delete paramsJSON.gamesession.schemalocation;

  for(i = 0;i < paramsJSON.gamesession.questions.question.length; i++) {
    if (i < 5) {
      paramsJSON.gamesession.questions.question[i].qvalue = 1;
    } else {
      paramsJSON.gamesession.questions.question[i].qvalue = parseInt(i / 5, 10) * 5;
    }
  }
  return paramsJSON;
};

exports.login = function(req, res, body) {
  var params = JSON.parse(body);

  // logger.log(Date.now() + " > Http /api/login/" + params.mail);
  chronosCouch.getDoc(params.mail, {
    error: function(data) {
      try {
        if (JSON.parse(data).error == 'not_found') {
          // logger.log('user not found, ' + params.mail);
          res.send(401);
        } else {
          // logger.log(params.mail + ":" + err);
          res.send(400);
        }
      } catch(err) {
          logger.log("Something wrong here, is couchbd up ? " + err);
          res.send(400);
      }
    },
    success: function(data) {
      var userDocjson = JSON.parse(data);
      if (userDocjson.password != params.password) {
        // logger.log(params.mail + ": password does not match");
        res.send(401);
      } else {
        gamemanager.login(params.mail, {
          error: function(err) {
            // logger.log(params.mail + ": failed: " + err);
            res.send(400);
          },
          success: function(successful) {
            if (!successful) {
              // logger.log(params.mail + ": exists.");
              res.send(400);
            } else {
              var sessionkey = security.encode({ "login": params.mail, "password": params.password, "firstname": userDocjson.firstname, "lastname": userDocjson.lastname });
              res.send(201, {'Set-Cookie': 'session_key=' + sessionkey}, '');
              gamemanager.warmup(res);
              // TODO callback ?
              ranking.addUser(userDocjson.lastname, userDocjson.firstname, params.mail);
              // logger.log(Date.now() + " < Http /api/login/" + params.mail);
            }
          }
        });
      }
    }
  });
};

exports.getQuestion = function(req, res, body, query, part) {
  if (security.authorize(req, res)) {
    var n = parseInt(part);
    // logger.log(Date.now() + " > Http /api/question/" + n + " / " + numberOfQuestions + ", login:" + req.jsonUser.login);
    if (n <= 0 || n > numberOfQuestions) {
      // logger.log("FAILED(400) " + n + "< Http /api/question/" + n + ", login:" + req.jsonUser.login);
      res.send(400);
    } else {
      gamemanager.getQuestion(req, res, n);
    }
  }
};

exports.answerQuestion = function(req, res, body, query, part) {
  if (security.authorize(req, res)) {
    // TODO 350 ms
    //req.connection.setTimeout(350);
    //req.connection.on('timeout', function() {
    //  logger.log('connection timeout answerQuestion ' + n + '[' + req.jsonUser.login + ']');
    //});
    var n = parseInt(part);
    if (n <= 0 || n > numberOfQuestions) {
      res.send(400);
    } else {
      var params = JSON.parse(body);
      gamemanager.answerQuestion(req, res, n, params);
    }
  }
};

exports.tweetHttp = function(req, res, body, query) {
  var params = JSON.parse(body);
  sys.puts('Tweet: ' + params.tweet);
  twitterapi.tweet(params.tweet + ' (' + Date.now() + ')');
  res.send(200);
};

exports.getRanking = function(req, res, body, query) {
  if (security.authorize(req, res)) {
    // TODO 350 ms
    // logger.log("> Http /api/ranking, login:" + req.jsonUser.login);

    // TODO less call
    gamemanager.logged(req.jsonUser.login, {
      error: function(data) {
        res.send(400);
      },
      success: function(logged) {
        // logger.log("> Http /api/ranking, logged:" + logged);
        if (logged == 0) {
          gamemanager.getNumberOfPlayers({
            error: function(data) {
              res.send(400);
            },
            success: function(numberOfPlayers) {
              var message = 'Notre application supporte ' + numberOfPlayers + ' joueurs #challengeUSI2011';
              logger.log('Tweet: ' + message);
              if (chronosSettings.tweet) {
                twitterapi.tweet(message);
              } else {
                logger.log('Tweet settings is: ' + chronosSettings.tweet);
              }
            }
          });
        }
      }
    });
    ranking.ranking(req.jsonUser.lastname, req.jsonUser.firstname, req.jsonUser.login, 100, 5, function(err, ranking) {
      if (err) {
        res.send(400);
      }
      else {
        // logger.log("< Http /api/ranking, login:" + req.jsonUser.login + ", " + JSON.stringify(ranking));
        res.send(200, {}, ranking);
      }
    });
  }
};

exports.getScore = function(req, res, body, query) {
  // TODO 350 ms
  // logger.log("> Http /api/score , login:" + params.user_mail);
  if (query.authentication_key != authentication_key) {
    res.send(401);
  }
  chronosCouch.getDoc(query.user_mail, {
    error: function(data) {
      res.send(400);
    },
    success: function(userDoc) {
      var userDocJson = JSON.parse(userDoc);
      ranking.ranking(userDocJson.lastname, userDocJson.firstname,userDocJson._id,100,5,function(err,ranking) {
        if (err) {
          res.send(400);
        }
        else {
          // logger.log("< Http /api/score , login:" + params.user_mail +  JSON.stringify(ranking));
          res.send(200, {}, ranking);
        }
      });
    }
  });
};

exports.audit = function(req, res, body, query) {
  // TODO 350 ms
  // logger.log(Date.now() + "> Http /api/audit");
  if (query.authentication_key != authentication_key) {
    res.send(401);
  }

  var gamejson = gamemanager.getGame();
  gamemanager.getAnswers(query.user_mail, {
    error: function(data) {
      res.send(400);
    },
    success: function(answers) {
      var audit = {};
      audit.user_answers = new Array();
      audit.good_answers = new Array();
      var question = gamejson.gamesession.questions.question;
      for (i = 0; i < question.length; i++) {
        audit.good_answers.push("" + question[i].goodchoice + "");
      }
      for (j = 0; j < answers.length; j++) {
        audit.user_answers.push("" + answers[j] + "");
      }
      // logger.log(Date.now() + " < Http /api/audit");
      res.send(200, {}, audit);
    }
  });
};

exports.auditN = function(req, res, body, query, part) {
  // logger.log(Date.now() + "> Http /api/audit/" + part);
  // TODO 350 ms
  if (query.authentication_key != authentication_key) {
    res.send(401);
  }
  var gamejson = gamemanager.getGame();
  var n = parseInt(part);
  gamemanager.getAnswer(query.user_mail, n, {
    error: function(data) {
      res.send(400);
    },
    success: function(answer) {
      var audit = {};
      audit.user_answer = "" + answer + "";
      audit.good_answer = "" + gamejson.gamesession.questions.question[n-1].goodchoice + "";
      audit.question = gamejson.gamesession.questions.question[n-1].label;
      res.send(200, {}, audit);
    }
  });

};
