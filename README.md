# Universe
[![Join the chat at https://gitter.im/crossfilter/universe](https://badges.gitter.im/crossfilter/universe.svg)](https://gitter.im/crossfilter/universe?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Build Status](https://travis-ci.org/crossfilter/universe.svg?branch=master)](https://travis-ci.org/crossfilter/universe) [![Code Climate](https://codeclimate.com/github/crossfilter/universe/badges/gpa.svg)](https://codeclimate.com/github/crossfilter/universe)

## The easiest and fastest way to explore your data
Before Universe, exploring and filtering large datasets in javascript meant constant data looping, complicated indexing, and countless lines of code to dissect your data.

With Universe, you can be there in just a few lines of code. You've got better things to do than write intense map-reduce functions or learn the intricate inner-workings of [Crossfilter](https://github.com/crossfilter/crossfilter) ;)

## Features
- Simple, yet powerful query syntax
- Built on, and tightly integrated with  [Crossfilter](https://github.com/crossfilter/crossfilter), and [Reductio](https://github.com/crossfilter/reductio) - the fastest multi-dimensional JS data frameworks available
- Real-time updates to query results as you filter
- Flexible filtering system
- Automatic and invisible management of data indexing and memory

## Demos

- [Basic Usage](http://codepen.io/tannerlinsley/pen/oxjyvg?editors=0010) (Codepen)

## [API](#api)

- [universe()](#api-universe)
  - [.query()](#api-query)
  - [.filter()](#api-filter)
  - [.column()](#api-column)
  - [.clear()](#api-clear)
  - [.add()](#api-add)
  - [.remove()](#api-remove)


- [Pro Tips](#pro-tips)

## Getting Started
### Installation
**NPM**

```shell
npm install universe --save
```

**Download** from the [releases](https://github.com/crossfilter/universe/releases) page. Serve the universe.js or universe.min.js file in the top-level directory as part of your application.

### Create a new Universe
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
```

### Clean Up

```javascript

// Remove a column index
.then(function(myUniverse){
  return myUniverse.clear('total')
})

// Remove all columns
.then(function(myUniverse){
  return myUniverse.clear()
})

```

<h2 id="api">API <a href="#api">#</a></h2>

<h3 id="api-universe">universe( [data] , {config} ) <a href="#api-universe">#</a></h3>

- Description
  - Creates a new universe instance
- Parameters
  - `[data]` - An array of objects
  - `{config}` - Optional configurations for this Universe instance
    - `{generatedColumns}` - An object of keys and their respective accessor functions used to dynamically generate columns.
- Returns a `promise` that is resolved with the **universe instance**

- [Example](Create a new Universe)
  - Generated Columns Example
    ```javascript
    universe([
      {day: '1', price: 30, quantity: 3},
      {day: '2', price: 40, quantity: 5}
    ], {
      generatedColumns: {
        total: function(row){return row.price * row.quantity}
      }
    })
      .then(function(myUniverse){
        // data[0].total === 90
        // data[1].total === 200
      })
    ```

<h3 id="api-query">.query( {queryObject} ) <a href="#api-query">#</a></h3>

- Description
  - Creates a new query from a universe instance
- Parameters
  - `queryObject`:
    - `groupBy` - Exactly what it sounds like.  It groups the records by this column key
    - `select` - An object of column aggregations and/or column names
      - `$aggregation` - Aggregations are prefixed with a `$`
      - `columnName` - Creates a nested column with the name provided
    - `filter` - A filter object that is applied to the query (similar to a `where` clause in mySQL)
- Returns
  - `promise`, resolved with a **query results object**
    - `data` - The result of the query
    - `group` - The crossfilter/reductio group used to build the query
    - `dimension` - The crossfilter dimension used to build the query
    - `crossfilter` - The crossfilter that runs this universe
    - `universe` - The current instance of the universe.  Return this to keep chaining via promises

- [Example](#Explore your data)

<h3 id="api-filter">.filter( columnKey, filterObject, isArray, replace ) <a href="#api-filter">#</a></h3>

- Description
  - Filters everything in the universe to only include rows that match certain conditions.  Queries automatically and instantaneously update their values and aggregations.
- Parameters
  - `columnKey` - The object property to filter on,
- Returns
  - `promise` resolved with
    - **universe instance**

- [Example](#Query your data)

<h3 id="api-column">.column( columnKey/columnObject ) <a href="#api-column">#</a></h3>

- Description
  - Use to optionally pre-index a column. Accepts a string or number corresponding to the key or index of the column you would like to define.
- Parameters
  - `columnKey` - the column property or array index you would like to pre-compile eg.
  ```javascript
    .column('total')
  ```
  - `columnObject` allows you to override the column type, otherwise it is calculated automatically:
  ```javascript
      .column({
        key: 'total',
        type: 'number'
      })
    ```
- Returns
  - `promise` resolved with
    - **universe instance**

- [Example](#Pre-compile Columns)

<h3 id="api-clear">.clear( columnKey/columnObject/[columnKeys/columnObjects] ) <a href="#api-clear">#</a></h3>

- Description
  - Clears individual or all column defenitions and indexes
- Parameters
  - `columnKey` - the column property or array of columns you would like to clear eg.
  ```javascript
    // Single Key
    .clear('total')
    // Complex Key
    .clear({key: ['complex', 'key']})
    // Multiple Single Keys
    .clear(['total', 'quantity'])
    // Multiple Complex Keys
    .clear([{key: ['complex', 'key']}, {key: ['another', 'one']}])
  ```
- Returns
  - `promise` resolved with
    - **universe instance**

- [Example](#Clean Up)

<h3 id="api-add">.add( [data] ) <a href="#api-add">#</a></h3>

- Description
  - Adds additional data to a universe instance. This data will be indexed, aggregated and queries/filters immediately updated when added.
- Parameters
  - `[data]` - An new array of objects similar to the original dataset
- Returns
  - `promise` resolved with
    - **universe instance**


<h2 id="pro-tips">Pro Tips <a href="#pro-tips">#</a></h2>

#### No Arrays Necessary
Don’t want to use arrays in your aggregations? No problem, because this:

```javascript
u.query({
        select: {
          $sum: {
            $sum: [
              {$max: ['tip', 'total’]},
              {$min: ['quantity', 'total’]}
            ]
          },
        }
      })
```
… is now easier written like this:

```javascript
u.query({
        select: {
          $sum: {
            $sum: {
              $max: ['tip', 'total'],
              $min: ['quantity', 'total']
            }
          },
        }
      })
```

#### No Objects Necessary, either!
What’s that? Don’t like the verbosity of objects or arrays? Use the new string syntax!

```javascript
universe.query({
        select: {
          $sum: '$sum($max(tip,total), $min(quantity,total))'
        }
      })
```

#### Pre-compile Columns

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
