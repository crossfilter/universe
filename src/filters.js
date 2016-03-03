'use strict'

var Promise = require('q')
var _ = require('./lodash')

var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function(service) {
  return {
    filter: filter,
    filterAll: filterAll,
    applyFilters: applyFilters,
    makeFunction: makeFunction,
    scanForDynamicFilters: scanForDynamicFilters
  }

  function filter(d, f) {
    f = _.isUndefined(f) ? false : f
    var exists = service.column.find(d)

    return Promise.try(function() {
        // If the filters dimension doesn't exist yet, try and create it
        if (!exists) {
          return service.column({
              key: d,
              temporary: true
            })
            .then(function() {
              // It was able to be created, so retrieve and return it
              return service.column.find(d)
            })
        }
        // It exists, so just return what we found
        return exists
      })
      .then(function(column) {
        var newfilters = _.clone(service.filters, true)
          // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
        var filterKey = column.complex ? JSON.stringify(column.key) : column.key
        newfilters[filterKey] = f
        return applyFilters(newfilters)
      })

  }

  function filterAll(f) {
    service.filters = f || {}
  }

  function applyFilters(newFilters) {
    var ds = _.map(newFilters, function(f, i) {
      // Filters are the same, so no change is needed on this column
      if (service.filters[i] && _.isEqual(f, service.filters[i])) {
        return Promise.resolve()
      }
      var column
        // Retrieve complex columns by decoding the column key as json
      if (i.charAt(0) === '[') {
        column = service.column.find(JSON.parse(i))
      } else {
        // Retrieve the column normally
        column = service.column.find(i)
      }
      // Make the filter function
      var filterFunction
        // Undefined and false will perform a filterAll and remove the filter
      if (_.isUndefined(f) || f === false) {
        filterFunction = false
      } else {
        filterFunction = makeFunction(f)
      }
      // If filter function is falsey, tag the filter for removal
      // and perform a filterAll on the dimension
      if (!filterFunction) {
        newFilters[i] = false
        return Promise.resolve(column.dimension.filterAll())
      }
      // Filter the dimension using the filterFunction
      return Promise.resolve(column.dimension.filter(filterFunction))
    })

    return Promise.all(ds)
      .then(function() {
        // Save the new filters satate
        service.filters = newFilters
          // Delete filter properties tagged for removal
        return Promise.all(_.map(service.filters, function(v, k) {
          if (!v) {
            delete service.filters[k]

            var column = service.column.find((k.charAt(0) === '[') ? JSON.parse(k) : k)

            if (column.temporary && !column.dynamicReference) {
              return service.clear(column.key)
            }

          }
        }))
      })
      .then(function() {
        return service
      })
  }

  function scanForDynamicFilters(query) {
    // Here we check to see if there are any relative references to the raw data
    // being used in the filter. If so, we need to build those dimensions and keep
    // them updated so the filters can be rebuilt if needed
    // The supported keys right now are: $column, $data
    var columns = []
    walk(query.filter)
    return columns

    function walk(obj) {
      _.forEach(obj, function(val, key) {
        // find the data references, if any
        var ref = findDataReferences(val, key)
        ref && columns.push(ref)
        // if it's a string
        if (_.isString(val)) {
          ref = findDataReferences(null, val)
          ref && columns.push(ref)
        }
          // If it's another object, keep looking
        if (_.isObject(val)) {
          walk(val)
        }
      })
    }
  }

  function findDataReferences(val, key) {
    // look for the $data string as a value
    if (key === '$data') {
      return true
    }

    // look for the $column key and it's value as a string
    if (key && key === '$column') {
      if (_.isString(val)) {
        return val
      }
      console.warn('The value for filter "$column" must be a valid column key', val)
      return false
    }
  }

  function makeFunction(obj, isAggregation) {

    var subGetters

    // Detect raw $data reference
    if (_.isString(obj)) {
      var dataRef = findDataReferences(null, obj)
      if (dataRef) {
        var column = service.column.find(dataRef)
        var data = column.dimension.bottom(Infinity)
        return function(d) {
          return data
        }
      }
    }

    if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
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
      subGetters = _.map(obj, function(o){
        return makeFunction(o, isAggregation)
      })
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
        var getSub = makeFunction(val, isAggregation)

        // Detect raw $column references
        var dataRef = findDataReferences(val, key)
        if (dataRef) {
          var column = service.column.find(dataRef)
          var data = column.dimension.bottom(Infinity)
          return function(d) {
            return data
          }
        }

        // If expression, pass the parentValue and the subGetter
        if (expressions[key]) {
          return function(d) {
            return expressions[key](d, getSub)
          }
        }

        var aggregatorObj = aggregation.parseAggregatorParams(key)
        if (aggregatorObj) {
          // Make sure that any further operations are for aggregations
          // and not filters
          isAggregation = true
          // here we pass true to makeFunction which denotes that
          // an aggregatino chain has started and to stop using $AND
          getSub = makeFunction(val, isAggregation)
            // If it's an aggregation object, be sure to pass in the children, and then any additional params passed into the aggregation string
          return function(d) {
            return aggregatorObj.aggregator.apply(null, [getSub()].concat(aggregatorObj.params))
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
      if (isAggregation) {
        if(subGetters.length === 1){
          return function(d) {
            return subGetters[0](d)
          }
        }
        return function(d) {
          return _.map(subGetters, function(getSub) {
            return getSub(d)
          })
        }
      }
      return function(d) {
        return expressions.$and(d, function(d) {
          return _.map(subGetters, function(getSub) {
            return getSub(d)
          })
        })
      }
    }

    console.log('no expression found for ', obj)
    return false
  }
}
