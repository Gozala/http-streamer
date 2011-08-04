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
  rawServer.on('request', function onRequest(rawRequest, response) {
    var data = handler(request(rawRequest))
    stream(data.status)(function(status) {
      response.statusCode = status
    })
    stream(data.head)(function(head) {
      return head && Object.keys(head).forEach(function(name) {
        response.setHeader(name, head[name])
      })
    })
    stream(data.body)(function(data) {
      response.write(data)
    }, function onStop(error) {
      if (error) response.statusCode = 500
      response.end()
    })
  })
  rawServer.listen(port)
})
