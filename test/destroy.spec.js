var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
var expect = chai.expect

var universe = require('../universe')
var crossfilter = require('crossfilter2')
var data = require('./data')

describe('universe clear', function() {

  var u = universe(data)

  beforeEach(function() {
    return u.then(function(u) {
      return u.clear()
    })
  })

  it('can destroy the universe a few times over', function() {
    return u.then(function(u) {
        return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'total',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.destroy()
      })
      .then(function(u) {
        return u.add(data)
      })
      .then(function(u) {
        return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'total',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.destroy()
      })
      .then(function(u) {
        return u.add(data)
      })
      .then(function(u) {
        return u.query({
          groupBy: 'type',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'total',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.query({
          groupBy: 'tip',
          select: {
            $count: true
          }
        })
      })
      .then(function(u) {
        return u.universe.destroy()
      })
  })

})
