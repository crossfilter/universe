var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


var universe = require('../universe')
var data = require('./data')
var crossfilter = require('crossfilter2')

describe('universe dynamic data', function() {

  var u

  beforeEach(function() {
    u = universe(crossfilter(data))
  })

  afterEach(function() {
    return u.then(function(u){
      return u.destroy()
    })
  })

  it('can add data to an existing query', function() {
    var res
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
          $sum: 'total'
        },
      })
    })
    .then(function(r){
      res = r
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 2, sum: 300}},
        {"key": "tab","value": {"count": 8, sum: 920}},
        {"key": "visa","value": {"count": 2, sum: 500}}
      ])
      return res.universe.add([{
        date: "2012-11-14T17:29:52Z",
        quantity: 100,
        total: 50000,
        tip: 999,
        type: "visa",
        productIDs: ["004"]
      }, {
        date: "2012-11-14T17:29:52Z",
        quantity: 100,
        total: 400,
        tip: 600,
        type: "other",
        productIDs: ["004"]
      }])
    })
    .then(function(r){
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 2, sum: 300}},
        {"key": "other","value": {"count": 1, sum: 400}},
        {"key": "tab","value": {"count": 8, sum: 920}},
        {"key": "visa","value": {"count": 3, sum: 50500}},
      ])
    })
  })

  it('can add new data to dynamic filters', function() {
    var res
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
          $sum: 'total'
        },
        filter: {
          date: {
            $eq: {
              '$last': {
                $column: 'date'
              }
            }
          }
        }
      })
    })
    .then(function(r){
      res = r
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 0, sum: 0}},
        {"key": "tab","value": {"count": 0, sum: 0}},
        {"key": "visa","value": {"count": 1, sum: 200}}
      ])
      return res.universe.add([{
        date: "2012-11-14T17:29:52Z",
        quantity: 100,
        total: 50000,
        tip: 999,
        type: "visa",
        productIDs: ["004"]
      }])
    })
    .then(function(r){
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 0, sum: 0}},
        {"key": "tab","value": {"count": 0, sum: 0}},
        {"key": "visa","value": {"count": 1, sum: 50000}},
      ])
    })
  })

  it('can query using the valueList aggregation', function() {
    var res
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $valueList: 'total',
        }
      })
    })
    .then(function(r){
      res = r
      return res.universe.add([{
        date: "2012-11-14T17:29:52Z",
        quantity: 100,
        total: 50000,
        tip: 999,
        type: "visa",
        productIDs: ["004"]
      }])
    })
    .then(function(r){
      expect(res.data).to.deep.equal([
        { key: 'cash', value: { valueList: [100, 200] } },
        { key: 'tab', value: { valueList: [90, 90, 90, 90, 90, 90, 190, 190] } },
        { key: 'visa', value: { valueList: [200, 300, 50000] } } ])
    })
  })
})
