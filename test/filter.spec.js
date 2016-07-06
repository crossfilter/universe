import test from 'ava'

import universe from '../src/universe'
import data from './fixtures/data'

test('has the filter method', async t => {
  const u = await universe(data)
  t.is(typeof u.filter, 'function')
})

test('can filter', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: 'true',
      $sum: 'total'
    },
    filter: {
      $or: [{
        total: {
          $gt: 50
        }
      }, {
        quantity: {
          $gt: 1
        }
      }]
    }
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 2, sum: 300}},
    {key: 'tab', value: {count: 8, sum: 920}},
    {key: 'visa', value: {count: 2, sum: 500}}
  ])
})

test('can not filter on a non-existent column', async t => {
  const u = await universe(data)

  await u.query({
    groupBy: 'total',
    select: {
      $max: 'total'
    }
  })

  try {
    await u.filter('someOtherColumn', {
      $gt: 95
    })
  } catch (err) {
    t.is(String(err), 'Error: Column key does not exist in data!')
  }
})

test('can filter based on a single column that is not defined yet, then recycle that column', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $max: 'total'
    }
  })

  await u.filter('total', {
    $gt: 95
  })

  t.deepEqual(q.data, [
    {key: 0, value: {max: 200, valueList: [100, 200]}},
    {key: 100, value: {max: 200, valueList: [190, 190, 200]}},
    {key: 200, value: {max: 300, valueList: [300]}}
  ])

  await u.filter('total')
  t.is(u.columns.length, 1)
})

test('can filter based using filterFunction', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $max: 'total'
    }
  })

  await u.filter('total', d => d > 95)

  t.deepEqual(q.data, [
    {key: 0, value: {max: 200, valueList: [100, 200]}},
    {key: 100, value: {max: 200, valueList: [190, 190, 200]}},
    {key: 200, value: {max: 300, valueList: [300]}}
  ])
})

test('can filter based using filterFunction, together with exact', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $max: 'total'
    }
  })

  await u.filter('type', 'visa', true, true)
  t.is(typeof u.filters.type.value, 'string')

  await u.filter('total', d => d > 95)
  t.is(typeof u.filters.total.value, 'function')
  t.is(typeof u.filters.type.value, 'string')

  // t.deepEqual(q.data[0], {key: 0, value: {max: null, valueList: []}})
  t.deepEqual(q.data[1], {key: 100, value: {max: 200, valueList: [200]}})
  t.deepEqual(q.data[2], {key: 200, value: {max: 300, valueList: [300]}})
})

// see https://github.com/crossfilter/universe/issues/20
test('can filter based using filterFunction, works in reverse', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $max: 'total'
    }
  })

  await u.filter('total', d => d > 95)
  t.is(typeof u.filters.total.value, 'function')

  await u.filter('type', 'visa', true, true)
  t.is(typeof u.filters.total.value, 'function')
  t.is(typeof u.filters.type.value, 'string')

  // t.deepEqual(q.data[0], {key: 0, value: {max: null, valueList: []}})
  t.deepEqual(q.data[1], {key: 100, value: {max: 200, valueList: [200]}})
  t.deepEqual(q.data[2], {key: 200, value: {max: 300, valueList: [300]}})
})

test('can filter based on a complex column regardless of key order', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: ['tip', 'total'],
    select: {
      $max: 'total'
    }
  })

  await u.filter(['total', 'tip'], {
    $gt: 95
  })

  t.deepEqual(q.data, [
    {key: [0, 100], value: {valueList: [100], max: 100}},
    {key: [0, 200], value: {valueList: [200], max: 200}},
    {key: [0, 90], value: {valueList: [90, 90, 90, 90, 90, 90], max: 90}},
    {key: [100, 190], value: {valueList: [190, 190], max: 190}},
    {key: [100, 200], value: {valueList: [200], max: 200}},
    {key: [200, 300], value: {valueList: [300], max: 300}}
  ])
})

test('can filter using $column data', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    filter: {
      type: {
        $last: {
          $column: 'type'
        }
      }
    }
  })

  t.deepEqual(q.data, [
    {key: 0, value: {count: 8}},
    {key: 100, value: {count: 3}},
    {key: 200, value: {count: 1}}
  ])
})

test('can filter using all $data', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: 'true',
    },
    filter: {
      date: {
        $gt: {
          '$get(date)': {
            '$nthPct(50)': '$data'
          }
        }
      }
    }
  })

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 1}},
    {key: 'tab', value: {count: 3}},
    {key: 'visa', value: {count: 1}}
  ])
})

test('can not remove colum that is used in dynamic filter', async t => {
  const u = await universe(data)

  await u.query({
    groupBy: 'type',
    select: {
      $count: 'true',
    },
    filter: {
      date: {
        $gt: {
          '$get(date)': {
            '$nth(2)': {
              $column: 'date'
            }
          }
        }
      }
    }
  })

  await u.clear('date')
  t.is(u.columns.length, 2)
})

test('can toggle filters using simple values', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.filter('type', 'cash')
  t.is(u.filters.type.value, 'cash')
  t.deepEqual(q.data, [
    {key: 0, value: {count: 2}},
    {key: 100, value: {count: 0}},
    {key: 200, value: {count: 0}}
  ])

  await u.filter('type', 'visa')
  t.deepEqual(u.filters.type.value, ['visa', 'cash'])
  t.deepEqual(q.data, [
    {key: 0, value: {count: 2}},
    {key: 100, value: {count: 1}},
    {key: 200, value: {count: 1}}
  ])

  await u.filter('type', 'tab')
  t.deepEqual(u.filters.type.value, ['tab', 'visa', 'cash'])
  t.deepEqual(q.data, [
    {key: 0, value: {count: 8}},
    {key: 100, value: {count: 3}},
    {key: 200, value: {count: 1}}
  ])

  await u.filter('type', 'visa')
  t.deepEqual(u.filters.type.value, ['tab', 'cash'])
  t.deepEqual(q.data, [
    {key: 0, value: {count: 8}},
    {key: 100, value: {count: 2}},
    {key: 200, value: {count: 0}}
  ])
})

// see https://github.com/crossfilter/universe/issues/20
test('can toggle multiple filters using simple values', async t => {
  const u = await universe(data)

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.filter('type', 'cash')
  t.is(u.filters.type.value, 'cash')

  await u.filter('type', 'visa')
  t.deepEqual(u.filters.type.value, ['visa', 'cash'])

  await u.filter('quantity', 2)
  t.deepEqual(u.filters.quantity.value, 2)
  t.deepEqual(u.filters.type.value, ['visa', 'cash'])
})

test('can toggle filters using an array as a range', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  await u.filter('total', [85, 101], true)
  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 1}},
    {key: 'tab', value: {count: 6}},
    {key: 'visa', value: {count: 0}}
  ])

  await u.filter('total', [85, 91], true)
  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 0}},
    {key: 'tab', value: {count: 6}},
    {key: 'visa', value: {count: 0}}
  ])
})

test('can toggle filters using an array as an include', async t => {
  const u = await universe(data)

  const q = await u.query({
    groupBy: 'type',
    select: {
      $count: true
    }
  })

  await u.filter('total', [90, 100])

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 1}},
    {key: 'tab', value: {count: 6}},
    {key: 'visa', value: {count: 0}}
  ])

  await u.filter('total', [90, 300, 200])

  t.deepEqual(q.data, [
    {key: 'cash', value: {count: 2}},
    {key: 'tab', value: {count: 0}},
    {key: 'visa', value: {count: 2}}
  ])
})

test('can forcefully replace filters', async t => {
  const u = await universe(data)

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.filter('type', 'cash')
  t.is(u.filters.type.value, 'cash')

  await u.filter('type', ['tab', 'visa'], false, true)
  t.deepEqual(u.filters.type.value, ['tab', 'visa'])
})

test('can apply many filters in one go', async t => {
  const u = await universe(data)

  await u.query({
    groupBy: 'tip',
    select: {
      $count: true
    }
  })

  await u.filter('type', 'cash')
  t.is(u.filters.type.value, 'cash')

  await u.filterAll([{
    column: 'type',
    value: 'visa',
  }, {
    column: 'quantity',
    value: [200, 500],
    isRange: true,
  }])

  t.deepEqual(u.filters, {
    type: {
      value: ['visa', 'cash'],
      replace: undefined,
      type: 'inclusive'
    },
    quantity: {
      value: [200, 500],
      replace: true,
      type: 'range'
    }
  }
)})
