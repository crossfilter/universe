describe('universe dispose', function() {

  var u = universe(crossfilter([]))

  beforeEach(function() {
    u.clear()
  })

  it('can remove a single column', function() {
    u.column({
        key: 'a'
      })
      .dispose({
        key: 'a'
      })
    expect(u.columns.length).toEqual(0)
  })

  it('can remove a single column based on multiple keys', function() {
    u.column({
      key: ['a', 'b', 'c', 'd']
    })
    expect(u.columns.length).toEqual(1)
    u.dispose({
      key: ['a', 'b', 'c', 'd']
    })
    expect(u.columns.length).toEqual(0)
  })

  it('can remove multiple columns', function() {
    u.column({
        key: 'a'
      })
      .column({
        key: 'b'
      })
      .dispose(['a', 'b'])
    expect(u.columns.length).toEqual(0)
  })

})
