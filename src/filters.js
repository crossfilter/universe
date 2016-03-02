'use strict'

var Promise = require('bluebird');
var _ = require('./lodash')

var expressions = require('./expressions');

module.exports = function(service) {
  return {
    filter: filter,
    filterAll: filterAll,
    applyFilters: applyFilters,
    makeFunction: makeFunction
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

            if (column.temporary) {
              return service.dispose(column.key)
            }

          }
        }))
      })
      .then(function() {
        return service
      })
  }

  function makeFunction(obj) {

    var subGetters
      // Detect strings and numbers
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
    return false
  }
}
