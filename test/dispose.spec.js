var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');
var data = require('./data');



describe('universe dispose', function() {

  var u = universe(data)

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('can remove a single column', function() {
    return u.then(function(u) {
        return u.column('type')
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(1)
        return u.dispose('type')
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

  it('can remove a single column based on multiple keys', function() {
    return u.then(function(u) {
        return u.column({
          key: ['type', 'total', 'quantity', 'tip']
        })
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(1)
        return u.dispose({
          key: ['type', 'total', 'quantity', 'tip']
        })
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

  it('can remove multiple columns', function() {
    return u.then(function(u) {
        return u.column(['type', 'total'])
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(2)
        return u.dispose(['type', 'total'])
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

})
