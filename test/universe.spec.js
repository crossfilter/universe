describe('universe', function() {

  var oldLog = console.log
  console.log = function(){
    var args = Array.prototype.slice.call(arguments);
    oldLog.apply(null, args.map(function(a){
      return JSON.stringify(a, function(k, v){
        if(typeof(v) === 'function'){
          return v.toString()
        }
        return v
      }, 2)
    }))
  }

  it('is a function', function() {
    expect(typeof universe).toEqual('function');
  });

  it('requires a crossfilter instance', function() {
    expect(function() {
      var u = universe()
    }).toThrow();
  })

  it('can accept a crossfilter instance', function() {
    expect(function() {
      var u = universe(crossfilter([]))
    }).not.toThrow()
  })

  it('can accept an array of data points', function() {
    expect(function() {
      var u = universe([])
    }).not.toThrow()
  })

});
