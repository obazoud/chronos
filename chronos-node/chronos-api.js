var twitter = require('twitter');
var xml2json = require('./xml2json.js');
var sys = require('sys');
var chronosCouch = require('./chronos-couchdb-api.js');

exports.ping = function(req, res) {
  res.send(201, {}, 'pong');
}

exports.createUser = function(req, res, params) {
  chronosCouch.createCouchUser(params.mail, params.password, {
    error: function(data, response) {
      res.send(400, {}, data);
    },
    success: function(data, response) {
      chronosCouch.createChronosUser(params.firstname, params.lastname, params.mail, params.password, {
        error: function(data, response) {
          res.send(400, {}, data);
        },
        success: function(data, response) {
          res.send(201);
        }
      });
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
    error: function(data, response) {
      if (JSON.parse(data).reason == 'Authentication key is not recognized.') {
        res.send(401);
      } else {
        res.send(400);
      }
    },
    success: function(data, response) {
      res.send(201);
    }
  });
};

// TODO: cookie persistence ?
exports.login = function(req, res, params) {
  chronosCouch.login(params.mail, params.password, {
    error: function(data, response) {
      if (data.error == 'unauthorized') {
        res.send(401);
      }
      res.send(400);
    },
    success: function(data, response) {
      var cookie = response.headers['set-cookie'][0].split(';')[0];
      res.send(201, {"session_key":cookie}, '');
    }
  });
};

exports.getQuestion = function(req, res, n) {
  chronosCouch.getCurrentUser(req.headers.session_key, {
    error: function(data, response) {
      res.send(400, {}, data);
    },
    success: function(user, response) {
      var jsonuser = JSON.parse(user);
      if (!jsonuser.userCtx.name) {
        res.send(401, {}, user);
      } else {
        chronosCouch.getDoc('game', req.headers.session_key, {
          error: function(data, response) {
            res.send(400, {}, data);
          },
          success: function(game, response) {
            chronosCouch.getDoc(jsonuser.userCtx.name, req.headers.session_key, {
              error: function(data, response) {
                res.send(400, {}, data);
              },
              success: function(userDoc, response) {
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
      }
    }
  });
};

exports.answerQuestion = function(req, res, n, params) {
  chronosCouch.getCurrentUser(req.headers.session_key, {
    error: function(data, response) {
      res.send(400, {}, data);
    },
    success: function(data, response) {
      var json = JSON.parse(data);
      if (!json.userCtx.name) {
        res.send(401, {}, data);
      } else {
        chronosCouch.getDoc('game', req.headers.session_key, {
          error: function(data, response) {
            res.send(400, {}, data);
          },
          success: function(data, response) {
            var q = JSON.parse(data).gamesession.questions.question[n-1];
            chronosCouch.putDesign('/_design/answer/_update/accumulate/' + json.userCtx.name + '?question=' + n + '&reponse=' + params.answer + '&correct=' + q.goodchoice + '&valeur=' + q.qvalue, req.headers.session_key, {
              error: function(data, response) {
                res.send(400, {}, data);
              },
              success: function(data, response) {
                var answer = {};
                answer.are_u_right= "" + (q.goodchoice == params.answer) + "";
                answer.good_answer=q.goodchoice;
                answer.score=data;
                res.send(200, {}, answer);
              }
            });
          }
        });
      }
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

tweet = function(message, options) {
  var twit = new twitter({
    consumer_key: 'HxIDFfy6inw58Yk3phxCD',
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
  .updateStatus(message,
    function (data) {
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
    }
  );
};

exports.getRanking = function(req, res) {
  // Clé de session non reconnue : 401
  // Autre erreur : 400
  res.send(200, {}, {});
}

exports.getScore = function(req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {score:42, ranking:42});
}

exports.audit = function(req, res, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answers:[42,42,42,42], good_answers:[42,42,42,42]});
}

exports.audit = function(req, res, n, params) {
  // Erreur : 400
  params.user_mail;
  params.authentication_key;
  res.send(200, {}, {user_answer:42, good_answer:42, question:'question'});
}
