'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function dimension(key, type) {

    var accessorFunction =
      // GroupAll Dimension
      key === true ? function accessor(d, i) {
        return i
      } :
      // Multi-key dimension
      _.isArray(key) ? new Function('d', 'return ' + JSON.stringify(key).replace(/\"/g, '') + ';') :
      // Value Accessor Dimension
      function(d) {
        return d[key]
      }

    return service.cf.dimension(accessorFunction, type == 'array')

  }
}
