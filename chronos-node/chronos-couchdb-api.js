var restler = require('restler');
var sys = require('sys');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

// document in cache is supposed to be read only!!
// otherwise clone it
var store = {};
var keys = {
    'game': true
};

exports.putDoc = function(name, json, options) {
  restler.put(couchdburl + '/' + name, {
    data: JSON.stringify(json),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (keys[name]) {
      restler.get(couchdburl + '/' + name, {
        data: ''
      })
      .on('error', function(alldata, response2) {
        if (options.error) {
          options.error(data);
        }
      })
      .on('complete', function(alldata, response2) {
        store[name] = alldata;
        if (options.success) {
          options.success(data);
        }
      });
    } else {
      if (options.success) {
        options.success(data);
      }
    }
  });
};

exports.putDesign = function(name, options) {
  restler.put(couchdburl + '/' + name, {
    data: ''
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      options.success(data);
    }
  });
};

exports.getDoc = function(name, options) {
  if (store[name]) {
    if (options.success) {
      options.success(store[name]);
      return;
    }
  }
  restler.get(couchdburl + '/' + name, {
    data: ''
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (keys[name]) {
      store[name] = data;
    }
    if (options.success) {
      options.success(data);
    }
  });

};

exports.head = function(name, options) {
  restler.request(couchdburl + '/' + name, {
    data: '',
    method: 'HEAD'
  })
  .on('error', function(data, response) {
    if (response.statusCode != 404) {
      if (options.error) {
        options.error(data);
      }
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
      if (response.statusCode == 200) {
        options.success(data, response.headers.etag.replace(/\"/g, ""));
      } else {
        options.success(data, null);
      }
    }
  });
};

exports.delete = function(name, id, options) {
  restler.del(couchdburl + '/' + name + '?rev=' + id, {
    data: ''
  })
  .on('error', function(data, response) {
    if (options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (options.success) {
        options.success(data);
    }
  });

};

exports.purge = function(name) {
  if (name) {
    delete(store[name]);
  } else {
    store = {};
  };
};

