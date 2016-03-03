'use strict'

var Promise = require('q')
var _ = require('./lodash')
var cf = require('./crossfilter')

module.exports = universe

function universe(data) {

  var service = {
    columns: [],
    filters: {},
  }

  return cf(data)
    .then(function(data) {

      service.cf = data

      return Promise.try(function() {
        return Promise.resolve(service.cf.onChange(updateUniverse))
      })

      function updateUniverse(event) {
        switch (event) {
          case 'addedData':
          case 'removedData':
            return reGroupQueries()
          case 'filter':
            //
        }
      }

      function reGroupQueries() {
        _.forEach(service.columns, function(column) {
          _.forEach(column.groupListeners, function(listener) {
            listener()
          })
        })
      }

    })
    .then(function() {
      return _.assign(service, {
        // add: require('./add')(service),
        column: require('./column')(service),
        query: require('./query')(service),
        filter: require('./filters')(service).filter,
        clear: require('./clear')(service),
      })
    })
}
