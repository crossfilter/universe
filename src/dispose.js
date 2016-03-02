'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function dispose(def) {

    def = _.isArray(def) ? def : [def]

    def.forEach(function(d) {

      if(_.isObject(d)){
        d = d.key
      }

      var column = _.remove(service.columns, function(c){
        if(_.isArray(d)){
          return !_.xor(c.key, d).length
        }
        return c.key === d
      })[0]

      column.dimension.dispose()
    })

    return service
  }
}
