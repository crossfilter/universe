import test from 'ava'

import crossfilter from 'crossfilter2'

import universe from '../src/universe'
import data from './fixtures/data'

test('is a function', async t => {
  t.is(typeof universe, 'function')
})

test('requires a crossfilter instance', t => {
  return universe()
    .then(res => {
      return t.is(typeof res, 'object')
    })
    .catch(err => {
      return t.is(typeof err, 'object')
    })
})

test('can accept a crossfilter instance', () => {
  return universe(crossfilter(data))
})

test('can accept an array of data points', () => {
  return universe(data)
})

test('can create generated columns using an accessor function', async t => {
  const u = await universe(data, {
    generatedColumns: {
      totalAndTip: d => d.total + d.tip
    }
  })

  const res = await u.query({
    groupBy: 'totalAndTip'
  })

  t.deepEqual(res.data, [
    {key: 90, value: {count: 6}},
    {key: 100, value: {count: 1}},
    {key: 200, value: {count: 1}},
    {key: 290, value: {count: 2}},
    {key: 300, value: {count: 1}},
    {key: 500, value: {count: 1}}
  ])
})
