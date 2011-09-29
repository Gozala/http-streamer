/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var streamer = require('streamer')
var curry = require('functional').curry

var http = require('http')

function stream(value) {
  return typeof(value) === 'function' ? value :
         value ? streamer.list(value) : streamer.empty()
}

function request(raw) {
  return Object.create(raw, {
    body: { value: function stream(next, stop) {
      raw.on('data', next)
      raw.on('end', stop)
      raw.on('error', stop)
    }}
  })
}

exports.server = curry(function server(handler, port) {
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
