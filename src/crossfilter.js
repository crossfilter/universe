'use strict'

import crossfilter from 'crossfilter2'

import _ from './lodash'

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
