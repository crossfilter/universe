'use strict'

module.exports = {
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

function $sum(d, children) {
  return children.reduce(function(a, b) {
    return function() {
      return a + b;
    }
  })
}

function $avg(d, children) {
  return children.reduce(function(a, b) {
    return function() {
      return a + b;
    }
  }) / children.length
}

function $max(d, children) {
  return Math.max.apply(null, children)
}

function $min(d, children) {
  return Math.min.apply(null, children)
}

function $count(d, children) {
  return children.length
}

function $med(d, children) {
  children.sort(function(a, b) {
    return a - b;
  });
  var half = Math.floor(children.length / 2);
  if (children.length % 2)
    return children[half];
  else
    return (children[half - 1] + children[half]) / 2.0;
}

function $first(d, children) {
  return children[0]
}

function $last(d, children) {
  return children[children.length - 1]
}
