describe('universe query', function() {

  var u = universe(crossfilter([{a: 1, b: 2, c: 3}]))

  beforeEach(function() {
    u.clear()
  })

  it('has the query method', function() {
    expect(typeof(u.query)).toEqual('function')
  })

  it('can create a reducer', function(){
    u.column(['a', 'b'])
    u.query({
      groupBy: 'c',
      select: {
        $count: 'a'
      }
    })
  })
})
