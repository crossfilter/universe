var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


var universe = require('../universe');
var data = require('./data');
var crossfilter = require('crossfilter2');

describe('universe postAggregation', function() {

  var u = universe(crossfilter(data))

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('can do general post aggregations', function() {
    var before
    var after
    return u.then(function(u) {
        return u.query({
          groupBy: 'type'
        })
      })
      .then(function(res) {
        before = res
        expect(before.data).to.deep.equal([
          { key: 'cash', value: { count: 2 }},
          { key: 'tab', value: { count: 8 }},
          { key: 'visa', value: { count: 2 }}
        ])
        return res.post(function(q){
          q.data[0].value.count += 10
          q.data[2].key += '_test'
          return q
        })
      })
      .then(function(res){
        after = res
        expect(after.data).to.deep.equal([
          { key: 'cash', value: { count: 12 }},
          { key: 'tab', value: { count: 8 }},
          { key: 'visa_test', value: { count: 2 }}
        ])
        return u.then(function(u){
          return u.filter('total', '100')
        })
        .then(function(){
          expect(before.data).to.deep.equal([
            { key: 'cash', value: { count: 1 }},
            { key: 'tab', value: { count: 0 }},
            { key: 'visa', value: { count: 0 }}
          ])
          return res
        })
      })
      .then(function(res){
        expect(before.data).to.deep.equal([
          { key: 'cash', value: { count: 1 }},
          { key: 'tab', value: { count: 0 }},
          { key: 'visa', value: { count: 0 }}
        ])
        expect(after.data).to.deep.equal([
          { key: 'cash', value: { count: 11 }},
          { key: 'tab', value: { count: 0 }},
          { key: 'visa_test', value: { count: 0 }}
        ])
        expect(res.data).to.deep.equal([
          { key: 'cash', value: { count: 11 }},
          { key: 'tab', value: { count: 0 }},
          { key: 'visa_test', value: { count: 0 }}
        ])
        console.log(res.data)
      })
  })

  // it('can sortBy query result keys', function() {
  //   return u.then(function(u) {
  //       return u.query({
  //         groupBy: 'type'
  //       })
  //     })
  //     .then(function(res) {
  //       return res.sortByKey(true)
  //     })
  //     .then(function(res) {
  //       expect(res.data[0].key).to.equal('visa')
  //       return res.sortByKey()
  //     })
  //     .then(function(res) {
  //       expect(res.data[0].key).to.equal('cash')
  //       return res.sortByKey()
  //     })
  //     .then(function(res) {
  //       return u.then(function(u) {
  //           return u.filter('type', 'cash')
  //         })
  //         .then(function(u){
  //           return res
  //         })
  //     })
  //     .then(function(res) {
  //       console.log(res.data)
  //       expect(res.data[0].key).to.equal('visa')
  //     })
  // })

})
