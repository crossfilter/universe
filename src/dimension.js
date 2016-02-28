'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function dimension(key, type) {

    var accessorFunction = function(d) {
      return d[key]
    }

    if (_.isArray(key)) {
      accessorFunction = new Function('d', 'return ' + JSON.stringify(key).replace(/\"/g, '') + ';');
    }

    return service.cf.dimension(accessorFunction, type == 'array')

  }
}
