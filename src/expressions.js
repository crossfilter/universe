'use strict'

module.exports = {
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
  $size: $size,

  // Aggregations
  $sum: $sum,
  $avg: $avg,
  $max: $max,
  $min: $min,
  $first: $first,
  $last: $last,
}

// Operators

function $and() {
  return function(children) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < children.length; i++) {
      if (!children[i].apply(null, args)) {
        return false
      }
    }
    return true
  }
}

function $or() {
  return function(children) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < children.length; i++) {
      if (children[i].apply(null, args)) {
        return true
      }
    }
    return true
  }
}

function $not() {
  return function(children) {
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0; i < children.length; i++) {
      if (children[i].apply(null, args)) {
        return false
      }
    }
    return true
  }
}


// Expressions

function $eq() {
  return function(a, b) {
    return a === b
  }
}

function $gt() {
  return function(a, b) {
    return a > b
  }
}

function $gte() {
  return function(a, b) {
    return a >= b
  }
}

function $lt() {
  return function(a, b) {
    return a < b
  }
}

function $lte() {
  return function(a, b) {
    return a <= b
  }
}

function $ne() {
  return function(a, b) {
    return a !== b
  }
}

function $type() {
  return function(a, b) {
    return typeof(a) === b
  }
}

// Array Expressions

function $in() {
  return function(haystack, needle) {
    return haystack.indexOf(needle) > -1
  }
}

function $nin() {
  return function(haystack, needle) {
    return haystack.indexOf(needle) === -1
  }
}

function $size() {
  return function(obj, val) {
    return obj.length === val
  }
}




// Aggregations

function $sum() {
  return function(children) {
    return children.reduce(function(a, b) {
      return function() {
        return a + b;
      }
    })
  }
}

function $avg() {
  return function(children) {
    return children.reduce(function(a, b) {
      return function() {
        return a + b;
      }
    }) / children.length
  }
}

function $max() {
  return function(children) {
    return Math.max.apply(null, children)
  }
}

function $min() {
  return function(children) {
    return Math.min.apply(null, children)
  }
}

function $count() {
  return function(children) {
    return children.length
  }
}

function $med() {
  return function(children) {
    children.sort(function(a, b) {
      return a - b;
    });
    var half = Math.floor(children.length / 2);
    if (children.length % 2)
      return children[half];
    else
      return (children[half - 1] + children[half]) / 2.0;
  }
}

function $first() {
  return function(children) {
    return children[0]
  }
}

function $last() {
  return function(children) {
    return children[children.length - 1]
  }
}
