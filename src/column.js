module.exports = column

var types = require('./types')

function column(key, type){
  if(vm.$column[key]){
    console.warn('Column has already been defined', arguments)
  }
  vm.$column[key] = {

  }
}
