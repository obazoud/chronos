var restler = require('restler');
var http = require('http');
var logger = require('util');
var chronosSettings = require('./conf/settings.js').create();

var couchdburl = 'http://' + chronosSettings.couchdb.host + ':' + chronosSettings.couchdb.port + '/' + chronosSettings.couchdb.database;
logger.log('Couchdb configuration: ' + couchdburl);

exports.config = function(options) {
  options.success({host: chronosSettings.couchdb.host, port: chronosSettings.couchdb.port});
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

