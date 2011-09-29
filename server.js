/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var streamer = require('streamer')
var curry = require('functional').curry

var http = require('http')

function stream(value) {
  /**
  Takes `value` and wraps it into a stream (if it's a stream already) so that
  streamer functions can be applied to it.
  **/
  return typeof(value) === 'function' ? value :
         value ? streamer.list(value) : streamer.empty()
}

function request(raw) {
  /**
  Creates request object, that extends raw instance of [http.ServerRequest]
  (http://nodejs.org/docs/v0.5.5/api/http.html#http.ServerRequest)
  by with `body` property representing a stream of request data.
  **/

  return Object.create(raw, {
    body: { value: function stream(next, stop) {
      raw.on('data', next)
      raw.on('end', stop)
      raw.on('error', stop)
    }}
  })
}

exports.server = curry(function server(handler, port) {
  /**
  Takes `handler` function and `port` and creates http server listening to
  incoming requests on the given `port`. `handler` function is called with
  incoming http request object that contains following properties:
    - `url` The request URL string.
    - `method` The request method as a string: 'GET', 'DELETE', ...
    - `headers` The request headers.
    - `httpVersion` The HTTP protocol version as a string.
  `handler` must return response object with a following properties:
    - `status` The status of the response to this HTTP request. May be string,
      number or stream that yields either one (Optional).
    - `head` The map of all headers for this HTTP request. May be an object
      containing all headers or a stream that yields one or multiple
      header object (Headers are written before first yield of body).
    - `body` The response body for this HTTP request. May be string, buffer or
      a stream that yields one or multiple of those.

  Usage:

  var http = require('http-streamer/server')

  var server = http.server(function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: function stream(next, stop) {
        setTimeout(function() {
          next('hello world')
          stop()
        }, 10)
      }
    }
  }, 8080)

  // Also `http` server can curry, arguments:
  var app = http.server(handler)
  app(port)
  **/

  var rawServer = http.createServer()
  rawServer.on('request', function onRequest(rawRequest, rawResponse) {
    var response = handler(request(rawRequest))
    stream(response.status)(function(status) {
      rawResponse.statusCode = status
    })
    stream(response.head)(function(head) {
      return head && Object.keys(head).forEach(function(name) {
        rawResponse.setHeader(name, head[name])
      })
    })
    stream(response.body)(function(data) {
      rawResponse.write(data)
    }, function onStop(error) {
      if (error) rawResponse.statusCode = 500
      rawResponse.end()
    })
  })

  rawServer.listen(port)
})
