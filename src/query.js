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
    }

    // Support
    query.groupBy = query.groupBy || true

    var column = _.find(service.columns, {key: query.groupBy})

    if(!column){
      service.column({
        key: query.groupBy,
        type: !_.isUndefined(query.type) ? query.type : null,
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
