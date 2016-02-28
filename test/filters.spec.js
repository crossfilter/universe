describe('universe filter', function() {

  var u = universe(crossfilter([{a: 1,b: 2}]))

  beforeEach(function() {
    u.clear()
  })

  it('has the filters properties', function() {
    expect(u.filters).toEqual([])
  })

  it('has the filter method', function() {
    expect(typeof(u.filter)).toEqual('function')
  })

  // it('can add a filter', function() {
  //   u.filter({
  //     key: 'a'
  //   })
  //   expect(u.filters[0].key).toEqual('a')
  //   expect(u.filters[0].type).toEqual('string')
  //   expect(u.filters[0].dimension).toBeDefined()
  // })
  //
  // it('can add a filter without a specified type', function() {
  //   u.filter({
  //     'a',
  //     type: 'number'
  //   })
  //   expect(u.filters[0].key).toEqual('a')
  //   expect(u.filters[0].type).toEqual('number')
  //   expect(u.filters[0].dimension).toBeDefined()
  // })


})
