/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var http = require('../server')
var router = require('../router').router
var logger = require('../logger').logger
var streamer = require('streamer')
var text = streamer.list

// Sinatra like routing!
var server = http.server(logger(router(function(routes) {
  var get = routes.get
  var post = routes.post

  // curl http://localhost:8080
  get('/', function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: 'Hello world'
    }
  })

  // curl http://localhost:8080/hello-async
  get(/[\s\S]*async/, function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: function(next, stop) {
        setTimeout(next, 100, 'hello world')
        setTimeout(stop, 100, 0)
      }
    }
  })

  // curl -d 'hello world' http://localhost:8080/wrap
  post('/wrap', function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: streamer.append(text('header\n'), request.body, text('\nfooter'))
    }
  })
})), 8080)
