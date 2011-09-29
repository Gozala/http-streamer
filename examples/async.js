/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true setTimeout: true */

"use strict";

var http = require('../server')

function text(sentence, delay) {
  /**
  Takes `sentence` string and returns stream that yields each word from the
  given `sentence` with a given `delay`.
  **/
  return function stream(next, stop) {
    var words = sentence.split(' ')
    next(words.shift() + '\n')
    setTimeout(function onTimeout() {
      next(words.shift() + '\n')
      if (words.length) setTimeout(onTimeout, delay)
      else stop()
    }, delay)
  }
}

var server = http.server(function(request) {

  // If any property of response is a function it will be assumed to be a
  // stream!
  return {
    status: 200,
    head: { 'ContentType': 'text/plain' },
    body: text('hello world', 500)
  }
}, 8080)
