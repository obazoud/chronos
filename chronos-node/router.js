// inspired by https://github.com/clement/clutch/blob/master/lib/clutch.js
// inspired by https://github.com/cloudhead/journey/blob/master/lib/journey.js
// do not want to create THE router
// only my need

var sys = require('sys');
var logger = require('util');
var url = require('url');
var querystring = require('querystring');

var router = exports;
var routes = [];
var urlsRouted = {};

function slice(arrayLike) {
  var sliceMethod = Array.prototype.slice;
  return sliceMethod.apply(arrayLike, sliceMethod.apply(arguments, [1]));
}

function Route(method, pattern, callback) {
  return function (req, res, body) {
    if (method.toLowerCase() == req.method.toLowerCase()) {
      var path = '';
      var parsed = url.parse(req.url);
      var query = querystring.parse(parsed.query);

      if (parsed.slashes) {
        path = '//';
      }
      path += parsed.pathname || '';

      var parts;
      if (parts = path.match(pattern)) {
        var result = callback.call(null, req, res, body, query, parts[1]);
        return (result === undefined ? true : result);
      }
    }
    return false;
  };
};

router.get = function(pattern, callback) {
  routes.push(Route('GET', pattern, callback));
};
router.post = function (pattern, callback) {
  routes.push(Route('POST', pattern, callback));
};

router.route = function(method, pattern, callback) {
  routes.push(Route(method, pattern, callback));
};

router.handle = function(req, res, body, result) {
  res.send = function(status, headers, body) {
    result({status: status, headers: headers || {}, body: body});
  }

  var parsed = url.parse(req.url);
  if (urlsRouted[parsed]) {
    // logger.log('Route from cache: ' + parsed);
    if (urlsRouted[parsed].apply(null, arguments)) {
      return true;
    } else {
      urlsRouted[parsed] = null;
    }
  }

  var i;
  for (i in routes) {
    if (routes[i].apply(null, arguments)) {
      urlsRouted[parsed] = routes[i];
      return true;
    }
  }

  res.writeHead(404);
  res.end();
};


