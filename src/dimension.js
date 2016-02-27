'use strict'

import _ from './lodash'

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
