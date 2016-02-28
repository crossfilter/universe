describe('universe clear', function() {

  var u = universe(crossfilter([{a: 1, b: 2}]))

  beforeEach(function() {
    u.clear()
  })

  it('can clear all filters', function() {
    u.column(['a', 'b'])
    expect(u.columns.length).toEqual(2)
    u.clear()
    expect(u.columns).toEqual([])
  })

})
