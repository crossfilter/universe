import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('has the filterAll method', async t => {
  const u = await universe(data)
  t.is(typeof u.filterAll, 'function')
})

test('can filterAll', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  t.deepEqual(q.data, [
    {key: 0, value: {count: 8}},
    {key: 100, value: {count: 3}},
    {key: 200, value: {count: 1}}
  ])

  await u.filter('type', 'cash')

  t.deepEqual(q.data, [
    {key: 0, value: {count: 2}},
    {key: 100, value: {count: 0}},
    {key: 200, value: {count: 0}}
  ])

  t.is(u.filters.type.value, 'cash')

  await u.filterAll()

  t.deepEqual(u.filters, {})

  t.deepEqual(q.data, [
    {key: 0, value: {count: 8}},
    {key: 100, value: {count: 3}},
    {key: 200, value: {count: 1}}
  ])
})
