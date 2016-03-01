'use strict'

var Promise = require('bluebird');
var _ = require('./lodash')

module.exports = function(service) {
  return function clear() {

    return Promise.all(_.map(service.columns, function(c){
      return Promise.resolve(c.dimension.dispose())
    }))
    .then(function(){
      service.columns = []
      return service
    })

  }
}
