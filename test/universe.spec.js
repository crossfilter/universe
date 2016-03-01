var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


var universe = require('../universe');
var crossfilter = require('crossfilter2');



describe('universe', function() {

  it('is a function', function() {
    expect(typeof universe).to.equal('function');
  });

  it('requires a crossfilter instance', function() {
    return universe()
      .then(function(res) {
        return expect(res).to.be.undefined;
      })
      .catch(function(err) {
        return expect(err).to.be.defined;
      })
  })

  it('can accept a crossfilter instance', function() {
    return universe(crossfilter([]))
  })

  it('can accept an array of data points', function() {
    expect(function() {
      var u = universe([])
    }).not.to.throw()
  })

});
