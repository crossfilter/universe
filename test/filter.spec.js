var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');


var data = require('./data');


describe('universe filter', function() {

  var u = universe(data)

  beforeEach(function() {
    return u.then(function(u){
      return u.clear()
    })
  })

  it('has the filter method', function() {
    return u.then(function(u){
      expect(typeof(u.filter)).to.deep.equal('function')
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
  })
})
