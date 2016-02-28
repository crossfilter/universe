'use strict'

var _ = require('./lodash')

module.exports = {
  $count: $count,
  $sum: $sum,
  $avg: $avg,
  $min: $min,
  $max: $max,
  $med: $med,
  $sumSq: $sumSq,
  $std: $std,
}

// Aggregators

function $count(value, name){
  return function(reducer){
    name = name || 'count'
    return reducer.count(true, name)
  }
}

function $sum(value, name){
  return function(reducer){
    name = name || 'sum'
    return reducer.sum(value, name)
  }
}

function $avg(value, name){
  return function(reducer){
    name = name || 'average'
    return reducer.avg(value, name)
  }
}

function $min(value, name){
  return function(reducer){
    name = name || 'min'
    return reducer.min(value, name)
  }
}

function $max(value, name){
  return function(reducer){
    name = name || 'max'
    return reducer.max(value, name)
  }
}

function $med(value, name){
  return function(reducer){
    name = name || 'med'
    return reducer.median(value, name)
  }
}

function $sumSq(value, name){
  return function(reducer){
    name = name || 'sumOfSq'
    return reducer.sumOfSq(value, name)
  }
}

function $std(value, name){
  return function(reducer){
    name = name || 'std'
    return reducer.std(value, name)
  }
}

// TODO histograms
// TODO exceptions
