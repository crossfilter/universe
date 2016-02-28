'use strict'

var _ = require('./lodash')

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  return function column(def) {

    if (!_.isArray(def)) {
      def = [def]
    }

    _.forEach(def, function(d) {

      var column = _.isObject(d) ? d : {
        key: d,
      }

      if(typeof(service.cf.all()[0][column.key]) === 'undefined'){
        console.info('Column key does not exist in data!', column.key)
        return service
      }

      if (_.find(service.columns, {
          key: column.key
        })) {
        console.info('Column has already been defined', arguments)
        return service
      }

      _.assign(column, {
        type: column.array ? 'array' : getType(service.cf.all()[0][column.key]),
        dimension: dimension(column.key, column.type),
      })

      service.columns.push(column)
    })


    return service
  }
}

function getType(d){
    if(_.isNumber(d)){
      return 'number'
    }
    if(_.isBoolean(d)){
      return 'bool'
    }
    if(_.isArray(d)){
      return 'array'
    }
    if(_.isObject(d)){
      return 'object'
    }
    return 'string'
}
