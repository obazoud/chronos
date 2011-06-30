var restler = require('restler');
var sys = require('sys');

var host = '127.0.0.1';
var port = 5984;
var couchdbaseburl = 'http://' + host + ':' + port;
var couchdburl = couchdbaseburl + '/thechallenge';
var username = 'superadmin';
var password = 'supersecret';
var saltvalue = '1';

exports.putDoc = function(name, json, options) {
  restler.put(couchdburl + '/' + name, {
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


