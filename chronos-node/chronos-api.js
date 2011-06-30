var sys = require('sys');
var os = require('os');
var uuid = require('node-uuid');
var twitterapi = require('./twitter/twitter-api.js');
var xml2json = require('./externals/xml2json.js');
var chronosCouch = require('./chronos-couchdb-api.js');
var security = require('./security.js');
var ranking = require("./ranking.js");
var tools = require("./tools.js");
var gamemanager = require('./gamemanager.js');

var authentication_key = '12IndR6r5V5618';

// HAProxy
exports.ping = function(req, res) {
  res.send(200, {}, 'pong');
};

exports.frontal = function(req, res) {
  res.send(200, {}, os.hostname());
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

exports.createUser = function(req, res, params) {
//  if (validateField(params.firstname, true, 2, 50) || validateField(params.lastname, true, 2, 50) || validateField(params.mail, true, 2, 50) || validateField(params.password, true, 2, 50)) {
//    res.send(400, {}, message);
//  } else {
    chronosCouch.head(params.mail, {
      error: function(data) {
        res.send(400, {}, data);
      },
      success: function(data, id) {
        if (id != null) {
          res.send(400, {}, data);
        } else {
          var player = {_id:params.mail, firstname:params.firstname || '', lastname:params.lastname || '', password:params.password || ''};
          players.unshift(player);
          ranking.addUser(params.lastname,params.firstname,params.mail,function(err,added) {
            if (err) {
              res.send(400, {}, err);
            } else {
              if (added == 0) {
                res.send(400, {}, "user already exist in redis");
              } else {
                res.send(201);
              }
            }
          });
        }
      }
    });
//  }
};

setInterval(function() {
  //console.log("Bulk players ?");
  if (players.length > 0) {
    //console.log("Read to bulk players");
    var playerIndex = Math.max(0, players.length - playerBatch);
    var playerNumber = Math.min(players.length, playerBatch);
    var playersToBatch = players.splice(playerIndex, playerNumber);

    chronosCouch.bulk(playersToBatch, {
      error: function(data) {
        players.unshift(playersToBatch);
        //console.log("Error" + data);
      },
      success: function(data) {
        //console.log("Error" + data);
      }
    });
  }
}, 5000);

// internal API
exports.mail = function(req, res, mail) {
  chronosCouch.getDoc(mail, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(data) {
      res.send(201, {}, data);
    }
  });
};

exports.newGame = function(req, res, params) {
  var paramsJSON = processGameXML(params.authentication_key, params.parameters);
  paramsJSON.game_id = uuid().toLowerCase().substring(0, 8);

  chronosCouch.head('game', {
    error: function(data) {
      res.send(400);
    },
    success: function(data, id) {
      if (id != null) {
        chronosCouch.delete('game', id, {
          error: function(data) {
            res.send(400);
          },
          success: function(data, id) {
            putGame(req, res, params, paramsJSON);
          }
        });
      } else {
        putGame(req, res, params, paramsJSON);
      }
    }
  });
};

function putGame(req, res, params, paramsJSON) {
  // check authentication_key
  var message = validateField(paramsJSON.authentication_key, true, 2, 50, authentication_key);
  if (message) {
    res.send(401, {}, message);
  } else {
    console.log(tools.toISO8601(new Date()) + ": a new game is coming.");
    chronosCouch.putDoc('game', false, paramsJSON, {
      error: function(data) {
        res.send(400);
      },
      success: function(data) {
        console.log(tools.toISO8601(new Date()) + ": game successfully added.");
        gamemanager.initGame(paramsJSON.gamesession.parameters);
        ranking.reset(function(err, updated) {
          if (err) {
            res.send(400, {}, err);
          }
          else {
            //console.log(tools.toISO8601(new Date()) + ": Redis: score to 0: OK " + (updated == 0));
            res.send(201);
          }
        });
      }
    });
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

exports.login = function(req, res, params) {
  chronosCouch.getDoc(params.mail, {
    error: function(data) {
      if (JSON.parse(data).error == 'not_found') {
        console.log('user not found, ' + params.mail);
        res.send(401);
      } else {
        console.log("Login" + err);
        res.send(400);
      }
    },
    success: function(data) {
      var userDocjson = JSON.parse(data);
      if (userDocjson.password != params.password) {
        res.send(401);
      } else {
        gamemanager.isLogin(params.mail, {
          error: function(err) {
            //console.log("Login" + err);
            res.send(400);
          },
          success: function(exist) {
            if (exist) {
              //console.log("Login" + exist);
              res.send(400);
            } else {
              var sessionkey = security.encode({ "login": params.mail, "password": params.password, "firstname": userDocjson.firstname, "lastname": userDocjson.lastname });
              gamemanager.login(params.mail);
              gamemanager.warmup(res);
              res.send(201, {'Set-Cookie': 'session_key=' + sessionkey}, '');
            }
          }
        });
      }
    }
  });
};

exports.getQuestion = function(req, res, n) {
  gamemanager.getQuestion(n, 
    function () {
      chronosCouch.getDoc('game', {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(game) {
          gamemanager.getScore(req.jsonUser.login, {
            error: function(err) {
              res.send(400, {}, err);
            },
            success: function(score) {
              var gamejson = JSON.parse(game);
              var q = gamejson.gamesession.questions.question[n-1];
              var question = {};
              question.question = q.label;
              for (i=0; i<q.choice.length;i++) {
                question['answer_' + (i+1)] = q.choice[i];
              }
              question.score = "" + score + "";
              res.send(200, {}, question);
            }
          });
        }
      });
    },
    function () {
      res.send(400);
    }
  );
};

exports.answerQuestion = function(req, res, n, params) {
  gamemanager.answerQuestion(n,
    function() {
        chronosCouch.getDoc('game', {
          error: function(data) {
            res.send(400, {}, data);
          },
          success: function(gameDoc) {
            var game = JSON.parse(gameDoc);
            var q = game.gamesession.questions.question[n-1];
            gamemanager.updatingScore(req.jsonUser.lastname, req.jsonUser.fistname, req.jsonUser.login, n, params.answer, q.goodchoice, q.qvalue, {
              error: function(data) {
                res.send(400, {}, data);
              },
              success: function(score) {
                var answer = {};
                answer.are_u_right= "" + (q.goodchoice == params.answer) + "";
                answer.good_answer = q.choice[q.goodchoice];
                answer.score = score;
                res.send(200, {}, answer);
              }
            });
          }
        });
    },
    function() {
        res.send(400);
    }
  );
};

exports.tweetHttp = function(req, res, params) {
  sys.puts('Tweet: ' + params.tweet);
  twitterapi.tweet(params.tweet + ' (' + tools.toISO8601(new Date()) + ')');
  res.send(200);
};

exports.getRanking = function(req, res) {
  chronosCouch.getDoc('game', {
    success: function(gameDoc) {
      var game = JSON.parse(gameDoc);
      twitterapi.tweet('Notre application supporte ' + game.gamesession.parameters.nbusersthreshold + ' joueurs #challengeUSI2011');
    }
  });
  ranking.ranking(req.jsonUser.lastname, req.jsonUser.firstname, req.jsonUser.login, 100, 5, function(err,ranking) {
    if (err) {
      res.send(400, {}, err);
    }
    else {
      res.send(200, {}, ranking);
    }
  });
};

exports.getScore = function(req, res, params) {
  if (params.authentication_key != authentication_key) {
    res.send(401);
  }
  chronosCouch.getDoc(params.user_mail, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(userDoc) {
      var userDocJson = JSON.parse(userDoc);
      ranking.ranking(userDocJson.lastname, userDocJson.firstname,userDocJson._id,100,5,function(err,ranking) {
        if (err) {
          res.send(400, {}, err);
        }
        else {
          res.send(200, {}, ranking);
        }
      });
    }
  });
};

exports.audit = function(req, res, params) {
  if (params.authentication_key != authentication_key) {
    res.send(401);
  }

  chronosCouch.getDoc('game', {
    error: function(data) { res.send(400, {}, data); },
    success: function(game) {
      gamemanager.getAnswers(params.user_mail, {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(answers) {
          var gameJson = JSON.parse(game);
          var audit = {};
          audit.user_answers = new Array();
          audit.good_answers = new Array();
          var question = gameJson.gamesession.questions.question;
          for (i=0; i<question.length; i++) {
            audit.good_answers.push(question[i].goodchoice);
          }
          for (j=0; j<answers.length; j++) {
            audit.user_answers.push(answers[j]);
          }
          res.send(200, {}, audit);
        }
      });
    }
  });
};

exports.auditN = function(req, res, n, params) {
  if (params.authentication_key != authentication_key) {
    res.send(401);
  }

  chronosCouch.getDoc('game', {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(game) {
      gamemanager.getAnswer(params.user_mail, n, {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(answer) {
          var gameJson = JSON.parse(game);
          var audit = {};
          audit.good_answer = gameJson.gamesession.questions.question[n-1].goodchoice;
          audit.question = gameJson.gamesession.questions.question[n-1].label;
          audit.user_answer = answer;
          res.send(200, {}, audit);
        }
      });
    }
  });
};
