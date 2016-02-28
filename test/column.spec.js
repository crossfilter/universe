describe('universe column', function() {

  var u = universe(crossfilter([{a: 1}, {b: 2}]))

  beforeEach(function() {
    u.clear()
  })

  it('has the columns properties', function() {
    expect(u.columns).toEqual([])
  })

  it('has the column method', function() {
    expect(typeof(u.column)).toEqual('function')
  })

  it('can add a column without a default type of string', function() {
    u.column('a')
    expect(u.columns[0].key).toEqual('a')
    expect(u.columns[0].type).toEqual('number')
    expect(u.columns[0].dimension).toBeDefined()
  })

  it('can add a column without a specified type', function() {
    u.column({
      key: 'a',
      array: true
    })
    expect(u.columns[0].key).toEqual('a')
    expect(u.columns[0].type).toEqual('array')
    expect(u.columns[0].dimension).toBeDefined()
  })


})
