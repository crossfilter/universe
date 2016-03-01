'use strict'

var Promise = require('bluebird');
var _ = require('./lodash')

var expressions = require('./expressions');

module.exports = function(service) {
  return {
    filter: filter,
    makeFunction: makeFunction
  }

  function filter(dimension, f) {

    var newFilters

    if (!_.isArray(dimension)) {
      if (f) {
        var newFilter = {}
        newFilter[dimension] = f
        newFilters = [newFilter]
      }
    }

    console.log(newFilters)


    service.filters = {}

    return Promise.resolve(service)
  }

  function makeFunction(obj) {

    var subGetters

    // Detect strings and numbers
    if (_.isString(obj) || _.isNumber(obj)) {
      return function(d) {
        if (typeof(d) === 'undefined') {
          return obj
        }
        return expressions.$eq(d, function() {
          return obj
        })
      }
    }

    // If an array, recurse into each item and return as a map
    if (_.isArray(obj)) {
      subGetters = _.map(obj, makeFunction)
      return function(d) {
        return subGetters.map(function(s) {
          return s(d)
        })
      }
    }

    // If object, return a recursion function that itself, returns the results of all of the object keys
    if (_.isObject(obj)) {
      subGetters = _.map(obj, function(val, key) {

        // Get the child
        var getSub = makeFunction(val)

        // If expression, pass the parentValue and the subGetter
        if (expressions[key]) {
          return function(d) {
            return expressions[key](d, getSub)
          }
        }

        // It must be a string then. Pluck that string key from parent, and pass it as the new value to the subGetter
        return function(d) {
          d = d[key]
          return getSub(d, getSub)
        }

      })

      // All object expressions are basically AND's
      // Return AND with a map of the subGetters
      return function(d) {
        return expressions.$and(d, function(d) {
          return _.map(subGetters, function(getSub) {
            return getSub(d)
          })
        })
      }
    }

    console.log('no expression found for ', obj)
    return function() {}
  }
}
