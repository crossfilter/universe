'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function dispose(def) {

    if(_.isArray(def)){
      var columns = _.remove(service.columns, function(c){
        return def.indexOf(c.key) > -1
      })

      columns.forEach(function(c){
        c.dimension.dispose()
      })

      return service
    }

    var column = _.remove(service.columns, {
      key: def.key
    })[0]

    column.dimension.dispose()

    return service
  }
}
