/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true setTimeout: true */

"use strict";

var http = require('http')
var https = require('https')
var url = require('url')
var parse = url.parse || url.URL
var streamer = require('streamer')

var POST = 'POST'
var GET = 'GET'
var PUT = 'PUT'
var DELETE = 'DELETE'
var HEAD = 'HEAD'
var OPTIONS = 'OPTIONS'

var CONTENT_TYPE = 'Content-Type'
var CONTENT_LENGTH = 'Content-Length'

var CONTENT_URL_ENCODED = 'application/x-www-form-urlencoded'
var CONTENT_JSON = 'application/json'
var CONTENT_MULTIPART = 'multipart/related;boundary="frontier"'

function pairs(object, callback) {
  return Object.keys(object).map(function onEach(key) {
    return [key, object[key]]
  })
}

function query(object) {
  /**
  Turns an object into its URL-encoded query string representation.
  **/
  return pairs(object).map(function(pair) {
    return pair.map(encodeURIComponent).join('=')
  }).join('&')
}

function multipart(object) {
  /**
  Turns an `object` to multiple part message with a single body.
  **/
  return pairs(object).map(function(pair) {
    return [
      pair[1].body + '--frontier\r\n',
      '\r\n ' + pair[1].body + '\r\n'
    ].join(pairs(pair[1]).map(function(pairs) {
      return pairs[0] === 'body' ? '' : pairs.join(': ') + '\r\n'
    }))
  }).join('') + '--frontier--'
}

function Options(options) {
  /**
  Normalizes `options` passed to the request.
  **/
  var uri, path, host, port, method, headers, body

  options = typeof(options) === 'object' ? options : { url: String(options) }
  // Normalizing `uri` property or falling back to `url` if not provided.
  uri = options.uri = options.uri || parse(options.url)
  path = uri.pathname
  host = uri.host
  port = uri.port ? uri.port : uri.protocol === 'https:' ? 443 : 80

  // Falling back to 'GET' method if nothing is provided.
  method = options.method || GET

  // If headers are not passed creating a defaults.
  headers = options.headers || {}
  headers.Host = headers.Host || [ host, port].join(':')
  headers.Accept = headers.Accept || '*/*'

  if (options.json) {
    headers[CONTENT_TYPE] = CONTENT_JSON
    body = JSON.stringify(options.json)
  } else if (options.multipart) {
    headers[CONTENT_TYPE] = CONTENT_MULTIPART
    body = multipart(options.multipart)
  } else if (options.data) {
    if (method === GET) {
      uri.query = query(options.data)
      uri.search = '?' + uri.query
    } else {
      headers[CONTENT_TYPE] = CONTENT_URL_ENCODED
      body = query(options.data)
    }
  }

  if (body) {
    body = Buffer.isBuffer(body) ? body : new Buffer(body)
    headers[CONTENT_LENGTH] = body.length
  }

  return {
    uri: uri,
    host: host,
    port: port,
    path: path,
    method: method,
    headers: headers,
    body: body
  }
}

exports.abort = function abort(request) {
  /**
  Aborts given http request.

  Usage:

  var http = require('http-streamer/request')
  var streamer = require('streamer')

  var request = http.get('http://google.com')
  streamer.print(request)
  http.abort(request)
  **/
  request.request.abort()
}

exports.request = function request(options) {
  /**
  Takes request `options` and returns stream representing a response to this
  HTTP request. Passed `options` may be either URL string to which request will
  be sent or an object contain following properties:
    - `url` The URL string to which request will be send.
    - `method` The HTTP method (defaults to 'GET'): 'POST', 'GET', 'PUT'...
    - `headers` The map of HTTP headers to be send.
  If response is successful, returned stream will yield object containing
  following properties:
    - `status` The status of the response to this HTTP request.
    - `head` The map of all headers for this HTTP request.
    - `body` The stream of response body for this HTTP request.
  If request fails, response stream is stopped with reason of failure.

  Usage:


  var s = require('streamer'),
      merge = s.merge, print = s.print, map = s.map
  var http = require('http-streamer/request')

  // create a response steam
  var request = http.request({ url: 'http://google.com', method: 'GET' })
  // Take first element from response stream (we know there is only one)
  var body = merge(map(function($) { return $.body }, request))
  print(body)
  **/
  options = Options(options)
  var binding = 'https:' === options.uri.protocol ? https : http
  return function stream(next, stop) {
    var request = stream.request = binding.request(options)
    request.on('response', function onRespose(response) {
      stop(next({
        status: response.statusCode,
        head: response.headers,
        body: function stream(next, stop) {
          response.on('data', function (data) {
            if (false === next(data)) request.abort()
          })
          response.on('end', stop)
          response.on('error', stop)
        }
      }))
    })
    request.on('error', stop)
    if (options.body)
      request.write(options.body)
    request.end()
  }
}

// Generating sugared wrappers of `request` for each common HTTP method.
![ GET, POST, HEAD, PUT, DELETE ].forEach(function(method) {
  exports[method.toLowerCase()] = function(options) {
    /**
    Creates request with a method matching a function name. This is a just a
    little sugar on top of `request` see it for more details.

    Usage:

    var s = require('streamer'),
            merge = s.merge, print = s.print, map = s.map
    var http = require('http-streamer/request')

    // create a response steam (could be post / put / head ... instead)
    var request = http.get('http://google.com')
    // Take first element from response stream (we know there is only one)
    var body = merge(map(function($) { return $.body }, request))
    print(body)
    **/
    options.method = method
    return exports.request(options)
  }
})

// Creating alias for the `delete` as `http.delete(..)` will be invalid.
exports.del = exports['delete']
