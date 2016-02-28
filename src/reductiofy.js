'use strict'

import reductio from 'reductio'

import _ from './lodash'
import rAggregators from './reductioAggregators'
import expressions from './expressions'
import aggregators from './aggregators'

module.exports = function(service) {
  return function parse(query) {
    var reducer = reductio()
    var groupBy = query.groupBy
    var reductions = aggregateOrNest(reducer, query.select)

    return reducer

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
        return makeValueAccessorFunction(obj)
      }
    }

    function makeValueAccessorFunction(obj) {

      var stack = makeSubAggregationStack(obj)

      return function(d) {
        return stack.reduce(function(a, b) {
          return a(b)
        }, d)
      }
    }

    function makeSubAggregationStack(obj, stack) {

      stack = stack || []

      // Column Name
      if (typeof(obj) === 'string') {
        stack.push(function(d) {
          return d[obj]
        })
        return
      }

      // Object
      if (_.isObject(obj)) {
        var keyVal = extractKeyVal(obj)
        if (!aggregators[keyVal.key]) {
          console.error('Key must be a valid aggregation string', keyVal.key)
          return
        }
        stack.push(aggregators[keyVal.key], makeSubAggregationStack(keyVal.value))
      }

      // Collections
      if (_.isArray(obj)) {
        stack.push(_.map(obj, function(o) {
          return makeSubAggregationStack(o)
        }))
      }

      return stack
    }

    function extractKeyVal(obj) {
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          return {
            key: key,
            value: obj
          }
        }
      }
      return
    }
  }
}
