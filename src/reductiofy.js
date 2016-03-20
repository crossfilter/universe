'use strict'

var reductio = require('reductio')

var _ = require('./lodash')
var rAggregators = require('./reductioAggregators')
var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function(service) {
  var filters = require('./filters')(service)

  return function reductiofy(query) {
    var reducer = reductio()
    var groupBy = query.groupBy
    aggregateOrNest(reducer, query.select)

    if (query.filter) {
      var filterFunction = filters.makeFunction(query.filter)
      if (filterFunction) {
        reducer.filter(filterFunction)
      }
    }

    return Promise.resolve(reducer)


    // This function recursively find the first level of reductio methods in
    // each object and adds that reduction method to reductio
    function aggregateOrNest(reducer, selects) {

      // Sort so nested values are calculated last by reductio's .value method
      var sortedSelectKeyValue = _.sortBy(
        _.map(selects, function(val, key) {
          return {
            key: key,
            value: val
          }
        }),
        function(s) {
          if (rAggregators.aggregators[s.key]) {
            return 0
          }
          return 1
        })

      // dive into each key/value
      return _.forEach(sortedSelectKeyValue, function(s) {

        // Found a Reductio Aggregation
        if (rAggregators.aggregators[s.key]) {
          // Build the valueAccessorFunction
          var accessor = makeValueAccessor(s.value)
            // Add the reducer with the ValueAccessorFunction to the reducer
          reducer = rAggregators.aggregators[s.key](reducer, accessor)
          return
        }

        // Found a top level key value that is not an aggregation or a
        // nested object. This is unacceptable.
        if (!_.isObject(s.value)) {
          console.error('Nested selects must be an object', s.key)
          return
        }

        // It's another nested object, so just repeat this process on it
        reducer = aggregateOrNest(reducer.value(s.key), s.value)

      })
    }

    function makeValueAccessor(value) {

      if (typeof(value) === 'string') {
        // If the value is a string and starts with $, then we need to build a custom value accessor function
        if(value.charAt(0) === '$'){
          return aggregation.makeFunction(value)
        }
        // Must be a column key. Reductio will use it as the accessor
        return value + ''
      }
      // Must be a column index. Reductio will use it as the accessor
      if (typeof(value) === 'number') {
        return value + ''
      }
      // If it's an object, we need to build a custom value accessor function
      if (_.isObject(value)) {
        return aggregation.makeFunction(value)
      }
    }
  }
}
