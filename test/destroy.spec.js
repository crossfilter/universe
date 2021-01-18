import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data.json'

test('can destroy the universe a few times over', async (assert) => {
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

  // Note(cg): tests were failing with ava 4.2: "Test finished without running any assertion"
  // https://stackoverflow.com/questions/51230995/test-finished-without-running-any-assertion-ava-nodejs.
  assert.true(u!== undefined);
})
