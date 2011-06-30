var os = require('os');

// Settings object
exports.create = function() {
  var chronosSettings = {};

  // Default settings
  var defaults = {
    hostname: '127.0.0.1',
    port: 8080,
    uncaughtException: true,
    cluster:  {
      activate : true,
      workers: 2
    }
  };

  // pierre
  chronosSettings.pierre = {};

  // olivier
  chronosSettings.olivier = {
    uncaughtException: false,
    cluster:  {
      activate : false,
      workers: 2
    }
  };

  // slim
  chronosSettings.slim = {};

  // vfabricXX
  for (var i = 1; i < 5; i++) {
    chronosSettings['vfabric' + i] = {
      hostname: '192.168.1.' + i,
      port: 8080,
      uncaughtException: true,
      cluster:  {
        activate : true,
        workers: 4
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
