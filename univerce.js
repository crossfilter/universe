!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.univerce=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var column = require('./column')
var validate = require('./validate')

function univerce(cf) {

  validate.cf(cf)

  var vm = {
    events: [],
    cf: cf,
    columns: [],
    columnKeys: [],
  }

  var service = {
    vm: vm,
    column: column
  }

  return service

}

module.exports = univerce

},{"./column":2,"./validate":4}],2:[function(require,module,exports){
module.exports = column

var types = require('./types')

function column(key, type){
  if(vm.$column[key]){
    console.warn('Column has already been defined', arguments)
  }
  vm.$column[key] = {

  }
}

},{"./types":3}],3:[function(require,module,exports){
module.exports = types()

function types(){
  return {
    string: String,
    number: Number,
    bool: Boolean,
    array: Array
  }
}

},{}],4:[function(require,module,exports){
module.exports = {
  cf: cf
}

function cf(c){
  if(!c || typeof(c.dimension) !== 'function'){
    throw new Error('No Crossfilter instance found!')
  }
}

},{}]},{},[1])(1)
});