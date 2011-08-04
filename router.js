/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var METHODS = [ 'get', 'post', 'delete', 'options' ]

var functional = require('functional')
var find = functional.find

var register = (function (handlers, pattern, handler) {
  handlers.push([ pattern, handler ])
})

function registrar(routes) {
  var self = {}
  METHODS.forEach(function(name) {
    self[name] = register.bind(null, routes[name] = [])
  })
  return self
}

function defaultHandler(request) {
  return { status: 404, body: 'Not found: ' + request.url }
}

function isMatchingRequest(pattern, request) {
  return pattern && (
    (pattern.indexOf && ~pattern.indexOf(request.url)) ||
    (pattern.test && pattern.test(request.url)) ||
    (pattern.call && pattern.call(null, request))
  )
}

exports.router = function router(handler) {
  var routes = {}
  handler(registrar(routes))

  return function handler(request) {
    return (find(routes[request.method.toLowerCase()], function(route) {
      return isMatchingRequest(route[0], request)
    }) || [ '*', defaultHandler ])[1](request)
  }
}
