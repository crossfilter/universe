import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('has the query method', async t => {
  const u = await universe(data)
  t.deepEqual(typeof u.query, 'function')
})

test('can create ad-hoc dimensions for each column', async () => {
  const u = await universe(data)

  await u.query({
    groupBy: 'date',
    select: {}
  })

  await u.query({
    groupBy: 'quantity',
    select: {}
  })

  await u.query({
    groupBy: 'total',
    select: {}
  })

  await u.query({
    groupBy: 'tip',
    select: {}
  })

  await u.query({
    groupBy: 'type',
    select: {}
  })

  await u.query({
    groupBy: 'productIDs',
    select: {}
  })

  await u.query({
    groupBy: ['productIDs', 'date'],
    select: {}
  })
})

test('Defaults to counting each record', async t => {
  const u = await universe(data)

  const q = await u.query()

  t.deepEqual(q.data, [
    {key: 0, value: {count: 1}},
    {key: 1, value: {count: 1}},
    {key: 2, value: {count: 1}},
    {key: 3, value: {count: 1}},
    {key: 4, value: {count: 1}},
    {key: 5, value: {count: 1}},
    {key: 6, value: {count: 1}},
    {key: 7, value: {count: 1}},
    {key: 8, value: {count: 1}},
    {key: 9, value: {count: 1}},
    {key: 10, value: {count: 1}},
    {key: 11, value: {count: 1}}
  ])
})

test('supports all reductio aggregations', async t => {
  const u = await universe(data)

  const q = await u.query({
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

  t.deepEqual(q.data, [
    {key: 0, value: {count: 1, sum: 190, avg: 190, valueList: [190], median: 190, min: 190, max: 190, sumOfSq: 36100, std: 0}},
    {key: 1, value: {count: 1, sum: 190, avg: 190, valueList: [190], median: 190, min: 190, max: 190, sumOfSq: 36100, std: 0}},
    {key: 2, value: {count: 1, sum: 300, avg: 300, valueList: [300], median: 300, min: 300, max: 300, sumOfSq: 90000, std: 0}},
    {key: 3, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 4, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 5, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 6, value: {count: 1, sum: 100, avg: 100, valueList: [100], median: 100, min: 100, max: 100, sumOfSq: 10000, std: 0}},
    {key: 7, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 8, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 9, value: {count: 1, sum: 90, avg: 90, valueList: [90], median: 90, min: 90, max: 90, sumOfSq: 8100, std: 0}},
    {key: 10, value: {count: 1, sum: 200, avg: 200, valueList: [200], median: 200, min: 200, max: 200, sumOfSq: 40000, std: 0}},
    {key: 11, value: {count: 1, sum: 200, avg: 200, valueList: [200], median: 200, min: 200, max: 200, sumOfSq: 40000, std: 0}
    }
  ])
})

test('supports column aggregations with arrays', async t => {
  const u = await universe(data)

  const q = await u.query({
    select: {
      $sum: {
        $sum: ['tip', 'total']
      },
    }
  })

  t.deepEqual(q.data, [
    {key: 0, value: {sum: 290}},
    {key: 1, value: {sum: 290}},
    {key: 2, value: {sum: 500}},
    {key: 3, value: {sum: 90}},
    {key: 4, value: {sum: 90}},
    {key: 5, value: {sum: 90}},
    {key: 6, value: {sum: 100}},
    {key: 7, value: {sum: 90}},
    {key: 8, value: {sum: 90}},
    {key: 9, value: {sum: 90}},
    {key: 10, value: {sum: 200}},
    {key: 11, value: {sum: 300}}
  ])
})

test('supports column aggregations with objects', async t => {
  const u = await universe(data)

  const q = await u.query({
    select: {
      $sum: {
        $sum: {
          $max: ['tip', 'total'],
          $min: ['quantity', 'total']
        }
      },
    }
  })

  t.deepEqual(q.data, [
    {key: 0, value: {sum: 192}},
    {key: 1, value: {sum: 192}},
    {key: 2, value: {sum: 301}},
    {key: 3, value: {sum: 92}},
    {key: 4, value: {sum: 92}},
    {key: 5, value: {sum: 92}},
    {key: 6, value: {sum: 101}},
    {key: 7, value: {sum: 92}},
    {key: 8, value: {sum: 92}},
    {key: 9, value: {sum: 92}},
    {key: 10, value: {sum: 202}},
    {key: 11, value: {sum: 201}}
  ])
})

test('supports column aggregations using string syntax', async t => {
  const u = await universe(data)

  const q = await u.query({
    select: {
      $sum: '$sum($max(tip,total), $min(quantity,total))'
    }
  })

  t.deepEqual(q.data, [
    {key: 0, value: {sum: 192}},
    {key: 1, value: {sum: 192}},
    {key: 2, value: {sum: 301}},
    {key: 3, value: {sum: 92}},
    {key: 4, value: {sum: 92}},
    {key: 5, value: {sum: 92}},
    {key: 6, value: {sum: 101}},
    {key: 7, value: {sum: 92}},
    {key: 8, value: {sum: 92}},
    {key: 9, value: {sum: 92}},
    {key: 10, value: {sum: 202}},
    {key: 11, value: {sum: 201}}
  ])
})

test('supports groupBy', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type'
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 2}},
    {key: 'tab', value: {count: 8}},
    {key: 'visa', value: {count: 2}}
  ])
})

test('can query using the valueList aggregation', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $valueList: 'total',
    }
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {valueList: [100, 200]}},
    {key: 'tab', value: {valueList: [90, 90, 90, 90, 90, 90, 190, 190]}},
    {key: 'visa', value: {valueList: [200, 300]}}])
})

test('can query using the dataList aggregation', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $dataList: true,
    }
  })

  t.deepEqual(q.data, [{
    key: 'cash',
    value: {
      dataList: [
        {date: '2011-11-14T16:54:06Z', quantity: 1, total: 100, tip: 0, type: 'cash', productIDs: ['001', '002', '003', '004', '005']},
        {date: '2011-11-14T17:25:45Z', quantity: 2, total: 200, tip: 0, type: 'cash', productIDs: ['002']}
      ]
    }
  }, {
    key: 'tab',
    value: {
      dataList: [
        {date: '2011-11-14T16:17:54Z', quantity: 2, total: 190, tip: 100, type: 'tab', productIDs: ['001']},
        {date: '2011-11-14T16:20:19Z', quantity: 2, total: 190, tip: 100, type: 'tab', productIDs: ['001', '005']},
        {date: '2011-11-14T16:30:43Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '002']},
        {date: '2011-11-14T16:48:46Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['005']},
        {date: '2011-11-14T16:53:41Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '004', '005']},
        {date: '2011-11-14T16:58:03Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001']},
        {date: '2011-11-14T17:07:21Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['004', '005']},
        {date: '2011-11-14T17:22:59Z', quantity: 2, total: 90, tip: 0, type: 'tab', productIDs: ['001', '002', '004', '005']}
      ]
    }
  }, {
    key: 'visa',
    value: {
      dataList: [
        {date: '2011-11-14T16:28:54Z', quantity: 1, total: 300, tip: 200, type: 'visa', productIDs: ['004', '005']},
        {date: '2011-11-14T17:29:52Z', quantity: 1, total: 200, tip: 100, type: 'visa', productIDs: ['004']}
      ]}
  }])
})

// TODO: This isn't completely possible yet, reductio will need to support aliases for all aggregations first.  As of this commit, it is only available on `count`
// test('supports nested aliases', function(){
//   return universe(data).then(function(u){
//     return u.query({
//       groupBy: 'type',
//       select: {
//         my: {
//           awesome: {
//             column: {
//               $count: true
//             }
//           }
//         }
//       },
//     })
//   })
//   .then(function(res){
//     console.log(res)
//     t.deepEqual(res.data, [
//       {key: "cash", value: {count: 2}},
//       {key: "tab", value: {count: 8}},
//       {key: "visa", value: {count: 2}}
//     ])
//   })
// })

test('can dispose of a query manually', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  t.deepEqual(q.universe.columns.length, 1)
  await q.clear()

  t.deepEqual(u.columns.length, 0)
})
