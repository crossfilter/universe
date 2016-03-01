'use strict'

var Promise = require("bluebird");
var _ = require('./lodash')

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  return function column(def) {

    // Support groupAll dimension
    if (def === true || _.isUndefined(def)) {
      def = {
        key: true
      }
    }

    // Always deal in bulk.  Like Costco!
    if (!_.isArray(def)) {
      def = [def]
    }

    // Mapp all column creation, wait for all to settle, then return the instance
    return Promise.all(_.map(def, makeColumn))
      .reflect()
      .then(function(res) {
        return service
      })
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

  function makeColumn(d) {

    var column = _.isObject(d) ? d : {
      key: d,
    }

    // Get a sample of the column
    return Promise.try(function() {
        return Promise.resolve(service.cf.all())
      })
      .then(function(all) {
        var sample = all[0][column.key]
        if (column.key !== true && typeof(sample) === 'undefined') {
          throw new Error('Column key does not exist in data!', column.key)
        }

        if (_.find(service.columns, {
            key: column.key
          })) {
          console.info('Column has already been defined', arguments)
        }

        column.type =
          column.key === true ? 'all' :
          column.array ? 'array' :
          getType(sample)

        return dimension(column.key, column.type)
      })
      .then(function(dimension) {
        column.dimension = dimension
        service.columns.push(column)
        return service
      })
  }

}
