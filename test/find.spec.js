describe('universe query', function() {

  var u = universe(crossfilter(getData()))

  beforeEach(function() {
    u.clear()
  })

  it('has the query method', function() {
    expect(typeof(u.query)).toEqual('function')
  })

  it('can create ad-hoc dimensions for each column', function(){
    u.query({
      groupBy: 'date',
      select: {}
    })
    u.query({
      groupBy: 'quantity',
      select: {}
    })
    u.query({
      groupBy: 'total',
      select: {}
    })
    u.query({
      groupBy: 'tip',
      select: {}
    })
    u.query({
      groupBy: 'type',
      select: {}
    })
    u.query({
      groupBy: 'productIDs',
      select: {}
    })
  })

  it('Defaults to counting each record', function(done){
    u.query()
    .then(function(res){
      expect(res.data).toEqual([
        {"key": 0,"value": {"count": 1}},
        {"key": 1,"value": {"count": 1}},
        {"key": 2,"value": {"count": 1}},
        {"key": 3,"value": {"count": 1}},
        {"key": 4,"value": {"count": 1}},
        {"key": 5,"value": {"count": 1}},
        {"key": 6,"value": {"count": 1}},
        {"key": 7,"value": {"count": 1}},
        {"key": 8,"value": {"count": 1}},
        {"key": 9,"value": {"count": 1}},
        {"key": 10,"value": {"count": 1}},
        {"key": 11,"value": {"count": 1}}
      ])

    })
    .then(done)
  })

  it('supports all reductio aggregations', function(done){
    u.query({
      select: {
        $count: true,
        $sum: 'total',
        $avg: 'total',
        $min: 'total',
        $max: 'total',
        $med: 'total',
        $sumSq: 'total',
        $std: 'total',
      }
    })
    .then(function(res){
      expect(res.data).toEqual([
        {"key": 0,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 1,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 2,"value": {"count": 1,"sum": 300,"avg": 300,"valueList": [300],"median": 300,"min": 300,"max": 300,"sumOfSq": 90000,"std": 0}},
        {"key": 3,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 4,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 5,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 6,"value": {"count": 1,"sum": 100,"avg": 100,"valueList": [100],"median": 100,"min": 100,"max": 100,"sumOfSq": 10000,"std": 0}},
        {"key": 7,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 8,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 9,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 10,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}},
        {"key": 11,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}
        }
      ])
    })
    .then(done)
  })

  it('supports column aggregations', function(done){
    u.query({
      groupBy: 'type',
      select: {
        $sum: {
          $sum: ['tip', 'total']
        },
      }
    })
    .then(function(res){
      console.log(res)
      expect(res.data).toEqual([
        {"key": 0,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 1,"value": {"count": 1,"sum": 190,"avg": 190,"valueList": [190],"median": 190,"min": 190,"max": 190,"sumOfSq": 36100,"std": 0}},
        {"key": 2,"value": {"count": 1,"sum": 300,"avg": 300,"valueList": [300],"median": 300,"min": 300,"max": 300,"sumOfSq": 90000,"std": 0}},
        {"key": 3,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 4,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 5,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 6,"value": {"count": 1,"sum": 100,"avg": 100,"valueList": [100],"median": 100,"min": 100,"max": 100,"sumOfSq": 10000,"std": 0}},
        {"key": 7,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 8,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 9,"value": {"count": 1,"sum": 90,"avg": 90,"valueList": [90],"median": 90,"min": 90,"max": 90,"sumOfSq": 8100,"std": 0}},
        {"key": 10,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}},
        {"key": 11,"value": {"count": 1,"sum": 200,"avg": 200,"valueList": [200],"median": 200,"min": 200,"max": 200,"sumOfSq": 40000,"std": 0}
        }
      ])
    })
    .then(done)
  })
})



function getData() {
  return [{
    date: "2011-11-14T16:17:54Z",
    quantity: 2,
    total: 190,
    tip: 100,
    type: "tab",
    productIDs: ["001"]
  }, {
    date: "2011-11-14T16:20:19Z",
    quantity: 2,
    total: 190,
    tip: 100,
    type: "tab",
    productIDs: ["001", "005"]
  }, {
    date: "2011-11-14T16:28:54Z",
    quantity: 1,
    total: 300,
    tip: 200,
    type: "visa",
    productIDs: ["004", "005"]
  }, {
    date: "2011-11-14T16:30:43Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "002"]
  }, {
    date: "2011-11-14T16:48:46Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["005"]
  }, {
    date: "2011-11-14T16:53:41Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "004", "005"]
  }, {
    date: "2011-11-14T16:54:06Z",
    quantity: 1,
    total: 100,
    tip: 0,
    type: "cash",
    productIDs: ["001", "002", "003", "004", "005"]
  }, {
    date: "2011-11-14T16:58:03Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001"]
  }, {
    date: "2011-11-14T17:07:21Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["004", "005"]
  }, {
    date: "2011-11-14T17:22:59Z",
    quantity: 2,
    total: 90,
    tip: 0,
    type: "tab",
    productIDs: ["001", "002", "004", "005"]
  }, {
    date: "2011-11-14T17:25:45Z",
    quantity: 2,
    total: 200,
    tip: 0,
    type: "cash",
    productIDs: ["002"]
  }, {
    date: "2011-11-14T17:29:52Z",
    quantity: 1,
    total: 200,
    tip: 100,
    type: "visa",
    productIDs: ["004"]
  }]
}
