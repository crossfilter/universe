'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function(service) {
  return function destroy() {
    return service.clear()
      .then(function(){
        service.cf.dataListeners = []
        service.cf.filterListeners = []
        return Promise.resolve(service.cf.remove())
      })
      .then(function(){
        return service
      })
  }
}
