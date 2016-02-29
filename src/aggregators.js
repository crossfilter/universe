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
