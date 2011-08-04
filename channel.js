
var streamer = require('streamer');
var PIPE = {};

exports.channel = function Channel() {
  var pipe = streamer.pipe.apply(null, arguments);
  return function channel(key) { return key === PIPE ? pipe : channel; };
};

exports.stream = function stream(channel) {
  return channel(PIPE).output;
};

exports.next = function next(channel, element) {
  channel(PIPE).next(element);
};

exports.stop = function stop(queue, error) {
  channel(PIPE).stop(error);
};
