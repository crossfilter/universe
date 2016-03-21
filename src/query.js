'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)
  var filters = require('./filters')(service)

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
    var column = service.column.find(query.groupBy)

    var group

    return Promise.try(function() {
        // Create Column if not found
        if (!column) {
          return service.column({
              key: query.groupBy,
              type: !_.isUndefined(query.type) ? query.type : null,
              array: !!query.array
            })
            .then(function() {
              return service.column.find(query.groupBy)
            })
        }
        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user has now decided to query on it
        return column
      })
      .then(function(c) {
        column = c
          // Create the grouping on the columns dimension
          // Using Promise Resolve allows support for crossfilter async
        return Promise.resolve(column.dimension.group())
      })
      .then(function(g) {
        // Save the group while we create the reducer
        group = g
        return filters.scanForDynamicFilters(query)
      })
      .then(function(requiredColumns) {
        // We need to scan the group for any filters that would require
        // the group to be rebuilt when data is added or removed in any way.
        if (requiredColumns.length) {
          return Promise.all(_.map(requiredColumns, function(columnKey) {
              return service.column({
                key: columnKey,
                dynamicReference: group
              })
            }))
            .then(function() {
              return true
            })
        }
        return false
      })
      .then(function(needsListener) {
        // Here, we create a listener to recreate and apply the reducer
        // (with updated reference data) to
        // the group anytime data changes.

        var queryRes = {
          // The Universe for continuous promise chaining
          universe: service,
          // The bare metalqueryRes.data
          crossfilter: service.cf,
          dimension: column.dimension,
          group: group,
          // Reductio reducer instance
          reducer: null,
          // original query passed in to query method
          original: query
        };
        column.queries.push(queryRes);

        var stopListeningForData
        if (needsListener) {
          stopListeningForData = service.onDataChange(function applyReducerOnDataChange(isPost) {
            return applyReducer(queryRes, isPost)
          })
          column.removeListeners.push(stopListeningForData)
        }

        return applyReducer(queryRes)
          .then(function() {
            return queryRes
          })

        function applyReducer(queryRes, isPost) {
          // Create the reducer using reductio and the Universe Query Syntax
          return reductiofy(query)
            .then(function(reducer) {
              queryRes.reducer = reducer
              // Apply the reducer to the group
              queryRes.reducer(queryRes.group)
              return Promise.resolve(queryRes.group.all())
            })
            .then(function(all){
              queryRes.data = all
            })
        }

      })
  }
}
