'use strict'

module.exports = function(service) {

  return function clear() {
    service.columns = []
  }

}
