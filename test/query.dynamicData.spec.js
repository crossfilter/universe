import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('can add data to an existing query', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: 'true',
      $sum: 'total'
    },
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 2, sum: 300}},
    {key: 'tab', value: {count: 8, sum: 920}},
    {key: 'visa', value: {count: 2, sum: 500}}
  ])

  await u.add([{
    date: '2012-11-14T17:29:52Z',
    quantity: 100,
    total: 50000,
    tip: 999,
    type: 'visa',
    productIDs: ['004']
  }, {
    date: '2012-11-14T17:29:52Z',
    quantity: 100,
    total: 400,
    tip: 600,
    type: 'other',
    productIDs: ['004']
  }])

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 2, sum: 300}},
    {key: 'other', value: {count: 1, sum: 400}},
    {key: 'tab', value: {count: 8, sum: 920}},
    {key: 'visa', value: {count: 3, sum: 50500}},
  ])
})

test('can add new data to dynamic filters', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: 'true',
      $sum: 'total'
    },
    filter: {
      date: {
        $eq: {
          $last: {
            $column: 'date'
          }
        }
      }
    }
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 0, sum: 0}},
    {key: 'tab', value: {count: 0, sum: 0}},
    {key: 'visa', value: {count: 1, sum: 200}}
  ])

  await u.add([{
    date: '2012-11-14T17:29:52Z',
    quantity: 100,
    total: 50000,
    tip: 999,
    type: 'visa',
    productIDs: ['004']
  }])

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 0, sum: 0}},
    {key: 'tab', value: {count: 0, sum: 0}},
    {key: 'visa', value: {count: 1, sum: 50000}},
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

  await u.add([{
    date: '2012-11-14T17:29:52Z',
    quantity: 100,
    total: 50000,
    tip: 999,
    type: 'visa',
    productIDs: ['004']
  }])

  t.deepEqual(q.data, [
    {key: 'cash', value: {valueList: [100, 200]}},
    {key: 'tab', value: {valueList: [90, 90, 90, 90, 90, 90, 190, 190]}},
    {key: 'visa', value: {valueList: [200, 300, 50000]}}
  ])
})
