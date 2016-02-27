describe('Univerce', function() {

  it('is a function', function(topic) {
    expect(typeof univerce).toEqual('function');
  });

  it('requires a crossfilter instance', function() {
    expect(function() {
      var u = univerce()
    }).toThrow(new Error("No Crossfilter instance found!"));
  })

});
