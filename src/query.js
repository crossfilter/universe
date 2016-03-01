'use strict'

var Promise = require('bluebird');
var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)

  return function find(query) {

    // Default query
    if (typeof(query) === 'undefined') {
      query = {}
    }

    // Default select
    if (typeof(query.select) === 'undefined') {
      query.select = {
        $count: true
      }
    }

    // Support groupAll
    query.groupBy = query.groupBy || true

    // Find Existing Column
    var column = _.find(service.columns, {
      key: query.groupBy
    })


    return Promise.try(function() {
        // Create Column if not found
        if (!column) {
          return service.column({
              key: query.groupBy,
              type: !_.isUndefined(query.type) ? query.type : null,
              array: !!query.array
            })
            .then(function(u) {
              return _.find(u.columns, {
                key: query.groupBy
              })
            })
        }
        // Or just return the exiting one
        return column
      })
      .then(function(c) {
        column = c
        // Create the grouping on the columns dimension
        // Using Promise Resolve allows support for crossfilter async
        return Promise.resolve(column.dimension.group())
      })
      .then(function(group) {
        // Create the reducer using reductio and the Universe Query Syntax
        var reducer = reductiofy(query)
          // Apply the reducer to the group
        reducer(group)

        return {
          // The Universe for continuous promise chaining
          universe: service,
          // The valuables
          data: group.all(),
          // The bare metal
          crossfilter: service.cf,
          dimension: column.dimension,
          group: group,
        }
      })
  }
}
