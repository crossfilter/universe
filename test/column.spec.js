import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('has the columns properties', async t => {
  const u = await universe(data)
  t.deepEqual(u.columns, [])
})

test('has the column method', async t => {
  const u = await universe(data)
  t.is(typeof u.column, 'function')
})

test('can add a column without a default type of string', async t => {
  const u = await universe(data)
  const res = await u.column('type')
  t.is(res.columns[0].key, 'type')
  t.is(res.columns[0].type, 'string')
  t.is(typeof res.columns[0].dimension, 'object')
})

test('can add a column with a specified type', async t => {
  const u = await universe(data)
  const res = await u.column({
    key: 'productIDs',
    array: true
  })

  t.is(res.columns[0].key, 'productIDs')
  t.is(res.columns[0].type, 'array')
  t.is(typeof res.columns[0].dimension, 'object')
})

test('can add a column with a complex key', async t => {
  const u = await universe(data)

  const res = await u.column({
    key: ['type', 'total', 'quantity', 'tip']
  })

  t.deepEqual(res.columns[0].key, ['type', 'total', 'quantity', 'tip'])
  t.is(res.columns[0].type, 'complex')
  t.is(typeof res.columns[0].dimension, 'object')
})

test('can add a column with nested string format', async t => {
  const u = await universe(data)

  const keyString = `productIDs[0]`

  const res = await u.column(keyString)

  t.deepEqual(res.columns[0].key, keyString)
  t.is(res.columns[0].type, 'complex')
  t.is(typeof res.columns[0].dimension, 'object')
})

test('can add a column with a callback function', async t => {
  const u = await universe(data)

  const keyFn = d => {
    return `${d.type} - ${d.total}`
  }

  const res = await u.column(keyFn)

  t.deepEqual(res.columns[0].key, keyFn)
  t.is(res.columns[0].type, 'complex')
  t.is(typeof res.columns[0].dimension, 'object')
})

test('can try to create the same column multiple times, but still only create one', async t => {
  const u = await universe(data)

  await Promise.all([
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    }),
    u.column({
      key: ['type', 'total']
    })
  ])

  t.is(u.columns.length, 1)
})
