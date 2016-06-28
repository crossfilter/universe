import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('can do chained general post aggregations', async t => {
  const u = await universe(data)

  const before = await u.query({
    groupBy: 'type'
  })

  before.lock()
  t.deepEqual(before.data, [
    {key: 'cash', value: {count: 2}},
    {key: 'tab', value: {count: 8}},
    {key: 'visa', value: {count: 2}}
  ])

  const after = await before.post(q => {
    q.data[0].value.count += 10
    q.data[2].key += '_test'
  })

  after.lock()
  t.deepEqual(after.data, [
    {key: 'cash', value: {count: 12}},
    {key: 'tab', value: {count: 8}},
    {key: 'visa_test', value: {count: 2}}
  ])

  const after2 = await after.post(q => {
    q.data[0].value.count += 10
    q.data[2].key += '_test'
  })
  after2.lock()

  await u.filter('total', '100')

  t.deepEqual(before.data, [
    {key: 'cash', value: {count: 1}},
    {key: 'tab', value: {count: 0}},
    {key: 'visa', value: {count: 0}}
  ])
  t.deepEqual(after.data, [
    {key: 'cash', value: {count: 11}},
    {key: 'tab', value: {count: 0}},
    {key: 'visa_test', value: {count: 0}}
  ])
  t.deepEqual(after2.data, [
    {key: 'cash', value: {count: 21}},
    {key: 'tab', value: {count: 0}},
    {key: 'visa_test_test', value: {count: 0}}
  ])
})

test('works after filtering', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'total',
  })

  const res = await q.changeMap({
    count: true
  })

  t.deepEqual(res.data[0].value.countChangeFromEnd, 5)
  await u.filter('type', 'cash')

  t.deepEqual(res.data[0].value.countChangeFromEnd, 0)
})

test('can sortByKey ascending and descending', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type'
  })

  const res = await q.sortByKey(true)
  t.deepEqual(res.data[0].key, 'visa')

  await res.sortByKey()
  t.deepEqual(res.data[0].key, 'cash')

  await res.sortByKey(true)
  await u.filter('total', 100)

  t.deepEqual(res.data[0].key, 'visa')
})

test('can limit', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'total',
  })

  const res = await q.limit(2, null)

  t.deepEqual(res.data[0].key, 190)
})

test('can squash', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'total',
    select: {
      $sum: 'total'
    }
  })

  const res = await q.squash(2, 4, {
    sum: '$sum'
  }, 'SQUASHED!!!')

  t.deepEqual(res.data[2].key, 'SQUASHED!!!')
  t.deepEqual(res.data[2].value.sum, 780)
})

test('can find change based on index for multiple values', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'total',
    select: {
      $count: true,
      $sum: 'total',
    }
  })

  const res = await q.change(2, 4, {
    count: true,
    sum: true
  })

  t.deepEqual(res.data, {
    key: [190, 300],
    value: {
      countChange: -1,
      sumChange: -80,
    }
  })
})

test('can create a changeMap', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'total',
    select: {
      $count: true,
      $sum: 'total',
    }
  })

  const res = await q.changeMap({
    count: true,
    sum: true,
  })

  t.deepEqual(res.data, [
    {key: 90,
      value: {
        count: 6,
        sum: 540,
        countChange: 0,
        countChangeFromStart: 0,
        countChangeFromEnd: 5,
        sumChange: 0,
        sumChangeFromStart: 0,
        sumChangeFromEnd: 240
      }
    },
    {key: 100,
      value: {
        count: 1,
        sum: 100,
        countChange: -5,
        countChangeFromStart: -5,
        countChangeFromEnd: 0,
        sumChange: -440,
        sumChangeFromStart: -440,
        sumChangeFromEnd: -200
      }
    },
    {key: 190,
      value: {
        count: 2,
        sum: 380,
        countChange: 1,
        countChangeFromStart: -4,
        countChangeFromEnd: 1,
        sumChange: 280,
        sumChangeFromStart: -160,
        sumChangeFromEnd: 80
      }
    },
    {key: 200,
      value: {
        count: 2,
        sum: 400,
        countChange: 0,
        countChangeFromStart: -4,
        countChangeFromEnd: 1,
        sumChange: 20,
        sumChangeFromStart: -140,
        sumChangeFromEnd: 100
      }
    },
    {key: 300,
      value: {
        count: 1,
        sum: 300,
        countChange: -1,
        countChangeFromStart: -5,
        countChangeFromEnd: 0,
        sumChange: -100,
        sumChangeFromStart: -240,
        sumChangeFromEnd: 0
      }
    }
  ])
})
