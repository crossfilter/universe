'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function dispose(def) {

    def = _.isArray(def) ? def : [def]

    def.forEach(function(d) {
      var column = _.remove(service.columns, {
        key: _.isObject(d) ? d.key : d
      })[0]

      column.dimension.dispose()
    })

    return service
  }
}
