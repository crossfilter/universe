import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('can clear all columns', async t => {
  const u = await universe(data)

  await u.column(['type', 'total'])
  t.is(u.columns.length, 2)

  await u.clear()

  t.deepEqual(u.columns, [])
})

test('can remove a single column', async t => {
  const u = await universe(data)

  await u.column('type')

  t.is(u.columns.length, 1)
  await u.clear('type')

  t.is(u.columns.length, 0)
})

test('can remove a single column based on multiple keys', async t => {
  const u = await universe(data)

  await u.column({
    key: ['type', 'total', 'quantity', 'tip']
  })
  t.is(u.columns.length, 1)

  await u.clear({
    key: ['type', 'total', 'quantity', 'tip']
  })
  t.is(u.columns.length, 0)
})

test('can remove multiple columns', async t => {
  const u = await universe(data)

  await u.column(['type', 'total'])
  t.is(u.columns.length, 2)

  await u.clear(['type', 'total'])
  t.is(u.columns.length, 0)
})
