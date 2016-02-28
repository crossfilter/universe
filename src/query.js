'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)

  return function find(query) {

    var column = _.find(service.columns, {key: query.groupBy})

    if(!column){
      service.column({
        key: query.groupBy,
        array: !!query.array
      })
    }

    column = _.find(service.columns, {key: query.groupBy})

    var group = column.dimension.group()
    var reducer = reductiofy(query)
    reducer(group)
    console.log(group.all())
  }
}
