import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('can destroy the universe a few times over', async () => {
  const u = await universe(data)

  await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'total',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.destroy()

  await u.add(data)

  await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'total',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.destroy()

  await u.add(data)

  await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'total',
    select: {
      $count: true
    }
  })

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.destroy()
})
