/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

var METHODS = [ 'get', 'post', 'delete', 'options' ]

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

function findMatchingHandler(routes, request) {
  var route = routes.shift()
  return route && isMatchingRequest(route[0], request) ? route[1] :
         !routes.length ? defaultHandler : findMatchingHandler(routes, request)
}

exports.router = function router(handler) {
  var routeRegistry = {}
  handler(registrar(routeRegistry))

  return function handler(request) {
    var routes = routeRegistry[request.method.toLowerCase()].slice()
    return findMatchingHandler(routes, request)(request)
  }
}
