import _filters from './filters'
import _crossfilter from './crossfilter'
import column from './column'
import query from './query'
import clear from './clear'
import destroy from './destroy'

function universe(data, options) {
  var service = {
    options: Object.assign({}, options),
    columns: [],
    filters: {},
    dataListeners: [],
    filterListeners: [],
  }

  var cf = _crossfilter(service)
  var filters = _filters(service)

  data = cf.generateColumns(data)

  return cf.build(data)
    .then(function(data) {
      service.cf = data
      return Object.assign(service, {
        add: cf.add,
        remove: cf.remove,
        column: column(service),
        query: query(service),
        filter: filters.filter,
        filterAll: filters.filterAll,
        applyFilters: filters.applyFilters,
        clear: clear(service),
        destroy: destroy(service),
        onDataChange: onDataChange,
        onFilter: onFilter,
      })
    })

  function onDataChange(cb) {
    service.dataListeners.push(cb)
    return function() {
      service.dataListeners.splice(service.dataListeners.indexOf(cb), 1)
    }
  }

  function onFilter(cb) {
    service.filterListeners.push(cb)
    return function() {
      service.filterListeners.splice(service.filterListeners.indexOf(cb), 1)
    }
  }
}

export default universe