var column = require('./column')
var validate = require('./validate')

function univerce(cf) {

  validate.cf(cf)

  var vm = {
    events: [],
    cf: cf,
    columns: [],
    columnKeys: [],
  }

  var service = {
    vm: vm,
    column: column
  }

  return service

}

module.exports = univerce
