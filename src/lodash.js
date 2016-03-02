'use strict'

var assign = require('lodash/assign')
var find = require('lodash/find')
var remove = require('lodash/remove')
var isArray = require('lodash/isArray')
var isObject = require('lodash/isObject')
var isBoolean = require('lodash/isBoolean')
var isString = require('lodash/isString')
var isNumber = require('lodash/isNumber')
var get = require('lodash/get')
var map = require('lodash/map')
var sortBy = require('lodash/sortBy')
var forEach = require('lodash/forEach')
var isUndefined = require('lodash/isUndefined')
var pick = require('lodash/pick')
var xor = require('lodash/xor')
var clone = require('lodash/clone')
var isEqual = require('lodash/isEqual')
var each = require('lodash/each')

module.exports = {
  assign: assign,
  find: find,
  remove: remove,
  isArray: isArray,
  isObject: function(d){return isObject(d) && !isArray(d)},
  isBoolean: isBoolean,
  isString: isString,
  isNumber: isNumber,
  get: get,
  map: map,
  sortBy: sortBy,
  forEach: forEach,
  isUndefined: isUndefined,
  pick: pick,
  xor: xor,
  clone: clone,
  isEqual: isEqual,
  each: each,
}
