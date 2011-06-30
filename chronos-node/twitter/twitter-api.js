var sys = require('sys');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require("path");
var tools = require("../tools.js");

exports.tweetHttp = function(req, res, params) {
  sys.puts('Tweet: ' + params.tweet);
  tweet(params.tweet + ' (' + tools.toISO8601(new Date()) + ')');
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

exports.ping = function(req, res) {
  res.send(201, {}, 'pong twitter');
};


