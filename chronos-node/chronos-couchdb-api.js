var os = require('os');
var restler = require('restler');
var sys = require('sys');
var http = require('http');
var querystring = require("querystring");
var events = require('events');
var tools = require("./tools.js");
var emitter = new events.EventEmitter();

var couchdbAccessFailed = false;

var host = '?.?.?.?';
var port = 5984;
var hostname = os.hostname();
if (hostname.match(/^vfabric(\d+)$/) || hostname.match(/^usi(\d+)$/)) {
  // vip
  host = '192.168.1.150';
} else {
  host = '127.0.0.1';
}
console.log(tools.toISO8601(new Date()) + ' : Couchdb configuration: ' + hostname + ':' + port);

var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var saltvalue = '1';

exports.config = function(options) {
  options.success({host:host, port:port});
};

exports.bulk = function(data, batch, json, options) {
  console.log("Bulk: " + data.length);
  var url = couchdburl + '/_bulk_docs';
  var docs = {};
  docs.docs = data;

  restler.post(url, {
    data: JSON.stringify(docs),
    headers: { 'Content-Type': 'application/json' }
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
    if (options && options.success) {
      options.success(data);
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
  restler.get(couchdburl + '/' + name, {
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

