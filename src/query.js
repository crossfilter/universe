'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)
  var filters = require('./filters')(service)
  var postAggregation = require('./postAggregation')(service)

  return function doQuery(queryObj) {

    var query
    var queryHash = JSON.stringify(queryObj)

    // Attempt to reuse an exact copy of this query that is present elsewhere
    for (var i = 0; i < service.columns.length; i++) {
      for (var j = 0; j < service.columns[i].queries.length; j++) {
        if (service.columns[i].queries[j].hash === queryHash) {
          return Promise.try(function() {
            return service.columns[i].queries[j]
          })
        }
      }
    }


    query = {
      // The Universe for continuous promise chaining
      universe: service,
      // Parent column
      column: null,
      // Crossfilter instances
      crossfilter: service.cf,
      dimension: null,
      group: null,
      // Reductio reducer instance
      reducer: null,
      // Listeners
      removeListeners: [],
      // Post aggregations
      postAggregations: [],
      // Original query passed in to query method
      original: queryObj,
      hash: queryHash
    }

    // Default queryObj
    if (_.isUndefined(query.original)) {
      query.original = {}
    }
    // Default select
    if (_.isUndefined(query.original.select)) {
      query.original.select = {
        $count: true
      }
    }
    // Default to groupAll
    query.original.groupBy = query.original.groupBy || true

    // Attach the query api to the query object
    addQueryMethods(query)

    return createColumn(query)
      .then(makeCrossfilterGroup)
      .then(buildRequiredColumns)
      .then(applyQuery)


    function createColumn(query) {
      // Ensure column is created
      return service.column({
          key: query.original.groupBy,
          type: !_.isUndefined(query.type) ? query.type : null,
          array: !!query.array
        })
        .then(function() {
          // Attach the column to the query
          var column = service.column.find(query.original.groupBy)
          query.column = column
          column.queries.push(query)
          return query
        })
    }

    function makeCrossfilterGroup(query) {
      // Create the grouping on the columns dimension
      // Using Promise Resolve allows support for crossfilter async
      // TODO check if query already exists, and use the same base query // if possible
      return Promise.resolve(query.column.dimension.group())
        .then(function(g) {
          query.group = g
          return query
        })
    }

    function buildRequiredColumns(query) {
      var requiredColumns = filters.scanForDynamicFilters(query.original)
        // We need to scan the group for any filters that would require
        // the group to be rebuilt when data is added or removed in any way.
      if (requiredColumns.length) {
        return Promise.all(_.map(requiredColumns, function(columnKey) {
            return service.column({
              key: columnKey,
              dynamicReference: query.group
            })
          }))
          .then(function() {
            // Here, we create a listener to recreate and apply the reducer
            // (with updated reference data) to
            // the group anytime data changes
            var stopListeningForData = service.onDataChange(function applyReducerOnDataChange() {
              return applyQuery(query)
            })
            query.column.removeListeners.push(stopListeningForData)
            return query
          })
      }
      return query
    }

    function applyQuery(query) {
      // Create the reducer using reductio and the Universe
      // Query Syntax
      return buildReducer(query)
        .then(applyReducer)
        .then(attachData)
    }

    function buildReducer(query) {
      return reductiofy(query.original)
        .then(function(reducer) {
          query.reducer = reducer
          return query
        })
    }

    function applyReducer(query) {
      return Promise.resolve(query.reducer(query.group))
        .then(function() {
          return query
        })
    }

    function attachData(query) {
      return Promise.resolve(query.group.all())
        .then(function(data) {
          query.data = data
          return query
        })
    }

    function applyPostAggregations(query) {
      return query
    }

    function addQueryMethods(q) {
      _.assign(q, postAggregation.getMethods(q), {
        clear: clearQuery
      })

      function clearQuery() {
        _.forEach(q.removeListners, function(l) {
          l()
        })
        return Promise.try(function() {
            return q.group.dispose()
          })
          .then(function() {
            q.column.queries.splice(q.column.queries.indexOf(q), 1)
            if (!q.column.queries.length) {
              return service.clear(q.column.key)
            }
          })
          .then(function() {
            return service
          })
      }

    }
  }
}
