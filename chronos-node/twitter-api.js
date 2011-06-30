var twitter = require('twitter');
var sys = require('sys');

exports.tweetHttp = function(req, res) {
  sys.puts('Twitter API>');
  tweet('Hello world2', {
    error: function(data) {
      res.send(401, {}, 'updateStatus fails:' + data.statusCode + ', ' + data.message + ', ' + data.data);
    },
    success: function(data) {
      res.send(200, {}, 'updateStatus ok:' + data.id);
    }
  });
};

tweet = function(message, options) {
  var twit = new twitter({
    consumer_key: 'HxIDFfy6inw58Yk3phxCDQ',
    consumer_secret: 'uyilyhnaoa5CYKgp8GigXNUTwkvFvZplKA3PVzKs24',
    access_token_key: '274449131-IrvRyqqID58xvkWtmHRn7JvqKwBn3VdK7zmnYoCX',
    access_token_secret: '908pZpyKAa36C3sgd8Y9f2IRTjG0VSKlUXwhhMV7E'
  });

  twit.verifyCredentials(function (data) {
    if (!(data && data.screen_name == 'usi2011_chronos')) {
      if (options.error) {
        options.error(data);
      }
    }
  })
  .updateStatus(message, function (data) {
    if (!(data && data.screen_name == 'usi2011_chronos')) {
      if (options.error) {
        options.error(data);
        return;
      }
    }
    if (options.success) {
      options.success(data);
      return;
    }
  });
};

