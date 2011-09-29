/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true setTimeout: true */

"use strict";

var http = require('../server')

// asynchronous response
// High order function returns a stream of the given
// `sentence`  that yields each word after given `delay`.
function text(sentence, delay) {
  return function stream(next, stop) {
    var words = sentence.split(' ')
    setTimeout(function onTimeout() {
      next(words.shift() + '\n')
      if (words.length) setTimeout(onTimeout, delay)
      else stop()
    }, delay)
  }
}

var server = http.server(function(request) {
  // If any attribute is a function than it's assumed to be a steram and it is streamed!
  return {
    status: 200,
    head: { 'ContentType': 'text/plain' },
    body: text('hello world', 10)
  }
}, 8080)
