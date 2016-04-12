var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe')
var crossfilter = require('crossfilter2')


var data = require('./data')


describe('universe filter', function() {

  var u
  
  beforeEach(function() {
    u = universe(data)
  })

  afterEach(function() {
    return u.then(function(u){
      return u.destroy()
    })
  })


  it('has the filter method', function() {
    return u.then(function(u) {
      expect(typeof(u.filter)).to.deep.equal('function')
    })
  })

  it('can filter', function() {
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
          $sum: 'total'
        },
        filter: {
          $or: [{
            total: {
              $gt: 50
            }
          }, {
            quantity: {
              $gt: 1
            }
          }]
        }
      })
    })
    .then(function(res){
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 2,"sum": 300}},
        {"key": "tab","value": {"count": 8,"sum": 920}},
        {"key": "visa","value": {"count": 2,"sum": 500}}
      ])
    })
  })

  it('can not filter on a non-existent column', function() {
    return u.then(function(u) {
      return u.query({
          groupBy: 'total',
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          return res.universe.filter('someOtherColumn', {
            $gt: 95
          })
        })
        .catch(function(err) {
          expect(err).to.be.defined
        })
    })
  })

  it('can filter based on a single column that is not defined yet, then recycle that column', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', {
            $gt: 95
          })
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            {"key": 0, "value": {"max": 200, "valueList": [100, 200]}},
            {"key": 100, "value": {"max": 200, "valueList": [190, 190, 200]}},
            {"key": 200, "value": {"max": 300, "valueList": [300]}}
          ])
          return u.filter('total')
        })
        .then(function(u){
          expect(u.columns.length).to.deep.equal(1)
        })
    })
  })

  it('can filter based on a complex column regardless of key order', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: ['tip', 'total'],
          select: {
            $max: 'total'
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter(['total', 'tip'], {
            $gt: 95
          })
        })
        .then(function(res) {
          expect(data).to.deep.equal([
            {"key": [0, 100],"value": {"valueList": [100],"max": 100}},
            {"key": [0, 200],"value": {"valueList": [200],"max": 200}},
            {"key": [0, 90],"value": {"valueList": [90, 90, 90, 90, 90, 90],"max": 90}},
            {"key": [100, 190],"value": {"valueList": [190, 190],"max": 190}},
            {"key": [100, 200],"value": {"valueList": [200],"max": 200}},
            {"key": [200, 300],"value": {"valueList": [300],"max": 300}}
          ])
        })
    })
  })

  it('can filter using $column data', function() {
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          filter: {
            type: {
              $last: {
                $column: 'type'
              }
            }
          }
        })
        .then(function(u) {
          expect(u.data).to.deep.equal([
            { key: 0, value: { count: 8 } },
            { key: 100, value: { count: 3 } },
            { key: 200, value: { count: 1 } }
          ])
        })
    })
  })

  it('can filter using all $data', function() {
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
        },
        filter: {
          date: {
            $gt: {
              '$get(date)': {
                '$nthPct(50)': '$data'
              }
            }
          }
        }
      })
    })
    .then(function(res){
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 1}},
        {"key": "tab","value": {"count": 3}},
        {"key": "visa","value": {"count": 1}}
      ])
    })
  })

  it('can not remove colum that is used in dynamic filter', function() {
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
        },
        filter: {
          date: {
            $gt: {
              '$get(date)': {
                '$nth(2)': {
                  $column: 'date'
                }
              }
            }
          }
        }
      })
    })
    .then(function(res){
      return res.universe.clear('date')
    })
    .then(function(u){
      expect(u.columns.length).to.deep.equal(2)
    })
  })

  it('can toggle filters using simple values', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('type', 'cash')
        })
        .then(function(u) {
          expect(u.filters.type.value).to.deep.equal('cash')
          expect(data).to.deep.equal([
            { key: 0, value: { count: 2 } },
            { key: 100, value: { count: 0 } },
            { key: 200, value: { count: 0 } }
          ])
          return u.filter('type', 'visa')
        })
        .then(function(u){
          expect(u.filters.type.value).to.deep.equal(['visa','cash'])
          expect(data).to.deep.equal([
            { key: 0, value: { count: 2 } },
            { key: 100, value: { count: 1 } },
            { key: 200, value: { count: 1 } }
          ])
          return u.filter('type', 'tab')
        })
        .then(function(u){
          expect(u.filters.type.value).to.deep.equal(['tab', 'visa', 'cash'])
          expect(data).to.deep.equal([
            { key: 0, value: { count: 8 } },
            { key: 100, value: { count: 3 } },
            { key: 200, value: { count: 1 } }
          ])
          return u.filter('type', 'visa')
        })
        .then(function(u){
          expect(u.filters.type.value).to.deep.equal(['tab','cash'])
          expect(data).to.deep.equal([
            { key: 0, value: { count: 8 } },
            { key: 100, value: { count: 2 } },
            { key: 200, value: { count: 0 } }
          ])
          return u.filter('type')
        })
    })
  })

  it('can toggle filters using an array as a range', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', [85, 101], true)
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 1 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
          return u
        })
        .then(function(u) {
          return u.filter('total', [85, 91], true)
        })
        .then(function(){
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 0 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
        })
    })
  })

  it('can toggle filters using an array as an include', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('total', [90, 100])
        })
        .then(function(u) {
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 1 } },
            { key: 'tab', value: { count: 6 } },
            { key: 'visa', value: { count: 0 } }
          ])
          return u
        })
        .then(function(u) {
          return u.filter('total', [90, 300, 200])
        })
        .then(function(u){
          expect(data).to.deep.equal([
            { key: 'cash', value: { count: 2 } },
            { key: 'tab', value: { count: 0 } },
            { key: 'visa', value: { count: 2 } }
          ])
        })
    })
  })

  it('can forcefully replace filters', function() {
    var data
    return u.then(function(u) {
      return u.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
        .then(function(res) {
          data = res.data
          return res.universe.filter('type', 'cash')
        })
        .then(function(u) {
          expect(u.filters.type.value).to.deep.equal('cash')
          return u
        })
        .then(function(u) {
          return u.filter('type', ['tab', 'visa'], false, true)
        })
        .then(function(u){
          expect(u.filters.type.value).to.deep.equal(['tab', 'visa'])
        })
    })
  })
})
