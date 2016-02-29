'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)

  return function find(query) {

    if(typeof(query) === 'undefined'){
      query = {select: {$count: true}}
    }

    if(typeof(query.select) === 'undefined'){
      query.select = {$count: true}
      console.info('Query object should contain at least one select property, but defaults to', query.select)
    }

    // Support
    query.groupBy = query.groupBy || true

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

    return new Promise(function(resolve, reject){
      resolve({
        data: group.all(),
        crossfilter: service.cf,
        dimension: column.dimension,
        group: group
      })
    })
  }
}
