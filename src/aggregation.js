'use strict'

var _ = require('./lodash')

module.exports = {
  makeFunction: makeFunction,
}

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
}

function makeFunction(obj) {
  var stack = makeSubAggregationStack(obj).reverse()

  return function(d) {
    return stack.reduce(function(previous, current) {
      return current(previous)
    }, d)
  }
}

function makeSubAggregationStack(obj) {

  var keyVal = _.isObject(obj) ? extractKeyVal(obj) : obj

  // Detect strings, the end of the line
  if (_.isString(obj)) {
    return function(d) {
      return d[obj]
    }
  }

  // If an array, recurse into each item and return as a map
  if (_.isArray(obj)) {
    var subStack = _.map(obj, makeSubAggregationStack)
    return function(d) {
      return subStack.map(function(s) {
        return s(d)
      })
    }
  }

  // If object, find the aggregation, and recurse into the value
  if (keyVal.key) {
    if (aggregators[keyVal.key]) {
      return [aggregators[keyVal.key], makeSubAggregationStack(keyVal.value)]
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




// Aggregators

function $sum(children) {
  return children.reduce(function(a, b) {
    return a + b;
  })
}

function $avg(children) {
  return children.reduce(function(a, b) {
    return a + b;
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
    return a - b;
  });
  var half = Math.floor(children.length / 2);
  if (children.length % 2)
    return children[half];
  else
    return (children[half - 1] + children[half]) / 2.0;
}

function $first(children) {
  return children[0]
}

function $last(children) {
  return children[children.length - 1]
}
