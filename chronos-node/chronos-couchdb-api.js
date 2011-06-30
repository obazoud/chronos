var restler = require('restler');
var sys = require('sys');
var http = require('http');
var querystring = require("querystring");
var events = require('events');

var emitter = new events.EventEmitter();

var couchdbAccessFailed = false;

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
var timerId;

exports.putDoc = function(name, batch, json, options) {
  var url = couchdburl + '/' + name;
  if (batch == true) {
    url += '?batch=ok';
  }
  //console.log('use ' + url);
  restler.put(url, {
    data: JSON.stringify(json),
    headers: { 'Content-Type': 'application/json' }
  })
  .on('error', function(data, response) {
    if (options && options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (keys[name]) {
      restler.get(couchdburl + '/' + name, {
        data: ''
      })
      .on('error', function(alldata, response2) {
        if (options && options.error) {
          options.error(data);
        }
      })
      .on('complete', function(alldata, response2) {
        store[name] = alldata;
        if (options && options.success) {
          options.success(data);
        }
      });
    } else {
      if (options && options.success) {
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
    if (options && options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (options && options.success) {
      options.success(data);
    }
  });
};

exports.getDoc = function(name, options) {
  if (store[name]) {
    if (options && options.success) {
      options.success(store[name]);
      return;
    }
  }
  restler.get(couchdburl + '/' + name, {
    data: ''
  })
  .on('error', function(data, response) {
    if (options && options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (keys[name]) {
      store[name] = data;
    }
    if (options && options.success) {
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
      if (options && options.error) {
        options.error(data);
      }
    }
  })
  .on('complete', function(data, response) {
    if (options && options.success) {
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
    if (options && options.error) {
      options.error(data);
    }
  })
  .on('complete', function(data, response) {
    if (options && options.success) {
      options.success(data);
    }
  });

};

exports.purge = function(name) {
  // console.log(sys.inspect(store));
  if (name) {
    delete(store[name]);
  } else {
    store = {};
  }
  // console.log(sys.inspect(store));
};

exports.info = function(options) {
  restler.request(couchdburl, {
    data: '',
    method: 'GET'
  })
  .on('error', function(data, response) {
    if (response.statusCode != 404) {
      if (options && options.error) {
        options.error(data);
      }
    }
  })
  .on('complete', function(data, response) {
    if (options && options.success) {
      if (response.statusCode == 200) {
        options.success(data);
      }
    }
  });
};

changesStream = function(query, options) {
  var stream = new process.EventEmitter();
  var client = http.createClient(port, host, false);
  var path = '/thechallenge/_changes?' + querystring.stringify(query);
  console.log('Will call Couchdb changes: ' + path);
  var request = client.request('GET', path);
  var buffer = '';

  client.setTimeout(options.timeout);
  request.addListener("response", function(res) {
    res.addListener('data', function(chunk) {
      //console.log('...');
      buffer += (chunk || '');

      var offset, change;
      while ((offset = buffer.indexOf("\n")) >= 0) {
        change = buffer.substr(0, offset);
        buffer = buffer.substr(offset +1);

        // Couch sends an empty line as the "heartbeat"
        if (change == '') {
          return stream.emit('heartbeat');
        }

        try {
          change = JSON.parse(change);
        } catch (e) {
          return stream.emit('error', 'invalid json: '+change);
        }

        stream.emit('data', change);
      }
    })
  });
  request.end();

  client.addListener('close', function(hadError) {
    stream.emit('end', hadError);
  });

  stream.close = function() {
    return client.destroy();
  };

  return stream;
};

couchdbChangesStream = function(filter, docname, callback, endCallback) {
  var stream;
  var since;

  exports.info({
    error: function(data) {
      endCallback();
    },
    success: function(data) {
      couchdbAccessFailed = false;
      clearTimeout(timerId);
      timerId = null;
      var db = JSON.parse(data);
      console.log('Couchdb update_seq: ' + db.update_seq);
      console.log('Couchdb instance_start_time: ' + db.instance_start_time);
      stream = changesStream({
          feed: "continuous",
          filter: filter,
          name: docname,
          heartbeat: 30 * 1000,
          since: db.update_seq
        }, {
          timeout: 1
        }
      );
      sys.inspect(stream);
      stream.addListener('data', callback);
      stream.addListener('end', endCallback);
      return stream;
    }
  });
};

couchdbChangesStreamCallback = function(change) {
  // console.log('couchdbChangesStream: ' + sys.inspect(change));
  console.log('Purging cache... ' + change.id);
  if (change.id) {
    exports.purge(change.id);
  }
};

couchdbChangesStreamCallbackError = function(change) {
  console.log('Can not access to couchdb.');
  if (couchdbAccessFailed == false) {
    emitter.emit('couchdbAccessFailed');
  }
};

couchdbChangesStream('gameonly/game', 'game', couchdbChangesStreamCallback, couchdbChangesStreamCallbackError);

emitter.on("couchdbAccessFailed",function() {
  couchdbAccessFailed = true;
  if (timerId == null) {
    console.log('Creating an setInterval.');
    timerId = setInterval(function() {
      if (couchdbAccessFailed == true) {
        console.log('Try again via couchdbChangesStream.');
        couchdbChangesStream('gameonly/game', 'game', couchdbChangesStreamCallback, couchdbChangesStreamCallbackError);
      }
      }, 10000);
  }
});

