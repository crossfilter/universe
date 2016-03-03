'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {
  return function clear(def) {

    // Clear a single or multiple column definitions
    if (def) {
      def = _.isArray(def) ? def : [def]

      return Promise.all(_.map(def, function(d) {
        if (_.isObject(d)) {
          d = d.key
        }
        // Clear the column
        var column = _.remove(service.columns, function(c) {
          if (_.isArray(d)) {
            return !_.xor(c.key, d).length
          }
          if(c.key === d){
            if(c.dynamicReference){
              // console.info('Attempted to clear a column that is required for another query!', c)
              return false
            }
            return true
          }
        })[0]
        // Dispose the dimension
        var disposalActions = _.map(column.removeListeners, function(listener){
          return Promise.resolve(listener())
        })
        disposalActions.push(Promise.resolve(column.dimension.dispose()))
        return Promise.all(disposalActions)
      }))
        .then(function(){
          return service
        })
    }

    // Clear all of the column defenitions
    return Promise.all(_.map(service.columns, function(c) {
        return Promise.resolve(c.dimension.dispose())
      }))
      .then(function() {
        service.columns = []
        return service
      })

  }
}
