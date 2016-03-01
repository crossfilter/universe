'use strict'

var _ = require('./lodash')
var cf = require('./crossfilter')

module.exports = universe

function universe(data) {

  return cf(data)
    .then(function(data) {

      var service = {
        cf: data,
        columns: [],
        filters: {},
      }

      return _.assign(service, {
        column: require('./column')(service),
        query: require('./query')(service),
        filter: require('./filters')(service).filter,
        dispose: require('./dispose')(service),
        clear: require('./clear')(service),
      })
    })
}
