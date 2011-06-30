var restler = require('restler');
var querystring = require('querystring');
var xml2json = require('./xml2json.js');
var sys = require('sys');
var chronosCouch = require('./chronos-couchdb-api.js');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

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
          res.send(201, {}, data);
        }
      });
    }
  });
};

exports.newGame = function(req, res, params) {
  var gameXML = params.parameters.replace(/ xmlns:usi/g, " usi").replace(/ xmlns:xsi/g, " xsi").replace(/ xsi:schemaLocation/g, " schemaLocation").replace(/usi:/g, "");
  gameXML = gameXML.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"");
  // sys.puts("XMLSys: " + gameXML);

  var paramsJSON = xml2json.parse(gameXML);
  paramsJSON['type'] = 'game';
  paramsJSON['authentication_key'] = params.authentication_key || '';
  delete paramsJSON['value'];
  for(i=0;i<paramsJSON.gamesession.questions.question.length;i++) {
    if (i<5) {
      paramsJSON.gamesession.questions.question[i].qvalue=1;
    } else {
      paramsJSON.gamesession.questions.question[i].qvalue=parseInt(i/5)*5;
    }
  }
  // console.log('paramsJSON: ' + paramsJSON);
  restler.put(couchdburl + '/game', {
    data: JSON.stringify(paramsJSON),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data) {
    if (JSON.parse(data).reason == 'Authentication key is not recognized.') {
      res.send(401, {}, data);
    } else {
      res.send(400, {}, data);
    }
  })
  .on('complete', function (data) {
    console.log('data: ' + data);
    res.send(201);
  });
}

// TODO: cookie persistence ?
exports.login = function(req, res, params) {
  restler.post(couchdbaseburl + '/_session', {
    data: 'name=' + params.mail + '&password=' + params.password,
    headers: {
      'Content-Type': 'application/x-www-form-urlencodeddata',
      'Host': 'localhost:8080',
      'Referer': 'http://localhost:8080/_api',
      'Domain': '.chronos.fr',
    }
  })
  .on('error', function(data) {
    if (data.error == 'unauthorized') {
      res.send(401, {}, data);
    }
    res.send(400, {}, data);
  })
  .on('complete', function (data, response) {
    // console.log('data: ' + data);
    // console.log('response: ' + response.headers['set-cookie']);
    // TODO: You can keep using this token for 10 minutes by default. 
    // After 10 minutes you need to authenticate your user again. 
    // The token lifetime can be configured with the timeout (in seconds) setting in the couch_httpd_auth configuration section.
    // http://guide.couchdb.org/draft/security.html
    var cookie = response.headers['set-cookie'][0].split(';')[0];
    res.send(201, {"session_key":cookie}, data);
  });
}

exports.getQuestion = function(req, res, n) {
  // sys.puts(req.headers.cookie);
  restler.get(couchdbaseburl + '/_session', {
    data: '',
    headers: {
      'Domain': '.chronos.fr',
      'Cookie': req.headers.session_key
    }
  })
  .on('error', function(data) {
    res.send(400, {}, data);
  })
  .on('complete', function (data, response) {
    var json = JSON.parse(data);
    if (!json.userCtx.name) {
      sys.puts(data);
      res.send(401, {}, data);
    } else {
      restler.get(couchdburl + '/game', {
        data: '',
        headers: {
          'Domain': '.chronos.fr',
          'Cookie': req.headers.session_key
        }
      })
      .on('error', function(data) {
        res.send(400, {}, data);
      })
      .on('complete', function (data, response) {
        var q = JSON.parse(data).gamesession.questions.question[n-1];
        var question = {};
        question.question = q.label;
        for (i=0; i<q.choice.length;i++) {
          question['answer_' + (i+1)] = q.choice[i];
        }
        question.score = 12345;
        res.send(200, {}, question);
      });
    }
  });

  // Test if cookie still present

  // Clé de session non reconnue : 401
  // Non respect de la séquence ou autre erreur : 400
}

exports.answerQuestion = function(req, res, n, params) {
  restler.get(couchdbaseburl + '/_session', {
    data: '',
    headers: {
      'Domain': '.chronos.fr',
      'Cookie': req.headers.session_key
    }
  })
  .on('error', function(data) {
    res.send(400, {}, data);
  })
  .on('complete', function (data, response) {
    var json = JSON.parse(data);
    if (!json.userCtx.name) {
      sys.puts(data);
      res.send(401, {}, data);
    } else {
      restler.get(couchdburl + '/game', {
        data: '',
        headers: {
          'Domain': '.chronos.fr',
          'Cookie': req.headers.session_key
        }
      })
      .on('error', function(data) {
        res.send(400, {}, data);
      })
      .on('complete', function (data, response) {
        var q = JSON.parse(data).gamesession.questions.question[n-1];

        var url = couchdburl + '/_design/answer/_update/accumulate/' + json.userCtx.name + '?question=' + n + '&reponse=' + params.answer + '&correct=' + q.goodchoice + '&valeur=' + q.qvalue;
        sys.puts('url:' + url);
        restler.put(url, {
          data: '',
          headers: {
            'Domain': '.chronos.fr',
            'Cookie': req.headers.session_key
          }
        })
        .on('error', function(data) {
          res.send(400, {}, data);
        })
        .on('complete', function (score, response) {
          var q = JSON.parse(data).gamesession.questions.question[n-1];
          var answer = {};
          answer.are_u_right= (q.goodchoice == params.answer);
          answer.good_answer=q.goodchoice;
          answer.score=score;
          res.send(200, {}, answer);
        });
      });
    }
  });
}

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
