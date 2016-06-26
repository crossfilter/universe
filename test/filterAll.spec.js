/* globals describe, it, beforeEach, afterEach */

var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe')
// var crossfilter = require('crossfilter2') //defined but never used

var filters = require('../src/filters')

var data = require('./data')

describe('universe filterAll', function () {
  var u

  beforeEach(function () {
    u = universe(data)
  })

  afterEach(function () {
    return u.then(function (u) {
      return u.destroy()
    })
  })

  /* demostrates that filterAll is missing from universe instance */
  it('has the filterAll method', function () {  // fails
    return u.then(function (u) {
      expect(typeof u.filterAll).to.deep.equal('function')
    })
  })

  /* demostrates that filterAll method in ./src/filters.js does not
    clear filters themselves.  */
  it('can filterAll', function () {
    var data

    return u.then(function (u) {
      return u.query({
        groupBy: 'tip',
        select: {
          $count: true
        }
      })
      .then(function (res) {
        data = res.data
        expect(data).to.deep.equal([
          {key: 0, value: {count: 8}},
          {key: 100, value: {count: 3}},
          {key: 200, value: {count: 1}}
        ])
        return res.universe.filter('type', 'cash')
      })
      .then(function (u) {
        expect(data).to.deep.equal([
          {key: 0, value: {count: 2}},
          {key: 100, value: {count: 0}},
          {key: 200, value: {count: 0}}
        ])
        expect(u.filters.type.value).to.deep.equal('cash')
        return u
      })
      .then(function (u) {
        return filters(u).filterAll()  // manually calling filterAll
      })
      .then(function (u) {
        expect(u.filters).to.deep.equal({})
        return u
      })
      .then(function () {
        expect(data).to.deep.equal([
          {key: 0, value: {count: 8}},
          {key: 100, value: {count: 3}},
          {key: 200, value: {count: 1}}
        ])
      })
    })
  })
})
