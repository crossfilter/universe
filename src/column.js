'use strict'

import _ from './lodash'

var types = {
  string: 'string',
  number: 'number',
  bool: 'bool',
  array: 'array',
}

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  return function column(def) {
    if (_.find(service.columns, {
        key: def.key
      })) {
      console.warn('Column has already been defined', arguments)
      return service
    }

    var column = {
      key: def.key,
      type: types[def.type] || types.string,
    }

    _.assign(column, {
      dimension: dimension(column.key, column.type),
    })

    service.columns.push(column)

    return service
  }

}
