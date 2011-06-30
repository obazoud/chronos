var os = require('os');

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
      workers: 2
    },
    couchdb: {
      host: '127.0.0.1',
      port: 5984,
      database: 'thechallenge'
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
      }
    };
  }
  chronosSettings['usi' + i] = {
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

  return merge(defaults, chronosSettings[os.hostname()]);
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
