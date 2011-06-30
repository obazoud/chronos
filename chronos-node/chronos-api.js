var twitter = require('twitter');
var xml2json = require('./xml2json.js');
var sys = require('sys');
var chronosCouch = require('./chronos-couchdb-api.js');
var security = require('./security.js');

exports.ping = function(req, res) {
  res.send(201, {}, 'pong');
};

exports.createUser = function(req, res, params) {
  chronosCouch.putDoc(params.mail, {type:'player', firstname:params.firstname || '', lastname:params.lastname || '', mail:params.mail || '', password:params.password || '', questions:[ ], reponses:[ ], score:0, lastbonus:0}, {
    error: function(data) {
      res.send(400, {}, data);
    },
    success: function(data) {
      res.send(201);
    }
  });
};

exports.newGame = function(req, res, params) {
  var gameXML = params.parameters.replace(/ xmlns:usi/g, " usi").replace(/ xmlns:xsi/g, " xsi").replace(/ xsi:schemaLocation/g, " schemaLocation").replace(/usi:/g, "");
  gameXML = gameXML.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");

  var paramsJSON = xml2json.parse(gameXML);
  paramsJSON.type = 'game';
  paramsJSON.authentication_key = params.authentication_key || '';
  delete paramsJSON.value;
  for(i=0;i<paramsJSON.gamesession.questions.question.length;i++) {
    if (i<5) {
      paramsJSON.gamesession.questions.question[i].qvalue=1;
    } else {
      paramsJSON.gamesession.questions.question[i].qvalue=parseInt(i/5,10)*5;
    }
  }
  
  chronosCouch.putDoc('game', paramsJSON, {
    error: function(data) {
      if (JSON.parse(data).reason == 'Authentication key is not recognized.') {
        res.send(401);
      } else {
        res.send(400);
      }
    },
    success: function(data) {
      res.send(201);
    }
  });
};

exports.login = function(req, res, params) {
  // already login ?
  chronosCouch.getDoc(params.mail, {
    error: function(data) {
      if (data.error == 'unauthorized') {
        res.send(401);
      }
      if (JSON.parse(data).error == 'not_found') {
        res.send(401);
      }
      res.send(400);
    },
    success: function(data) {
      var userDocjson = JSON.parse(data);
      if (userDocjson.password != params.password) {
        res.send(401);
      } else {
        var sessionkey = security.encode({ "login": params.mail, "password": params.password });
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
          var q = JSON.parse(game).gamesession.questions.question[n-1];
          var userDocjson = JSON.parse(userDoc);
          var question = {};
          question.question = q.label;
          for (i=0; i<q.choice.length;i++) {
            question['answer_' + (i+1)] = q.choice[i];
          }
          question.score = userDocjson.score;
          question.lastbonus = userDocjson.lastbonus;
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
    success: function(data) {
      var q = JSON.parse(data).gamesession.questions.question[n-1];
      chronosCouch.putDesign('/_design/answer/_update/accumulate/' + req.jsonUser.login + '?question=' + n + '&reponse=' + params.answer + '&correct=' + q.goodchoice + '&valeur=' + q.qvalue, {
        error: function(data) {
          res.send(400, {}, data);
        },
        success: function(data) {
          var answer = {};
          answer.are_u_right= "" + (q.goodchoice == params.answer) + "";
          answer.good_answer=q.goodchoice;
          answer.score=data;
          res.send(200, {}, answer);
        }
      });
    }
  });
};

exports.tweetHttp = function(req, res) {
  tweet('Hello world2', {
    error: function(data) {
      res.send(401, {}, 'updateStatus fails:' + data.statusCode + ', ' + data.message + ', ' + data.data);
    },
    success: function(data) {
      res.send(200, {}, 'updateStatus ok:' + data.id);
    }
  });
};

tweet = function(message, options) {
  var twit = new twitter({
    consumer_key: 'HxIDFfy6inw58Yk3phxCDQ',
    consumer_secret: 'uyilyhnaoa5CYKgp8GigXNUTwkvFvZplKA3PVzKs24',
    access_token_key: '274449131-IrvRyqqID58xvkWtmHRn7JvqKwBn3VdK7zmnYoCX',
    access_token_secret: '908pZpyKAa36C3sgd8Y9f2IRTjG0VSKlUXwhhMV7E'
  });

  twit.verifyCredentials(function (data) {
    if (!(data && data.screen_name == 'usi2011_chronos')) {
      if (options.error) {
        options.error(data);
      }
    }
  })
  .updateStatus(message, function (data) {
    if (!(data && data.screen_name == 'usi2011_chronos')) {
      if (options.error) {
        options.error(data);
        return;
      }
    }
    if (options.success) {
      options.success(data);
      return;
    }
  });
};

exports.getRanking = function(req, res) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  res.send(200, {}, {});
};

exports.getScore = function(req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {score:42, ranking:42});
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
          var user_questions = JSON.parse(player).questions;
          for (i=0; i<user_questions.length; i++) {
            audit.user_answers[user_questions[i] - 1] = JSON.parse(player).responses[i];
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
          var user_questions = JSON.parse(player).questions;
          for (i=0; i<user_questions.length; i++) {
            if (user_questions[i] == n) {
              audit.user_answer = JSON.parse(player).reponses[i];
              break;
            }
          }
          res.send(200, {}, audit);
        }
      });
    }
  });
};
