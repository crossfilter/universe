var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe');
var crossfilter = require('crossfilter2');
var data = require('./data');



describe('universe column', function() {

  var u = universe(data)

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
        return u.column('type')
      })
      .then(function(u) {
        expect(u.columns[0].key).to.deep.equal('type')
        expect(u.columns[0].type).to.deep.equal('string')
        expect(u.columns[0].dimension).to.be.defined
      })
  })

  it('can add a column with a specified type', function() {
    return u.then(function(u) {
        return u.column({
          key: 'productIDs',
          array: true
        })
      })
      .then(function(u) {
        expect(u.columns[0].key).to.deep.equal('productIDs')
        expect(u.columns[0].type).to.deep.equal('array')
        expect(u.columns[0].dimension).to.be.defined
      })
  })

  it('can add a column with a complex key', function() {
    return u.then(function(u) {
        return u.column({
          key: ['type', 'total', 'quantity', 'tip']
        })
      })
      .then(function(u) {
        expect(u.columns[0].key).to.deep.equal(['type', 'total', 'quantity', 'tip'])
        expect(u.columns[0].type).to.deep.equal('complex')
        expect(u.columns[0].dimension).to.be.defined
      })
  })

  it('can try to create the same column multiple times, but still only create one', function() {
    var now = Date.now()
    var diff1
    var diff2
    return u.then(function(u) {
        return Promise.all([
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          }),
          u.column({
            key: ['type', 'total']
          })
        ])
        .then(function(){
          return u
        })
      })
      .then(function(u) {
        expect(u.columns.length).to.equal(1)
      })
  })


})
