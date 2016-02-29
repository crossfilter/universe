'use strict'

var _ = require('./lodash')

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  return function column(def) {

    // Support groupAll dimension
    if (def === true) {
      def = {
        key: true
      }
    }

    if (!_.isArray(def)) {
      def = [def]
    }

    _.forEach(def, function(d) {

      var column = _.isObject(d) ? d : {
        key: d,
      }


      if (column.key !== true && typeof(service.cf.all()[0][column.key]) === 'undefined') {
        console.info('Column key does not exist in data!', column.key)
        return service
      }

      if (_.find(service.columns, {
          key: column.key
        })) {
        console.info('Column has already been defined', arguments)
        return service
      }

      column.type =
        column.key === true ? 'all' :
        column.array ? 'array' :
        getType(service.cf.all()[0][column.key])

      column.dimension = dimension(column.key, column.type)

      service.columns.push(column)
    })


    return service
  }
}

function getType(d) {
  if (_.isNumber(d)) {
    return 'number'
  }
  if (_.isBoolean(d)) {
    return 'bool'
  }
  if (_.isArray(d)) {
    return 'array'
  }
  if (_.isObject(d)) {
    return 'object'
  }
  return 'string'
}
