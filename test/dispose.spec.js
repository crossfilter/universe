describe('universe dispose', function() {

  var u = universe(crossfilter([{
    a: 1,
    b: 2,
    c: 3,
    d: 4
  }]))

  beforeEach(function() {
    u.clear()
  })

  it('can remove a single column', function() {
    u.column('a')
    expect(u.columns.length).toEqual(1)
    u.dispose('a')
    expect(u.columns.length).toEqual(0)
  })

  it('can remove a single column based on multiple keys', function() {
    u.column(['a', 'b', 'c', 'd'])
    expect(u.columns.length).toEqual(4)
    u.dispose(['a', 'b', 'c', 'd'])
    expect(u.columns.length).toEqual(0)
  })

  it('can remove multiple columns', function() {
    u.column(['a', 'b'])
      .dispose(['a', 'b'])
    expect(u.columns.length).toEqual(0)
  })

})
