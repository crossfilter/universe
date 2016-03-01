'use strict'

var Promise = require('bluebird');
var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = cf

function cf(c) {
  if (_.isArray(c)) {
    // This allows support for crossfilter async
    return Promise.resolve(crossfilter(c))
  }
  if (!c || typeof(c.dimension) !== 'function') {
    return Promise.reject(new Error('No Crossfilter data or instance found!'))
  }
  return Promise.resolve(c)
}
