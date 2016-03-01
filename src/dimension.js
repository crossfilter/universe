'use strict'

var Promise = require('bluebird');
var _ = require('./lodash')

module.exports = function(service) {
  return function dimension(key, type) {

    var accessorFunction

    // Multi-key dimension
    if (_.isArray(key)) {
      var arrayString = _.map(key, function(k) {
        return "d['" + k + "']"
      })
      accessorFunction = new Function('d', 'return ' + JSON.stringify(arrayString).replace(/\"/g, '') + '')
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? function accessor(d, i) {
          return i
        } :
        // Value Accessor Dimension
        function(d) {
          return d[key]
        }
    }

    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessorFunction, type == 'array'))

  }
}
