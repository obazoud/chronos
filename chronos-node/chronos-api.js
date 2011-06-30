var sys = require('sys');
var uuid = require('node-uuid');
var twitterapi = require('./twitter/twitter-api.js');
var xml2json = require('./externals/xml2json.js');
var chronosCouch = require('./chronos-couchdb-api.js');
var security = require('./security.js');
var ranking = require("./ranking.js");
var tools = require("./tools.js");

exports.ping = function(req, res) {
  res.send(201, {}, 'pong');
};

exports.createUser = function(req, res, params) {
  chronosCouch.putDoc(params.mail, {type:'player', firstname:params.firstname || '', lastname:params.lastname || '', mail:params.mail || '', password:params.password || '', questions:{ }, reponses:{ }, score: { }, lastbonus: { }}, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(data) {
      ranking.addUser(params.lastname,params.firstname,params.mail);
      res.send(201);
    }
  });
};

exports.newGame = function(req, res, params) {
  var paramsJSON = processGameXML(params.authentication_key, params.parameters);
  paramsJSON.game_id = uuid().toLowerCase();

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
  console.log(tools.toISO8601(new Date()) + ": put a new game.");
  chronosCouch.putDoc('game', paramsJSON, {
    error: function(data) {
      var error = JSON.parse(data);
      if (error.reason == 'Authentication key is not recognized.') {
        console.log(data);
        res.send(401);
      } else {
        console.log(data);
        res.send(400);
      }
    },
    success: function(data) {
      console.log(tools.toISO8601(new Date()) + ": game successfully added.");
      ranking.reset(function(err, incrementedScore) {
        console.log(tools.toISO8601(new Date()) + ": Redis: score to 0: OK " + incrementedScore);
        res.send(201);
      });
    }
  });
};

function processGameXML(authentication_key, parameters) {
  var gameXML = parameters.replace(/ xmlns:usi/g, " usi").replace(/ xmlns:xsi/g, " xsi").replace(/ xsi:schemaLocation/g, " schemaLocation").replace(/usi:/g, "");
  gameXML = gameXML.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");

  var paramsJSON = xml2json.parse(gameXML);
  paramsJSON.type = 'game';
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
  // already login ?
  chronosCouch.getDoc(params.mail, {
    error: function(data) {
      if (data.error == 'unauthorized') {
        console.log('unauthorized ' + data);
        res.send(401);
      } else {
          if (JSON.parse(data).error == 'not_found') {
            console.log('user not found, ' + params.mail);
            res.send(401);
          } else {
            res.send(400);
        }
      }
    },
    success: function(data) {
      var userDocjson = JSON.parse(data);
      if (userDocjson.password != params.password) {
        res.send(401);
      } else {
        var sessionkey = security.encode({ "login": params.mail, "password": params.password, "firstname": userDocjson.firstname, "lastname": userDocjson.lastname });
        res.send(201, {"session_key":sessionkey}, '');
      }
    }
  });
};

exports.getQuestion = function(req, res, n) {
  chronosCouch.getDoc(req.jsonUser.login, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(userDoc) {
      chronosCouch.getDoc('game', {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(game) {
          var gamejson = JSON.parse(game);
          var q = gamejson.gamesession.questions.question[n-1];
          var userDocjson = JSON.parse(userDoc);
          var question = {};
          question.question = q.label;
          for (i=0; i<q.choice.length;i++) {
            question['answer_' + (i+1)] = q.choice[i];
          }
          if (userDocjson.score[gamejson.game_id] == null) {
            question.score = userDocjson.score[gamejson.game_id];
          } else {
            question.score = 0;
          }
          if (userDocjson.lastbonus[gamejson.game_id] == null) {
            question.lastbonus = userDocjson.lastbonus[gamejson.game_id];
          } else {
            question.lastbonus = 0;
          }
          res.send(200, {}, question);
        }
      });
    }
  });
};

exports.answerQuestion = function(req, res, n, params) {
  chronosCouch.getDoc('game', {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(gameDoc) {
      var game = JSON.parse(gameDoc);
      var q = game.gamesession.questions.question[n-1];
      chronosCouch.putDesign('/_design/answer/_update/accumulate/' + req.jsonUser.login + '?question=' + n + '&reponse=' + params.answer + '&correct=' + q.goodchoice + '&valeur=' + q.qvalue + '&game_id=' + game.game_id, {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(scoreDoc) {
          var answer = {};
          answer.are_u_right= "" + (q.goodchoice == params.answer) + "";
          answer.good_answer=q.goodchoice;
          answer.score=scoreDoc;
          ranking.updateScore(req.jsonUser.lastname,req.jsonUser.fistname,req.jsonUser.login,scoreDoc);
          res.send(200, {}, answer);
        }
      });
    }
  });
};

exports.tweetHttp = function(req, res, params) {
  sys.puts('Tweet: ' + params.tweet);
  twitterapi.tweet(params.tweet + ' (' + tools.  paramsJSON.game_id = uuid().toLowerCase();
toISO8601(new Date()) + ')');
  res.send(200);
};

exports.getRanking = function(req, res) {
  chronosCouch.getDoc('game', {
    success: function(gameDoc) {
      var game = JSON.parse(gameDoc);
      twitterapi.tweet('Notre application supporte ' + game.gamesession.parameters.nbusersthreshold + ' joueurs #challengeUSI2011');
    }
  });
  // TODO: send error if failed
  ranking.ranking(req.jsonUser.lastname, req.jsonUser.firstname, req.jsonUser.login, 100, 5, function(ranking) {
    res.send(200, {}, ranking);
  });
};

exports.getScore = function(req, res, params) {
  // TODO
  /*
  if (params.authentication_key is invalid) {
    res.send(401);
  }
  */
  // TODO: avoid this call to CouchDB by putting lastname and firstname in req.jsonUser
  // TODO : /!\ can not do that, score is admin level not user
  chronosCouch.getDoc(params.user_mail, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(userDoc) {
      var userDocJson = JSON.parse(userDoc);
      ranking.ranking(userDocJson.lastname, userDocJson.firstname,req.jsonUser.login,100,5,function(ranking) {
        res.send(200, {}, ranking);
      });
    }
  });
};

exports.audit = function(req, res, params) {
  // TODO
  /*
  if (params.authentication_key is invalid) {
    res.send(401);
  }
  */
  chronosCouch.getDoc(params.user_mail, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(player) {
      chronosCouch.getDoc('game', {
        error: function(data) { res.send(400, {}, data); },
        success: function(game) {
          var audit = {};
          audit.user_answers = new Array();
          audit.good_answers = new Array();
          var question = JSON.parse(game).gamesession.questions.question;
          for (i=0; i<question.length; i++) {
            audit.good_answers.push(question[i].goodchoice);
          }
          var user_questions = JSON.parse(player).questions[game.game_id];
          for (i=0; i<user_questions.length; i++) {
            audit.user_answers[user_questions[i] - 1] = JSON.parse(player).responses[game.game_id][i];
          }
          res.send(200, {}, audit);
        }
      })
    }
  });
};

exports.audit = function(req, res, n, params) {
  // TODO
  /*
  if (params.authentication_key is invalid) {
    res.send(401);
  }
  */
  chronosCouch.getDoc(params.user_mail, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(player) {
      chronosCouch.getDoc('game', {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(game) {
          var audit = {};
          audit.good_answer = JSON.parse(game).gamesession.questions.question[n-1].goodchoice;
          audit.question = JSON.parse(game).gamesession.questions.question[n-1].label;
          var user_questions = JSON.parse(player).questions[game.game_id];
          for (i=0; i<user_questions.length; i++) {
            if (user_questions[i] == n) {
              audit.user_answer = JSON.parse(player).reponses[game.game_id][i];
              break;
            }
          }
          res.send(200, {}, audit);
        }
      });
    }
  });
};
