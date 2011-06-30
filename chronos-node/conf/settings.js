var os = require('os');
var logger = require('util');
var argv = require('optimist').argv;

// Settings object
exports.create = function() {
  var chronosSettings = {};

  // Default settings
  var defaults = {
    hostname: '127.0.0.1',
    port: 8080,
    uncaughtException: true,
    tweet: true,
    cluster:  {
      activate : true,
      workers: 2,
      repl: 8888
    },
    couchdb: {
      host: '127.0.0.1',
      port: 5984,
      database: 'thechallenge'
    },
    redis: {
      host: '127.0.0.1',
      port: 6379
    }
  };

  // pierre
  chronosSettings.pierre = {
    tweet: false
  };

  // olivier
  chronosSettings.olivier = {
    uncaughtException: false,
    tweet: false,
    cluster:  {
      activate : false,
      workers: 2
    }
  };

  // ubuntu
  for (var u = 1; u < 5; u++) {
   chronosSettings['ubuntu' + u] = {
      hostname: '172.16.111.129',
      port: 8080 + u,
      uncaughtException: false,
      tweet: false,
      cluster:  {
        activate : false,
        workers: 2
      },
      couchdb: {
        host: '172.16.111.129',
        port: 5984,
        database: 'thechallenge'
      },
      redis: {
        host: '172.16.111.129',
        port: 6379
      }
    };
  }

  // slim
  chronosSettings.slim = {
      tweet: false,
  };

  // vfabricXX
  for (var i = 1; i < 5; i++) {
    chronosSettings['vfabric' + i] = {
      hostname: '192.168.1.' + i,
      port: 8080,
      uncaughtException: true,
      cluster:  {
        activate : true,
        workers: 4
      },
      couchdb: {
        host: '192.168.1.150',
        port: 5984,
        database: 'thechallenge'
      },
      redis: {
        host: '192.168.1.1',
        port: 6379
      }
    };
  }
  chronosSettings['usi1'] = {
    hostname: '192.168.1.201',
    port: 8080,
    uncaughtException: true,
    cluster:  {
      activate : true,
      workers: 4
    },
    couchdb: {
      host: '192.168.1.150',
      port: 5984,
      database: 'thechallenge'
    }
  };

  if (argv.user) {
    logger.log('Use settings with user: ' + argv.user);
    return merge(defaults, chronosSettings[argv.user]);
  } else {
    logger.log('Use settings with host name: ' + os.hostname());
    return merge(defaults, chronosSettings[os.hostname()]);
  }
};

function merge(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor == Object) {
        obj1[p] = merge(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }

    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  return obj1;
}
