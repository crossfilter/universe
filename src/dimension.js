'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  return {
    make: make,
    makeAccessor: makeAccessor,
  }

  function make(key, type, complex) {
    var accessor = makeAccessor(key, complex)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
  }

  function makeAccessor(key, complex) {
    var accessorFunction

    if (complex === 'string') {
      accessorFunction = function (d) {
        return _.get(d, key)
      }
    } else if (complex === 'function') {
      accessorFunction = key
    } else if (complex === 'array') {
      var arrayString = _.map(key, function (k) {
        return 'd[\'' + k + '\']'
      })
      accessorFunction = new Function('d', String('return ' + JSON.stringify(arrayString).replace(/"/g, '')))  // eslint-disable-line  no-new-func
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? function accessor(d, i) {
          return i
        } :
        // Value Accessor Dimension
          function (d) {
            return d[key]
          }
    }
    return accessorFunction
  }
}
