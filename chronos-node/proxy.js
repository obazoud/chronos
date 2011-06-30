var logger = require('util');
var sys = require('sys');

var http = require('http');
var httpProxy = require('http-proxy');

var chronosSettings = require('./conf/settings.js').create();
// Show settings
logger.log('Loading Chronos settings: ' + sys.inspect(chronosSettings, false));

var proxyServer = httpProxy.createServer(chronosSettings.proxy);
proxyServer.listen(chronosSettings.proxy.port);

