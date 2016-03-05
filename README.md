# Universe
[![Join the chat at https://gitter.im/crossfilter/universe](https://badges.gitter.im/crossfilter/universe.svg)](https://gitter.im/crossfilter/universe?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/crossfilter/universe.svg?branch=master)](https://travis-ci.org/crossfilter/universe) [![Code Climate](https://codeclimate.com/github/crossfilter/universe/badges/gpa.svg)](https://codeclimate.com/github/crossfilter/universe)

## The easiest and fastest way to explore your data
Before Universe, exploring and filtering large datasets in javascript meant constant data looping, complicated indxing, and countless lines of code to dissect your data.

With Universe, you can be there in just a few lines of code. You've got better things to do than write intense map-reduce functions or learn the intricate inner-workings of [Crossfilter](https://github.com/crossfilter/crossfilter) ;)

## Features
- Simple, yet powerful query syntax
- Built on, and tightly integrated with  [Crossfilter](https://github.com/crossfilter/crossfilter), and [Reductio](https://github.com/crossfilter/reductio) - the fastest multi-dimensional JS data frameworks available
- Real-time updates to query results as you filter
- Flexible filtering system
- Automatic and invisible management of data indexing and memory

## Demos

- [Basic Usage](http://codepen.io/tannerlinsley/pen/oxjyvg?editors=0010)

## Installation
**NPM**

```shell
npm install crossfilter/universe --save

# the "universe" npm module name is still under negotiation. Stay tuned.
```

**Download** from the [releases](https://github.com/crossfilter/universe/releases) page. Serve the universe.js or universe.min.js file in the top-level directory as part of your application.

## Usage
### Create a new Universe with your dataset
Pass `universe` an array of objects or a Crossfilter instance:

```javascript

var universe = require('universe')

var myUniverse = universe([
    {date: "2011-11-14T16:17:54Z", quantity: 2, total: 190, tip: 100, type: "tab", productIDs: ["001"]},
    {date: "2011-11-14T16:20:19Z", quantity: 2, total: 190, tip: 100, type: "tab", productIDs: ["001",  "005"]},
    {date: "2011-11-14T16:28:54Z", quantity: 1, total: 300, tip: 200, type: "visa", productIDs: ["004", "005"]},
    ...
  ])
  .then(function(myUniverse){
    // And now you're ready to query! :)
    return myUniverse
  })
```

### Query your data

```javascript

.then(function(myUniverse){
  myUniverse.query({
    groupBy: 'type' // GroupBy the type key
    columns: {
      $count: true, // Count the number of records
      quantity: { // Create a custom 'quantity' column
        $sum: 'quantity' // Sum the quantity column
      },
    },
    // Limit selection to rows where quantity is greater than 50
    filter: {
      quantity: {
        $gt: 50
      }
    },
  })
})
```

### Use your data

```javascript
.then(function(res) {
  // Use your data for tables, charts, data visualiztion, etc.
  res.data === [
    {"key": "cash","value": {"count": 2,"quantity": {"sum": 3}}},
    {"key": "tab","value": {"count": 8,"quantity": {"sum": 16}}},
    {"key": "visa","value": {"count": 2,"quantity": {"sum": 2}}}
  ]

  // Or plost the data in DC.js using the underlying crossfilter dimension and group
  dc.pieChart('#chart')
    .dimension(res.dimension)
    .group(res.group)

  // Pass the query's universe instance to keep chaining
  return res.universe
})
```

### Explore your data

As you filter your data on the universe level, every query's result is updated in real-time to reflect changes in aggregation

```javascript
// Filter records where 'type' === 'visa'
.then(function(myUniverse) {
  return myUniverse.filter('type', 'visa')
})

// Filter records where 'type' === 'visa' or 'tab'
.then(function(myUniverse) {
  return myUniverse.filter('type', ['visa', 'tab'])
})

// Filter records where 'total' is between 50 and 100
.then(function(myUniverse) {
  return myUniverse.filter('total', [50, 10], true)
})

// Filter records using an expressive and JSON friendly query syntax
.then(function(myUniverse) {
  return myUniverse.filter('total', {
    $lt: { // Filter to results where total is less than
      '$get(total)': { // the "total" property from
        '$nthLast(3)': { // the 3rd to the last row from
          $column: 'date' // the dataset sorted by the date column
        }
      }
    }
  })
})

// Or if you're feeling powerful, just write your own custom filter function
.then(function(myUniverse){
  return myUniverse.filter({
    total: function(row){
      return (row.quantity * row.sum) > 50
    }
  })
})

// Clear the filters for the 'type' column
.then(function(myUniverse){
  return myUniverse.filter('type')
})

// Clear all of the filters
.then(function(myUniverse){
  return myUniverse.filterAll()
})

// Remove a column index
.then(function(myUniverse){
  return myUniverse.clear('total')
})

// Remove all columns
.then(function(myUniverse){
  return myUniverse.clear()
})

```

Pro-Tip: You can also **pre-compile** column indices before querying. Otherwise, ad-hoc indices are created and managed automagically for you anyway.

```javascript
.then(function(myUniverse){
  return myUniverse.column('a')
  return myUniverse.column(['a', 'b', 'c'])
  return myUniverse.column({
    key: 'd',
    type: 'string' // override automatic type detection
  })
})
```
