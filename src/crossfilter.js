'use strict'

var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = cf

function cf(c){
  if(_.isArray(c)){
    return crossfilter(c)
  }
  if(!c || typeof(c.dimension) !== 'function'){
    throw new Error('No Crossfilter data or instance found!')
  }
  return c
}
