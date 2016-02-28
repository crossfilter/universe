# Universe
[![Join the chat at https://gitter.im/crossfilter/universe](https://badges.gitter.im/crossfilter/universe.svg)](https://gitter.im/crossfilter/universe?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## A Crossfilter Query Interface for Everyone
Before Universe, a typical Crossfilter setup involved creating and keeping track of tons of dimensions and potentially hundreds of groups. These dimensions and groups then required intense map-reduce functions and an intimate knowledge with the inner-workings of Crossfilter to be productive.

**Universe** skips this mess and allows you to query your data using a simple **JSON query syntax** or **CFQL**, a powerful *SQL-based query language*

## Installation

**NPM**
```shell
npm install --save-dev crossfilter-universe
```

**Download** from the [releases](https://github.com/crossfilter/universe/releases) page. Serve the universe.js or universe.min.js file in the top-level directory as part of your application.

## Usage

### Create a new Universe
Pass `universe` an array of objects or a Crossfilter instance:

```javascript
var myUniverse = universe([
    {date: "2011-11-14T16:17:54Z",quantity: 2,total: 190,tip: 100,type: "tab",productIDs: ["001"]},
    {date: "2011-11-14T16:20:19Z",quantity: 2,total: 190,tip: 100,type: "tab",productIDs: ["001", "005"]},
    {date: "2011-11-14T16:28:54Z",quantity: 1,total: 300,tip: 200,type: "visa",productIDs: ["004", "005"]},
    ...
  ])

// Or

var myUniverse = universe(myCrossfilter)
```

### Query your data
Use `find` to query:

```javascript
var typeQuery = myUniverse.find({
    // GroupBy the type key
    groupBy: 'type'
    columns: {
      // Use a the built-in 'count' aggregation
      $count: 'type'
      // Create a custom 'quantity' column
      quantity: {
        // Limit 'the quantity' column to rows where quantity is greater than 50
        $filter: {
          quantity: {
            $gt: 50
          }
        },
        // Use the built-in 'sum' aggregation
        $sum: 'quantity'
      },
    },
  })
```

### Access Results

Via `promises`

```javascript
typeQuery.then(function(res) {

  // Easily access the results
  res.data === [{
    "key": "cash",
    "value": {
      "count": 2,
      "quantity": 3
    }
  }, {
    "key": "tab",
    "value": {
      "count": 8,
      "quantity": 16
    }
  }, {
    "key": "visa",
    "value": {
      "count": 2,
      "quantity": 2
    }
  }]

  // Plot the data in DC.js using the dimension and group created for the query
  dc.pieChart('#chart')
    .dimension(res.dimension)
    .group(res.group);

  // Even access the crossfilter instance
  var size = res.crossfilter.size()
})
```

### Explore your data
Using `filters`

```javascript
// Filter records where 'type' === 'visa'
myUniverse.filter({
  type: 'visa'
})

// Filter records where 'type' === 'visa' or 'tab'
myUniverse.filter({
  type: {
    $or: ['visa', 'tab']
  }
})

// Filter records where 'type' !== 'tab' or 'cash'
myUniverse.filter({
  type: {
    $ne: 'tab'
    $ne: 'cash'
  }
})

// Filter records where 'total' is between 25 and 75
myUniverse.filter({
  total: {
    "$in": [25, 75]
  }
})

// A custom filter function
myUniverse.filter({
  total: function(d){
    return d.quantity > 3
  }
})

// Clear all filters
myUniverse.filterAll()
```

**Pre-compile** dimensions with column definitions

```javascript
myUniverse.column({
  key: 'type',
  type: 'string'
})
```
