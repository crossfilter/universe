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
  // Collections
  $in: $in,
  $nin: $nin,
  $size: $size,
  $sum: $sum,
  $avg: $avg,
  $max: $max,
  $min: $min,
  $first: $first,
  $last: $last,
}

function $and(parent, children) {
  for (var i = 0; i < children.length; i++) {
    if (!children[i](parent)) {
      return false
    }
  }
  return true
}

function $or(parent, children) {
  for (var i = 0; i < children.length; i++) {
    if (children[i](parent)) {
      return true
    }
  }
  return true
}

function $not(parent, children) {
  for (var i = 0; i < children.length; i++) {
    if (children[i](parent)) {
      return false
    }
  }
  return true
}




// Expressions

function $eq(parent, child) {
  return parent === child
}

function $gt(parent, child) {
  return parent > child
}

function $gte(parent, child) {
  return parent >= child
}

function $lt(parent, child) {
  return parent < child
}

function $lte(parent, child) {
  return parent <= child
}

function $ne(parent, child) {
  return parent !== child
}

function $type(parent, child) {
  return typeof(parent) === child
}




// Collections

function $in(parent, children) {
  return children.indexOf(parent) > -1
}

function $nin(parent, children) {
  return children.indexOf(parent) === -1
}

function $size(parent, children) {
  return parent.length === children
}

function $sum(parent, children) {
  return children.reduce(function(a, b) {
    return a + b;
  });
}

function $avg(parent, children) {
  return children.reduce(function(a, b) {
    return a + b;
  }) / children.length
}

function $max(parent, children) {
  return Math.max.apply(null, children)
}

function $min(parent, children) {
  return Math.min.apply(null, children)
}

function $first(parent, children) {
  return children[0]
}

function $last(parent, children) {
  return children[children.length - 1]
}
