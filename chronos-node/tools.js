

exports.toISO8601 = function (date) {
  var pad_two = function(n) {
    return (n < 10 ? '0' : '') + n;
  };
  var pad_three = function(n) {
    return (n < 100 ? '0' : '') + (n < 10 ? '0' : '') + n;
  };
  return [
    date.getUTCFullYear(),
    '-',
    pad_two(date.getUTCMonth() + 1),
    '-',
    pad_two(date.getUTCDate()),
    ' ',
    pad_two(date.getUTCHours()),
    ':',
    pad_two(date.getUTCMinutes()),
    ':',
    pad_two(date.getUTCSeconds())
  ].join('');
}


