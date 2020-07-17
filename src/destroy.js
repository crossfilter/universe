export default function(service) {
  return function destroy() {
    return service.clear()
      .then(function() {
        service.cf.dataListeners = []
        service.cf.filterListeners = []
        return Promise.resolve(service.cf.remove())
      })
      .then(function() {
        return service
      })
  }
}