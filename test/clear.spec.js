var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');
var data = require('./data');

describe('universe clear', function() {

  var u = universe(data)

  beforeEach(function() {
    return u.then(function(u){
      return u.clear()
    })
  })

  it('can clear all filters', function() {
    return u.then(function(u) {
      return u.column(['type', 'total'])
    })
    .then(function(u){
      expect(u.columns.length).to.deep.equal(2)
      return u.clear()
    })
    .then(function(u){
      expect(u.columns).to.deep.equal([])
    })
  })

})
