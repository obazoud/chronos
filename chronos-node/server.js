var sys = require('sys');
var path = require('path');
var fs = require('fs');
var logger = require('util');
var chronosSettings = require('./conf/settings.js').create();

if (!path.existsSync('/tmp/chronos')) {
  fs.mkdirSync('/tmp/chronos', 0755);
}
if (!path.existsSync('/tmp/chronos/logs')) {
  fs.mkdirSync('/tmp/chronos/logs', 0755);
}
if (!path.existsSync('/tmp/chronos/pids')) {
  fs.mkdirSync('/tmp/chronos/pids', 0755);
}

if (chronosSettings.cluster.activate) {
  logger.log('Configure Node.js with cluster module (' + chronosSettings.cluster.workers + ' workers).');
  var cluster = require('cluster');
  cluster('./chronos')
    .set('workers', chronosSettings.cluster.workers)
    .use(cluster.logger('/tmp/chronos/logs'))
    .use(cluster.stats())
    .use(cluster.pidfiles('/tmp/chronos/pids'))
    .use(cluster.cli())
    .use(cluster.repl(chronosSettings.cluster.repl))    
    .listen(chronosSettings.port, chronosSettings.hostname);
  logger.log('Server running at http://' + chronosSettings.hostname + ':' + chronosSettings.port);
} else {
  var chronos = require('./chronos');
  logger.log('Configure Node.js with *no* workers.');
  chronos.listen(chronosSettings.port, chronosSettings.hostname);
  logger.log('Server running at http://' + chronosSettings.hostname + ':' + chronosSettings.port);
}


