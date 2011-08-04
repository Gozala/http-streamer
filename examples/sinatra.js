/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var http = require('../http-streamer')

// Sinatra like routing!
var server = http.router(http.server(8090))
server.get('/', function(request) {
   return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: 'Hello world'
   }
})
server.get(/[\s\S]*async/, function(request) {
   return {
      status: 200,
      head: { 'ContentType': 'text/plain' },
      body: wordsStream('hello world', 10)
   }
})
server.get('/wrap', function(request) {
    return {
        status: 200,
        head: { 'ContentType': 'text/plain' },
        body: streamer.join(wordsStream('header\n'), request.body, wordsStream('\nfooter'))
    }
})

