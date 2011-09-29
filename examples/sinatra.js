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
  get('/', function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: 'Hello world'
    }
  })
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
  get('/wrap', function(request) {
    return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: streamer.append(text('header\n'), request.body, text('\nfooter'))
    }
  })
})), 8080)
