var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require("path");

exports.tweetHttp = function(req, res, params) {
  sys.puts('Tweet: ' + params.tweet);
  tweet(params.tweet + ' (' + toISO8601(new Date()) + ')');
  res.send(200);
};

exports.tweet = function(message, options) {
  var cmd = path.dirname(process.argv[1]) + "/twitter/twitter.sh -keyf=./ttytterkey -status=\"" + message + "\"";
  sys.puts('cmd tweet: ' + cmd);
  exec(cmd, function (error, stdout, stderr) {
    sys.print('stderr: ' + stderr);
    sys.print('stdout: ' + stdout);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
};

toISO8601 = function (date) {
  var pad_two = function(n) {
    return (n < 10 ? '0' : '') + n;
  };
  var pad_three = function(n) {
    return (n < 100 ? '0' : '') + (n < 10 ? '0' : '') + n;
  };
  return [
    date.getUTCFullYear(),
    '-',
    pad_two(date.getUTCMonth() + 1),
    '-',
    pad_two(date.getUTCDate()),
    ' ',
    pad_two(date.getUTCHours()),
    ':',
    pad_two(date.getUTCMinutes()),
    ':',
    pad_two(date.getUTCSeconds())
  ].join('');
}

exports.ping = function(req, res) {
  res.send(201, {}, 'pong twitter');
};


