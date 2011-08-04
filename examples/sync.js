/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true setTimeout: true */

"use strict";

var http = require('../http')
var server = http.server(function(request) {
  return {
    status: 200,
    head: { 'ContentType': 'text/plain' },
    body: 'hello world'
  }
}, 8080)
