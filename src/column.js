'use strict'

var Promise = require("q");
var _ = require('./lodash')

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  var columnFunc = column
  columnFunc.find = findColumn

  return columnFunc

  function column(def) {

    // Support groupAll dimension
    if (_.isUndefined(def)) {
      def = true
    }

    // Always deal in bulk.  Like Costco!
    if (!_.isArray(def)) {
      def = [def]
    }

    // Mapp all column creation, wait for all to settle, then return the instance
    return Promise.all(_.map(def, makeColumn))
      .then(function(res) {
        return service
      })
  }

  function findColumn(d) {
    return _.find(service.columns, function(c) {
      if (_.isArray(d)) {
        return !_.xor(c.key, d).length
      }
      return c.key === d
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

    var existing = findColumn(column.key)

    if (existing) {
      existing = existing
      existing.temporary = false
      if (existing.dynamicReference) {
        existing.dynamicReference = false
      }
      return existing.promise
        .then(function() {
          return service
        })
    }

    // for storing info about queries and post aggregations
    column.queries = []
    service.columns.push(column)

    column.promise = Promise.try(function() {
        return Promise.resolve(service.cf.all())
      })
      .then(function(all) {

        var sample

        // Complex column Keys
        if (_.isArray(column.key)) {
          column.complex = true
          sample = _.values(_.pick(all[0], column.key))
          if (sample.length !== column.key.length) {
            throw new Error('Column key does not exist in data!', column.key)
          }
        } else {
          sample = all[0][column.key]
        }

        // Index Column
        if (!column.complex && column.key !== true && typeof(sample) === 'undefined') {
          throw new Error('Column key does not exist in data!', column.key)
        }

        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user decides to make it permanent

        column.type =
          column.key === true ? 'all' :
          column.complex ? 'complex' :
          column.array ? 'array' :
          getType(sample)

        return dimension.make(column.key, column.type)
      })
      .then(function(dim) {
        column.dimension = dim
        column.filterCount = 0
        var stopListeningForData = service.onDataChange(buildColumnKeys)
        column.removeListeners = [stopListeningForData]

        return buildColumnKeys()

        // Build the columnKeys
        function buildColumnKeys(changes) {
          if (column.key === true) {
            return Promise.resolve()
          }

          var accessor = dimension.makeAccessor(column.key)
          column.values = column.values || []

          return Promise.try(function(){
            if (changes && changes.added) {
              return Promise.resolve(changes.added)
            } else {
              return Promise.resolve(column.dimension.bottom(Infinity))
            }
          })
          .then(function(rows) {
            if (column.type === 'complex') {
              var newValues = _.flatten(_.map(rows, accessor))
            } else if (column.type === 'array') {
              var newValues = _.flatten(_.map(rows, accessor))
            } else {
              var newValues = _.map(rows, accessor)
            }
            column.values = _.uniq(column.values.concat(newValues))
          })
        }
      })

    return column.promise
      .then(function() {
        return service
      })
  }

}
