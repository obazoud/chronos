var os = require('os');

// Settings object
exports.create = function() {
  var chronosSettings = {};

  // Default settings
  var defaults = {
    httpAdress: '127.0.0.1',
    httpPort: 8080,
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
      activate : false
    }
  };

  // slim
  chronosSettings.slim = {};

  // vfabricXX
  for (var i = 1; i < 5; i++) {
    chronosSettings['vfabric' + i] = {
      httpAdress: '192.168.1.' + i,
      httpPort: 8080,
      uncaughtException: true,
      cluster:  {
        activate : true,
        workers: 4
      }
    };
  }
  chronosSettings['usi' + i] = {
    httpAdress: '192.168.1.201',
    httpPort: 8080,
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
