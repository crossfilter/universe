'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)

  return function find(query) {
    var reducer = reductiofy(query)
  }
}


var fake = {
  groupBy: 'type',
  columns: {
    // shorthand to track 'count' for every group
    $count: true,
    // create a new tracking property called complexSum
    complex: {
      // track the sum of 'quantity' + average('a', 'b', 'c') from every group
      $sum: {
        $sum: [
          'quantity', {
            $avg: ['a', 'b', 'c']
          }
        ]
      },
      $max: 'quantity'
    },
    // Create a new tracking property called quantity
    quantity: {
      // Sum the 'quantity' from every group
      $sum: 'quantity'
    },
  },
}


var result = [{
  key: 'visa',
  value: {
    count: 5,
    complex: {
      sum: 45,
      max: 70
    },
    quantity: 8
  }
}]

reducer.sum(function(d) {
  return $sum([
    d.quantity,
    $avg([d.a, d.b, d.c])
  })
})
