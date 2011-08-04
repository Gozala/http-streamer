/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var streamer = require('streamer')
var curry = require('functional').curry

var http = require('http')

function stream(value) {
  return typeof(value) === 'function' ? value : streamer.list(value)
}

function writeHead(response, head) {
  var status, headers = {}
  head(function onWrite(element) {
    if (status) headers[element[0]] = element[1]
    else status = element
  }, function onStop(error) {
    if (error) {
      response.writeHead(500)
      response.end(String(error))
    } else {
      response.writeHead(status, headers)
    }
  })
}

function writeBody(response, body) {
  body(function onData(data) {
    response.write(data)
  }, function onStop(error) {
    if (error) response.statusCode = 500
    response.end()
  })
}

function requestStream(request) {
  function stream(next, stop) {
    request.on('data', next)
    request.on('end', stop)
    request.on('error', stop)
  }
  stream.headers = request.headers
  stream.httpVersion = request.httpVersion
  stream.setEncoding = request.setEncoding
  stream.url = request.url
  stream.method = request.method
  return stream
}

exports.server = curry(function server(handler, port) {
  var rawServer = http.createServer()
  rawServer.on('request', function onRequest(request, response) {
    var data = handler(requestStream(request));
    writeHead(response, streamer.append(stream(data.status), stream(data.head)))
    writeBody(response, stream(data.body))
  })
  rawServer.listen(port)
})
