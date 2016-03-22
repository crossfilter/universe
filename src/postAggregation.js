'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function(service) {
  return {
    getMethods: getMethods
  }

  function getMethods(query){
    return {
      sortBy: sortBy
    }

    function sortBy(){
      
    }
  }
}
