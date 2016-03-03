var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


var universe = require('../universe');
var data = require('./data');
var crossfilter = require('crossfilter2');

describe('universe query', function() {

  var u = universe(crossfilter(data))

  beforeEach(function() {
    return u.then(function(u){
      return u.clear()
    })
  })

  it('has the query method', function() {
    return u.then(function(u){
      expect(typeof(u.query)).to.deep.equal('function')
    })
  })

  it('can create ad-hoc dimensions for each column', function(){
    return u.then(function(u){
      return u.query({
        groupBy: 'date',
        select: {}
      })
    })
    .then(function(res){
      return res.universe.query({
        groupBy: 'quantity',
        select: {}
      })
    })
    .then(function(res){
      return res.universe.query({
        groupBy: 'total',
        select: {}
      })
    })
    .then(function(res){
      return res.universe.query({
        groupBy: 'tip',
        select: {}
      })
    })
    .then(function(res){
      return res.universe.query({
        groupBy: 'type',
        select: {}
      })
    })
    .then(function(res){
      return res.universe.query({
        groupBy: 'productIDs',
        select: {}
      })
    })
  })

  it('Defaults to counting each record', function(){
    return u.then(function(u){
      return u.query()
    })
    .then(function(res){
      expect(res.data).to.deep.equal([
        {"key": 0,"value": {"count": 1}},
        {"key": 1,"value": {"count": 1}},
        {"key": 2,"value": {"count": 1}},
        {"key": 3,"value": {"count": 1}},
        {"key": 4,"value": {"count": 1}},
        {"key": 5,"value": {"count": 1}},
        {"key": 6,"value": {"count": 1}},
        {"key": 7,"value": {"count": 1}},
        {"key": 8,"value": {"count": 1}},
        {"key": 9,"value": {"count": 1}},
        {"key": 10,"value": {"count": 1}},
        {"key": 11,"value": {"count": 1}}
      ])
    })
  })

  it('supports all reductio aggregations', function(){
    return u.then(function(u){
      return u.query({
        select: {
          $count: true,
          $sum: 'total',
          $avg: 'total',
          $min: 'total',
          $max: 'total',
          $med: 'total',
          $sumSq: 'total',
          $std: 'total',
        }
      })
    })
    .then(function(res){
      expect(res.data).to.deep.equal([
        {"key": 0,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 1,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 2,"value": {"count": 1,"sum": 300,"avg": 300,"valueList": [300],"median": 300,"min": 300,"max": 300,"sumOfSq": 90000,"std": 0}},
        {"key": 3,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 4,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 5,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 6,"value": {"count": 1,"sum": 100,"avg": 100,"valueList": [100],"median": 100,"min": 100,"max": 100,"sumOfSq": 10000,"std": 0}},
        {"key": 7,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 8,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 9,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 10,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}},
        {"key": 11,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}
        }
      ])
    })
  })

  it('supports column aggregations', function(){
    return u.then(function(u){
      return u.query({
        select: {
          $sum: {
            $sum: ['tip', 'total']
          },
        }
      })
    })
    .then(function(res){
      expect(res.data).to.deep.equal([
        {"key": 0,"value": {"sum": 290}},
        {"key": 1,"value": {"sum": 290}},
        {"key": 2,"value": {"sum": 500}},
        {"key": 3,"value": {"sum": 90}},
        {"key": 4,"value": {"sum": 90}},
        {"key": 5,"value": {"sum": 90}},
        {"key": 6,"value": {"sum": 100}},
        {"key": 7,"value": {"sum": 90}},
        {"key": 8,"value": {"sum": 90}},
        {"key": 9,"value": {"sum": 90}},
        {"key": 10,"value": {"sum": 200}},
        {"key": 11,"value": {"sum": 300}}
      ])
    })
  })

  it('supports groupBy', function(){
    return u.then(function(u){
      return u.query({
        groupBy: 'type'
      })
      .then(function(res){
        expect(res.data).to.deep.equal([
          {"key": "cash","value": {"count": 2}},
          {"key": "tab","value": {"count": 8}},
          {"key": "visa","value": {"count": 2}}
        ])
      })
    })
  })

  it('supports filtering', function() {
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
          $sum: 'total'
        },
        filter: {
          $or: [
            {
              total: {
                $gt: 50
              }
            },
            {
              quantity: {
                $gt: 1
              }
            }
          ]

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

  it('can filter using $column data', function() {
    return u.then(function(u){
      return u.query({
        groupBy: 'type',
        select: {
          $count: 'true',
        },
        filter: {
          date: {
            $lt: {
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
      expect(res.data).to.deep.equal([
        {"key": "cash","value": {"count": 0}},
        {"key": "tab","value": {"count": 2}},
        {"key": "visa","value": {"count": 0}}
      ])
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
    .catch(function(err){
      expect(err).to.be.defined
    })
    .then(function(res){
      expect(res).to.be.undefined
    })
  })


  // it('supports nested aliases', function(){
  //   u.query({
  //     groupBy: 'type',
  //     select: {
  //       my: {
  //         awesome: {
  //           column: {
  //             $count: true
  //           }
  //         }
  //       }
  //     },
  //     filter: {
  //
  //     }
  //   })
  //   .then(function(res){
  //     expect(res.data).to.deep.equal([
  //       {"key": "cash","value": {"count": 2}},
  //       {"key": "tab","value": {"count": 8}},
  //       {"key": "visa","value": {"count": 2}}
  //     ])
  //   })
  // })
})
