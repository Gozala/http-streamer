/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true */
/*global define: true exports: true */

"use strict";

exports.logger = function logger(handler) {
  return function logger(request) {
    console.log('>>>', Object.getPrototypeOf(request))
    var response = handler(request)
    console.log('<<<', response)
    return response
  }
}
