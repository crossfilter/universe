var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');



describe('universe column', function() {

  var u = universe(crossfilter([{
    a: 1
  }, {
    b: 2
  }]))

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('has the columns properties', function() {
    return u.then(function(u) {
      expect(u.columns).to.deep.equal([])
    })
  })

  it('has the column method', function() {
    return u.then(function(u) {
      expect(typeof(u.column)).to.deep.equal('function')
    })
  })

  it('can add a column without a default type of string', function() {
    return u.then(function(u) {
        return u.column('a')
      })
      .then(function(u) {
        expect(u.columns[0].key).to.deep.equal('a')
        expect(u.columns[0].type).to.deep.equal('number')
        expect(u.columns[0].dimension).to.be.defined
      })
  })

  it('can add a column without a specified type', function() {
    return u.then(function(u) {
        return u.column({
          key: 'a',
          array: true
        })
      })
      .then(function(u) {
        expect(u.columns[0].key).to.deep.equal('a')
        expect(u.columns[0].type).to.deep.equal('array')
        expect(u.columns[0].dimension).to.be.defined
      })
  })


})
