'use strict'

import reductio from 'reductio'

import _ from './lodash'
import aggregators from './aggregators'
import expressions from './expressions'

module.exports = function(service) {
  return function parse(query) {
    var reducer = reductio()
    var groupBy = query.groupBy
    var reductions = aggregateOrNest(query.columns)

    // aggregateOrNest returns an array of:
    // (1) shorthand aggregations
    // (2) aliased aggregations
    // (3) nested value property
    function aggregateOrNest(columns) {

      return _.map(columns, function(value, key) {

        // Shorthand aggregations return reductio aggregations as the value
        if (typeof(value) === 'string' && typeof(value) === 'number') {
          if (!aggregators[key](makeValue(value))) {
            return defer('error', 'No aggregation method found for', key)
          }
          return defer('aggregation', aggregators[key](makeValue(value)))
        }

        // An object will either
        // (1) alias an aggregation if there is only one key/value
        // or
        // (2) nest a new object and recursively run again until finding an aggregation point
        if (_.isObject(value)) {
          var nest = pluckKeyVals(value)

          // Nothing found
          if (!nest.length) {
            return defer('error', 'No value found for key!', key)
          }

          // Alias the field name of the aggregation
          if (nest.length === 1) {
            if (aggregators[nest[0].key]) {
              return defer('aggregation', aggregators[nest[0].key](makeValue(nest[0].value)))
            } else {

            }
          }

          return defer('nest', {
            key: key,
            value: aggregateOrNest(value, key)
          })
        }
      })
    }

    function defer(type, cb) {
      return function deferred() {
        return cb.apply(null, arguments)
      }
    }

    function makeValue(value) {
      if (typeof(value) === 'string' || typeof(value) === 'number') {
        return value + ''
      }
      if (_.isObject(value)) {
        return makeExpressionFunction(value)
      }
    }

    function makeExpressionFunction(value) {
      return function(d) {

        [].reduce(function(a, b) {
          return a(b)
        })
        return $sum
        return [0]
      }
    }

    function pluckKeyVals(value) {
      return _.map(value, function(val, key) {
        return {
          key: key,
          value: val
        }
      })
    }

    function validateAggregator() {

    }
  }
}
