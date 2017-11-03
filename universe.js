(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.universe = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

var aggregators = {
  // Collections
  $sum: $sum,
  $avg: $avg,
  $max: $max,
  $min: $min,

  // Pickers
  $count: $count,
  $first: $first,
  $last: $last,
  $get: $get,
  $nth: $get, // nth is same as using a get
  $nthLast: $nthLast,
  $nthPct: $nthPct,
  $map: $map,
}

module.exports = {
  makeValueAccessor: makeValueAccessor,
  aggregators: aggregators,
  extractKeyValOrArray: extractKeyValOrArray,
  parseAggregatorParams: parseAggregatorParams,
}
  // This is used to build aggregation stacks for sub-reductio
  // aggregations, or plucking values for use in filters from the data
function makeValueAccessor(obj) {
  if (typeof obj === 'string') {
    if (isStringSyntax(obj)) {
      obj = convertAggregatorString(obj)
    } else {
      // Must be a column key. Return an identity accessor
      return obj
    }
  }
  // Must be a column index. Return an identity accessor
  if (typeof obj === 'number') {
    return obj
  }
  // If it's an object, we need to build a custom value accessor function
  if (_.isObject(obj)) {
    return make()
  }

  function make() {
    var stack = makeSubAggregationFunction(obj)
    return function topStack(d) {
      return stack(d)
    }
  }
}

// A recursive function that walks the aggregation stack and returns
// a function. The returned function, when called, will recursively invoke
// with the properties from the previous stack in reverse order
function makeSubAggregationFunction(obj) {
  // If its an object, either unwrap all of the properties as an
  // array of keyValues, or unwrap the first keyValue set as an object
  obj = _.isObject(obj) ? extractKeyValOrArray(obj) : obj

  // Detect strings
  if (_.isString(obj)) {
    // If begins with a $, then we need to convert it over to a regular query object and analyze it again
    if (isStringSyntax(obj)) {
      return makeSubAggregationFunction(convertAggregatorString(obj))
    }
    // If normal string, then just return a an itentity accessor
    return function identity(d) {
      return d[obj]
    }
  }

  // If an array, recurse into each item and return as a map
  if (_.isArray(obj)) {
    var subStack = _.map(obj, makeSubAggregationFunction)
    return function getSubStack(d) {
      return subStack.map(function (s) {
        return s(d)
      })
    }
  }

  // If object, find the aggregation, and recurse into the value
  if (obj.key) {
    if (aggregators[obj.key]) {
      var subAggregationFunction = makeSubAggregationFunction(obj.value)
      return function getAggregation(d) {
        return aggregators[obj.key](subAggregationFunction(d))
      }
    }
    console.error('Could not find aggregration method', obj)
  }

  return []
}

function extractKeyValOrArray(obj) {
  var keyVal
  var values = []
  for (var key in obj) {
    if ({}.hasOwnProperty.call(obj, key)) {
      keyVal = {
        key: key,
        value: obj[key]
      }
      var subObj = {}
      subObj[key] = obj[key]
      values.push(subObj)
    }
  }
  return values.length > 1 ? values : keyVal
}

function isStringSyntax(str) {
  return ['$', '('].indexOf(str.charAt(0)) > -1
}

function parseAggregatorParams(keyString) {
  var params = []
  var p1 = keyString.indexOf('(')
  var p2 = keyString.indexOf(')')
  var key = p1 > -1 ? keyString.substring(0, p1) : keyString
  if (!aggregators[key]) {
    return false
  }
  if (p1 > -1 && p2 > -1 && p2 > p1) {
    params = keyString.substring(p1 + 1, p2).split(',')
  }

  return {
    aggregator: aggregators[key],
    params: params
  }
}

function convertAggregatorString(keyString) {
  // var obj = {} // obj is defined but not used

  // 1. unwrap top parentheses
  // 2. detect arrays

  // parentheses
  var outerParens = /\((.+)\)/g
  // var innerParens = /\(([^\(\)]+)\)/g  // innerParens is defined but not used
    // comma not in ()
  var hasComma = /(?:\([^\(\)]*\))|(,)/g

  return JSON.parse('{' + unwrapParensAndCommas(keyString) + '}')

  function unwrapParensAndCommas(str) {
    str = str.replace(' ', '')
    return '"' + str.replace(outerParens, function (p, pr) {
      if (hasComma.test(pr)) {
        if (pr.charAt(0) === '$') {
          return '":{"' + pr.replace(hasComma, function (p2/* , pr2 */) {
            if (p2 === ',') {
              return ',"'
            }
            return unwrapParensAndCommas(p2).trim()
          }) + '}'
        }
        return ':["' + pr.replace(hasComma, function (/* p2 , pr2 */) {
          return '","'
        }) + '"]'
      }
    })
  }
}

// Collection Aggregators

function $sum(children) {
  return children.reduce(function (a, b) {
    return a + b
  }, 0)
}

function $avg(children) {
  return children.reduce(function (a, b) {
    return a + b
  }, 0) / children.length
}

function $max(children) {
  return Math.max.apply(null, children)
}

function $min(children) {
  return Math.min.apply(null, children)
}

function $count(children) {
  return children.length
}

/* function $med(children) { // $med is defined but not used
  children.sort(function(a, b) {
    return a - b
  })
  var half = Math.floor(children.length / 2)
  if (children.length % 2)
    return children[half]
  else
    return (children[half - 1] + children[half]) / 2.0
} */

function $first(children) {
  return children[0]
}

function $last(children) {
  return children[children.length - 1]
}

function $get(children, n) {
  return children[n]
}

function $nthLast(children, n) {
  return children[children.length - n]
}

function $nthPct(children, n) {
  return children[Math.round(children.length * (n / 100))]
}

function $map(children, n) {
  return children.map(function (d) {
    return d[n]
  })
}

},{"./lodash":9}],2:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  return function clear(def) {
    // Clear a single or multiple column definitions
    if (def) {
      def = _.isArray(def) ? def : [def]
    }

    if (!def) {
      // Clear all of the column defenitions
      return Promise.all(_.map(service.columns, disposeColumn))
        .then(function () {
          service.columns = []
          return service
        })
    }

    return Promise.all(_.map(def, function (d) {
      if (_.isObject(d)) {
        d = d.key
      }
      // Clear the column
      var column = _.remove(service.columns, function (c) {
        if (_.isArray(d)) {
          return !_.xor(c.key, d).length
        }
        if (c.key === d) {
          if (c.dynamicReference) {
            return false
          }
          return true
        }
      })[0]

      if (!column) {
        // console.info('Attempted to clear a column that is required for another query!', c)
        return
      }

      disposeColumn(column)
    }))
    .then(function () {
      return service
    })

    function disposeColumn(column) {
      var disposalActions = []
        // Dispose the dimension
      if (column.removeListeners) {
        disposalActions = _.map(column.removeListeners, function (listener) {
          return Promise.resolve(listener())
        })
      }
      var filterKey = column.key
      if (column.complex === 'array') {
        filterKey = JSON.stringify(column.key)
      }
      if (column.complex === 'function') {
        filterKey = column.key.toString()
      }
      delete service.filters[filterKey]
      if (column.dimension) {
        disposalActions.push(Promise.resolve(column.dimension.dispose()))
      }
      return Promise.all(disposalActions)
    }
  }
}

},{"./lodash":9,"q":33}],3:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
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
      .then(function () {
        return service
      })
  }

  function findColumn(d) {
    return _.find(service.columns, function (c) {
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
      existing.temporary = false
      if (existing.dynamicReference) {
        existing.dynamicReference = false
      }
      return existing.promise
        .then(function () {
          return service
        })
    }

    // for storing info about queries and post aggregations
    column.queries = []
    service.columns.push(column)

    column.promise = Promise.try(function () {
      return Promise.resolve(service.cf.all())
    })
    .then(function (all) {
      var sample

      // Complex column Keys
      if (_.isFunction(column.key)) {
        column.complex = 'function'
        sample = column.key(all[0])
      } else if (_.isString(column.key) && (column.key.indexOf('.') > -1 || column.key.indexOf('[') > -1)) {
        column.complex = 'string'
        sample = _.get(all[0], column.key)
      } else if (_.isArray(column.key)) {
        column.complex = 'array'
        sample = _.values(_.pick(all[0], column.key))
        if (sample.length !== column.key.length) {
          throw new Error('Column key does not exist in data!', column.key)
        }
      } else {
        sample = all[0][column.key]
      }

      // Index Column
      if (!column.complex && column.key !== true && typeof sample === 'undefined') {
        throw new Error('Column key does not exist in data!', column.key)
      }

      // If the column exists, let's at least make sure it's marked
      // as permanent. There is a slight chance it exists because
      // of a filter, and the user decides to make it permanent

      if (column.key === true) {
        column.type = 'all'
      } else if (column.complex) {
        column.type = 'complex'
      } else if (column.array) {
        column.type = 'array'
      } else {
        column.type = getType(sample)
      }

      return dimension.make(column.key, column.type, column.complex)
    })
    .then(function (dim) {
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

        var accessor = dimension.makeAccessor(column.key, column.complex)
        column.values = column.values || []

        return Promise.try(function () {
          if (changes && changes.added) {
            return Promise.resolve(changes.added)
          }
          return Promise.resolve(column.dimension.bottom(Infinity))
        })
        .then(function (rows) {
          var newValues
          if (column.complex === 'string' || column.complex === 'function') {
            newValues = _.map(rows, accessor)
            // console.log(rows, accessor.toString(), newValues)
          } else if (column.type === 'array') {
            newValues = _.flatten(_.map(rows, accessor))
          } else {
            newValues = _.map(rows, accessor)
          }
          column.values = _.uniq(column.values.concat(newValues))
        })
      }
    })

    return column.promise
      .then(function () {
        return service
      })
  }
}

},{"./dimension":6,"./lodash":9,"q":33}],4:[function(require,module,exports){
'use strict'

var Promise = require('q')
var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = function (service) {
  return {
    build: build,
    generateColumns: generateColumns,
    add: add,
    remove: remove,
  }

  function build(c) {
    if (_.isArray(c)) {
      // This allows support for crossfilter async
      return Promise.resolve(crossfilter(c))
    }
    if (!c || typeof c.dimension !== 'function') {
      return Promise.reject(new Error('No Crossfilter data or instance found!'))
    }
    return Promise.resolve(c)
  }

  function generateColumns(data) {
    if (!service.options.generatedColumns) {
      return data
    }
    return _.map(data, function (d/* , i */) {
      _.forEach(service.options.generatedColumns, function (val, key) {
        d[key] = val(d)
      })
      return d
    })
  }

  function add(data) {
    data = generateColumns(data)
    return Promise.try(function () {
      return Promise.resolve(service.cf.add(data))
    })
    .then(function () {
      return Promise.serial(_.map(service.dataListeners, function (listener) {
        return function () {
          return listener({
            added: data
          })
        }
      }))
    })
    .then(function () {
      return service
    })
  }

  function remove() {
    return Promise.try(function () {
      return Promise.resolve(service.cf.remove())
    })
    .then(function () {
      return service
    })
  }
}

},{"./lodash":9,"crossfilter2":16,"q":33}],5:[function(require,module,exports){
'use strict'

var Promise = require('q')
// var _ = require('./lodash') // _ is defined but never used

module.exports = function (service) {
  return function destroy() {
    return service.clear()
      .then(function () {
        service.cf.dataListeners = []
        service.cf.filterListeners = []
        return Promise.resolve(service.cf.remove())
      })
      .then(function () {
        return service
      })
  }
}

},{"q":33}],6:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  return {
    make: make,
    makeAccessor: makeAccessor,
  }

  function make(key, type, complex) {
    var accessor = makeAccessor(key, complex)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
  }

  function makeAccessor(key, complex) {
    var accessorFunction

    if (complex === 'string') {
      accessorFunction = function (d) {
        return _.get(d, key)
      }
    } else if (complex === 'function') {
      accessorFunction = key
    } else if (complex === 'array') {
      var arrayString = _.map(key, function (k) {
        return 'd[\'' + k + '\']'
      })
      accessorFunction = new Function('d', String('return ' + JSON.stringify(arrayString).replace(/"/g, '')))  // eslint-disable-line  no-new-func
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? function accessor(d, i) {
          return i
        } :
        // Value Accessor Dimension
        function (d) {
          return d[key]
        }
    }
    return accessorFunction
  }
}

},{"./lodash":9,"q":33}],7:[function(require,module,exports){
'use strict'

// var moment = require('moment')

module.exports = {
  // Getters
  $field: $field,
  // Booleans
  $and: $and,
  $or: $or,
  $not: $not,

  // Expressions
  $eq: $eq,
  $gt: $gt,
  $gte: $gte,
  $lt: $lt,
  $lte: $lte,
  $ne: $ne,
  $type: $type,

  // Array Expressions
  $in: $in,
  $nin: $nin,
  $contains: $contains,
  $excludes: $excludes,
  $size: $size,
}

// Getters
function $field(d, child) {
  return d[child]
}

// Operators

function $and(d, child) {
  child = child(d)
  for (var i = 0; i < child.length; i++) {
    if (!child[i]) {
      return false
    }
  }
  return true
}

function $or(d, child) {
  child = child(d)
  for (var i = 0; i < child.length; i++) {
    if (child[i]) {
      return true
    }
  }
  return false
}

function $not(d, child) {
  child = child(d)
  for (var i = 0; i < child.length; i++) {
    if (child[i]) {
      return false
    }
  }
  return true
}

// Expressions

function $eq(d, child) {
  return d === child()
}

function $gt(d, child) {
  return d > child()
}

function $gte(d, child) {
  return d >= child()
}

function $lt(d, child) {
  return d < child()
}

function $lte(d, child) {
  return d <= child()
}

function $ne(d, child) {
  return d !== child()
}

function $type(d, child) {
  return typeof d === child()
}

// Array Expressions

function $in(d, child) {
  return d.indexOf(child()) > -1
}

function $nin(d, child) {
  return d.indexOf(child()) === -1
}

function $contains(d, child) {
  return child().indexOf(d) > -1
}

function $excludes(d, child) {
  return child().indexOf(d) === -1
}

function $size(d, child) {
  return d.length === child()
}

},{}],8:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function (service) {
  return {
    filter: filter,
    filterAll: filterAll,
    applyFilters: applyFilters,
    makeFunction: makeFunction,
    scanForDynamicFilters: scanForDynamicFilters
  }

  function filter(column, fil, isRange, replace) {
    return getColumn(column)
    .then(function (column) {
      // Clone a copy of the new filters
      var newFilters = _.assign({}, service.filters)
      // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
      var filterKey = column.key
      if (column.complex === 'array') {
        filterKey = JSON.stringify(column.key)
      }
      if (column.complex === 'function') {
        filterKey = column.key.toString()
      }
      // Build the filter object
      newFilters[filterKey] = buildFilterObject(fil, isRange, replace)

      return applyFilters(newFilters)
    })
  }

  function getColumn(column) {
    var exists = service.column.find(column)
    // If the filters dimension doesn't exist yet, try and create it
    return Promise.try(function () {
      if (!exists) {
        return service.column({
          key: column,
          temporary: true,
        })
        .then(function () {
          // It was able to be created, so retrieve and return it
          return service.column.find(column)
        })
      }
      // It exists, so just return what we found
      return exists
    })
  }

  function filterAll(fils) {
    // If empty, remove all filters
    if (!fils) {
      service.columns.forEach(function (col) {
        col.dimension.filterAll()
      })
      return applyFilters({})
    }

    // Clone a copy for the new filters
    var newFilters = _.assign({}, service.filters)

    var ds = _.map(fils, function (fil) {
      return getColumn(fil.column)
        .then(function (column) {
          // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
          var filterKey = column.complex ? JSON.stringify(column.key) : column.key
          // Build the filter object
          newFilters[filterKey] = buildFilterObject(fil.value, fil.isRange, fil.replace)
        })
    })

    return Promise.all(ds)
      .then(function () {
        return applyFilters(newFilters)
      })
  }

  function buildFilterObject(fil, isRange, replace) {
    if (_.isUndefined(fil)) {
      return false
    }
    if (_.isFunction(fil)) {
      return {
        value: fil,
        function: fil,
        replace: true,
        type: 'function',
      }
    }
    if (_.isObject(fil)) {
      return {
        value: fil,
        function: makeFunction(fil),
        replace: true,
        type: 'function'
      }
    }
    if (_.isArray(fil)) {
      return {
        value: fil,
        replace: isRange || replace,
        type: isRange ? 'range' : 'inclusive',
      }
    }
    return {
      value: fil,
      replace: replace,
      type: 'exact',
    }
  }

  function applyFilters(newFilters) {
    var ds = _.map(newFilters, function (fil, i) {
      var existing = service.filters[i]
        // Filters are the same, so no change is needed on this column
      if (fil === existing) {
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

      // Toggling a filter value is a bit different from replacing them
      if (fil && existing && !fil.replace) {
        newFilters[i] = fil = toggleFilters(fil, existing)
      }

      // If no filter, remove everything from the dimension
      if (!fil) {
        return Promise.resolve(column.dimension.filterAll())
      }
      if (fil.type === 'exact') {
        return Promise.resolve(column.dimension.filterExact(fil.value))
      }
      if (fil.type === 'range') {
        return Promise.resolve(column.dimension.filterRange(fil.value))
      }
      if (fil.type === 'inclusive') {
        return Promise.resolve(column.dimension.filterFunction(function (d) {
          return fil.value.indexOf(d) > -1
        }))
      }
      if (fil.type === 'function') {
        return Promise.resolve(column.dimension.filterFunction(fil.function))
      }
      // By default if something craps up, just remove all filters
      return Promise.resolve(column.dimension.filterAll())
    })

    return Promise.all(ds)
      .then(function () {
        // Save the new filters satate
        service.filters = newFilters

        // Pluck and remove falsey filters from the mix
        var tryRemoval = []
        _.forEach(service.filters, function (val, key) {
          if (!val) {
            tryRemoval.push({
              key: key,
              val: val,
            })
            delete service.filters[key]
          }
        })

        // If any of those filters are the last dependency for the column, then remove the column
        return Promise.all(_.map(tryRemoval, function (v) {
          var column = service.column.find((v.key.charAt(0) === '[') ? JSON.parse(v.key) : v.key)
          if (column.temporary && !column.dynamicReference) {
            return service.clear(column.key)
          }
        }))
      })
      .then(function () {
        // Call the filterListeners and wait for their return
        return Promise.all(_.map(service.filterListeners, function (listener) {
          return listener()
        }))
      })
      .then(function () {
        return service
      })
  }

  function toggleFilters(fil, existing) {
    // Exact from Inclusive
    if (fil.type === 'exact' && existing.type === 'inclusive') {
      fil.value = _.xor([fil.value], existing.value)
    } else if (fil.type === 'inclusive' && existing.type === 'exact') { // Inclusive from Exact
      fil.value = _.xor(fil.value, [existing.value])
    } else if (fil.type === 'inclusive' && existing.type === 'inclusive') { // Inclusive / Inclusive Merge
      fil.value = _.xor(fil.value, existing.value)
    } else if (fil.type === 'exact' && existing.type === 'exact') { // Exact / Exact
      // If the values are the same, remove the filter entirely
      if (fil.value === existing.value) {
        return false
      }
      // They they are different, make an array
      fil.value = [fil.value, existing.value]
    }

    // Set the new type based on the merged values
    if (!fil.value.length) {
      fil = false
    } else if (fil.value.length === 1) {
      fil.type = 'exact'
      fil.value = fil.value[0]
    } else {
      fil.type = 'inclusive'
    }

    return fil
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
      _.forEach(obj, function (val, key) {
        // find the data references, if any
        var ref = findDataReferences(val, key)
        if (ref) {
          columns.push(ref)
        }
          // if it's a string
        if (_.isString(val)) {
          ref = findDataReferences(null, val)
          if (ref) {
            columns.push(ref)
          }
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
        var data = service.cf.all()
        return function () {
          return data
        }
      }
    }

    if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
      return function (d) {
        if (typeof d === 'undefined') {
          return obj
        }
        return expressions.$eq(d, function () {
          return obj
        })
      }
    }

    // If an array, recurse into each item and return as a map
    if (_.isArray(obj)) {
      subGetters = _.map(obj, function (o) {
        return makeFunction(o, isAggregation)
      })
      return function (d) {
        return subGetters.map(function (s) {
          return s(d)
        })
      }
    }

    // If object, return a recursion function that itself, returns the results of all of the object keys
    if (_.isObject(obj)) {
      subGetters = _.map(obj, function (val, key) {
        // Get the child
        var getSub = makeFunction(val, isAggregation)

        // Detect raw $column references
        var dataRef = findDataReferences(val, key)
        if (dataRef) {
          var column = service.column.find(dataRef)
          var data = column.values
          return function () {
            return data
          }
        }

        // If expression, pass the parentValue and the subGetter
        if (expressions[key]) {
          return function (d) {
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
          return function () {
            return aggregatorObj.aggregator.apply(null, [getSub()].concat(aggregatorObj.params))
          }
        }

        // It must be a string then. Pluck that string key from parent, and pass it as the new value to the subGetter
        return function (d) {
          d = d[key]
          return getSub(d, getSub)
        }
      })

      // All object expressions are basically AND's
      // Return AND with a map of the subGetters
      if (isAggregation) {
        if (subGetters.length === 1) {
          return function (d) {
            return subGetters[0](d)
          }
        }
        return function (d) {
          return _.map(subGetters, function (getSub) {
            return getSub(d)
          })
        }
      }
      return function (d) {
        return expressions.$and(d, function (d) {
          return _.map(subGetters, function (getSub) {
            return getSub(d)
          })
        })
      }
    }

    console.log('no expression found for ', obj)
    return false
  }
}

},{"./aggregation":1,"./expressions":7,"./lodash":9,"q":33}],9:[function(require,module,exports){
/* eslint no-prototype-builtins: 0 */
'use strict'

module.exports = {
  assign: assign,
  find: find,
  remove: remove,
  isArray: isArray,
  isObject: isObject,
  isBoolean: isBoolean,
  isString: isString,
  isNumber: isNumber,
  isFunction: isFunction,
  get: get,
  set: set,
  map: map,
  keys: keys,
  sortBy: sortBy,
  forEach: forEach,
  isUndefined: isUndefined,
  pick: pick,
  xor: xor,
  clone: clone,
  isEqual: isEqual,
  replaceArray: replaceArray,
  uniq: uniq,
  flatten: flatten,
  sort: sort,
  values: values,
  recurseObject: recurseObject,
}

function assign(out) {
  out = out || {}
  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i]) {
      continue
    }
    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        out[key] = arguments[i][key]
      }
    }
  }
  return out
}

function find(a, b) {
  return a.find(b)
}

function remove(a, b) {
  return a.filter(function (o, i) {
    var r = b(o)
    if (r) {
      a.splice(i, 1)
      return true
    }
    return false
  })
}

function isArray(a) {
  return Array.isArray(a)
}

function isObject(d) {
  return typeof d === 'object' && !isArray(d)
}

function isBoolean(d) {
  return typeof d === 'boolean'
}

function isString(d) {
  return typeof d === 'string'
}

function isNumber(d) {
  return typeof d === 'number'
}

function isFunction(a) {
  return typeof a === 'function'
}

function get(a, b) {
  if (isArray(b)) {
    b = b.join('.')
  }
  return b
    .replace('[', '.').replace(']', '')
    .split('.')
    .reduce(
      function (obj, property) {
        return obj[property]
      }, a
    )
}

function set(obj, prop, value) {
  if (typeof prop === 'string') {
    prop = prop
      .replace('[', '.').replace(']', '')
      .split('.')
  }
  if (prop.length > 1) {
    var e = prop.shift()
    assign(obj[e] =
      Object.prototype.toString.call(obj[e]) === '[object Object]' ? obj[e] : {},
      prop,
      value)
  } else {
    obj[prop[0]] = value
  }
}

function map(a, b) {
  var m
  var key
  if (isFunction(b)) {
    if (isObject(a)) {
      m = []
      for (key in a) {
        if (a.hasOwnProperty(key)) {
          m.push(b(a[key], key, a))
        }
      }
      return m
    }
    return a.map(b)
  }
  if (isObject(a)) {
    m = []
    for (key in a) {
      if (a.hasOwnProperty(key)) {
        m.push(a[key])
      }
    }
    return m
  }
  return a.map(function (aa) {
    return aa[b]
  })
}

function keys(obj) {
  return Object.keys(obj)
}

function sortBy(a, b) {
  if (isFunction(b)) {
    return a.sort(function (aa, bb) {
      if (b(aa) > b(bb)) {
        return 1
      }
      if (b(aa) < b(bb)) {
        return -1
      }
      // a must be equal to b
      return 0
    })
  }
}

function forEach(a, b) {
  if (isObject(a)) {
    for (var key in a) {
      if (a.hasOwnProperty(key)) {
        b(a[key], key, a)
      }
    }
    return
  }
  if (isArray(a)) {
    return a.forEach(b)
  }
}

function isUndefined(a) {
  return typeof a === 'undefined'
}

function pick(a, b) {
  var c = {}
  forEach(b, function (bb) {
    if (typeof a[bb] !== 'undefined') {
      c[bb] = a[bb]
    }
  })
  return c
}

function xor(a, b) {
  var unique = []
  forEach(a, function (aa) {
    if (b.indexOf(aa) === -1) {
      return unique.push(aa)
    }
  })
  forEach(b, function (bb) {
    if (a.indexOf(bb) === -1) {
      return unique.push(bb)
    }
  })
  return unique
}

function clone(a) {
  return JSON.parse(JSON.stringify(a, function replacer(key, value) {
    if (typeof value === 'function') {
      return value.toString()
    }
    return value
  }))
}

function isEqual(x, y) {
  if ((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {
    if (Object.keys(x).length !== Object.keys(y).length) {
      return false
    }

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!isEqual(x[prop], y[prop])) {
          return false
        }
      }
      return false
    }

    return true
  } else if (x !== y) {
    return false
  }
  return true
}

function replaceArray(a, b) {
  var al = a.length
  var bl = b.length
  if (al > bl) {
    a.splice(bl, al - bl)
  } else if (al < bl) {
    a.push.apply(a, new Array(bl - al))
  }
  forEach(a, function (val, key) {
    a[key] = b[key]
  })
  return a
}

function uniq(a) {
  var seen = new Set()
  return a.filter(function (item) {
    var allow = false
    if (!seen.has(item)) {
      seen.add(item)
      allow = true
    }
    return allow
  })
}

function flatten(aa) {
  var flattened = []
  for (var i = 0; i < aa.length; ++i) {
    var current = aa[i]
    for (var j = 0; j < current.length; ++j) {
      flattened.push(current[j])
    }
  }
  return flattened
}

function sort(arr) {
  for (var i = 1; i < arr.length; i++) {
    var tmp = arr[i]
    var j = i
    while (arr[j - 1] > tmp) {
      arr[j] = arr[j - 1];
      --j
    }
    arr[j] = tmp
  }

  return arr
}

function values(a) {
  var values = []
  for (var key in a) {
    if (a.hasOwnProperty(key)) {
      values.push(a[key])
    }
  }
  return values
}

function recurseObject(obj, cb) {
  _recurseObject(obj, [])
  return obj
  function _recurseObject(obj, path) {
    for (var k in obj) { //  eslint-disable-line guard-for-in
      var newPath = clone(path)
      newPath.push(k)
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        _recurseObject(obj[k], newPath)
      } else {
        if (!obj.hasOwnProperty(k)) {
          continue
        }
        cb(obj[k], k, newPath)
      }
    }
  }
}

},{}],10:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

var aggregation = require('./aggregation')

module.exports = function (/* service */) {
  return {
    post: post,
    sortByKey: sortByKey,
    limit: limit,
    squash: squash,
    change: change,
    changeMap: changeMap,
  }

  function post(query, parent, cb) {
    query.data = cloneIfLocked(parent)
    return Promise.resolve(cb(query, parent))
  }

  function sortByKey(query, parent, desc) {
    query.data = cloneIfLocked(parent)
    query.data = _.sortBy(query.data, function (d) {
      return d.key
    })
    if (desc) {
      query.data.reverse()
    }
  }

  // Limit results to n, or from start to end
  function limit(query, parent, start, end) {
    query.data = cloneIfLocked(parent)
    if (_.isUndefined(end)) {
      end = start || 0
      start = 0
    } else {
      start = start || 0
      end = end || query.data.length
    }
    query.data = query.data.splice(start, end - start)
  }

  // Squash results to n, or from start to end
  function squash(query, parent, start, end, aggObj, label) {
    query.data = cloneIfLocked(parent)
    start = start || 0
    end = end || query.data.length
    var toSquash = query.data.splice(start, end - start)
    var squashed = {
      key: label || 'Other',
      value: {}
    }
    _.recurseObject(aggObj, function (val, key, path) {
      var items = []
      _.forEach(toSquash, function (record) {
        items.push(_.get(record.value, path))
      })
      _.set(squashed.value, path, aggregation.aggregators[val](items))
    })
    query.data.splice(start, 0, squashed)
  }

  function change(query, parent, start, end, aggObj) {
    query.data = cloneIfLocked(parent)
    start = start || 0
    end = end || query.data.length
    var obj = {
      key: [query.data[start].key, query.data[end].key],
      value: {}
    }
    _.recurseObject(aggObj, function (val, key, path) {
      var changePath = _.clone(path)
      changePath.pop()
      changePath.push(key + 'Change')
      _.set(obj.value, changePath, _.get(query.data[end].value, path) - _.get(query.data[start].value, path))
    })
    query.data = obj
  }

  function changeMap(query, parent, aggObj, defaultNull) {
    defaultNull = _.isUndefined(defaultNull) ? 0 : defaultNull
    query.data = cloneIfLocked(parent)
    _.recurseObject(aggObj, function (val, key, path) {
      var changePath = _.clone(path)
      var fromStartPath = _.clone(path)
      var fromEndPath = _.clone(path)

      changePath.pop()
      fromStartPath.pop()
      fromEndPath.pop()

      changePath.push(key + 'Change')
      fromStartPath.push(key + 'ChangeFromStart')
      fromEndPath.push(key + 'ChangeFromEnd')

      var start = _.get(query.data[0].value, path, defaultNull)
      var end = _.get(query.data[query.data.length - 1].value, path, defaultNull)

      _.forEach(query.data, function (record, i) {
        var previous = query.data[i - 1] || query.data[0]
        _.set(query.data[i].value, changePath, _.get(record.value, path, defaultNull) - (previous ? _.get(previous.value, path, defaultNull) : defaultNull))
        _.set(query.data[i].value, fromStartPath, _.get(record.value, path, defaultNull) - start)
        _.set(query.data[i].value, fromEndPath, _.get(record.value, path, defaultNull) - end)
      })
    })
  }
}

function cloneIfLocked(parent) {
  return parent.locked ? _.clone(parent.data) : parent.data
}

},{"./aggregation":1,"./lodash":9,"q":33}],11:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

Promise.serial = serial

var isPromiseLike = function (obj) {
  return obj && _.isFunction(obj.then)
}

function serial(tasks) {
  // Fake a "previous task" for our initial iteration
  var prevPromise
  var error = new Error()
  _.forEach(tasks, function (task, key) {
    var success = task.success || task
    var fail = task.fail
    var notify = task.notify
    var nextPromise

    // First task
    if (!prevPromise) { // eslint-disable-line no-negated-condition
      nextPromise = success()
      if (!isPromiseLike(nextPromise)) {
        error.message = 'Task ' + key + ' did not return a promise.'
        throw error
      }
    } else {
      // Wait until the previous promise has resolved or rejected to execute the next task
      nextPromise = prevPromise.then(
        /* success */
        function (data) {
          if (!success) {
            return data
          }
          var ret = success(data)
          if (!isPromiseLike(ret)) {
            error.message = 'Task ' + key + ' did not return a promise.'
            throw error
          }
          return ret
        },
        /* failure */
        function (reason) {
          if (!fail) {
            return Promise.reject(reason)
          }
          var ret = fail(reason)
          if (!isPromiseLike(ret)) {
            error.message = 'Fail for task ' + key + ' did not return a promise.'
            throw error
          }
          return ret
        },
        notify)
    }
    prevPromise = nextPromise
  })

  return prevPromise || Promise.when()
}

},{"./lodash":9,"q":33}],12:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  var reductiofy = require('./reductiofy')(service)
  var filters = require('./filters')(service)
  var postAggregation = require('./postAggregation')(service)

  var postAggregationMethods = _.keys(postAggregation)

  return function doQuery(queryObj) {
    var queryHash = JSON.stringify(queryObj)

    // Attempt to reuse an exact copy of this query that is present elsewhere
    for (var i = 0; i < service.columns.length; i++) {
      for (var j = 0; j < service.columns[i].queries.length; j++) {
        if (service.columns[i].queries[j].hash === queryHash) {
          return Promise.try(function () { // eslint-disable-line no-loop-func
            return service.columns[i].queries[j]
          })
        }
      }
    }

    var query = {
      // Original query passed in to query method
      original: queryObj,
      hash: queryHash
    }

    // Default queryObj
    if (_.isUndefined(query.original)) {
      query.original = {}
    }
    // Default select
    if (_.isUndefined(query.original.select)) {
      query.original.select = {
        $count: true
      }
    }
    // Default to groupAll
    query.original.groupBy = query.original.groupBy || true

    // Attach the query api to the query object
    query = newQueryObj(query)

    return createColumn(query)
      .then(makeCrossfilterGroup)
      .then(buildRequiredColumns)
      .then(setupDataListeners)
      .then(applyQuery)

    function createColumn(query) {
      // Ensure column is created
      return service.column({
        key: query.original.groupBy,
        type: _.isUndefined(query.type) ? null : query.type,
        array: Boolean(query.array)
      })
      .then(function () {
        // Attach the column to the query
        var column = service.column.find(query.original.groupBy)
        query.column = column
        column.queries.push(query)
        column.removeListeners.push(function () {
          return query.clear()
        })
        return query
      })
    }

    function makeCrossfilterGroup(query) {
      // Create the grouping on the columns dimension
      // Using Promise Resolve allows support for crossfilter async
      // TODO check if query already exists, and use the same base query // if possible
      return Promise.resolve(query.column.dimension.group())
        .then(function (g) {
          query.group = g
          return query
        })
    }

    function buildRequiredColumns(query) {
      var requiredColumns = filters.scanForDynamicFilters(query.original)
        // We need to scan the group for any filters that would require
        // the group to be rebuilt when data is added or removed in any way.
      if (requiredColumns.length) {
        return Promise.all(_.map(requiredColumns, function (columnKey) {
          return service.column({
            key: columnKey,
            dynamicReference: query.group
          })
        }))
        .then(function () {
          return query
        })
      }
      return query
    }

    function setupDataListeners(query) {
      // Here, we create a listener to recreate and apply the reducer to
      // the group anytime underlying data changes
      var stopDataListen = service.onDataChange(function () {
        return applyQuery(query)
      })
      query.removeListeners.push(stopDataListen)

      // This is a similar listener for filtering which will (if needed)
      // run any post aggregations on the data after each filter action
      var stopFilterListen = service.onFilter(function () {
        return postAggregate(query)
      })
      query.removeListeners.push(stopFilterListen)

      return query
    }

    function applyQuery(query) {
      return buildReducer(query)
        .then(applyReducer)
        .then(attachData)
        .then(postAggregate)
    }

    function buildReducer(query) {
      return reductiofy(query.original)
        .then(function (reducer) {
          query.reducer = reducer
          return query
        })
    }

    function applyReducer(query) {
      return Promise.resolve(query.reducer(query.group))
        .then(function () {
          return query
        })
    }

    function attachData(query) {
      return Promise.resolve(query.group.all())
        .then(function (data) {
          query.data = data
          return query
        })
    }

    function postAggregate(query) {
      if (query.postAggregations.length > 1) {
        // If the query is used by 2+ post aggregations, we need to lock
        // it against getting mutated by the post-aggregations
        query.locked = true
      }
      return Promise.all(_.map(query.postAggregations, function (post) {
        return post()
      }))
      .then(function () {
        return query
      })
    }

    function newQueryObj(q, parent) {
      var locked = false
      if (!parent) {
        parent = q
        q = {}
        locked = true
      }

      // Assign the regular query properties
      _.assign(q, {
        // The Universe for continuous promise chaining
        universe: service,
        // Crossfilter instance
        crossfilter: service.cf,

        // parent Information
        parent: parent,
        column: parent.column,
        dimension: parent.dimension,
        group: parent.group,
        reducer: parent.reducer,
        original: parent.original,
        hash: parent.hash,

        // It's own removeListeners
        removeListeners: [],

        // It's own postAggregations
        postAggregations: [],

        // Data method
        locked: locked,
        lock: lock,
        unlock: unlock,
        // Disposal method
        clear: clearQuery,
      })

      _.forEach(postAggregationMethods, function (method) {
        q[method] = postAggregateMethodWrap(postAggregation[method])
      })

      return q

      function lock(set) {
        if (!_.isUndefined(set)) {
          q.locked = Boolean(set)
          return
        }
        q.locked = true
      }

      function unlock() {
        q.locked = false
      }

      function clearQuery() {
        _.forEach(q.removeListeners, function (l) {
          l()
        })
        return Promise.try(function () {
          return q.group.dispose()
        })
        .then(function () {
          q.column.queries.splice(q.column.queries.indexOf(q), 1)
          // Automatically recycle the column if there are no queries active on it
          if (!q.column.queries.length) {
            return service.clear(q.column.key)
          }
        })
        .then(function () {
          return service
        })
      }

      function postAggregateMethodWrap(postMethod) {
        return function () {
          var args = Array.prototype.slice.call(arguments)
          var sub = {}
          newQueryObj(sub, q)
          args.unshift(sub, q)

          q.postAggregations.push(function () {
            Promise.resolve(postMethod.apply(null, args))
              .then(postAggregateChildren)
          })

          return Promise.resolve(postMethod.apply(null, args))
            .then(postAggregateChildren)

          function postAggregateChildren() {
            return postAggregate(sub)
              .then(function () {
                return sub
              })
          }
        }
      }
    }
  }
}

},{"./filters":8,"./lodash":9,"./postAggregation":10,"./reductiofy":14,"q":33}],13:[function(require,module,exports){
'use strict'

// var _ = require('./lodash') // _ is defined but never used

module.exports = {
  shorthandLabels: {
    $count: 'count',
    $sum: 'sum',
    $avg: 'avg',
    $min: 'min',
    $max: 'max',
    $med: 'med',
    $sumSq: 'sumSq',
    $std: 'std',
  },
  aggregators: {
    $count: $count,
    $sum: $sum,
    $avg: $avg,
    $min: $min,
    $max: $max,
    $med: $med,
    $sumSq: $sumSq,
    $std: $std,
    $valueList: $valueList,
    $dataList: $dataList,
  }
}

// Aggregators

function $count(reducer/* , value */) {
  return reducer.count(true)
}

function $sum(reducer, value) {
  return reducer.sum(value)
}

function $avg(reducer, value) {
  return reducer.avg(value)
}

function $min(reducer, value) {
  return reducer.min(value)
}

function $max(reducer, value) {
  return reducer.max(value)
}

function $med(reducer, value) {
  return reducer.median(value)
}

function $sumSq(reducer, value) {
  return reducer.sumOfSq(value)
}

function $std(reducer, value) {
  return reducer.std(value)
}

function $valueList(reducer, value) {
  return reducer.valueList(value)
}

function $dataList(reducer/* , value */) {
  return reducer.dataList(true)
}

// TODO histograms
// TODO exceptions

},{}],14:[function(require,module,exports){
'use strict'

var reductio = require('reductio')

var _ = require('./lodash')
var rAggregators = require('./reductioAggregators')
// var expressions = require('./expressions')  // exporession is defined but never used
var aggregation = require('./aggregation')

module.exports = function (service) {
  var filters = require('./filters')(service)

  return function reductiofy(query) {
    var reducer = reductio()
    // var groupBy = query.groupBy // groupBy is defined but never used
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
        _.map(selects, function (val, key) {
          return {
            key: key,
            value: val
          }
        }),
        function (s) {
          if (rAggregators.aggregators[s.key]) {
            return 0
          }
          return 1
        })

      // dive into each key/value
      return _.forEach(sortedSelectKeyValue, function (s) {
        // Found a Reductio Aggregation
        if (rAggregators.aggregators[s.key]) {
          // Build the valueAccessorFunction
          var accessor = aggregation.makeValueAccessor(s.value)
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
  }
}

},{"./aggregation":1,"./filters":8,"./lodash":9,"./reductioAggregators":13,"reductio":54}],15:[function(require,module,exports){
'use strict'

require('./q.serial')

// var Promise = require('q')  // Promise is defined but never used
var _ = require('./lodash')

module.exports = universe

function universe(data, options) {
  var service = {
    options: _.assign({}, options),
    columns: [],
    filters: {},
    dataListeners: [],
    filterListeners: [],
  }

  var cf = require('./crossfilter')(service)
  var filters = require('./filters')(service)

  data = cf.generateColumns(data)

  return cf.build(data)
    .then(function (data) {
      service.cf = data
      return _.assign(service, {
        add: cf.add,
        remove: cf.remove,
        column: require('./column')(service),
        query: require('./query')(service),
        filter: filters.filter,
        filterAll: filters.filterAll,
        applyFilters: filters.applyFilters,
        clear: require('./clear')(service),
        destroy: require('./destroy')(service),
        onDataChange: onDataChange,
        onFilter: onFilter,
      })
    })

  function onDataChange(cb) {
    service.dataListeners.push(cb)
    return function () {
      service.dataListeners.splice(service.dataListeners.indexOf(cb), 1)
    }
  }

  function onFilter(cb) {
    service.filterListeners.push(cb)
    return function () {
      service.filterListeners.splice(service.filterListeners.indexOf(cb), 1)
    }
  }
}

},{"./clear":2,"./column":3,"./crossfilter":4,"./destroy":5,"./filters":8,"./lodash":9,"./q.serial":11,"./query":12}],16:[function(require,module,exports){
module.exports = require("./src/crossfilter").crossfilter;

},{"./src/crossfilter":20}],17:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "raw": "crossfilter2@1.4.0-alpha.6",
        "scope": null,
        "escapedName": "crossfilter2",
        "name": "crossfilter2",
        "rawSpec": "1.4.0-alpha.6",
        "spec": "1.4.0-alpha.6",
        "type": "version"
      },
      "/home/christophe/Programming/Polymer/shared/bower_components_dev/universe"
    ]
  ],
  "_from": "crossfilter2@1.4.0-alpha.6",
  "_id": "crossfilter2@1.4.0-alpha.6",
  "_inCache": true,
  "_installable": true,
  "_location": "/crossfilter2",
  "_nodeVersion": "5.10.1",
  "_npmOperationalInternal": {
    "host": "packages-12-west.internal.npmjs.com",
    "tmp": "tmp/crossfilter2-1.4.0-alpha.6.tgz_1463519571786_0.49269671249203384"
  },
  "_npmUser": {
    "name": "esjewett",
    "email": "esjewett@gmail.com"
  },
  "_npmVersion": "3.8.3",
  "_phantomChildren": {},
  "_requested": {
    "raw": "crossfilter2@1.4.0-alpha.6",
    "scope": null,
    "escapedName": "crossfilter2",
    "name": "crossfilter2",
    "rawSpec": "1.4.0-alpha.6",
    "spec": "1.4.0-alpha.6",
    "type": "version"
  },
  "_requiredBy": [
    "/",
    "/reductio"
  ],
  "_resolved": "https://registry.npmjs.org/crossfilter2/-/crossfilter2-1.4.0-alpha.6.tgz",
  "_shasum": "f0197c6fab2d6a583b51254bfc6357093f80521b",
  "_shrinkwrap": null,
  "_spec": "crossfilter2@1.4.0-alpha.6",
  "_where": "/home/christophe/Programming/Polymer/shared/bower_components_dev/universe",
  "author": {
    "name": "Mike Bostock",
    "url": "http://bost.ocks.org/mike"
  },
  "bugs": {
    "url": "https://github.com/crossfilter/crossfilter/issues"
  },
  "contributors": [
    {
      "name": "Jason Davies",
      "url": "http://www.jasondavies.com/"
    }
  ],
  "dependencies": {
    "lodash.result": "^4.4.0"
  },
  "description": "Fast multidimensional filtering for coordinated views.",
  "devDependencies": {
    "browserify": "^13.0.0",
    "d3": "3.5",
    "package-json-versionify": "1.0.2",
    "uglify-js": "2.4.0",
    "vows": "0.7.0"
  },
  "directories": {},
  "dist": {
    "shasum": "f0197c6fab2d6a583b51254bfc6357093f80521b",
    "tarball": "https://registry.npmjs.org/crossfilter2/-/crossfilter2-1.4.0-alpha.6.tgz"
  },
  "files": [
    "src",
    "index.js",
    "crossfilter.js",
    "crossfilter.min.js"
  ],
  "gitHead": "509a96798f5153a58d1b6cae5fb3e7893129ce7c",
  "homepage": "http://crossfilter.github.com/crossfilter/",
  "keywords": [
    "analytics",
    "visualization",
    "crossfilter"
  ],
  "main": "./index.js",
  "maintainers": [
    {
      "name": "esjewett",
      "email": "esjewett@gmail.com"
    },
    {
      "name": "gordonwoodhull",
      "email": "gordon@woodhull.com"
    },
    {
      "name": "tannerlinsley",
      "email": "tannerlinsley@gmail.com"
    }
  ],
  "name": "crossfilter2",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/crossfilter/crossfilter.git"
  },
  "scripts": {
    "benchmark": "node test/benchmark.js",
    "build": "browserify index.js -t package-json-versionify --standalone crossfilter -o crossfilter.js && uglifyjs --compress --mangle --screw-ie8 crossfilter.js -o crossfilter.min.js",
    "clean": "rm -f crossfilter.js crossfilter.min.js",
    "test": "vows --verbose"
  },
  "version": "1.4.0-alpha.6"
}

},{}],18:[function(require,module,exports){
if (typeof Uint8Array !== "undefined") {
  crossfilter_array8 = function(n) { return new Uint8Array(n); };
  crossfilter_array16 = function(n) { return new Uint16Array(n); };
  crossfilter_array32 = function(n) { return new Uint32Array(n); };

  crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  crossfilter_arrayWiden = function(array, width) {
    var copy;
    switch (width) {
      case 16: copy = crossfilter_array16(array.length); break;
      case 32: copy = crossfilter_array32(array.length); break;
      default: throw new Error("invalid array width!");
    }
    copy.set(array);
    return copy;
  };
}

function crossfilter_arrayUntyped(n) {
  var array = new Array(n), i = -1;
  while (++i < n) array[i] = 0;
  return array;
}

function crossfilter_arrayLengthenUntyped(array, length) {
  var n = array.length;
  while (n < length) array[n++] = 0;
  return array;
}

function crossfilter_arrayWidenUntyped(array, width) {
  if (width > 32) throw new Error("invalid array width!");
  return array;
}

// An arbitrarily-wide array of bitmasks
function crossfilter_bitarray(n) {
  this.length = n;
  this.subarrays = 1;
  this.width = 8;
  this.masks = {
    0: 0
  }

  this[0] = crossfilter_array8(n);
}

crossfilter_bitarray.prototype.lengthen = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    this[i] = crossfilter_arrayLengthen(this[i], n);
  }
  this.length = n;
};

// Reserve a new bit index in the array, returns {offset, one}
crossfilter_bitarray.prototype.add = function() {
  var m, w, one, i, len;

  for (i = 0, len = this.subarrays; i < len; ++i) {
    m = this.masks[i];
    w = this.width - (32 * i);
    one = ~m & -~m;

    if (w >= 32 && !one) {
      continue;
    }

    if (w < 32 && (one & (1 << w))) {
      // widen this subarray
      this[i] = crossfilter_arrayWiden(this[i], w <<= 1);
      this.width = 32 * i + w;
    }

    this.masks[i] |= one;

    return {
      offset: i,
      one: one
    };
  }

  // add a new subarray
  this[this.subarrays] = crossfilter_array8(this.length);
  this.masks[this.subarrays] = 1;
  this.width += 8;
  return {
    offset: this.subarrays++,
    one: 1
  };
};

// Copy record from index src to index dest
crossfilter_bitarray.prototype.copy = function(dest, src) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    this[i][dest] = this[i][src];
  }
};

// Truncate the array to the given length
crossfilter_bitarray.prototype.truncate = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    for (var j = this.length - 1; j >= n; j--) {
      this[i][j] = 0;
    }
    this[i].length = n;
  }
  this.length = n;
};

// Checks that all bits for the given index are 0
crossfilter_bitarray.prototype.zero = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n]) {
      return false;
    }
  }
  return true;
};

// Checks that all bits for the given index are 0 except for possibly one
crossfilter_bitarray.prototype.zeroExcept = function(n, offset, zero) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (i === offset ? this[i][n] & zero : this[i][n]) {
      return false;
    }
  }
  return true;
};

// Checks that all bits for the given indez are 0 except for the specified mask.
// The mask should be an array of the same size as the filter subarrays width.
crossfilter_bitarray.prototype.zeroExceptMask = function(n, mask) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n] & mask[i]) {
      return false;
    }
  }
  return true;
}

// Checks that only the specified bit is set for the given index
crossfilter_bitarray.prototype.only = function(n, offset, one) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n] != (i === offset ? one : 0)) {
      return false;
    }
  }
  return true;
};

// Checks that only the specified bit is set for the given index except for possibly one other
crossfilter_bitarray.prototype.onlyExcept = function(n, offset, zero, onlyOffset, onlyOne) {
  var mask;
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    mask = this[i][n];
    if (i === offset)
      mask &= zero;
    if (mask != (i === onlyOffset ? onlyOne : 0)) {
      return false;
    }
  }
  return true;
};

module.exports = {
  array8: crossfilter_arrayUntyped,
  array16: crossfilter_arrayUntyped,
  array32: crossfilter_arrayUntyped,
  arrayLengthen: crossfilter_arrayLengthenUntyped,
  arrayWiden: crossfilter_arrayWidenUntyped,
  bitarray: crossfilter_bitarray
};

},{}],19:[function(require,module,exports){
var crossfilter_identity = require('./identity');

function bisect_by(f) {

  // Locate the insertion point for x in a to maintain sorted order. The
  // arguments lo and hi may be used to specify a subset of the array which
  // should be considered; by default the entire array is used. If x is already
  // present in a, the insertion point will be before (to the left of) any
  // existing entries. The return value is suitable for use as the first
  // argument to `array.splice` assuming that a is already sorted.
  //
  // The returned insertion point i partitions the array a into two halves so
  // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
  // a[i:hi] for the right side.
  function bisectLeft(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (f(a[mid]) < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Similar to bisectLeft, but returns an insertion point which comes after (to
  // the right of) any existing entries of x in a.
  //
  // The returned insertion point i partitions the array into two halves so that
  // all v <= x for v in a[lo:i] for the left side and all v > x for v in
  // a[i:hi] for the right side.
  function bisectRight(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (x < f(a[mid])) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  bisectRight.right = bisectRight;
  bisectRight.left = bisectLeft;
  return bisectRight;
}

module.exports = bisect_by(crossfilter_identity);
module.exports.by = bisect_by; // assign the raw function to the export as well

},{"./identity":24}],20:[function(require,module,exports){
var xfilterArray = require('./array');
var xfilterFilter = require('./filter');
var crossfilter_identity = require('./identity');
var crossfilter_null = require('./null');
var crossfilter_zero = require('./zero');
var xfilterHeapselect = require('./heapselect');
var xfilterHeap = require('./heap');
var bisect = require('./bisect');
var insertionsort = require('./insertionsort');
var permute = require('./permute');
var quicksort = require('./quicksort');
var xfilterReduce = require('./reduce');
var packageJson = require('./../package.json'); // require own package.json for the version field
var result = require('lodash.result');
// expose API exports
exports.crossfilter = crossfilter;
exports.crossfilter.heap = xfilterHeap;
exports.crossfilter.heapselect = xfilterHeapselect;
exports.crossfilter.bisect = bisect;
exports.crossfilter.insertionsort = insertionsort;
exports.crossfilter.permute = permute;
exports.crossfilter.quicksort = quicksort;
exports.crossfilter.version = packageJson.version; // please note use of "package-json-versionify" transform

function crossfilter() {
  var crossfilter = {
    add: add,
    remove: removeData,
    dimension: dimension,
    groupAll: groupAll,
    size: size,
    all: all,
    onChange: onChange,
    isElementFiltered: isElementFiltered,
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      filters, // 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = [], // when data is removed
      callbacks = [];

  filters = new xfilterArray.bitarray(0);

  // Adds the specified new records to this crossfilter.
  function add(newData) {
    var n0 = n,
        n1 = newData.length;

    // If there's actually new data to add…
    // Merge the new data into the existing data.
    // Lengthen the filter bitset to handle the new records.
    // Notify listeners (dimensions and groups) that new data is available.
    if (n1) {
      data = data.concat(newData);
      filters.lengthen(n += n1);
      dataListeners.forEach(function(l) { l(newData, n0, n1); });
      triggerOnChange('dataAdded');
    }

    return crossfilter;
  }

  // Removes all records that match the current filters.
  function removeData() {
    var newIndex = crossfilter_index(n, n),
        removed = [];
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) newIndex[i] = j++;
      else removed.push(i);
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(-1, -1, [], removed, true); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) {
        if (i !== j) filters.copy(j, i), data[j] = data[i];
        ++j;
      }
    }

    data.length = n = j;
    filters.truncate(j);
    triggerOnChange('dataRemoved');
  }

  // Return true if the data element at index i is filtered IN.
  // Optionally, ignore the filters of any dimensions in the ignore_dimensions list.
  function isElementFiltered(i, ignore_dimensions) {
    var n,
        d,
        id,
        len,
        mask = Array(filters.subarrays);
    for (n = 0; n < filters.subarrays; n++) { mask[n] = ~0; }
    if (ignore_dimensions) {
      for (d = 0, len = ignore_dimensions.length; d < len; d++) {
        // The top bits of the ID are the subarray offset and the lower bits are the bit
        // offset of the "one" mask.
        id = ignore_dimensions[d].id();
        mask[id >> 7] &= ~(0x1 << (id & 0x3f));
      }
    }
    return filters.zeroExceptMask(i,mask);
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value, iterable) {

    if (typeof value === 'string') {
      var accessorPath = value;
      value = function(d) { return result(d, accessorPath); };
    }

    var dimension = {
      filter: filter,
      filterExact: filterExact,
      filterRange: filterRange,
      filterFunction: filterFunction,
      filterAll: filterAll,
      top: top,
      bottom: bottom,
      group: group,
      groupAll: groupAll,
      dispose: dispose,
      remove: dispose, // for backwards-compatibility
      accessor: value,
      id: function() { return id; }
    };

    var one, // lowest unset bit as mask, e.g., 00001000
        zero, // inverted one, e.g., 11110111
        offset, // offset into the filters arrays
        id, // unique ID for this dimension (reused when dimensions are disposed)
        values, // sorted, cached array
        index, // value rank ↦ object id
        oldValues, // temporary array storing previously-added values
        oldIndex, // temporary array storing previously-added index
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        iterablesIndexCount,
        newIterablesIndexCount,
        iterablesIndexFilterStatus,
        newIterablesIndexFilterStatus,
        oldIterablesIndexFilterStatus,
        iterablesEmptyRows,
        sort = quicksort.by(function(i) { return newValues[i]; }),
        refilter = xfilterFilter.filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0,
        t = 0;

    // Updating a dimension is a two-stage process. First, we must update the
    // associated filters for the newly-added records. Once all dimensions have
    // updated their filters, the groups are notified to update.
    dataListeners.unshift(preAdd);
    dataListeners.push(postAdd);

    removeDataListeners.push(removeData);

    // Add a new dimension in the filter bitmap and store the offset and bitmask.
    var tmp = filters.add();
    offset = tmp.offset;
    one = tmp.one;
    zero = ~one;

    // Create a unique ID for the dimension
    // IDs will be re-used if dimensions are disposed.
    // For internal use the ID is the subarray offset shifted left 7 bits or'd with the
    // bit offset of the set bit in the dimension's "one" mask.
    id = (offset << 7) | (Math.log(one) / Math.log(2));

    preAdd(data, 0, n);
    postAdd(data, 0, n);

    // Incorporates the specified new records into this dimension.
    // This function is responsible for updating filters, values, and index.
    function preAdd(newData, n0, n1) {

      if (iterable){
        // Count all the values
        t = 0;
        j = 0;
        k = [];

        for (i = 0; i < newData.length; i++) {
          for(j = 0, k = value(newData[i]); j < k.length; j++) {
            t++;
          }
        }

        newValues = [];
        newIterablesIndexCount = crossfilter_range(newData.length);
        newIterablesIndexFilterStatus = crossfilter_index(t,1);
        iterablesEmptyRows = [];
        var unsortedIndex = crossfilter_range(t);

        for (l = 0, i = 0; i < newData.length; i++) {
          k = value(newData[i])
          //
          if(!k.length){
            newIterablesIndexCount[i] = 0;
            iterablesEmptyRows.push(i);
            continue;
          }
          newIterablesIndexCount[i] = k.length
          for (j = 0; j < k.length; j++) {
            newValues.push(k[j]);
            unsortedIndex[l] = i;
            l++;
          }
        }

        // Create the Sort map used to sort both the values and the valueToData indices
        var sortMap = sort(crossfilter_range(t), 0, t);

        // Use the sortMap to sort the newValues
        newValues = permute(newValues, sortMap);


        // Use the sortMap to sort the unsortedIndex map
        // newIndex should be a map of sortedValue -> crossfilterData
        newIndex = permute(unsortedIndex, sortMap)

      } else{
        // Permute new values into natural order using a standard sorted index.
        newValues = newData.map(value);
        newIndex = sort(crossfilter_range(n1), 0, n1);
        newValues = permute(newValues, newIndex);
      }

      if(iterable) {
        n1 = t;
      }

      // Bisect newValues to determine which new records are selected.
      var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1];
      if (refilterFunction) {
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) {
            filters[offset][newIndex[i] + n0] |= one;
            if(iterable) newIterablesIndexFilterStatus[i] = 1;
          }
        }
      } else {
        for (i = 0; i < lo1; ++i) {
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
        }
        for (i = hi1; i < n1; ++i) {
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
        }
      }

      // If this dimension previously had no data, then we don't need to do the
      // more expensive merge operation; use the new values and index as-is.
      if (!n0) {
        values = newValues;
        index = newIndex;
        iterablesIndexCount = newIterablesIndexCount;
        iterablesIndexFilterStatus = newIterablesIndexFilterStatus;
        lo0 = lo1;
        hi0 = hi1;
        return;
      }



      var oldValues = values,
        oldIndex = index,
        oldIterablesIndexFilterStatus = iterablesIndexFilterStatus
        i0 = 0,
        i1 = 0;

      if(iterable){
        old_n0 = n0
        n0 = oldValues.length;
        n1 = t
      }

      // Otherwise, create new arrays into which to merge new and old.
      values = iterable ? new Array(n0 + n1) : new Array(n);
      index = iterable ? new Array(n0 + n1) : crossfilter_index(n, n);
      if(iterable) iterablesIndexFilterStatus = crossfilter_index(n0 + n1, 1);

      // Concatenate the newIterablesIndexCount onto the old one.
      if(iterable) {
        var oldiiclength = iterablesIndexCount.length;
        iterablesIndexCount = xfilterArray.arrayLengthen(iterablesIndexCount, n);
        for(var j=0; j+oldiiclength < n; j++) {
          iterablesIndexCount[j+oldiiclength] = newIterablesIndexCount[j];
        }
      }

      // Merge the old and new sorted values, and old and new index.
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
          index[i] = newIndex[i1++] + (iterable ? old_n0 : n0);
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
        index[i] = newIndex[i1] + (iterable ? old_n0 : n0);
      }

      // Bisect again to recompute lo0 and hi0.
      bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
    }

    // When all filters have updated, notify index listeners of the new values.
    function postAdd(newData, n0, n1) {
      indexListeners.forEach(function(l) { l(newValues, newIndex, n0, n1); });
      newValues = newIndex = null;
    }

    function removeData(reIndex) {
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (!filters.zero(k = index[i])) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[k];
          ++j;
        }
      }
      values.length = j;
      while (j < n) index[j++] = 0;

      // Bisect again to recompute lo0 and hi0.
      var bounds = refilter(values);
      lo0 = bounds[0], hi0 = bounds[1];
    }

    // Updates the selected values based on the specified bounds [lo, hi].
    // This implementation is used by all the public filter methods.
    function filterIndexBounds(bounds) {

      var lo1 = bounds[0],
          hi1 = bounds[1];

      if (refilterFunction) {
        refilterFunction = null;
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; }, bounds[0] === 0 && bounds[1] === index.length);
        lo0 = lo1;
        hi0 = hi1;
        return dimension;
      }

      var i,
          j,
          k,
          added = [],
          removed = [],
          valueIndexAdded = [],
          valueIndexRemoved = [];


      // Fast incremental update based on previous lo index.
      if (lo1 < lo0) {
        for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
          added.push(index[i]);
          valueIndexAdded.push(i);
        }
      } else if (lo1 > lo0) {
        for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
          removed.push(index[i]);
          valueIndexRemoved.push(i);
        }
      }

      // Fast incremental update based on previous hi index.
      if (hi1 > hi0) {
        for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
          added.push(index[i]);
          valueIndexAdded.push(i);
        }
      } else if (hi1 < hi0) {
        for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
          removed.push(index[i]);
          valueIndexRemoved.push(i);
        }
      }

      if(!iterable) {
        // Flip filters normally.

        for(i=0; i<added.length; i++) {
          filters[offset][added[i]] ^= one;
        }

        for(i=0; i<removed.length; i++) {
          filters[offset][removed[i]] ^= one;
        }

      } else {
        // For iterables, we need to figure out if the row has been completely removed vs partially included
        // Only count a row as added if it is not already being aggregated. Only count a row
        // as removed if the last element being aggregated is removed.

        var newAdded = [];
        var newRemoved = [];
        for (i = 0; i < added.length; i++) {
          iterablesIndexCount[added[i]]++
          iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
          if(iterablesIndexCount[added[i]] === 1) {
            filters[offset][added[i]] ^= one;
            newAdded.push(added[i]);
          }
        }
        for (i = 0; i < removed.length; i++) {
          iterablesIndexCount[removed[i]]--
          iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
          if(iterablesIndexCount[removed[i]] === 0) {
            filters[offset][removed[i]] ^= one;
            newRemoved.push(removed[i]);
          }
        }

        added = newAdded;
        removed = newRemoved;

        // Now handle empty rows.
        if(bounds[0] === 0 && bounds[1] === index.length) {
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was not in the filter, so set the filter and add
              filters[offset][k] ^= one;
              added.push(k);
            }
          }
        } else {
          // filter in place - remove empty rows if necessary
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was in the filter, so set the filter and remove
              filters[offset][k] ^= one;
              removed.push(k);
            }
          }
        }
      }

      lo0 = lo1;
      hi0 = hi1;
      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
      triggerOnChange('filtered');
      return dimension;
    }

    // Filters this dimension using the specified range, value, or null.
    // If the range is null, this is equivalent to filterAll.
    // If the range is an array, this is equivalent to filterRange.
    // Otherwise, this is equivalent to filterExact.
    function filter(range) {
      return range == null
          ? filterAll() : Array.isArray(range)
          ? filterRange(range) : typeof range === "function"
          ? filterFunction(range)
          : filterExact(range);
    }

    // Filters this dimension to select the exact value.
    function filterExact(value) {
      return filterIndexBounds((refilter = xfilterFilter.filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      return filterIndexBounds((refilter = xfilterFilter.filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      return filterIndexBounds((refilter = xfilterFilter.filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      refilterFunction = f;
      refilter = xfilterFilter.filterAll;

      filterIndexFunction(f, false);

      lo0 = 0;
      hi0 = n;

      return dimension;
    }

    function filterIndexFunction(f, filterAll) {
      var i,
          k,
          x,
          added = [],
          removed = [],
          valueIndexAdded = [],
          valueIndexRemoved = [],
          indexLength = index.length;

      if(!iterable) {
        for (i = 0; i < indexLength; ++i) {
          if (!(filters[offset][k = index[i]] & one) ^ !!(x = f(values[i], i))) {
            if (x) added.push(k);
            else removed.push(k);
          }
        }
      }

      if(iterable) {
        for(i=0; i < indexLength; ++i) {
          if(f(values[i], i)) {
            added.push(index[i]);
            valueIndexAdded.push(i);
          } else {
            removed.push(index[i]);
            valueIndexRemoved.push(i);
          }
        }
      }

      if(!iterable) {
        for(i=0; i<added.length; i++) {
          if(filters[offset][added[i]] & one) filters[offset][added[i]] &= zero;
        }

        for(i=0; i<removed.length; i++) {
          if(!(filters[offset][removed[i]] & one)) filters[offset][removed[i]] |= one;
        }
      } else {

        var newAdded = [];
        var newRemoved = [];
        for (i = 0; i < added.length; i++) {
          // First check this particular value needs to be added
          if(iterablesIndexFilterStatus[valueIndexAdded[i]] === 1) {
            iterablesIndexCount[added[i]]++
            iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
            if(iterablesIndexCount[added[i]] === 1) {
              filters[offset][added[i]] ^= one;
              newAdded.push(added[i]);
            }
          }
        }
        for (i = 0; i < removed.length; i++) {
          // First check this particular value needs to be removed
          if(iterablesIndexFilterStatus[valueIndexRemoved[i]] === 0) {
            iterablesIndexCount[removed[i]]--
            iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
            if(iterablesIndexCount[removed[i]] === 0) {
              filters[offset][removed[i]] ^= one;
              newRemoved.push(removed[i]);
            }
          }
        }

        added = newAdded;
        removed = newRemoved;

        // Now handle empty rows.
        if(filterAll) {
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was not in the filter, so set the filter and add
              filters[offset][k] ^= one;
              added.push(k);
            }
          }
        } else {
          // filter in place - remove empty rows if necessary
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was in the filter, so set the filter and remove
              filters[offset][k] ^= one;
              removed.push(k);
            }
          }
        }
      }

      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
      triggerOnChange('filtered');
    }

    // Returns the top K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function top(k, top_offset) {
      var array = [],
          i = hi0,
          j,
          toSkip = 0;

      if(top_offset && top_offset > 0) toSkip = top_offset;

      while (--i >= lo0 && k > 0) {
        if (filters.zero(j = index[i])) {
          if(toSkip > 0) {
            //skip matching row
            --toSkip;
          } else {
            array.push(data[j]);
            --k;
          }
        }
      }

      if(iterable){
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          // Add row with empty iterable column at the end
          if(filters.zero(j = iterablesEmptyRows[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
        }
      }

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k, bottom_offset) {
      var array = [],
          i,
          j,
          toSkip = 0;

      if(bottom_offset && bottom_offset > 0) toSkip = bottom_offset;

      if(iterable) {
        // Add row with empty iterable column at the top
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          if(filters.zero(j = iterablesEmptyRows[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
        }
      }

      i = lo0;

      while (i < hi0 && k > 0) {
        if (filters.zero(j = index[i])) {
          if(toSkip > 0) {
            //skip matching row
            --toSkip;
          } else {
            array.push(data[j]);
            --k;
          }
        }
        i++;
      }

      return array;
    }

    // Adds a new group to this dimension, using the specified key function.
    function group(key) {
      var group = {
        top: top,
        all: all,
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        order: order,
        orderNatural: orderNatural,
        size: size,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      // Ensure that this group will be removed when the dimension is removed.
      dimensionGroups.push(group);

      var groups, // array of {key, value}
          groupIndex, // object id ↦ group id
          groupWidth = 8,
          groupCapacity = crossfilter_capacity(groupWidth),
          k = 0, // cardinality
          select,
          heap,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          update = crossfilter_null,
          reset = crossfilter_null,
          resetNeeded = true,
          groupAll = key === crossfilter_null;

      if (arguments.length < 1) key = crossfilter_identity;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the associated reduce values. It must also listen to
      // the parent dimension for when data is added, and compute new keys.
      filterListeners.push(update);
      indexListeners.push(add);
      removeDataListeners.push(removeData);

      // Incorporate any existing data into the grouping.
      add(values, index, 0, n);

      // Incorporates the specified new values into this group.
      // This function is responsible for updating groups and groupIndex.
      function add(newValues, newIndex, n0, n1) {

        if(iterable) {
          n0old = n0
          n0 = values.length - newValues.length
          n1 = newValues.length;
        }

        var oldGroups = groups,
            reIndex = iterable ? [] : crossfilter_index(k, groupCapacity),
            add = reduceAdd,
            remove = reduceRemove,
            initial = reduceInitial,
            k0 = k, // old cardinality
            i0 = 0, // index of old group
            i1 = 0, // index of new record
            j, // object id
            g0, // old group
            x0, // old key
            x1, // new key
            g, // group to add
            x; // key of group to add

        // If a reset is needed, we don't need to update the reduce values.
        if (resetNeeded) add = initial = crossfilter_null;
        if (resetNeeded) remove = initial = crossfilter_null;

        // Reset the new groups (k is a lower bound).
        // Also, make sure that groupIndex exists and is long enough.
        groups = new Array(k), k = 0;
        if(iterable){
          groupIndex = k0 > 1 ? groupIndex : [];
        }
        else{
          groupIndex = k0 > 1 ? xfilterArray.arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);
        }


        // Get the first old key (x0 of g0), if it exists.
        if (k0) x0 = (g0 = oldGroups[0]).key;

        // Find the first new key (x1), skipping NaN keys.
        while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) ++i1;

        // While new keys remain…
        while (i1 < n1) {

          // Determine the lesser of the two current keys; new and old.
          // If there are no old keys remaining, then always add the new key.
          if (g0 && x0 <= x1) {
            g = g0, x = x0;

            // Record the new index of the old group.
            reIndex[i0] = k;

            // Retrieve the next old key.
            if (g0 = oldGroups[++i0]) x0 = g0.key;
          } else {
            g = {key: x1, value: initial()}, x = x1;
          }

          // Add the lesser group.
          groups[k] = g;

          // Add any selected records belonging to the added group, while
          // advancing the new key and populating the associated group index.

          while (x1 <= x) {
            j = newIndex[i1] + (iterable ? n0old : n0)


            if(iterable){
              if(groupIndex[j]){
                groupIndex[j].push(k)
              }
              else{
                groupIndex[j] = [k]
              }
            }
            else{
              groupIndex[j] = k;
            }

            // Always add new values to groups. Only remove when not in filter.
            // This gives groups full information on data life-cycle.
            g.value = add(g.value, data[j], true);
            if (!filters.zeroExcept(j, offset, zero)) g.value = remove(g.value, data[j], false);
            if (++i1 >= n1) break;
            x1 = key(newValues[i1]);
          }

          groupIncrement();
        }

        // Add any remaining old groups that were greater th1an all new keys.
        // No incremental reduce is needed; these groups have no new records.
        // Also record the new index of the old group.
        while (i0 < k0) {
          groups[reIndex[i0] = k] = oldGroups[i0++];
          groupIncrement();
        }


        // Fill in gaps with empty arrays where there may have been rows with empty iterables
        if(iterable){
          for (i = 0; i < n; i++) {
            if(!groupIndex[i]){
              groupIndex[i] = []
            }
          }
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if(k > i0){
          if(iterable){
            groupIndex = permute(groupIndex, reIndex, true)
          }
          else{
            for (i0 = 0; i0 < n0; ++i0) {
              groupIndex[i0] = reIndex[groupIndex[i0]];
            }
          }
        }

        // Modify the update and reset behavior based on the cardinality.
        // If the cardinality is less than or equal to one, then the groupIndex
        // is not needed. If the cardinality is zero, then there are no records
        // and therefore no groups to update or reset. Note that we also must
        // change the registered listener to point to the new method.
        j = filterListeners.indexOf(update);
        if (k > 1) {
          update = updateMany;
          reset = resetMany;
        } else {
          if (!k && groupAll) {
            k = 1;
            groups = [{key: null, value: initial()}];
          }
          if (k === 1) {
            update = updateOne;
            reset = resetOne;
          } else {
            update = crossfilter_null;
            reset = crossfilter_null;
          }
          groupIndex = null;
        }
        filterListeners[j] = update;

        // Count the number of added groups,
        // and widen the group index as needed.
        function groupIncrement() {
          if(iterable){
            k++
            return
          }
          if (++k === groupCapacity) {
            reIndex = xfilterArray.arrayWiden(reIndex, groupWidth <<= 1);
            groupIndex = xfilterArray.arrayWiden(groupIndex, groupWidth);
            groupCapacity = crossfilter_capacity(groupWidth);
          }
        }
      }

      function removeData() {
        if (k > 1) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK);

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          for (var i = 0, j = 0; i < n; ++i) {
            if (!filters.zero(i)) {
              seenGroups[groupIndex[j] = groupIndex[i]] = 1;
              ++j;
            }
          }

          // Reassemble groups including only those groups that were referred
          // to by matching group index entries.  Note the new group index in
          // seenGroups.
          groups = [], k = 0;
          for (i = 0; i < oldK; ++i) {
            if (seenGroups[i]) {
              seenGroups[i] = k++;
              groups.push(oldGroups[i]);
            }
          }

          if (k > 1) {
            // Reindex the group index using seenGroups to find the new index.
            for (var i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var i = 0; i < n; ++i) if (!filters.zero(i)) return;
          groups = [], k = 0;
          filterListeners[filterListeners.indexOf(update)] =
          update = reset = crossfilter_null;
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is greater than 1.
      // notFilter indicates a crossfilter.add/remove operation.
      function updateMany(filterOne, filterOffset, added, removed, notFilter) {

        if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

        var i,
            j,
            k,
            n,
            g;

        if(iterable){
          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (filters.zeroExcept(k = added[i], offset, zero)) {
              for (j = 0; j < groupIndex[k].length; j++) {
                g = groups[groupIndex[k][j]];
                g.value = reduceAdd(g.value, data[k], false, j);
              }
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
              for (j = 0; j < groupIndex[k].length; j++) {
                g = groups[groupIndex[k][j]];
                g.value = reduceRemove(g.value, data[k], notFilter, j);
              }
            }
          }
          return;
        }

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zeroExcept(k = added[i], offset, zero)) {
            g = groups[groupIndex[k]];
            g.value = reduceAdd(g.value, data[k], false);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
            g = groups[groupIndex[k]];
            g.value = reduceRemove(g.value, data[k], notFilter);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is 1.
      // notFilter indicates a crossfilter.add/remove operation.
      function updateOne(filterOne, filterOffset, added, removed, notFilter) {
        if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

        var i,
            k,
            n,
            g = groups[0];

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zeroExcept(k = added[i], offset, zero)) {
            g.value = reduceAdd(g.value, data[k], false);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
            g.value = reduceRemove(g.value, data[k], notFilter);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is greater than 1.
      function resetMany() {
        var i,
            j,
            g;

        // Reset all group values.
        for (i = 0; i < k; ++i) {
          groups[i].value = reduceInitial();
        }

        // We add all records and then remove filtered records so that reducers
        // can build an 'unfiltered' view even if there are already filters in
        // place on other dimensions.
        if(iterable){
          for (i = 0; i < n; ++i) {
            for (j = 0; j < groupIndex[i].length; j++) {
              g = groups[groupIndex[i][j]];
              g.value = reduceAdd(g.value, data[i], true, j);
            }
          }
          for (i = 0; i < n; ++i) {
            if (!filters.zeroExcept(i, offset, zero)) {
              for (j = 0; j < groupIndex[i].length; j++) {
                g = groups[groupIndex[i][j]];
                g.value = reduceRemove(g.value, data[i], false, j);
              }
            }
          }
          return;
        }

        for (i = 0; i < n; ++i) {
          g = groups[groupIndex[i]];
          g.value = reduceAdd(g.value, data[i], true);
        }
        for (i = 0; i < n; ++i) {
          if (!filters.zeroExcept(i, offset, zero)) {
            g = groups[groupIndex[i]];
            g.value = reduceRemove(g.value, data[i], false);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is 1.
      function resetOne() {
        var i,
            g = groups[0];

        // Reset the singleton group values.
        g.value = reduceInitial();

        // We add all records and then remove filtered records so that reducers
        // can build an 'unfiltered' view even if there are already filters in
        // place on other dimensions.
        for (i = 0; i < n; ++i) {
          g.value = reduceAdd(g.value, data[i], true);
        }

        for (i = 0; i < n; ++i) {
          if (!filters.zeroExcept(i, offset, zero)) {
            g.value = reduceRemove(g.value, data[i], false);
          }
        }
      }

      // Returns the array of group values, in the dimension's natural order.
      function all() {
        if (resetNeeded) reset(), resetNeeded = false;
        return groups;
      }

      // Returns a new array containing the top K group values, in reduce order.
      function top(k) {
        var top = select(all(), 0, groups.length, k);
        return heap.sort(top, 0, top.length);
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce values, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), crossfilter_zero);
      }

      // Sets the reduce order, using the specified accessor.
      function order(value) {
        select = xfilterHeapselect.by(valueOf);
        heap = xfilterHeap.by(valueOf);
        function valueOf(d) { return value(d.value); }
        return group;
      }

      // A convenience method for natural ordering by reduce value.
      function orderNatural() {
        return order(crossfilter_identity);
      }

      // Returns the cardinality of this group, irrespective of any filters.
      function size() {
        return k;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i, 1);
        i = indexListeners.indexOf(add);
        if (i >= 0) indexListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        return group;
      }

      return reduceCount().orderNatural();
    }

    // A convenience function for generating a singleton group.
    function groupAll() {
      var g = group(crossfilter_null), all = g.all;
      delete g.all;
      delete g.top;
      delete g.order;
      delete g.orderNatural;
      delete g.size;
      g.value = function() { return all()[0].value; };
      return g;
    }

    // Removes this dimension and associated groups and event listeners.
    function dispose() {
      dimensionGroups.forEach(function(group) { group.dispose(); });
      var i = dataListeners.indexOf(preAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = dataListeners.indexOf(postAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = removeDataListeners.indexOf(removeData);
      if (i >= 0) removeDataListeners.splice(i, 1);
      filters.masks[offset] &= zero;
      return filterAll();
    }

    return dimension;
  }

  // A convenience method for groupAll on a dummy dimension.
  // This implementation can be optimized since it always has cardinality 1.
  function groupAll() {
    var group = {
      reduce: reduce,
      reduceCount: reduceCount,
      reduceSum: reduceSum,
      value: value,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var reduceValue,
        reduceAdd,
        reduceRemove,
        reduceInitial,
        resetNeeded = true;

    // The group listens to the crossfilter for when any dimension changes, so
    // that it can update the reduce value. It must also listen to the parent
    // dimension for when data is added.
    filterListeners.push(update);
    dataListeners.push(add);

    // For consistency; actually a no-op since resetNeeded is true.
    add(data, 0, n);

    // Incorporates the specified new values into this group.
    function add(newData, n0) {
      var i;

      if (resetNeeded) return;

      // Cycle through all the values.
      for (i = n0; i < n; ++i) {

        // Add all values all the time.
        reduceValue = reduceAdd(reduceValue, data[i], true);

        // Remove the value if filtered.
        if (!filters.zero(i)) {
          reduceValue = reduceRemove(reduceValue, data[i], false);
        }
      }
    }

    // Reduces the specified selected or deselected records.
    function update(filterOne, filterOffset, added, removed, notFilter) {
      var i,
          k,
          n;

      if (resetNeeded) return;

      // Add the added values.
      for (i = 0, n = added.length; i < n; ++i) {
        if (filters.zero(k = added[i])) {
          reduceValue = reduceAdd(reduceValue, data[k], notFilter);
        }
      }

      // Remove the removed values.
      for (i = 0, n = removed.length; i < n; ++i) {
        if (filters.only(k = removed[i], filterOffset, filterOne)) {
          reduceValue = reduceRemove(reduceValue, data[k], notFilter);
        }
      }
    }

    // Recomputes the group reduce value from scratch.
    function reset() {
      var i;

      reduceValue = reduceInitial();

      // Cycle through all the values.
      for (i = 0; i < n; ++i) {

        // Add all values all the time.
        reduceValue = reduceAdd(reduceValue, data[i], true);

        // Remove the value if it is filtered.
        if (!filters.zero(i)) {
          reduceValue = reduceRemove(reduceValue, data[i], false);
        }
      }
    }

    // Sets the reduce behavior for this group to use the specified functions.
    // This method lazily recomputes the reduce value, waiting until needed.
    function reduce(add, remove, initial) {
      reduceAdd = add;
      reduceRemove = remove;
      reduceInitial = initial;
      resetNeeded = true;
      return group;
    }

    // A convenience method for reducing by count.
    function reduceCount() {
      return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, crossfilter_zero);
    }

    // A convenience method for reducing by sum(value).
    function reduceSum(value) {
      return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), crossfilter_zero);
    }

    // Returns the computed reduce value.
    function value() {
      if (resetNeeded) reset(), resetNeeded = false;
      return reduceValue;
    }

    // Removes this group and associated event listeners.
    function dispose() {
      var i = filterListeners.indexOf(update);
      if (i >= 0) filterListeners.splice(i);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i);
      return group;
    }

    return reduceCount();
  }

  // Returns the number of records in this crossfilter, irrespective of any filters.
  function size() {
    return n;
  }

  // Returns the raw row data contained in this crossfilter
  function all(){
    return data;
  }

  function onChange(cb){
    if(typeof cb !== 'function'){
      console.warn('onChange callback parameter must be a function!');
      return;
    }
    callbacks.push(cb);
    return function(){
      callbacks.splice(callbacks.indexOf(cb), 1);
    };
  }

  function triggerOnChange(eventName){
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i](eventName);
    }
  }

  return arguments.length
      ? add(arguments[0])
      : crossfilter;
}

// Returns an array of size n, big enough to store ids up to m.
function crossfilter_index(n, m) {
  return (m < 0x101
      ? xfilterArray.array8 : m < 0x10001
      ? xfilterArray.array16
      : xfilterArray.array32)(n);
}

// Constructs a new array of size n, with sequential values from 0 to n - 1.
function crossfilter_range(n) {
  var range = crossfilter_index(n, n);
  for (var i = -1; ++i < n;) range[i] = i;
  return range;
}

function crossfilter_capacity(w) {
  return w === 8
      ? 0x100 : w === 16
      ? 0x10000
      : 0x100000000;
}

},{"./../package.json":17,"./array":18,"./bisect":19,"./filter":21,"./heap":22,"./heapselect":23,"./identity":24,"./insertionsort":25,"./null":26,"./permute":27,"./quicksort":28,"./reduce":29,"./zero":30,"lodash.result":31}],21:[function(require,module,exports){
function crossfilter_filterExact(bisect, value) {
  return function(values) {
    var n = values.length;
    return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
  };
}

function crossfilter_filterRange(bisect, range) {
  var min = range[0],
      max = range[1];
  return function(values) {
    var n = values.length;
    return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
  };
}

function crossfilter_filterAll(values) {
  return [0, values.length];
}

module.exports = {
  filterExact: crossfilter_filterExact,
  filterRange: crossfilter_filterRange,
  filterAll: crossfilter_filterAll
};

},{}],22:[function(require,module,exports){
var crossfilter_identity = require('./identity');

function heap_by(f) {

  // Builds a binary heap within the specified array a[lo:hi]. The heap has the
  // property such that the parent a[lo+i] is always less than or equal to its
  // two children: a[lo+2*i+1] and a[lo+2*i+2].
  function heap(a, lo, hi) {
    var n = hi - lo,
        i = (n >>> 1) + 1;
    while (--i > 0) sift(a, i, n, lo);
    return a;
  }

  // Sorts the specified array a[lo:hi] in descending order, assuming it is
  // already a heap.
  function sort(a, lo, hi) {
    var n = hi - lo,
        t;
    while (--n > 0) t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
    return a;
  }

  // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
  // slice of array a[lo:lo+n]. This method can also be used to update the heap
  // incrementally, without incurring the full cost of reconstructing the heap.
  function sift(a, i, n, lo) {
    var d = a[--lo + i],
        x = f(d),
        child;
    while ((child = i << 1) <= n) {
      if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
      if (x <= f(a[lo + child])) break;
      a[lo + i] = a[lo + child];
      i = child;
    }
    a[lo + i] = d;
  }

  heap.sort = sort;
  return heap;
}

module.exports = heap_by(crossfilter_identity);
module.exports.by = heap_by;

},{"./identity":24}],23:[function(require,module,exports){
var crossfilter_identity = require('./identity');
var xFilterHeap = require('./heap');

function heapselect_by(f) {
  var heap = xFilterHeap.by(f);

  // Returns a new array containing the top k elements in the array a[lo:hi].
  // The returned array is not sorted, but maintains the heap property. If k is
  // greater than hi - lo, then fewer than k elements will be returned. The
  // order of elements in a is unchanged by this operation.
  function heapselect(a, lo, hi, k) {
    var queue = new Array(k = Math.min(hi - lo, k)),
        min,
        i,
        x,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (x = f(d = a[lo]) > min) {
          queue[0] = d;
          min = f(heap(queue, 0, k)[0]);
        }
      } while (++lo < hi);
    }

    return queue;
  }

  return heapselect;
}

module.exports = heapselect_by(crossfilter_identity);
module.exports.by = heapselect_by; // assign the raw function to the export as well

},{"./heap":22,"./identity":24}],24:[function(require,module,exports){
function crossfilter_identity(d) {
  return d;
}

module.exports = crossfilter_identity;

},{}],25:[function(require,module,exports){
var crossfilter_identity = require('./identity');

function insertionsort_by(f) {

  function insertionsort(a, lo, hi) {
    for (var i = lo + 1; i < hi; ++i) {
      for (var j = i, t = a[i], x = f(t); j > lo && f(a[j - 1]) > x; --j) {
        a[j] = a[j - 1];
      }
      a[j] = t;
    }
    return a;
  }

  return insertionsort;
}

module.exports = insertionsort_by(crossfilter_identity);
module.exports.by = insertionsort_by;

},{"./identity":24}],26:[function(require,module,exports){
function crossfilter_null() {
  return null;
}

module.exports = crossfilter_null;

},{}],27:[function(require,module,exports){
function permute(array, index, deep) {
  for (var i = 0, n = index.length, copy = deep ? JSON.parse(JSON.stringify(array)) : new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}

module.exports = permute;

},{}],28:[function(require,module,exports){
var crossfilter_identity = require('./identity');
var xFilterInsertionsort = require('./insertionsort');

// Algorithm designed by Vladimir Yaroslavskiy.
// Implementation based on the Dart project; see NOTICE and AUTHORS for details.

function quicksort_by(f) {
  var insertionsort = xFilterInsertionsort.by(f);

  function sort(a, lo, hi) {
    return (hi - lo < quicksort_sizeThreshold
        ? insertionsort
        : quicksort)(a, lo, hi);
  }

  function quicksort(a, lo, hi) {
    // Compute the two pivots by looking at 5 elements.
    var sixth = (hi - lo) / 6 | 0,
        i1 = lo + sixth,
        i5 = hi - 1 - sixth,
        i3 = lo + hi - 1 >> 1,  // The midpoint.
        i2 = i3 - sixth,
        i4 = i3 + sixth;

    var e1 = a[i1], x1 = f(e1),
        e2 = a[i2], x2 = f(e2),
        e3 = a[i3], x3 = f(e3),
        e4 = a[i4], x4 = f(e4),
        e5 = a[i5], x5 = f(e5);

    var t;

    // Sort the selected 5 elements using a sorting network.
    if (x1 > x2) t = e1, e1 = e2, e2 = t, t = x1, x1 = x2, x2 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;
    if (x1 > x3) t = e1, e1 = e3, e3 = t, t = x1, x1 = x3, x3 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x1 > x4) t = e1, e1 = e4, e4 = t, t = x1, x1 = x4, x4 = t;
    if (x3 > x4) t = e3, e3 = e4, e4 = t, t = x3, x3 = x4, x4 = t;
    if (x2 > x5) t = e2, e2 = e5, e5 = t, t = x2, x2 = x5, x5 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;

    var pivot1 = e2, pivotValue1 = x2,
        pivot2 = e4, pivotValue2 = x4;

    // e2 and e4 have been saved in the pivot variables. They will be written
    // back, once the partitioning is finished.
    a[i1] = e1;
    a[i2] = a[lo];
    a[i3] = e3;
    a[i4] = a[hi - 1];
    a[i5] = e5;

    var less = lo + 1,   // First element in the middle partition.
        great = hi - 2;  // Last element in the middle partition.

    // Note that for value comparison, <, <=, >= and > coerce to a primitive via
    // Object.prototype.valueOf; == and === do not, so in order to be consistent
    // with natural order (such as for Date objects), we must do two compares.
    var pivotsEqual = pivotValue1 <= pivotValue2 && pivotValue1 >= pivotValue2;
    if (pivotsEqual) {

      // Degenerated case where the partitioning becomes a dutch national flag
      // problem.
      //
      // [ |  < pivot  | == pivot | unpartitioned | > pivot  | ]
      //  ^             ^          ^             ^            ^
      // left         less         k           great         right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1) for x in ]left, less[ : x < pivot.
      //   2) for x in [less, k[ : x == pivot.
      //   3) for x in ]great, right[ : x > pivot.
      for (var k = less; k <= great; ++k) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else if (xk > pivotValue1) {

          // Find the first element <= pivot in the range [k - 1, great] and
          // put [:ek:] there. We know that such an element must exist:
          // When k == less, then el3 (which is equal to pivot) lies in the
          // interval. Otherwise a[k - 1] == pivot and the search stops at k-1.
          // Note that in the latter case invariant 2 will be violated for a
          // short amount of time. The invariant will be restored when the
          // pivots are put into their final positions.
          while (true) {
            var greatValue = f(a[great]);
            if (greatValue > pivotValue1) {
              great--;
              // This is the only location in the while-loop where a new
              // iteration is started.
              continue;
            } else if (greatValue < pivotValue1) {
              // Triple exchange.
              a[k] = a[less];
              a[less++] = a[great];
              a[great--] = ek;
              break;
            } else {
              a[k] = a[great];
              a[great--] = ek;
              // Note: if great < k then we will exit the outer loop and fix
              // invariant 2 (which we just violated).
              break;
            }
          }
        }
      }
    } else {

      // We partition the list into three parts:
      //  1. < pivot1
      //  2. >= pivot1 && <= pivot2
      //  3. > pivot2
      //
      // During the loop we have:
      // [ | < pivot1 | >= pivot1 && <= pivot2 | unpartitioned  | > pivot2  | ]
      //  ^            ^                        ^              ^             ^
      // left         less                     k              great        right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1. for x in ]left, less[ : x < pivot1
      //   2. for x in [less, k[ : pivot1 <= x && x <= pivot2
      //   3. for x in ]great, right[ : x > pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else {
          if (xk > pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue > pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] <= pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] >= pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // Move pivots into their final positions.
    // We shrunk the list from both sides (a[left] and a[right] have
    // meaningless values in them) and now we move elements from the first
    // and third partition into these locations so that we can store the
    // pivots.
    a[lo] = a[less - 1];
    a[less - 1] = pivot1;
    a[hi - 1] = a[great + 1];
    a[great + 1] = pivot2;

    // The list is now partitioned into three partitions:
    // [ < pivot1   | >= pivot1 && <= pivot2   |  > pivot2   ]
    //  ^            ^                        ^             ^
    // left         less                     great        right

    // Recursive descent. (Don't include the pivot values.)
    sort(a, lo, less - 1);
    sort(a, great + 2, hi);

    if (pivotsEqual) {
      // All elements in the second partition are equal to the pivot. No
      // need to sort them.
      return a;
    }

    // In theory it should be enough to call _doSort recursively on the second
    // partition.
    // The Android source however removes the pivot elements from the recursive
    // call if the second partition is too large (more than 2/3 of the list).
    if (less < i1 && great > i5) {
      var lessValue, greatValue;
      while ((lessValue = f(a[less])) <= pivotValue1 && lessValue >= pivotValue1) ++less;
      while ((greatValue = f(a[great])) <= pivotValue2 && greatValue >= pivotValue2) --great;

      // Copy paste of the previous 3-way partitioning with adaptions.
      //
      // We partition the list into three parts:
      //  1. == pivot1
      //  2. > pivot1 && < pivot2
      //  3. == pivot2
      //
      // During the loop we have:
      // [ == pivot1 | > pivot1 && < pivot2 | unpartitioned  | == pivot2 ]
      //              ^                      ^              ^
      //            less                     k              great
      //
      // Invariants:
      //   1. for x in [ *, less[ : x == pivot1
      //   2. for x in [less, k[ : pivot1 < x && x < pivot2
      //   3. for x in ]great, * ] : x == pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk <= pivotValue1 && xk >= pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          less++;
        } else {
          if (xk <= pivotValue2 && xk >= pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue <= pivotValue2 && greatValue >= pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] < pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] == pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // The second partition has now been cleared of pivot elements and looks
    // as follows:
    // [  *  |  > pivot1 && < pivot2  | * ]
    //        ^                      ^
    //       less                  great
    // Sort the second partition using recursive descent.

    // The second partition looks as follows:
    // [  *  |  >= pivot1 && <= pivot2  | * ]
    //        ^                        ^
    //       less                    great
    // Simply sort it by recursive descent.

    return sort(a, less, great + 1);
  }

  return sort;
}

var quicksort_sizeThreshold = 32;

module.exports = quicksort_by(crossfilter_identity);
module.exports.by = quicksort_by;

},{"./identity":24,"./insertionsort":25}],29:[function(require,module,exports){
function crossfilter_reduceIncrement(p) {
  return p + 1;
}

function crossfilter_reduceDecrement(p) {
  return p - 1;
}

function crossfilter_reduceAdd(f) {
  return function(p, v) {
    return p + +f(v);
  };
}

function crossfilter_reduceSubtract(f) {
  return function(p, v) {
    return p - f(v);
  };
}

module.exports = {
  reduceIncrement: crossfilter_reduceIncrement,
  reduceDecrement: crossfilter_reduceDecrement,
  reduceAdd: crossfilter_reduceAdd,
  reduceSubtract: crossfilter_reduceSubtract
};

},{}],30:[function(require,module,exports){
function crossfilter_zero() {
  return 0;
}

module.exports = crossfilter_zero;

},{}],31:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * This method is like `_.get` except that if the resolved value is a
 * function it's invoked with the `this` binding of its parent object and
 * its result is returned.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to resolve.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
 *
 * _.result(object, 'a[0].b.c1');
 * // => 3
 *
 * _.result(object, 'a[0].b.c2');
 * // => 4
 *
 * _.result(object, 'a[0].b.c3', 'default');
 * // => 'default'
 *
 * _.result(object, 'a[0].b.c3', _.constant('default'));
 * // => 'default'
 */
function result(object, path, defaultValue) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length;

  // Ensure the loop is entered when path is empty.
  if (!length) {
    object = undefined;
    length = 1;
  }
  while (++index < length) {
    var value = object == null ? undefined : object[toKey(path[index])];
    if (value === undefined) {
      index = length;
      value = defaultValue;
    }
    object = isFunction(value) ? value.call(object) : value;
  }
  return object;
}

module.exports = result;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],32:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],33:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))

},{"_process":32}],34:[function(require,module,exports){
var reductio_parameters = require('./parameters.js');

_assign = function assign(target) {
	if (target == null) {
		throw new TypeError('Cannot convert undefined or null to object');
	}

	var output = Object(target);
	for (var index = 1; index < arguments.length; ++index) {
		var source = arguments[index];
		if (source != null) {
			for (var nextKey in source) {
				if(source.hasOwnProperty(nextKey)) {
					output[nextKey] = source[nextKey];
				}
			}
		}
	}
	return output;
};

function accessor_build(obj, p) {
	// obj.order = function(value) {
	// 	if (!arguments.length) return p.order;
	// 	p.order = value;
	// 	return obj;
	// };

	// Converts a string to an accessor function
	function accessorify(v) {
		if( typeof v === 'string' ) {
			// Rewrite to a function
			var tempValue = v;
			var func = function (d) { return d[tempValue]; }
			return func;
		} else {
			return v;
		}
	}

	// Converts a string to an accessor function
	function accessorifyNumeric(v) {
		if( typeof v === 'string' ) {
			// Rewrite to a function
			var tempValue = v;
			var func = function (d) { return +d[tempValue]; }
			return func;
		} else {
			return v;
		}
	}

	obj.fromObject = function(value) {
		if(!arguments.length) return p;
		_assign(p, value);
		return obj;
	};

	obj.toObject = function() {
		return p;
	};

	obj.count = function(value, propName) {
		if (!arguments.length) return p.count;
    if (!propName) {
      propName = 'count';
    }
		p.count = propName;
		return obj;
	};

	obj.sum = function(value) {
		if (!arguments.length) return p.sum;

		value = accessorifyNumeric(value);

		p.sum = value;
		return obj;
	};

	obj.avg = function(value) {
		if (!arguments.length) return p.avg;

		value = accessorifyNumeric(value);

		// We can take an accessor function, a boolean, or a string
		if( typeof value === 'function' ) {
			if(p.sum && p.sum !== value) console.warn('SUM aggregation is being overwritten by AVG aggregation');
			p.sum = value;
			p.avg = true;
			p.count = 'count';
		} else {
			p.avg = value;
		}
		return obj;
	};

	obj.exception = function(value) {
		if (!arguments.length) return p.exceptionAccessor;

		value = accessorify(value);

		p.exceptionAccessor = value;
		return obj;
	};

	obj.filter = function(value) {
		if (!arguments.length) return p.filter;
		p.filter = value;
		return obj;
	};

	obj.valueList = function(value) {
		if (!arguments.length) return p.valueList;

		value = accessorify(value);

		p.valueList = value;
		return obj;
	};

	obj.median = function(value) {
		if (!arguments.length) return p.median;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by median aggregation');
			p.valueList = value;
		}
		p.median = value;
		return obj;
	};

	obj.min = function(value) {
		if (!arguments.length) return p.min;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by min aggregation');
			p.valueList = value;
		}
		p.min = value;
		return obj;
	};

	obj.max = function(value) {
		if (!arguments.length) return p.max;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by max aggregation');
			p.valueList = value;
		}
		p.max = value;
		return obj;
	};

	obj.exceptionCount = function(value) {
		if (!arguments.length) return p.exceptionCount;

		value = accessorify(value);

		if( typeof value === 'function' ) {
			if(p.exceptionAccessor && p.exceptionAccessor !== value) console.warn('EXCEPTION accessor is being overwritten by exception count aggregation');
			p.exceptionAccessor = value;
			p.exceptionCount = true;
		} else {
			p.exceptionCount = value;
		}
		return obj;
	};

	obj.exceptionSum = function(value) {
		if (!arguments.length) return p.exceptionSum;

		value = accessorifyNumeric(value);

		p.exceptionSum = value;
		return obj;
	};

	obj.histogramValue = function(value) {
		if (!arguments.length) return p.histogramValue;

		value = accessorifyNumeric(value);

		p.histogramValue = value;
		return obj;
	};

	obj.histogramBins = function(value) {
		if (!arguments.length) return p.histogramThresholds;
		p.histogramThresholds = value;
		return obj;
	};

	obj.std = function(value) {
		if (!arguments.length) return p.std;

		value = accessorifyNumeric(value);

		if(typeof(value) === 'function') {
			p.sumOfSquares = value;
			p.sum = value;
			p.count = 'count';
			p.std = true;
		} else {
			p.std = value;
		}
		return obj;
	};

	obj.sumOfSq = function(value) {
		if (!arguments.length) return p.sumOfSquares;

		value = accessorifyNumeric(value);

		p.sumOfSquares = value;
		return obj;
	};

	obj.value = function(value, accessor) {
		if (!arguments.length || typeof value !== 'string' ) {
			console.error("'value' requires a string argument.");
		} else {
			if(!p.values) p.values = {};
			p.values[value] = {};
			p.values[value].parameters = reductio_parameters();
			accessor_build(p.values[value], p.values[value].parameters);
			if(accessor) p.values[value].accessor = accessor;
			return p.values[value];
		}
	};

	obj.nest = function(keyAccessorArray) {
		if(!arguments.length) return p.nestKeys;

		keyAccessorArray.map(accessorify);

		p.nestKeys = keyAccessorArray;
		return obj;
	};

	obj.alias = function(propAccessorObj) {
		if(!arguments.length) return p.aliasKeys;
		p.aliasKeys = propAccessorObj;
		return obj;
	};

	obj.aliasProp = function(propAccessorObj) {
		if(!arguments.length) return p.aliasPropKeys;
		p.aliasPropKeys = propAccessorObj;
		return obj;
	};

	obj.groupAll = function(groupTest) {
		if(!arguments.length) return p.groupAll;
		p.groupAll = groupTest;
		return obj;
	};

	obj.dataList = function(value) {
		if (!arguments.length) return p.dataList;
		p.dataList = value;
		return obj;
	};

	obj.custom = function(addRemoveInitialObj) {
		if (!arguments.length) return p.custom;
		p.custom = addRemoveInitialObj;
		return obj;
	};

}

var reductio_accessors = {
	build: accessor_build
};

module.exports = reductio_accessors;

},{"./parameters.js":51}],35:[function(require,module,exports){
var reductio_alias = {
	initial: function(prior, path, obj) {
		return function (p) {
			if(prior) p = prior(p);
			function buildAliasFunction(key){
				return function(){
					return obj[key](path(p));
				};
			}
			for(var prop in obj) {
				path(p)[prop] = buildAliasFunction(prop);
			}
			return p;
		};
	}
};

module.exports = reductio_alias;
},{}],36:[function(require,module,exports){
var reductio_alias_prop = {
	add: function (obj, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			for(var prop in obj) {
				path(p)[prop] = obj[prop](path(p),v);
			}
			return p;
		};
	}
};

module.exports = reductio_alias_prop;
},{}],37:[function(require,module,exports){
var reductio_avg = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).avg = path(p).sum / path(p).count;
			} else {
				path(p).avg = 0;
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).avg = path(p).sum / path(p).count;
			} else {
				path(p).avg = 0;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).avg = 0;
			return p;
		};
	}
};

module.exports = reductio_avg;
},{}],38:[function(require,module,exports){
var reductio_filter = require('./filter.js');
var reductio_count = require('./count.js');
var reductio_sum = require('./sum.js');
var reductio_avg = require('./avg.js');
var reductio_median = require('./median.js');
var reductio_min = require('./min.js');
var reductio_max = require('./max.js');
var reductio_value_count = require('./value-count.js');
var reductio_value_list = require('./value-list.js');
var reductio_exception_count = require('./exception-count.js');
var reductio_exception_sum = require('./exception-sum.js');
var reductio_histogram = require('./histogram.js');
var reductio_sum_of_sq = require('./sum-of-squares.js');
var reductio_std = require('./std.js');
var reductio_nest = require('./nest.js');
var reductio_alias = require('./alias.js');
var reductio_alias_prop = require('./aliasProp.js');
var reductio_data_list = require('./data-list.js');
var reductio_custom = require('./custom.js');

function build_function(p, f, path) {
	// We have to build these functions in order. Eventually we can include dependency
	// information and create a dependency graph if the process becomes complex enough.

	if(!path) path = function (d) { return d; };

	// Keep track of the original reducers so that filtering can skip back to
	// them if this particular value is filtered out.
	var origF = {
		reduceAdd: f.reduceAdd,
		reduceRemove: f.reduceRemove,
		reduceInitial: f.reduceInitial
	};

	if(p.count || p.std) {
    f.reduceAdd = reductio_count.add(f.reduceAdd, path, p.count);
    f.reduceRemove = reductio_count.remove(f.reduceRemove, path, p.count);
    f.reduceInitial = reductio_count.initial(f.reduceInitial, path, p.count);
	}

	if(p.sum) {
		f.reduceAdd = reductio_sum.add(p.sum, f.reduceAdd, path);
		f.reduceRemove = reductio_sum.remove(p.sum, f.reduceRemove, path);
		f.reduceInitial = reductio_sum.initial(f.reduceInitial, path);
	}

	if(p.avg) {
		if(!p.count || !p.sum) {
			console.error("You must set .count(true) and define a .sum(accessor) to use .avg(true).");
		} else {
			f.reduceAdd = reductio_avg.add(p.sum, f.reduceAdd, path);
			f.reduceRemove = reductio_avg.remove(p.sum, f.reduceRemove, path);
			f.reduceInitial = reductio_avg.initial(f.reduceInitial, path);
		}
	}

	// The unique-only reducers come before the value_count reducers. They need to check if
	// the value is already in the values array on the group. They should only increment/decrement
	// counts if the value not in the array or the count on the value is 0.
	if(p.exceptionCount) {
		if(!p.exceptionAccessor) {
			console.error("You must define an .exception(accessor) to use .exceptionCount(true).");
		} else {
			f.reduceAdd = reductio_exception_count.add(p.exceptionAccessor, f.reduceAdd, path);
			f.reduceRemove = reductio_exception_count.remove(p.exceptionAccessor, f.reduceRemove, path);
			f.reduceInitial = reductio_exception_count.initial(f.reduceInitial, path);
		}
	}

	if(p.exceptionSum) {
		if(!p.exceptionAccessor) {
			console.error("You must define an .exception(accessor) to use .exceptionSum(accessor).");
		} else {
			f.reduceAdd = reductio_exception_sum.add(p.exceptionAccessor, p.exceptionSum, f.reduceAdd, path);
			f.reduceRemove = reductio_exception_sum.remove(p.exceptionAccessor, p.exceptionSum, f.reduceRemove, path);
			f.reduceInitial = reductio_exception_sum.initial(f.reduceInitial, path);
		}
	}

	// Maintain the values array.
	if(p.valueList || p.median || p.min || p.max) {
		f.reduceAdd = reductio_value_list.add(p.valueList, f.reduceAdd, path);
		f.reduceRemove = reductio_value_list.remove(p.valueList, f.reduceRemove, path);
		f.reduceInitial = reductio_value_list.initial(f.reduceInitial, path);
	}

	// Maintain the data array.
	if(p.dataList) {
		f.reduceAdd = reductio_data_list.add(p.dataList, f.reduceAdd, path);
		f.reduceRemove = reductio_data_list.remove(p.dataList, f.reduceRemove, path);
		f.reduceInitial = reductio_data_list.initial(f.reduceInitial, path);
	}

	if(p.median) {
		f.reduceAdd = reductio_median.add(f.reduceAdd, path);
		f.reduceRemove = reductio_median.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_median.initial(f.reduceInitial, path);
	}

	if(p.min) {
		f.reduceAdd = reductio_min.add(f.reduceAdd, path);
		f.reduceRemove = reductio_min.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_min.initial(f.reduceInitial, path);
	}

	if(p.max) {
		f.reduceAdd = reductio_max.add(f.reduceAdd, path);
		f.reduceRemove = reductio_max.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_max.initial(f.reduceInitial, path);
	}

	// Maintain the values count array.
	if(p.exceptionAccessor) {
		f.reduceAdd = reductio_value_count.add(p.exceptionAccessor, f.reduceAdd, path);
		f.reduceRemove = reductio_value_count.remove(p.exceptionAccessor, f.reduceRemove, path);
		f.reduceInitial = reductio_value_count.initial(f.reduceInitial, path);
	}

	// Histogram
	if(p.histogramValue && p.histogramThresholds) {
		f.reduceAdd = reductio_histogram.add(p.histogramValue, f.reduceAdd, path);
		f.reduceRemove = reductio_histogram.remove(p.histogramValue, f.reduceRemove, path);
		f.reduceInitial = reductio_histogram.initial(p.histogramThresholds ,f.reduceInitial, path);
	}

	// Sum of Squares
	if(p.sumOfSquares) {
		f.reduceAdd = reductio_sum_of_sq.add(p.sumOfSquares, f.reduceAdd, path);
		f.reduceRemove = reductio_sum_of_sq.remove(p.sumOfSquares, f.reduceRemove, path);
		f.reduceInitial = reductio_sum_of_sq.initial(f.reduceInitial, path);
	}

	// Standard deviation
	if(p.std) {
		if(!p.sumOfSquares || !p.sum) {
			console.error("You must set .sumOfSq(accessor) and define a .sum(accessor) to use .std(true). Or use .std(accessor).");
		} else {
			f.reduceAdd = reductio_std.add(f.reduceAdd, path);
			f.reduceRemove = reductio_std.remove(f.reduceRemove, path);
			f.reduceInitial = reductio_std.initial(f.reduceInitial, path);
		}
	}

	// Custom reducer defined by 3 functions : add, remove, initial
	if (p.custom) {
		f.reduceAdd = reductio_custom.add(f.reduceAdd, path, p.custom.add);
		f.reduceRemove = reductio_custom.remove(f.reduceRemove, path, p.custom.remove);
		f.reduceInitial = reductio_custom.initial(f.reduceInitial, path, p.custom.initial);
	}

	// Nesting
	if(p.nestKeys) {
		f.reduceAdd = reductio_nest.add(p.nestKeys, f.reduceAdd, path);
		f.reduceRemove = reductio_nest.remove(p.nestKeys, f.reduceRemove, path);
		f.reduceInitial = reductio_nest.initial(f.reduceInitial, path);
	}

	// Alias functions
	if(p.aliasKeys) {
		f.reduceInitial = reductio_alias.initial(f.reduceInitial, path, p.aliasKeys);
	}

	// Alias properties - this is less efficient than alias functions
	if(p.aliasPropKeys) {
		f.reduceAdd = reductio_alias_prop.add(p.aliasPropKeys, f.reduceAdd, path);
		// This isn't a typo. The function is the same for add/remove.
		f.reduceRemove = reductio_alias_prop.add(p.aliasPropKeys, f.reduceRemove, path);
	}

	// Filters determine if our built-up priors should run, or if it should skip
	// back to the filters given at the beginning of this build function.
	if (p.filter) {
		f.reduceAdd = reductio_filter.add(p.filter, f.reduceAdd, origF.reduceAdd, path);
		f.reduceRemove = reductio_filter.remove(p.filter, f.reduceRemove, origF.reduceRemove, path);
	}

	// Values go last.
	if(p.values) {
		Object.getOwnPropertyNames(p.values).forEach(function(n) {
			// Set up the path on each group.
			var setupPath = function(prior) {
				return function (p) {
					p = prior(p);
					path(p)[n] = {};
					return p;
				};
			};
			f.reduceInitial = setupPath(f.reduceInitial);
			build_function(p.values[n].parameters, f, function (p) { return p[n]; });
		});
	}
}

var reductio_build = {
	build: build_function
};

module.exports = reductio_build;

},{"./alias.js":35,"./aliasProp.js":36,"./avg.js":37,"./count.js":40,"./custom.js":41,"./data-list.js":42,"./exception-count.js":43,"./exception-sum.js":44,"./filter.js":45,"./histogram.js":46,"./max.js":47,"./median.js":48,"./min.js":49,"./nest.js":50,"./std.js":56,"./sum-of-squares.js":57,"./sum.js":58,"./value-count.js":59,"./value-list.js":60}],39:[function(require,module,exports){
var pluck = function(n){
    return function(d){
        return d[n];
    };
};

// supported operators are sum, avg, and count
_grouper = function(path, prior){
    if(!path) path = function(d){return d;};
    return function(p, v){
        if(prior) prior(p, v);
        var x = path(p), y = path(v);
        if(typeof y.count !== 'undefined') x.count += y.count;
        if(typeof y.sum !== 'undefined') x.sum += y.sum;
        if(typeof y.avg !== 'undefined') x.avg = x.sum/x.count;
        return p;
    };
};

reductio_cap = function (prior, f, p) {
    var obj = f.reduceInitial();
    // we want to support values so we'll need to know what those are
    var values = p.values ? Object.keys(p.values) : [];
    var _othersGrouper = _grouper();
    if (values.length) {
        for (var i = 0; i < values.length; ++i) {
            _othersGrouper = _grouper(pluck(values[i]), _othersGrouper);
        }
    }
    return function (cap, othersName) {
        if (!arguments.length) return prior();
        if( cap === Infinity || !cap ) return prior();
        var all = prior();
        var slice_idx = cap-1;
        if(all.length <= cap) return all;
        var data = all.slice(0, slice_idx);
        var others = {key: othersName || 'Others'};
        others.value = f.reduceInitial();
        for (var i = slice_idx; i < all.length; ++i) {
            _othersGrouper(others.value, all[i].value);
        }
        data.push(others);
        return data;
    };
};

module.exports = reductio_cap;

},{}],40:[function(require,module,exports){
var reductio_count = {
	add: function(prior, path, propName) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p)[propName]++;
			return p;
		};
	},
	remove: function(prior, path, propName) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p)[propName]--;
			return p;
		};
	},
	initial: function(prior, path, propName) {
		return function (p) {
			if(prior) p = prior(p);
			// if(p === undefined) p = {};
			path(p)[propName] = 0;
			return p;
		};
	}
};

module.exports = reductio_count;
},{}],41:[function(require,module,exports){
var reductio_custom = {
	add: function(prior, path, addFn) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			return addFn(p, v);
		};
	},
	remove: function(prior, path, removeFn) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			return removeFn(p, v);
		};
	},
	initial: function(prior, path, initialFn) {
		return function (p) {	
			if(prior) p = prior(p);
			return initialFn(p);
		};
	}
};

module.exports = reductio_custom;
},{}],42:[function(require,module,exports){
var reductio_data_list = {
	add: function(a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).dataList.push(v);
			return p;
		};
	},
	remove: function(a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).dataList.splice(path(p).dataList.indexOf(v), 1);
			return p;
		};
	},
	initial: function(prior, path) {
		return function (p) {
			if(prior) p = prior(p);
			path(p).dataList = [];
			return p;
		};
	}
};

module.exports = reductio_data_list;

},{}],43:[function(require,module,exports){
var reductio_exception_count = {
	add: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only count++ if the p.values array doesn't contain a(v) or if it's 0.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if((!curr || curr[0] !== a(v)) || curr[1] === 0) {
				path(p).exceptionCount++;
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only count-- if the p.values array contains a(v) value of 1.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v) && curr[1] === 1) {
				path(p).exceptionCount--;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).exceptionCount = 0;
			return p;
		};
	}
};

module.exports = reductio_exception_count;
},{}],44:[function(require,module,exports){
var reductio_exception_sum = {
	add: function (a, sum, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only sum if the p.values array doesn't contain a(v) or if it's 0.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if((!curr || curr[0] !== a(v)) || curr[1] === 0) {
				path(p).exceptionSum = path(p).exceptionSum + sum(v);
			}
			return p;
		};
	},
	remove: function (a, sum, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only sum if the p.values array contains a(v) value of 1.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v) && curr[1] === 1) {
				path(p).exceptionSum = path(p).exceptionSum - sum(v);
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).exceptionSum = 0;
			return p;
		};
	}
};

module.exports = reductio_exception_sum;
},{}],45:[function(require,module,exports){
var reductio_filter = {
	// The big idea here is that you give us a filter function to run on values,
	// a 'prior' reducer to run (just like the rest of the standard reducers),
	// and a reference to the last reducer (called 'skip' below) defined before
	// the most recent chain of reducers.  This supports individual filters for
	// each .value('...') chain that you add to your reducer.
	add: function (filter, prior, skip) {
		return function (p, v, nf) {
			if (filter(v, nf)) {
				if (prior) prior(p, v, nf);
			} else {
				if (skip) skip(p, v, nf);
			}
			return p;
		};
	},
	remove: function (filter, prior, skip) {
		return function (p, v, nf) {
			if (filter(v, nf)) {
				if (prior) prior(p, v, nf);
			} else {
				if (skip) skip(p, v, nf);
			}
			return p;
		};
	}
};

module.exports = reductio_filter;

},{}],46:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_histogram = {
	add: function (a, prior, path) {
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		var bisectHisto = crossfilter.bisect.by(function(d) { return d.x; }).right;
		var curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			curr = path(p).histogram[bisectHisto(path(p).histogram, a(v), 0, path(p).histogram.length) - 1];
			curr.y++;
			curr.splice(bisect(curr, a(v), 0, curr.length), 0, a(v));
			return p;
		};
	},
	remove: function (a, prior, path) {
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		var bisectHisto = crossfilter.bisect.by(function(d) { return d.x; }).right;
		var curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			curr = path(p).histogram[bisectHisto(path(p).histogram, a(v), 0, path(p).histogram.length) - 1];
			curr.y--;
			curr.splice(bisect(curr, a(v), 0, curr.length), 1);
			return p;
		};
	},
	initial: function (thresholds, prior, path) {
		return function (p) {
			p = prior(p);
			path(p).histogram = [];
			var arr = [];
			for(var i = 1; i < thresholds.length; i++) {
				arr = [];
				arr.x = thresholds[i - 1];
				arr.dx = (thresholds[i] - thresholds[i - 1]);
				arr.y = 0;
				path(p).histogram.push(arr);
			}
			return p;
		};
	}
};

module.exports = reductio_histogram;
},{"crossfilter2":16}],47:[function(require,module,exports){
var reductio_max = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
 
			path(p).max = path(p).valueList[path(p).valueList.length - 1];

			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).max = undefined;
				return p;
			}
 
			path(p).max = path(p).valueList[path(p).valueList.length - 1];

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).max = undefined;
			return p;
		};
	}
};

module.exports = reductio_max;
},{}],48:[function(require,module,exports){
var reductio_median = {
	add: function (prior, path) {
		var half;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			half = Math.floor(path(p).valueList.length/2);
 
			if(path(p).valueList.length % 2) {
				path(p).median = path(p).valueList[half];
			} else {
				path(p).median = (path(p).valueList[half-1] + path(p).valueList[half]) / 2.0;
			}

			return p;
		};
	},
	remove: function (prior, path) {
		var half;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			half = Math.floor(path(p).valueList.length/2);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).median = undefined;
				return p;
			}
 
			if(path(p).valueList.length === 1 || path(p).valueList.length % 2) {
				path(p).median = path(p).valueList[half];
			} else {
				path(p).median = (path(p).valueList[half-1] + path(p).valueList[half]) / 2.0;
			}

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).median = undefined;
			return p;
		};
	}
};

module.exports = reductio_median;
},{}],49:[function(require,module,exports){
var reductio_min = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
 
			path(p).min = path(p).valueList[0];

			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).min = undefined;
				return p;
			}
 
			path(p).min = path(p).valueList[0];

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).min = undefined;
			return p;
		};
	}
};

module.exports = reductio_min;
},{}],50:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_nest = {
	add: function (keyAccessors, prior, path) {
		var i; // Current key accessor
		var arrRef;
		var newRef;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			arrRef = path(p).nest;
			keyAccessors.forEach(function(a) {
				newRef = arrRef.filter(function(d) { return d.key === a(v); })[0];
				if(newRef) {
					// There is another level.
					arrRef = newRef.values;
				} else {
					// Next level doesn't yet exist so we create it.
					newRef = [];
					arrRef.push({ key: a(v), values: newRef });
					arrRef = newRef;
				}
			});

			arrRef.push(v);
			
			return p;
		};
	},
	remove: function (keyAccessors, prior, path) {
		var arrRef;
		var nextRef;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			arrRef = path(p).nest;
			keyAccessors.forEach(function(a) {
				arrRef = arrRef.filter(function(d) { return d.key === a(v); })[0].values;
			});

			// Array contains an actual reference to the row, so just splice it out.
			arrRef.splice(arrRef.indexOf(v), 1);

			// If the leaf now has length 0 and it's not the base array remove it.
			// TODO

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).nest = [];
			return p;
		};
	}
};

module.exports = reductio_nest;
},{"crossfilter2":16}],51:[function(require,module,exports){
var reductio_parameters = function() {
	return {
		order: false,
		avg: false,
		count: false,
		sum: false,
		exceptionAccessor: false,
		exceptionCount: false,
		exceptionSum: false,
		filter: false,
		valueList: false,
		median: false,
		histogramValue: false,
		min: false,
		max: false,
		histogramThresholds: false,
		std: false,
		sumOfSquares: false,
		values: false,
		nestKeys: false,
		aliasKeys: false,
		aliasPropKeys: false,
		groupAll: false,
		dataList: false,
		custom: false
	};
};

module.exports = reductio_parameters;

},{}],52:[function(require,module,exports){
function postProcess(reductio) {
    return function (group, p, f) {
        group.post = function(){
            var postprocess = function () {
                return postprocess.all();
            };
            postprocess.all = function () {
                return group.all();
            };
            var postprocessors = reductio.postprocessors;
            Object.keys(postprocessors).forEach(function (name) {
                postprocess[name] = function () {
                    var _all = postprocess.all;
                    var args = [].slice.call(arguments);
                    postprocess.all = function () {
                        return postprocessors[name](_all, f, p).apply(null, args);
                    };
                    return postprocess;
                };
            });
            return postprocess;
        };
    };
}

module.exports = postProcess;

},{}],53:[function(require,module,exports){
module.exports = function(reductio){
    reductio.postprocessors = {};
    reductio.registerPostProcessor = function(name, func){
        reductio.postprocessors[name] = func;
    };

    reductio.registerPostProcessor('cap', require('./cap'));
    reductio.registerPostProcessor('sortBy', require('./sortBy'));
};

},{"./cap":39,"./sortBy":55}],54:[function(require,module,exports){
var reductio_build = require('./build.js');
var reductio_accessors = require('./accessors.js');
var reductio_parameters = require('./parameters.js');
var reductio_postprocess = require('./postprocess');
var crossfilter = require('crossfilter2');

function reductio() {
	var parameters = reductio_parameters();

	var funcs = {};

	function my(group) {
		// Start fresh each time.
		funcs = {
			reduceAdd: function(p) { return p; },
			reduceRemove: function(p) { return p; },
			reduceInitial: function () { return {}; },
		};

		reductio_build.build(parameters, funcs);

		// If we're doing groupAll
		if(parameters.groupAll) {
			if(group.top) {
				console.warn("'groupAll' is defined but attempting to run on a standard dimension.group(). Must run on dimension.groupAll().");
			} else {
				var bisect = crossfilter.bisect.by(function(d) { return d.key; }).left;
				var i, j;
				var keys;
        var keysLength;
        var k; // Key
				group.reduce(
					function(p, v, nf) {
						keys = parameters.groupAll(v);
            keysLength = keys.length;
            for(j=0;j<keysLength;j++) {
              k = keys[j];
              i = bisect(p, k, 0, p.length);
							if(!p[i] || p[i].key !== k) {
								// If the group doesn't yet exist, create it first.
								p.splice(i, 0, { key: k, value: funcs.reduceInitial() });
							}

							// Then pass the record and the group value to the reducers
							funcs.reduceAdd(p[i].value, v, nf);
            }
						return p;
					},
					function(p, v, nf) {
						keys = parameters.groupAll(v);
            keysLength = keys.length;
            for(j=0;j<keysLength;j++) {
              i = bisect(p, keys[j], 0, p.length);
							// The group should exist or we're in trouble!
							// Then pass the record and the group value to the reducers
							funcs.reduceRemove(p[i].value, v, nf);
            }
						return p;
					},
					function() {
						return [];
					}
				);
				if(!group.all) {
					// Add an 'all' method for compatibility with standard Crossfilter groups.
					group.all = function() { return this.value(); };
				}
			}
		} else {
			group.reduce(funcs.reduceAdd, funcs.reduceRemove, funcs.reduceInitial);
		}

		reductio_postprocess(group, parameters, funcs);

		return group;
	}

	reductio_accessors.build(my, parameters);

	return my;
}

require('./postprocessors')(reductio);
reductio_postprocess = reductio_postprocess(reductio);

module.exports = reductio;

},{"./accessors.js":34,"./build.js":38,"./parameters.js":51,"./postprocess":52,"./postprocessors":53,"crossfilter2":16}],55:[function(require,module,exports){
var pluck_n = function (n) {
    if (typeof n === 'function') {
        return n;
    }
    if (~n.indexOf('.')) {
        var split = n.split('.');
        return function (d) {
            return split.reduce(function (p, v) {
                return p[v];
            }, d);
        };
    }
    return function (d) {
        return d[n];
    };
};

function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var comparer = function (accessor, ordering) {
    return function (a, b) {
        return ordering(accessor(a), accessor(b));
    };
};

var type = {}.toString;

module.exports = function (prior) {
    return function (value, order) {
        if (arguments.length === 1) {
            order = ascending;
        }
        return prior().sort(comparer(pluck_n(value), order));
    };
};

},{}],56:[function(require,module,exports){
var reductio_std = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).std = 0.0;
				var n = path(p).sumOfSq - path(p).sum*path(p).sum/path(p).count;
				if (n>0.0) path(p).std = Math.sqrt(n/(path(p).count-1));
			} else {
				path(p).std = 0.0;
			}
			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).std = 0.0;
				var n = path(p).sumOfSq - path(p).sum*path(p).sum/path(p).count;
				if (n>0.0) path(p).std = Math.sqrt(n/(path(p).count-1));
			} else {
				path(p).std = 0;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).std = 0;
			return p;
		};
	}
};

module.exports = reductio_std;
},{}],57:[function(require,module,exports){
var reductio_sum_of_sq = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sumOfSq = path(p).sumOfSq + a(v)*a(v);
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sumOfSq = path(p).sumOfSq - a(v)*a(v);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).sumOfSq = 0;
			return p;
		};
	}
};

module.exports = reductio_sum_of_sq;
},{}],58:[function(require,module,exports){
var reductio_sum = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sum = path(p).sum + a(v);
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sum = path(p).sum - a(v);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).sum = 0;
			return p;
		};
	}
};

module.exports = reductio_sum;
},{}],59:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_value_count = {
	add: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Not sure if this is more efficient than sorting.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v)) {
				// Value already exists in the array - increment it
				curr[1]++;
			} else {
				// Value doesn't exist - add it in form [value, 1]
				path(p).values.splice(i, 0, [a(v), 1]);
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			// Value already exists or something has gone terribly wrong.
			path(p).values[i][1]--;
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			// Array[Array[value, count]]
			path(p).values = [];
			path(p).bisect = crossfilter.bisect.by(function(d) { return d[0]; }).left;
			return p;
		};
	}
};

module.exports = reductio_value_count;
},{"crossfilter2":16}],60:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_value_list = {
	add: function (a, prior, path) {
		var i;
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Not sure if this is more efficient than sorting.
			i = bisect(path(p).valueList, a(v), 0, path(p).valueList.length);
			path(p).valueList.splice(i, 0, a(v));
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i;
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			i = bisect(path(p).valueList, a(v), 0, path(p).valueList.length);
			// Value already exists or something has gone terribly wrong.
			path(p).valueList.splice(i, 1);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).valueList = [];
			return p;
		};
	}
};

module.exports = reductio_value_list;
},{"crossfilter2":16}]},{},[15])(15)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYWdncmVnYXRpb24uanMiLCJzcmMvY2xlYXIuanMiLCJzcmMvY29sdW1uLmpzIiwic3JjL2Nyb3NzZmlsdGVyLmpzIiwic3JjL2Rlc3Ryb3kuanMiLCJzcmMvZGltZW5zaW9uLmpzIiwic3JjL2V4cHJlc3Npb25zLmpzIiwic3JjL2ZpbHRlcnMuanMiLCJzcmMvbG9kYXNoLmpzIiwic3JjL3Bvc3RBZ2dyZWdhdGlvbi5qcyIsInNyYy9xLnNlcmlhbC5qcyIsInNyYy9xdWVyeS5qcyIsInNyYy9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzLmpzIiwic3JjL3JlZHVjdGlvZnkuanMiLCJzcmMvdW5pdmVyc2UuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL2luZGV4LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9wYWNrYWdlLmpzb24iLCIuLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9hcnJheS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2Jpc2VjdC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2Nyb3NzZmlsdGVyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvZmlsdGVyLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaGVhcC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2hlYXBzZWxlY3QuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9pZGVudGl0eS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2luc2VydGlvbnNvcnQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9udWxsLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvcGVybXV0ZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3F1aWNrc29ydC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3JlZHVjZS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3plcm8uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvbG9kYXNoLnJlc3VsdC9pbmRleC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcS9ub2RlX21vZHVsZXMvcS9xLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hY2Nlc3NvcnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FsaWFzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hbGlhc1Byb3AuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2F2Zy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYnVpbGQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2NhcC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvY291bnQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2N1c3RvbS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvZGF0YS1saXN0LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9leGNlcHRpb24tY291bnQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2V4Y2VwdGlvbi1zdW0uanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2ZpbHRlci5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvaGlzdG9ncmFtLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9tYXguanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL21lZGlhbi5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbWluLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9uZXN0LmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wYXJhbWV0ZXJzLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wb3N0cHJvY2Vzcy5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcG9zdHByb2Nlc3NvcnMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3JlZHVjdGlvLmpzIiwiLi4vLi4vbm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zb3J0QnkuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N0ZC5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvc3VtLW9mLXNxdWFyZXMuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N1bS5qcyIsIi4uLy4uL25vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvdmFsdWUtY291bnQuanMiLCIuLi8uLi9ub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3ZhbHVlLWxpc3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5WEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2MUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDcDZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDcExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hnRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxudmFyIGFnZ3JlZ2F0b3JzID0ge1xuICAvLyBDb2xsZWN0aW9uc1xuICAkc3VtOiAkc3VtLFxuICAkYXZnOiAkYXZnLFxuICAkbWF4OiAkbWF4LFxuICAkbWluOiAkbWluLFxuXG4gIC8vIFBpY2tlcnNcbiAgJGNvdW50OiAkY291bnQsXG4gICRmaXJzdDogJGZpcnN0LFxuICAkbGFzdDogJGxhc3QsXG4gICRnZXQ6ICRnZXQsXG4gICRudGg6ICRnZXQsIC8vIG50aCBpcyBzYW1lIGFzIHVzaW5nIGEgZ2V0XG4gICRudGhMYXN0OiAkbnRoTGFzdCxcbiAgJG50aFBjdDogJG50aFBjdCxcbiAgJG1hcDogJG1hcCxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ha2VWYWx1ZUFjY2Vzc29yOiBtYWtlVmFsdWVBY2Nlc3NvcixcbiAgYWdncmVnYXRvcnM6IGFnZ3JlZ2F0b3JzLFxuICBleHRyYWN0S2V5VmFsT3JBcnJheTogZXh0cmFjdEtleVZhbE9yQXJyYXksXG4gIHBhcnNlQWdncmVnYXRvclBhcmFtczogcGFyc2VBZ2dyZWdhdG9yUGFyYW1zLFxufVxuICAvLyBUaGlzIGlzIHVzZWQgdG8gYnVpbGQgYWdncmVnYXRpb24gc3RhY2tzIGZvciBzdWItcmVkdWN0aW9cbiAgLy8gYWdncmVnYXRpb25zLCBvciBwbHVja2luZyB2YWx1ZXMgZm9yIHVzZSBpbiBmaWx0ZXJzIGZyb20gdGhlIGRhdGFcbmZ1bmN0aW9uIG1ha2VWYWx1ZUFjY2Vzc29yKG9iaikge1xuICBpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoaXNTdHJpbmdTeW50YXgob2JqKSkge1xuICAgICAgb2JqID0gY29udmVydEFnZ3JlZ2F0b3JTdHJpbmcob2JqKVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNdXN0IGJlIGEgY29sdW1uIGtleS4gUmV0dXJuIGFuIGlkZW50aXR5IGFjY2Vzc29yXG4gICAgICByZXR1cm4gb2JqXG4gICAgfVxuICB9XG4gIC8vIE11c3QgYmUgYSBjb2x1bW4gaW5kZXguIFJldHVybiBhbiBpZGVudGl0eSBhY2Nlc3NvclxuICBpZiAodHlwZW9mIG9iaiA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gb2JqXG4gIH1cbiAgLy8gSWYgaXQncyBhbiBvYmplY3QsIHdlIG5lZWQgdG8gYnVpbGQgYSBjdXN0b20gdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb25cbiAgaWYgKF8uaXNPYmplY3Qob2JqKSkge1xuICAgIHJldHVybiBtYWtlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2UoKSB7XG4gICAgdmFyIHN0YWNrID0gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24ob2JqKVxuICAgIHJldHVybiBmdW5jdGlvbiB0b3BTdGFjayhkKSB7XG4gICAgICByZXR1cm4gc3RhY2soZClcbiAgICB9XG4gIH1cbn1cblxuLy8gQSByZWN1cnNpdmUgZnVuY3Rpb24gdGhhdCB3YWxrcyB0aGUgYWdncmVnYXRpb24gc3RhY2sgYW5kIHJldHVybnNcbi8vIGEgZnVuY3Rpb24uIFRoZSByZXR1cm5lZCBmdW5jdGlvbiwgd2hlbiBjYWxsZWQsIHdpbGwgcmVjdXJzaXZlbHkgaW52b2tlXG4vLyB3aXRoIHRoZSBwcm9wZXJ0aWVzIGZyb20gdGhlIHByZXZpb3VzIHN0YWNrIGluIHJldmVyc2Ugb3JkZXJcbmZ1bmN0aW9uIG1ha2VTdWJBZ2dyZWdhdGlvbkZ1bmN0aW9uKG9iaikge1xuICAvLyBJZiBpdHMgYW4gb2JqZWN0LCBlaXRoZXIgdW53cmFwIGFsbCBvZiB0aGUgcHJvcGVydGllcyBhcyBhblxuICAvLyBhcnJheSBvZiBrZXlWYWx1ZXMsIG9yIHVud3JhcCB0aGUgZmlyc3Qga2V5VmFsdWUgc2V0IGFzIGFuIG9iamVjdFxuICBvYmogPSBfLmlzT2JqZWN0KG9iaikgPyBleHRyYWN0S2V5VmFsT3JBcnJheShvYmopIDogb2JqXG5cbiAgLy8gRGV0ZWN0IHN0cmluZ3NcbiAgaWYgKF8uaXNTdHJpbmcob2JqKSkge1xuICAgIC8vIElmIGJlZ2lucyB3aXRoIGEgJCwgdGhlbiB3ZSBuZWVkIHRvIGNvbnZlcnQgaXQgb3ZlciB0byBhIHJlZ3VsYXIgcXVlcnkgb2JqZWN0IGFuZCBhbmFseXplIGl0IGFnYWluXG4gICAgaWYgKGlzU3RyaW5nU3ludGF4KG9iaikpIHtcbiAgICAgIHJldHVybiBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihjb252ZXJ0QWdncmVnYXRvclN0cmluZyhvYmopKVxuICAgIH1cbiAgICAvLyBJZiBub3JtYWwgc3RyaW5nLCB0aGVuIGp1c3QgcmV0dXJuIGEgYW4gaXRlbnRpdHkgYWNjZXNzb3JcbiAgICByZXR1cm4gZnVuY3Rpb24gaWRlbnRpdHkoZCkge1xuICAgICAgcmV0dXJuIGRbb2JqXVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFuIGFycmF5LCByZWN1cnNlIGludG8gZWFjaCBpdGVtIGFuZCByZXR1cm4gYXMgYSBtYXBcbiAgaWYgKF8uaXNBcnJheShvYmopKSB7XG4gICAgdmFyIHN1YlN0YWNrID0gXy5tYXAob2JqLCBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24gZ2V0U3ViU3RhY2soZCkge1xuICAgICAgcmV0dXJuIHN1YlN0YWNrLm1hcChmdW5jdGlvbiAocykge1xuICAgICAgICByZXR1cm4gcyhkKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyBJZiBvYmplY3QsIGZpbmQgdGhlIGFnZ3JlZ2F0aW9uLCBhbmQgcmVjdXJzZSBpbnRvIHRoZSB2YWx1ZVxuICBpZiAob2JqLmtleSkge1xuICAgIGlmIChhZ2dyZWdhdG9yc1tvYmoua2V5XSkge1xuICAgICAgdmFyIHN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24gPSBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihvYmoudmFsdWUpXG4gICAgICByZXR1cm4gZnVuY3Rpb24gZ2V0QWdncmVnYXRpb24oZCkge1xuICAgICAgICByZXR1cm4gYWdncmVnYXRvcnNbb2JqLmtleV0oc3ViQWdncmVnYXRpb25GdW5jdGlvbihkKSlcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGZpbmQgYWdncmVncmF0aW9uIG1ldGhvZCcsIG9iailcbiAgfVxuXG4gIHJldHVybiBbXVxufVxuXG5mdW5jdGlvbiBleHRyYWN0S2V5VmFsT3JBcnJheShvYmopIHtcbiAgdmFyIGtleVZhbFxuICB2YXIgdmFsdWVzID0gW11cbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAga2V5VmFsID0ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IG9ialtrZXldXG4gICAgICB9XG4gICAgICB2YXIgc3ViT2JqID0ge31cbiAgICAgIHN1Yk9ialtrZXldID0gb2JqW2tleV1cbiAgICAgIHZhbHVlcy5wdXNoKHN1Yk9iailcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlcy5sZW5ndGggPiAxID8gdmFsdWVzIDoga2V5VmFsXG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nU3ludGF4KHN0cikge1xuICByZXR1cm4gWyckJywgJygnXS5pbmRleE9mKHN0ci5jaGFyQXQoMCkpID4gLTFcbn1cblxuZnVuY3Rpb24gcGFyc2VBZ2dyZWdhdG9yUGFyYW1zKGtleVN0cmluZykge1xuICB2YXIgcGFyYW1zID0gW11cbiAgdmFyIHAxID0ga2V5U3RyaW5nLmluZGV4T2YoJygnKVxuICB2YXIgcDIgPSBrZXlTdHJpbmcuaW5kZXhPZignKScpXG4gIHZhciBrZXkgPSBwMSA+IC0xID8ga2V5U3RyaW5nLnN1YnN0cmluZygwLCBwMSkgOiBrZXlTdHJpbmdcbiAgaWYgKCFhZ2dyZWdhdG9yc1trZXldKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgaWYgKHAxID4gLTEgJiYgcDIgPiAtMSAmJiBwMiA+IHAxKSB7XG4gICAgcGFyYW1zID0ga2V5U3RyaW5nLnN1YnN0cmluZyhwMSArIDEsIHAyKS5zcGxpdCgnLCcpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFnZ3JlZ2F0b3I6IGFnZ3JlZ2F0b3JzW2tleV0sXG4gICAgcGFyYW1zOiBwYXJhbXNcbiAgfVxufVxuXG5mdW5jdGlvbiBjb252ZXJ0QWdncmVnYXRvclN0cmluZyhrZXlTdHJpbmcpIHtcbiAgLy8gdmFyIG9iaiA9IHt9IC8vIG9iaiBpcyBkZWZpbmVkIGJ1dCBub3QgdXNlZFxuXG4gIC8vIDEuIHVud3JhcCB0b3AgcGFyZW50aGVzZXNcbiAgLy8gMi4gZGV0ZWN0IGFycmF5c1xuXG4gIC8vIHBhcmVudGhlc2VzXG4gIHZhciBvdXRlclBhcmVucyA9IC9cXCgoLispXFwpL2dcbiAgLy8gdmFyIGlubmVyUGFyZW5zID0gL1xcKChbXlxcKFxcKV0rKVxcKS9nICAvLyBpbm5lclBhcmVucyBpcyBkZWZpbmVkIGJ1dCBub3QgdXNlZFxuICAgIC8vIGNvbW1hIG5vdCBpbiAoKVxuICB2YXIgaGFzQ29tbWEgPSAvKD86XFwoW15cXChcXCldKlxcKSl8KCwpL2dcblxuICByZXR1cm4gSlNPTi5wYXJzZSgneycgKyB1bndyYXBQYXJlbnNBbmRDb21tYXMoa2V5U3RyaW5nKSArICd9JylcblxuICBmdW5jdGlvbiB1bndyYXBQYXJlbnNBbmRDb21tYXMoc3RyKSB7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoJyAnLCAnJylcbiAgICByZXR1cm4gJ1wiJyArIHN0ci5yZXBsYWNlKG91dGVyUGFyZW5zLCBmdW5jdGlvbiAocCwgcHIpIHtcbiAgICAgIGlmIChoYXNDb21tYS50ZXN0KHByKSkge1xuICAgICAgICBpZiAocHIuY2hhckF0KDApID09PSAnJCcpIHtcbiAgICAgICAgICByZXR1cm4gJ1wiOntcIicgKyBwci5yZXBsYWNlKGhhc0NvbW1hLCBmdW5jdGlvbiAocDIvKiAsIHByMiAqLykge1xuICAgICAgICAgICAgaWYgKHAyID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICcsXCInXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW53cmFwUGFyZW5zQW5kQ29tbWFzKHAyKS50cmltKClcbiAgICAgICAgICB9KSArICd9J1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAnOltcIicgKyBwci5yZXBsYWNlKGhhc0NvbW1hLCBmdW5jdGlvbiAoLyogcDIgLCBwcjIgKi8pIHtcbiAgICAgICAgICByZXR1cm4gJ1wiLFwiJ1xuICAgICAgICB9KSArICdcIl0nXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuXG4vLyBDb2xsZWN0aW9uIEFnZ3JlZ2F0b3JzXG5cbmZ1bmN0aW9uICRzdW0oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbiAoYSwgYikge1xuICAgIHJldHVybiBhICsgYlxuICB9LCAwKVxufVxuXG5mdW5jdGlvbiAkYXZnKGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSArIGJcbiAgfSwgMCkgLyBjaGlsZHJlbi5sZW5ndGhcbn1cblxuZnVuY3Rpb24gJG1heChjaGlsZHJlbikge1xuICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgY2hpbGRyZW4pXG59XG5cbmZ1bmN0aW9uICRtaW4oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIE1hdGgubWluLmFwcGx5KG51bGwsIGNoaWxkcmVuKVxufVxuXG5mdW5jdGlvbiAkY291bnQoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLmxlbmd0aFxufVxuXG4vKiBmdW5jdGlvbiAkbWVkKGNoaWxkcmVuKSB7IC8vICRtZWQgaXMgZGVmaW5lZCBidXQgbm90IHVzZWRcbiAgY2hpbGRyZW4uc29ydChmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGEgLSBiXG4gIH0pXG4gIHZhciBoYWxmID0gTWF0aC5mbG9vcihjaGlsZHJlbi5sZW5ndGggLyAyKVxuICBpZiAoY2hpbGRyZW4ubGVuZ3RoICUgMilcbiAgICByZXR1cm4gY2hpbGRyZW5baGFsZl1cbiAgZWxzZVxuICAgIHJldHVybiAoY2hpbGRyZW5baGFsZiAtIDFdICsgY2hpbGRyZW5baGFsZl0pIC8gMi4wXG59ICovXG5cbmZ1bmN0aW9uICRmaXJzdChjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW5bMF1cbn1cblxuZnVuY3Rpb24gJGxhc3QoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdXG59XG5cbmZ1bmN0aW9uICRnZXQoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW25dXG59XG5cbmZ1bmN0aW9uICRudGhMYXN0KGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSBuXVxufVxuXG5mdW5jdGlvbiAkbnRoUGN0KGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbltNYXRoLnJvdW5kKGNoaWxkcmVuLmxlbmd0aCAqIChuIC8gMTAwKSldXG59XG5cbmZ1bmN0aW9uICRtYXAoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLm1hcChmdW5jdGlvbiAoZCkge1xuICAgIHJldHVybiBkW25dXG4gIH0pXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHJldHVybiBmdW5jdGlvbiBjbGVhcihkZWYpIHtcbiAgICAvLyBDbGVhciBhIHNpbmdsZSBvciBtdWx0aXBsZSBjb2x1bW4gZGVmaW5pdGlvbnNcbiAgICBpZiAoZGVmKSB7XG4gICAgICBkZWYgPSBfLmlzQXJyYXkoZGVmKSA/IGRlZiA6IFtkZWZdXG4gICAgfVxuXG4gICAgaWYgKCFkZWYpIHtcbiAgICAgIC8vIENsZWFyIGFsbCBvZiB0aGUgY29sdW1uIGRlZmVuaXRpb25zXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoc2VydmljZS5jb2x1bW5zLCBkaXNwb3NlQ29sdW1uKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHNlcnZpY2UuY29sdW1ucyA9IFtdXG4gICAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoZGVmLCBmdW5jdGlvbiAoZCkge1xuICAgICAgaWYgKF8uaXNPYmplY3QoZCkpIHtcbiAgICAgICAgZCA9IGQua2V5XG4gICAgICB9XG4gICAgICAvLyBDbGVhciB0aGUgY29sdW1uXG4gICAgICB2YXIgY29sdW1uID0gXy5yZW1vdmUoc2VydmljZS5jb2x1bW5zLCBmdW5jdGlvbiAoYykge1xuICAgICAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICAgICAgcmV0dXJuICFfLnhvcihjLmtleSwgZCkubGVuZ3RoXG4gICAgICAgIH1cbiAgICAgICAgaWYgKGMua2V5ID09PSBkKSB7XG4gICAgICAgICAgaWYgKGMuZHluYW1pY1JlZmVyZW5jZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgIH1cbiAgICAgIH0pWzBdXG5cbiAgICAgIGlmICghY29sdW1uKSB7XG4gICAgICAgIC8vIGNvbnNvbGUuaW5mbygnQXR0ZW1wdGVkIHRvIGNsZWFyIGEgY29sdW1uIHRoYXQgaXMgcmVxdWlyZWQgZm9yIGFub3RoZXIgcXVlcnkhJywgYylcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGRpc3Bvc2VDb2x1bW4oY29sdW1uKVxuICAgIH0pKVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VDb2x1bW4oY29sdW1uKSB7XG4gICAgICB2YXIgZGlzcG9zYWxBY3Rpb25zID0gW11cbiAgICAgICAgLy8gRGlzcG9zZSB0aGUgZGltZW5zaW9uXG4gICAgICBpZiAoY29sdW1uLnJlbW92ZUxpc3RlbmVycykge1xuICAgICAgICBkaXNwb3NhbEFjdGlvbnMgPSBfLm1hcChjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLCBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGxpc3RlbmVyKCkpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgICB2YXIgZmlsdGVyS2V5ID0gY29sdW1uLmtleVxuICAgICAgaWYgKGNvbHVtbi5jb21wbGV4ID09PSAnYXJyYXknKSB7XG4gICAgICAgIGZpbHRlcktleSA9IEpTT04uc3RyaW5naWZ5KGNvbHVtbi5rZXkpXG4gICAgICB9XG4gICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgZmlsdGVyS2V5ID0gY29sdW1uLmtleS50b1N0cmluZygpXG4gICAgICB9XG4gICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2ZpbHRlcktleV1cbiAgICAgIGlmIChjb2x1bW4uZGltZW5zaW9uKSB7XG4gICAgICAgIGRpc3Bvc2FsQWN0aW9ucy5wdXNoKFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmRpc3Bvc2UoKSkpXG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZGlzcG9zYWxBY3Rpb25zKVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICB2YXIgZGltZW5zaW9uID0gcmVxdWlyZSgnLi9kaW1lbnNpb24nKShzZXJ2aWNlKVxuXG4gIHZhciBjb2x1bW5GdW5jID0gY29sdW1uXG4gIGNvbHVtbkZ1bmMuZmluZCA9IGZpbmRDb2x1bW5cblxuICByZXR1cm4gY29sdW1uRnVuY1xuXG4gIGZ1bmN0aW9uIGNvbHVtbihkZWYpIHtcbiAgICAvLyBTdXBwb3J0IGdyb3VwQWxsIGRpbWVuc2lvblxuICAgIGlmIChfLmlzVW5kZWZpbmVkKGRlZikpIHtcbiAgICAgIGRlZiA9IHRydWVcbiAgICB9XG5cbiAgICAvLyBBbHdheXMgZGVhbCBpbiBidWxrLiAgTGlrZSBDb3N0Y28hXG4gICAgaWYgKCFfLmlzQXJyYXkoZGVmKSkge1xuICAgICAgZGVmID0gW2RlZl1cbiAgICB9XG5cbiAgICAvLyBNYXBwIGFsbCBjb2x1bW4gY3JlYXRpb24sIHdhaXQgZm9yIGFsbCB0byBzZXR0bGUsIHRoZW4gcmV0dXJuIHRoZSBpbnN0YW5jZVxuICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChkZWYsIG1ha2VDb2x1bW4pKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRDb2x1bW4oZCkge1xuICAgIHJldHVybiBfLmZpbmQoc2VydmljZS5jb2x1bW5zLCBmdW5jdGlvbiAoYykge1xuICAgICAgaWYgKF8uaXNBcnJheShkKSkge1xuICAgICAgICByZXR1cm4gIV8ueG9yKGMua2V5LCBkKS5sZW5ndGhcbiAgICAgIH1cbiAgICAgIHJldHVybiBjLmtleSA9PT0gZFxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBnZXRUeXBlKGQpIHtcbiAgICBpZiAoXy5pc051bWJlcihkKSkge1xuICAgICAgcmV0dXJuICdudW1iZXInXG4gICAgfVxuICAgIGlmIChfLmlzQm9vbGVhbihkKSkge1xuICAgICAgcmV0dXJuICdib29sJ1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICByZXR1cm4gJ2FycmF5J1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChkKSkge1xuICAgICAgcmV0dXJuICdvYmplY3QnXG4gICAgfVxuICAgIHJldHVybiAnc3RyaW5nJ1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUNvbHVtbihkKSB7XG4gICAgdmFyIGNvbHVtbiA9IF8uaXNPYmplY3QoZCkgPyBkIDoge1xuICAgICAga2V5OiBkLFxuICAgIH1cblxuICAgIHZhciBleGlzdGluZyA9IGZpbmRDb2x1bW4oY29sdW1uLmtleSlcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgZXhpc3RpbmcudGVtcG9yYXJ5ID0gZmFsc2VcbiAgICAgIGlmIChleGlzdGluZy5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgIGV4aXN0aW5nLmR5bmFtaWNSZWZlcmVuY2UgPSBmYWxzZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGV4aXN0aW5nLnByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gZm9yIHN0b3JpbmcgaW5mbyBhYm91dCBxdWVyaWVzIGFuZCBwb3N0IGFnZ3JlZ2F0aW9uc1xuICAgIGNvbHVtbi5xdWVyaWVzID0gW11cbiAgICBzZXJ2aWNlLmNvbHVtbnMucHVzaChjb2x1bW4pXG5cbiAgICBjb2x1bW4ucHJvbWlzZSA9IFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5hbGwoKSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgIHZhciBzYW1wbGVcblxuICAgICAgLy8gQ29tcGxleCBjb2x1bW4gS2V5c1xuICAgICAgaWYgKF8uaXNGdW5jdGlvbihjb2x1bW4ua2V5KSkge1xuICAgICAgICBjb2x1bW4uY29tcGxleCA9ICdmdW5jdGlvbidcbiAgICAgICAgc2FtcGxlID0gY29sdW1uLmtleShhbGxbMF0pXG4gICAgICB9IGVsc2UgaWYgKF8uaXNTdHJpbmcoY29sdW1uLmtleSkgJiYgKGNvbHVtbi5rZXkuaW5kZXhPZignLicpID4gLTEgfHwgY29sdW1uLmtleS5pbmRleE9mKCdbJykgPiAtMSkpIHtcbiAgICAgICAgY29sdW1uLmNvbXBsZXggPSAnc3RyaW5nJ1xuICAgICAgICBzYW1wbGUgPSBfLmdldChhbGxbMF0sIGNvbHVtbi5rZXkpXG4gICAgICB9IGVsc2UgaWYgKF8uaXNBcnJheShjb2x1bW4ua2V5KSkge1xuICAgICAgICBjb2x1bW4uY29tcGxleCA9ICdhcnJheSdcbiAgICAgICAgc2FtcGxlID0gXy52YWx1ZXMoXy5waWNrKGFsbFswXSwgY29sdW1uLmtleSkpXG4gICAgICAgIGlmIChzYW1wbGUubGVuZ3RoICE9PSBjb2x1bW4ua2V5Lmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29sdW1uIGtleSBkb2VzIG5vdCBleGlzdCBpbiBkYXRhIScsIGNvbHVtbi5rZXkpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNhbXBsZSA9IGFsbFswXVtjb2x1bW4ua2V5XVxuICAgICAgfVxuXG4gICAgICAvLyBJbmRleCBDb2x1bW5cbiAgICAgIGlmICghY29sdW1uLmNvbXBsZXggJiYgY29sdW1uLmtleSAhPT0gdHJ1ZSAmJiB0eXBlb2Ygc2FtcGxlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbHVtbiBrZXkgZG9lcyBub3QgZXhpc3QgaW4gZGF0YSEnLCBjb2x1bW4ua2V5KVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY29sdW1uIGV4aXN0cywgbGV0J3MgYXQgbGVhc3QgbWFrZSBzdXJlIGl0J3MgbWFya2VkXG4gICAgICAvLyBhcyBwZXJtYW5lbnQuIFRoZXJlIGlzIGEgc2xpZ2h0IGNoYW5jZSBpdCBleGlzdHMgYmVjYXVzZVxuICAgICAgLy8gb2YgYSBmaWx0ZXIsIGFuZCB0aGUgdXNlciBkZWNpZGVzIHRvIG1ha2UgaXQgcGVybWFuZW50XG5cbiAgICAgIGlmIChjb2x1bW4ua2V5ID09PSB0cnVlKSB7XG4gICAgICAgIGNvbHVtbi50eXBlID0gJ2FsbCdcbiAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmNvbXBsZXgpIHtcbiAgICAgICAgY29sdW1uLnR5cGUgPSAnY29tcGxleCdcbiAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmFycmF5KSB7XG4gICAgICAgIGNvbHVtbi50eXBlID0gJ2FycmF5J1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29sdW1uLnR5cGUgPSBnZXRUeXBlKHNhbXBsZSlcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGRpbWVuc2lvbi5tYWtlKGNvbHVtbi5rZXksIGNvbHVtbi50eXBlLCBjb2x1bW4uY29tcGxleClcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChkaW0pIHtcbiAgICAgIGNvbHVtbi5kaW1lbnNpb24gPSBkaW1cbiAgICAgIGNvbHVtbi5maWx0ZXJDb3VudCA9IDBcbiAgICAgIHZhciBzdG9wTGlzdGVuaW5nRm9yRGF0YSA9IHNlcnZpY2Uub25EYXRhQ2hhbmdlKGJ1aWxkQ29sdW1uS2V5cylcbiAgICAgIGNvbHVtbi5yZW1vdmVMaXN0ZW5lcnMgPSBbc3RvcExpc3RlbmluZ0ZvckRhdGFdXG5cbiAgICAgIHJldHVybiBidWlsZENvbHVtbktleXMoKVxuXG4gICAgICAvLyBCdWlsZCB0aGUgY29sdW1uS2V5c1xuICAgICAgZnVuY3Rpb24gYnVpbGRDb2x1bW5LZXlzKGNoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNvbHVtbi5rZXkgPT09IHRydWUpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY2Nlc3NvciA9IGRpbWVuc2lvbi5tYWtlQWNjZXNzb3IoY29sdW1uLmtleSwgY29sdW1uLmNvbXBsZXgpXG4gICAgICAgIGNvbHVtbi52YWx1ZXMgPSBjb2x1bW4udmFsdWVzIHx8IFtdXG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoY2hhbmdlcyAmJiBjaGFuZ2VzLmFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYW5nZXMuYWRkZWQpXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5ib3R0b20oSW5maW5pdHkpKVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocm93cykge1xuICAgICAgICAgIHZhciBuZXdWYWx1ZXNcbiAgICAgICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdzdHJpbmcnIHx8IGNvbHVtbi5jb21wbGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMgPSBfLm1hcChyb3dzLCBhY2Nlc3NvcilcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHJvd3MsIGFjY2Vzc29yLnRvU3RyaW5nKCksIG5ld1ZhbHVlcylcbiAgICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbi50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMgPSBfLmZsYXR0ZW4oXy5tYXAocm93cywgYWNjZXNzb3IpKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMgPSBfLm1hcChyb3dzLCBhY2Nlc3NvcilcbiAgICAgICAgICB9XG4gICAgICAgICAgY29sdW1uLnZhbHVlcyA9IF8udW5pcShjb2x1bW4udmFsdWVzLmNvbmNhdChuZXdWYWx1ZXMpKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gY29sdW1uLnByb21pc2VcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIHtcbiAgICBidWlsZDogYnVpbGQsXG4gICAgZ2VuZXJhdGVDb2x1bW5zOiBnZW5lcmF0ZUNvbHVtbnMsXG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gIH1cblxuICBmdW5jdGlvbiBidWlsZChjKSB7XG4gICAgaWYgKF8uaXNBcnJheShjKSkge1xuICAgICAgLy8gVGhpcyBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3Jvc3NmaWx0ZXIoYykpXG4gICAgfVxuICAgIGlmICghYyB8fCB0eXBlb2YgYy5kaW1lbnNpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIENyb3NzZmlsdGVyIGRhdGEgb3IgaW5zdGFuY2UgZm91bmQhJykpXG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYylcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlQ29sdW1ucyhkYXRhKSB7XG4gICAgaWYgKCFzZXJ2aWNlLm9wdGlvbnMuZ2VuZXJhdGVkQ29sdW1ucykge1xuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG4gICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uIChkLyogLCBpICovKSB7XG4gICAgICBfLmZvckVhY2goc2VydmljZS5vcHRpb25zLmdlbmVyYXRlZENvbHVtbnMsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICBkW2tleV0gPSB2YWwoZClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZFxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBhZGQoZGF0YSkge1xuICAgIGRhdGEgPSBnZW5lcmF0ZUNvbHVtbnMoZGF0YSlcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzZXJ2aWNlLmNmLmFkZChkYXRhKSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnNlcmlhbChfLm1hcChzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBsaXN0ZW5lcih7XG4gICAgICAgICAgICBhZGRlZDogZGF0YVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH0pKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YucmVtb3ZlKCkpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc2VydmljZVxuICAgIH0pXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxuLy8gdmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpIC8vIF8gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHJldHVybiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgIHJldHVybiBzZXJ2aWNlLmNsZWFyKClcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VydmljZS5jZi5kYXRhTGlzdGVuZXJzID0gW11cbiAgICAgICAgc2VydmljZS5jZi5maWx0ZXJMaXN0ZW5lcnMgPSBbXVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YucmVtb3ZlKCkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICByZXR1cm4ge1xuICAgIG1ha2U6IG1ha2UsXG4gICAgbWFrZUFjY2Vzc29yOiBtYWtlQWNjZXNzb3IsXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlKGtleSwgdHlwZSwgY29tcGxleCkge1xuICAgIHZhciBhY2Nlc3NvciA9IG1ha2VBY2Nlc3NvcihrZXksIGNvbXBsZXgpXG4gICAgLy8gUHJvbWlzZS5yZXNvbHZlIHdpbGwgaGFuZGxlIHByb21pc2VzIG9yIG5vbiBwcm9taXNlcywgc29cbiAgICAvLyB0aGlzIGNyb3NzZmlsdGVyIGFzeW5jIGlzIHN1cHBvcnRlZCBpZiBwcmVzZW50XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzZXJ2aWNlLmNmLmRpbWVuc2lvbihhY2Nlc3NvciwgdHlwZSA9PT0gJ2FycmF5JykpXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlQWNjZXNzb3Ioa2V5LCBjb21wbGV4KSB7XG4gICAgdmFyIGFjY2Vzc29yRnVuY3Rpb25cblxuICAgIGlmIChjb21wbGV4ID09PSAnc3RyaW5nJykge1xuICAgICAgYWNjZXNzb3JGdW5jdGlvbiA9IGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBfLmdldChkLCBrZXkpXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjb21wbGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID0ga2V5XG4gICAgfSBlbHNlIGlmIChjb21wbGV4ID09PSAnYXJyYXknKSB7XG4gICAgICB2YXIgYXJyYXlTdHJpbmcgPSBfLm1hcChrZXksIGZ1bmN0aW9uIChrKSB7XG4gICAgICAgIHJldHVybiAnZFtcXCcnICsgayArICdcXCddJ1xuICAgICAgfSlcbiAgICAgIGFjY2Vzc29yRnVuY3Rpb24gPSBuZXcgRnVuY3Rpb24oJ2QnLCBTdHJpbmcoJ3JldHVybiAnICsgSlNPTi5zdHJpbmdpZnkoYXJyYXlTdHJpbmcpLnJlcGxhY2UoL1wiL2csICcnKSkpICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lICBuby1uZXctZnVuY1xuICAgIH0gZWxzZSB7XG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID1cbiAgICAgICAgLy8gSW5kZXggRGltZW5zaW9uXG4gICAgICAgIGtleSA9PT0gdHJ1ZSA/IGZ1bmN0aW9uIGFjY2Vzc29yKGQsIGkpIHtcbiAgICAgICAgICByZXR1cm4gaVxuICAgICAgICB9IDpcbiAgICAgICAgLy8gVmFsdWUgQWNjZXNzb3IgRGltZW5zaW9uXG4gICAgICAgIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIGRba2V5XVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NvckZ1bmN0aW9uXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyB2YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIEdldHRlcnNcbiAgJGZpZWxkOiAkZmllbGQsXG4gIC8vIEJvb2xlYW5zXG4gICRhbmQ6ICRhbmQsXG4gICRvcjogJG9yLFxuICAkbm90OiAkbm90LFxuXG4gIC8vIEV4cHJlc3Npb25zXG4gICRlcTogJGVxLFxuICAkZ3Q6ICRndCxcbiAgJGd0ZTogJGd0ZSxcbiAgJGx0OiAkbHQsXG4gICRsdGU6ICRsdGUsXG4gICRuZTogJG5lLFxuICAkdHlwZTogJHR5cGUsXG5cbiAgLy8gQXJyYXkgRXhwcmVzc2lvbnNcbiAgJGluOiAkaW4sXG4gICRuaW46ICRuaW4sXG4gICRjb250YWluczogJGNvbnRhaW5zLFxuICAkZXhjbHVkZXM6ICRleGNsdWRlcyxcbiAgJHNpemU6ICRzaXplLFxufVxuXG4vLyBHZXR0ZXJzXG5mdW5jdGlvbiAkZmllbGQoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGRbY2hpbGRdXG59XG5cbi8vIE9wZXJhdG9yc1xuXG5mdW5jdGlvbiAkYW5kKGQsIGNoaWxkKSB7XG4gIGNoaWxkID0gY2hpbGQoZClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiAkb3IoZCwgY2hpbGQpIHtcbiAgY2hpbGQgPSBjaGlsZChkKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoaWxkW2ldKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gJG5vdChkLCBjaGlsZCkge1xuICBjaGlsZCA9IGNoaWxkKGQpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiAkZXEoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPT09IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGd0KGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID4gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkZ3RlKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID49IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGx0KGQsIGNoaWxkKSB7XG4gIHJldHVybiBkIDwgY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkbHRlKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkIDw9IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJG5lKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkICE9PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICR0eXBlKGQsIGNoaWxkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gY2hpbGQoKVxufVxuXG4vLyBBcnJheSBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiAkaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA+IC0xXG59XG5cbmZ1bmN0aW9uICRuaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA9PT0gLTFcbn1cblxuZnVuY3Rpb24gJGNvbnRhaW5zKGQsIGNoaWxkKSB7XG4gIHJldHVybiBjaGlsZCgpLmluZGV4T2YoZCkgPiAtMVxufVxuXG5mdW5jdGlvbiAkZXhjbHVkZXMoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGNoaWxkKCkuaW5kZXhPZihkKSA9PT0gLTFcbn1cblxuZnVuY3Rpb24gJHNpemUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQubGVuZ3RoID09PSBjaGlsZCgpXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG52YXIgZXhwcmVzc2lvbnMgPSByZXF1aXJlKCcuL2V4cHJlc3Npb25zJylcbnZhciBhZ2dyZWdhdGlvbiA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHJldHVybiB7XG4gICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgZmlsdGVyQWxsOiBmaWx0ZXJBbGwsXG4gICAgYXBwbHlGaWx0ZXJzOiBhcHBseUZpbHRlcnMsXG4gICAgbWFrZUZ1bmN0aW9uOiBtYWtlRnVuY3Rpb24sXG4gICAgc2NhbkZvckR5bmFtaWNGaWx0ZXJzOiBzY2FuRm9yRHluYW1pY0ZpbHRlcnNcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcihjb2x1bW4sIGZpbCwgaXNSYW5nZSwgcmVwbGFjZSkge1xuICAgIHJldHVybiBnZXRDb2x1bW4oY29sdW1uKVxuICAgIC50aGVuKGZ1bmN0aW9uIChjb2x1bW4pIHtcbiAgICAgIC8vIENsb25lIGEgY29weSBvZiB0aGUgbmV3IGZpbHRlcnNcbiAgICAgIHZhciBuZXdGaWx0ZXJzID0gXy5hc3NpZ24oe30sIHNlcnZpY2UuZmlsdGVycylcbiAgICAgIC8vIEhlcmUgd2UgdXNlIHRoZSByZWdpc3RlcmVkIGNvbHVtbiBrZXkgZGVzcGl0ZSB0aGUgZmlsdGVyIGtleSBwYXNzZWQsIGp1c3QgaW4gY2FzZSB0aGUgZmlsdGVyIGtleSdzIG9yZGVyaW5nIGlzIG9yZGVyZWQgZGlmZmVyZW50bHkgOilcbiAgICAgIHZhciBmaWx0ZXJLZXkgPSBjb2x1bW4ua2V5XG4gICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdhcnJheScpIHtcbiAgICAgICAgZmlsdGVyS2V5ID0gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSlcbiAgICAgIH1cbiAgICAgIGlmIChjb2x1bW4uY29tcGxleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmaWx0ZXJLZXkgPSBjb2x1bW4ua2V5LnRvU3RyaW5nKClcbiAgICAgIH1cbiAgICAgIC8vIEJ1aWxkIHRoZSBmaWx0ZXIgb2JqZWN0XG4gICAgICBuZXdGaWx0ZXJzW2ZpbHRlcktleV0gPSBidWlsZEZpbHRlck9iamVjdChmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpXG5cbiAgICAgIHJldHVybiBhcHBseUZpbHRlcnMobmV3RmlsdGVycylcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q29sdW1uKGNvbHVtbikge1xuICAgIHZhciBleGlzdHMgPSBzZXJ2aWNlLmNvbHVtbi5maW5kKGNvbHVtbilcbiAgICAvLyBJZiB0aGUgZmlsdGVycyBkaW1lbnNpb24gZG9lc24ndCBleGlzdCB5ZXQsIHRyeSBhbmQgY3JlYXRlIGl0XG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghZXhpc3RzKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAga2V5OiBjb2x1bW4sXG4gICAgICAgICAgdGVtcG9yYXJ5OiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gSXQgd2FzIGFibGUgdG8gYmUgY3JlYXRlZCwgc28gcmV0cmlldmUgYW5kIHJldHVybiBpdFxuICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbi5maW5kKGNvbHVtbilcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIC8vIEl0IGV4aXN0cywgc28ganVzdCByZXR1cm4gd2hhdCB3ZSBmb3VuZFxuICAgICAgcmV0dXJuIGV4aXN0c1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbGwoZmlscykge1xuICAgIC8vIElmIGVtcHR5LCByZW1vdmUgYWxsIGZpbHRlcnNcbiAgICBpZiAoIWZpbHMpIHtcbiAgICAgIHNlcnZpY2UuY29sdW1ucy5mb3JFYWNoKGZ1bmN0aW9uIChjb2wpIHtcbiAgICAgICAgY29sLmRpbWVuc2lvbi5maWx0ZXJBbGwoKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBhcHBseUZpbHRlcnMoe30pXG4gICAgfVxuXG4gICAgLy8gQ2xvbmUgYSBjb3B5IGZvciB0aGUgbmV3IGZpbHRlcnNcbiAgICB2YXIgbmV3RmlsdGVycyA9IF8uYXNzaWduKHt9LCBzZXJ2aWNlLmZpbHRlcnMpXG5cbiAgICB2YXIgZHMgPSBfLm1hcChmaWxzLCBmdW5jdGlvbiAoZmlsKSB7XG4gICAgICByZXR1cm4gZ2V0Q29sdW1uKGZpbC5jb2x1bW4pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChjb2x1bW4pIHtcbiAgICAgICAgICAvLyBIZXJlIHdlIHVzZSB0aGUgcmVnaXN0ZXJlZCBjb2x1bW4ga2V5IGRlc3BpdGUgdGhlIGZpbHRlciBrZXkgcGFzc2VkLCBqdXN0IGluIGNhc2UgdGhlIGZpbHRlciBrZXkncyBvcmRlcmluZyBpcyBvcmRlcmVkIGRpZmZlcmVudGx5IDopXG4gICAgICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICAgICAgLy8gQnVpbGQgdGhlIGZpbHRlciBvYmplY3RcbiAgICAgICAgICBuZXdGaWx0ZXJzW2ZpbHRlcktleV0gPSBidWlsZEZpbHRlck9iamVjdChmaWwudmFsdWUsIGZpbC5pc1JhbmdlLCBmaWwucmVwbGFjZSlcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGRzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYXBwbHlGaWx0ZXJzKG5ld0ZpbHRlcnMpXG4gICAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKSB7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQoZmlsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IGZpbCxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKF8uaXNPYmplY3QoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IG1ha2VGdW5jdGlvbihmaWwpLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgcmVwbGFjZTogaXNSYW5nZSB8fCByZXBsYWNlLFxuICAgICAgICB0eXBlOiBpc1JhbmdlID8gJ3JhbmdlJyA6ICdpbmNsdXNpdmUnLFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IGZpbCxcbiAgICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgICB0eXBlOiAnZXhhY3QnLFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5RmlsdGVycyhuZXdGaWx0ZXJzKSB7XG4gICAgdmFyIGRzID0gXy5tYXAobmV3RmlsdGVycywgZnVuY3Rpb24gKGZpbCwgaSkge1xuICAgICAgdmFyIGV4aXN0aW5nID0gc2VydmljZS5maWx0ZXJzW2ldXG4gICAgICAgIC8vIEZpbHRlcnMgYXJlIHRoZSBzYW1lLCBzbyBubyBjaGFuZ2UgaXMgbmVlZGVkIG9uIHRoaXMgY29sdW1uXG4gICAgICBpZiAoZmlsID09PSBleGlzdGluZykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIH1cbiAgICAgIHZhciBjb2x1bW5cbiAgICAgICAgLy8gUmV0cmlldmUgY29tcGxleCBjb2x1bW5zIGJ5IGRlY29kaW5nIHRoZSBjb2x1bW4ga2V5IGFzIGpzb25cbiAgICAgIGlmIChpLmNoYXJBdCgwKSA9PT0gJ1snKSB7XG4gICAgICAgIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoSlNPTi5wYXJzZShpKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHJpZXZlIHRoZSBjb2x1bW4gbm9ybWFsbHlcbiAgICAgICAgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChpKVxuICAgICAgfVxuXG4gICAgICAvLyBUb2dnbGluZyBhIGZpbHRlciB2YWx1ZSBpcyBhIGJpdCBkaWZmZXJlbnQgZnJvbSByZXBsYWNpbmcgdGhlbVxuICAgICAgaWYgKGZpbCAmJiBleGlzdGluZyAmJiAhZmlsLnJlcGxhY2UpIHtcbiAgICAgICAgbmV3RmlsdGVyc1tpXSA9IGZpbCA9IHRvZ2dsZUZpbHRlcnMoZmlsLCBleGlzdGluZylcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gZmlsdGVyLCByZW1vdmUgZXZlcnl0aGluZyBmcm9tIHRoZSBkaW1lbnNpb25cbiAgICAgIGlmICghZmlsKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0Jykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRXhhY3QoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyUmFuZ2UoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2luY2x1c2l2ZScpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbC52YWx1ZS5pbmRleE9mKGQpID4gLTFcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgICBpZiAoZmlsLnR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZpbC5mdW5jdGlvbikpXG4gICAgICB9XG4gICAgICAvLyBCeSBkZWZhdWx0IGlmIHNvbWV0aGluZyBjcmFwcyB1cCwganVzdCByZW1vdmUgYWxsIGZpbHRlcnNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGRzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgZmlsdGVycyBzYXRhdGVcbiAgICAgICAgc2VydmljZS5maWx0ZXJzID0gbmV3RmlsdGVyc1xuXG4gICAgICAgIC8vIFBsdWNrIGFuZCByZW1vdmUgZmFsc2V5IGZpbHRlcnMgZnJvbSB0aGUgbWl4XG4gICAgICAgIHZhciB0cnlSZW1vdmFsID0gW11cbiAgICAgICAgXy5mb3JFYWNoKHNlcnZpY2UuZmlsdGVycywgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgIHRyeVJlbW92YWwucHVzaCh7XG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gSWYgYW55IG9mIHRob3NlIGZpbHRlcnMgYXJlIHRoZSBsYXN0IGRlcGVuZGVuY3kgZm9yIHRoZSBjb2x1bW4sIHRoZW4gcmVtb3ZlIHRoZSBjb2x1bW5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHRyeVJlbW92YWwsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoKHYua2V5LmNoYXJBdCgwKSA9PT0gJ1snKSA/IEpTT04ucGFyc2Uodi5rZXkpIDogdi5rZXkpXG4gICAgICAgICAgaWYgKGNvbHVtbi50ZW1wb3JhcnkgJiYgIWNvbHVtbi5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5jbGVhcihjb2x1bW4ua2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBDYWxsIHRoZSBmaWx0ZXJMaXN0ZW5lcnMgYW5kIHdhaXQgZm9yIHRoZWlyIHJldHVyblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoc2VydmljZS5maWx0ZXJMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybiBsaXN0ZW5lcigpXG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVGaWx0ZXJzKGZpbCwgZXhpc3RpbmcpIHtcbiAgICAvLyBFeGFjdCBmcm9tIEluY2x1c2l2ZVxuICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgZmlsLnZhbHVlID0gXy54b3IoW2ZpbC52YWx1ZV0sIGV4aXN0aW5nLnZhbHVlKVxuICAgIH0gZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdpbmNsdXNpdmUnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdleGFjdCcpIHsgLy8gSW5jbHVzaXZlIGZyb20gRXhhY3RcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgW2V4aXN0aW5nLnZhbHVlXSlcbiAgICB9IGVsc2UgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykgeyAvLyBJbmNsdXNpdmUgLyBJbmNsdXNpdmUgTWVyZ2VcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWUpXG4gICAgfSBlbHNlIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnZXhhY3QnKSB7IC8vIEV4YWN0IC8gRXhhY3RcbiAgICAgIC8vIElmIHRoZSB2YWx1ZXMgYXJlIHRoZSBzYW1lLCByZW1vdmUgdGhlIGZpbHRlciBlbnRpcmVseVxuICAgICAgaWYgKGZpbC52YWx1ZSA9PT0gZXhpc3RpbmcudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICAvLyBUaGV5IHRoZXkgYXJlIGRpZmZlcmVudCwgbWFrZSBhbiBhcnJheVxuICAgICAgZmlsLnZhbHVlID0gW2ZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWVdXG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBuZXcgdHlwZSBiYXNlZCBvbiB0aGUgbWVyZ2VkIHZhbHVlc1xuICAgIGlmICghZmlsLnZhbHVlLmxlbmd0aCkge1xuICAgICAgZmlsID0gZmFsc2VcbiAgICB9IGVsc2UgaWYgKGZpbC52YWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgIGZpbC50eXBlID0gJ2V4YWN0J1xuICAgICAgZmlsLnZhbHVlID0gZmlsLnZhbHVlWzBdXG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbC50eXBlID0gJ2luY2x1c2l2ZSdcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsXG4gIH1cblxuICBmdW5jdGlvbiBzY2FuRm9yRHluYW1pY0ZpbHRlcnMocXVlcnkpIHtcbiAgICAvLyBIZXJlIHdlIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IHJlbGF0aXZlIHJlZmVyZW5jZXMgdG8gdGhlIHJhdyBkYXRhXG4gICAgLy8gYmVpbmcgdXNlZCBpbiB0aGUgZmlsdGVyLiBJZiBzbywgd2UgbmVlZCB0byBidWlsZCB0aG9zZSBkaW1lbnNpb25zIGFuZCBrZWVwXG4gICAgLy8gdGhlbSB1cGRhdGVkIHNvIHRoZSBmaWx0ZXJzIGNhbiBiZSByZWJ1aWx0IGlmIG5lZWRlZFxuICAgIC8vIFRoZSBzdXBwb3J0ZWQga2V5cyByaWdodCBub3cgYXJlOiAkY29sdW1uLCAkZGF0YVxuICAgIHZhciBjb2x1bW5zID0gW11cbiAgICB3YWxrKHF1ZXJ5LmZpbHRlcilcbiAgICByZXR1cm4gY29sdW1uc1xuXG4gICAgZnVuY3Rpb24gd2FsayhvYmopIHtcbiAgICAgIF8uZm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAvLyBmaW5kIHRoZSBkYXRhIHJlZmVyZW5jZXMsIGlmIGFueVxuICAgICAgICB2YXIgcmVmID0gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KVxuICAgICAgICBpZiAocmVmKSB7XG4gICAgICAgICAgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgfVxuICAgICAgICAgIC8vIGlmIGl0J3MgYSBzdHJpbmdcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgIHJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCB2YWwpXG4gICAgICAgICAgaWYgKHJlZikge1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgaXQncyBhbm90aGVyIG9iamVjdCwga2VlcCBsb29raW5nXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICB3YWxrKHZhbClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kRGF0YVJlZmVyZW5jZXModmFsLCBrZXkpIHtcbiAgICAvLyBsb29rIGZvciB0aGUgJGRhdGEgc3RyaW5nIGFzIGEgdmFsdWVcbiAgICBpZiAoa2V5ID09PSAnJGRhdGEnKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIGxvb2sgZm9yIHRoZSAkY29sdW1uIGtleSBhbmQgaXQncyB2YWx1ZSBhcyBhIHN0cmluZ1xuICAgIGlmIChrZXkgJiYga2V5ID09PSAnJGNvbHVtbicpIHtcbiAgICAgIGlmIChfLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgcmV0dXJuIHZhbFxuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKCdUaGUgdmFsdWUgZm9yIGZpbHRlciBcIiRjb2x1bW5cIiBtdXN0IGJlIGEgdmFsaWQgY29sdW1uIGtleScsIHZhbClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VGdW5jdGlvbihvYmosIGlzQWdncmVnYXRpb24pIHtcbiAgICB2YXIgc3ViR2V0dGVyc1xuXG4gICAgLy8gRGV0ZWN0IHJhdyAkZGF0YSByZWZlcmVuY2VcbiAgICBpZiAoXy5pc1N0cmluZyhvYmopKSB7XG4gICAgICB2YXIgZGF0YVJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCBvYmopXG4gICAgICBpZiAoZGF0YVJlZikge1xuICAgICAgICB2YXIgZGF0YSA9IHNlcnZpY2UuY2YuYWxsKClcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzTnVtYmVyKG9iaikgfHwgXy5pc0Jvb2xlYW4ob2JqKSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zLiRlcShkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIG9ialxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGFuIGFycmF5LCByZWN1cnNlIGludG8gZWFjaCBpdGVtIGFuZCByZXR1cm4gYXMgYSBtYXBcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcbiAgICAgIHN1YkdldHRlcnMgPSBfLm1hcChvYmosIGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIHJldHVybiBtYWtlRnVuY3Rpb24obywgaXNBZ2dyZWdhdGlvbilcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHN1YkdldHRlcnMubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgcmV0dXJuIHMoZClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBvYmplY3QsIHJldHVybiBhIHJlY3Vyc2lvbiBmdW5jdGlvbiB0aGF0IGl0c2VsZiwgcmV0dXJucyB0aGUgcmVzdWx0cyBvZiBhbGwgb2YgdGhlIG9iamVjdCBrZXlzXG4gICAgaWYgKF8uaXNPYmplY3Qob2JqKSkge1xuICAgICAgc3ViR2V0dGVycyA9IF8ubWFwKG9iaiwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgIC8vIEdldCB0aGUgY2hpbGRcbiAgICAgICAgdmFyIGdldFN1YiA9IG1ha2VGdW5jdGlvbih2YWwsIGlzQWdncmVnYXRpb24pXG5cbiAgICAgICAgLy8gRGV0ZWN0IHJhdyAkY29sdW1uIHJlZmVyZW5jZXNcbiAgICAgICAgdmFyIGRhdGFSZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXModmFsLCBrZXkpXG4gICAgICAgIGlmIChkYXRhUmVmKSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoZGF0YVJlZilcbiAgICAgICAgICB2YXIgZGF0YSA9IGNvbHVtbi52YWx1ZXNcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBleHByZXNzaW9uLCBwYXNzIHRoZSBwYXJlbnRWYWx1ZSBhbmQgdGhlIHN1YkdldHRlclxuICAgICAgICBpZiAoZXhwcmVzc2lvbnNba2V5XSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zW2tleV0oZCwgZ2V0U3ViKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZ2dyZWdhdG9yT2JqID0gYWdncmVnYXRpb24ucGFyc2VBZ2dyZWdhdG9yUGFyYW1zKGtleSlcbiAgICAgICAgaWYgKGFnZ3JlZ2F0b3JPYmopIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBhbnkgZnVydGhlciBvcGVyYXRpb25zIGFyZSBmb3IgYWdncmVnYXRpb25zXG4gICAgICAgICAgLy8gYW5kIG5vdCBmaWx0ZXJzXG4gICAgICAgICAgaXNBZ2dyZWdhdGlvbiA9IHRydWVcbiAgICAgICAgICAgIC8vIGhlcmUgd2UgcGFzcyB0cnVlIHRvIG1ha2VGdW5jdGlvbiB3aGljaCBkZW5vdGVzIHRoYXRcbiAgICAgICAgICAgIC8vIGFuIGFnZ3JlZ2F0aW5vIGNoYWluIGhhcyBzdGFydGVkIGFuZCB0byBzdG9wIHVzaW5nICRBTkRcbiAgICAgICAgICBnZXRTdWIgPSBtYWtlRnVuY3Rpb24odmFsLCBpc0FnZ3JlZ2F0aW9uKVxuICAgICAgICAgICAgLy8gSWYgaXQncyBhbiBhZ2dyZWdhdGlvbiBvYmplY3QsIGJlIHN1cmUgdG8gcGFzcyBpbiB0aGUgY2hpbGRyZW4sIGFuZCB0aGVuIGFueSBhZGRpdGlvbmFsIHBhcmFtcyBwYXNzZWQgaW50byB0aGUgYWdncmVnYXRpb24gc3RyaW5nXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdG9yT2JqLmFnZ3JlZ2F0b3IuYXBwbHkobnVsbCwgW2dldFN1YigpXS5jb25jYXQoYWdncmVnYXRvck9iai5wYXJhbXMpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0IG11c3QgYmUgYSBzdHJpbmcgdGhlbi4gUGx1Y2sgdGhhdCBzdHJpbmcga2V5IGZyb20gcGFyZW50LCBhbmQgcGFzcyBpdCBhcyB0aGUgbmV3IHZhbHVlIHRvIHRoZSBzdWJHZXR0ZXJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgZCA9IGRba2V5XVxuICAgICAgICAgIHJldHVybiBnZXRTdWIoZCwgZ2V0U3ViKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBBbGwgb2JqZWN0IGV4cHJlc3Npb25zIGFyZSBiYXNpY2FsbHkgQU5EJ3NcbiAgICAgIC8vIFJldHVybiBBTkQgd2l0aCBhIG1hcCBvZiB0aGUgc3ViR2V0dGVyc1xuICAgICAgaWYgKGlzQWdncmVnYXRpb24pIHtcbiAgICAgICAgaWYgKHN1YkdldHRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ViR2V0dGVyc1swXShkKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICByZXR1cm4gXy5tYXAoc3ViR2V0dGVycywgZnVuY3Rpb24gKGdldFN1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YihkKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbnMuJGFuZChkLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHJldHVybiBfLm1hcChzdWJHZXR0ZXJzLCBmdW5jdGlvbiAoZ2V0U3ViKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3ViKGQpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnbm8gZXhwcmVzc2lvbiBmb3VuZCBmb3IgJywgb2JqKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iLCIvKiBlc2xpbnQgbm8tcHJvdG90eXBlLWJ1aWx0aW5zOiAwICovXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2lnbjogYXNzaWduLFxuICBmaW5kOiBmaW5kLFxuICByZW1vdmU6IHJlbW92ZSxcbiAgaXNBcnJheTogaXNBcnJheSxcbiAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICBpc0Jvb2xlYW46IGlzQm9vbGVhbixcbiAgaXNTdHJpbmc6IGlzU3RyaW5nLFxuICBpc051bWJlcjogaXNOdW1iZXIsXG4gIGlzRnVuY3Rpb246IGlzRnVuY3Rpb24sXG4gIGdldDogZ2V0LFxuICBzZXQ6IHNldCxcbiAgbWFwOiBtYXAsXG4gIGtleXM6IGtleXMsXG4gIHNvcnRCeTogc29ydEJ5LFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBpc1VuZGVmaW5lZDogaXNVbmRlZmluZWQsXG4gIHBpY2s6IHBpY2ssXG4gIHhvcjogeG9yLFxuICBjbG9uZTogY2xvbmUsXG4gIGlzRXF1YWw6IGlzRXF1YWwsXG4gIHJlcGxhY2VBcnJheTogcmVwbGFjZUFycmF5LFxuICB1bmlxOiB1bmlxLFxuICBmbGF0dGVuOiBmbGF0dGVuLFxuICBzb3J0OiBzb3J0LFxuICB2YWx1ZXM6IHZhbHVlcyxcbiAgcmVjdXJzZU9iamVjdDogcmVjdXJzZU9iamVjdCxcbn1cblxuZnVuY3Rpb24gYXNzaWduKG91dCkge1xuICBvdXQgPSBvdXQgfHwge31cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWFyZ3VtZW50c1tpXSkge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIG91dFtrZXldID0gYXJndW1lbnRzW2ldW2tleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBmaW5kKGEsIGIpIHtcbiAgcmV0dXJuIGEuZmluZChiKVxufVxuXG5mdW5jdGlvbiByZW1vdmUoYSwgYikge1xuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24gKG8sIGkpIHtcbiAgICB2YXIgciA9IGIobylcbiAgICBpZiAocikge1xuICAgICAgYS5zcGxpY2UoaSwgMSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSlcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdvYmplY3QnICYmICFpc0FycmF5KGQpXG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ2Jvb2xlYW4nXG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGQpIHtcbiAgcmV0dXJuIHR5cGVvZiBkID09PSAnc3RyaW5nJ1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhKSB7XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJ1xufVxuXG5mdW5jdGlvbiBnZXQoYSwgYikge1xuICBpZiAoaXNBcnJheShiKSkge1xuICAgIGIgPSBiLmpvaW4oJy4nKVxuICB9XG4gIHJldHVybiBiXG4gICAgLnJlcGxhY2UoJ1snLCAnLicpLnJlcGxhY2UoJ10nLCAnJylcbiAgICAuc3BsaXQoJy4nKVxuICAgIC5yZWR1Y2UoXG4gICAgICBmdW5jdGlvbiAob2JqLCBwcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gb2JqW3Byb3BlcnR5XVxuICAgICAgfSwgYVxuICAgIClcbn1cblxuZnVuY3Rpb24gc2V0KG9iaiwgcHJvcCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwcm9wID09PSAnc3RyaW5nJykge1xuICAgIHByb3AgPSBwcm9wXG4gICAgICAucmVwbGFjZSgnWycsICcuJykucmVwbGFjZSgnXScsICcnKVxuICAgICAgLnNwbGl0KCcuJylcbiAgfVxuICBpZiAocHJvcC5sZW5ndGggPiAxKSB7XG4gICAgdmFyIGUgPSBwcm9wLnNoaWZ0KClcbiAgICBhc3NpZ24ob2JqW2VdID1cbiAgICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpbZV0pID09PSAnW29iamVjdCBPYmplY3RdJyA/IG9ialtlXSA6IHt9LFxuICAgICAgcHJvcCxcbiAgICAgIHZhbHVlKVxuICB9IGVsc2Uge1xuICAgIG9ialtwcm9wWzBdXSA9IHZhbHVlXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFwKGEsIGIpIHtcbiAgdmFyIG1cbiAgdmFyIGtleVxuICBpZiAoaXNGdW5jdGlvbihiKSkge1xuICAgIGlmIChpc09iamVjdChhKSkge1xuICAgICAgbSA9IFtdXG4gICAgICBmb3IgKGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBtLnB1c2goYihhW2tleV0sIGtleSwgYSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtXG4gICAgfVxuICAgIHJldHVybiBhLm1hcChiKVxuICB9XG4gIGlmIChpc09iamVjdChhKSkge1xuICAgIG0gPSBbXVxuICAgIGZvciAoa2V5IGluIGEpIHtcbiAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbS5wdXNoKGFba2V5XSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1cbiAgfVxuICByZXR1cm4gYS5tYXAoZnVuY3Rpb24gKGFhKSB7XG4gICAgcmV0dXJuIGFhW2JdXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGtleXMob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopXG59XG5cbmZ1bmN0aW9uIHNvcnRCeShhLCBiKSB7XG4gIGlmIChpc0Z1bmN0aW9uKGIpKSB7XG4gICAgcmV0dXJuIGEuc29ydChmdW5jdGlvbiAoYWEsIGJiKSB7XG4gICAgICBpZiAoYihhYSkgPiBiKGJiKSkge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfVxuICAgICAgaWYgKGIoYWEpIDwgYihiYikpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICAvLyBhIG11c3QgYmUgZXF1YWwgdG8gYlxuICAgICAgcmV0dXJuIDBcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2goYSwgYikge1xuICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgaWYgKGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBiKGFba2V5XSwga2V5LCBhKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXNBcnJheShhKSkge1xuICAgIHJldHVybiBhLmZvckVhY2goYilcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhKSB7XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gJ3VuZGVmaW5lZCdcbn1cblxuZnVuY3Rpb24gcGljayhhLCBiKSB7XG4gIHZhciBjID0ge31cbiAgZm9yRWFjaChiLCBmdW5jdGlvbiAoYmIpIHtcbiAgICBpZiAodHlwZW9mIGFbYmJdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY1tiYl0gPSBhW2JiXVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGNcbn1cblxuZnVuY3Rpb24geG9yKGEsIGIpIHtcbiAgdmFyIHVuaXF1ZSA9IFtdXG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKGFhKSB7XG4gICAgaWYgKGIuaW5kZXhPZihhYSkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5pcXVlLnB1c2goYWEpXG4gICAgfVxuICB9KVxuICBmb3JFYWNoKGIsIGZ1bmN0aW9uIChiYikge1xuICAgIGlmIChhLmluZGV4T2YoYmIpID09PSAtMSkge1xuICAgICAgcmV0dXJuIHVuaXF1ZS5wdXNoKGJiKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHVuaXF1ZVxufVxuXG5mdW5jdGlvbiBjbG9uZShhKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGEsIGZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfSkpXG59XG5cbmZ1bmN0aW9uIGlzRXF1YWwoeCwgeSkge1xuICBpZiAoKHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsKSAmJiAodHlwZW9mIHkgPT09ICdvYmplY3QnICYmIHkgIT09IG51bGwpKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHgpLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoeSkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHgpIHtcbiAgICAgIGlmICh5Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmICghaXNFcXVhbCh4W3Byb3BdLCB5W3Byb3BdKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9IGVsc2UgaWYgKHggIT09IHkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiByZXBsYWNlQXJyYXkoYSwgYikge1xuICB2YXIgYWwgPSBhLmxlbmd0aFxuICB2YXIgYmwgPSBiLmxlbmd0aFxuICBpZiAoYWwgPiBibCkge1xuICAgIGEuc3BsaWNlKGJsLCBhbCAtIGJsKVxuICB9IGVsc2UgaWYgKGFsIDwgYmwpIHtcbiAgICBhLnB1c2guYXBwbHkoYSwgbmV3IEFycmF5KGJsIC0gYWwpKVxuICB9XG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgYVtrZXldID0gYltrZXldXG4gIH0pXG4gIHJldHVybiBhXG59XG5cbmZ1bmN0aW9uIHVuaXEoYSkge1xuICB2YXIgc2VlbiA9IG5ldyBTZXQoKVxuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB2YXIgYWxsb3cgPSBmYWxzZVxuICAgIGlmICghc2Vlbi5oYXMoaXRlbSkpIHtcbiAgICAgIHNlZW4uYWRkKGl0ZW0pXG4gICAgICBhbGxvdyA9IHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGFsbG93XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW4oYWEpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWEubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY3VycmVudCA9IGFhW2ldXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBjdXJyZW50Lmxlbmd0aDsgKytqKSB7XG4gICAgICBmbGF0dGVuZWQucHVzaChjdXJyZW50W2pdKVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmxhdHRlbmVkXG59XG5cbmZ1bmN0aW9uIHNvcnQoYXJyKSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRtcCA9IGFycltpXVxuICAgIHZhciBqID0gaVxuICAgIHdoaWxlIChhcnJbaiAtIDFdID4gdG1wKSB7XG4gICAgICBhcnJbal0gPSBhcnJbaiAtIDFdO1xuICAgICAgLS1qXG4gICAgfVxuICAgIGFycltqXSA9IHRtcFxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB2YWx1ZXMoYSkge1xuICB2YXIgdmFsdWVzID0gW11cbiAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICBpZiAoYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB2YWx1ZXMucHVzaChhW2tleV0pXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZXNcbn1cblxuZnVuY3Rpb24gcmVjdXJzZU9iamVjdChvYmosIGNiKSB7XG4gIF9yZWN1cnNlT2JqZWN0KG9iaiwgW10pXG4gIHJldHVybiBvYmpcbiAgZnVuY3Rpb24gX3JlY3Vyc2VPYmplY3Qob2JqLCBwYXRoKSB7XG4gICAgZm9yICh2YXIgayBpbiBvYmopIHsgLy8gIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICB2YXIgbmV3UGF0aCA9IGNsb25lKHBhdGgpXG4gICAgICBuZXdQYXRoLnB1c2goaylcbiAgICAgIGlmICh0eXBlb2Ygb2JqW2tdID09PSAnb2JqZWN0JyAmJiBvYmpba10gIT09IG51bGwpIHtcbiAgICAgICAgX3JlY3Vyc2VPYmplY3Qob2JqW2tdLCBuZXdQYXRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGNiKG9ialtrXSwgaywgbmV3UGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbnZhciBhZ2dyZWdhdGlvbiA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgvKiBzZXJ2aWNlICovKSB7XG4gIHJldHVybiB7XG4gICAgcG9zdDogcG9zdCxcbiAgICBzb3J0QnlLZXk6IHNvcnRCeUtleSxcbiAgICBsaW1pdDogbGltaXQsXG4gICAgc3F1YXNoOiBzcXVhc2gsXG4gICAgY2hhbmdlOiBjaGFuZ2UsXG4gICAgY2hhbmdlTWFwOiBjaGFuZ2VNYXAsXG4gIH1cblxuICBmdW5jdGlvbiBwb3N0KHF1ZXJ5LCBwYXJlbnQsIGNiKSB7XG4gICAgcXVlcnkuZGF0YSA9IGNsb25lSWZMb2NrZWQocGFyZW50KVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2IocXVlcnksIHBhcmVudCkpXG4gIH1cblxuICBmdW5jdGlvbiBzb3J0QnlLZXkocXVlcnksIHBhcmVudCwgZGVzYykge1xuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBxdWVyeS5kYXRhID0gXy5zb3J0QnkocXVlcnkuZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLmtleVxuICAgIH0pXG4gICAgaWYgKGRlc2MpIHtcbiAgICAgIHF1ZXJ5LmRhdGEucmV2ZXJzZSgpXG4gICAgfVxuICB9XG5cbiAgLy8gTGltaXQgcmVzdWx0cyB0byBuLCBvciBmcm9tIHN0YXJ0IHRvIGVuZFxuICBmdW5jdGlvbiBsaW1pdChxdWVyeSwgcGFyZW50LCBzdGFydCwgZW5kKSB7XG4gICAgcXVlcnkuZGF0YSA9IGNsb25lSWZMb2NrZWQocGFyZW50KVxuICAgIGlmIChfLmlzVW5kZWZpbmVkKGVuZCkpIHtcbiAgICAgIGVuZCA9IHN0YXJ0IHx8IDBcbiAgICAgIHN0YXJ0ID0gMFxuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IHN0YXJ0IHx8IDBcbiAgICAgIGVuZCA9IGVuZCB8fCBxdWVyeS5kYXRhLmxlbmd0aFxuICAgIH1cbiAgICBxdWVyeS5kYXRhID0gcXVlcnkuZGF0YS5zcGxpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0KVxuICB9XG5cbiAgLy8gU3F1YXNoIHJlc3VsdHMgdG8gbiwgb3IgZnJvbSBzdGFydCB0byBlbmRcbiAgZnVuY3Rpb24gc3F1YXNoKHF1ZXJ5LCBwYXJlbnQsIHN0YXJ0LCBlbmQsIGFnZ09iaiwgbGFiZWwpIHtcbiAgICBxdWVyeS5kYXRhID0gY2xvbmVJZkxvY2tlZChwYXJlbnQpXG4gICAgc3RhcnQgPSBzdGFydCB8fCAwXG4gICAgZW5kID0gZW5kIHx8IHF1ZXJ5LmRhdGEubGVuZ3RoXG4gICAgdmFyIHRvU3F1YXNoID0gcXVlcnkuZGF0YS5zcGxpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0KVxuICAgIHZhciBzcXVhc2hlZCA9IHtcbiAgICAgIGtleTogbGFiZWwgfHwgJ090aGVyJyxcbiAgICAgIHZhbHVlOiB7fVxuICAgIH1cbiAgICBfLnJlY3Vyc2VPYmplY3QoYWdnT2JqLCBmdW5jdGlvbiAodmFsLCBrZXksIHBhdGgpIHtcbiAgICAgIHZhciBpdGVtcyA9IFtdXG4gICAgICBfLmZvckVhY2godG9TcXVhc2gsIGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgaXRlbXMucHVzaChfLmdldChyZWNvcmQudmFsdWUsIHBhdGgpKVxuICAgICAgfSlcbiAgICAgIF8uc2V0KHNxdWFzaGVkLnZhbHVlLCBwYXRoLCBhZ2dyZWdhdGlvbi5hZ2dyZWdhdG9yc1t2YWxdKGl0ZW1zKSlcbiAgICB9KVxuICAgIHF1ZXJ5LmRhdGEuc3BsaWNlKHN0YXJ0LCAwLCBzcXVhc2hlZClcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZShxdWVyeSwgcGFyZW50LCBzdGFydCwgZW5kLCBhZ2dPYmopIHtcbiAgICBxdWVyeS5kYXRhID0gY2xvbmVJZkxvY2tlZChwYXJlbnQpXG4gICAgc3RhcnQgPSBzdGFydCB8fCAwXG4gICAgZW5kID0gZW5kIHx8IHF1ZXJ5LmRhdGEubGVuZ3RoXG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGtleTogW3F1ZXJ5LmRhdGFbc3RhcnRdLmtleSwgcXVlcnkuZGF0YVtlbmRdLmtleV0sXG4gICAgICB2YWx1ZToge31cbiAgICB9XG4gICAgXy5yZWN1cnNlT2JqZWN0KGFnZ09iaiwgZnVuY3Rpb24gKHZhbCwga2V5LCBwYXRoKSB7XG4gICAgICB2YXIgY2hhbmdlUGF0aCA9IF8uY2xvbmUocGF0aClcbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIF8uc2V0KG9iai52YWx1ZSwgY2hhbmdlUGF0aCwgXy5nZXQocXVlcnkuZGF0YVtlbmRdLnZhbHVlLCBwYXRoKSAtIF8uZ2V0KHF1ZXJ5LmRhdGFbc3RhcnRdLnZhbHVlLCBwYXRoKSlcbiAgICB9KVxuICAgIHF1ZXJ5LmRhdGEgPSBvYmpcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZU1hcChxdWVyeSwgcGFyZW50LCBhZ2dPYmosIGRlZmF1bHROdWxsKSB7XG4gICAgZGVmYXVsdE51bGwgPSBfLmlzVW5kZWZpbmVkKGRlZmF1bHROdWxsKSA/IDAgOiBkZWZhdWx0TnVsbFxuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBfLnJlY3Vyc2VPYmplY3QoYWdnT2JqLCBmdW5jdGlvbiAodmFsLCBrZXksIHBhdGgpIHtcbiAgICAgIHZhciBjaGFuZ2VQYXRoID0gXy5jbG9uZShwYXRoKVxuICAgICAgdmFyIGZyb21TdGFydFBhdGggPSBfLmNsb25lKHBhdGgpXG4gICAgICB2YXIgZnJvbUVuZFBhdGggPSBfLmNsb25lKHBhdGgpXG5cbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGZyb21TdGFydFBhdGgucG9wKClcbiAgICAgIGZyb21FbmRQYXRoLnBvcCgpXG5cbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIGZyb21TdGFydFBhdGgucHVzaChrZXkgKyAnQ2hhbmdlRnJvbVN0YXJ0JylcbiAgICAgIGZyb21FbmRQYXRoLnB1c2goa2V5ICsgJ0NoYW5nZUZyb21FbmQnKVxuXG4gICAgICB2YXIgc3RhcnQgPSBfLmdldChxdWVyeS5kYXRhWzBdLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbClcbiAgICAgIHZhciBlbmQgPSBfLmdldChxdWVyeS5kYXRhW3F1ZXJ5LmRhdGEubGVuZ3RoIC0gMV0udmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKVxuXG4gICAgICBfLmZvckVhY2gocXVlcnkuZGF0YSwgZnVuY3Rpb24gKHJlY29yZCwgaSkge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSBxdWVyeS5kYXRhW2kgLSAxXSB8fCBxdWVyeS5kYXRhWzBdXG4gICAgICAgIF8uc2V0KHF1ZXJ5LmRhdGFbaV0udmFsdWUsIGNoYW5nZVBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gKHByZXZpb3VzID8gXy5nZXQocHJldmlvdXMudmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKSA6IGRlZmF1bHROdWxsKSlcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbVN0YXJ0UGF0aCwgXy5nZXQocmVjb3JkLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbCkgLSBzdGFydClcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbUVuZFBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gZW5kKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNsb25lSWZMb2NrZWQocGFyZW50KSB7XG4gIHJldHVybiBwYXJlbnQubG9ja2VkID8gXy5jbG9uZShwYXJlbnQuZGF0YSkgOiBwYXJlbnQuZGF0YVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxuUHJvbWlzZS5zZXJpYWwgPSBzZXJpYWxcblxudmFyIGlzUHJvbWlzZUxpa2UgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgXy5pc0Z1bmN0aW9uKG9iai50aGVuKVxufVxuXG5mdW5jdGlvbiBzZXJpYWwodGFza3MpIHtcbiAgLy8gRmFrZSBhIFwicHJldmlvdXMgdGFza1wiIGZvciBvdXIgaW5pdGlhbCBpdGVyYXRpb25cbiAgdmFyIHByZXZQcm9taXNlXG4gIHZhciBlcnJvciA9IG5ldyBFcnJvcigpXG4gIF8uZm9yRWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2ssIGtleSkge1xuICAgIHZhciBzdWNjZXNzID0gdGFzay5zdWNjZXNzIHx8IHRhc2tcbiAgICB2YXIgZmFpbCA9IHRhc2suZmFpbFxuICAgIHZhciBub3RpZnkgPSB0YXNrLm5vdGlmeVxuICAgIHZhciBuZXh0UHJvbWlzZVxuXG4gICAgLy8gRmlyc3QgdGFza1xuICAgIGlmICghcHJldlByb21pc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZWdhdGVkLWNvbmRpdGlvblxuICAgICAgbmV4dFByb21pc2UgPSBzdWNjZXNzKClcbiAgICAgIGlmICghaXNQcm9taXNlTGlrZShuZXh0UHJvbWlzZSkpIHtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9ICdUYXNrICcgKyBrZXkgKyAnIGRpZCBub3QgcmV0dXJuIGEgcHJvbWlzZS4nXG4gICAgICAgIHRocm93IGVycm9yXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdhaXQgdW50aWwgdGhlIHByZXZpb3VzIHByb21pc2UgaGFzIHJlc29sdmVkIG9yIHJlamVjdGVkIHRvIGV4ZWN1dGUgdGhlIG5leHQgdGFza1xuICAgICAgbmV4dFByb21pc2UgPSBwcmV2UHJvbWlzZS50aGVuKFxuICAgICAgICAvKiBzdWNjZXNzICovXG4gICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmV0ID0gc3VjY2VzcyhkYXRhKVxuICAgICAgICAgIGlmICghaXNQcm9taXNlTGlrZShyZXQpKSB7XG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gJ1Rhc2sgJyArIGtleSArICcgZGlkIG5vdCByZXR1cm4gYSBwcm9taXNlLidcbiAgICAgICAgICAgIHRocm93IGVycm9yXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgfSxcbiAgICAgICAgLyogZmFpbHVyZSAqL1xuICAgICAgICBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgaWYgKCFmYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QocmVhc29uKVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmV0ID0gZmFpbChyZWFzb24pXG4gICAgICAgICAgaWYgKCFpc1Byb21pc2VMaWtlKHJldCkpIHtcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgPSAnRmFpbCBmb3IgdGFzayAnICsga2V5ICsgJyBkaWQgbm90IHJldHVybiBhIHByb21pc2UuJ1xuICAgICAgICAgICAgdGhyb3cgZXJyb3JcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFxuICAgICAgICB9LFxuICAgICAgICBub3RpZnkpXG4gICAgfVxuICAgIHByZXZQcm9taXNlID0gbmV4dFByb21pc2VcbiAgfSlcblxuICByZXR1cm4gcHJldlByb21pc2UgfHwgUHJvbWlzZS53aGVuKClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgdmFyIHJlZHVjdGlvZnkgPSByZXF1aXJlKCcuL3JlZHVjdGlvZnknKShzZXJ2aWNlKVxuICB2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpXG4gIHZhciBwb3N0QWdncmVnYXRpb24gPSByZXF1aXJlKCcuL3Bvc3RBZ2dyZWdhdGlvbicpKHNlcnZpY2UpXG5cbiAgdmFyIHBvc3RBZ2dyZWdhdGlvbk1ldGhvZHMgPSBfLmtleXMocG9zdEFnZ3JlZ2F0aW9uKVxuXG4gIHJldHVybiBmdW5jdGlvbiBkb1F1ZXJ5KHF1ZXJ5T2JqKSB7XG4gICAgdmFyIHF1ZXJ5SGFzaCA9IEpTT04uc3RyaW5naWZ5KHF1ZXJ5T2JqKVxuXG4gICAgLy8gQXR0ZW1wdCB0byByZXVzZSBhbiBleGFjdCBjb3B5IG9mIHRoaXMgcXVlcnkgdGhhdCBpcyBwcmVzZW50IGVsc2V3aGVyZVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VydmljZS5jb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNlcnZpY2UuY29sdW1uc1tpXS5xdWVyaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChzZXJ2aWNlLmNvbHVtbnNbaV0ucXVlcmllc1tqXS5oYXNoID09PSBxdWVyeUhhc2gpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvb3AtZnVuY1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uc1tpXS5xdWVyaWVzW2pdXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBxdWVyeSA9IHtcbiAgICAgIC8vIE9yaWdpbmFsIHF1ZXJ5IHBhc3NlZCBpbiB0byBxdWVyeSBtZXRob2RcbiAgICAgIG9yaWdpbmFsOiBxdWVyeU9iaixcbiAgICAgIGhhc2g6IHF1ZXJ5SGFzaFxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgcXVlcnlPYmpcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbCkpIHtcbiAgICAgIHF1ZXJ5Lm9yaWdpbmFsID0ge31cbiAgICB9XG4gICAgLy8gRGVmYXVsdCBzZWxlY3RcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbC5zZWxlY3QpKSB7XG4gICAgICBxdWVyeS5vcmlnaW5hbC5zZWxlY3QgPSB7XG4gICAgICAgICRjb3VudDogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBEZWZhdWx0IHRvIGdyb3VwQWxsXG4gICAgcXVlcnkub3JpZ2luYWwuZ3JvdXBCeSA9IHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkgfHwgdHJ1ZVxuXG4gICAgLy8gQXR0YWNoIHRoZSBxdWVyeSBhcGkgdG8gdGhlIHF1ZXJ5IG9iamVjdFxuICAgIHF1ZXJ5ID0gbmV3UXVlcnlPYmoocXVlcnkpXG5cbiAgICByZXR1cm4gY3JlYXRlQ29sdW1uKHF1ZXJ5KVxuICAgICAgLnRoZW4obWFrZUNyb3NzZmlsdGVyR3JvdXApXG4gICAgICAudGhlbihidWlsZFJlcXVpcmVkQ29sdW1ucylcbiAgICAgIC50aGVuKHNldHVwRGF0YUxpc3RlbmVycylcbiAgICAgIC50aGVuKGFwcGx5UXVlcnkpXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb2x1bW4ocXVlcnkpIHtcbiAgICAgIC8vIEVuc3VyZSBjb2x1bW4gaXMgY3JlYXRlZFxuICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAga2V5OiBxdWVyeS5vcmlnaW5hbC5ncm91cEJ5LFxuICAgICAgICB0eXBlOiBfLmlzVW5kZWZpbmVkKHF1ZXJ5LnR5cGUpID8gbnVsbCA6IHF1ZXJ5LnR5cGUsXG4gICAgICAgIGFycmF5OiBCb29sZWFuKHF1ZXJ5LmFycmF5KVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQXR0YWNoIHRoZSBjb2x1bW4gdG8gdGhlIHF1ZXJ5XG4gICAgICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkpXG4gICAgICAgIHF1ZXJ5LmNvbHVtbiA9IGNvbHVtblxuICAgICAgICBjb2x1bW4ucXVlcmllcy5wdXNoKHF1ZXJ5KVxuICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeS5jbGVhcigpXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQ3Jvc3NmaWx0ZXJHcm91cChxdWVyeSkge1xuICAgICAgLy8gQ3JlYXRlIHRoZSBncm91cGluZyBvbiB0aGUgY29sdW1ucyBkaW1lbnNpb25cbiAgICAgIC8vIFVzaW5nIFByb21pc2UgUmVzb2x2ZSBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgIC8vIFRPRE8gY2hlY2sgaWYgcXVlcnkgYWxyZWFkeSBleGlzdHMsIGFuZCB1c2UgdGhlIHNhbWUgYmFzZSBxdWVyeSAvLyBpZiBwb3NzaWJsZVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeS5jb2x1bW4uZGltZW5zaW9uLmdyb3VwKCkpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgcXVlcnkuZ3JvdXAgPSBnXG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRSZXF1aXJlZENvbHVtbnMocXVlcnkpIHtcbiAgICAgIHZhciByZXF1aXJlZENvbHVtbnMgPSBmaWx0ZXJzLnNjYW5Gb3JEeW5hbWljRmlsdGVycyhxdWVyeS5vcmlnaW5hbClcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FuIHRoZSBncm91cCBmb3IgYW55IGZpbHRlcnMgdGhhdCB3b3VsZCByZXF1aXJlXG4gICAgICAgIC8vIHRoZSBncm91cCB0byBiZSByZWJ1aWx0IHdoZW4gZGF0YSBpcyBhZGRlZCBvciByZW1vdmVkIGluIGFueSB3YXkuXG4gICAgICBpZiAocmVxdWlyZWRDb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAocmVxdWlyZWRDb2x1bW5zLCBmdW5jdGlvbiAoY29sdW1uS2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAgICAgIGtleTogY29sdW1uS2V5LFxuICAgICAgICAgICAgZHluYW1pY1JlZmVyZW5jZTogcXVlcnkuZ3JvdXBcbiAgICAgICAgICB9KVxuICAgICAgICB9KSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXBEYXRhTGlzdGVuZXJzKHF1ZXJ5KSB7XG4gICAgICAvLyBIZXJlLCB3ZSBjcmVhdGUgYSBsaXN0ZW5lciB0byByZWNyZWF0ZSBhbmQgYXBwbHkgdGhlIHJlZHVjZXIgdG9cbiAgICAgIC8vIHRoZSBncm91cCBhbnl0aW1lIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzXG4gICAgICB2YXIgc3RvcERhdGFMaXN0ZW4gPSBzZXJ2aWNlLm9uRGF0YUNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBhcHBseVF1ZXJ5KHF1ZXJ5KVxuICAgICAgfSlcbiAgICAgIHF1ZXJ5LnJlbW92ZUxpc3RlbmVycy5wdXNoKHN0b3BEYXRhTGlzdGVuKVxuXG4gICAgICAvLyBUaGlzIGlzIGEgc2ltaWxhciBsaXN0ZW5lciBmb3IgZmlsdGVyaW5nIHdoaWNoIHdpbGwgKGlmIG5lZWRlZClcbiAgICAgIC8vIHJ1biBhbnkgcG9zdCBhZ2dyZWdhdGlvbnMgb24gdGhlIGRhdGEgYWZ0ZXIgZWFjaCBmaWx0ZXIgYWN0aW9uXG4gICAgICB2YXIgc3RvcEZpbHRlckxpc3RlbiA9IHNlcnZpY2Uub25GaWx0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcG9zdEFnZ3JlZ2F0ZShxdWVyeSlcbiAgICAgIH0pXG4gICAgICBxdWVyeS5yZW1vdmVMaXN0ZW5lcnMucHVzaChzdG9wRmlsdGVyTGlzdGVuKVxuXG4gICAgICByZXR1cm4gcXVlcnlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseVF1ZXJ5KHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gYnVpbGRSZWR1Y2VyKHF1ZXJ5KVxuICAgICAgICAudGhlbihhcHBseVJlZHVjZXIpXG4gICAgICAgIC50aGVuKGF0dGFjaERhdGEpXG4gICAgICAgIC50aGVuKHBvc3RBZ2dyZWdhdGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRSZWR1Y2VyKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gcmVkdWN0aW9meShxdWVyeS5vcmlnaW5hbClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlZHVjZXIpIHtcbiAgICAgICAgICBxdWVyeS5yZWR1Y2VyID0gcmVkdWNlclxuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5UmVkdWNlcihxdWVyeSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeS5yZWR1Y2VyKHF1ZXJ5Lmdyb3VwKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGF0dGFjaERhdGEocXVlcnkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocXVlcnkuZ3JvdXAuYWxsKCkpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcXVlcnkuZGF0YSA9IGRhdGFcbiAgICAgICAgICByZXR1cm4gcXVlcnlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlKHF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkucG9zdEFnZ3JlZ2F0aW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgIC8vIElmIHRoZSBxdWVyeSBpcyB1c2VkIGJ5IDIrIHBvc3QgYWdncmVnYXRpb25zLCB3ZSBuZWVkIHRvIGxvY2tcbiAgICAgICAgLy8gaXQgYWdhaW5zdCBnZXR0aW5nIG11dGF0ZWQgYnkgdGhlIHBvc3QtYWdncmVnYXRpb25zXG4gICAgICAgIHF1ZXJ5LmxvY2tlZCA9IHRydWVcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChxdWVyeS5wb3N0QWdncmVnYXRpb25zLCBmdW5jdGlvbiAocG9zdCkge1xuICAgICAgICByZXR1cm4gcG9zdCgpXG4gICAgICB9KSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld1F1ZXJ5T2JqKHEsIHBhcmVudCkge1xuICAgICAgdmFyIGxvY2tlZCA9IGZhbHNlXG4gICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBxXG4gICAgICAgIHEgPSB7fVxuICAgICAgICBsb2NrZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIC8vIEFzc2lnbiB0aGUgcmVndWxhciBxdWVyeSBwcm9wZXJ0aWVzXG4gICAgICBfLmFzc2lnbihxLCB7XG4gICAgICAgIC8vIFRoZSBVbml2ZXJzZSBmb3IgY29udGludW91cyBwcm9taXNlIGNoYWluaW5nXG4gICAgICAgIHVuaXZlcnNlOiBzZXJ2aWNlLFxuICAgICAgICAvLyBDcm9zc2ZpbHRlciBpbnN0YW5jZVxuICAgICAgICBjcm9zc2ZpbHRlcjogc2VydmljZS5jZixcblxuICAgICAgICAvLyBwYXJlbnQgSW5mb3JtYXRpb25cbiAgICAgICAgcGFyZW50OiBwYXJlbnQsXG4gICAgICAgIGNvbHVtbjogcGFyZW50LmNvbHVtbixcbiAgICAgICAgZGltZW5zaW9uOiBwYXJlbnQuZGltZW5zaW9uLFxuICAgICAgICBncm91cDogcGFyZW50Lmdyb3VwLFxuICAgICAgICByZWR1Y2VyOiBwYXJlbnQucmVkdWNlcixcbiAgICAgICAgb3JpZ2luYWw6IHBhcmVudC5vcmlnaW5hbCxcbiAgICAgICAgaGFzaDogcGFyZW50Lmhhc2gsXG5cbiAgICAgICAgLy8gSXQncyBvd24gcmVtb3ZlTGlzdGVuZXJzXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyczogW10sXG5cbiAgICAgICAgLy8gSXQncyBvd24gcG9zdEFnZ3JlZ2F0aW9uc1xuICAgICAgICBwb3N0QWdncmVnYXRpb25zOiBbXSxcblxuICAgICAgICAvLyBEYXRhIG1ldGhvZFxuICAgICAgICBsb2NrZWQ6IGxvY2tlZCxcbiAgICAgICAgbG9jazogbG9jayxcbiAgICAgICAgdW5sb2NrOiB1bmxvY2ssXG4gICAgICAgIC8vIERpc3Bvc2FsIG1ldGhvZFxuICAgICAgICBjbGVhcjogY2xlYXJRdWVyeSxcbiAgICAgIH0pXG5cbiAgICAgIF8uZm9yRWFjaChwb3N0QWdncmVnYXRpb25NZXRob2RzLCBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIHFbbWV0aG9kXSA9IHBvc3RBZ2dyZWdhdGVNZXRob2RXcmFwKHBvc3RBZ2dyZWdhdGlvblttZXRob2RdKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHFcblxuICAgICAgZnVuY3Rpb24gbG9jayhzZXQpIHtcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKHNldCkpIHtcbiAgICAgICAgICBxLmxvY2tlZCA9IEJvb2xlYW4oc2V0KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHEubG9ja2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1bmxvY2soKSB7XG4gICAgICAgIHEubG9ja2VkID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xlYXJRdWVyeSgpIHtcbiAgICAgICAgXy5mb3JFYWNoKHEucmVtb3ZlTGlzdGVuZXJzLCBmdW5jdGlvbiAobCkge1xuICAgICAgICAgIGwoKVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxLmdyb3VwLmRpc3Bvc2UoKVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcS5jb2x1bW4ucXVlcmllcy5zcGxpY2UocS5jb2x1bW4ucXVlcmllcy5pbmRleE9mKHEpLCAxKVxuICAgICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgcmVjeWNsZSB0aGUgY29sdW1uIGlmIHRoZXJlIGFyZSBubyBxdWVyaWVzIGFjdGl2ZSBvbiBpdFxuICAgICAgICAgIGlmICghcS5jb2x1bW4ucXVlcmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNsZWFyKHEuY29sdW1uLmtleSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlTWV0aG9kV3JhcChwb3N0TWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgdmFyIHN1YiA9IHt9XG4gICAgICAgICAgbmV3UXVlcnlPYmooc3ViLCBxKVxuICAgICAgICAgIGFyZ3MudW5zaGlmdChzdWIsIHEpXG5cbiAgICAgICAgICBxLnBvc3RBZ2dyZWdhdGlvbnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocG9zdE1ldGhvZC5hcHBseShudWxsLCBhcmdzKSlcbiAgICAgICAgICAgICAgLnRoZW4ocG9zdEFnZ3JlZ2F0ZUNoaWxkcmVuKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHBvc3RNZXRob2QuYXBwbHkobnVsbCwgYXJncykpXG4gICAgICAgICAgICAudGhlbihwb3N0QWdncmVnYXRlQ2hpbGRyZW4pXG5cbiAgICAgICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlQ2hpbGRyZW4oKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9zdEFnZ3JlZ2F0ZShzdWIpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLy8gdmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpIC8vIF8gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2hvcnRoYW5kTGFiZWxzOiB7XG4gICAgJGNvdW50OiAnY291bnQnLFxuICAgICRzdW06ICdzdW0nLFxuICAgICRhdmc6ICdhdmcnLFxuICAgICRtaW46ICdtaW4nLFxuICAgICRtYXg6ICdtYXgnLFxuICAgICRtZWQ6ICdtZWQnLFxuICAgICRzdW1TcTogJ3N1bVNxJyxcbiAgICAkc3RkOiAnc3RkJyxcbiAgfSxcbiAgYWdncmVnYXRvcnM6IHtcbiAgICAkY291bnQ6ICRjb3VudCxcbiAgICAkc3VtOiAkc3VtLFxuICAgICRhdmc6ICRhdmcsXG4gICAgJG1pbjogJG1pbixcbiAgICAkbWF4OiAkbWF4LFxuICAgICRtZWQ6ICRtZWQsXG4gICAgJHN1bVNxOiAkc3VtU3EsXG4gICAgJHN0ZDogJHN0ZCxcbiAgICAkdmFsdWVMaXN0OiAkdmFsdWVMaXN0LFxuICAgICRkYXRhTGlzdDogJGRhdGFMaXN0LFxuICB9XG59XG5cbi8vIEFnZ3JlZ2F0b3JzXG5cbmZ1bmN0aW9uICRjb3VudChyZWR1Y2VyLyogLCB2YWx1ZSAqLykge1xuICByZXR1cm4gcmVkdWNlci5jb3VudCh0cnVlKVxufVxuXG5mdW5jdGlvbiAkc3VtKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLnN1bSh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJGF2ZyhyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5hdmcodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRtaW4ocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIubWluKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkbWF4KHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLm1heCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJG1lZChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5tZWRpYW4odmFsdWUpXG59XG5cbmZ1bmN0aW9uICRzdW1TcShyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdW1PZlNxKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkc3RkKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLnN0ZCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJHZhbHVlTGlzdChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci52YWx1ZUxpc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRkYXRhTGlzdChyZWR1Y2VyLyogLCB2YWx1ZSAqLykge1xuICByZXR1cm4gcmVkdWNlci5kYXRhTGlzdCh0cnVlKVxufVxuXG4vLyBUT0RPIGhpc3RvZ3JhbXNcbi8vIFRPRE8gZXhjZXB0aW9uc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciByZWR1Y3RpbyA9IHJlcXVpcmUoJ3JlZHVjdGlvJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG52YXIgckFnZ3JlZ2F0b3JzID0gcmVxdWlyZSgnLi9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzJylcbi8vIHZhciBleHByZXNzaW9ucyA9IHJlcXVpcmUoJy4vZXhwcmVzc2lvbnMnKSAgLy8gZXhwb3Jlc3Npb24gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxudmFyIGFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgdmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuL2ZpbHRlcnMnKShzZXJ2aWNlKVxuXG4gIHJldHVybiBmdW5jdGlvbiByZWR1Y3Rpb2Z5KHF1ZXJ5KSB7XG4gICAgdmFyIHJlZHVjZXIgPSByZWR1Y3RpbygpXG4gICAgLy8gdmFyIGdyb3VwQnkgPSBxdWVyeS5ncm91cEJ5IC8vIGdyb3VwQnkgaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuICAgIGFnZ3JlZ2F0ZU9yTmVzdChyZWR1Y2VyLCBxdWVyeS5zZWxlY3QpXG5cbiAgICBpZiAocXVlcnkuZmlsdGVyKSB7XG4gICAgICB2YXIgZmlsdGVyRnVuY3Rpb24gPSBmaWx0ZXJzLm1ha2VGdW5jdGlvbihxdWVyeS5maWx0ZXIpXG4gICAgICBpZiAoZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgcmVkdWNlci5maWx0ZXIoZmlsdGVyRnVuY3Rpb24pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWR1Y2VyKVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZWN1cnNpdmVseSBmaW5kIHRoZSBmaXJzdCBsZXZlbCBvZiByZWR1Y3RpbyBtZXRob2RzIGluXG4gICAgLy8gZWFjaCBvYmplY3QgYW5kIGFkZHMgdGhhdCByZWR1Y3Rpb24gbWV0aG9kIHRvIHJlZHVjdGlvXG4gICAgZnVuY3Rpb24gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIsIHNlbGVjdHMpIHtcbiAgICAgIC8vIFNvcnQgc28gbmVzdGVkIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCBsYXN0IGJ5IHJlZHVjdGlvJ3MgLnZhbHVlIG1ldGhvZFxuICAgICAgdmFyIHNvcnRlZFNlbGVjdEtleVZhbHVlID0gXy5zb3J0QnkoXG4gICAgICAgIF8ubWFwKHNlbGVjdHMsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWxcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBmdW5jdGlvbiAocykge1xuICAgICAgICAgIGlmIChyQWdncmVnYXRvcnMuYWdncmVnYXRvcnNbcy5rZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gMVxuICAgICAgICB9KVxuXG4gICAgICAvLyBkaXZlIGludG8gZWFjaCBrZXkvdmFsdWVcbiAgICAgIHJldHVybiBfLmZvckVhY2goc29ydGVkU2VsZWN0S2V5VmFsdWUsIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIC8vIEZvdW5kIGEgUmVkdWN0aW8gQWdncmVnYXRpb25cbiAgICAgICAgaWYgKHJBZ2dyZWdhdG9ycy5hZ2dyZWdhdG9yc1tzLmtleV0pIHtcbiAgICAgICAgICAvLyBCdWlsZCB0aGUgdmFsdWVBY2Nlc3NvckZ1bmN0aW9uXG4gICAgICAgICAgdmFyIGFjY2Vzc29yID0gYWdncmVnYXRpb24ubWFrZVZhbHVlQWNjZXNzb3Iocy52YWx1ZSlcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVkdWNlciB3aXRoIHRoZSBWYWx1ZUFjY2Vzc29yRnVuY3Rpb24gdG8gdGhlIHJlZHVjZXJcbiAgICAgICAgICByZWR1Y2VyID0gckFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XShyZWR1Y2VyLCBhY2Nlc3NvcilcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvdW5kIGEgdG9wIGxldmVsIGtleSB2YWx1ZSB0aGF0IGlzIG5vdCBhbiBhZ2dyZWdhdGlvbiBvciBhXG4gICAgICAgIC8vIG5lc3RlZCBvYmplY3QuIFRoaXMgaXMgdW5hY2NlcHRhYmxlLlxuICAgICAgICBpZiAoIV8uaXNPYmplY3Qocy52YWx1ZSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdOZXN0ZWQgc2VsZWN0cyBtdXN0IGJlIGFuIG9iamVjdCcsIHMua2V5KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQncyBhbm90aGVyIG5lc3RlZCBvYmplY3QsIHNvIGp1c3QgcmVwZWF0IHRoaXMgcHJvY2VzcyBvbiBpdFxuICAgICAgICByZWR1Y2VyID0gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIudmFsdWUocy5rZXkpLCBzLnZhbHVlKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuL3Euc2VyaWFsJylcblxuLy8gdmFyIFByb21pc2UgPSByZXF1aXJlKCdxJykgIC8vIFByb21pc2UgaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdW5pdmVyc2VcblxuZnVuY3Rpb24gdW5pdmVyc2UoZGF0YSwgb3B0aW9ucykge1xuICB2YXIgc2VydmljZSA9IHtcbiAgICBvcHRpb25zOiBfLmFzc2lnbih7fSwgb3B0aW9ucyksXG4gICAgY29sdW1uczogW10sXG4gICAgZmlsdGVyczoge30sXG4gICAgZGF0YUxpc3RlbmVyczogW10sXG4gICAgZmlsdGVyTGlzdGVuZXJzOiBbXSxcbiAgfVxuXG4gIHZhciBjZiA9IHJlcXVpcmUoJy4vY3Jvc3NmaWx0ZXInKShzZXJ2aWNlKVxuICB2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpXG5cbiAgZGF0YSA9IGNmLmdlbmVyYXRlQ29sdW1ucyhkYXRhKVxuXG4gIHJldHVybiBjZi5idWlsZChkYXRhKVxuICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBzZXJ2aWNlLmNmID0gZGF0YVxuICAgICAgcmV0dXJuIF8uYXNzaWduKHNlcnZpY2UsIHtcbiAgICAgICAgYWRkOiBjZi5hZGQsXG4gICAgICAgIHJlbW92ZTogY2YucmVtb3ZlLFxuICAgICAgICBjb2x1bW46IHJlcXVpcmUoJy4vY29sdW1uJykoc2VydmljZSksXG4gICAgICAgIHF1ZXJ5OiByZXF1aXJlKCcuL3F1ZXJ5Jykoc2VydmljZSksXG4gICAgICAgIGZpbHRlcjogZmlsdGVycy5maWx0ZXIsXG4gICAgICAgIGZpbHRlckFsbDogZmlsdGVycy5maWx0ZXJBbGwsXG4gICAgICAgIGFwcGx5RmlsdGVyczogZmlsdGVycy5hcHBseUZpbHRlcnMsXG4gICAgICAgIGNsZWFyOiByZXF1aXJlKCcuL2NsZWFyJykoc2VydmljZSksXG4gICAgICAgIGRlc3Ryb3k6IHJlcXVpcmUoJy4vZGVzdHJveScpKHNlcnZpY2UpLFxuICAgICAgICBvbkRhdGFDaGFuZ2U6IG9uRGF0YUNoYW5nZSxcbiAgICAgICAgb25GaWx0ZXI6IG9uRmlsdGVyLFxuICAgICAgfSlcbiAgICB9KVxuXG4gIGZ1bmN0aW9uIG9uRGF0YUNoYW5nZShjYikge1xuICAgIHNlcnZpY2UuZGF0YUxpc3RlbmVycy5wdXNoKGNiKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMuc3BsaWNlKHNlcnZpY2UuZGF0YUxpc3RlbmVycy5pbmRleE9mKGNiKSwgMSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkZpbHRlcihjYikge1xuICAgIHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLnB1c2goY2IpXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLnNwbGljZShzZXJ2aWNlLmZpbHRlckxpc3RlbmVycy5pbmRleE9mKGNiKSwgMSlcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vc3JjL2Nyb3NzZmlsdGVyXCIpLmNyb3NzZmlsdGVyO1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICBcIl9hcmdzXCI6IFtcbiAgICBbXG4gICAgICB7XG4gICAgICAgIFwicmF3XCI6IFwiY3Jvc3NmaWx0ZXIyQDEuNC4wLWFscGhhLjZcIixcbiAgICAgICAgXCJzY29wZVwiOiBudWxsLFxuICAgICAgICBcImVzY2FwZWROYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gICAgICAgIFwibmFtZVwiOiBcImNyb3NzZmlsdGVyMlwiLFxuICAgICAgICBcInJhd1NwZWNcIjogXCIxLjQuMC1hbHBoYS42XCIsXG4gICAgICAgIFwic3BlY1wiOiBcIjEuNC4wLWFscGhhLjZcIixcbiAgICAgICAgXCJ0eXBlXCI6IFwidmVyc2lvblwiXG4gICAgICB9LFxuICAgICAgXCIvaG9tZS9jaHJpc3RvcGhlL1Byb2dyYW1taW5nL1BvbHltZXIvc2hhcmVkL2Jvd2VyX2NvbXBvbmVudHNfZGV2L3VuaXZlcnNlXCJcbiAgICBdXG4gIF0sXG4gIFwiX2Zyb21cIjogXCJjcm9zc2ZpbHRlcjJAMS40LjAtYWxwaGEuNlwiLFxuICBcIl9pZFwiOiBcImNyb3NzZmlsdGVyMkAxLjQuMC1hbHBoYS42XCIsXG4gIFwiX2luQ2FjaGVcIjogdHJ1ZSxcbiAgXCJfaW5zdGFsbGFibGVcIjogdHJ1ZSxcbiAgXCJfbG9jYXRpb25cIjogXCIvY3Jvc3NmaWx0ZXIyXCIsXG4gIFwiX25vZGVWZXJzaW9uXCI6IFwiNS4xMC4xXCIsXG4gIFwiX25wbU9wZXJhdGlvbmFsSW50ZXJuYWxcIjoge1xuICAgIFwiaG9zdFwiOiBcInBhY2thZ2VzLTEyLXdlc3QuaW50ZXJuYWwubnBtanMuY29tXCIsXG4gICAgXCJ0bXBcIjogXCJ0bXAvY3Jvc3NmaWx0ZXIyLTEuNC4wLWFscGhhLjYudGd6XzE0NjM1MTk1NzE3ODZfMC40OTI2OTY3MTI0OTIwMzM4NFwiXG4gIH0sXG4gIFwiX25wbVVzZXJcIjoge1xuICAgIFwibmFtZVwiOiBcImVzamV3ZXR0XCIsXG4gICAgXCJlbWFpbFwiOiBcImVzamV3ZXR0QGdtYWlsLmNvbVwiXG4gIH0sXG4gIFwiX25wbVZlcnNpb25cIjogXCIzLjguM1wiLFxuICBcIl9waGFudG9tQ2hpbGRyZW5cIjoge30sXG4gIFwiX3JlcXVlc3RlZFwiOiB7XG4gICAgXCJyYXdcIjogXCJjcm9zc2ZpbHRlcjJAMS40LjAtYWxwaGEuNlwiLFxuICAgIFwic2NvcGVcIjogbnVsbCxcbiAgICBcImVzY2FwZWROYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gICAgXCJuYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gICAgXCJyYXdTcGVjXCI6IFwiMS40LjAtYWxwaGEuNlwiLFxuICAgIFwic3BlY1wiOiBcIjEuNC4wLWFscGhhLjZcIixcbiAgICBcInR5cGVcIjogXCJ2ZXJzaW9uXCJcbiAgfSxcbiAgXCJfcmVxdWlyZWRCeVwiOiBbXG4gICAgXCIvXCIsXG4gICAgXCIvcmVkdWN0aW9cIlxuICBdLFxuICBcIl9yZXNvbHZlZFwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL2Nyb3NzZmlsdGVyMi8tL2Nyb3NzZmlsdGVyMi0xLjQuMC1hbHBoYS42LnRnelwiLFxuICBcIl9zaGFzdW1cIjogXCJmMDE5N2M2ZmFiMmQ2YTU4M2I1MTI1NGJmYzYzNTcwOTNmODA1MjFiXCIsXG4gIFwiX3Nocmlua3dyYXBcIjogbnVsbCxcbiAgXCJfc3BlY1wiOiBcImNyb3NzZmlsdGVyMkAxLjQuMC1hbHBoYS42XCIsXG4gIFwiX3doZXJlXCI6IFwiL2hvbWUvY2hyaXN0b3BoZS9Qcm9ncmFtbWluZy9Qb2x5bWVyL3NoYXJlZC9ib3dlcl9jb21wb25lbnRzX2Rldi91bml2ZXJzZVwiLFxuICBcImF1dGhvclwiOiB7XG4gICAgXCJuYW1lXCI6IFwiTWlrZSBCb3N0b2NrXCIsXG4gICAgXCJ1cmxcIjogXCJodHRwOi8vYm9zdC5vY2tzLm9yZy9taWtlXCJcbiAgfSxcbiAgXCJidWdzXCI6IHtcbiAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9jcm9zc2ZpbHRlci9jcm9zc2ZpbHRlci9pc3N1ZXNcIlxuICB9LFxuICBcImNvbnRyaWJ1dG9yc1wiOiBbXG4gICAge1xuICAgICAgXCJuYW1lXCI6IFwiSmFzb24gRGF2aWVzXCIsXG4gICAgICBcInVybFwiOiBcImh0dHA6Ly93d3cuamFzb25kYXZpZXMuY29tL1wiXG4gICAgfVxuICBdLFxuICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJsb2Rhc2gucmVzdWx0XCI6IFwiXjQuNC4wXCJcbiAgfSxcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkZhc3QgbXVsdGlkaW1lbnNpb25hbCBmaWx0ZXJpbmcgZm9yIGNvb3JkaW5hdGVkIHZpZXdzLlwiLFxuICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgXCJicm93c2VyaWZ5XCI6IFwiXjEzLjAuMFwiLFxuICAgIFwiZDNcIjogXCIzLjVcIixcbiAgICBcInBhY2thZ2UtanNvbi12ZXJzaW9uaWZ5XCI6IFwiMS4wLjJcIixcbiAgICBcInVnbGlmeS1qc1wiOiBcIjIuNC4wXCIsXG4gICAgXCJ2b3dzXCI6IFwiMC43LjBcIlxuICB9LFxuICBcImRpcmVjdG9yaWVzXCI6IHt9LFxuICBcImRpc3RcIjoge1xuICAgIFwic2hhc3VtXCI6IFwiZjAxOTdjNmZhYjJkNmE1ODNiNTEyNTRiZmM2MzU3MDkzZjgwNTIxYlwiLFxuICAgIFwidGFyYmFsbFwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL2Nyb3NzZmlsdGVyMi8tL2Nyb3NzZmlsdGVyMi0xLjQuMC1hbHBoYS42LnRnelwiXG4gIH0sXG4gIFwiZmlsZXNcIjogW1xuICAgIFwic3JjXCIsXG4gICAgXCJpbmRleC5qc1wiLFxuICAgIFwiY3Jvc3NmaWx0ZXIuanNcIixcbiAgICBcImNyb3NzZmlsdGVyLm1pbi5qc1wiXG4gIF0sXG4gIFwiZ2l0SGVhZFwiOiBcIjUwOWE5Njc5OGY1MTUzYTU4ZDFiNmNhZTVmYjNlNzg5MzEyOWNlN2NcIixcbiAgXCJob21lcGFnZVwiOiBcImh0dHA6Ly9jcm9zc2ZpbHRlci5naXRodWIuY29tL2Nyb3NzZmlsdGVyL1wiLFxuICBcImtleXdvcmRzXCI6IFtcbiAgICBcImFuYWx5dGljc1wiLFxuICAgIFwidmlzdWFsaXphdGlvblwiLFxuICAgIFwiY3Jvc3NmaWx0ZXJcIlxuICBdLFxuICBcIm1haW5cIjogXCIuL2luZGV4LmpzXCIsXG4gIFwibWFpbnRhaW5lcnNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcImVzamV3ZXR0XCIsXG4gICAgICBcImVtYWlsXCI6IFwiZXNqZXdldHRAZ21haWwuY29tXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcImdvcmRvbndvb2RodWxsXCIsXG4gICAgICBcImVtYWlsXCI6IFwiZ29yZG9uQHdvb2RodWxsLmNvbVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJ0YW5uZXJsaW5zbGV5XCIsXG4gICAgICBcImVtYWlsXCI6IFwidGFubmVybGluc2xleUBnbWFpbC5jb21cIlxuICAgIH1cbiAgXSxcbiAgXCJuYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gIFwib3B0aW9uYWxEZXBlbmRlbmNpZXNcIjoge30sXG4gIFwicmVhZG1lXCI6IFwiRVJST1I6IE5vIFJFQURNRSBkYXRhIGZvdW5kIVwiLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiZ2l0K3NzaDovL2dpdEBnaXRodWIuY29tL2Nyb3NzZmlsdGVyL2Nyb3NzZmlsdGVyLmdpdFwiXG4gIH0sXG4gIFwic2NyaXB0c1wiOiB7XG4gICAgXCJiZW5jaG1hcmtcIjogXCJub2RlIHRlc3QvYmVuY2htYXJrLmpzXCIsXG4gICAgXCJidWlsZFwiOiBcImJyb3dzZXJpZnkgaW5kZXguanMgLXQgcGFja2FnZS1qc29uLXZlcnNpb25pZnkgLS1zdGFuZGFsb25lIGNyb3NzZmlsdGVyIC1vIGNyb3NzZmlsdGVyLmpzICYmIHVnbGlmeWpzIC0tY29tcHJlc3MgLS1tYW5nbGUgLS1zY3Jldy1pZTggY3Jvc3NmaWx0ZXIuanMgLW8gY3Jvc3NmaWx0ZXIubWluLmpzXCIsXG4gICAgXCJjbGVhblwiOiBcInJtIC1mIGNyb3NzZmlsdGVyLmpzIGNyb3NzZmlsdGVyLm1pbi5qc1wiLFxuICAgIFwidGVzdFwiOiBcInZvd3MgLS12ZXJib3NlXCJcbiAgfSxcbiAgXCJ2ZXJzaW9uXCI6IFwiMS40LjAtYWxwaGEuNlwiXG59XG4iLCJpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cblxuLy8gQW4gYXJiaXRyYXJpbHktd2lkZSBhcnJheSBvZiBiaXRtYXNrc1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYml0YXJyYXkobikge1xuICB0aGlzLmxlbmd0aCA9IG47XG4gIHRoaXMuc3ViYXJyYXlzID0gMTtcbiAgdGhpcy53aWR0aCA9IDg7XG4gIHRoaXMubWFza3MgPSB7XG4gICAgMDogMFxuICB9XG5cbiAgdGhpc1swXSA9IGNyb3NzZmlsdGVyX2FycmF5OChuKTtcbn1cblxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmxlbmd0aGVuID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4odGhpc1tpXSwgbik7XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBuO1xufTtcblxuLy8gUmVzZXJ2ZSBhIG5ldyBiaXQgaW5kZXggaW4gdGhlIGFycmF5LCByZXR1cm5zIHtvZmZzZXQsIG9uZX1cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG0sIHcsIG9uZSwgaSwgbGVuO1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtID0gdGhpcy5tYXNrc1tpXTtcbiAgICB3ID0gdGhpcy53aWR0aCAtICgzMiAqIGkpO1xuICAgIG9uZSA9IH5tICYgLX5tO1xuXG4gICAgaWYgKHcgPj0gMzIgJiYgIW9uZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHcgPCAzMiAmJiAob25lICYgKDEgPDwgdykpKSB7XG4gICAgICAvLyB3aWRlbiB0aGlzIHN1YmFycmF5XG4gICAgICB0aGlzW2ldID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbih0aGlzW2ldLCB3IDw8PSAxKTtcbiAgICAgIHRoaXMud2lkdGggPSAzMiAqIGkgKyB3O1xuICAgIH1cblxuICAgIHRoaXMubWFza3NbaV0gfD0gb25lO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9mZnNldDogaSxcbiAgICAgIG9uZTogb25lXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFkZCBhIG5ldyBzdWJhcnJheVxuICB0aGlzW3RoaXMuc3ViYXJyYXlzXSA9IGNyb3NzZmlsdGVyX2FycmF5OCh0aGlzLmxlbmd0aCk7XG4gIHRoaXMubWFza3NbdGhpcy5zdWJhcnJheXNdID0gMTtcbiAgdGhpcy53aWR0aCArPSA4O1xuICByZXR1cm4ge1xuICAgIG9mZnNldDogdGhpcy5zdWJhcnJheXMrKyxcbiAgICBvbmU6IDFcbiAgfTtcbn07XG5cbi8vIENvcHkgcmVjb3JkIGZyb20gaW5kZXggc3JjIHRvIGluZGV4IGRlc3RcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oZGVzdCwgc3JjKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzW2ldW2Rlc3RdID0gdGhpc1tpXVtzcmNdO1xuICB9XG59O1xuXG4vLyBUcnVuY2F0ZSB0aGUgYXJyYXkgdG8gdGhlIGdpdmVuIGxlbmd0aFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnRydW5jYXRlID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgZm9yICh2YXIgaiA9IHRoaXMubGVuZ3RoIC0gMTsgaiA+PSBuOyBqLS0pIHtcbiAgICAgIHRoaXNbaV1bal0gPSAwO1xuICAgIH1cbiAgICB0aGlzW2ldLmxlbmd0aCA9IG47XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBuO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgYWxsIGJpdHMgZm9yIHRoZSBnaXZlbiBpbmRleCBhcmUgMFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnplcm8gPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDAgZXhjZXB0IGZvciBwb3NzaWJseSBvbmVcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvRXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoaSA9PT0gb2Zmc2V0ID8gdGhpc1tpXVtuXSAmIHplcm8gOiB0aGlzW2ldW25dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgYWxsIGJpdHMgZm9yIHRoZSBnaXZlbiBpbmRleiBhcmUgMCBleGNlcHQgZm9yIHRoZSBzcGVjaWZpZWQgbWFzay5cbi8vIFRoZSBtYXNrIHNob3VsZCBiZSBhbiBhcnJheSBvZiB0aGUgc2FtZSBzaXplIGFzIHRoZSBmaWx0ZXIgc3ViYXJyYXlzIHdpZHRoLlxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnplcm9FeGNlcHRNYXNrID0gZnVuY3Rpb24obiwgbWFzaykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0gJiBtYXNrW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vLyBDaGVja3MgdGhhdCBvbmx5IHRoZSBzcGVjaWZpZWQgYml0IGlzIHNldCBmb3IgdGhlIGdpdmVuIGluZGV4XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUub25seSA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgb25lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc1tpXVtuXSAhPSAoaSA9PT0gb2Zmc2V0ID8gb25lIDogMCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBvbmx5IHRoZSBzcGVjaWZpZWQgYml0IGlzIHNldCBmb3IgdGhlIGdpdmVuIGluZGV4IGV4Y2VwdCBmb3IgcG9zc2libHkgb25lIG90aGVyXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUub25seUV4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybywgb25seU9mZnNldCwgb25seU9uZSkge1xuICB2YXIgbWFzaztcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIG1hc2sgPSB0aGlzW2ldW25dO1xuICAgIGlmIChpID09PSBvZmZzZXQpXG4gICAgICBtYXNrICY9IHplcm87XG4gICAgaWYgKG1hc2sgIT0gKGkgPT09IG9ubHlPZmZzZXQgPyBvbmx5T25lIDogMCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXJyYXk4OiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gIGFycmF5MTY6IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgYXJyYXkzMjogY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICBhcnJheUxlbmd0aGVuOiBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZCxcbiAgYXJyYXlXaWRlbjogY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQsXG4gIGJpdGFycmF5OiBjcm9zc2ZpbHRlcl9iaXRhcnJheVxufTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJpc2VjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGJpc2VjdF9ieTsgLy8gYXNzaWduIHRoZSByYXcgZnVuY3Rpb24gdG8gdGhlIGV4cG9ydCBhcyB3ZWxsXG4iLCJ2YXIgeGZpbHRlckFycmF5ID0gcmVxdWlyZSgnLi9hcnJheScpO1xudmFyIHhmaWx0ZXJGaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xudmFyIGNyb3NzZmlsdGVyX251bGwgPSByZXF1aXJlKCcuL251bGwnKTtcbnZhciBjcm9zc2ZpbHRlcl96ZXJvID0gcmVxdWlyZSgnLi96ZXJvJyk7XG52YXIgeGZpbHRlckhlYXBzZWxlY3QgPSByZXF1aXJlKCcuL2hlYXBzZWxlY3QnKTtcbnZhciB4ZmlsdGVySGVhcCA9IHJlcXVpcmUoJy4vaGVhcCcpO1xudmFyIGJpc2VjdCA9IHJlcXVpcmUoJy4vYmlzZWN0Jyk7XG52YXIgaW5zZXJ0aW9uc29ydCA9IHJlcXVpcmUoJy4vaW5zZXJ0aW9uc29ydCcpO1xudmFyIHBlcm11dGUgPSByZXF1aXJlKCcuL3Blcm11dGUnKTtcbnZhciBxdWlja3NvcnQgPSByZXF1aXJlKCcuL3F1aWNrc29ydCcpO1xudmFyIHhmaWx0ZXJSZWR1Y2UgPSByZXF1aXJlKCcuL3JlZHVjZScpO1xudmFyIHBhY2thZ2VKc29uID0gcmVxdWlyZSgnLi8uLi9wYWNrYWdlLmpzb24nKTsgLy8gcmVxdWlyZSBvd24gcGFja2FnZS5qc29uIGZvciB0aGUgdmVyc2lvbiBmaWVsZFxudmFyIHJlc3VsdCA9IHJlcXVpcmUoJ2xvZGFzaC5yZXN1bHQnKTtcbi8vIGV4cG9zZSBBUEkgZXhwb3J0c1xuZXhwb3J0cy5jcm9zc2ZpbHRlciA9IGNyb3NzZmlsdGVyO1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5oZWFwID0geGZpbHRlckhlYXA7XG5leHBvcnRzLmNyb3NzZmlsdGVyLmhlYXBzZWxlY3QgPSB4ZmlsdGVySGVhcHNlbGVjdDtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIuYmlzZWN0ID0gYmlzZWN0O1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5pbnNlcnRpb25zb3J0ID0gaW5zZXJ0aW9uc29ydDtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIucGVybXV0ZSA9IHBlcm11dGU7XG5leHBvcnRzLmNyb3NzZmlsdGVyLnF1aWNrc29ydCA9IHF1aWNrc29ydDtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIudmVyc2lvbiA9IHBhY2thZ2VKc29uLnZlcnNpb247IC8vIHBsZWFzZSBub3RlIHVzZSBvZiBcInBhY2thZ2UtanNvbi12ZXJzaW9uaWZ5XCIgdHJhbnNmb3JtXG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyKCkge1xuICB2YXIgY3Jvc3NmaWx0ZXIgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmVEYXRhLFxuICAgIGRpbWVuc2lvbjogZGltZW5zaW9uLFxuICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICBzaXplOiBzaXplLFxuICAgIGFsbDogYWxsLFxuICAgIG9uQ2hhbmdlOiBvbkNoYW5nZSxcbiAgICBpc0VsZW1lbnRGaWx0ZXJlZDogaXNFbGVtZW50RmlsdGVyZWQsXG4gIH07XG5cbiAgdmFyIGRhdGEgPSBbXSwgLy8gdGhlIHJlY29yZHNcbiAgICAgIG4gPSAwLCAvLyB0aGUgbnVtYmVyIG9mIHJlY29yZHM7IGRhdGEubGVuZ3RoXG4gICAgICBmaWx0ZXJzLCAvLyAxIGlzIGZpbHRlcmVkIG91dFxuICAgICAgZmlsdGVyTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gdGhlIGZpbHRlcnMgY2hhbmdlXG4gICAgICBkYXRhTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgcmVtb3ZlZFxuICAgICAgY2FsbGJhY2tzID0gW107XG5cbiAgZmlsdGVycyA9IG5ldyB4ZmlsdGVyQXJyYXkuYml0YXJyYXkoMCk7XG5cbiAgLy8gQWRkcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIHRvIHRoaXMgY3Jvc3NmaWx0ZXIuXG4gIGZ1bmN0aW9uIGFkZChuZXdEYXRhKSB7XG4gICAgdmFyIG4wID0gbixcbiAgICAgICAgbjEgPSBuZXdEYXRhLmxlbmd0aDtcblxuICAgIC8vIElmIHRoZXJlJ3MgYWN0dWFsbHkgbmV3IGRhdGEgdG8gYWRk4oCmXG4gICAgLy8gTWVyZ2UgdGhlIG5ldyBkYXRhIGludG8gdGhlIGV4aXN0aW5nIGRhdGEuXG4gICAgLy8gTGVuZ3RoZW4gdGhlIGZpbHRlciBiaXRzZXQgdG8gaGFuZGxlIHRoZSBuZXcgcmVjb3Jkcy5cbiAgICAvLyBOb3RpZnkgbGlzdGVuZXJzIChkaW1lbnNpb25zIGFuZCBncm91cHMpIHRoYXQgbmV3IGRhdGEgaXMgYXZhaWxhYmxlLlxuICAgIGlmIChuMSkge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KG5ld0RhdGEpO1xuICAgICAgZmlsdGVycy5sZW5ndGhlbihuICs9IG4xKTtcbiAgICAgIGRhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3RGF0YSwgbjAsIG4xKTsgfSk7XG4gICAgICB0cmlnZ2VyT25DaGFuZ2UoJ2RhdGFBZGRlZCcpO1xuICAgIH1cblxuICAgIHJldHVybiBjcm9zc2ZpbHRlcjtcbiAgfVxuXG4gIC8vIFJlbW92ZXMgYWxsIHJlY29yZHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgIHZhciBuZXdJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pLFxuICAgICAgICByZW1vdmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkgbmV3SW5kZXhbaV0gPSBqKys7XG4gICAgICBlbHNlIHJlbW92ZWQucHVzaChpKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYWxsIG1hdGNoaW5nIHJlY29yZHMgZnJvbSBncm91cHMuXG4gICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKC0xLCAtMSwgW10sIHJlbW92ZWQsIHRydWUpOyB9KTtcblxuICAgIC8vIFVwZGF0ZSBpbmRleGVzLlxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3SW5kZXgpOyB9KTtcblxuICAgIC8vIFJlbW92ZSBvbGQgZmlsdGVycyBhbmQgZGF0YSBieSBvdmVyd3JpdGluZy5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSBmaWx0ZXJzLmNvcHkoaiwgaSksIGRhdGFbal0gPSBkYXRhW2ldO1xuICAgICAgICArK2o7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5sZW5ndGggPSBuID0gajtcbiAgICBmaWx0ZXJzLnRydW5jYXRlKGopO1xuICAgIHRyaWdnZXJPbkNoYW5nZSgnZGF0YVJlbW92ZWQnKTtcbiAgfVxuXG4gIC8vIFJldHVybiB0cnVlIGlmIHRoZSBkYXRhIGVsZW1lbnQgYXQgaW5kZXggaSBpcyBmaWx0ZXJlZCBJTi5cbiAgLy8gT3B0aW9uYWxseSwgaWdub3JlIHRoZSBmaWx0ZXJzIG9mIGFueSBkaW1lbnNpb25zIGluIHRoZSBpZ25vcmVfZGltZW5zaW9ucyBsaXN0LlxuICBmdW5jdGlvbiBpc0VsZW1lbnRGaWx0ZXJlZChpLCBpZ25vcmVfZGltZW5zaW9ucykge1xuICAgIHZhciBuLFxuICAgICAgICBkLFxuICAgICAgICBpZCxcbiAgICAgICAgbGVuLFxuICAgICAgICBtYXNrID0gQXJyYXkoZmlsdGVycy5zdWJhcnJheXMpO1xuICAgIGZvciAobiA9IDA7IG4gPCBmaWx0ZXJzLnN1YmFycmF5czsgbisrKSB7IG1hc2tbbl0gPSB+MDsgfVxuICAgIGlmIChpZ25vcmVfZGltZW5zaW9ucykge1xuICAgICAgZm9yIChkID0gMCwgbGVuID0gaWdub3JlX2RpbWVuc2lvbnMubGVuZ3RoOyBkIDwgbGVuOyBkKyspIHtcbiAgICAgICAgLy8gVGhlIHRvcCBiaXRzIG9mIHRoZSBJRCBhcmUgdGhlIHN1YmFycmF5IG9mZnNldCBhbmQgdGhlIGxvd2VyIGJpdHMgYXJlIHRoZSBiaXRcbiAgICAgICAgLy8gb2Zmc2V0IG9mIHRoZSBcIm9uZVwiIG1hc2suXG4gICAgICAgIGlkID0gaWdub3JlX2RpbWVuc2lvbnNbZF0uaWQoKTtcbiAgICAgICAgbWFza1tpZCA+PiA3XSAmPSB+KDB4MSA8PCAoaWQgJiAweDNmKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmaWx0ZXJzLnplcm9FeGNlcHRNYXNrKGksbWFzayk7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSwgaXRlcmFibGUpIHtcblxuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgICB2YXIgYWNjZXNzb3JQYXRoID0gdmFsdWU7XG4gICAgICB2YWx1ZSA9IGZ1bmN0aW9uKGQpIHsgcmV0dXJuIHJlc3VsdChkLCBhY2Nlc3NvclBhdGgpOyB9O1xuICAgIH1cblxuICAgIHZhciBkaW1lbnNpb24gPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIGZpbHRlckV4YWN0OiBmaWx0ZXJFeGFjdCxcbiAgICAgIGZpbHRlclJhbmdlOiBmaWx0ZXJSYW5nZSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiBmaWx0ZXJGdW5jdGlvbixcbiAgICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgICAgdG9wOiB0b3AsXG4gICAgICBib3R0b206IGJvdHRvbSxcbiAgICAgIGdyb3VwOiBncm91cCxcbiAgICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UsIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgYWNjZXNzb3I6IHZhbHVlLFxuICAgICAgaWQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gaWQ7IH1cbiAgICB9O1xuXG4gICAgdmFyIG9uZSwgLy8gbG93ZXN0IHVuc2V0IGJpdCBhcyBtYXNrLCBlLmcuLCAwMDAwMTAwMFxuICAgICAgICB6ZXJvLCAvLyBpbnZlcnRlZCBvbmUsIGUuZy4sIDExMTEwMTExXG4gICAgICAgIG9mZnNldCwgLy8gb2Zmc2V0IGludG8gdGhlIGZpbHRlcnMgYXJyYXlzXG4gICAgICAgIGlkLCAvLyB1bmlxdWUgSUQgZm9yIHRoaXMgZGltZW5zaW9uIChyZXVzZWQgd2hlbiBkaW1lbnNpb25zIGFyZSBkaXNwb3NlZClcbiAgICAgICAgdmFsdWVzLCAvLyBzb3J0ZWQsIGNhY2hlZCBhcnJheVxuICAgICAgICBpbmRleCwgLy8gdmFsdWUgcmFuayDihqYgb2JqZWN0IGlkXG4gICAgICAgIG9sZFZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgcHJldmlvdXNseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgb2xkSW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIHByZXZpb3VzbHktYWRkZWQgaW5kZXhcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMsXG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cyxcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydC5ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyQWxsLCAvLyBmb3IgcmVjb21wdXRpbmcgZmlsdGVyXG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24sIC8vIHRoZSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uIGluIHVzZVxuICAgICAgICBpbmRleExpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgICAgZGltZW5zaW9uR3JvdXBzID0gW10sXG4gICAgICAgIGxvMCA9IDAsXG4gICAgICAgIGhpMCA9IDAsXG4gICAgICAgIHQgPSAwO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEFkZCBhIG5ldyBkaW1lbnNpb24gaW4gdGhlIGZpbHRlciBiaXRtYXAgYW5kIHN0b3JlIHRoZSBvZmZzZXQgYW5kIGJpdG1hc2suXG4gICAgdmFyIHRtcCA9IGZpbHRlcnMuYWRkKCk7XG4gICAgb2Zmc2V0ID0gdG1wLm9mZnNldDtcbiAgICBvbmUgPSB0bXAub25lO1xuICAgIHplcm8gPSB+b25lO1xuXG4gICAgLy8gQ3JlYXRlIGEgdW5pcXVlIElEIGZvciB0aGUgZGltZW5zaW9uXG4gICAgLy8gSURzIHdpbGwgYmUgcmUtdXNlZCBpZiBkaW1lbnNpb25zIGFyZSBkaXNwb3NlZC5cbiAgICAvLyBGb3IgaW50ZXJuYWwgdXNlIHRoZSBJRCBpcyB0aGUgc3ViYXJyYXkgb2Zmc2V0IHNoaWZ0ZWQgbGVmdCA3IGJpdHMgb3InZCB3aXRoIHRoZVxuICAgIC8vIGJpdCBvZmZzZXQgb2YgdGhlIHNldCBiaXQgaW4gdGhlIGRpbWVuc2lvbidzIFwib25lXCIgbWFzay5cbiAgICBpZCA9IChvZmZzZXQgPDwgNykgfCAoTWF0aC5sb2cob25lKSAvIE1hdGgubG9nKDIpKTtcblxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG5cbiAgICAgIGlmIChpdGVyYWJsZSl7XG4gICAgICAgIC8vIENvdW50IGFsbCB0aGUgdmFsdWVzXG4gICAgICAgIHQgPSAwO1xuICAgICAgICBqID0gMDtcbiAgICAgICAgayA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm9yKGogPSAwLCBrID0gdmFsdWUobmV3RGF0YVtpXSk7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbmV3VmFsdWVzID0gW107XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQgPSBjcm9zc2ZpbHRlcl9yYW5nZShuZXdEYXRhLmxlbmd0aCk7XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgodCwxKTtcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzID0gW107XG4gICAgICAgIHZhciB1bnNvcnRlZEluZGV4ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UodCk7XG5cbiAgICAgICAgZm9yIChsID0gMCwgaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgayA9IHZhbHVlKG5ld0RhdGFbaV0pXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZighay5sZW5ndGgpe1xuICAgICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpXSA9IDA7XG4gICAgICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3MucHVzaChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2ldID0gay5sZW5ndGhcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgbmV3VmFsdWVzLnB1c2goa1tqXSk7XG4gICAgICAgICAgICB1bnNvcnRlZEluZGV4W2xdID0gaTtcbiAgICAgICAgICAgIGwrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIFNvcnQgbWFwIHVzZWQgdG8gc29ydCBib3RoIHRoZSB2YWx1ZXMgYW5kIHRoZSB2YWx1ZVRvRGF0YSBpbmRpY2VzXG4gICAgICAgIHZhciBzb3J0TWFwID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZSh0KSwgMCwgdCk7XG5cbiAgICAgICAgLy8gVXNlIHRoZSBzb3J0TWFwIHRvIHNvcnQgdGhlIG5ld1ZhbHVlc1xuICAgICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgc29ydE1hcCk7XG5cblxuICAgICAgICAvLyBVc2UgdGhlIHNvcnRNYXAgdG8gc29ydCB0aGUgdW5zb3J0ZWRJbmRleCBtYXBcbiAgICAgICAgLy8gbmV3SW5kZXggc2hvdWxkIGJlIGEgbWFwIG9mIHNvcnRlZFZhbHVlIC0+IGNyb3NzZmlsdGVyRGF0YVxuICAgICAgICBuZXdJbmRleCA9IHBlcm11dGUodW5zb3J0ZWRJbmRleCwgc29ydE1hcClcblxuICAgICAgfSBlbHNle1xuICAgICAgICAvLyBQZXJtdXRlIG5ldyB2YWx1ZXMgaW50byBuYXR1cmFsIG9yZGVyIHVzaW5nIGEgc3RhbmRhcmQgc29ydGVkIGluZGV4LlxuICAgICAgICBuZXdWYWx1ZXMgPSBuZXdEYXRhLm1hcCh2YWx1ZSk7XG4gICAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIG5ld0luZGV4KTtcbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgbjEgPSB0O1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV07XG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGlmICghcmVmaWx0ZXJGdW5jdGlvbihuZXdWYWx1ZXNbaV0sIGkpKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsbzE7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSBoaTE7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgZGltZW5zaW9uIHByZXZpb3VzbHkgaGFkIG5vIGRhdGEsIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBkbyB0aGVcbiAgICAgIC8vIG1vcmUgZXhwZW5zaXZlIG1lcmdlIG9wZXJhdGlvbjsgdXNlIHRoZSBuZXcgdmFsdWVzIGFuZCBpbmRleCBhcy1pcy5cbiAgICAgIGlmICghbjApIHtcbiAgICAgICAgdmFsdWVzID0gbmV3VmFsdWVzO1xuICAgICAgICBpbmRleCA9IG5ld0luZGV4O1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0gbmV3SXRlcmFibGVzSW5kZXhDb3VudDtcbiAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cztcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuXG5cbiAgICAgIHZhciBvbGRWYWx1ZXMgPSB2YWx1ZXMsXG4gICAgICAgIG9sZEluZGV4ID0gaW5kZXgsXG4gICAgICAgIG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNcbiAgICAgICAgaTAgPSAwLFxuICAgICAgICBpMSA9IDA7XG5cbiAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgb2xkX24wID0gbjBcbiAgICAgICAgbjAgPSBvbGRWYWx1ZXMubGVuZ3RoO1xuICAgICAgICBuMSA9IHRcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgbmV3IGFycmF5cyBpbnRvIHdoaWNoIHRvIG1lcmdlIG5ldyBhbmQgb2xkLlxuICAgICAgdmFsdWVzID0gaXRlcmFibGUgPyBuZXcgQXJyYXkobjAgKyBuMSkgOiBuZXcgQXJyYXkobik7XG4gICAgICBpbmRleCA9IGl0ZXJhYmxlID8gbmV3IEFycmF5KG4wICsgbjEpIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG4gICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBjcm9zc2ZpbHRlcl9pbmRleChuMCArIG4xLCAxKTtcblxuICAgICAgLy8gQ29uY2F0ZW5hdGUgdGhlIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQgb250byB0aGUgb2xkIG9uZS5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIHZhciBvbGRpaWNsZW5ndGggPSBpdGVyYWJsZXNJbmRleENvdW50Lmxlbmd0aDtcbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudCA9IHhmaWx0ZXJBcnJheS5hcnJheUxlbmd0aGVuKGl0ZXJhYmxlc0luZGV4Q291bnQsIG4pO1xuICAgICAgICBmb3IodmFyIGo9MDsgaitvbGRpaWNsZW5ndGggPCBuOyBqKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W2orb2xkaWljbGVuZ3RoXSA9IG5ld0l0ZXJhYmxlc0luZGV4Q291bnRbal07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgdGhlIG9sZCBhbmQgbmV3IHNvcnRlZCB2YWx1ZXMsIGFuZCBvbGQgYW5kIG5ldyBpbmRleC5cbiAgICAgIGZvciAoaSA9IDA7IGkwIDwgbjAgJiYgaTEgPCBuMTsgKytpKSB7XG4gICAgICAgIGlmIChvbGRWYWx1ZXNbaTBdIDwgbmV3VmFsdWVzW2kxXSkge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTArK107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMSsrXSArIChpdGVyYWJsZSA/IG9sZF9uMCA6IG4wKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgdmFsdWVzLlxuICAgICAgZm9yICg7IGkwIDwgbjA7ICsraTAsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMF07XG4gICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTFdICsgKGl0ZXJhYmxlID8gb2xkX24wIDogbjApO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKSwgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gV2hlbiBhbGwgZmlsdGVycyBoYXZlIHVwZGF0ZWQsIG5vdGlmeSBpbmRleCBsaXN0ZW5lcnMgb2YgdGhlIG5ldyB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gcG9zdEFkZChuZXdEYXRhLCBuMCwgbjEpIHtcbiAgICAgIGluZGV4TGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSk7IH0pO1xuICAgICAgbmV3VmFsdWVzID0gbmV3SW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGsgPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gaikgdmFsdWVzW2pdID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGluZGV4W2pdID0gcmVJbmRleFtrXTtcbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcblxuICAgICAgdmFyIGxvMSA9IGJvdW5kc1swXSxcbiAgICAgICAgICBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBudWxsO1xuICAgICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGxvMSA8PSBpICYmIGkgPCBoaTE7IH0sIGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IGluZGV4Lmxlbmd0aCk7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIGssXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQgPSBbXTtcblxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBsbyBpbmRleC5cbiAgICAgIGlmIChsbzEgPCBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8xLCBqID0gTWF0aC5taW4obG8wLCBoaTEpOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBoaSBpbmRleC5cbiAgICAgIGlmIChoaTEgPiBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8xLCBoaTApLCBqID0gaGkxOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaGkxIDwgaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMCwgaGkxKSwgaiA9IGhpMDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgLy8gRmxpcCBmaWx0ZXJzIG5vcm1hbGx5LlxuXG4gICAgICAgIGZvcihpPTA7IGk8YWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpPTA7IGk8cmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIGl0ZXJhYmxlcywgd2UgbmVlZCB0byBmaWd1cmUgb3V0IGlmIHRoZSByb3cgaGFzIGJlZW4gY29tcGxldGVseSByZW1vdmVkIHZzIHBhcnRpYWxseSBpbmNsdWRlZFxuICAgICAgICAvLyBPbmx5IGNvdW50IGEgcm93IGFzIGFkZGVkIGlmIGl0IGlzIG5vdCBhbHJlYWR5IGJlaW5nIGFnZ3JlZ2F0ZWQuIE9ubHkgY291bnQgYSByb3dcbiAgICAgICAgLy8gYXMgcmVtb3ZlZCBpZiB0aGUgbGFzdCBlbGVtZW50IGJlaW5nIGFnZ3JlZ2F0ZWQgaXMgcmVtb3ZlZC5cblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPSAwO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dID09PSAxKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld0FkZGVkLnB1c2goYWRkZWRbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9IDE7XG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld1JlbW92ZWQucHVzaChyZW1vdmVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRlZCA9IG5ld0FkZGVkO1xuICAgICAgICByZW1vdmVkID0gbmV3UmVtb3ZlZDtcblxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IGluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIHRoZSBzcGVjaWZpZWQgcmFuZ2UsIHZhbHVlLCBvciBudWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBudWxsLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyQWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBhbiBhcnJheSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlclJhbmdlLlxuICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckV4YWN0LlxuICAgIGZ1bmN0aW9uIGZpbHRlcihyYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlID09IG51bGxcbiAgICAgICAgICA/IGZpbHRlckFsbCgpIDogQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgICA/IGZpbHRlclJhbmdlKHJhbmdlKSA6IHR5cGVvZiByYW5nZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBmaWx0ZXJGdW5jdGlvbihyYW5nZSlcbiAgICAgICAgICA6IGZpbHRlckV4YWN0KHJhbmdlKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgZXhhY3QgdmFsdWUuXG4gICAgZnVuY3Rpb24gZmlsdGVyRXhhY3QodmFsdWUpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgc3BlY2lmaWVkIHJhbmdlIFtsbywgaGldLlxuICAgIC8vIFRoZSBsb3dlciBib3VuZCBpcyBpbmNsdXNpdmUsIGFuZCB0aGUgdXBwZXIgYm91bmQgaXMgZXhjbHVzaXZlLlxuICAgIGZ1bmN0aW9uIGZpbHRlclJhbmdlKHJhbmdlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0geGZpbHRlckZpbHRlci5maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXJzIGFueSBmaWx0ZXJzIG9uIHRoaXMgZGltZW5zaW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckFsbCkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyBhbiBhcmJpdHJhcnkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyRnVuY3Rpb24oZikge1xuICAgICAgcmVmaWx0ZXJGdW5jdGlvbiA9IGY7XG4gICAgICByZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGYsIGZhbHNlKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmLCBmaWx0ZXJBbGwpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgeCxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIGluZGV4TGVuZ3RoID0gaW5kZXgubGVuZ3RoO1xuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgICAgaWYgKHgpIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICBlbHNlIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZihmKHZhbHVlc1tpXSwgaSkpIHtcbiAgICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJiBvbmUpIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJj0gemVybztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpPTA7IGk8cmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dICYgb25lKSkgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIGFkZGVkXG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9IDA7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3QWRkZWQucHVzaChhZGRlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID0gMTtcbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3UmVtb3ZlZC5wdXNoKHJlbW92ZWRbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZGVkID0gbmV3QWRkZWQ7XG4gICAgICAgIHJlbW92ZWQgPSBuZXdSZW1vdmVkO1xuXG4gICAgICAgIC8vIE5vdyBoYW5kbGUgZW1wdHkgcm93cy5cbiAgICAgICAgaWYoZmlsdGVyQWxsKSB7XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZigoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgbm90IGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCBhZGRcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZmlsdGVyIGluIHBsYWNlIC0gcmVtb3ZlIGVtcHR5IHJvd3MgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZighKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCByZW1vdmVcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBvZmZzZXQsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICB0cmlnZ2VyT25DaGFuZ2UoJ2ZpbHRlcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrLCB0b3Bfb2Zmc2V0KSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGosXG4gICAgICAgICAgdG9Ta2lwID0gMDtcblxuICAgICAgaWYodG9wX29mZnNldCAmJiB0b3Bfb2Zmc2V0ID4gMCkgdG9Ta2lwID0gdG9wX29mZnNldDtcblxuICAgICAgd2hpbGUgKC0taSA+PSBsbzAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYodG9Ta2lwID4gMCkge1xuICAgICAgICAgICAgLy9za2lwIG1hdGNoaW5nIHJvd1xuICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aCAmJiBrID4gMDsgaSsrKSB7XG4gICAgICAgICAgLy8gQWRkIHJvdyB3aXRoIGVtcHR5IGl0ZXJhYmxlIGNvbHVtbiBhdCB0aGUgZW5kXG4gICAgICAgICAgaWYoZmlsdGVycy56ZXJvKGogPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV0pKSB7XG4gICAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgICAtLWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGssIGJvdHRvbV9vZmZzZXQpIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICB0b1NraXAgPSAwO1xuXG4gICAgICBpZihib3R0b21fb2Zmc2V0ICYmIGJvdHRvbV9vZmZzZXQgPiAwKSB0b1NraXAgPSBib3R0b21fb2Zmc2V0O1xuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICAvLyBBZGQgcm93IHdpdGggZW1wdHkgaXRlcmFibGUgY29sdW1uIGF0IHRoZSB0b3BcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aCAmJiBrID4gMDsgaSsrKSB7XG4gICAgICAgICAgaWYoZmlsdGVycy56ZXJvKGogPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV0pKSB7XG4gICAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgICAtLWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGkgPSBsbzA7XG5cbiAgICAgIHdoaWxlIChpIDwgaGkwICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGlmKHRvU2tpcCA+IDApIHtcbiAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgIC0tdG9Ta2lwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgLS1rO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIGEgbmV3IGdyb3VwIHRvIHRoaXMgZGltZW5zaW9uLCB1c2luZyB0aGUgc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBncm91cChrZXkpIHtcbiAgICAgIHZhciBncm91cCA9IHtcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgICAgb3JkZXI6IG9yZGVyLFxuICAgICAgICBvcmRlck5hdHVyYWw6IG9yZGVyTmF0dXJhbCxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgfTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBncm91cCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgZGltZW5zaW9uIGlzIHJlbW92ZWQuXG4gICAgICBkaW1lbnNpb25Hcm91cHMucHVzaChncm91cCk7XG5cbiAgICAgIHZhciBncm91cHMsIC8vIGFycmF5IG9mIHtrZXksIHZhbHVlfVxuICAgICAgICAgIGdyb3VwSW5kZXgsIC8vIG9iamVjdCBpZCDihqYgZ3JvdXAgaWRcbiAgICAgICAgICBncm91cFdpZHRoID0gOCxcbiAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCksXG4gICAgICAgICAgayA9IDAsIC8vIGNhcmRpbmFsaXR5XG4gICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgIGhlYXAsXG4gICAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZSxcbiAgICAgICAgICBncm91cEFsbCA9IGtleSA9PT0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSBrZXkgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcblxuICAgICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgYXNzb2NpYXRlZCByZWR1Y2UgdmFsdWVzLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvXG4gICAgICAvLyB0aGUgcGFyZW50IGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLCBhbmQgY29tcHV0ZSBuZXcga2V5cy5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgICBpbmRleExpc3RlbmVycy5wdXNoKGFkZCk7XG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhlIGdyb3VwaW5nLlxuICAgICAgYWRkKHZhbHVlcywgaW5kZXgsIDAsIG4pO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGdyb3VwcyBhbmQgZ3JvdXBJbmRleC5cbiAgICAgIGZ1bmN0aW9uIGFkZChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpIHtcblxuICAgICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICAgIG4wb2xkID0gbjBcbiAgICAgICAgICBuMCA9IHZhbHVlcy5sZW5ndGggLSBuZXdWYWx1ZXMubGVuZ3RoXG4gICAgICAgICAgbjEgPSBuZXdWYWx1ZXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgIHJlSW5kZXggPSBpdGVyYWJsZSA/IFtdIDogY3Jvc3NmaWx0ZXJfaW5kZXgoaywgZ3JvdXBDYXBhY2l0eSksXG4gICAgICAgICAgICBhZGQgPSByZWR1Y2VBZGQsXG4gICAgICAgICAgICByZW1vdmUgPSByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgICBpbml0aWFsID0gcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICAgIGswID0gaywgLy8gb2xkIGNhcmRpbmFsaXR5XG4gICAgICAgICAgICBpMCA9IDAsIC8vIGluZGV4IG9mIG9sZCBncm91cFxuICAgICAgICAgICAgaTEgPSAwLCAvLyBpbmRleCBvZiBuZXcgcmVjb3JkXG4gICAgICAgICAgICBqLCAvLyBvYmplY3QgaWRcbiAgICAgICAgICAgIGcwLCAvLyBvbGQgZ3JvdXBcbiAgICAgICAgICAgIHgwLCAvLyBvbGQga2V5XG4gICAgICAgICAgICB4MSwgLy8gbmV3IGtleVxuICAgICAgICAgICAgZywgLy8gZ3JvdXAgdG8gYWRkXG4gICAgICAgICAgICB4OyAvLyBrZXkgb2YgZ3JvdXAgdG8gYWRkXG5cbiAgICAgICAgLy8gSWYgYSByZXNldCBpcyBuZWVkZWQsIHdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWVzLlxuICAgICAgICBpZiAocmVzZXROZWVkZWQpIGFkZCA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlbW92ZSA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBuZXcgZ3JvdXBzIChrIGlzIGEgbG93ZXIgYm91bmQpLlxuICAgICAgICAvLyBBbHNvLCBtYWtlIHN1cmUgdGhhdCBncm91cEluZGV4IGV4aXN0cyBhbmQgaXMgbG9uZyBlbm91Z2guXG4gICAgICAgIGdyb3VwcyA9IG5ldyBBcnJheShrKSwgayA9IDA7XG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8gZ3JvdXBJbmRleCA6IFtdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2V7XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IHhmaWx0ZXJBcnJheS5hcnJheUxlbmd0aGVuKGdyb3VwSW5kZXgsIG4pIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgZ3JvdXBDYXBhY2l0eSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3Qgb2xkIGtleSAoeDAgb2YgZzApLCBpZiBpdCBleGlzdHMuXG4gICAgICAgIGlmIChrMCkgeDAgPSAoZzAgPSBvbGRHcm91cHNbMF0pLmtleTtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBuZXcga2V5ICh4MSksIHNraXBwaW5nIE5hTiBrZXlzLlxuICAgICAgICB3aGlsZSAoaTEgPCBuMSAmJiAhKCh4MSA9IGtleShuZXdWYWx1ZXNbaTFdKSkgPj0geDEpKSArK2kxO1xuXG4gICAgICAgIC8vIFdoaWxlIG5ldyBrZXlzIHJlbWFpbuKAplxuICAgICAgICB3aGlsZSAoaTEgPCBuMSkge1xuXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBsZXNzZXIgb2YgdGhlIHR3byBjdXJyZW50IGtleXM7IG5ldyBhbmQgb2xkLlxuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvbGQga2V5cyByZW1haW5pbmcsIHRoZW4gYWx3YXlzIGFkZCB0aGUgbmV3IGtleS5cbiAgICAgICAgICBpZiAoZzAgJiYgeDAgPD0geDEpIHtcbiAgICAgICAgICAgIGcgPSBnMCwgeCA9IHgwO1xuXG4gICAgICAgICAgICAvLyBSZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICAgICAgcmVJbmRleFtpMF0gPSBrO1xuXG4gICAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgbmV4dCBvbGQga2V5LlxuICAgICAgICAgICAgaWYgKGcwID0gb2xkR3JvdXBzWysraTBdKSB4MCA9IGcwLmtleTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZyA9IHtrZXk6IHgxLCB2YWx1ZTogaW5pdGlhbCgpfSwgeCA9IHgxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFkZCB0aGUgbGVzc2VyIGdyb3VwLlxuICAgICAgICAgIGdyb3Vwc1trXSA9IGc7XG5cbiAgICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMgYmVsb25naW5nIHRvIHRoZSBhZGRlZCBncm91cCwgd2hpbGVcbiAgICAgICAgICAvLyBhZHZhbmNpbmcgdGhlIG5ldyBrZXkgYW5kIHBvcHVsYXRpbmcgdGhlIGFzc29jaWF0ZWQgZ3JvdXAgaW5kZXguXG5cbiAgICAgICAgICB3aGlsZSAoeDEgPD0geCkge1xuICAgICAgICAgICAgaiA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG4wb2xkIDogbjApXG5cblxuICAgICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgICBpZihncm91cEluZGV4W2pdKXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdLnB1c2goaylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBba11cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXSA9IGs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFsd2F5cyBhZGQgbmV3IHZhbHVlcyB0byBncm91cHMuIE9ubHkgcmVtb3ZlIHdoZW4gbm90IGluIGZpbHRlci5cbiAgICAgICAgICAgIC8vIFRoaXMgZ2l2ZXMgZ3JvdXBzIGZ1bGwgaW5mb3JtYXRpb24gb24gZGF0YSBsaWZlLWN5Y2xlLlxuICAgICAgICAgICAgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdLCB0cnVlKTtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGosIG9mZnNldCwgemVybykpIGcudmFsdWUgPSByZW1vdmUoZy52YWx1ZSwgZGF0YVtqXSwgZmFsc2UpO1xuICAgICAgICAgICAgaWYgKCsraTEgPj0gbjEpIGJyZWFrO1xuICAgICAgICAgICAgeDEgPSBrZXkobmV3VmFsdWVzW2kxXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCBncm91cHMgdGhhdCB3ZXJlIGdyZWF0ZXIgdGgxYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEZpbGwgaW4gZ2FwcyB3aXRoIGVtcHR5IGFycmF5cyB3aGVyZSB0aGVyZSBtYXkgaGF2ZSBiZWVuIHJvd3Mgd2l0aCBlbXB0eSBpdGVyYWJsZXNcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCFncm91cEluZGV4W2ldKXtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtpXSA9IFtdXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgd2UgYWRkZWQgYW55IG5ldyBncm91cHMgYmVmb3JlIGFueSBvbGQgZ3JvdXBzLFxuICAgICAgICAvLyB1cGRhdGUgdGhlIGdyb3VwIGluZGV4IG9mIGFsbCB0aGUgb2xkIHJlY29yZHMuXG4gICAgICAgIGlmKGsgPiBpMCl7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IHBlcm11dGUoZ3JvdXBJbmRleCwgcmVJbmRleCwgdHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgIGZvciAoaTAgPSAwOyBpMCA8IG4wOyArK2kwKSB7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaTBdID0gcmVJbmRleFtncm91cEluZGV4W2kwXV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSB1cGRhdGUgYW5kIHJlc2V0IGJlaGF2aW9yIGJhc2VkIG9uIHRoZSBjYXJkaW5hbGl0eS5cbiAgICAgICAgLy8gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBvbmUsIHRoZW4gdGhlIGdyb3VwSW5kZXhcbiAgICAgICAgLy8gaXMgbm90IG5lZWRlZC4gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIHplcm8sIHRoZW4gdGhlcmUgYXJlIG5vIHJlY29yZHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBubyBncm91cHMgdG8gdXBkYXRlIG9yIHJlc2V0LiBOb3RlIHRoYXQgd2UgYWxzbyBtdXN0XG4gICAgICAgIC8vIGNoYW5nZSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciB0byBwb2ludCB0byB0aGUgbmV3IG1ldGhvZC5cbiAgICAgICAgaiA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU1hbnk7XG4gICAgICAgICAgcmVzZXQgPSByZXNldE1hbnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFrICYmIGdyb3VwQWxsKSB7XG4gICAgICAgICAgICBrID0gMTtcbiAgICAgICAgICAgIGdyb3VwcyA9IFt7a2V5OiBudWxsLCB2YWx1ZTogaW5pdGlhbCgpfV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVPbmU7XG4gICAgICAgICAgICByZXNldCA9IHJlc2V0T25lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbal0gPSB1cGRhdGU7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBhZGRlZCBncm91cHMsXG4gICAgICAgIC8vIGFuZCB3aWRlbiB0aGUgZ3JvdXAgaW5kZXggYXMgbmVlZGVkLlxuICAgICAgICBmdW5jdGlvbiBncm91cEluY3JlbWVudCgpIHtcbiAgICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgICBrKytcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKytrID09PSBncm91cENhcGFjaXR5KSB7XG4gICAgICAgICAgICByZUluZGV4ID0geGZpbHRlckFycmF5LmFycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0geGZpbHRlckFycmF5LmFycmF5V2lkZW4oZ3JvdXBJbmRleCwgZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHZhciBvbGRLID0gayxcbiAgICAgICAgICAgICAgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgICBzZWVuR3JvdXBzID0gY3Jvc3NmaWx0ZXJfaW5kZXgob2xkSywgb2xkSyk7XG5cbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IG5vbi1tYXRjaGVzIGJ5IGNvcHlpbmcgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcyB0b1xuICAgICAgICAgIC8vIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tncm91cEluZGV4W2pdID0gZ3JvdXBJbmRleFtpXV0gPSAxO1xuICAgICAgICAgICAgICArK2o7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVhc3NlbWJsZSBncm91cHMgaW5jbHVkaW5nIG9ubHkgdGhvc2UgZ3JvdXBzIHRoYXQgd2VyZSByZWZlcnJlZFxuICAgICAgICAgIC8vIHRvIGJ5IG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMuICBOb3RlIHRoZSBuZXcgZ3JvdXAgaW5kZXggaW5cbiAgICAgICAgICAvLyBzZWVuR3JvdXBzLlxuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb2xkSzsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc2Vlbkdyb3Vwc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2ldID0gaysrO1xuICAgICAgICAgICAgICBncm91cHMucHVzaChvbGRHcm91cHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgICAgLy8gUmVpbmRleCB0aGUgZ3JvdXAgaW5kZXggdXNpbmcgc2Vlbkdyb3VwcyB0byBmaW5kIHRoZSBuZXcgaW5kZXguXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGo7ICsraSkgZ3JvdXBJbmRleFtpXSA9IHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPSBrID4gMVxuICAgICAgICAgICAgICA/IChyZXNldCA9IHJlc2V0TWFueSwgdXBkYXRlID0gdXBkYXRlTWFueSlcbiAgICAgICAgICAgICAgOiBrID09PSAxID8gKHJlc2V0ID0gcmVzZXRPbmUsIHVwZGF0ZSA9IHVwZGF0ZU9uZSlcbiAgICAgICAgICAgICAgOiByZXNldCA9IHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gMSkge1xuICAgICAgICAgIGlmIChncm91cEFsbCkgcmV0dXJuO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBpZiAoIWZpbHRlcnMuemVybyhpKSkgcmV0dXJuO1xuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPVxuICAgICAgICAgIHVwZGF0ZSA9IHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICAvLyBub3RGaWx0ZXIgaW5kaWNhdGVzIGEgY3Jvc3NmaWx0ZXIuYWRkL3JlbW92ZSBvcGVyYXRpb24uXG4gICAgICBmdW5jdGlvbiB1cGRhdGVNYW55KGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG5cbiAgICAgICAgaWYgKChmaWx0ZXJPbmUgPT09IG9uZSAmJiBmaWx0ZXJPZmZzZXQgPT09IG9mZnNldCkgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2tdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtrXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICAvLyBub3RGaWx0ZXIgaW5kaWNhdGVzIGEgY3Jvc3NmaWx0ZXIuYWRkL3JlbW92ZSBvcGVyYXRpb24uXG4gICAgICBmdW5jdGlvbiB1cGRhdGVPbmUoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgICAgaWYgKChmaWx0ZXJPbmUgPT09IG9uZSAmJiBmaWx0ZXJPZmZzZXQgPT09IG9mZnNldCkgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRNYW55KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIFJlc2V0IGFsbCBncm91cCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHtcbiAgICAgICAgICBncm91cHNbaV0udmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhZGQgYWxsIHJlY29yZHMgYW5kIHRoZW4gcmVtb3ZlIGZpbHRlcmVkIHJlY29yZHMgc28gdGhhdCByZWR1Y2Vyc1xuICAgICAgICAvLyBjYW4gYnVpbGQgYW4gJ3VuZmlsdGVyZWQnIHZpZXcgZXZlbiBpZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzIGluXG4gICAgICAgIC8vIHBsYWNlIG9uIG90aGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1bal1dO1xuICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUsIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0T25lKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHNpbmdsZXRvbiBncm91cCB2YWx1ZXMuXG4gICAgICAgIGcudmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgYXJyYXkgb2YgZ3JvdXAgdmFsdWVzLCBpbiB0aGUgZGltZW5zaW9uJ3MgbmF0dXJhbCBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBLIGdyb3VwIHZhbHVlcywgaW4gcmVkdWNlIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgICAgdmFyIHRvcCA9IHNlbGVjdChhbGwoKSwgMCwgZ3JvdXBzLmxlbmd0aCwgayk7XG4gICAgICAgIHJldHVybiBoZWFwLnNvcnQodG9wLCAwLCB0b3AubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWVzLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUluY3JlbWVudCwgeGZpbHRlclJlZHVjZS5yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKHhmaWx0ZXJSZWR1Y2UucmVkdWNlQWRkKHZhbHVlKSwgeGZpbHRlclJlZHVjZS5yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2Ugb3JkZXIsIHVzaW5nIHRoZSBzcGVjaWZpZWQgYWNjZXNzb3IuXG4gICAgICBmdW5jdGlvbiBvcmRlcih2YWx1ZSkge1xuICAgICAgICBzZWxlY3QgPSB4ZmlsdGVySGVhcHNlbGVjdC5ieSh2YWx1ZU9mKTtcbiAgICAgICAgaGVhcCA9IHhmaWx0ZXJIZWFwLmJ5KHZhbHVlT2YpO1xuICAgICAgICBmdW5jdGlvbiB2YWx1ZU9mKGQpIHsgcmV0dXJuIHZhbHVlKGQudmFsdWUpOyB9XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIG5hdHVyYWwgb3JkZXJpbmcgYnkgcmVkdWNlIHZhbHVlLlxuICAgICAgZnVuY3Rpb24gb3JkZXJOYXR1cmFsKCkge1xuICAgICAgICByZXR1cm4gb3JkZXIoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBjYXJkaW5hbGl0eSBvZiB0aGlzIGdyb3VwLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gICAgICBmdW5jdGlvbiBzaXplKCkge1xuICAgICAgICByZXR1cm4gaztcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IGluZGV4TGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgaW5kZXhMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVkdWNlQ291bnQoKS5vcmRlck5hdHVyYWwoKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBnZW5lcmF0aW5nIGEgc2luZ2xldG9uIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgICAgdmFyIGcgPSBncm91cChjcm9zc2ZpbHRlcl9udWxsKSwgYWxsID0gZy5hbGw7XG4gICAgICBkZWxldGUgZy5hbGw7XG4gICAgICBkZWxldGUgZy50b3A7XG4gICAgICBkZWxldGUgZy5vcmRlcjtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyTmF0dXJhbDtcbiAgICAgIGRlbGV0ZSBnLnNpemU7XG4gICAgICBnLnZhbHVlID0gZnVuY3Rpb24oKSB7IHJldHVybiBhbGwoKVswXS52YWx1ZTsgfTtcbiAgICAgIHJldHVybiBnO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBkaW1lbnNpb24gYW5kIGFzc29jaWF0ZWQgZ3JvdXBzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7IGdyb3VwLmRpc3Bvc2UoKTsgfSk7XG4gICAgICB2YXIgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwcmVBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHBvc3RBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBmaWx0ZXJzLm1hc2tzW29mZnNldF0gJj0gemVybztcbiAgICAgIHJldHVybiBmaWx0ZXJBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGltZW5zaW9uO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIGdyb3VwQWxsIG9uIGEgZHVtbXkgZGltZW5zaW9uLlxuICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGNhbiBiZSBvcHRpbWl6ZWQgc2luY2UgaXQgYWx3YXlzIGhhcyBjYXJkaW5hbGl0eSAxLlxuICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIHJlZHVjZVZhbHVlLFxuICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZS4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0byB0aGUgcGFyZW50XG4gICAgLy8gZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQuXG4gICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2goYWRkKTtcblxuICAgIC8vIEZvciBjb25zaXN0ZW5jeTsgYWN0dWFsbHkgYSBuby1vcCBzaW5jZSByZXNldE5lZWRlZCBpcyB0cnVlLlxuICAgIGFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGFkZChuZXdEYXRhLCBuMCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gbjA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICBuO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oayA9IGFkZGVkW2ldKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMub25seShrID0gcmVtb3ZlZFtpXSwgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWUgZnJvbSBzY3JhdGNoLlxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgaXQgaXMgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZSwgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKHhmaWx0ZXJSZWR1Y2UucmVkdWNlSW5jcmVtZW50LCB4ZmlsdGVyUmVkdWNlLnJlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKHhmaWx0ZXJSZWR1Y2UucmVkdWNlQWRkKHZhbHVlKSwgeGZpbHRlclJlZHVjZS5yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGNvbXB1dGVkIHJlZHVjZSB2YWx1ZS5cbiAgICBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiByZWR1Y2VWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZHVjZUNvdW50KCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgcmVjb3JkcyBpbiB0aGlzIGNyb3NzZmlsdGVyLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSByYXcgcm93IGRhdGEgY29udGFpbmVkIGluIHRoaXMgY3Jvc3NmaWx0ZXJcbiAgZnVuY3Rpb24gYWxsKCl7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBmdW5jdGlvbiBvbkNoYW5nZShjYil7XG4gICAgaWYodHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgIGNvbnNvbGUud2Fybignb25DaGFuZ2UgY2FsbGJhY2sgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbGJhY2tzLnB1c2goY2IpO1xuICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShjYWxsYmFja3MuaW5kZXhPZihjYiksIDEpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyT25DaGFuZ2UoZXZlbnROYW1lKXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2tzW2ldKGV2ZW50TmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyB4ZmlsdGVyQXJyYXkuYXJyYXk4IDogbSA8IDB4MTAwMDFcbiAgICAgID8geGZpbHRlckFycmF5LmFycmF5MTZcbiAgICAgIDogeGZpbHRlckFycmF5LmFycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG4iLCJmdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKHZhbHVlcykge1xuICByZXR1cm4gWzAsIHZhbHVlcy5sZW5ndGhdO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZmlsdGVyRXhhY3Q6IGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0LFxuICBmaWx0ZXJSYW5nZTogY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UsXG4gIGZpbHRlckFsbDogY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsXG59O1xuIiwidmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xuXG5mdW5jdGlvbiBoZWFwX2J5KGYpIHtcblxuICAvLyBCdWlsZHMgYSBiaW5hcnkgaGVhcCB3aXRoaW4gdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXS4gVGhlIGhlYXAgaGFzIHRoZVxuICAvLyBwcm9wZXJ0eSBzdWNoIHRoYXQgdGhlIHBhcmVudCBhW2xvK2ldIGlzIGFsd2F5cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gaXRzXG4gIC8vIHR3byBjaGlsZHJlbjogYVtsbysyKmkrMV0gYW5kIGFbbG8rMippKzJdLlxuICBmdW5jdGlvbiBoZWFwKGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgaSA9IChuID4+PiAxKSArIDE7XG4gICAgd2hpbGUgKC0taSA+IDApIHNpZnQoYSwgaSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU29ydHMgdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXSBpbiBkZXNjZW5kaW5nIG9yZGVyLCBhc3N1bWluZyBpdCBpc1xuICAvLyBhbHJlYWR5IGEgaGVhcC5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIHQ7XG4gICAgd2hpbGUgKC0tbiA+IDApIHQgPSBhW2xvXSwgYVtsb10gPSBhW2xvICsgbl0sIGFbbG8gKyBuXSA9IHQsIHNpZnQoYSwgMSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU2lmdHMgdGhlIGVsZW1lbnQgYVtsbytpLTFdIGRvd24gdGhlIGhlYXAsIHdoZXJlIHRoZSBoZWFwIGlzIHRoZSBjb250aWd1b3VzXG4gIC8vIHNsaWNlIG9mIGFycmF5IGFbbG86bG8rbl0uIFRoaXMgbWV0aG9kIGNhbiBhbHNvIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSBoZWFwXG4gIC8vIGluY3JlbWVudGFsbHksIHdpdGhvdXQgaW5jdXJyaW5nIHRoZSBmdWxsIGNvc3Qgb2YgcmVjb25zdHJ1Y3RpbmcgdGhlIGhlYXAuXG4gIGZ1bmN0aW9uIHNpZnQoYSwgaSwgbiwgbG8pIHtcbiAgICB2YXIgZCA9IGFbLS1sbyArIGldLFxuICAgICAgICB4ID0gZihkKSxcbiAgICAgICAgY2hpbGQ7XG4gICAgd2hpbGUgKChjaGlsZCA9IGkgPDwgMSkgPD0gbikge1xuICAgICAgaWYgKGNoaWxkIDwgbiAmJiBmKGFbbG8gKyBjaGlsZF0pID4gZihhW2xvICsgY2hpbGQgKyAxXSkpIGNoaWxkKys7XG4gICAgICBpZiAoeCA8PSBmKGFbbG8gKyBjaGlsZF0pKSBicmVhaztcbiAgICAgIGFbbG8gKyBpXSA9IGFbbG8gKyBjaGlsZF07XG4gICAgICBpID0gY2hpbGQ7XG4gICAgfVxuICAgIGFbbG8gKyBpXSA9IGQ7XG4gIH1cblxuICBoZWFwLnNvcnQgPSBzb3J0O1xuICByZXR1cm4gaGVhcDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoZWFwX2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbm1vZHVsZS5leHBvcnRzLmJ5ID0gaGVhcF9ieTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcbnZhciB4RmlsdGVySGVhcCA9IHJlcXVpcmUoJy4vaGVhcCcpO1xuXG5mdW5jdGlvbiBoZWFwc2VsZWN0X2J5KGYpIHtcbiAgdmFyIGhlYXAgPSB4RmlsdGVySGVhcC5ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICB4LFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoeCA9IGYoZCA9IGFbbG9dKSA+IG1pbikge1xuICAgICAgICAgIHF1ZXVlWzBdID0gZDtcbiAgICAgICAgICBtaW4gPSBmKGhlYXAocXVldWUsIDAsIGspWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoKytsbyA8IGhpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVldWU7XG4gIH1cblxuICByZXR1cm4gaGVhcHNlbGVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBoZWFwc2VsZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbm1vZHVsZS5leHBvcnRzLmJ5ID0gaGVhcHNlbGVjdF9ieTsgLy8gYXNzaWduIHRoZSByYXcgZnVuY3Rpb24gdG8gdGhlIGV4cG9ydCBhcyB3ZWxsXG4iLCJmdW5jdGlvbiBjcm9zc2ZpbHRlcl9pZGVudGl0eShkKSB7XG4gIHJldHVybiBkO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyb3NzZmlsdGVyX2lkZW50aXR5O1xuIiwidmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xuXG5mdW5jdGlvbiBpbnNlcnRpb25zb3J0X2J5KGYpIHtcblxuICBmdW5jdGlvbiBpbnNlcnRpb25zb3J0KGEsIGxvLCBoaSkge1xuICAgIGZvciAodmFyIGkgPSBsbyArIDE7IGkgPCBoaTsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gaSwgdCA9IGFbaV0sIHggPSBmKHQpOyBqID4gbG8gJiYgZihhW2ogLSAxXSkgPiB4OyAtLWopIHtcbiAgICAgICAgYVtqXSA9IGFbaiAtIDFdO1xuICAgICAgfVxuICAgICAgYVtqXSA9IHQ7XG4gICAgfVxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgcmV0dXJuIGluc2VydGlvbnNvcnQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zZXJ0aW9uc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG4iLCJmdW5jdGlvbiBjcm9zc2ZpbHRlcl9udWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcm9zc2ZpbHRlcl9udWxsO1xuIiwiZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgsIGRlZXApIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBkZWVwID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhcnJheSkpIDogbmV3IEFycmF5KG4pOyBpIDwgbjsgKytpKSB7XG4gICAgY29weVtpXSA9IGFycmF5W2luZGV4W2ldXTtcbiAgfVxuICByZXR1cm4gY29weTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwZXJtdXRlO1xuIiwidmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xudmFyIHhGaWx0ZXJJbnNlcnRpb25zb3J0ID0gcmVxdWlyZSgnLi9pbnNlcnRpb25zb3J0Jyk7XG5cbi8vIEFsZ29yaXRobSBkZXNpZ25lZCBieSBWbGFkaW1pciBZYXJvc2xhdnNraXkuXG4vLyBJbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiB0aGUgRGFydCBwcm9qZWN0OyBzZWUgTk9USUNFIGFuZCBBVVRIT1JTIGZvciBkZXRhaWxzLlxuXG5mdW5jdGlvbiBxdWlja3NvcnRfYnkoZikge1xuICB2YXIgaW5zZXJ0aW9uc29ydCA9IHhGaWx0ZXJJbnNlcnRpb25zb3J0LmJ5KGYpO1xuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgcmV0dXJuIChoaSAtIGxvIDwgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGRcbiAgICAgICAgPyBpbnNlcnRpb25zb3J0XG4gICAgICAgIDogcXVpY2tzb3J0KShhLCBsbywgaGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVpY2tzb3J0KGEsIGxvLCBoaSkge1xuICAgIC8vIENvbXB1dGUgdGhlIHR3byBwaXZvdHMgYnkgbG9va2luZyBhdCA1IGVsZW1lbnRzLlxuICAgIHZhciBzaXh0aCA9IChoaSAtIGxvKSAvIDYgfCAwLFxuICAgICAgICBpMSA9IGxvICsgc2l4dGgsXG4gICAgICAgIGk1ID0gaGkgLSAxIC0gc2l4dGgsXG4gICAgICAgIGkzID0gbG8gKyBoaSAtIDEgPj4gMSwgIC8vIFRoZSBtaWRwb2ludC5cbiAgICAgICAgaTIgPSBpMyAtIHNpeHRoLFxuICAgICAgICBpNCA9IGkzICsgc2l4dGg7XG5cbiAgICB2YXIgZTEgPSBhW2kxXSwgeDEgPSBmKGUxKSxcbiAgICAgICAgZTIgPSBhW2kyXSwgeDIgPSBmKGUyKSxcbiAgICAgICAgZTMgPSBhW2kzXSwgeDMgPSBmKGUzKSxcbiAgICAgICAgZTQgPSBhW2k0XSwgeDQgPSBmKGU0KSxcbiAgICAgICAgZTUgPSBhW2k1XSwgeDUgPSBmKGU1KTtcblxuICAgIHZhciB0O1xuXG4gICAgLy8gU29ydCB0aGUgc2VsZWN0ZWQgNSBlbGVtZW50cyB1c2luZyBhIHNvcnRpbmcgbmV0d29yay5cbiAgICBpZiAoeDEgPiB4MikgdCA9IGUxLCBlMSA9IGUyLCBlMiA9IHQsIHQgPSB4MSwgeDEgPSB4MiwgeDIgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgxID4geDMpIHQgPSBlMSwgZTEgPSBlMywgZTMgPSB0LCB0ID0geDEsIHgxID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MSA+IHg0KSB0ID0gZTEsIGUxID0gZTQsIGU0ID0gdCwgdCA9IHgxLCB4MSA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgzID4geDQpIHQgPSBlMywgZTMgPSBlNCwgZTQgPSB0LCB0ID0geDMsIHgzID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDIgPiB4NSkgdCA9IGUyLCBlMiA9IGU1LCBlNSA9IHQsIHQgPSB4MiwgeDIgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcblxuICAgIHZhciBwaXZvdDEgPSBlMiwgcGl2b3RWYWx1ZTEgPSB4MixcbiAgICAgICAgcGl2b3QyID0gZTQsIHBpdm90VmFsdWUyID0geDQ7XG5cbiAgICAvLyBlMiBhbmQgZTQgaGF2ZSBiZWVuIHNhdmVkIGluIHRoZSBwaXZvdCB2YXJpYWJsZXMuIFRoZXkgd2lsbCBiZSB3cml0dGVuXG4gICAgLy8gYmFjaywgb25jZSB0aGUgcGFydGl0aW9uaW5nIGlzIGZpbmlzaGVkLlxuICAgIGFbaTFdID0gZTE7XG4gICAgYVtpMl0gPSBhW2xvXTtcbiAgICBhW2kzXSA9IGUzO1xuICAgIGFbaTRdID0gYVtoaSAtIDFdO1xuICAgIGFbaTVdID0gZTU7XG5cbiAgICB2YXIgbGVzcyA9IGxvICsgMSwgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuICAgICAgICBncmVhdCA9IGhpIC0gMjsgIC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cblxuICAgIC8vIE5vdGUgdGhhdCBmb3IgdmFsdWUgY29tcGFyaXNvbiwgPCwgPD0sID49IGFuZCA+IGNvZXJjZSB0byBhIHByaW1pdGl2ZSB2aWFcbiAgICAvLyBPYmplY3QucHJvdG90eXBlLnZhbHVlT2Y7ID09IGFuZCA9PT0gZG8gbm90LCBzbyBpbiBvcmRlciB0byBiZSBjb25zaXN0ZW50XG4gICAgLy8gd2l0aCBuYXR1cmFsIG9yZGVyIChzdWNoIGFzIGZvciBEYXRlIG9iamVjdHMpLCB3ZSBtdXN0IGRvIHR3byBjb21wYXJlcy5cbiAgICB2YXIgcGl2b3RzRXF1YWwgPSBwaXZvdFZhbHVlMSA8PSBwaXZvdFZhbHVlMiAmJiBwaXZvdFZhbHVlMSA+PSBwaXZvdFZhbHVlMjtcbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcblxuICAgICAgLy8gRGVnZW5lcmF0ZWQgY2FzZSB3aGVyZSB0aGUgcGFydGl0aW9uaW5nIGJlY29tZXMgYSBkdXRjaCBuYXRpb25hbCBmbGFnXG4gICAgICAvLyBwcm9ibGVtLlxuICAgICAgLy9cbiAgICAgIC8vIFsgfCAgPCBwaXZvdCAgfCA9PSBwaXZvdCB8IHVucGFydGl0aW9uZWQgfCA+IHBpdm90ICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgIF4gICAgICAgICAgXiAgICAgICAgICAgICBeICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICBrICAgICAgICAgICBncmVhdCAgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxKSBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QuXG4gICAgICAvLyAgIDIpIGZvciB4IGluIFtsZXNzLCBrWyA6IHggPT0gcGl2b3QuXG4gICAgICAvLyAgIDMpIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90LlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7ICsraykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2UgaWYgKHhrID4gcGl2b3RWYWx1ZTEpIHtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgPD0gcGl2b3QgaW4gdGhlIHJhbmdlIFtrIC0gMSwgZ3JlYXRdIGFuZFxuICAgICAgICAgIC8vIHB1dCBbOmVrOl0gdGhlcmUuIFdlIGtub3cgdGhhdCBzdWNoIGFuIGVsZW1lbnQgbXVzdCBleGlzdDpcbiAgICAgICAgICAvLyBXaGVuIGsgPT0gbGVzcywgdGhlbiBlbDMgKHdoaWNoIGlzIGVxdWFsIHRvIHBpdm90KSBsaWVzIGluIHRoZVxuICAgICAgICAgIC8vIGludGVydmFsLiBPdGhlcndpc2UgYVtrIC0gMV0gPT0gcGl2b3QgYW5kIHRoZSBzZWFyY2ggc3RvcHMgYXQgay0xLlxuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpbiB0aGUgbGF0dGVyIGNhc2UgaW52YXJpYW50IDIgd2lsbCBiZSB2aW9sYXRlZCBmb3IgYVxuICAgICAgICAgIC8vIHNob3J0IGFtb3VudCBvZiB0aW1lLiBUaGUgaW52YXJpYW50IHdpbGwgYmUgcmVzdG9yZWQgd2hlbiB0aGVcbiAgICAgICAgICAvLyBwaXZvdHMgYXJlIHB1dCBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbiB0aGUgd2hpbGUtbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAvLyBOb3RlOiBpZiBncmVhdCA8IGsgdGhlbiB3ZSB3aWxsIGV4aXQgdGhlIG91dGVyIGxvb3AgYW5kIGZpeFxuICAgICAgICAgICAgICAvLyBpbnZhcmlhbnQgMiAod2hpY2ggd2UganVzdCB2aW9sYXRlZCkuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuIDwgcGl2b3QxXG4gICAgICAvLyAgMi4gPj0gcGl2b3QxICYmIDw9IHBpdm90MlxuICAgICAgLy8gIDMuID4gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbIHwgPCBwaXZvdDEgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA+IHBpdm90MiAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8PSB4ICYmIHggPD0gcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDw9IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA+PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTW92ZSBwaXZvdHMgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgLy8gV2Ugc2hydW5rIHRoZSBsaXN0IGZyb20gYm90aCBzaWRlcyAoYVtsZWZ0XSBhbmQgYVtyaWdodF0gaGF2ZVxuICAgIC8vIG1lYW5pbmdsZXNzIHZhbHVlcyBpbiB0aGVtKSBhbmQgbm93IHdlIG1vdmUgZWxlbWVudHMgZnJvbSB0aGUgZmlyc3RcbiAgICAvLyBhbmQgdGhpcmQgcGFydGl0aW9uIGludG8gdGhlc2UgbG9jYXRpb25zIHNvIHRoYXQgd2UgY2FuIHN0b3JlIHRoZVxuICAgIC8vIHBpdm90cy5cbiAgICBhW2xvXSA9IGFbbGVzcyAtIDFdO1xuICAgIGFbbGVzcyAtIDFdID0gcGl2b3QxO1xuICAgIGFbaGkgLSAxXSA9IGFbZ3JlYXQgKyAxXTtcbiAgICBhW2dyZWF0ICsgMV0gPSBwaXZvdDI7XG5cbiAgICAvLyBUaGUgbGlzdCBpcyBub3cgcGFydGl0aW9uZWQgaW50byB0aHJlZSBwYXJ0aXRpb25zOlxuICAgIC8vIFsgPCBwaXZvdDEgICB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgICB8ICA+IHBpdm90MiAgIF1cbiAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuXG4gICAgLy8gUmVjdXJzaXZlIGRlc2NlbnQuIChEb24ndCBpbmNsdWRlIHRoZSBwaXZvdCB2YWx1ZXMuKVxuICAgIHNvcnQoYSwgbG8sIGxlc3MgLSAxKTtcbiAgICBzb3J0KGEsIGdyZWF0ICsgMiwgaGkpO1xuXG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG4gICAgICAvLyBBbGwgZWxlbWVudHMgaW4gdGhlIHNlY29uZCBwYXJ0aXRpb24gYXJlIGVxdWFsIHRvIHRoZSBwaXZvdC4gTm9cbiAgICAgIC8vIG5lZWQgdG8gc29ydCB0aGVtLlxuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlb3J5IGl0IHNob3VsZCBiZSBlbm91Z2ggdG8gY2FsbCBfZG9Tb3J0IHJlY3Vyc2l2ZWx5IG9uIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJ0aXRpb24uXG4gICAgLy8gVGhlIEFuZHJvaWQgc291cmNlIGhvd2V2ZXIgcmVtb3ZlcyB0aGUgcGl2b3QgZWxlbWVudHMgZnJvbSB0aGUgcmVjdXJzaXZlXG4gICAgLy8gY2FsbCBpZiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBpcyB0b28gbGFyZ2UgKG1vcmUgdGhhbiAyLzMgb2YgdGhlIGxpc3QpLlxuICAgIGlmIChsZXNzIDwgaTEgJiYgZ3JlYXQgPiBpNSkge1xuICAgICAgdmFyIGxlc3NWYWx1ZSwgZ3JlYXRWYWx1ZTtcbiAgICAgIHdoaWxlICgobGVzc1ZhbHVlID0gZihhW2xlc3NdKSkgPD0gcGl2b3RWYWx1ZTEgJiYgbGVzc1ZhbHVlID49IHBpdm90VmFsdWUxKSArK2xlc3M7XG4gICAgICB3aGlsZSAoKGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKSkgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikgLS1ncmVhdDtcblxuICAgICAgLy8gQ29weSBwYXN0ZSBvZiB0aGUgcHJldmlvdXMgMy13YXkgcGFydGl0aW9uaW5nIHdpdGggYWRhcHRpb25zLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuID09IHBpdm90MVxuICAgICAgLy8gIDIuID4gcGl2b3QxICYmIDwgcGl2b3QyXG4gICAgICAvLyAgMy4gPT0gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbID09IHBpdm90MSB8ID4gcGl2b3QxICYmIDwgcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA9PSBwaXZvdDIgXVxuICAgICAgLy8gICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXlxuICAgICAgLy8gICAgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXRcbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBbICosIGxlc3NbIDogeCA9PSBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDwgeCAmJiB4IDwgcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgKiBdIDogeCA9PSBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUxICYmIHhrID49IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXNzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUyICYmIHhrID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBoYXMgbm93IGJlZW4gY2xlYXJlZCBvZiBwaXZvdCBlbGVtZW50cyBhbmQgbG9va3NcbiAgICAvLyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID4gcGl2b3QxICYmIDwgcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTb3J0IHRoZSBzZWNvbmQgcGFydGl0aW9uIHVzaW5nIHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gbG9va3MgYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU2ltcGx5IHNvcnQgaXQgYnkgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICByZXR1cm4gc29ydChhLCBsZXNzLCBncmVhdCArIDEpO1xuICB9XG5cbiAgcmV0dXJuIHNvcnQ7XG59XG5cbnZhciBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZCA9IDMyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHF1aWNrc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IHF1aWNrc29ydF9ieTtcbiIsImZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudChwKSB7XG4gIHJldHVybiBwICsgMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwICsgK2Yodik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCAtIGYodik7XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICByZWR1Y2VJbmNyZW1lbnQ6IGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCxcbiAgcmVkdWNlRGVjcmVtZW50OiBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsXG4gIHJlZHVjZUFkZDogY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkLFxuICByZWR1Y2VTdWJ0cmFjdDogY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3Rcbn07XG4iLCJmdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcm9zc2ZpbHRlcl96ZXJvO1xuIiwiLyoqXG4gKiBsb2Rhc2ggKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pxdWVyeS5vcmcvPlxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiogVXNlZCB0byBzdGFuZC1pbiBmb3IgYHVuZGVmaW5lZGAgaGFzaCB2YWx1ZXMuICovXG52YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVJc0RlZXBQcm9wID0gL1xcLnxcXFsoPzpbXltcXF1dKnwoW1wiJ10pKD86KD8hXFwxKVteXFxcXF18XFxcXC4pKj9cXDEpXFxdLyxcbiAgICByZUlzUGxhaW5Qcm9wID0gL15cXHcqJC8sXG4gICAgcmVMZWFkaW5nRG90ID0gL15cXC4vLFxuICAgIHJlUHJvcE5hbWUgPSAvW14uW1xcXV0rfFxcWyg/OigtP1xcZCsoPzpcXC5cXGQrKT8pfChbXCInXSkoKD86KD8hXFwyKVteXFxcXF18XFxcXC4pKj8pXFwyKVxcXXwoPz0oPzpcXC58XFxbXFxdKSg/OlxcLnxcXFtcXF18JCkpL2c7XG5cbi8qKlxuICogVXNlZCB0byBtYXRjaCBgUmVnRXhwYFxuICogW3N5bnRheCBjaGFyYWN0ZXJzXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1wYXR0ZXJucykuXG4gKi9cbnZhciByZVJlZ0V4cENoYXIgPSAvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2c7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGJhY2tzbGFzaGVzIGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlRXNjYXBlQ2hhciA9IC9cXFxcKFxcXFwpPy9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBnZXRWYWx1ZShvYmplY3QsIGtleSkge1xuICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGhvc3Qgb2JqZWN0IGluIElFIDwgOS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGhvc3Qgb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSG9zdE9iamVjdCh2YWx1ZSkge1xuICAvLyBNYW55IGhvc3Qgb2JqZWN0cyBhcmUgYE9iamVjdGAgb2JqZWN0cyB0aGF0IGNhbiBjb2VyY2UgdG8gc3RyaW5nc1xuICAvLyBkZXNwaXRlIGhhdmluZyBpbXByb3Blcmx5IGRlZmluZWQgYHRvU3RyaW5nYCBtZXRob2RzLlxuICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS50b1N0cmluZyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9ICEhKHZhbHVlICsgJycpO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsXG4gICAgZnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlLFxuICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG92ZXJyZWFjaGluZyBjb3JlLWpzIHNoaW1zLiAqL1xudmFyIGNvcmVKc0RhdGEgPSByb290WydfX2NvcmUtanNfc2hhcmVkX18nXTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG1ldGhvZHMgbWFzcXVlcmFkaW5nIGFzIG5hdGl2ZS4gKi9cbnZhciBtYXNrU3JjS2V5ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgdWlkID0gL1teLl0rJC8uZXhlYyhjb3JlSnNEYXRhICYmIGNvcmVKc0RhdGEua2V5cyAmJiBjb3JlSnNEYXRhLmtleXMuSUVfUFJPVE8gfHwgJycpO1xuICByZXR1cm4gdWlkID8gKCdTeW1ib2woc3JjKV8xLicgKyB1aWQpIDogJyc7XG59KCkpO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZ1bmNUb1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKHJlUmVnRXhwQ2hhciwgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2wsXG4gICAgc3BsaWNlID0gYXJyYXlQcm90by5zcGxpY2U7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbnZhciBNYXAgPSBnZXROYXRpdmUocm9vdCwgJ01hcCcpLFxuICAgIG5hdGl2ZUNyZWF0ZSA9IGdldE5hdGl2ZShPYmplY3QsICdjcmVhdGUnKTtcblxuLyoqIFVzZWQgdG8gY29udmVydCBzeW1ib2xzIHRvIHByaW1pdGl2ZXMgYW5kIHN0cmluZ3MuICovXG52YXIgc3ltYm9sUHJvdG8gPSBTeW1ib2wgPyBTeW1ib2wucHJvdG90eXBlIDogdW5kZWZpbmVkLFxuICAgIHN5bWJvbFRvU3RyaW5nID0gc3ltYm9sUHJvdG8gPyBzeW1ib2xQcm90by50b1N0cmluZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgaGFzaCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gW2VudHJpZXNdIFRoZSBrZXktdmFsdWUgcGFpcnMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIEhhc2goZW50cmllcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVudHJpZXMgPyBlbnRyaWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5jbGVhcigpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgIHRoaXMuc2V0KGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBoYXNoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIEhhc2hcbiAqL1xuZnVuY3Rpb24gaGFzaENsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0gbmF0aXZlQ3JlYXRlID8gbmF0aXZlQ3JlYXRlKG51bGwpIDoge307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGhhc2guXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIEhhc2hcbiAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBoYXNoRGVsZXRlKGtleSkge1xuICByZXR1cm4gdGhpcy5oYXMoa2V5KSAmJiBkZWxldGUgdGhpcy5fX2RhdGFfX1trZXldO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGhhc2ggdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBIYXNoXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gaGFzaEdldChrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAobmF0aXZlQ3JlYXRlKSB7XG4gICAgdmFyIHJlc3VsdCA9IGRhdGFba2V5XTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBIQVNIX1VOREVGSU5FRCA/IHVuZGVmaW5lZCA6IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpID8gZGF0YVtrZXldIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIGhhc2ggdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgaGFzXG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGhhc2hIYXMoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgcmV0dXJuIG5hdGl2ZUNyZWF0ZSA/IGRhdGFba2V5XSAhPT0gdW5kZWZpbmVkIDogaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGhhc2ggYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBoYXNoIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBoYXNoU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBkYXRhW2tleV0gPSAobmF0aXZlQ3JlYXRlICYmIHZhbHVlID09PSB1bmRlZmluZWQpID8gSEFTSF9VTkRFRklORUQgOiB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBIYXNoYC5cbkhhc2gucHJvdG90eXBlLmNsZWFyID0gaGFzaENsZWFyO1xuSGFzaC5wcm90b3R5cGVbJ2RlbGV0ZSddID0gaGFzaERlbGV0ZTtcbkhhc2gucHJvdG90eXBlLmdldCA9IGhhc2hHZXQ7XG5IYXNoLnByb3RvdHlwZS5oYXMgPSBoYXNoSGFzO1xuSGFzaC5wcm90b3R5cGUuc2V0ID0gaGFzaFNldDtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGxpc3QgY2FjaGUgb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBMaXN0Q2FjaGUoZW50cmllcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVudHJpZXMgPyBlbnRyaWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5jbGVhcigpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgIHRoaXMuc2V0KGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVDbGVhcigpIHtcbiAgdGhpcy5fX2RhdGFfXyA9IFtdO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBkZWxldGVcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVEZWxldGUoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgbGFzdEluZGV4ID0gZGF0YS5sZW5ndGggLSAxO1xuICBpZiAoaW5kZXggPT0gbGFzdEluZGV4KSB7XG4gICAgZGF0YS5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBzcGxpY2UuY2FsbChkYXRhLCBpbmRleCwgMSk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbGlzdCBjYWNoZSB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZUdldChrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcblxuICByZXR1cm4gaW5kZXggPCAwID8gdW5kZWZpbmVkIDogZGF0YVtpbmRleF1bMV07XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgbGlzdCBjYWNoZSB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVIYXMoa2V5KSB7XG4gIHJldHVybiBhc3NvY0luZGV4T2YodGhpcy5fX2RhdGFfXywga2V5KSA+IC0xO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGxpc3QgY2FjaGUgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGxpc3QgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZVNldChrZXksIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIGRhdGEucHVzaChba2V5LCB2YWx1ZV0pO1xuICB9IGVsc2Uge1xuICAgIGRhdGFbaW5kZXhdWzFdID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBMaXN0Q2FjaGVgLlxuTGlzdENhY2hlLnByb3RvdHlwZS5jbGVhciA9IGxpc3RDYWNoZUNsZWFyO1xuTGlzdENhY2hlLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBsaXN0Q2FjaGVEZWxldGU7XG5MaXN0Q2FjaGUucHJvdG90eXBlLmdldCA9IGxpc3RDYWNoZUdldDtcbkxpc3RDYWNoZS5wcm90b3R5cGUuaGFzID0gbGlzdENhY2hlSGFzO1xuTGlzdENhY2hlLnByb3RvdHlwZS5zZXQgPSBsaXN0Q2FjaGVTZXQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcCBjYWNoZSBvYmplY3QgdG8gc3RvcmUga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBNYXBDYWNoZShlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA/IGVudHJpZXMubGVuZ3RoIDogMDtcblxuICB0aGlzLmNsZWFyKCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgY2xlYXJcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICovXG5mdW5jdGlvbiBtYXBDYWNoZUNsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0ge1xuICAgICdoYXNoJzogbmV3IEhhc2gsXG4gICAgJ21hcCc6IG5ldyAoTWFwIHx8IExpc3RDYWNoZSksXG4gICAgJ3N0cmluZyc6IG5ldyBIYXNoXG4gIH07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZGVsZXRlXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBtYXBDYWNoZURlbGV0ZShrZXkpIHtcbiAgcmV0dXJuIGdldE1hcERhdGEodGhpcywga2V5KVsnZGVsZXRlJ10oa2V5KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtYXAgdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlR2V0KGtleSkge1xuICByZXR1cm4gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLmdldChrZXkpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIG1hcCB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlSGFzKGtleSkge1xuICByZXR1cm4gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLmhhcyhrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1hcCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtYXAgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlU2V0KGtleSwgdmFsdWUpIHtcbiAgZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLnNldChrZXksIHZhbHVlKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBNYXBDYWNoZWAuXG5NYXBDYWNoZS5wcm90b3R5cGUuY2xlYXIgPSBtYXBDYWNoZUNsZWFyO1xuTWFwQ2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IG1hcENhY2hlRGVsZXRlO1xuTWFwQ2FjaGUucHJvdG90eXBlLmdldCA9IG1hcENhY2hlR2V0O1xuTWFwQ2FjaGUucHJvdG90eXBlLmhhcyA9IG1hcENhY2hlSGFzO1xuTWFwQ2FjaGUucHJvdG90eXBlLnNldCA9IG1hcENhY2hlU2V0O1xuXG4vKipcbiAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBga2V5YCBpcyBmb3VuZCBpbiBgYXJyYXlgIG9mIGtleS12YWx1ZSBwYWlycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0geyp9IGtleSBUaGUga2V5IHRvIHNlYXJjaCBmb3IuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoZXEoYXJyYXlbbGVuZ3RoXVswXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzTmF0aXZlYCB3aXRob3V0IGJhZCBzaGltIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbixcbiAqICBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSB8fCBpc01hc2tlZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHBhdHRlcm4gPSAoaXNGdW5jdGlvbih2YWx1ZSkgfHwgaXNIb3N0T2JqZWN0KHZhbHVlKSkgPyByZUlzTmF0aXZlIDogcmVJc0hvc3RDdG9yO1xuICByZXR1cm4gcGF0dGVybi50ZXN0KHRvU291cmNlKHZhbHVlKSk7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udG9TdHJpbmdgIHdoaWNoIGRvZXNuJ3QgY29udmVydCBudWxsaXNoXG4gKiB2YWx1ZXMgdG8gZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENhc3RzIGB2YWx1ZWAgdG8gYSBwYXRoIGFycmF5IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2FzdCBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG5mdW5jdGlvbiBjYXN0UGF0aCh2YWx1ZSkge1xuICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IHN0cmluZ1RvUGF0aCh2YWx1ZSk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGF0YSBmb3IgYG1hcGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgVGhlIG1hcCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIHJlZmVyZW5jZSBrZXkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbWFwIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGdldE1hcERhdGEobWFwLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBtYXAuX19kYXRhX187XG4gIHJldHVybiBpc0tleWFibGUoa2V5KVxuICAgID8gZGF0YVt0eXBlb2Yga2V5ID09ICdzdHJpbmcnID8gJ3N0cmluZycgOiAnaGFzaCddXG4gICAgOiBkYXRhLm1hcDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9iamVjdCwga2V5KTtcbiAgcmV0dXJuIGJhc2VJc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUgYW5kIG5vdCBhIHByb3BlcnR5IHBhdGguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcXVlcnkga2V5cyBvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcHJvcGVydHkgbmFtZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0tleSh2YWx1ZSwgb2JqZWN0KSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJyB8fFxuICAgICAgdmFsdWUgPT0gbnVsbCB8fCBpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gcmVJc1BsYWluUHJvcC50ZXN0KHZhbHVlKSB8fCAhcmVJc0RlZXBQcm9wLnRlc3QodmFsdWUpIHx8XG4gICAgKG9iamVjdCAhPSBudWxsICYmIHZhbHVlIGluIE9iamVjdChvYmplY3QpKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICh0eXBlID09ICdzdHJpbmcnIHx8IHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJylcbiAgICA/ICh2YWx1ZSAhPT0gJ19fcHJvdG9fXycpXG4gICAgOiAodmFsdWUgPT09IG51bGwpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgZnVuY2AgaGFzIGl0cyBzb3VyY2UgbWFza2VkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgZnVuY2AgaXMgbWFza2VkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTWFza2VkKGZ1bmMpIHtcbiAgcmV0dXJuICEhbWFza1NyY0tleSAmJiAobWFza1NyY0tleSBpbiBmdW5jKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBgc3RyaW5nYCB0byBhIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG52YXIgc3RyaW5nVG9QYXRoID0gbWVtb2l6ZShmdW5jdGlvbihzdHJpbmcpIHtcbiAgc3RyaW5nID0gdG9TdHJpbmcoc3RyaW5nKTtcblxuICB2YXIgcmVzdWx0ID0gW107XG4gIGlmIChyZUxlYWRpbmdEb3QudGVzdChzdHJpbmcpKSB7XG4gICAgcmVzdWx0LnB1c2goJycpO1xuICB9XG4gIHN0cmluZy5yZXBsYWNlKHJlUHJvcE5hbWUsIGZ1bmN0aW9uKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdHJpbmcpIHtcbiAgICByZXN1bHQucHVzaChxdW90ZSA/IHN0cmluZy5yZXBsYWNlKHJlRXNjYXBlQ2hhciwgJyQxJykgOiAobnVtYmVyIHx8IG1hdGNoKSk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufSk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyBrZXkgaWYgaXQncyBub3QgYSBzdHJpbmcgb3Igc3ltYm9sLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBpbnNwZWN0LlxuICogQHJldHVybnMge3N0cmluZ3xzeW1ib2x9IFJldHVybnMgdGhlIGtleS5cbiAqL1xuZnVuY3Rpb24gdG9LZXkodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCBpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGBmdW5jYCB0byBpdHMgc291cmNlIGNvZGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzb3VyY2UgY29kZS5cbiAqL1xuZnVuY3Rpb24gdG9Tb3VyY2UoZnVuYykge1xuICBpZiAoZnVuYyAhPSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmdW5jVG9TdHJpbmcuY2FsbChmdW5jKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGZ1bmMgKyAnJyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgbWVtb2l6ZXMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuIElmIGByZXNvbHZlcmAgaXNcbiAqIHByb3ZpZGVkLCBpdCBkZXRlcm1pbmVzIHRoZSBjYWNoZSBrZXkgZm9yIHN0b3JpbmcgdGhlIHJlc3VsdCBiYXNlZCBvbiB0aGVcbiAqIGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24uIEJ5IGRlZmF1bHQsIHRoZSBmaXJzdCBhcmd1bWVudFxuICogcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlIG1hcCBjYWNoZSBrZXkuIFRoZSBgZnVuY2BcbiAqIGlzIGludm9rZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICpcbiAqICoqTm90ZToqKiBUaGUgY2FjaGUgaXMgZXhwb3NlZCBhcyB0aGUgYGNhY2hlYCBwcm9wZXJ0eSBvbiB0aGUgbWVtb2l6ZWRcbiAqIGZ1bmN0aW9uLiBJdHMgY3JlYXRpb24gbWF5IGJlIGN1c3RvbWl6ZWQgYnkgcmVwbGFjaW5nIHRoZSBgXy5tZW1vaXplLkNhY2hlYFxuICogY29uc3RydWN0b3Igd2l0aCBvbmUgd2hvc2UgaW5zdGFuY2VzIGltcGxlbWVudCB0aGVcbiAqIFtgTWFwYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtcHJvcGVydGllcy1vZi10aGUtbWFwLXByb3RvdHlwZS1vYmplY3QpXG4gKiBtZXRob2QgaW50ZXJmYWNlIG9mIGBkZWxldGVgLCBgZ2V0YCwgYGhhc2AsIGFuZCBgc2V0YC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtyZXNvbHZlcl0gVGhlIGZ1bmN0aW9uIHRvIHJlc29sdmUgdGhlIGNhY2hlIGtleS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IG1lbW9pemVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEsICdiJzogMiB9O1xuICogdmFyIG90aGVyID0geyAnYyc6IDMsICdkJzogNCB9O1xuICpcbiAqIHZhciB2YWx1ZXMgPSBfLm1lbW9pemUoXy52YWx1ZXMpO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiB2YWx1ZXMob3RoZXIpO1xuICogLy8gPT4gWzMsIDRdXG4gKlxuICogb2JqZWN0LmEgPSAyO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiAvLyBNb2RpZnkgdGhlIHJlc3VsdCBjYWNoZS5cbiAqIHZhbHVlcy5jYWNoZS5zZXQob2JqZWN0LCBbJ2EnLCAnYiddKTtcbiAqIHZhbHVlcyhvYmplY3QpO1xuICogLy8gPT4gWydhJywgJ2InXVxuICpcbiAqIC8vIFJlcGxhY2UgYF8ubWVtb2l6ZS5DYWNoZWAuXG4gKiBfLm1lbW9pemUuQ2FjaGUgPSBXZWFrTWFwO1xuICovXG5mdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyKSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nIHx8IChyZXNvbHZlciAmJiB0eXBlb2YgcmVzb2x2ZXIgIT0gJ2Z1bmN0aW9uJykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgdmFyIG1lbW9pemVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGtleSA9IHJlc29sdmVyID8gcmVzb2x2ZXIuYXBwbHkodGhpcywgYXJncykgOiBhcmdzWzBdLFxuICAgICAgICBjYWNoZSA9IG1lbW9pemVkLmNhY2hlO1xuXG4gICAgaWYgKGNhY2hlLmhhcyhrZXkpKSB7XG4gICAgICByZXR1cm4gY2FjaGUuZ2V0KGtleSk7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIG1lbW9pemVkLmNhY2hlID0gY2FjaGUuc2V0KGtleSwgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBtZW1vaXplZC5jYWNoZSA9IG5ldyAobWVtb2l6ZS5DYWNoZSB8fCBNYXBDYWNoZSk7XG4gIHJldHVybiBtZW1vaXplZDtcbn1cblxuLy8gQXNzaWduIGNhY2hlIHRvIGBfLm1lbW9pemVgLlxubWVtb2l6ZS5DYWNoZSA9IE1hcENhY2hlO1xuXG4vKipcbiAqIFBlcmZvcm1zIGFcbiAqIFtgU2FtZVZhbHVlWmVyb2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXNhbWV2YWx1ZXplcm8pXG4gKiBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmUgZXF1aXZhbGVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEgfTtcbiAqIHZhciBvdGhlciA9IHsgJ2EnOiAxIH07XG4gKlxuICogXy5lcShvYmplY3QsIG9iamVjdCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcShvYmplY3QsIG90aGVyKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcSgnYScsICdhJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcSgnYScsIE9iamVjdCgnYScpKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcShOYU4sIE5hTik7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGVxKHZhbHVlLCBvdGhlcikge1xuICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOC05IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZCBmb3IgYG51bGxgXG4gKiBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmdldGAgZXhjZXB0IHRoYXQgaWYgdGhlIHJlc29sdmVkIHZhbHVlIGlzIGFcbiAqIGZ1bmN0aW9uIGl0J3MgaW52b2tlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiBpdHMgcGFyZW50IG9iamVjdCBhbmRcbiAqIGl0cyByZXN1bHQgaXMgcmV0dXJuZWQuXG4gKlxuICogQHN0YXRpY1xuICogQHNpbmNlIDAuMS4wXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIHJlc29sdmUuXG4gKiBAcGFyYW0geyp9IFtkZWZhdWx0VmFsdWVdIFRoZSB2YWx1ZSByZXR1cm5lZCBmb3IgYHVuZGVmaW5lZGAgcmVzb2x2ZWQgdmFsdWVzLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IFt7ICdiJzogeyAnYzEnOiAzLCAnYzInOiBfLmNvbnN0YW50KDQpIH0gfV0gfTtcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzEnKTtcbiAqIC8vID0+IDNcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzInKTtcbiAqIC8vID0+IDRcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzMnLCAnZGVmYXVsdCcpO1xuICogLy8gPT4gJ2RlZmF1bHQnXG4gKlxuICogXy5yZXN1bHQob2JqZWN0LCAnYVswXS5iLmMzJywgXy5jb25zdGFudCgnZGVmYXVsdCcpKTtcbiAqIC8vID0+ICdkZWZhdWx0J1xuICovXG5mdW5jdGlvbiByZXN1bHQob2JqZWN0LCBwYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgcGF0aCA9IGlzS2V5KHBhdGgsIG9iamVjdCkgPyBbcGF0aF0gOiBjYXN0UGF0aChwYXRoKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuXG4gIC8vIEVuc3VyZSB0aGUgbG9vcCBpcyBlbnRlcmVkIHdoZW4gcGF0aCBpcyBlbXB0eS5cbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBvYmplY3QgPSB1bmRlZmluZWQ7XG4gICAgbGVuZ3RoID0gMTtcbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W3RvS2V5KHBhdGhbaW5kZXhdKV07XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGluZGV4ID0gbGVuZ3RoO1xuICAgICAgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIG9iamVjdCA9IGlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN1bHQ7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiLy8gdmltOnRzPTQ6c3RzPTQ6c3c9NDpcbi8qIVxuICpcbiAqIENvcHlyaWdodCAyMDA5LTIwMTIgS3JpcyBLb3dhbCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVFxuICogbGljZW5zZSBmb3VuZCBhdCBodHRwOi8vZ2l0aHViLmNvbS9rcmlza293YWwvcS9yYXcvbWFzdGVyL0xJQ0VOU0VcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IFR5bGVyIENsb3NlXG4gKiBDb3B5cmlnaHQgMjAwNy0yMDA5IFR5bGVyIENsb3NlIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIFggbGljZW5zZSBmb3VuZFxuICogYXQgaHR0cDovL3d3dy5vcGVuc291cmNlLm9yZy9saWNlbnNlcy9taXQtbGljZW5zZS5odG1sXG4gKiBGb3JrZWQgYXQgcmVmX3NlbmQuanMgdmVyc2lvbjogMjAwOS0wNS0xMVxuICpcbiAqIFdpdGggcGFydHMgYnkgTWFyayBNaWxsZXJcbiAqIENvcHlyaWdodCAoQykgMjAxMSBHb29nbGUgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqL1xuXG4oZnVuY3Rpb24gKGRlZmluaXRpb24pIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8vIFRoaXMgZmlsZSB3aWxsIGZ1bmN0aW9uIHByb3Blcmx5IGFzIGEgPHNjcmlwdD4gdGFnLCBvciBhIG1vZHVsZVxuICAgIC8vIHVzaW5nIENvbW1vbkpTIGFuZCBOb2RlSlMgb3IgUmVxdWlyZUpTIG1vZHVsZSBmb3JtYXRzLiAgSW5cbiAgICAvLyBDb21tb24vTm9kZS9SZXF1aXJlSlMsIHRoZSBtb2R1bGUgZXhwb3J0cyB0aGUgUSBBUEkgYW5kIHdoZW5cbiAgICAvLyBleGVjdXRlZCBhcyBhIHNpbXBsZSA8c2NyaXB0PiwgaXQgY3JlYXRlcyBhIFEgZ2xvYmFsIGluc3RlYWQuXG5cbiAgICAvLyBNb250YWdlIFJlcXVpcmVcbiAgICBpZiAodHlwZW9mIGJvb3RzdHJhcCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGJvb3RzdHJhcChcInByb21pc2VcIiwgZGVmaW5pdGlvbik7XG5cbiAgICAvLyBDb21tb25KU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGRlZmluaXRpb24oKTtcblxuICAgIC8vIFJlcXVpcmVKU1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKGRlZmluaXRpb24pO1xuXG4gICAgLy8gU0VTIChTZWN1cmUgRWNtYVNjcmlwdClcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXMgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKCFzZXMub2soKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VzLm1ha2VRID0gZGVmaW5pdGlvbjtcbiAgICAgICAgfVxuXG4gICAgLy8gPHNjcmlwdD5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gUHJlZmVyIHdpbmRvdyBvdmVyIHNlbGYgZm9yIGFkZC1vbiBzY3JpcHRzLiBVc2Ugc2VsZiBmb3JcbiAgICAgICAgLy8gbm9uLXdpbmRvd2VkIGNvbnRleHRzLlxuICAgICAgICB2YXIgZ2xvYmFsID0gdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHNlbGY7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBgd2luZG93YCBvYmplY3QsIHNhdmUgdGhlIHByZXZpb3VzIFEgZ2xvYmFsXG4gICAgICAgIC8vIGFuZCBpbml0aWFsaXplIFEgYXMgYSBnbG9iYWwuXG4gICAgICAgIHZhciBwcmV2aW91c1EgPSBnbG9iYWwuUTtcbiAgICAgICAgZ2xvYmFsLlEgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAgICAgLy8gQWRkIGEgbm9Db25mbGljdCBmdW5jdGlvbiBzbyBRIGNhbiBiZSByZW1vdmVkIGZyb20gdGhlXG4gICAgICAgIC8vIGdsb2JhbCBuYW1lc3BhY2UuXG4gICAgICAgIGdsb2JhbC5RLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBnbG9iYWwuUSA9IHByZXZpb3VzUTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhpcyBlbnZpcm9ubWVudCB3YXMgbm90IGFudGljaXBhdGVkIGJ5IFEuIFBsZWFzZSBmaWxlIGEgYnVnLlwiKTtcbiAgICB9XG5cbn0pKGZ1bmN0aW9uICgpIHtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgaGFzU3RhY2tzID0gZmFsc2U7XG50cnkge1xuICAgIHRocm93IG5ldyBFcnJvcigpO1xufSBjYXRjaCAoZSkge1xuICAgIGhhc1N0YWNrcyA9ICEhZS5zdGFjaztcbn1cblxuLy8gQWxsIGNvZGUgYWZ0ZXIgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzIHJlcG9ydGVkXG4vLyBieSBRLlxudmFyIHFTdGFydGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xudmFyIHFGaWxlTmFtZTtcblxuLy8gc2hpbXNcblxuLy8gdXNlZCBmb3IgZmFsbGJhY2sgaW4gXCJhbGxSZXNvbHZlZFwiXG52YXIgbm9vcCA9IGZ1bmN0aW9uICgpIHt9O1xuXG4vLyBVc2UgdGhlIGZhc3Rlc3QgcG9zc2libGUgbWVhbnMgdG8gZXhlY3V0ZSBhIHRhc2sgaW4gYSBmdXR1cmUgdHVyblxuLy8gb2YgdGhlIGV2ZW50IGxvb3AuXG52YXIgbmV4dFRpY2sgPShmdW5jdGlvbiAoKSB7XG4gICAgLy8gbGlua2VkIGxpc3Qgb2YgdGFza3MgKHNpbmdsZSwgd2l0aCBoZWFkIG5vZGUpXG4gICAgdmFyIGhlYWQgPSB7dGFzazogdm9pZCAwLCBuZXh0OiBudWxsfTtcbiAgICB2YXIgdGFpbCA9IGhlYWQ7XG4gICAgdmFyIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgdmFyIHJlcXVlc3RUaWNrID0gdm9pZCAwO1xuICAgIHZhciBpc05vZGVKUyA9IGZhbHNlO1xuICAgIC8vIHF1ZXVlIGZvciBsYXRlIHRhc2tzLCB1c2VkIGJ5IHVuaGFuZGxlZCByZWplY3Rpb24gdHJhY2tpbmdcbiAgICB2YXIgbGF0ZXJRdWV1ZSA9IFtdO1xuXG4gICAgZnVuY3Rpb24gZmx1c2goKSB7XG4gICAgICAgIC8qIGpzaGludCBsb29wZnVuYzogdHJ1ZSAqL1xuICAgICAgICB2YXIgdGFzaywgZG9tYWluO1xuXG4gICAgICAgIHdoaWxlIChoZWFkLm5leHQpIHtcbiAgICAgICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICAgICAgICB0YXNrID0gaGVhZC50YXNrO1xuICAgICAgICAgICAgaGVhZC50YXNrID0gdm9pZCAwO1xuICAgICAgICAgICAgZG9tYWluID0gaGVhZC5kb21haW47XG5cbiAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICBoZWFkLmRvbWFpbiA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJ1blNpbmdsZSh0YXNrLCBkb21haW4pO1xuXG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGxhdGVyUXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICB0YXNrID0gbGF0ZXJRdWV1ZS5wb3AoKTtcbiAgICAgICAgICAgIHJ1blNpbmdsZSh0YXNrKTtcbiAgICAgICAgfVxuICAgICAgICBmbHVzaGluZyA9IGZhbHNlO1xuICAgIH1cbiAgICAvLyBydW5zIGEgc2luZ2xlIGZ1bmN0aW9uIGluIHRoZSBhc3luYyBxdWV1ZVxuICAgIGZ1bmN0aW9uIHJ1blNpbmdsZSh0YXNrLCBkb21haW4pIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRhc2soKTtcblxuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoaXNOb2RlSlMpIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBub2RlLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBjb25zaWRlcmVkIGZhdGFsIGVycm9ycy5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIHN5bmNocm9ub3VzbHkgdG8gaW50ZXJydXB0IGZsdXNoaW5nIVxuXG4gICAgICAgICAgICAgICAgLy8gRW5zdXJlIGNvbnRpbnVhdGlvbiBpZiB0aGUgdW5jYXVnaHQgZXhjZXB0aW9uIGlzIHN1cHByZXNzZWRcbiAgICAgICAgICAgICAgICAvLyBsaXN0ZW5pbmcgXCJ1bmNhdWdodEV4Y2VwdGlvblwiIGV2ZW50cyAoYXMgZG9tYWlucyBkb2VzKS5cbiAgICAgICAgICAgICAgICAvLyBDb250aW51ZSBpbiBuZXh0IGV2ZW50IHRvIGF2b2lkIHRpY2sgcmVjdXJzaW9uLlxuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZW50ZXIoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluIGJyb3dzZXJzLCB1bmNhdWdodCBleGNlcHRpb25zIGFyZSBub3QgZmF0YWwuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBhc3luY2hyb25vdXNseSB0byBhdm9pZCBzbG93LWRvd25zLlxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgZG9tYWluLmV4aXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG5leHRUaWNrID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgdGFpbCA9IHRhaWwubmV4dCA9IHtcbiAgICAgICAgICAgIHRhc2s6IHRhc2ssXG4gICAgICAgICAgICBkb21haW46IGlzTm9kZUpTICYmIHByb2Nlc3MuZG9tYWluLFxuICAgICAgICAgICAgbmV4dDogbnVsbFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIHByb2Nlc3MudG9TdHJpbmcoKSA9PT0gXCJbb2JqZWN0IHByb2Nlc3NdXCIgJiYgcHJvY2Vzcy5uZXh0VGljaykge1xuICAgICAgICAvLyBFbnN1cmUgUSBpcyBpbiBhIHJlYWwgTm9kZSBlbnZpcm9ubWVudCwgd2l0aCBhIGBwcm9jZXNzLm5leHRUaWNrYC5cbiAgICAgICAgLy8gVG8gc2VlIHRocm91Z2ggZmFrZSBOb2RlIGVudmlyb25tZW50czpcbiAgICAgICAgLy8gKiBNb2NoYSB0ZXN0IHJ1bm5lciAtIGV4cG9zZXMgYSBgcHJvY2Vzc2AgZ2xvYmFsIHdpdGhvdXQgYSBgbmV4dFRpY2tgXG4gICAgICAgIC8vICogQnJvd3NlcmlmeSAtIGV4cG9zZXMgYSBgcHJvY2Vzcy5uZXhUaWNrYCBmdW5jdGlvbiB0aGF0IHVzZXNcbiAgICAgICAgLy8gICBgc2V0VGltZW91dGAuIEluIHRoaXMgY2FzZSBgc2V0SW1tZWRpYXRlYCBpcyBwcmVmZXJyZWQgYmVjYXVzZVxuICAgICAgICAvLyAgICBpdCBpcyBmYXN0ZXIuIEJyb3dzZXJpZnkncyBgcHJvY2Vzcy50b1N0cmluZygpYCB5aWVsZHNcbiAgICAgICAgLy8gICBcIltvYmplY3QgT2JqZWN0XVwiLCB3aGlsZSBpbiBhIHJlYWwgTm9kZSBlbnZpcm9ubWVudFxuICAgICAgICAvLyAgIGBwcm9jZXNzLm5leHRUaWNrKClgIHlpZWxkcyBcIltvYmplY3QgcHJvY2Vzc11cIi5cbiAgICAgICAgaXNOb2RlSlMgPSB0cnVlO1xuXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcHJvY2Vzcy5uZXh0VGljayhmbHVzaCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBJbiBJRTEwLCBOb2RlLmpzIDAuOSssIG9yIGh0dHBzOi8vZ2l0aHViLmNvbS9Ob2JsZUpTL3NldEltbWVkaWF0ZVxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBzZXRJbW1lZGlhdGUuYmluZCh3aW5kb3csIGZsdXNoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNldEltbWVkaWF0ZShmbHVzaCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBNZXNzYWdlQ2hhbm5lbCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBtb2Rlcm4gYnJvd3NlcnNcbiAgICAgICAgLy8gaHR0cDovL3d3dy5ub25ibG9ja2luZy5pby8yMDExLzA2L3dpbmRvd25leHR0aWNrLmh0bWxcbiAgICAgICAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgICAgICAgLy8gQXQgbGVhc3QgU2FmYXJpIFZlcnNpb24gNi4wLjUgKDg1MzYuMzAuMSkgaW50ZXJtaXR0ZW50bHkgY2Fubm90IGNyZWF0ZVxuICAgICAgICAvLyB3b3JraW5nIG1lc3NhZ2UgcG9ydHMgdGhlIGZpcnN0IHRpbWUgYSBwYWdlIGxvYWRzLlxuICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gcmVxdWVzdFBvcnRUaWNrO1xuICAgICAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgICAgICAgICAgIGZsdXNoKCk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciByZXF1ZXN0UG9ydFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBPcGVyYSByZXF1aXJlcyB1cyB0byBwcm92aWRlIGEgbWVzc2FnZSBwYXlsb2FkLCByZWdhcmRsZXNzIG9mXG4gICAgICAgICAgICAvLyB3aGV0aGVyIHdlIHVzZSBpdC5cbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICAgIH07XG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgICAgICByZXF1ZXN0UG9ydFRpY2soKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIG9sZCBicm93c2Vyc1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyBydW5zIGEgdGFzayBhZnRlciBhbGwgb3RoZXIgdGFza3MgaGF2ZSBiZWVuIHJ1blxuICAgIC8vIHRoaXMgaXMgdXNlZnVsIGZvciB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nIHRoYXQgbmVlZHMgdG8gaGFwcGVuXG4gICAgLy8gYWZ0ZXIgYWxsIGB0aGVuYGQgdGFza3MgaGF2ZSBiZWVuIHJ1bi5cbiAgICBuZXh0VGljay5ydW5BZnRlciA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIGxhdGVyUXVldWUucHVzaCh0YXNrKTtcbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIG5leHRUaWNrO1xufSkoKTtcblxuLy8gQXR0ZW1wdCB0byBtYWtlIGdlbmVyaWNzIHNhZmUgaW4gdGhlIGZhY2Ugb2YgZG93bnN0cmVhbVxuLy8gbW9kaWZpY2F0aW9ucy5cbi8vIFRoZXJlIGlzIG5vIHNpdHVhdGlvbiB3aGVyZSB0aGlzIGlzIG5lY2Vzc2FyeS5cbi8vIElmIHlvdSBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLCB0aGVzZSBwcmltb3JkaWFscyBuZWVkIHRvIGJlXG4vLyBkZWVwbHkgZnJvemVuIGFueXdheSwgYW5kIGlmIHlvdSBkb27igJl0IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsXG4vLyB0aGlzIGlzIGp1c3QgcGxhaW4gcGFyYW5vaWQuXG4vLyBIb3dldmVyLCB0aGlzICoqbWlnaHQqKiBoYXZlIHRoZSBuaWNlIHNpZGUtZWZmZWN0IG9mIHJlZHVjaW5nIHRoZSBzaXplIG9mXG4vLyB0aGUgbWluaWZpZWQgY29kZSBieSByZWR1Y2luZyB4LmNhbGwoKSB0byBtZXJlbHkgeCgpXG4vLyBTZWUgTWFyayBNaWxsZXLigJlzIGV4cGxhbmF0aW9uIG9mIHdoYXQgdGhpcyBkb2VzLlxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9Y29udmVudGlvbnM6c2FmZV9tZXRhX3Byb2dyYW1taW5nXG52YXIgY2FsbCA9IEZ1bmN0aW9uLmNhbGw7XG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwuYXBwbHkoZiwgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuLy8gVGhpcyBpcyBlcXVpdmFsZW50LCBidXQgc2xvd2VyOlxuLy8gdW5jdXJyeVRoaXMgPSBGdW5jdGlvbl9iaW5kLmJpbmQoRnVuY3Rpb25fYmluZC5jYWxsKTtcbi8vIGh0dHA6Ly9qc3BlcmYuY29tL3VuY3Vycnl0aGlzXG5cbnZhciBhcnJheV9zbGljZSA9IHVuY3VycnlUaGlzKEFycmF5LnByb3RvdHlwZS5zbGljZSk7XG5cbnZhciBhcnJheV9yZWR1Y2UgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUucmVkdWNlIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgYmFzaXMpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gMCxcbiAgICAgICAgICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoO1xuICAgICAgICAvLyBjb25jZXJuaW5nIHRoZSBpbml0aWFsIHZhbHVlLCBpZiBvbmUgaXMgbm90IHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAvLyBzZWVrIHRvIHRoZSBmaXJzdCB2YWx1ZSBpbiB0aGUgYXJyYXksIGFjY291bnRpbmdcbiAgICAgICAgICAgIC8vIGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCBpcyBpcyBhIHNwYXJzZSBhcnJheVxuICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2lzID0gdGhpc1tpbmRleCsrXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgrK2luZGV4ID49IGxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSB3aGlsZSAoMSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVkdWNlXG4gICAgICAgIGZvciAoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgLy8gYWNjb3VudCBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgdGhlIGFycmF5IGlzIHNwYXJzZVxuICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICBiYXNpcyA9IGNhbGxiYWNrKGJhc2lzLCB0aGlzW2luZGV4XSwgaW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBiYXNpcztcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfaW5kZXhPZiA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5pbmRleE9mIHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBub3QgYSB2ZXJ5IGdvb2Qgc2hpbSwgYnV0IGdvb2QgZW5vdWdoIGZvciBvdXIgb25lIHVzZSBvZiBpdFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzW2ldID09PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4pO1xuXG52YXIgYXJyYXlfbWFwID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLm1hcCB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNvbGxlY3QgPSBbXTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHNlbGYsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHZhbHVlLCBpbmRleCkge1xuICAgICAgICAgICAgY29sbGVjdC5wdXNoKGNhbGxiYWNrLmNhbGwodGhpc3AsIHZhbHVlLCBpbmRleCwgc2VsZikpO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICByZXR1cm4gY29sbGVjdDtcbiAgICB9XG4pO1xuXG52YXIgb2JqZWN0X2NyZWF0ZSA9IE9iamVjdC5jcmVhdGUgfHwgZnVuY3Rpb24gKHByb3RvdHlwZSkge1xuICAgIGZ1bmN0aW9uIFR5cGUoKSB7IH1cbiAgICBUeXBlLnByb3RvdHlwZSA9IHByb3RvdHlwZTtcbiAgICByZXR1cm4gbmV3IFR5cGUoKTtcbn07XG5cbnZhciBvYmplY3RfaGFzT3duUHJvcGVydHkgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5KTtcblxudmFyIG9iamVjdF9rZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHZhciBrZXlzID0gW107XG4gICAgZm9yICh2YXIga2V5IGluIG9iamVjdCkge1xuICAgICAgICBpZiAob2JqZWN0X2hhc093blByb3BlcnR5KG9iamVjdCwga2V5KSkge1xuICAgICAgICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGtleXM7XG59O1xuXG52YXIgb2JqZWN0X3RvU3RyaW5nID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyk7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlID09PSBPYmplY3QodmFsdWUpO1xufVxuXG4vLyBnZW5lcmF0b3IgcmVsYXRlZCBzaGltc1xuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgZnVuY3Rpb24gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuZnVuY3Rpb24gaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikge1xuICAgIHJldHVybiAoXG4gICAgICAgIG9iamVjdF90b1N0cmluZyhleGNlcHRpb24pID09PSBcIltvYmplY3QgU3RvcEl0ZXJhdGlvbl1cIiB8fFxuICAgICAgICBleGNlcHRpb24gaW5zdGFuY2VvZiBRUmV0dXJuVmFsdWVcbiAgICApO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaGVscGVyIGFuZCBRLnJldHVybiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpblxuLy8gU3BpZGVyTW9ua2V5LlxudmFyIFFSZXR1cm5WYWx1ZTtcbmlmICh0eXBlb2YgUmV0dXJuVmFsdWUgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBSZXR1cm5WYWx1ZTtcbn0gZWxzZSB7XG4gICAgUVJldHVyblZhbHVlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICB9O1xufVxuXG4vLyBsb25nIHN0YWNrIHRyYWNlc1xuXG52YXIgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgPSBcIkZyb20gcHJldmlvdXMgZXZlbnQ6XCI7XG5cbmZ1bmN0aW9uIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSkge1xuICAgIC8vIElmIHBvc3NpYmxlLCB0cmFuc2Zvcm0gdGhlIGVycm9yIHN0YWNrIHRyYWNlIGJ5IHJlbW92aW5nIE5vZGUgYW5kIFFcbiAgICAvLyBjcnVmdCwgdGhlbiBjb25jYXRlbmF0aW5nIHdpdGggdGhlIHN0YWNrIHRyYWNlIG9mIGBwcm9taXNlYC4gU2VlICM1Ny5cbiAgICBpZiAoaGFzU3RhY2tzICYmXG4gICAgICAgIHByb21pc2Uuc3RhY2sgJiZcbiAgICAgICAgdHlwZW9mIGVycm9yID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIGVycm9yICE9PSBudWxsICYmXG4gICAgICAgIGVycm9yLnN0YWNrICYmXG4gICAgICAgIGVycm9yLnN0YWNrLmluZGV4T2YoU1RBQ0tfSlVNUF9TRVBBUkFUT1IpID09PSAtMVxuICAgICkge1xuICAgICAgICB2YXIgc3RhY2tzID0gW107XG4gICAgICAgIGZvciAodmFyIHAgPSBwcm9taXNlOyAhIXA7IHAgPSBwLnNvdXJjZSkge1xuICAgICAgICAgICAgaWYgKHAuc3RhY2spIHtcbiAgICAgICAgICAgICAgICBzdGFja3MudW5zaGlmdChwLnN0YWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdGFja3MudW5zaGlmdChlcnJvci5zdGFjayk7XG5cbiAgICAgICAgdmFyIGNvbmNhdGVkU3RhY2tzID0gc3RhY2tzLmpvaW4oXCJcXG5cIiArIFNUQUNLX0pVTVBfU0VQQVJBVE9SICsgXCJcXG5cIik7XG4gICAgICAgIGVycm9yLnN0YWNrID0gZmlsdGVyU3RhY2tTdHJpbmcoY29uY2F0ZWRTdGFja3MpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZmlsdGVyU3RhY2tTdHJpbmcoc3RhY2tTdHJpbmcpIHtcbiAgICB2YXIgbGluZXMgPSBzdGFja1N0cmluZy5zcGxpdChcIlxcblwiKTtcbiAgICB2YXIgZGVzaXJlZExpbmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgbGluZSA9IGxpbmVzW2ldO1xuXG4gICAgICAgIGlmICghaXNJbnRlcm5hbEZyYW1lKGxpbmUpICYmICFpc05vZGVGcmFtZShsaW5lKSAmJiBsaW5lKSB7XG4gICAgICAgICAgICBkZXNpcmVkTGluZXMucHVzaChsaW5lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzaXJlZExpbmVzLmpvaW4oXCJcXG5cIik7XG59XG5cbmZ1bmN0aW9uIGlzTm9kZUZyYW1lKHN0YWNrTGluZSkge1xuICAgIHJldHVybiBzdGFja0xpbmUuaW5kZXhPZihcIihtb2R1bGUuanM6XCIpICE9PSAtMSB8fFxuICAgICAgICAgICBzdGFja0xpbmUuaW5kZXhPZihcIihub2RlLmpzOlwiKSAhPT0gLTE7XG59XG5cbmZ1bmN0aW9uIGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpIHtcbiAgICAvLyBOYW1lZCBmdW5jdGlvbnM6IFwiYXQgZnVuY3Rpb25OYW1lIChmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlcilcIlxuICAgIC8vIEluIElFMTAgZnVuY3Rpb24gbmFtZSBjYW4gaGF2ZSBzcGFjZXMgKFwiQW5vbnltb3VzIGZ1bmN0aW9uXCIpIE9fb1xuICAgIHZhciBhdHRlbXB0MSA9IC9hdCAuKyBcXCgoLispOihcXGQrKTooPzpcXGQrKVxcKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDEpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MVsxXSwgTnVtYmVyKGF0dGVtcHQxWzJdKV07XG4gICAgfVxuXG4gICAgLy8gQW5vbnltb3VzIGZ1bmN0aW9uczogXCJhdCBmaWxlbmFtZTpsaW5lTnVtYmVyOmNvbHVtbk51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQyID0gL2F0IChbXiBdKyk6KFxcZCspOig/OlxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mikge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQyWzFdLCBOdW1iZXIoYXR0ZW1wdDJbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBGaXJlZm94IHN0eWxlOiBcImZ1bmN0aW9uQGZpbGVuYW1lOmxpbmVOdW1iZXIgb3IgQGZpbGVuYW1lOmxpbmVOdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MyA9IC8uKkAoLispOihcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDMpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0M1sxXSwgTnVtYmVyKGF0dGVtcHQzWzJdKV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBpc0ludGVybmFsRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihzdGFja0xpbmUpO1xuXG4gICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICB2YXIgbGluZU51bWJlciA9IGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcblxuICAgIHJldHVybiBmaWxlTmFtZSA9PT0gcUZpbGVOYW1lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPj0gcVN0YXJ0aW5nTGluZSAmJlxuICAgICAgICBsaW5lTnVtYmVyIDw9IHFFbmRpbmdMaW5lO1xufVxuXG4vLyBkaXNjb3ZlciBvd24gZmlsZSBuYW1lIGFuZCBsaW5lIG51bWJlciByYW5nZSBmb3IgZmlsdGVyaW5nIHN0YWNrXG4vLyB0cmFjZXNcbmZ1bmN0aW9uIGNhcHR1cmVMaW5lKCkge1xuICAgIGlmICghaGFzU3RhY2tzKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBsaW5lcyA9IGUuc3RhY2suc3BsaXQoXCJcXG5cIik7XG4gICAgICAgIHZhciBmaXJzdExpbmUgPSBsaW5lc1swXS5pbmRleE9mKFwiQFwiKSA+IDAgPyBsaW5lc1sxXSA6IGxpbmVzWzJdO1xuICAgICAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKGZpcnN0TGluZSk7XG4gICAgICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBxRmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgICAgIHJldHVybiBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkZXByZWNhdGUoY2FsbGJhY2ssIG5hbWUsIGFsdGVybmF0aXZlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgICAgICAgICB0eXBlb2YgY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihuYW1lICsgXCIgaXMgZGVwcmVjYXRlZCwgdXNlIFwiICsgYWx0ZXJuYXRpdmUgK1xuICAgICAgICAgICAgICAgICAgICAgICAgIFwiIGluc3RlYWQuXCIsIG5ldyBFcnJvcihcIlwiKS5zdGFjayk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KGNhbGxiYWNrLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG5cbi8vIGVuZCBvZiBzaGltc1xuLy8gYmVnaW5uaW5nIG9mIHJlYWwgd29ya1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLCBwYXNzZXMgcHJvbWlzZXMgdGhyb3VnaCwgb3JcbiAqIGNvZXJjZXMgcHJvbWlzZXMgZnJvbSBkaWZmZXJlbnQgc3lzdGVtcy5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlIG9yIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gUSh2YWx1ZSkge1xuICAgIC8vIElmIHRoZSBvYmplY3QgaXMgYWxyZWFkeSBhIFByb21pc2UsIHJldHVybiBpdCBkaXJlY3RseS4gIFRoaXMgZW5hYmxlc1xuICAgIC8vIHRoZSByZXNvbHZlIGZ1bmN0aW9uIHRvIGJvdGggYmUgdXNlZCB0byBjcmVhdGVkIHJlZmVyZW5jZXMgZnJvbSBvYmplY3RzLFxuICAgIC8vIGJ1dCB0byB0b2xlcmFibHkgY29lcmNlIG5vbi1wcm9taXNlcyB0byBwcm9taXNlcy5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICAvLyBhc3NpbWlsYXRlIHRoZW5hYmxlc1xuICAgIGlmIChpc1Byb21pc2VBbGlrZSh2YWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIGNvZXJjZSh2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGwodmFsdWUpO1xuICAgIH1cbn1cblEucmVzb2x2ZSA9IFE7XG5cbi8qKlxuICogUGVyZm9ybXMgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm4gb2YgdGhlIGV2ZW50IGxvb3AuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSB0YXNrXG4gKi9cblEubmV4dFRpY2sgPSBuZXh0VGljaztcblxuLyoqXG4gKiBDb250cm9scyB3aGV0aGVyIG9yIG5vdCBsb25nIHN0YWNrIHRyYWNlcyB3aWxsIGJlIG9uXG4gKi9cblEubG9uZ1N0YWNrU3VwcG9ydCA9IGZhbHNlO1xuXG4vLyBlbmFibGUgbG9uZyBzdGFja3MgaWYgUV9ERUJVRyBpcyBzZXRcbmlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZW52ICYmIHByb2Nlc3MuZW52LlFfREVCVUcpIHtcbiAgICBRLmxvbmdTdGFja1N1cHBvcnQgPSB0cnVlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSB7cHJvbWlzZSwgcmVzb2x2ZSwgcmVqZWN0fSBvYmplY3QuXG4gKlxuICogYHJlc29sdmVgIGlzIGEgY2FsbGJhY2sgdG8gaW52b2tlIHdpdGggYSBtb3JlIHJlc29sdmVkIHZhbHVlIGZvciB0aGVcbiAqIHByb21pc2UuIFRvIGZ1bGZpbGwgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhbnkgdmFsdWUgdGhhdCBpc1xuICogbm90IGEgdGhlbmFibGUuIFRvIHJlamVjdCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGEgcmVqZWN0ZWRcbiAqIHRoZW5hYmxlLCBvciBpbnZva2UgYHJlamVjdGAgd2l0aCB0aGUgcmVhc29uIGRpcmVjdGx5LiBUbyByZXNvbHZlIHRoZVxuICogcHJvbWlzZSB0byBhbm90aGVyIHRoZW5hYmxlLCB0aHVzIHB1dHRpbmcgaXQgaW4gdGhlIHNhbWUgc3RhdGUsIGludm9rZVxuICogYHJlc29sdmVgIHdpdGggdGhhdCBvdGhlciB0aGVuYWJsZS5cbiAqL1xuUS5kZWZlciA9IGRlZmVyO1xuZnVuY3Rpb24gZGVmZXIoKSB7XG4gICAgLy8gaWYgXCJtZXNzYWdlc1wiIGlzIGFuIFwiQXJyYXlcIiwgdGhhdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcHJvbWlzZSBoYXMgbm90IHlldFxuICAgIC8vIGJlZW4gcmVzb2x2ZWQuICBJZiBpdCBpcyBcInVuZGVmaW5lZFwiLCBpdCBoYXMgYmVlbiByZXNvbHZlZC4gIEVhY2hcbiAgICAvLyBlbGVtZW50IG9mIHRoZSBtZXNzYWdlcyBhcnJheSBpcyBpdHNlbGYgYW4gYXJyYXkgb2YgY29tcGxldGUgYXJndW1lbnRzIHRvXG4gICAgLy8gZm9yd2FyZCB0byB0aGUgcmVzb2x2ZWQgcHJvbWlzZS4gIFdlIGNvZXJjZSB0aGUgcmVzb2x1dGlvbiB2YWx1ZSB0byBhXG4gICAgLy8gcHJvbWlzZSB1c2luZyB0aGUgYHJlc29sdmVgIGZ1bmN0aW9uIGJlY2F1c2UgaXQgaGFuZGxlcyBib3RoIGZ1bGx5XG4gICAgLy8gbm9uLXRoZW5hYmxlIHZhbHVlcyBhbmQgb3RoZXIgdGhlbmFibGVzIGdyYWNlZnVsbHkuXG4gICAgdmFyIG1lc3NhZ2VzID0gW10sIHByb2dyZXNzTGlzdGVuZXJzID0gW10sIHJlc29sdmVkUHJvbWlzZTtcblxuICAgIHZhciBkZWZlcnJlZCA9IG9iamVjdF9jcmVhdGUoZGVmZXIucHJvdG90eXBlKTtcbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIG9wZXJhbmRzKSB7XG4gICAgICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICBtZXNzYWdlcy5wdXNoKGFyZ3MpO1xuICAgICAgICAgICAgaWYgKG9wID09PSBcIndoZW5cIiAmJiBvcGVyYW5kc1sxXSkgeyAvLyBwcm9ncmVzcyBvcGVyYW5kXG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMucHVzaChvcGVyYW5kc1sxXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlZFByb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KHJlc29sdmVkUHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZFxuICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKG1lc3NhZ2VzKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmVhcmVyVmFsdWUgPSBuZWFyZXIocmVzb2x2ZWRQcm9taXNlKTtcbiAgICAgICAgaWYgKGlzUHJvbWlzZShuZWFyZXJWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5lYXJlclZhbHVlOyAvLyBzaG9ydGVuIGNoYWluXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5lYXJlclZhbHVlO1xuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghcmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJwZW5kaW5nXCIgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzb2x2ZWRQcm9taXNlLmluc3BlY3QoKTtcbiAgICB9O1xuXG4gICAgaWYgKFEubG9uZ1N0YWNrU3VwcG9ydCAmJiBoYXNTdGFja3MpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBOT1RFOiBkb24ndCB0cnkgdG8gdXNlIGBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZWAgb3IgdHJhbnNmZXIgdGhlXG4gICAgICAgICAgICAvLyBhY2Nlc3NvciBhcm91bmQ7IHRoYXQgY2F1c2VzIG1lbW9yeSBsZWFrcyBhcyBwZXIgR0gtMTExLiBKdXN0XG4gICAgICAgICAgICAvLyByZWlmeSB0aGUgc3RhY2sgdHJhY2UgYXMgYSBzdHJpbmcgQVNBUC5cbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAvLyBBdCB0aGUgc2FtZSB0aW1lLCBjdXQgb2ZmIHRoZSBmaXJzdCBsaW5lOyBpdCdzIGFsd2F5cyBqdXN0XG4gICAgICAgICAgICAvLyBcIltvYmplY3QgUHJvbWlzZV1cXG5cIiwgYXMgcGVyIHRoZSBgdG9TdHJpbmdgLlxuICAgICAgICAgICAgcHJvbWlzZS5zdGFjayA9IGUuc3RhY2suc3Vic3RyaW5nKGUuc3RhY2suaW5kZXhPZihcIlxcblwiKSArIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTk9URTogd2UgZG8gdGhlIGNoZWNrcyBmb3IgYHJlc29sdmVkUHJvbWlzZWAgaW4gZWFjaCBtZXRob2QsIGluc3RlYWQgb2ZcbiAgICAvLyBjb25zb2xpZGF0aW5nIHRoZW0gaW50byBgYmVjb21lYCwgc2luY2Ugb3RoZXJ3aXNlIHdlJ2QgY3JlYXRlIG5ld1xuICAgIC8vIHByb21pc2VzIHdpdGggdGhlIGxpbmVzIGBiZWNvbWUod2hhdGV2ZXIodmFsdWUpKWAuIFNlZSBlLmcuIEdILTI1Mi5cblxuICAgIGZ1bmN0aW9uIGJlY29tZShuZXdQcm9taXNlKSB7XG4gICAgICAgIHJlc29sdmVkUHJvbWlzZSA9IG5ld1Byb21pc2U7XG4gICAgICAgIHByb21pc2Uuc291cmNlID0gbmV3UHJvbWlzZTtcblxuICAgICAgICBhcnJheV9yZWR1Y2UobWVzc2FnZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5ld1Byb21pc2UucHJvbWlzZURpc3BhdGNoLmFwcGx5KG5ld1Byb21pc2UsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG5cbiAgICAgICAgbWVzc2FnZXMgPSB2b2lkIDA7XG4gICAgICAgIHByb2dyZXNzTGlzdGVuZXJzID0gdm9pZCAwO1xuICAgIH1cblxuICAgIGRlZmVycmVkLnByb21pc2UgPSBwcm9taXNlO1xuICAgIGRlZmVycmVkLnJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKFEodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgZGVmZXJyZWQuZnVsZmlsbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoZnVsZmlsbCh2YWx1ZSkpO1xuICAgIH07XG4gICAgZGVmZXJyZWQucmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUocmVqZWN0KHJlYXNvbikpO1xuICAgIH07XG4gICAgZGVmZXJyZWQubm90aWZ5ID0gZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9ncmVzc0xpc3RlbmVycywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvZ3Jlc3NMaXN0ZW5lcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcihwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIGRlZmVycmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBOb2RlLXN0eWxlIGNhbGxiYWNrIHRoYXQgd2lsbCByZXNvbHZlIG9yIHJlamVjdCB0aGUgZGVmZXJyZWRcbiAqIHByb21pc2UuXG4gKiBAcmV0dXJucyBhIG5vZGViYWNrXG4gKi9cbmRlZmVyLnByb3RvdHlwZS5tYWtlTm9kZVJlc29sdmVyID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24gKGVycm9yLCB2YWx1ZSkge1xuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHNlbGYucmVqZWN0KGVycm9yKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMikge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4vKipcbiAqIEBwYXJhbSByZXNvbHZlciB7RnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIG5vdGhpbmcgYW5kIGFjY2VwdHNcbiAqIHRoZSByZXNvbHZlLCByZWplY3QsIGFuZCBub3RpZnkgZnVuY3Rpb25zIGZvciBhIGRlZmVycmVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIHRoYXQgbWF5IGJlIHJlc29sdmVkIHdpdGggdGhlIGdpdmVuIHJlc29sdmUgYW5kIHJlamVjdFxuICogZnVuY3Rpb25zLCBvciByZWplY3RlZCBieSBhIHRocm93biBleGNlcHRpb24gaW4gcmVzb2x2ZXJcbiAqL1xuUS5Qcm9taXNlID0gcHJvbWlzZTsgLy8gRVM2XG5RLnByb21pc2UgPSBwcm9taXNlO1xuZnVuY3Rpb24gcHJvbWlzZShyZXNvbHZlcikge1xuICAgIGlmICh0eXBlb2YgcmVzb2x2ZXIgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwicmVzb2x2ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB0cnkge1xuICAgICAgICByZXNvbHZlcihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgfSBjYXRjaCAocmVhc29uKSB7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChyZWFzb24pO1xuICAgIH1cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxucHJvbWlzZS5yYWNlID0gcmFjZTsgLy8gRVM2XG5wcm9taXNlLmFsbCA9IGFsbDsgLy8gRVM2XG5wcm9taXNlLnJlamVjdCA9IHJlamVjdDsgLy8gRVM2XG5wcm9taXNlLnJlc29sdmUgPSBROyAvLyBFUzZcblxuLy8gWFhYIGV4cGVyaW1lbnRhbC4gIFRoaXMgbWV0aG9kIGlzIGEgd2F5IHRvIGRlbm90ZSB0aGF0IGEgbG9jYWwgdmFsdWUgaXNcbi8vIHNlcmlhbGl6YWJsZSBhbmQgc2hvdWxkIGJlIGltbWVkaWF0ZWx5IGRpc3BhdGNoZWQgdG8gYSByZW1vdGUgdXBvbiByZXF1ZXN0LFxuLy8gaW5zdGVhZCBvZiBwYXNzaW5nIGEgcmVmZXJlbmNlLlxuUS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIG9iamVjdDtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogSWYgdHdvIHByb21pc2VzIGV2ZW50dWFsbHkgZnVsZmlsbCB0byB0aGUgc2FtZSB2YWx1ZSwgcHJvbWlzZXMgdGhhdCB2YWx1ZSxcbiAqIGJ1dCBvdGhlcndpc2UgcmVqZWN0cy5cbiAqIEBwYXJhbSB4IHtBbnkqfVxuICogQHBhcmFtIHkge0FueSp9XG4gKiBAcmV0dXJucyB7QW55Kn0gYSBwcm9taXNlIGZvciB4IGFuZCB5IGlmIHRoZXkgYXJlIHRoZSBzYW1lLCBidXQgYSByZWplY3Rpb25cbiAqIG90aGVyd2lzZS5cbiAqXG4gKi9cblEuam9pbiA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgcmV0dXJuIFEoeCkuam9pbih5KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAodGhhdCkge1xuICAgIHJldHVybiBRKFt0aGlzLCB0aGF0XSkuc3ByZWFkKGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgICAgIGlmICh4ID09PSB5KSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBcIj09PVwiIHNob3VsZCBiZSBPYmplY3QuaXMgb3IgZXF1aXZcbiAgICAgICAgICAgIHJldHVybiB4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3Qgam9pbjogbm90IHRoZSBzYW1lOiBcIiArIHggKyBcIiBcIiArIHkpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZmlyc3Qgb2YgYW4gYXJyYXkgb2YgcHJvbWlzZXMgdG8gYmVjb21lIHNldHRsZWQuXG4gKiBAcGFyYW0gYW5zd2VycyB7QXJyYXlbQW55Kl19IHByb21pc2VzIHRvIHJhY2VcbiAqIEByZXR1cm5zIHtBbnkqfSB0aGUgZmlyc3QgcHJvbWlzZSB0byBiZSBzZXR0bGVkXG4gKi9cblEucmFjZSA9IHJhY2U7XG5mdW5jdGlvbiByYWNlKGFuc3dlclBzKSB7XG4gICAgcmV0dXJuIHByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAvLyBTd2l0Y2ggdG8gdGhpcyBvbmNlIHdlIGNhbiBhc3N1bWUgYXQgbGVhc3QgRVM1XG4gICAgICAgIC8vIGFuc3dlclBzLmZvckVhY2goZnVuY3Rpb24gKGFuc3dlclApIHtcbiAgICAgICAgLy8gICAgIFEoYW5zd2VyUCkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICAvLyB9KTtcbiAgICAgICAgLy8gVXNlIHRoaXMgaW4gdGhlIG1lYW50aW1lXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhbnN3ZXJQcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgUShhbnN3ZXJQc1tpXSkudGhlbihyZXNvbHZlLCByZWplY3QpO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnJhY2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihRLnJhY2UpO1xufTtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgUHJvbWlzZSB3aXRoIGEgcHJvbWlzZSBkZXNjcmlwdG9yIG9iamVjdCBhbmQgb3B0aW9uYWwgZmFsbGJhY2tcbiAqIGZ1bmN0aW9uLiAgVGhlIGRlc2NyaXB0b3IgY29udGFpbnMgbWV0aG9kcyBsaWtlIHdoZW4ocmVqZWN0ZWQpLCBnZXQobmFtZSksXG4gKiBzZXQobmFtZSwgdmFsdWUpLCBwb3N0KG5hbWUsIGFyZ3MpLCBhbmQgZGVsZXRlKG5hbWUpLCB3aGljaCBhbGxcbiAqIHJldHVybiBlaXRoZXIgYSB2YWx1ZSwgYSBwcm9taXNlIGZvciBhIHZhbHVlLCBvciBhIHJlamVjdGlvbi4gIFRoZSBmYWxsYmFja1xuICogYWNjZXB0cyB0aGUgb3BlcmF0aW9uIG5hbWUsIGEgcmVzb2x2ZXIsIGFuZCBhbnkgZnVydGhlciBhcmd1bWVudHMgdGhhdCB3b3VsZFxuICogaGF2ZSBiZWVuIGZvcndhcmRlZCB0byB0aGUgYXBwcm9wcmlhdGUgbWV0aG9kIGFib3ZlIGhhZCBhIG1ldGhvZCBiZWVuXG4gKiBwcm92aWRlZCB3aXRoIHRoZSBwcm9wZXIgbmFtZS4gIFRoZSBBUEkgbWFrZXMgbm8gZ3VhcmFudGVlcyBhYm91dCB0aGUgbmF0dXJlXG4gKiBvZiB0aGUgcmV0dXJuZWQgb2JqZWN0LCBhcGFydCBmcm9tIHRoYXQgaXQgaXMgdXNhYmxlIHdoZXJlZXZlciBwcm9taXNlcyBhcmVcbiAqIGJvdWdodCBhbmQgc29sZC5cbiAqL1xuUS5tYWtlUHJvbWlzZSA9IFByb21pc2U7XG5mdW5jdGlvbiBQcm9taXNlKGRlc2NyaXB0b3IsIGZhbGxiYWNrLCBpbnNwZWN0KSB7XG4gICAgaWYgKGZhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgZmFsbGJhY2sgPSBmdW5jdGlvbiAob3ApIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgIFwiUHJvbWlzZSBkb2VzIG5vdCBzdXBwb3J0IG9wZXJhdGlvbjogXCIgKyBvcFxuICAgICAgICAgICAgKSk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmIChpbnNwZWN0ID09PSB2b2lkIDApIHtcbiAgICAgICAgaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7c3RhdGU6IFwidW5rbm93blwifTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcHJvbWlzZSA9IG9iamVjdF9jcmVhdGUoUHJvbWlzZS5wcm90b3R5cGUpO1xuXG4gICAgcHJvbWlzZS5wcm9taXNlRGlzcGF0Y2ggPSBmdW5jdGlvbiAocmVzb2x2ZSwgb3AsIGFyZ3MpIHtcbiAgICAgICAgdmFyIHJlc3VsdDtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdG9yW29wXSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGRlc2NyaXB0b3Jbb3BdLmFwcGx5KHByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBmYWxsYmFjay5jYWxsKHByb21pc2UsIG9wLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXN1bHQgPSByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzb2x2ZSkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGluc3BlY3Q7XG5cbiAgICAvLyBYWFggZGVwcmVjYXRlZCBgdmFsdWVPZmAgYW5kIGBleGNlcHRpb25gIHN1cHBvcnRcbiAgICBpZiAoaW5zcGVjdCkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgIHByb21pc2UuZXhjZXB0aW9uID0gaW5zcGVjdGVkLnJlYXNvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb21pc2UudmFsdWVPZiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcInBlbmRpbmdcIiB8fFxuICAgICAgICAgICAgICAgIGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gXCJbb2JqZWN0IFByb21pc2VdXCI7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgZG9uZSA9IGZhbHNlOyAgIC8vIGVuc3VyZSB0aGUgdW50cnVzdGVkIHByb21pc2UgbWFrZXMgYXQgbW9zdCBhXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaW5nbGUgY2FsbCB0byBvbmUgb2YgdGhlIGNhbGxiYWNrc1xuXG4gICAgZnVuY3Rpb24gX2Z1bGZpbGxlZCh2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHR5cGVvZiBmdWxmaWxsZWQgPT09IFwiZnVuY3Rpb25cIiA/IGZ1bGZpbGxlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcmVqZWN0ZWQoZXhjZXB0aW9uKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmVqZWN0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGV4Y2VwdGlvbiwgc2VsZik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3RlZChleGNlcHRpb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAobmV3RXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXdFeGNlcHRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBfcHJvZ3Jlc3NlZCh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdHlwZW9mIHByb2dyZXNzZWQgPT09IFwiZnVuY3Rpb25cIiA/IHByb2dyZXNzZWQodmFsdWUpIDogdmFsdWU7XG4gICAgfVxuXG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfZnVsZmlsbGVkKHZhbHVlKSk7XG4gICAgICAgIH0sIFwid2hlblwiLCBbZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShfcmVqZWN0ZWQoZXhjZXB0aW9uKSk7XG4gICAgICAgIH1dKTtcbiAgICB9KTtcblxuICAgIC8vIFByb2dyZXNzIHByb3BhZ2F0b3IgbmVlZCB0byBiZSBhdHRhY2hlZCBpbiB0aGUgY3VycmVudCB0aWNrLlxuICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKHZvaWQgMCwgXCJ3aGVuXCIsIFt2b2lkIDAsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgbmV3VmFsdWU7XG4gICAgICAgIHZhciB0aHJldyA9IGZhbHNlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbmV3VmFsdWUgPSBfcHJvZ3Jlc3NlZCh2YWx1ZSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocmV3ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXRocmV3KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkobmV3VmFsdWUpO1xuICAgICAgICB9XG4gICAgfV0pO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5RLnRhcCA9IGZ1bmN0aW9uIChwcm9taXNlLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRhcChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFdvcmtzIGFsbW9zdCBsaWtlIFwiZmluYWxseVwiLCBidXQgbm90IGNhbGxlZCBmb3IgcmVqZWN0aW9ucy5cbiAqIE9yaWdpbmFsIHJlc29sdXRpb24gdmFsdWUgaXMgcGFzc2VkIHRocm91Z2ggY2FsbGJhY2sgdW5hZmZlY3RlZC5cbiAqIENhbGxiYWNrIG1heSByZXR1cm4gYSBwcm9taXNlIHRoYXQgd2lsbCBiZSBhd2FpdGVkIGZvci5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJucyB7US5Qcm9taXNlfVxuICogQGV4YW1wbGVcbiAqIGRvU29tZXRoaW5nKClcbiAqICAgLnRoZW4oLi4uKVxuICogICAudGFwKGNvbnNvbGUubG9nKVxuICogICAudGhlbiguLi4pO1xuICovXG5Qcm9taXNlLnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKHZhbHVlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBvYnNlcnZlciBvbiBhIHByb21pc2UuXG4gKlxuICogR3VhcmFudGVlczpcbiAqXG4gKiAxLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICogMi4gdGhhdCBlaXRoZXIgdGhlIGZ1bGZpbGxlZCBjYWxsYmFjayBvciB0aGUgcmVqZWN0ZWQgY2FsbGJhY2sgd2lsbCBiZVxuICogICAgY2FsbGVkLCBidXQgbm90IGJvdGguXG4gKiAzLiB0aGF0IGZ1bGZpbGxlZCBhbmQgcmVqZWN0ZWQgd2lsbCBub3QgYmUgY2FsbGVkIGluIHRoaXMgdHVybi5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgICAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgdG8gb2JzZXJ2ZVxuICogQHBhcmFtIGZ1bGZpbGxlZCAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogQHBhcmFtIHJlamVjdGVkICAgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdpdGggdGhlIHJlamVjdGlvbiBleGNlcHRpb25cbiAqIEBwYXJhbSBwcm9ncmVzc2VkIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBvbiBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIGZyb20gdGhlIGludm9rZWQgY2FsbGJhY2tcbiAqL1xuUS53aGVuID0gd2hlbjtcbmZ1bmN0aW9uIHdoZW4odmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlc29sdmUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHZhbHVlOyB9KTtcbn07XG5cblEudGhlblJlc29sdmUgPSBmdW5jdGlvbiAocHJvbWlzZSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVzb2x2ZSh2YWx1ZSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyB0aHJvdyByZWFzb247IH0pO1xufTtcblxuUS50aGVuUmVqZWN0ID0gZnVuY3Rpb24gKHByb21pc2UsIHJlYXNvbikge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZWplY3QocmVhc29uKTtcbn07XG5cbi8qKlxuICogSWYgYW4gb2JqZWN0IGlzIG5vdCBhIHByb21pc2UsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlLlxuICogSWYgYSBwcm9taXNlIGlzIHJlamVjdGVkLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZSB0b28uXG4gKiBJZiBpdOKAmXMgYSBmdWxmaWxsZWQgcHJvbWlzZSwgdGhlIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5lYXJlci5cbiAqIElmIGl04oCZcyBhIGRlZmVycmVkIHByb21pc2UgYW5kIHRoZSBkZWZlcnJlZCBoYXMgYmVlbiByZXNvbHZlZCwgdGhlXG4gKiByZXNvbHV0aW9uIGlzIFwibmVhcmVyXCIuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBtb3N0IHJlc29sdmVkIChuZWFyZXN0KSBmb3JtIG9mIHRoZSBvYmplY3RcbiAqL1xuXG4vLyBYWFggc2hvdWxkIHdlIHJlLWRvIHRoaXM/XG5RLm5lYXJlciA9IG5lYXJlcjtcbmZ1bmN0aW9uIG5lYXJlcih2YWx1ZSkge1xuICAgIGlmIChpc1Byb21pc2UodmFsdWUpKSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSB2YWx1ZS5pbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHByb21pc2UuXG4gKiBPdGhlcndpc2UgaXQgaXMgYSBmdWxmaWxsZWQgdmFsdWUuXG4gKi9cblEuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuZnVuY3Rpb24gaXNQcm9taXNlKG9iamVjdCkge1xuICAgIHJldHVybiBvYmplY3QgaW5zdGFuY2VvZiBQcm9taXNlO1xufVxuXG5RLmlzUHJvbWlzZUFsaWtlID0gaXNQcm9taXNlQWxpa2U7XG5mdW5jdGlvbiBpc1Byb21pc2VBbGlrZShvYmplY3QpIHtcbiAgICByZXR1cm4gaXNPYmplY3Qob2JqZWN0KSAmJiB0eXBlb2Ygb2JqZWN0LnRoZW4gPT09IFwiZnVuY3Rpb25cIjtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwZW5kaW5nIHByb21pc2UsIG1lYW5pbmcgbm90XG4gKiBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuXG4gKi9cblEuaXNQZW5kaW5nID0gaXNQZW5kaW5nO1xuZnVuY3Rpb24gaXNQZW5kaW5nKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNQZW5kaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHZhbHVlIG9yIGZ1bGZpbGxlZFxuICogcHJvbWlzZS5cbiAqL1xuUS5pc0Z1bGZpbGxlZCA9IGlzRnVsZmlsbGVkO1xuZnVuY3Rpb24gaXNGdWxmaWxsZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuICFpc1Byb21pc2Uob2JqZWN0KSB8fCBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc0Z1bGZpbGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHJlamVjdGVkIHByb21pc2UuXG4gKi9cblEuaXNSZWplY3RlZCA9IGlzUmVqZWN0ZWQ7XG5mdW5jdGlvbiBpc1JlamVjdGVkKG9iamVjdCkge1xuICAgIHJldHVybiBpc1Byb21pc2Uob2JqZWN0KSAmJiBvYmplY3QuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUmVqZWN0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInJlamVjdGVkXCI7XG59O1xuXG4vLy8vIEJFR0lOIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLy8gVGhpcyBwcm9taXNlIGxpYnJhcnkgY29uc3VtZXMgZXhjZXB0aW9ucyB0aHJvd24gaW4gaGFuZGxlcnMgc28gdGhleSBjYW4gYmVcbi8vIGhhbmRsZWQgYnkgYSBzdWJzZXF1ZW50IHByb21pc2UuICBUaGUgZXhjZXB0aW9ucyBnZXQgYWRkZWQgdG8gdGhpcyBhcnJheSB3aGVuXG4vLyB0aGV5IGFyZSBjcmVhdGVkLCBhbmQgcmVtb3ZlZCB3aGVuIHRoZXkgYXJlIGhhbmRsZWQuICBOb3RlIHRoYXQgaW4gRVM2IG9yXG4vLyBzaGltbWVkIGVudmlyb25tZW50cywgdGhpcyB3b3VsZCBuYXR1cmFsbHkgYmUgYSBgU2V0YC5cbnZhciB1bmhhbmRsZWRSZWFzb25zID0gW107XG52YXIgdW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucyA9IFtdO1xudmFyIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG5cbmZ1bmN0aW9uIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpIHtcbiAgICB1bmhhbmRsZWRSZWFzb25zLmxlbmd0aCA9IDA7XG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5sZW5ndGggPSAwO1xuXG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHRyYWNrUmVqZWN0aW9uKHByb21pc2UsIHJlYXNvbikge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBRLm5leHRUaWNrLnJ1bkFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmIChhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MuZW1pdChcInVuaGFuZGxlZFJlamVjdGlvblwiLCByZWFzb24sIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgaWYgKHJlYXNvbiAmJiB0eXBlb2YgcmVhc29uLnN0YWNrICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChyZWFzb24uc3RhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMucHVzaChcIihubyBzdGFjaykgXCIgKyByZWFzb24pO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdW50cmFja1JlamVjdGlvbihwcm9taXNlKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBhdCA9IGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgaWYgKGF0ICE9PSAtMSkge1xuICAgICAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrLnJ1bkFmdGVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXRSZXBvcnQgPSBhcnJheV9pbmRleE9mKHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgaWYgKGF0UmVwb3J0ICE9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJyZWplY3Rpb25IYW5kbGVkXCIsIHVuaGFuZGxlZFJlYXNvbnNbYXRdLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdFJlcG9ydCwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXQsIDEpO1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnNwbGljZShhdCwgMSk7XG4gICAgfVxufVxuXG5RLnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucyA9IHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucztcblxuUS5nZXRVbmhhbmRsZWRSZWFzb25zID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIE1ha2UgYSBjb3B5IHNvIHRoYXQgY29uc3VtZXJzIGNhbid0IGludGVyZmVyZSB3aXRoIG91ciBpbnRlcm5hbCBzdGF0ZS5cbiAgICByZXR1cm4gdW5oYW5kbGVkUmVhc29ucy5zbGljZSgpO1xufTtcblxuUS5zdG9wVW5oYW5kbGVkUmVqZWN0aW9uVHJhY2tpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG4gICAgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gZmFsc2U7XG59O1xuXG5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcblxuLy8vLyBFTkQgVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSByZWplY3RlZCBwcm9taXNlLlxuICogQHBhcmFtIHJlYXNvbiB2YWx1ZSBkZXNjcmliaW5nIHRoZSBmYWlsdXJlXG4gKi9cblEucmVqZWN0ID0gcmVqZWN0O1xuZnVuY3Rpb24gcmVqZWN0KHJlYXNvbikge1xuICAgIHZhciByZWplY3Rpb24gPSBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgICAgICAgICAgLy8gbm90ZSB0aGF0IHRoZSBlcnJvciBoYXMgYmVlbiBoYW5kbGVkXG4gICAgICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgICAgICB1bnRyYWNrUmVqZWN0aW9uKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQocmVhc29uKSA6IHRoaXM7XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjaygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicmVqZWN0ZWRcIiwgcmVhc29uOiByZWFzb24gfTtcbiAgICB9KTtcblxuICAgIC8vIE5vdGUgdGhhdCB0aGUgcmVhc29uIGhhcyBub3QgYmVlbiBoYW5kbGVkLlxuICAgIHRyYWNrUmVqZWN0aW9uKHJlamVjdGlvbiwgcmVhc29uKTtcblxuICAgIHJldHVybiByZWplY3Rpb247XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIGZ1bGZpbGxlZCBwcm9taXNlIGZvciBhbiBpbW1lZGlhdGUgcmVmZXJlbmNlLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2VcbiAqL1xuUS5mdWxmaWxsID0gZnVsZmlsbDtcbmZ1bmN0aW9uIGZ1bGZpbGwodmFsdWUpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZ2V0XCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwic2V0XCI6IGZ1bmN0aW9uIChuYW1lLCByaHMpIHtcbiAgICAgICAgICAgIHZhbHVlW25hbWVdID0gcmhzO1xuICAgICAgICB9LFxuICAgICAgICBcImRlbGV0ZVwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgZGVsZXRlIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInBvc3RcIjogZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICAgICAgICAgIC8vIE1hcmsgTWlsbGVyIHByb3Bvc2VzIHRoYXQgcG9zdCB3aXRoIG5vIG5hbWUgc2hvdWxkIGFwcGx5IGFcbiAgICAgICAgICAgIC8vIHByb21pc2VkIGZ1bmN0aW9uLlxuICAgICAgICAgICAgaWYgKG5hbWUgPT09IG51bGwgfHwgbmFtZSA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXS5hcHBseSh2YWx1ZSwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIFwiYXBwbHlcIjogZnVuY3Rpb24gKHRoaXNwLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodGhpc3AsIGFyZ3MpO1xuICAgICAgICB9LFxuICAgICAgICBcImtleXNcIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9iamVjdF9rZXlzKHZhbHVlKTtcbiAgICAgICAgfVxuICAgIH0sIHZvaWQgMCwgZnVuY3Rpb24gaW5zcGVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwiZnVsZmlsbGVkXCIsIHZhbHVlOiB2YWx1ZSB9O1xuICAgIH0pO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZW5hYmxlcyB0byBRIHByb21pc2VzLlxuICogQHBhcmFtIHByb21pc2UgdGhlbmFibGUgcHJvbWlzZVxuICogQHJldHVybnMgYSBRIHByb21pc2VcbiAqL1xuZnVuY3Rpb24gY29lcmNlKHByb21pc2UpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcHJvbWlzZS50aGVuKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG4vKipcbiAqIEFubm90YXRlcyBhbiBvYmplY3Qgc3VjaCB0aGF0IGl0IHdpbGwgbmV2ZXIgYmVcbiAqIHRyYW5zZmVycmVkIGF3YXkgZnJvbSB0aGlzIHByb2Nlc3Mgb3ZlciBhbnkgcHJvbWlzZVxuICogY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgcHJvbWlzZSBhIHdyYXBwaW5nIG9mIHRoYXQgb2JqZWN0IHRoYXRcbiAqIGFkZGl0aW9uYWxseSByZXNwb25kcyB0byB0aGUgXCJpc0RlZlwiIG1lc3NhZ2VcbiAqIHdpdGhvdXQgYSByZWplY3Rpb24uXG4gKi9cblEubWFzdGVyID0gbWFzdGVyO1xuZnVuY3Rpb24gbWFzdGVyKG9iamVjdCkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJpc0RlZlwiOiBmdW5jdGlvbiAoKSB7fVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKG9wLCBhcmdzKSB7XG4gICAgICAgIHJldHVybiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKTtcbiAgICB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBRKG9iamVjdCkuaW5zcGVjdCgpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIFNwcmVhZHMgdGhlIHZhbHVlcyBvZiBhIHByb21pc2VkIGFycmF5IG9mIGFyZ3VtZW50cyBpbnRvIHRoZVxuICogZnVsZmlsbG1lbnQgY2FsbGJhY2suXG4gKiBAcGFyYW0gZnVsZmlsbGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdmFyaWFkaWMgYXJndW1lbnRzIGZyb20gdGhlXG4gKiBwcm9taXNlZCBhcnJheVxuICogQHBhcmFtIHJlamVjdGVkIGNhbGxiYWNrIHRoYXQgcmVjZWl2ZXMgdGhlIGV4Y2VwdGlvbiBpZiB0aGUgcHJvbWlzZVxuICogaXMgcmVqZWN0ZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb3IgdGhyb3duIGV4Y2VwdGlvbiBvZlxuICogZWl0aGVyIGNhbGxiYWNrLlxuICovXG5RLnNwcmVhZCA9IHNwcmVhZDtcbmZ1bmN0aW9uIHNwcmVhZCh2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS5zcHJlYWQoZnVsZmlsbGVkLCByZWplY3RlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnNwcmVhZCA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMuYWxsKCkudGhlbihmdW5jdGlvbiAoYXJyYXkpIHtcbiAgICAgICAgcmV0dXJuIGZ1bGZpbGxlZC5hcHBseSh2b2lkIDAsIGFycmF5KTtcbiAgICB9LCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIFRoZSBhc3luYyBmdW5jdGlvbiBpcyBhIGRlY29yYXRvciBmb3IgZ2VuZXJhdG9yIGZ1bmN0aW9ucywgdHVybmluZ1xuICogdGhlbSBpbnRvIGFzeW5jaHJvbm91cyBnZW5lcmF0b3JzLiAgQWx0aG91Z2ggZ2VuZXJhdG9ycyBhcmUgb25seSBwYXJ0XG4gKiBvZiB0aGUgbmV3ZXN0IEVDTUFTY3JpcHQgNiBkcmFmdHMsIHRoaXMgY29kZSBkb2VzIG5vdCBjYXVzZSBzeW50YXhcbiAqIGVycm9ycyBpbiBvbGRlciBlbmdpbmVzLiAgVGhpcyBjb2RlIHNob3VsZCBjb250aW51ZSB0byB3b3JrIGFuZCB3aWxsXG4gKiBpbiBmYWN0IGltcHJvdmUgb3ZlciB0aW1lIGFzIHRoZSBsYW5ndWFnZSBpbXByb3Zlcy5cbiAqXG4gKiBFUzYgZ2VuZXJhdG9ycyBhcmUgY3VycmVudGx5IHBhcnQgb2YgVjggdmVyc2lvbiAzLjE5IHdpdGggdGhlXG4gKiAtLWhhcm1vbnktZ2VuZXJhdG9ycyBydW50aW1lIGZsYWcgZW5hYmxlZC4gIFNwaWRlck1vbmtleSBoYXMgaGFkIHRoZW1cbiAqIGZvciBsb25nZXIsIGJ1dCB1bmRlciBhbiBvbGRlciBQeXRob24taW5zcGlyZWQgZm9ybS4gIFRoaXMgZnVuY3Rpb25cbiAqIHdvcmtzIG9uIGJvdGgga2luZHMgb2YgZ2VuZXJhdG9ycy5cbiAqXG4gKiBEZWNvcmF0ZXMgYSBnZW5lcmF0b3IgZnVuY3Rpb24gc3VjaCB0aGF0OlxuICogIC0gaXQgbWF5IHlpZWxkIHByb21pc2VzXG4gKiAgLSBleGVjdXRpb24gd2lsbCBjb250aW51ZSB3aGVuIHRoYXQgcHJvbWlzZSBpcyBmdWxmaWxsZWRcbiAqICAtIHRoZSB2YWx1ZSBvZiB0aGUgeWllbGQgZXhwcmVzc2lvbiB3aWxsIGJlIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqICAtIGl0IHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlICh3aGVuIHRoZSBnZW5lcmF0b3JcbiAqICAgIHN0b3BzIGl0ZXJhdGluZylcbiAqICAtIHRoZSBkZWNvcmF0ZWQgZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqICAgIG9mIHRoZSBnZW5lcmF0b3Igb3IgdGhlIGZpcnN0IHJlamVjdGVkIHByb21pc2UgYW1vbmcgdGhvc2VcbiAqICAgIHlpZWxkZWQuXG4gKiAgLSBpZiBhbiBlcnJvciBpcyB0aHJvd24gaW4gdGhlIGdlbmVyYXRvciwgaXQgcHJvcGFnYXRlcyB0aHJvdWdoXG4gKiAgICBldmVyeSBmb2xsb3dpbmcgeWllbGQgdW50aWwgaXQgaXMgY2F1Z2h0LCBvciB1bnRpbCBpdCBlc2NhcGVzXG4gKiAgICB0aGUgZ2VuZXJhdG9yIGZ1bmN0aW9uIGFsdG9nZXRoZXIsIGFuZCBpcyB0cmFuc2xhdGVkIGludG8gYVxuICogICAgcmVqZWN0aW9uIGZvciB0aGUgcHJvbWlzZSByZXR1cm5lZCBieSB0aGUgZGVjb3JhdGVkIGdlbmVyYXRvci5cbiAqL1xuUS5hc3luYyA9IGFzeW5jO1xuZnVuY3Rpb24gYXN5bmMobWFrZUdlbmVyYXRvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInNlbmRcIiwgYXJnIGlzIGEgdmFsdWVcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwidGhyb3dcIiwgYXJnIGlzIGFuIGV4Y2VwdGlvblxuICAgICAgICBmdW5jdGlvbiBjb250aW51ZXIodmVyYiwgYXJnKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICAvLyBVbnRpbCBWOCAzLjE5IC8gQ2hyb21pdW0gMjkgaXMgcmVsZWFzZWQsIFNwaWRlck1vbmtleSBpcyB0aGUgb25seVxuICAgICAgICAgICAgLy8gZW5naW5lIHRoYXQgaGFzIGEgZGVwbG95ZWQgYmFzZSBvZiBicm93c2VycyB0aGF0IHN1cHBvcnQgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgIC8vIEhvd2V2ZXIsIFNNJ3MgZ2VuZXJhdG9ycyB1c2UgdGhlIFB5dGhvbi1pbnNwaXJlZCBzZW1hbnRpY3Mgb2ZcbiAgICAgICAgICAgIC8vIG91dGRhdGVkIEVTNiBkcmFmdHMuICBXZSB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgRVM2LCBidXQgd2UnZCBhbHNvXG4gICAgICAgICAgICAvLyBsaWtlIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gdXNlIGdlbmVyYXRvcnMgaW4gZGVwbG95ZWQgYnJvd3NlcnMsIHNvXG4gICAgICAgICAgICAvLyB3ZSBhbHNvIHN1cHBvcnQgUHl0aG9uLXN0eWxlIGdlbmVyYXRvcnMuICBBdCBzb21lIHBvaW50IHdlIGNhbiByZW1vdmVcbiAgICAgICAgICAgIC8vIHRoaXMgYmxvY2suXG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgU3RvcEl0ZXJhdGlvbiA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgICAgIC8vIEVTNiBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBRKHJlc3VsdC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LnZhbHVlLCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBTcGlkZXJNb25rZXkgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBSZW1vdmUgdGhpcyBjYXNlIHdoZW4gU00gZG9lcyBFUzYgZ2VuZXJhdG9ycy5cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShleGNlcHRpb24udmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdCwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBnZW5lcmF0b3IgPSBtYWtlR2VuZXJhdG9yLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJuZXh0XCIpO1xuICAgICAgICB2YXIgZXJyYmFjayA9IGNvbnRpbnVlci5iaW5kKGNvbnRpbnVlciwgXCJ0aHJvd1wiKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBUaGUgc3Bhd24gZnVuY3Rpb24gaXMgYSBzbWFsbCB3cmFwcGVyIGFyb3VuZCBhc3luYyB0aGF0IGltbWVkaWF0ZWx5XG4gKiBjYWxscyB0aGUgZ2VuZXJhdG9yIGFuZCBhbHNvIGVuZHMgdGhlIHByb21pc2UgY2hhaW4sIHNvIHRoYXQgYW55XG4gKiB1bmhhbmRsZWQgZXJyb3JzIGFyZSB0aHJvd24gaW5zdGVhZCBvZiBmb3J3YXJkZWQgdG8gdGhlIGVycm9yXG4gKiBoYW5kbGVyLiBUaGlzIGlzIHVzZWZ1bCBiZWNhdXNlIGl0J3MgZXh0cmVtZWx5IGNvbW1vbiB0byBydW5cbiAqIGdlbmVyYXRvcnMgYXQgdGhlIHRvcC1sZXZlbCB0byB3b3JrIHdpdGggbGlicmFyaWVzLlxuICovXG5RLnNwYXduID0gc3Bhd247XG5mdW5jdGlvbiBzcGF3bihtYWtlR2VuZXJhdG9yKSB7XG4gICAgUS5kb25lKFEuYXN5bmMobWFrZUdlbmVyYXRvcikoKSk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBpbnRlcmZhY2Ugb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW4gU3BpZGVyTW9ua2V5LlxuLyoqXG4gKiBUaHJvd3MgYSBSZXR1cm5WYWx1ZSBleGNlcHRpb24gdG8gc3RvcCBhbiBhc3luY2hyb25vdXMgZ2VuZXJhdG9yLlxuICpcbiAqIFRoaXMgaW50ZXJmYWNlIGlzIGEgc3RvcC1nYXAgbWVhc3VyZSB0byBzdXBwb3J0IGdlbmVyYXRvciByZXR1cm5cbiAqIHZhbHVlcyBpbiBvbGRlciBGaXJlZm94L1NwaWRlck1vbmtleS4gIEluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBFUzZcbiAqIGdlbmVyYXRvcnMgbGlrZSBDaHJvbWl1bSAyOSwganVzdCB1c2UgXCJyZXR1cm5cIiBpbiB5b3VyIGdlbmVyYXRvclxuICogZnVuY3Rpb25zLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSB0aGUgcmV0dXJuIHZhbHVlIGZvciB0aGUgc3Vycm91bmRpbmcgZ2VuZXJhdG9yXG4gKiBAdGhyb3dzIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB3aXRoIHRoZSB2YWx1ZS5cbiAqIEBleGFtcGxlXG4gKiAvLyBFUzYgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24qICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgcmV0dXJuIGZvbyArIGJhcjtcbiAqIH0pXG4gKiAvLyBPbGRlciBTcGlkZXJNb25rZXkgc3R5bGVcbiAqIFEuYXN5bmMoZnVuY3Rpb24gKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICBRLnJldHVybihmb28gKyBiYXIpO1xuICogfSlcbiAqL1xuUVtcInJldHVyblwiXSA9IF9yZXR1cm47XG5mdW5jdGlvbiBfcmV0dXJuKHZhbHVlKSB7XG4gICAgdGhyb3cgbmV3IFFSZXR1cm5WYWx1ZSh2YWx1ZSk7XG59XG5cbi8qKlxuICogVGhlIHByb21pc2VkIGZ1bmN0aW9uIGRlY29yYXRvciBlbnN1cmVzIHRoYXQgYW55IHByb21pc2UgYXJndW1lbnRzXG4gKiBhcmUgc2V0dGxlZCBhbmQgcGFzc2VkIGFzIHZhbHVlcyAoYHRoaXNgIGlzIGFsc28gc2V0dGxlZCBhbmQgcGFzc2VkXG4gKiBhcyBhIHZhbHVlKS4gIEl0IHdpbGwgYWxzbyBlbnN1cmUgdGhhdCB0aGUgcmVzdWx0IG9mIGEgZnVuY3Rpb24gaXNcbiAqIGFsd2F5cyBhIHByb21pc2UuXG4gKlxuICogQGV4YW1wbGVcbiAqIHZhciBhZGQgPSBRLnByb21pc2VkKGZ1bmN0aW9uIChhLCBiKSB7XG4gKiAgICAgcmV0dXJuIGEgKyBiO1xuICogfSk7XG4gKiBhZGQoUShhKSwgUShCKSk7XG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgVGhlIGZ1bmN0aW9uIHRvIGRlY29yYXRlXG4gKiBAcmV0dXJucyB7ZnVuY3Rpb259IGEgZnVuY3Rpb24gdGhhdCBoYXMgYmVlbiBkZWNvcmF0ZWQuXG4gKi9cblEucHJvbWlzZWQgPSBwcm9taXNlZDtcbmZ1bmN0aW9uIHByb21pc2VkKGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNwcmVhZChbdGhpcywgYWxsKGFyZ3VtZW50cyldLCBmdW5jdGlvbiAoc2VsZiwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHNlbGYsIGFyZ3MpO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIHNlbmRzIGEgbWVzc2FnZSB0byBhIHZhbHVlIGluIGEgZnV0dXJlIHR1cm5cbiAqIEBwYXJhbSBvYmplY3QqIHRoZSByZWNpcGllbnRcbiAqIEBwYXJhbSBvcCB0aGUgbmFtZSBvZiB0aGUgbWVzc2FnZSBvcGVyYXRpb24sIGUuZy4sIFwid2hlblwiLFxuICogQHBhcmFtIGFyZ3MgZnVydGhlciBhcmd1bWVudHMgdG8gYmUgZm9yd2FyZGVkIHRvIHRoZSBvcGVyYXRpb25cbiAqIEByZXR1cm5zIHJlc3VsdCB7UHJvbWlzZX0gYSBwcm9taXNlIGZvciB0aGUgcmVzdWx0IG9mIHRoZSBvcGVyYXRpb25cbiAqL1xuUS5kaXNwYXRjaCA9IGRpc3BhdGNoO1xuZnVuY3Rpb24gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2gob3AsIGFyZ3MpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIChvcCwgYXJncykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChkZWZlcnJlZC5yZXNvbHZlLCBvcCwgYXJncyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZ2V0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBwcm9wZXJ0eSB2YWx1ZVxuICovXG5RLmdldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogU2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIG9iamVjdCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBzZXRcbiAqIEBwYXJhbSB2YWx1ZSAgICAgbmV3IHZhbHVlIG9mIHByb3BlcnR5XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInNldFwiLCBba2V5LCB2YWx1ZV0pO1xufTtcblxuLyoqXG4gKiBEZWxldGVzIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gZGVsZXRlXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5kZWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImRlbGV0ZVwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIHZhbHVlICAgICBhIHZhbHVlIHRvIHBvc3QsIHR5cGljYWxseSBhbiBhcnJheSBvZlxuICogICAgICAgICAgICAgICAgICBpbnZvY2F0aW9uIGFyZ3VtZW50cyBmb3IgcHJvbWlzZXMgdGhhdFxuICogICAgICAgICAgICAgICAgICBhcmUgdWx0aW1hdGVseSBiYWNrZWQgd2l0aCBgcmVzb2x2ZWAgdmFsdWVzLFxuICogICAgICAgICAgICAgICAgICBhcyBvcHBvc2VkIHRvIHRob3NlIGJhY2tlZCB3aXRoIFVSTHNcbiAqICAgICAgICAgICAgICAgICAgd2hlcmVpbiB0aGUgcG9zdGVkIHZhbHVlIGNhbiBiZSBhbnlcbiAqICAgICAgICAgICAgICAgICAgSlNPTiBzZXJpYWxpemFibGUgb2JqZWN0LlxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cbi8vIGJvdW5kIGxvY2FsbHkgYmVjYXVzZSBpdCBpcyB1c2VkIGJ5IG90aGVyIG1ldGhvZHNcblEubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgaW52b2NhdGlvbiBhcmd1bWVudHNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5Qcm9taXNlLnByb3RvdHlwZS5tY2FsbCA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuLyoqXG4gKiBBcHBsaWVzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIGFyZ3MgICAgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYXBwbHkgPSBmdW5jdGlvbiAob2JqZWN0LCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIENhbGxzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUVtcInRyeVwiXSA9XG5RLmZjYWxsID0gZnVuY3Rpb24gKG9iamVjdCAvKiAuLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cyldKTtcbn07XG5cbi8qKlxuICogQmluZHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uLCB0cmFuc2Zvcm1pbmcgcmV0dXJuIHZhbHVlcyBpbnRvIGEgZnVsZmlsbGVkXG4gKiBwcm9taXNlIGFuZCB0aHJvd24gZXJyb3JzIGludG8gYSByZWplY3RlZCBvbmUuXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZiaW5kID0gZnVuY3Rpb24gKG9iamVjdCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gUShvYmplY3QpO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblByb21pc2UucHJvdG90eXBlLmZiaW5kID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSB0aGlzO1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZmJvdW5kKCkge1xuICAgICAgICByZXR1cm4gcHJvbWlzZS5kaXNwYXRjaChcImFwcGx5XCIsIFtcbiAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICBhcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKVxuICAgICAgICBdKTtcbiAgICB9O1xufTtcblxuLyoqXG4gKiBSZXF1ZXN0cyB0aGUgbmFtZXMgb2YgdGhlIG93bmVkIHByb3BlcnRpZXMgb2YgYSBwcm9taXNlZFxuICogb2JqZWN0IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUga2V5cyBvZiB0aGUgZXZlbnR1YWxseSBzZXR0bGVkIG9iamVjdFxuICovXG5RLmtleXMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImtleXNcIiwgW10pO1xufTtcblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkuICBJZiBhbnkgb2ZcbiAqIHRoZSBwcm9taXNlcyBnZXRzIHJlamVjdGVkLCB0aGUgd2hvbGUgYXJyYXkgaXMgcmVqZWN0ZWQgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGUgY29ycmVzcG9uZGluZyB2YWx1ZXNcbiAqL1xuLy8gQnkgTWFyayBNaWxsZXJcbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPXN0cmF3bWFuOmNvbmN1cnJlbmN5JnJldj0xMzA4Nzc2NTIxI2FsbGZ1bGZpbGxlZFxuUS5hbGwgPSBhbGw7XG5mdW5jdGlvbiBhbGwocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb21pc2UsIGluZGV4KSB7XG4gICAgICAgICAgICB2YXIgc25hcHNob3Q7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgICAgaXNQcm9taXNlKHByb21pc2UpICYmXG4gICAgICAgICAgICAgICAgKHNuYXBzaG90ID0gcHJvbWlzZS5pbnNwZWN0KCkpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSBzbmFwc2hvdC52YWx1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgKytwZW5kaW5nQ291bnQ7XG4gICAgICAgICAgICAgICAgd2hlbihcbiAgICAgICAgICAgICAgICAgICAgcHJvbWlzZSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgtLXBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHsgaW5kZXg6IGluZGV4LCB2YWx1ZTogcHJvZ3Jlc3MgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB2b2lkIDApO1xuICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGwodGhpcyk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2Ugb2YgYW4gYXJyYXkuIFByaW9yIHJlamVjdGVkIHByb21pc2VzIGFyZVxuICogaWdub3JlZC4gIFJlamVjdHMgb25seSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIG9yIHByb21pc2VzIGZvciB2YWx1ZXNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmdWxmaWxsZWQgd2l0aCB0aGUgdmFsdWUgb2YgdGhlIGZpcnN0IHJlc29sdmVkIHByb21pc2UsXG4gKiBvciBhIHJlamVjdGVkIHByb21pc2UgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqL1xuUS5hbnkgPSBhbnk7XG5cbmZ1bmN0aW9uIGFueShwcm9taXNlcykge1xuICAgIGlmIChwcm9taXNlcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFEucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICBhcnJheV9yZWR1Y2UocHJvbWlzZXMsIGZ1bmN0aW9uIChwcmV2LCBjdXJyZW50LCBpbmRleCkge1xuICAgICAgICB2YXIgcHJvbWlzZSA9IHByb21pc2VzW2luZGV4XTtcblxuICAgICAgICBwZW5kaW5nQ291bnQrKztcblxuICAgICAgICB3aGVuKHByb21pc2UsIG9uRnVsZmlsbGVkLCBvblJlamVjdGVkLCBvblByb2dyZXNzKTtcbiAgICAgICAgZnVuY3Rpb24gb25GdWxmaWxsZWQocmVzdWx0KSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25SZWplY3RlZCgpIHtcbiAgICAgICAgICAgIHBlbmRpbmdDb3VudC0tO1xuICAgICAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIFwiQ2FuJ3QgZ2V0IGZ1bGZpbGxtZW50IHZhbHVlIGZyb20gYW55IHByb21pc2UsIGFsbCBcIiArXG4gICAgICAgICAgICAgICAgICAgIFwicHJvbWlzZXMgd2VyZSByZWplY3RlZC5cIlxuICAgICAgICAgICAgICAgICkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUHJvZ3Jlc3MocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7XG4gICAgICAgICAgICAgICAgaW5kZXg6IGluZGV4LFxuICAgICAgICAgICAgICAgIHZhbHVlOiBwcm9ncmVzc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCB1bmRlZmluZWQpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFueSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYW55KHRoaXMpO1xufTtcblxuLyoqXG4gKiBXYWl0cyBmb3IgYWxsIHByb21pc2VzIHRvIGJlIHNldHRsZWQsIGVpdGhlciBmdWxmaWxsZWQgb3JcbiAqIHJlamVjdGVkLiAgVGhpcyBpcyBkaXN0aW5jdCBmcm9tIGBhbGxgIHNpbmNlIHRoYXQgd291bGQgc3RvcFxuICogd2FpdGluZyBhdCB0aGUgZmlyc3QgcmVqZWN0aW9uLiAgVGhlIHByb21pc2UgcmV0dXJuZWQgYnlcbiAqIGBhbGxSZXNvbHZlZGAgd2lsbCBuZXZlciBiZSByZWplY3RlZC5cbiAqIEBwYXJhbSBwcm9taXNlcyBhIHByb21pc2UgZm9yIGFuIGFycmF5IChvciBhbiBhcnJheSkgb2YgcHJvbWlzZXNcbiAqIChvciB2YWx1ZXMpXG4gKiBAcmV0dXJuIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgcHJvbWlzZXNcbiAqL1xuUS5hbGxSZXNvbHZlZCA9IGRlcHJlY2F0ZShhbGxSZXNvbHZlZCwgXCJhbGxSZXNvbHZlZFwiLCBcImFsbFNldHRsZWRcIik7XG5mdW5jdGlvbiBhbGxSZXNvbHZlZChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcHJvbWlzZXMgPSBhcnJheV9tYXAocHJvbWlzZXMsIFEpO1xuICAgICAgICByZXR1cm4gd2hlbihhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHdoZW4ocHJvbWlzZSwgbm9vcCwgbm9vcCk7XG4gICAgICAgIH0pKSwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2VzO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYWxsUmVzb2x2ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbFJlc29sdmVkKHRoaXMpO1xufTtcblxuLyoqXG4gKiBAc2VlIFByb21pc2UjYWxsU2V0dGxlZFxuICovXG5RLmFsbFNldHRsZWQgPSBhbGxTZXR0bGVkO1xuZnVuY3Rpb24gYWxsU2V0dGxlZChwcm9taXNlcykge1xuICAgIHJldHVybiBRKHByb21pc2VzKS5hbGxTZXR0bGVkKCk7XG59XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZWlyIHN0YXRlcyAoYXNcbiAqIHJldHVybmVkIGJ5IGBpbnNwZWN0YCkgd2hlbiB0aGV5IGhhdmUgYWxsIHNldHRsZWQuXG4gKiBAcGFyYW0ge0FycmF5W0FueSpdfSB2YWx1ZXMgYW4gYXJyYXkgKG9yIHByb21pc2UgZm9yIGFuIGFycmF5KSBvZiB2YWx1ZXMgKG9yXG4gKiBwcm9taXNlcyBmb3IgdmFsdWVzKVxuICogQHJldHVybnMge0FycmF5W1N0YXRlXX0gYW4gYXJyYXkgb2Ygc3RhdGVzIGZvciB0aGUgcmVzcGVjdGl2ZSB2YWx1ZXMuXG4gKi9cblByb21pc2UucHJvdG90eXBlLmFsbFNldHRsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgcmV0dXJuIGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICBwcm9taXNlID0gUShwcm9taXNlKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIHJlZ2FyZGxlc3MoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb21pc2UuaW5zcGVjdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbihyZWdhcmRsZXNzLCByZWdhcmRsZXNzKTtcbiAgICAgICAgfSkpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBDYXB0dXJlcyB0aGUgZmFpbHVyZSBvZiBhIHByb21pc2UsIGdpdmluZyBhbiBvcG9ydHVuaXR5IHRvIHJlY292ZXJcbiAqIHdpdGggYSBjYWxsYmFjay4gIElmIHRoZSBnaXZlbiBwcm9taXNlIGlzIGZ1bGZpbGxlZCwgdGhlIHJldHVybmVkXG4gKiBwcm9taXNlIGlzIGZ1bGZpbGxlZC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBmdWxmaWxsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlmIHRoZVxuICogZ2l2ZW4gcHJvbWlzZSBpcyByZWplY3RlZFxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBjYWxsYmFja1xuICovXG5RLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5RW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCByZWplY3RlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZhaWwgPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogQXR0YWNoZXMgYSBsaXN0ZW5lciB0aGF0IGNhbiByZXNwb25kIHRvIHByb2dyZXNzIG5vdGlmaWNhdGlvbnMgZnJvbSBhXG4gKiBwcm9taXNlJ3Mgb3JpZ2luYXRpbmcgZGVmZXJyZWQuIFRoaXMgbGlzdGVuZXIgcmVjZWl2ZXMgdGhlIGV4YWN0IGFyZ3VtZW50c1xuICogcGFzc2VkIHRvIGBgZGVmZXJyZWQubm90aWZ5YGAuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gcmVjZWl2ZSBhbnkgcHJvZ3Jlc3Mgbm90aWZpY2F0aW9uc1xuICogQHJldHVybnMgdGhlIGdpdmVuIHByb21pc2UsIHVuY2hhbmdlZFxuICovXG5RLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5mdW5jdGlvbiBwcm9ncmVzcyhvYmplY3QsIHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5wcm9ncmVzcyA9IGZ1bmN0aW9uIChwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59O1xuXG4vKipcbiAqIFByb3ZpZGVzIGFuIG9wcG9ydHVuaXR5IHRvIG9ic2VydmUgdGhlIHNldHRsaW5nIG9mIGEgcHJvbWlzZSxcbiAqIHJlZ2FyZGxlc3Mgb2Ygd2hldGhlciB0aGUgcHJvbWlzZSBpcyBmdWxmaWxsZWQgb3IgcmVqZWN0ZWQuICBGb3J3YXJkc1xuICogdGhlIHJlc29sdXRpb24gdG8gdGhlIHJldHVybmVkIHByb21pc2Ugd2hlbiB0aGUgY2FsbGJhY2sgaXMgZG9uZS5cbiAqIFRoZSBjYWxsYmFjayBjYW4gcmV0dXJuIGEgcHJvbWlzZSB0byBkZWZlciBjb21wbGV0aW9uLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byBvYnNlcnZlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlblxuICogcHJvbWlzZSwgdGFrZXMgbm8gYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSB3aGVuXG4gKiBgYGZpbmBgIGlzIGRvbmUuXG4gKi9cblEuZmluID0gLy8gWFhYIGxlZ2FjeVxuUVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdClbXCJmaW5hbGx5XCJdKGNhbGxiYWNrKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZpbiA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH0pO1xuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gVE9ETyBhdHRlbXB0IHRvIHJlY3ljbGUgdGhlIHJlamVjdGlvbiB3aXRoIFwidGhpc1wiLlxuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRocm93IHJlYXNvbjtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFRlcm1pbmF0ZXMgYSBjaGFpbiBvZiBwcm9taXNlcywgZm9yY2luZyByZWplY3Rpb25zIHRvIGJlXG4gKiB0aHJvd24gYXMgZXhjZXB0aW9ucy5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBhdCB0aGUgZW5kIG9mIGEgY2hhaW4gb2YgcHJvbWlzZXNcbiAqIEByZXR1cm5zIG5vdGhpbmdcbiAqL1xuUS5kb25lID0gZnVuY3Rpb24gKG9iamVjdCwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRvbmUoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZG9uZSA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHZhciBvblVuaGFuZGxlZEVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgIC8vIGZvcndhcmQgdG8gYSBmdXR1cmUgdHVybiBzbyB0aGF0IGBgd2hlbmBgXG4gICAgICAgIC8vIGRvZXMgbm90IGNhdGNoIGl0IGFuZCB0dXJuIGl0IGludG8gYSByZWplY3Rpb24uXG4gICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKTtcbiAgICAgICAgICAgIGlmIChRLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBRLm9uZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEF2b2lkIHVubmVjZXNzYXJ5IGBuZXh0VGlja2BpbmcgdmlhIGFuIHVubmVjZXNzYXJ5IGB3aGVuYC5cbiAgICB2YXIgcHJvbWlzZSA9IGZ1bGZpbGxlZCB8fCByZWplY3RlZCB8fCBwcm9ncmVzcyA/XG4gICAgICAgIHRoaXMudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykgOlxuICAgICAgICB0aGlzO1xuXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5kb21haW4pIHtcbiAgICAgICAgb25VbmhhbmRsZWRFcnJvciA9IHByb2Nlc3MuZG9tYWluLmJpbmQob25VbmhhbmRsZWRFcnJvcik7XG4gICAgfVxuXG4gICAgcHJvbWlzZS50aGVuKHZvaWQgMCwgb25VbmhhbmRsZWRFcnJvcik7XG59O1xuXG4vKipcbiAqIENhdXNlcyBhIHByb21pc2UgdG8gYmUgcmVqZWN0ZWQgaWYgaXQgZG9lcyBub3QgZ2V0IGZ1bGZpbGxlZCBiZWZvcmVcbiAqIHNvbWUgbWlsbGlzZWNvbmRzIHRpbWUgb3V0LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzIHRpbWVvdXRcbiAqIEBwYXJhbSB7QW55Kn0gY3VzdG9tIGVycm9yIG1lc3NhZ2Ugb3IgRXJyb3Igb2JqZWN0IChvcHRpb25hbClcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgaWYgaXQgaXNcbiAqIGZ1bGZpbGxlZCBiZWZvcmUgdGhlIHRpbWVvdXQsIG90aGVyd2lzZSByZWplY3RlZC5cbiAqL1xuUS50aW1lb3V0ID0gZnVuY3Rpb24gKG9iamVjdCwgbXMsIGVycm9yKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aW1lb3V0KG1zLCBlcnJvcik7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24gKG1zLCBlcnJvcikge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWVycm9yIHx8IFwic3RyaW5nXCIgPT09IHR5cGVvZiBlcnJvcikge1xuICAgICAgICAgICAgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3IgfHwgXCJUaW1lZCBvdXQgYWZ0ZXIgXCIgKyBtcyArIFwiIG1zXCIpO1xuICAgICAgICAgICAgZXJyb3IuY29kZSA9IFwiRVRJTUVET1VUXCI7XG4gICAgICAgIH1cbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGVycm9yKTtcbiAgICB9LCBtcyk7XG5cbiAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXhjZXB0aW9uKTtcbiAgICB9LCBkZWZlcnJlZC5ub3RpZnkpO1xuXG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gdmFsdWUgKG9yIHByb21pc2VkIHZhbHVlKSwgc29tZVxuICogbWlsbGlzZWNvbmRzIGFmdGVyIGl0IHJlc29sdmVkLiBQYXNzZXMgcmVqZWN0aW9ucyBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBhZnRlciBtaWxsaXNlY29uZHNcbiAqIHRpbWUgaGFzIGVsYXBzZWQgc2luY2UgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UuXG4gKiBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSByZWplY3RzLCB0aGF0IGlzIHBhc3NlZCBpbW1lZGlhdGVseS5cbiAqL1xuUS5kZWxheSA9IGZ1bmN0aW9uIChvYmplY3QsIHRpbWVvdXQpIHtcbiAgICBpZiAodGltZW91dCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIHRpbWVvdXQgPSBvYmplY3Q7XG4gICAgICAgIG9iamVjdCA9IHZvaWQgMDtcbiAgICB9XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kZWxheSh0aW1lb3V0KTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGFzIGFuIGFycmF5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKlxuICogICAgICBRLm5mYXBwbHkoRlMucmVhZEZpbGUsIFtfX2ZpbGVuYW1lXSlcbiAqICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqICAgICAgfSlcbiAqXG4gKi9cblEubmZhcHBseSA9IGZ1bmN0aW9uIChjYWxsYmFjaywgYXJncykge1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZhcHBseSA9IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgaW5kaXZpZHVhbGx5LCBhbmQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmNhbGwoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpXG4gKiAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogfSlcbiAqXG4gKi9cblEubmZjYWxsID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBRKGNhbGxiYWNrKS5uZmFwcGx5KGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBXcmFwcyBhIE5vZGVKUyBjb250aW51YXRpb24gcGFzc2luZyBmdW5jdGlvbiBhbmQgcmV0dXJucyBhbiBlcXVpdmFsZW50XG4gKiB2ZXJzaW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UuXG4gKiBAZXhhbXBsZVxuICogUS5uZmJpbmQoRlMucmVhZEZpbGUsIF9fZmlsZW5hbWUpKFwidXRmLThcIilcbiAqIC50aGVuKGNvbnNvbGUubG9nKVxuICogLmRvbmUoKVxuICovXG5RLm5mYmluZCA9XG5RLmRlbm9kZWlmeSA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIFEoY2FsbGJhY2spLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmZiaW5kID1cblByb21pc2UucHJvdG90eXBlLmRlbm9kZWlmeSA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEuZGVub2RlaWZ5LmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG5RLm5iaW5kID0gZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBiYXNlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5vZGVBcmdzID0gYmFzZUFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpO1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgICAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgICAgIGZ1bmN0aW9uIGJvdW5kKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmFwcGx5KHRoaXNwLCBhcmd1bWVudHMpO1xuICAgICAgICB9XG4gICAgICAgIFEoYm91bmQpLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubmJpbmQgPSBmdW5jdGlvbiAoLyp0aGlzcCwgLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDApO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5uYmluZC5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrIHdpdGggYSBnaXZlbiBhcnJheSBvZiBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZCBjYWxsYmFjay5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSB7QXJyYXl9IGFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLm5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkubnBvc3QobmFtZSwgYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLm5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmdzIHx8IFtdKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2ssIGZvcndhcmRpbmcgdGhlIGdpdmVuIHZhcmlhZGljIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkXG4gKiBjYWxsYmFjayBhcmd1bWVudC5cbiAqIEBwYXJhbSBvYmplY3QgYW4gb2JqZWN0IHRoYXQgaGFzIHRoZSBuYW1lZCBtZXRob2RcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIG5hbWUgb2YgdGhlIG1ldGhvZCBvZiBvYmplY3RcbiAqIEBwYXJhbSAuLi5hcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFjayB3aWxsXG4gKiBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblEubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUS5uaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMik7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgUShvYmplY3QpLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5Qcm9taXNlLnByb3RvdHlwZS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5Qcm9taXNlLnByb3RvdHlwZS5uaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogSWYgYSBmdW5jdGlvbiB3b3VsZCBsaWtlIHRvIHN1cHBvcnQgYm90aCBOb2RlIGNvbnRpbnVhdGlvbi1wYXNzaW5nLXN0eWxlIGFuZFxuICogcHJvbWlzZS1yZXR1cm5pbmctc3R5bGUsIGl0IGNhbiBlbmQgaXRzIGludGVybmFsIHByb21pc2UgY2hhaW4gd2l0aFxuICogYG5vZGVpZnkobm9kZWJhY2spYCwgZm9yd2FyZGluZyB0aGUgb3B0aW9uYWwgbm9kZWJhY2sgYXJndW1lbnQuICBJZiB0aGUgdXNlclxuICogZWxlY3RzIHRvIHVzZSBhIG5vZGViYWNrLCB0aGUgcmVzdWx0IHdpbGwgYmUgc2VudCB0aGVyZS4gIElmIHRoZXkgZG8gbm90XG4gKiBwYXNzIGEgbm9kZWJhY2ssIHRoZXkgd2lsbCByZWNlaXZlIHRoZSByZXN1bHQgcHJvbWlzZS5cbiAqIEBwYXJhbSBvYmplY3QgYSByZXN1bHQgKG9yIGEgcHJvbWlzZSBmb3IgYSByZXN1bHQpXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBub2RlYmFjayBhIE5vZGUuanMtc3R5bGUgY2FsbGJhY2tcbiAqIEByZXR1cm5zIGVpdGhlciB0aGUgcHJvbWlzZSBvciBub3RoaW5nXG4gKi9cblEubm9kZWlmeSA9IG5vZGVpZnk7XG5mdW5jdGlvbiBub2RlaWZ5KG9iamVjdCwgbm9kZWJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5vZGVpZnkobm9kZWJhY2spO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5ub2RlaWZ5ID0gZnVuY3Rpb24gKG5vZGViYWNrKSB7XG4gICAgaWYgKG5vZGViYWNrKSB7XG4gICAgICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKG51bGwsIHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG5vZGViYWNrKGVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG5RLm5vQ29uZmxpY3QgPSBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJRLm5vQ29uZmxpY3Qgb25seSB3b3JrcyB3aGVuIFEgaXMgdXNlZCBhcyBhIGdsb2JhbFwiKTtcbn07XG5cbi8vIEFsbCBjb2RlIGJlZm9yZSB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMuXG52YXIgcUVuZGluZ0xpbmUgPSBjYXB0dXJlTGluZSgpO1xuXG5yZXR1cm4gUTtcblxufSk7XG4iLCJ2YXIgcmVkdWN0aW9fcGFyYW1ldGVycyA9IHJlcXVpcmUoJy4vcGFyYW1ldGVycy5qcycpO1xuXG5fYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuXHRpZiAodGFyZ2V0ID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcblx0fVxuXG5cdHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcblx0Zm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraW5kZXgpIHtcblx0XHR2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblx0XHRpZiAoc291cmNlICE9IG51bGwpIHtcblx0XHRcdGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG5cdFx0XHRcdGlmKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuXHRcdFx0XHRcdG91dHB1dFtuZXh0S2V5XSA9IHNvdXJjZVtuZXh0S2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gb3V0cHV0O1xufTtcblxuZnVuY3Rpb24gYWNjZXNzb3JfYnVpbGQob2JqLCBwKSB7XG5cdC8vIG9iai5vcmRlciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5vcmRlcjtcblx0Ly8gXHRwLm9yZGVyID0gdmFsdWU7XG5cdC8vIFx0cmV0dXJuIG9iajtcblx0Ly8gfTtcblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeSh2KSB7XG5cdFx0aWYoIHR5cGVvZiB2ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdC8vIFJld3JpdGUgdG8gYSBmdW5jdGlvblxuXHRcdFx0dmFyIHRlbXBWYWx1ZSA9IHY7XG5cdFx0XHR2YXIgZnVuYyA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkW3RlbXBWYWx1ZV07IH1cblx0XHRcdHJldHVybiBmdW5jO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdjtcblx0XHR9XG5cdH1cblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeU51bWVyaWModikge1xuXHRcdGlmKCB0eXBlb2YgdiA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHQvLyBSZXdyaXRlIHRvIGEgZnVuY3Rpb25cblx0XHRcdHZhciB0ZW1wVmFsdWUgPSB2O1xuXHRcdFx0dmFyIGZ1bmMgPSBmdW5jdGlvbiAoZCkgeyByZXR1cm4gK2RbdGVtcFZhbHVlXTsgfVxuXHRcdFx0cmV0dXJuIGZ1bmM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB2O1xuXHRcdH1cblx0fVxuXG5cdG9iai5mcm9tT2JqZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHA7XG5cdFx0X2Fzc2lnbihwLCB2YWx1ZSk7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudG9PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gcDtcblx0fTtcblxuXHRvYmouY291bnQgPSBmdW5jdGlvbih2YWx1ZSwgcHJvcE5hbWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmNvdW50O1xuICAgIGlmICghcHJvcE5hbWUpIHtcbiAgICAgIHByb3BOYW1lID0gJ2NvdW50JztcbiAgICB9XG5cdFx0cC5jb3VudCA9IHByb3BOYW1lO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN1bSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdW07XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmF2ZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hdmc7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHQvLyBXZSBjYW4gdGFrZSBhbiBhY2Nlc3NvciBmdW5jdGlvbiwgYSBib29sZWFuLCBvciBhIHN0cmluZ1xuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZihwLnN1bSAmJiBwLnN1bSAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignU1VNIGFnZ3JlZ2F0aW9uIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IEFWRyBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC5zdW0gPSB2YWx1ZTtcblx0XHRcdHAuYXZnID0gdHJ1ZTtcblx0XHRcdHAuY291bnQgPSAnY291bnQnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwLmF2ZyA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uQWNjZXNzb3I7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdHAuZXhjZXB0aW9uQWNjZXNzb3IgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5maWx0ZXIgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZmlsdGVyO1xuXHRcdHAuZmlsdGVyID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudmFsdWVMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnZhbHVlTGlzdDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnkodmFsdWUpO1xuXG5cdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5tZWRpYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWVkaWFuO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1lZGlhbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tZWRpYW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5taW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWluO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1pbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5taW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5tYXggPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWF4O1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1heCBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tYXggPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb25Db3VudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5leGNlcHRpb25Db3VudDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnkodmFsdWUpO1xuXG5cdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdGlmKHAuZXhjZXB0aW9uQWNjZXNzb3IgJiYgcC5leGNlcHRpb25BY2Nlc3NvciAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignRVhDRVBUSU9OIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IGV4Y2VwdGlvbiBjb3VudCBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC5leGNlcHRpb25BY2Nlc3NvciA9IHZhbHVlO1xuXHRcdFx0cC5leGNlcHRpb25Db3VudCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuZXhjZXB0aW9uQ291bnQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvblN1bTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuZXhjZXB0aW9uU3VtID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuaGlzdG9ncmFtVmFsdWU7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLmhpc3RvZ3JhbVZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtQmlucyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5oaXN0b2dyYW1UaHJlc2hvbGRzO1xuXHRcdHAuaGlzdG9ncmFtVGhyZXNob2xkcyA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN0ZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdGQ7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRwLnN1bU9mU3F1YXJlcyA9IHZhbHVlO1xuXHRcdFx0cC5zdW0gPSB2YWx1ZTtcblx0XHRcdHAuY291bnQgPSAnY291bnQnO1xuXHRcdFx0cC5zdGQgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwLnN0ZCA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5zdW1PZlNxID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN1bU9mU3F1YXJlcztcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuc3VtT2ZTcXVhcmVzID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudmFsdWUgPSBmdW5jdGlvbih2YWx1ZSwgYWNjZXNzb3IpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGggfHwgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCIndmFsdWUnIHJlcXVpcmVzIGEgc3RyaW5nIGFyZ3VtZW50LlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXAudmFsdWVzKSBwLnZhbHVlcyA9IHt9O1xuXHRcdFx0cC52YWx1ZXNbdmFsdWVdID0ge307XG5cdFx0XHRwLnZhbHVlc1t2YWx1ZV0ucGFyYW1ldGVycyA9IHJlZHVjdGlvX3BhcmFtZXRlcnMoKTtcblx0XHRcdGFjY2Vzc29yX2J1aWxkKHAudmFsdWVzW3ZhbHVlXSwgcC52YWx1ZXNbdmFsdWVdLnBhcmFtZXRlcnMpO1xuXHRcdFx0aWYoYWNjZXNzb3IpIHAudmFsdWVzW3ZhbHVlXS5hY2Nlc3NvciA9IGFjY2Vzc29yO1xuXHRcdFx0cmV0dXJuIHAudmFsdWVzW3ZhbHVlXTtcblx0XHR9XG5cdH07XG5cblx0b2JqLm5lc3QgPSBmdW5jdGlvbihrZXlBY2Nlc3NvckFycmF5KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm5lc3RLZXlzO1xuXG5cdFx0a2V5QWNjZXNzb3JBcnJheS5tYXAoYWNjZXNzb3JpZnkpO1xuXG5cdFx0cC5uZXN0S2V5cyA9IGtleUFjY2Vzc29yQXJyYXk7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYWxpYXMgPSBmdW5jdGlvbihwcm9wQWNjZXNzb3JPYmopIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuYWxpYXNLZXlzO1xuXHRcdHAuYWxpYXNLZXlzID0gcHJvcEFjY2Vzc29yT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmFsaWFzUHJvcCA9IGZ1bmN0aW9uKHByb3BBY2Nlc3Nvck9iaikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hbGlhc1Byb3BLZXlzO1xuXHRcdHAuYWxpYXNQcm9wS2V5cyA9IHByb3BBY2Nlc3Nvck9iajtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5ncm91cEFsbCA9IGZ1bmN0aW9uKGdyb3VwVGVzdCkge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5ncm91cEFsbDtcblx0XHRwLmdyb3VwQWxsID0gZ3JvdXBUZXN0O1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmRhdGFMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmRhdGFMaXN0O1xuXHRcdHAuZGF0YUxpc3QgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5jdXN0b20gPSBmdW5jdGlvbihhZGRSZW1vdmVJbml0aWFsT2JqKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5jdXN0b207XG5cdFx0cC5jdXN0b20gPSBhZGRSZW1vdmVJbml0aWFsT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cbn1cblxudmFyIHJlZHVjdGlvX2FjY2Vzc29ycyA9IHtcblx0YnVpbGQ6IGFjY2Vzc29yX2J1aWxkXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FjY2Vzc29ycztcbiIsInZhciByZWR1Y3Rpb19hbGlhcyA9IHtcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIG9iaikge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdGZ1bmN0aW9uIGJ1aWxkQWxpYXNGdW5jdGlvbihrZXkpe1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRyZXR1cm4gb2JqW2tleV0ocGF0aChwKSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRmb3IodmFyIHByb3AgaW4gb2JqKSB7XG5cdFx0XHRcdHBhdGgocClbcHJvcF0gPSBidWlsZEFsaWFzRnVuY3Rpb24ocHJvcCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FsaWFzOyIsInZhciByZWR1Y3Rpb19hbGlhc19wcm9wID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChvYmosIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGZvcih2YXIgcHJvcCBpbiBvYmopIHtcblx0XHRcdFx0cGF0aChwKVtwcm9wXSA9IG9ialtwcm9wXShwYXRoKHApLHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hbGlhc19wcm9wOyIsInZhciByZWR1Y3Rpb19hdmcgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gcGF0aChwKS5zdW0gLyBwYXRoKHApLmNvdW50O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSBwYXRoKHApLnN1bSAvIHBhdGgocCkuY291bnQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuYXZnID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYXZnOyIsInZhciByZWR1Y3Rpb19maWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlci5qcycpO1xudmFyIHJlZHVjdGlvX2NvdW50ID0gcmVxdWlyZSgnLi9jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX3N1bSA9IHJlcXVpcmUoJy4vc3VtLmpzJyk7XG52YXIgcmVkdWN0aW9fYXZnID0gcmVxdWlyZSgnLi9hdmcuanMnKTtcbnZhciByZWR1Y3Rpb19tZWRpYW4gPSByZXF1aXJlKCcuL21lZGlhbi5qcycpO1xudmFyIHJlZHVjdGlvX21pbiA9IHJlcXVpcmUoJy4vbWluLmpzJyk7XG52YXIgcmVkdWN0aW9fbWF4ID0gcmVxdWlyZSgnLi9tYXguanMnKTtcbnZhciByZWR1Y3Rpb192YWx1ZV9jb3VudCA9IHJlcXVpcmUoJy4vdmFsdWUtY291bnQuanMnKTtcbnZhciByZWR1Y3Rpb192YWx1ZV9saXN0ID0gcmVxdWlyZSgnLi92YWx1ZS1saXN0LmpzJyk7XG52YXIgcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50ID0gcmVxdWlyZSgnLi9leGNlcHRpb24tY291bnQuanMnKTtcbnZhciByZWR1Y3Rpb19leGNlcHRpb25fc3VtID0gcmVxdWlyZSgnLi9leGNlcHRpb24tc3VtLmpzJyk7XG52YXIgcmVkdWN0aW9faGlzdG9ncmFtID0gcmVxdWlyZSgnLi9oaXN0b2dyYW0uanMnKTtcbnZhciByZWR1Y3Rpb19zdW1fb2Zfc3EgPSByZXF1aXJlKCcuL3N1bS1vZi1zcXVhcmVzLmpzJyk7XG52YXIgcmVkdWN0aW9fc3RkID0gcmVxdWlyZSgnLi9zdGQuanMnKTtcbnZhciByZWR1Y3Rpb19uZXN0ID0gcmVxdWlyZSgnLi9uZXN0LmpzJyk7XG52YXIgcmVkdWN0aW9fYWxpYXMgPSByZXF1aXJlKCcuL2FsaWFzLmpzJyk7XG52YXIgcmVkdWN0aW9fYWxpYXNfcHJvcCA9IHJlcXVpcmUoJy4vYWxpYXNQcm9wLmpzJyk7XG52YXIgcmVkdWN0aW9fZGF0YV9saXN0ID0gcmVxdWlyZSgnLi9kYXRhLWxpc3QuanMnKTtcbnZhciByZWR1Y3Rpb19jdXN0b20gPSByZXF1aXJlKCcuL2N1c3RvbS5qcycpO1xuXG5mdW5jdGlvbiBidWlsZF9mdW5jdGlvbihwLCBmLCBwYXRoKSB7XG5cdC8vIFdlIGhhdmUgdG8gYnVpbGQgdGhlc2UgZnVuY3Rpb25zIGluIG9yZGVyLiBFdmVudHVhbGx5IHdlIGNhbiBpbmNsdWRlIGRlcGVuZGVuY3lcblx0Ly8gaW5mb3JtYXRpb24gYW5kIGNyZWF0ZSBhIGRlcGVuZGVuY3kgZ3JhcGggaWYgdGhlIHByb2Nlc3MgYmVjb21lcyBjb21wbGV4IGVub3VnaC5cblxuXHRpZighcGF0aCkgcGF0aCA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkOyB9O1xuXG5cdC8vIEtlZXAgdHJhY2sgb2YgdGhlIG9yaWdpbmFsIHJlZHVjZXJzIHNvIHRoYXQgZmlsdGVyaW5nIGNhbiBza2lwIGJhY2sgdG9cblx0Ly8gdGhlbSBpZiB0aGlzIHBhcnRpY3VsYXIgdmFsdWUgaXMgZmlsdGVyZWQgb3V0LlxuXHR2YXIgb3JpZ0YgPSB7XG5cdFx0cmVkdWNlQWRkOiBmLnJlZHVjZUFkZCxcblx0XHRyZWR1Y2VSZW1vdmU6IGYucmVkdWNlUmVtb3ZlLFxuXHRcdHJlZHVjZUluaXRpYWw6IGYucmVkdWNlSW5pdGlhbFxuXHR9O1xuXG5cdGlmKHAuY291bnQgfHwgcC5zdGQpIHtcbiAgICBmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2NvdW50LmFkZChmLnJlZHVjZUFkZCwgcGF0aCwgcC5jb3VudCk7XG4gICAgZi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19jb3VudC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgsIHAuY291bnQpO1xuICAgIGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoLCBwLmNvdW50KTtcblx0fVxuXG5cdGlmKHAuc3VtKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19zdW0uYWRkKHAuc3VtLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdW0ucmVtb3ZlKHAuc3VtLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fc3VtLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAuYXZnKSB7XG5cdFx0aWYoIXAuY291bnQgfHwgIXAuc3VtKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3Qgc2V0IC5jb3VudCh0cnVlKSBhbmQgZGVmaW5lIGEgLnN1bShhY2Nlc3NvcikgdG8gdXNlIC5hdmcodHJ1ZSkuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2F2Zy5hZGQocC5zdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fYXZnLnJlbW92ZShwLnN1bSwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fYXZnLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBUaGUgdW5pcXVlLW9ubHkgcmVkdWNlcnMgY29tZSBiZWZvcmUgdGhlIHZhbHVlX2NvdW50IHJlZHVjZXJzLiBUaGV5IG5lZWQgdG8gY2hlY2sgaWZcblx0Ly8gdGhlIHZhbHVlIGlzIGFscmVhZHkgaW4gdGhlIHZhbHVlcyBhcnJheSBvbiB0aGUgZ3JvdXAuIFRoZXkgc2hvdWxkIG9ubHkgaW5jcmVtZW50L2RlY3JlbWVudFxuXHQvLyBjb3VudHMgaWYgdGhlIHZhbHVlIG5vdCBpbiB0aGUgYXJyYXkgb3IgdGhlIGNvdW50IG9uIHRoZSB2YWx1ZSBpcyAwLlxuXHRpZihwLmV4Y2VwdGlvbkNvdW50KSB7XG5cdFx0aWYoIXAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBkZWZpbmUgYW4gLmV4Y2VwdGlvbihhY2Nlc3NvcikgdG8gdXNlIC5leGNlcHRpb25Db3VudCh0cnVlKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudC5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHRpZihwLmV4Y2VwdGlvblN1bSkge1xuXHRcdGlmKCFwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3QgZGVmaW5lIGFuIC5leGNlcHRpb24oYWNjZXNzb3IpIHRvIHVzZSAuZXhjZXB0aW9uU3VtKGFjY2Vzc29yKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSB2YWx1ZXMgYXJyYXkuXG5cdGlmKHAudmFsdWVMaXN0IHx8IHAubWVkaWFuIHx8IHAubWluIHx8IHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmFkZChwLnZhbHVlTGlzdCwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfbGlzdC5yZW1vdmUocC52YWx1ZUxpc3QsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSBkYXRhIGFycmF5LlxuXHRpZihwLmRhdGFMaXN0KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19kYXRhX2xpc3QuYWRkKHAuZGF0YUxpc3QsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2RhdGFfbGlzdC5yZW1vdmUocC5kYXRhTGlzdCwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2RhdGFfbGlzdC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHRpZihwLm1lZGlhbikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbWVkaWFuLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19tZWRpYW4ucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19tZWRpYW4uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5taW4pIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX21pbi5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbWluLnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbWluLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19tYXguYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX21heC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX21heC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBNYWludGFpbiB0aGUgdmFsdWVzIGNvdW50IGFycmF5LlxuXHRpZihwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfY291bnQucmVtb3ZlKHAuZXhjZXB0aW9uQWNjZXNzb3IsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBIaXN0b2dyYW1cblx0aWYocC5oaXN0b2dyYW1WYWx1ZSAmJiBwLmhpc3RvZ3JhbVRocmVzaG9sZHMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2hpc3RvZ3JhbS5hZGQocC5oaXN0b2dyYW1WYWx1ZSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9faGlzdG9ncmFtLnJlbW92ZShwLmhpc3RvZ3JhbVZhbHVlLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9faGlzdG9ncmFtLmluaXRpYWwocC5oaXN0b2dyYW1UaHJlc2hvbGRzICxmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3VtIG9mIFNxdWFyZXNcblx0aWYocC5zdW1PZlNxdWFyZXMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N1bV9vZl9zcS5hZGQocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N1bV9vZl9zcS5yZW1vdmUocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19zdW1fb2Zfc3EuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3RhbmRhcmQgZGV2aWF0aW9uXG5cdGlmKHAuc3RkKSB7XG5cdFx0aWYoIXAuc3VtT2ZTcXVhcmVzIHx8ICFwLnN1bSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIllvdSBtdXN0IHNldCAuc3VtT2ZTcShhY2Nlc3NvcikgYW5kIGRlZmluZSBhIC5zdW0oYWNjZXNzb3IpIHRvIHVzZSAuc3RkKHRydWUpLiBPciB1c2UgLnN0ZChhY2Nlc3NvcikuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N0ZC5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdGQucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3N0ZC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ3VzdG9tIHJlZHVjZXIgZGVmaW5lZCBieSAzIGZ1bmN0aW9ucyA6IGFkZCwgcmVtb3ZlLCBpbml0aWFsXG5cdGlmIChwLmN1c3RvbSkge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fY3VzdG9tLmFkZChmLnJlZHVjZUFkZCwgcGF0aCwgcC5jdXN0b20uYWRkKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2N1c3RvbS5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgsIHAuY3VzdG9tLnJlbW92ZSk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fY3VzdG9tLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoLCBwLmN1c3RvbS5pbml0aWFsKTtcblx0fVxuXG5cdC8vIE5lc3Rpbmdcblx0aWYocC5uZXN0S2V5cykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbmVzdC5hZGQocC5uZXN0S2V5cywgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbmVzdC5yZW1vdmUocC5uZXN0S2V5cywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX25lc3QuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gQWxpYXMgZnVuY3Rpb25zXG5cdGlmKHAuYWxpYXNLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fYWxpYXMuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgsIHAuYWxpYXNLZXlzKTtcblx0fVxuXG5cdC8vIEFsaWFzIHByb3BlcnRpZXMgLSB0aGlzIGlzIGxlc3MgZWZmaWNpZW50IHRoYW4gYWxpYXMgZnVuY3Rpb25zXG5cdGlmKHAuYWxpYXNQcm9wS2V5cykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fYWxpYXNfcHJvcC5hZGQocC5hbGlhc1Byb3BLZXlzLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Ly8gVGhpcyBpc24ndCBhIHR5cG8uIFRoZSBmdW5jdGlvbiBpcyB0aGUgc2FtZSBmb3IgYWRkL3JlbW92ZS5cblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2FsaWFzX3Byb3AuYWRkKHAuYWxpYXNQcm9wS2V5cywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHR9XG5cblx0Ly8gRmlsdGVycyBkZXRlcm1pbmUgaWYgb3VyIGJ1aWx0LXVwIHByaW9ycyBzaG91bGQgcnVuLCBvciBpZiBpdCBzaG91bGQgc2tpcFxuXHQvLyBiYWNrIHRvIHRoZSBmaWx0ZXJzIGdpdmVuIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBidWlsZCBmdW5jdGlvbi5cblx0aWYgKHAuZmlsdGVyKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19maWx0ZXIuYWRkKHAuZmlsdGVyLCBmLnJlZHVjZUFkZCwgb3JpZ0YucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2ZpbHRlci5yZW1vdmUocC5maWx0ZXIsIGYucmVkdWNlUmVtb3ZlLCBvcmlnRi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHR9XG5cblx0Ly8gVmFsdWVzIGdvIGxhc3QuXG5cdGlmKHAudmFsdWVzKSB7XG5cdFx0T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocC52YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24obikge1xuXHRcdFx0Ly8gU2V0IHVwIHRoZSBwYXRoIG9uIGVhY2ggZ3JvdXAuXG5cdFx0XHR2YXIgc2V0dXBQYXRoID0gZnVuY3Rpb24ocHJpb3IpIHtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0XHRcdHBhdGgocClbbl0gPSB7fTtcblx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0fTtcblx0XHRcdH07XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSBzZXR1cFBhdGgoZi5yZWR1Y2VJbml0aWFsKTtcblx0XHRcdGJ1aWxkX2Z1bmN0aW9uKHAudmFsdWVzW25dLnBhcmFtZXRlcnMsIGYsIGZ1bmN0aW9uIChwKSB7IHJldHVybiBwW25dOyB9KTtcblx0XHR9KTtcblx0fVxufVxuXG52YXIgcmVkdWN0aW9fYnVpbGQgPSB7XG5cdGJ1aWxkOiBidWlsZF9mdW5jdGlvblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19idWlsZDtcbiIsInZhciBwbHVjayA9IGZ1bmN0aW9uKG4pe1xuICAgIHJldHVybiBmdW5jdGlvbihkKXtcbiAgICAgICAgcmV0dXJuIGRbbl07XG4gICAgfTtcbn07XG5cbi8vIHN1cHBvcnRlZCBvcGVyYXRvcnMgYXJlIHN1bSwgYXZnLCBhbmQgY291bnRcbl9ncm91cGVyID0gZnVuY3Rpb24ocGF0aCwgcHJpb3Ipe1xuICAgIGlmKCFwYXRoKSBwYXRoID0gZnVuY3Rpb24oZCl7cmV0dXJuIGQ7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocCwgdil7XG4gICAgICAgIGlmKHByaW9yKSBwcmlvcihwLCB2KTtcbiAgICAgICAgdmFyIHggPSBwYXRoKHApLCB5ID0gcGF0aCh2KTtcbiAgICAgICAgaWYodHlwZW9mIHkuY291bnQgIT09ICd1bmRlZmluZWQnKSB4LmNvdW50ICs9IHkuY291bnQ7XG4gICAgICAgIGlmKHR5cGVvZiB5LnN1bSAhPT0gJ3VuZGVmaW5lZCcpIHguc3VtICs9IHkuc3VtO1xuICAgICAgICBpZih0eXBlb2YgeS5hdmcgIT09ICd1bmRlZmluZWQnKSB4LmF2ZyA9IHguc3VtL3guY291bnQ7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG59O1xuXG5yZWR1Y3Rpb19jYXAgPSBmdW5jdGlvbiAocHJpb3IsIGYsIHApIHtcbiAgICB2YXIgb2JqID0gZi5yZWR1Y2VJbml0aWFsKCk7XG4gICAgLy8gd2Ugd2FudCB0byBzdXBwb3J0IHZhbHVlcyBzbyB3ZSdsbCBuZWVkIHRvIGtub3cgd2hhdCB0aG9zZSBhcmVcbiAgICB2YXIgdmFsdWVzID0gcC52YWx1ZXMgPyBPYmplY3Qua2V5cyhwLnZhbHVlcykgOiBbXTtcbiAgICB2YXIgX290aGVyc0dyb3VwZXIgPSBfZ3JvdXBlcigpO1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBfb3RoZXJzR3JvdXBlciA9IF9ncm91cGVyKHBsdWNrKHZhbHVlc1tpXSksIF9vdGhlcnNHcm91cGVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGNhcCwgb3RoZXJzTmFtZSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwcmlvcigpO1xuICAgICAgICBpZiggY2FwID09PSBJbmZpbml0eSB8fCAhY2FwICkgcmV0dXJuIHByaW9yKCk7XG4gICAgICAgIHZhciBhbGwgPSBwcmlvcigpO1xuICAgICAgICB2YXIgc2xpY2VfaWR4ID0gY2FwLTE7XG4gICAgICAgIGlmKGFsbC5sZW5ndGggPD0gY2FwKSByZXR1cm4gYWxsO1xuICAgICAgICB2YXIgZGF0YSA9IGFsbC5zbGljZSgwLCBzbGljZV9pZHgpO1xuICAgICAgICB2YXIgb3RoZXJzID0ge2tleTogb3RoZXJzTmFtZSB8fCAnT3RoZXJzJ307XG4gICAgICAgIG90aGVycy52YWx1ZSA9IGYucmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpY2VfaWR4OyBpIDwgYWxsLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBfb3RoZXJzR3JvdXBlcihvdGhlcnMudmFsdWUsIGFsbFtpXS52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS5wdXNoKG90aGVycyk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2NhcDtcbiIsInZhciByZWR1Y3Rpb19jb3VudCA9IHtcblx0YWRkOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcHJvcE5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKVtwcm9wTmFtZV0rKztcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIHByb3BOYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocClbcHJvcE5hbWVdLS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcHJvcE5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHQvLyBpZihwID09PSB1bmRlZmluZWQpIHAgPSB7fTtcblx0XHRcdHBhdGgocClbcHJvcE5hbWVdID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY291bnQ7IiwidmFyIHJlZHVjdGlvX2N1c3RvbSA9IHtcblx0YWRkOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgYWRkRm4pIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cmV0dXJuIGFkZEZuKHAsIHYpO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIHJlbW92ZUZuKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHJldHVybiByZW1vdmVGbihwLCB2KTtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgaW5pdGlhbEZuKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XHRcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRyZXR1cm4gaW5pdGlhbEZuKHApO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY3VzdG9tOyIsInZhciByZWR1Y3Rpb19kYXRhX2xpc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24oYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5kYXRhTGlzdC5wdXNoKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0LnNwbGljZShwYXRoKHApLmRhdGFMaXN0LmluZGV4T2YodiksIDEpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2RhdGFfbGlzdDtcbiIsInZhciByZWR1Y3Rpb19leGNlcHRpb25fY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgY291bnQrKyBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgZG9lc24ndCBjb250YWluIGEodikgb3IgaWYgaXQncyAwLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoKCFjdXJyIHx8IGN1cnJbMF0gIT09IGEodikpIHx8IGN1cnJbMV0gPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25Db3VudCsrO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBjb3VudC0tIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvbkNvdW50LS07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuZXhjZXB0aW9uQ291bnQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQ7IiwidmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHN1bSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBzdW0gaWYgdGhlIHAudmFsdWVzIGFycmF5IGRvZXNuJ3QgY29udGFpbiBhKHYpIG9yIGlmIGl0J3MgMC5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKCghY3VyciB8fCBjdXJyWzBdICE9PSBhKHYpKSB8fCBjdXJyWzFdID09PSAwKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uU3VtID0gcGF0aChwKS5leGNlcHRpb25TdW0gKyBzdW0odik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBzdW0sIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgc3VtIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IHBhdGgocCkuZXhjZXB0aW9uU3VtIC0gc3VtKHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW07IiwidmFyIHJlZHVjdGlvX2ZpbHRlciA9IHtcblx0Ly8gVGhlIGJpZyBpZGVhIGhlcmUgaXMgdGhhdCB5b3UgZ2l2ZSB1cyBhIGZpbHRlciBmdW5jdGlvbiB0byBydW4gb24gdmFsdWVzLFxuXHQvLyBhICdwcmlvcicgcmVkdWNlciB0byBydW4gKGp1c3QgbGlrZSB0aGUgcmVzdCBvZiB0aGUgc3RhbmRhcmQgcmVkdWNlcnMpLFxuXHQvLyBhbmQgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgcmVkdWNlciAoY2FsbGVkICdza2lwJyBiZWxvdykgZGVmaW5lZCBiZWZvcmVcblx0Ly8gdGhlIG1vc3QgcmVjZW50IGNoYWluIG9mIHJlZHVjZXJzLiAgVGhpcyBzdXBwb3J0cyBpbmRpdmlkdWFsIGZpbHRlcnMgZm9yXG5cdC8vIGVhY2ggLnZhbHVlKCcuLi4nKSBjaGFpbiB0aGF0IHlvdSBhZGQgdG8geW91ciByZWR1Y2VyLlxuXHRhZGQ6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2ZpbHRlcjtcbiIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9faGlzdG9ncmFtID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHR2YXIgYmlzZWN0SGlzdG8gPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KS5yaWdodDtcblx0XHR2YXIgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkuaGlzdG9ncmFtW2Jpc2VjdEhpc3RvKHBhdGgocCkuaGlzdG9ncmFtLCBhKHYpLCAwLCBwYXRoKHApLmhpc3RvZ3JhbS5sZW5ndGgpIC0gMV07XG5cdFx0XHRjdXJyLnkrKztcblx0XHRcdGN1cnIuc3BsaWNlKGJpc2VjdChjdXJyLCBhKHYpLCAwLCBjdXJyLmxlbmd0aCksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0dmFyIGJpc2VjdEhpc3RvID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkucmlnaHQ7XG5cdFx0dmFyIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLmhpc3RvZ3JhbVtiaXNlY3RIaXN0byhwYXRoKHApLmhpc3RvZ3JhbSwgYSh2KSwgMCwgcGF0aChwKS5oaXN0b2dyYW0ubGVuZ3RoKSAtIDFdO1xuXHRcdFx0Y3Vyci55LS07XG5cdFx0XHRjdXJyLnNwbGljZShiaXNlY3QoY3VyciwgYSh2KSwgMCwgY3Vyci5sZW5ndGgpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uICh0aHJlc2hvbGRzLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5oaXN0b2dyYW0gPSBbXTtcblx0XHRcdHZhciBhcnIgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDE7IGkgPCB0aHJlc2hvbGRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGFyciA9IFtdO1xuXHRcdFx0XHRhcnIueCA9IHRocmVzaG9sZHNbaSAtIDFdO1xuXHRcdFx0XHRhcnIuZHggPSAodGhyZXNob2xkc1tpXSAtIHRocmVzaG9sZHNbaSAtIDFdKTtcblx0XHRcdFx0YXJyLnkgPSAwO1xuXHRcdFx0XHRwYXRoKHApLmhpc3RvZ3JhbS5wdXNoKGFycik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2hpc3RvZ3JhbTsiLCJ2YXIgcmVkdWN0aW9fbWF4ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1heCA9IHBhdGgocCkudmFsdWVMaXN0W3BhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tYXggPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5tYXggPSBwYXRoKHApLnZhbHVlTGlzdFtwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggLSAxXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1heCA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWF4OyIsInZhciByZWR1Y3Rpb19tZWRpYW4gPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGhhbGY7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0aGFsZiA9IE1hdGguZmxvb3IocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoLzIpO1xuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoICUgMikge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHBhdGgocCkudmFsdWVMaXN0W2hhbGZdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSAocGF0aChwKS52YWx1ZUxpc3RbaGFsZi0xXSArIHBhdGgocCkudmFsdWVMaXN0W2hhbGZdKSAvIDIuMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaGFsZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRoYWxmID0gTWF0aC5mbG9vcihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgvMik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoID09PSAxIHx8IHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAlIDIpIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkubWVkaWFuID0gKHBhdGgocCkudmFsdWVMaXN0W2hhbGYtMV0gKyBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXSkgLyAyLjA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX21lZGlhbjsiLCJ2YXIgcmVkdWN0aW9fbWluID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1pbiA9IHBhdGgocCkudmFsdWVMaXN0WzBdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5taW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5taW4gPSBwYXRoKHApLnZhbHVlTGlzdFswXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1pbiA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWluOyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9fbmVzdCA9IHtcblx0YWRkOiBmdW5jdGlvbiAoa2V5QWNjZXNzb3JzLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpOyAvLyBDdXJyZW50IGtleSBhY2Nlc3NvclxuXHRcdHZhciBhcnJSZWY7XG5cdFx0dmFyIG5ld1JlZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRhcnJSZWYgPSBwYXRoKHApLm5lc3Q7XG5cdFx0XHRrZXlBY2Nlc3NvcnMuZm9yRWFjaChmdW5jdGlvbihhKSB7XG5cdFx0XHRcdG5ld1JlZiA9IGFyclJlZi5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXkgPT09IGEodik7IH0pWzBdO1xuXHRcdFx0XHRpZihuZXdSZWYpIHtcblx0XHRcdFx0XHQvLyBUaGVyZSBpcyBhbm90aGVyIGxldmVsLlxuXHRcdFx0XHRcdGFyclJlZiA9IG5ld1JlZi52YWx1ZXM7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gTmV4dCBsZXZlbCBkb2Vzbid0IHlldCBleGlzdCBzbyB3ZSBjcmVhdGUgaXQuXG5cdFx0XHRcdFx0bmV3UmVmID0gW107XG5cdFx0XHRcdFx0YXJyUmVmLnB1c2goeyBrZXk6IGEodiksIHZhbHVlczogbmV3UmVmIH0pO1xuXHRcdFx0XHRcdGFyclJlZiA9IG5ld1JlZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGFyclJlZi5wdXNoKHYpO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChrZXlBY2Nlc3NvcnMsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGFyclJlZjtcblx0XHR2YXIgbmV4dFJlZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRhcnJSZWYgPSBwYXRoKHApLm5lc3Q7XG5cdFx0XHRrZXlBY2Nlc3NvcnMuZm9yRWFjaChmdW5jdGlvbihhKSB7XG5cdFx0XHRcdGFyclJlZiA9IGFyclJlZi5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXkgPT09IGEodik7IH0pWzBdLnZhbHVlcztcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBBcnJheSBjb250YWlucyBhbiBhY3R1YWwgcmVmZXJlbmNlIHRvIHRoZSByb3csIHNvIGp1c3Qgc3BsaWNlIGl0IG91dC5cblx0XHRcdGFyclJlZi5zcGxpY2UoYXJyUmVmLmluZGV4T2YodiksIDEpO1xuXG5cdFx0XHQvLyBJZiB0aGUgbGVhZiBub3cgaGFzIGxlbmd0aCAwIGFuZCBpdCdzIG5vdCB0aGUgYmFzZSBhcnJheSByZW1vdmUgaXQuXG5cdFx0XHQvLyBUT0RPXG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5uZXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX25lc3Q7IiwidmFyIHJlZHVjdGlvX3BhcmFtZXRlcnMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRvcmRlcjogZmFsc2UsXG5cdFx0YXZnOiBmYWxzZSxcblx0XHRjb3VudDogZmFsc2UsXG5cdFx0c3VtOiBmYWxzZSxcblx0XHRleGNlcHRpb25BY2Nlc3NvcjogZmFsc2UsXG5cdFx0ZXhjZXB0aW9uQ291bnQ6IGZhbHNlLFxuXHRcdGV4Y2VwdGlvblN1bTogZmFsc2UsXG5cdFx0ZmlsdGVyOiBmYWxzZSxcblx0XHR2YWx1ZUxpc3Q6IGZhbHNlLFxuXHRcdG1lZGlhbjogZmFsc2UsXG5cdFx0aGlzdG9ncmFtVmFsdWU6IGZhbHNlLFxuXHRcdG1pbjogZmFsc2UsXG5cdFx0bWF4OiBmYWxzZSxcblx0XHRoaXN0b2dyYW1UaHJlc2hvbGRzOiBmYWxzZSxcblx0XHRzdGQ6IGZhbHNlLFxuXHRcdHN1bU9mU3F1YXJlczogZmFsc2UsXG5cdFx0dmFsdWVzOiBmYWxzZSxcblx0XHRuZXN0S2V5czogZmFsc2UsXG5cdFx0YWxpYXNLZXlzOiBmYWxzZSxcblx0XHRhbGlhc1Byb3BLZXlzOiBmYWxzZSxcblx0XHRncm91cEFsbDogZmFsc2UsXG5cdFx0ZGF0YUxpc3Q6IGZhbHNlLFxuXHRcdGN1c3RvbTogZmFsc2Vcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fcGFyYW1ldGVycztcbiIsImZ1bmN0aW9uIHBvc3RQcm9jZXNzKHJlZHVjdGlvKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChncm91cCwgcCwgZikge1xuICAgICAgICBncm91cC5wb3N0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBwb3N0cHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3MuYWxsKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5hbGwoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcG9zdHByb2Nlc3NvcnMgPSByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycztcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHBvc3Rwcm9jZXNzb3JzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgcG9zdHByb2Nlc3NbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYWxsID0gcG9zdHByb2Nlc3MuYWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3JzW25hbWVdKF9hbGwsIGYsIHApLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3M7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzO1xuICAgICAgICB9O1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcG9zdFByb2Nlc3M7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlZHVjdGlvKXtcbiAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycyA9IHt9O1xuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvciA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpe1xuICAgICAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29yc1tuYW1lXSA9IGZ1bmM7XG4gICAgfTtcblxuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvcignY2FwJywgcmVxdWlyZSgnLi9jYXAnKSk7XG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yKCdzb3J0QnknLCByZXF1aXJlKCcuL3NvcnRCeScpKTtcbn07XG4iLCJ2YXIgcmVkdWN0aW9fYnVpbGQgPSByZXF1aXJlKCcuL2J1aWxkLmpzJyk7XG52YXIgcmVkdWN0aW9fYWNjZXNzb3JzID0gcmVxdWlyZSgnLi9hY2Nlc3NvcnMuanMnKTtcbnZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gcmVxdWlyZSgnLi9wYXJhbWV0ZXJzLmpzJyk7XG52YXIgcmVkdWN0aW9fcG9zdHByb2Nlc3MgPSByZXF1aXJlKCcuL3Bvc3Rwcm9jZXNzJyk7XG52YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcjInKTtcblxuZnVuY3Rpb24gcmVkdWN0aW8oKSB7XG5cdHZhciBwYXJhbWV0ZXJzID0gcmVkdWN0aW9fcGFyYW1ldGVycygpO1xuXG5cdHZhciBmdW5jcyA9IHt9O1xuXG5cdGZ1bmN0aW9uIG15KGdyb3VwKSB7XG5cdFx0Ly8gU3RhcnQgZnJlc2ggZWFjaCB0aW1lLlxuXHRcdGZ1bmNzID0ge1xuXHRcdFx0cmVkdWNlQWRkOiBmdW5jdGlvbihwKSB7IHJldHVybiBwOyB9LFxuXHRcdFx0cmVkdWNlUmVtb3ZlOiBmdW5jdGlvbihwKSB7IHJldHVybiBwOyB9LFxuXHRcdFx0cmVkdWNlSW5pdGlhbDogZnVuY3Rpb24gKCkgeyByZXR1cm4ge307IH0sXG5cdFx0fTtcblxuXHRcdHJlZHVjdGlvX2J1aWxkLmJ1aWxkKHBhcmFtZXRlcnMsIGZ1bmNzKTtcblxuXHRcdC8vIElmIHdlJ3JlIGRvaW5nIGdyb3VwQWxsXG5cdFx0aWYocGFyYW1ldGVycy5ncm91cEFsbCkge1xuXHRcdFx0aWYoZ3JvdXAudG9wKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihcIidncm91cEFsbCcgaXMgZGVmaW5lZCBidXQgYXR0ZW1wdGluZyB0byBydW4gb24gYSBzdGFuZGFyZCBkaW1lbnNpb24uZ3JvdXAoKS4gTXVzdCBydW4gb24gZGltZW5zaW9uLmdyb3VwQWxsKCkuXCIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSkubGVmdDtcblx0XHRcdFx0dmFyIGksIGo7XG5cdFx0XHRcdHZhciBrZXlzO1xuICAgICAgICB2YXIga2V5c0xlbmd0aDtcbiAgICAgICAgdmFyIGs7IC8vIEtleVxuXHRcdFx0XHRncm91cC5yZWR1Y2UoXG5cdFx0XHRcdFx0ZnVuY3Rpb24ocCwgdiwgbmYpIHtcblx0XHRcdFx0XHRcdGtleXMgPSBwYXJhbWV0ZXJzLmdyb3VwQWxsKHYpO1xuICAgICAgICAgICAga2V5c0xlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGo9MDtqPGtleXNMZW5ndGg7aisrKSB7XG4gICAgICAgICAgICAgIGsgPSBrZXlzW2pdO1xuICAgICAgICAgICAgICBpID0gYmlzZWN0KHAsIGssIDAsIHAubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aWYoIXBbaV0gfHwgcFtpXS5rZXkgIT09IGspIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBJZiB0aGUgZ3JvdXAgZG9lc24ndCB5ZXQgZXhpc3QsIGNyZWF0ZSBpdCBmaXJzdC5cblx0XHRcdFx0XHRcdFx0XHRwLnNwbGljZShpLCAwLCB7IGtleTogaywgdmFsdWU6IGZ1bmNzLnJlZHVjZUluaXRpYWwoKSB9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vIFRoZW4gcGFzcyB0aGUgcmVjb3JkIGFuZCB0aGUgZ3JvdXAgdmFsdWUgdG8gdGhlIHJlZHVjZXJzXG5cdFx0XHRcdFx0XHRcdGZ1bmNzLnJlZHVjZUFkZChwW2ldLnZhbHVlLCB2LCBuZik7XG4gICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKHAsIHYsIG5mKSB7XG5cdFx0XHRcdFx0XHRrZXlzID0gcGFyYW1ldGVycy5ncm91cEFsbCh2KTtcbiAgICAgICAgICAgIGtleXNMZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihqPTA7ajxrZXlzTGVuZ3RoO2orKykge1xuICAgICAgICAgICAgICBpID0gYmlzZWN0KHAsIGtleXNbal0sIDAsIHAubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0Ly8gVGhlIGdyb3VwIHNob3VsZCBleGlzdCBvciB3ZSdyZSBpbiB0cm91YmxlIVxuXHRcdFx0XHRcdFx0XHQvLyBUaGVuIHBhc3MgdGhlIHJlY29yZCBhbmQgdGhlIGdyb3VwIHZhbHVlIHRvIHRoZSByZWR1Y2Vyc1xuXHRcdFx0XHRcdFx0XHRmdW5jcy5yZWR1Y2VSZW1vdmUocFtpXS52YWx1ZSwgdiwgbmYpO1xuICAgICAgICAgICAgfVxuXHRcdFx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHRcdGlmKCFncm91cC5hbGwpIHtcblx0XHRcdFx0XHQvLyBBZGQgYW4gJ2FsbCcgbWV0aG9kIGZvciBjb21wYXRpYmlsaXR5IHdpdGggc3RhbmRhcmQgQ3Jvc3NmaWx0ZXIgZ3JvdXBzLlxuXHRcdFx0XHRcdGdyb3VwLmFsbCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52YWx1ZSgpOyB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGdyb3VwLnJlZHVjZShmdW5jcy5yZWR1Y2VBZGQsIGZ1bmNzLnJlZHVjZVJlbW92ZSwgZnVuY3MucmVkdWNlSW5pdGlhbCk7XG5cdFx0fVxuXG5cdFx0cmVkdWN0aW9fcG9zdHByb2Nlc3MoZ3JvdXAsIHBhcmFtZXRlcnMsIGZ1bmNzKTtcblxuXHRcdHJldHVybiBncm91cDtcblx0fVxuXG5cdHJlZHVjdGlvX2FjY2Vzc29ycy5idWlsZChteSwgcGFyYW1ldGVycyk7XG5cblx0cmV0dXJuIG15O1xufVxuXG5yZXF1aXJlKCcuL3Bvc3Rwcm9jZXNzb3JzJykocmVkdWN0aW8pO1xucmVkdWN0aW9fcG9zdHByb2Nlc3MgPSByZWR1Y3Rpb19wb3N0cHJvY2VzcyhyZWR1Y3Rpbyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW87XG4iLCJ2YXIgcGx1Y2tfbiA9IGZ1bmN0aW9uIChuKSB7XG4gICAgaWYgKHR5cGVvZiBuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgIH1cbiAgICBpZiAofm4uaW5kZXhPZignLicpKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IG4uc3BsaXQoJy4nKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3BsaXQucmVkdWNlKGZ1bmN0aW9uIChwLCB2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBbdl07XG4gICAgICAgICAgICB9LCBkKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkW25dO1xuICAgIH07XG59O1xuXG5mdW5jdGlvbiBhc2NlbmRpbmcoYSwgYikge1xuICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogYSA+PSBiID8gMCA6IE5hTjtcbn1cblxudmFyIGNvbXBhcmVyID0gZnVuY3Rpb24gKGFjY2Vzc29yLCBvcmRlcmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gb3JkZXJpbmcoYWNjZXNzb3IoYSksIGFjY2Vzc29yKGIpKTtcbiAgICB9O1xufTtcblxudmFyIHR5cGUgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBvcmRlcikge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgb3JkZXIgPSBhc2NlbmRpbmc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByaW9yKCkuc29ydChjb21wYXJlcihwbHVja19uKHZhbHVlKSwgb3JkZXIpKTtcbiAgICB9O1xufTtcbiIsInZhciByZWR1Y3Rpb19zdGQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0XHR2YXIgbiA9IHBhdGgocCkuc3VtT2ZTcSAtIHBhdGgocCkuc3VtKnBhdGgocCkuc3VtL3BhdGgocCkuY291bnQ7XG5cdFx0XHRcdGlmIChuPjAuMCkgcGF0aChwKS5zdGQgPSBNYXRoLnNxcnQobi8ocGF0aChwKS5jb3VudC0xKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDAuMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0XHR2YXIgbiA9IHBhdGgocCkuc3VtT2ZTcSAtIHBhdGgocCkuc3VtKnBhdGgocCkuc3VtL3BhdGgocCkuY291bnQ7XG5cdFx0XHRcdGlmIChuPjAuMCkgcGF0aChwKS5zdGQgPSBNYXRoLnNxcnQobi8ocGF0aChwKS5jb3VudC0xKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuc3RkID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3RkOyIsInZhciByZWR1Y3Rpb19zdW1fb2Zfc3EgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtT2ZTcSA9IHBhdGgocCkuc3VtT2ZTcSArIGEodikqYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtT2ZTcSA9IHBhdGgocCkuc3VtT2ZTcSAtIGEodikqYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3VtX29mX3NxOyIsInZhciByZWR1Y3Rpb19zdW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtID0gcGF0aChwKS5zdW0gKyBhKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW0gPSBwYXRoKHApLnN1bSAtIGEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuc3VtID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3VtOyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9fdmFsdWVfY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE5vdCBzdXJlIGlmIHRoaXMgaXMgbW9yZSBlZmZpY2llbnQgdGhhbiBzb3J0aW5nLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoY3VyciAmJiBjdXJyWzBdID09PSBhKHYpKSB7XG5cdFx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIGluIHRoZSBhcnJheSAtIGluY3JlbWVudCBpdFxuXHRcdFx0XHRjdXJyWzFdKys7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IC0gYWRkIGl0IGluIGZvcm0gW3ZhbHVlLCAxXVxuXHRcdFx0XHRwYXRoKHApLnZhbHVlcy5zcGxpY2UoaSwgMCwgW2EodiksIDFdKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIG9yIHNvbWV0aGluZyBoYXMgZ29uZSB0ZXJyaWJseSB3cm9uZy5cblx0XHRcdHBhdGgocCkudmFsdWVzW2ldWzFdLS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdC8vIEFycmF5W0FycmF5W3ZhbHVlLCBjb3VudF1dXG5cdFx0XHRwYXRoKHApLnZhbHVlcyA9IFtdO1xuXHRcdFx0cGF0aChwKS5iaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFswXTsgfSkubGVmdDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fdmFsdWVfY291bnQ7IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJyk7XG5cbnZhciByZWR1Y3Rpb192YWx1ZV9saXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gTm90IHN1cmUgaWYgdGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIHNvcnRpbmcuXG5cdFx0XHRpID0gYmlzZWN0KHBhdGgocCkudmFsdWVMaXN0LCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgpO1xuXHRcdFx0cGF0aChwKS52YWx1ZUxpc3Quc3BsaWNlKGksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBiaXNlY3QocGF0aChwKS52YWx1ZUxpc3QsIGEodiksIDAsIHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCk7XG5cdFx0XHQvLyBWYWx1ZSBhbHJlYWR5IGV4aXN0cyBvciBzb21ldGhpbmcgaGFzIGdvbmUgdGVycmlibHkgd3JvbmcuXG5cdFx0XHRwYXRoKHApLnZhbHVlTGlzdC5zcGxpY2UoaSwgMSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkudmFsdWVMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3ZhbHVlX2xpc3Q7Il19
