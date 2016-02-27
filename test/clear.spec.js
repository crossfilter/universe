describe('universe clear', function() {

  var u = universe(crossfilter([]))

  beforeEach(function() {
    u.clear()
  })

  it('can clear all filters', function() {
    u.column({
        key: 'a'
      })
      .column({
        key: 'b'
      })
    expect(u.columns.length).toEqual(2)
    u.clear()
    expect(u.columns).toEqual([])
  })

})
