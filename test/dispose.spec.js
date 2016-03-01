var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');



describe('universe dispose', function() {

  var u = universe(crossfilter([{
    a: 1,
    b: 2,
    c: 3,
    d: 4
  }]))

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('can remove a single column', function() {
    return u.then(function(u) {
        return u.column('a')
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(1)
        return u.dispose('a')
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

  it('can remove a single column based on multiple keys', function() {
    return u.then(function(u) {
        return u.column(['a', 'b', 'c', 'd'])
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(4)
        return u.dispose(['a', 'b', 'c', 'd'])
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

  it('can remove multiple columns', function() {
    return u.then(function(u) {
        return u.column(['a', 'b'])
      })
      .then(function(u) {
        return u.dispose(['a', 'b'])
      })
      .then(function(u) {
        expect(u.columns.length).to.deep.equal(0)
      })
  })

})
