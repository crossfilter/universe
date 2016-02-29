'use strict'

var reductio = require('reductio')

var _ = require('./lodash')
var rAggregators = require('./reductioAggregators')
var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function(service) {
  var filters = require('./filters')(service)

  return function parse(query) {
    var reducer = reductio()
    var groupBy = query.groupBy
    if (query.filter) {
      makeFilter(reducer, query.filter)
    }
    aggregateOrNest(reducer, query.select)

    return reducer





    function makeFilter(reducer, fil) {
      var filterFunction = filters.makeFunction(fil)
      if (filterFunction) {
        reducer.filter(filterFunction)
      }
    }

    function aggregateOrNest(reducer, selects) {

      // Sort aggregations so that .value is very last
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

      return _.map(sortedSelectKeyValue, function(s) {

        // Found Aggregation
        if (rAggregators.aggregators[s.key]) {
          // Build the valueAccessorFunction
          var accessor = makeValueAccessor(s.value)
            // Add the reducer with the ValueAccessorFunction to the reducer
          reducer = rAggregators.aggregators[s.key](reducer, accessor)
          return
        }

        // Must be a nested object
        if (!_.isObject(s.value)) {
          console.error('Nested selects must be an object', s.key)
          return
        }

        // Recursively aggregateOrNest
        reducer = aggregateOrNest(reducer.value(s.key), s.value)

      })
    }

    function makeValueAccessor(obj) {
      if (typeof(obj) === 'string' || typeof(obj) === 'number') {
        return obj + ''
      }
      if (_.isObject(obj)) {
        return aggregation.makeFunction(obj)
      }
    }
  }
}
