var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');



describe('universe filter', function() {

  var u = universe(crossfilter(getData()))

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



////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////


function getData() {
  return [{
    date: "2011-11-14T16:17:54Z",
    quantity: 2,
    total: 190,
    tip: 100,
    type: "tab",
    productIDs: ["001"]
  }, {
    date: "2011-11-14T16:20:19Z",
    quantity: 2,
    total: 190,
    tip: 100,
    type: "tab",
    productIDs: ["001", "005"]
  }, {
    date: "2011-11-14T16:28:54Z",
    quantity: 1,
    total: 300,
    tip: 200,
    type: "visa",
    productIDs: ["004", "005"]
  }, {
    date: "2011-11-14T16:30:43Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "002"]
  }, {
    date: "2011-11-14T16:48:46Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["005"]
  }, {
    date: "2011-11-14T16:53:41Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "004", "005"]
  }, {
    date: "2011-11-14T16:54:06Z",
    quantity: 1,
    total: 100,
    tip: 0,
    type: "cash",
    productIDs: ["001", "002", "003", "004", "005"]
  }, {
    date: "2011-11-14T16:58:03Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001"]
  }, {
    date: "2011-11-14T17:07:21Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["004", "005"]
  }, {
    date: "2011-11-14T17:22:59Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "002", "004", "005"]
  }, {
    date: "2011-11-14T17:25:45Z",
    quantity: 2,
    total: 200,
    tip: 0,
    type: "cash",
    productIDs: ["002"]
  }, {
    date: "2011-11-14T17:29:52Z",
    quantity: 1,
    total: 200,
    tip: 100,
    type: "visa",
    productIDs: ["004"]
  }]
}
