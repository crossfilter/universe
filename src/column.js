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
      .then(function(res) {
        return service
      })
  }

  function findColumn(d){
    return _.find(service.columns, function(c){
      if(_.isArray(d)){
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

    // Get a sample of the column
    return Promise.try(function() {
        return Promise.resolve(service.cf.all())
      })
      .then(function(all) {

        var sample

        // Complex column Keys
        if (_.isArray(column.key)) {
          column.complex = true
          sample = _.map(_.pick(all[0], column.key))
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

        var existing = findColumn(column.key)

        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user decides to make it permanent
        if (existing && !column.temporary) {
          existing.temporary = false
          if(column.dynamicReference){
            existing.dynamicReference = true
          }
          // console.info('Column has already been defined', arguments)
          return service
        }

        column.type =
          column.key === true ? 'all' :
          column.complex ? 'complex' :
          column.array ? 'array' :
          getType(sample)

        return dimension.make(column.key, column.type)
      })
      .then(function(dim) {
        column.dimension = dim
        column.filterCount = column.filterCount || 0
        column.removeListeners = [buildColumnKeys]
        column.addListeners = [buildColumnKeys]

        service.columns.push(column)

        return buildColumnKeys()

        // Build the columnKeys
        function buildColumnKeys(){
          return Promise.try(function(){
            return Promise.resolve(column.dimension.bottom(Infinity))
          })
          .then(function(rows){
            var accessor = dimension.makeAccessor(column.key)
            column.values = _.sort(_.uniq(_.flatten(_.map(rows, accessor))))
          })
        }
      })
      .then(function(){
        return service
      })
  }

}
