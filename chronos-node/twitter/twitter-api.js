var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require("path");
var logger = require('util');

exports.tweetHttp = function(req, res, params) {
  logger.log('Tweet: ' + params.tweet);
  tweet(params.tweet);
  res.send(200);
};

exports.tweet = function(message, options) {
  var cmd = path.dirname(process.argv[1]) + "/twitter/twitter.sh -keyf=./ttytterkey -status=\"" + message + "\"";
  logger.log('cmd tweet: ' + cmd);
  exec(cmd, function (error, stdout, stderr) {
    sys.print('stderr: ' + stderr);
    sys.print('stdout: ' + stdout);
    if (error !== null) {
      logger.log('exec error: ' + error);
    }
  });
};

exports.ping = function(req, res) {
  res.send(201, {}, 'pong twitter');
};


