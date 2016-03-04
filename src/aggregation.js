'use strict'

var _ = require('./lodash')
var naturalSort = require('javascript-natural-sort');

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
  $sort: $sort,
}


module.exports = {
    makeFunction: makeFunction,
    aggregators: aggregators,
    parseAggregatorParams: parseAggregatorParams,
  }
  // This is used to build aggregation stacks for sub-reductio
  // aggregations, or plucking values for use in filters from the data
function makeFunction(obj) {
  var stack = makeSubAggregationFunction(obj).reverse()

  return function(d) {
    return stack.reduce(function(previous, current) {
      return current(previous)
    }, d)
  }
}

// A recursive function that walks the aggregation stack and returns
// a function. The returned function, when called, will recursively invoke
// with the properties from the previous stack in reverse order
function makeSubAggregationFunction(obj) {

  var keyVal = _.isObject(obj) ? extractKeyVal(obj) : obj

  // Detect strings, the end of the line
  if (_.isString(obj)) {
    return function(d) {
      return d[obj]
    }
  }

  // If an array, recurse into each item and return as a map
  if (_.isArray(obj)) {
    var subStack = _.map(obj, makeSubAggregationFunction)
    return function(d) {
      return subStack.map(function(s) {
        return s(d)
      })
    }
  }

  // If object, find the aggregation, and recurse into the value
  if (keyVal.key) {
    if (aggregators[keyVal.key]) {
      return [aggregators[keyVal.key], makeSubAggregationFunction(keyVal.value)]
    } else {
      console.error('Could not find aggregration method', keyVal)
    }
  }

  return []
}

function extractKeyVal(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return {
        key: key,
        value: obj[key]
      }
    }
  }
  return
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




// Collection Aggregators

function $sum(children) {
  return children.reduce(function(a, b) {
    return a + b
  })
}

function $avg(children) {
  return children.reduce(function(a, b) {
    return a + b
  }) / children.length
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

function $med(children) {
  children.sort(function(a, b) {
    return a - b
  })
  var half = Math.floor(children.length / 2)
  if (children.length % 2)
    return children[half]
  else
    return (children[half - 1] + children[half]) / 2.0
}

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
  return children.map(function(d) {
    return d[n]
  })
}

function $sort(children, n) {
  // Alphanumeric by property
  if (_.isString(n)) {
    children.sort(function sortByKey(a, b) {
      if (a[n] < b[n])
        return -1;
      else if (a[n] > b[n])
        return 1;
      else
        return 0;
    });
  }
  // Numeric by property
  if (_.isNumber(n)) {
    children.sort(function sortByKey(a, b) {
      return a[n] - b[n]
    });
  }
  // Flat, natural sorting
  // Be sure to copy the array as to not mutate the original
  return Array.prototype.slice.call(children).sort(naturalSort)
}
