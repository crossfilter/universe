var chai = require('chai')
var expect = chai.expect

var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)


var universe = require('../universe');
var crossfilter = require('crossfilter2');
var data = require('./data');

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
    return universe(crossfilter(data))
  })

  it('can accept an array of data points', function() {
    expect(function() {
      var u = universe(data)
    }).not.to.throw()
  })

  it('can create generated columns using an accessor function', function() {
    return universe(data, {
        generatedColumns: {
          totalAndTip: function(d) {
            return d.total + d.tip
          }
        }
      })
      .then(function(myUniverse) {
        return myUniverse.query({
          groupBy: 'totalAndTip'
        })
      })
      .then(function(res){
        expect(res.data).to.deep.equal([
          { key: 90, value: { count: 6 } },
          { key: 100, value: { count: 1 } },
          { key: 200, value: { count: 1 } },
          { key: 290, value: { count: 2 } },
          { key: 300, value: { count: 1 } },
          { key: 500, value: { count: 1 } }
        ])
      })
  })

});
