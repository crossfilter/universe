describe('universe', function() {

  it('is a function', function() {
    expect(typeof universe).toEqual('function');
  });

  it('requires a crossfilter instance', function() {
    expect(function() {
      var u = universe()
    }).toThrow();
  })

  it('can accept a crossfilter instance', function() {
    expect(function(){
      var u = universe(crossfilter([]))
    }).not.toThrow()
  })

  it('can accept an array of data points', function() {
    expect(function(){
      var u = universe([])
    }).not.toThrow()
  })

});
