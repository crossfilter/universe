// https://github.com/crossfilter/universe v0.8.1 Copyright 2019 Tanner Linsley
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('crossfilter2'), require('reductio')) :
  typeof define === 'function' && define.amd ? define(['crossfilter2', 'reductio'], factory) :
  (global = global || self, global.universe = factory(global.crossfilter, global.reductio));
}(this, function (crossfilter, reductio) { 'use strict';

  crossfilter = crossfilter && crossfilter.hasOwnProperty('default') ? crossfilter['default'] : crossfilter;
  reductio = reductio && reductio.hasOwnProperty('default') ? reductio['default'] : reductio;

  var _ = {
    find: find,
    remove: remove,
    isArray: isArray,
    isObject: isObject,
    isBoolean: isBoolean,
    isString: isString,
    isNumber: isNumber,
    isFunction: isFunction,
    get: get,
    set: set,
    map: map,
    keys: keys,
    sortBy: sortBy,
    forEach: forEach,
    isUndefined: isUndefined,
    pick: pick,
    xor: xor,
    clone: clone,
    isEqual: isEqual,
    replaceArray: replaceArray,
    uniq: uniq,
    flatten: flatten,
    sort: sort,
    values: values,
    recurseObject: recurseObject,
  };

  function find(a, b) {
    return a.find(b)
  }

  function remove(a, b) {
    return a.filter(function (o, i) {
      var r = b(o);
      if (r) {
        a.splice(i, 1);
        return true
      }
      return false
    })
  }

  function isArray(a) {
    return Array.isArray(a)
  }

  function isObject(d) {
    return typeof d === 'object' && !isArray(d)
  }

  function isBoolean(d) {
    return typeof d === 'boolean'
  }

  function isString(d) {
    return typeof d === 'string'
  }

  function isNumber(d) {
    return typeof d === 'number'
  }

  function isFunction(a) {
    return typeof a === 'function'
  }

  function get(a, b) {
    if (isArray(b)) {
      b = b.join('.');
    }
    return b
      .replace('[', '.').replace(']', '')
      .split('.')
      .reduce(
        function (obj, property) {
          return obj[property]
        }, a
      )
  }

  function set(obj, prop, value) {
    if (typeof prop === 'string') {
      prop = prop
        .replace('[', '.').replace(']', '')
        .split('.');
    }
    if (prop.length > 1) {
      var e = prop.shift();
      Object.assign(obj[e] =
        Object.prototype.toString.call(obj[e]) === '[object Object]' ? obj[e] : {},
      prop,
      value);
    } else {
      obj[prop[0]] = value;
    }
  }

  function map(a, b) {
    var m;
    var key;
    if (isFunction(b)) {
      if (isObject(a)) {
        m = [];
        for (key in a) {
          if (a.hasOwnProperty(key)) {
            m.push(b(a[key], key, a));
          }
        }
        return m
      }
      return a.map(b)
    }
    if (isObject(a)) {
      m = [];
      for (key in a) {
        if (a.hasOwnProperty(key)) {
          m.push(a[key]);
        }
      }
      return m
    }
    return a.map(function (aa) {
      return aa[b]
    })
  }

  function keys(obj) {
    return Object.keys(obj)
  }

  function sortBy(a, b) {
    if (isFunction(b)) {
      return a.sort(function (aa, bb) {
        if (b(aa) > b(bb)) {
          return 1
        }
        if (b(aa) < b(bb)) {
          return -1
        }
        // a must be equal to b
        return 0
      })
    }
  }

  function forEach(a, b) {
    if (isObject(a)) {
      for (var key in a) {
        if (a.hasOwnProperty(key)) {
          b(a[key], key, a);
        }
      }
      return
    }
    if (isArray(a)) {
      return a.forEach(b)
    }
  }

  function isUndefined(a) {
    return typeof a === 'undefined'
  }

  function pick(a, b) {
    var c = {};
    forEach(b, function (bb) {
      if (typeof a[bb] !== 'undefined') {
        c[bb] = a[bb];
      }
    });
    return c
  }

  function xor(a, b) {
    var unique = [];
    forEach(a, function (aa) {
      if (b.indexOf(aa) === -1) {
        return unique.push(aa)
      }
    });
    forEach(b, function (bb) {
      if (a.indexOf(bb) === -1) {
        return unique.push(bb)
      }
    });
    return unique
  }

  function clone(a) {
    return JSON.parse(JSON.stringify(a, function replacer(key, value) {
      if (typeof value === 'function') {
        return value.toString()
      }
      return value
    }))
  }

  function isEqual(x, y) {
    if ((typeof x === 'object' && x !== null) && (typeof y === 'object' && y !== null)) {
      if (Object.keys(x).length !== Object.keys(y).length) {
        return false
      }

      for (var prop in x) {
        if (y.hasOwnProperty(prop)) {
          if (!isEqual(x[prop], y[prop])) {
            return false
          }
        }
        return false
      }

      return true
    } else if (x !== y) {
      return false
    }
    return true
  }

  function replaceArray(a, b) {
    var al = a.length;
    var bl = b.length;
    if (al > bl) {
      a.splice(bl, al - bl);
    } else if (al < bl) {
      a.push.apply(a, new Array(bl - al));
    }
    forEach(a, function (val, key) {
      a[key] = b[key];
    });
    return a
  }

  function uniq(a) {
    var seen = new Set();
    return a.filter(function (item) {
      var allow = false;
      if (!seen.has(item)) {
        seen.add(item);
        allow = true;
      }
      return allow
    })
  }

  function flatten(aa) {
    var flattened = [];
    for (var i = 0; i < aa.length; ++i) {
      var current = aa[i];
      for (var j = 0; j < current.length; ++j) {
        flattened.push(current[j]);
      }
    }
    return flattened
  }

  function sort(arr) {
    for (var i = 1; i < arr.length; i++) {
      var tmp = arr[i];
      var j = i;
      while (arr[j - 1] > tmp) {
        arr[j] = arr[j - 1];
        --j;
      }
      arr[j] = tmp;
    }

    return arr
  }

  function values(a) {
    var values = [];
    for (var key in a) {
      if (a.hasOwnProperty(key)) {
        values.push(a[key]);
      }
    }
    return values
  }

  function recurseObject(obj, cb) {
    _recurseObject(obj, []);
    return obj
    function _recurseObject(obj, path) {
      for (var k in obj) { //  eslint-disable-line guard-for-in
        var newPath = clone(path);
        newPath.push(k);
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          _recurseObject(obj[k], newPath);
        } else {
          if (!obj.hasOwnProperty(k)) {
            continue
          }
          cb(obj[k], k, newPath);
        }
      }
    }
  }

  var expressions = {
    // Getters
    $field: $field,
    // Booleans
    $and: $and,
    $or: $or,
    $not: $not,

    // Expressions
    $eq: $eq,
    $gt: $gt,
    $gte: $gte,
    $lt: $lt,
    $lte: $lte,
    $ne: $ne,
    $type: $type,

    // Array Expressions
    $in: $in,
    $nin: $nin,
    $contains: $contains,
    $excludes: $excludes,
    $size: $size,
  };

  // Getters
  function $field(d, child) {
    return d[child]
  }

  // Operators

  function $and(d, child) {
    child = child(d);
    for (var i = 0; i < child.length; i++) {
      if (!child[i]) {
        return false
      }
    }
    return true
  }

  function $or(d, child) {
    child = child(d);
    for (var i = 0; i < child.length; i++) {
      if (child[i]) {
        return true
      }
    }
    return false
  }

  function $not(d, child) {
    child = child(d);
    for (var i = 0; i < child.length; i++) {
      if (child[i]) {
        return false
      }
    }
    return true
  }

  // Expressions

  function $eq(d, child) {
    return d === child()
  }

  function $gt(d, child) {
    return d > child()
  }

  function $gte(d, child) {
    return d >= child()
  }

  function $lt(d, child) {
    return d < child()
  }

  function $lte(d, child) {
    return d <= child()
  }

  function $ne(d, child) {
    return d !== child()
  }

  function $type(d, child) {
    return typeof d === child()
  }

  // Array Expressions

  function $in(d, child) {
    return d.indexOf(child()) > -1
  }

  function $nin(d, child) {
    return d.indexOf(child()) === -1
  }

  function $contains(d, child) {
    return child().indexOf(d) > -1
  }

  function $excludes(d, child) {
    return child().indexOf(d) === -1
  }

  function $size(d, child) {
    return d.length === child()
  }

  var aggregators = {
    // Collections
    $sum: $sum,
    $avg: $avg,
    $max: $max,
    $min: $min,

    // Pickers
    $count: $count,
    $first: $first,
    $last: $last,
    $get: $get,
    $nth: $get, // nth is same as using a get
    $nthLast: $nthLast,
    $nthPct: $nthPct,
    $map: $map,
  };

  var aggregation = {
    makeValueAccessor: makeValueAccessor,
    aggregators: aggregators,
    extractKeyValOrArray: extractKeyValOrArray,
    parseAggregatorParams: parseAggregatorParams,
  };

  // This is used to build aggregation stacks for sub-reductio
  // aggregations, or plucking values for use in filters from the data
  function makeValueAccessor(obj) {
    if (typeof obj === 'string') {
      if (isStringSyntax(obj)) {
        obj = convertAggregatorString(obj);
      } else {
        // Must be a column key. Return an identity accessor
        return obj
      }
    }
    // Must be a column index. Return an identity accessor
    if (typeof obj === 'number') {
      return obj
    }
    // If it's an object, we need to build a custom value accessor function
    if (_.isObject(obj)) {
      return make()
    }

    function make() {
      var stack = makeSubAggregationFunction(obj);
      return function topStack(d) {
        return stack(d)
      }
    }
  }

  // A recursive function that walks the aggregation stack and returns
  // a function. The returned function, when called, will recursively invoke
  // with the properties from the previous stack in reverse order
  function makeSubAggregationFunction(obj) {
    // If its an object, either unwrap all of the properties as an
    // array of keyValues, or unwrap the first keyValue set as an object
    obj = _.isObject(obj) ? extractKeyValOrArray(obj) : obj;

    // Detect strings
    if (_.isString(obj)) {
      // If begins with a $, then we need to convert it over to a regular query object and analyze it again
      if (isStringSyntax(obj)) {
        return makeSubAggregationFunction(convertAggregatorString(obj))
      }
      // If normal string, then just return a an itentity accessor
      return function identity(d) {
        return d[obj]
      }
    }

    // If an array, recurse into each item and return as a map
    if (_.isArray(obj)) {
      var subStack = _.map(obj, makeSubAggregationFunction);
      return function getSubStack(d) {
        return subStack.map(function(s) {
          return s(d)
        })
      }
    }

    // If object, find the aggregation, and recurse into the value
    if (obj.key) {
      if (aggregators[obj.key]) {
        var subAggregationFunction = makeSubAggregationFunction(obj.value);
        return function getAggregation(d) {
          return aggregators[obj.key](subAggregationFunction(d))
        }
      }
      console.error('Could not find aggregration method', obj);
    }

    return []
  }

  function extractKeyValOrArray(obj) {
    var keyVal;
    var values = [];
    for (var key in obj) {
      if ({}.hasOwnProperty.call(obj, key)) {
        keyVal = {
          key: key,
          value: obj[key],
        };
        var subObj = {};
        subObj[key] = obj[key];
        values.push(subObj);
      }
    }
    return values.length > 1 ? values : keyVal
  }

  function isStringSyntax(str) {
    return ['$', '('].indexOf(str.charAt(0)) > -1
  }

  function parseAggregatorParams(keyString) {
    var params = [];
    var p1 = keyString.indexOf('(');
    var p2 = keyString.indexOf(')');
    var key = p1 > -1 ? keyString.substring(0, p1) : keyString;
    if (!aggregators[key]) {
      return false
    }
    if (p1 > -1 && p2 > -1 && p2 > p1) {
      params = keyString.substring(p1 + 1, p2).split(',');
    }

    return {
      aggregator: aggregators[key],
      params: params,
    }
  }

  function convertAggregatorString(keyString) {
    // var obj = {} // obj is defined but not used

    // 1. unwrap top parentheses
    // 2. detect arrays

    // parentheses
    var outerParens = /\((.+)\)/g;
    // var innerParens = /\(([^\(\)]+)\)/g  // innerParens is defined but not used
    // comma not in ()
    var hasComma = /(?:\([^\(\)]*\))|(,)/g; // eslint-disable-line

    return JSON.parse('{' + unwrapParensAndCommas(keyString) + '}')

    function unwrapParensAndCommas(str) {
      str = str.replace(' ', '');
      return (
        '"' +
        str.replace(outerParens, function(p, pr) {
          if (hasComma.test(pr)) {
            if (pr.charAt(0) === '$') {
              return (
                '":{"' +
                pr.replace(hasComma, function(p2 /* , pr2 */) {
                  if (p2 === ',') {
                    return ',"'
                  }
                  return unwrapParensAndCommas(p2).trim()
                }) +
                '}'
              )
            }
            return (
              ':["' +
              pr.replace(
                hasComma,
                function(/* p2 , pr2 */) {
                  return '","'
                }
              ) +
              '"]'
            )
          }
        })
      )
    }
  }

  // Collection Aggregators

  function $sum(children) {
    return children.reduce(function(a, b) {
      return a + b
    }, 0)
  }

  function $avg(children) {
    return (
      children.reduce(function(a, b) {
        return a + b
      }, 0) / children.length
    )
  }

  function $max(children) {
    return Math.max.apply(null, children)
  }

  function $min(children) {
    return Math.min.apply(null, children)
  }

  function $count(children) {
    return children.length
  }

  /* function $med(children) { // $med is defined but not used
    children.sort(function(a, b) {
      return a - b
    })
    var half = Math.floor(children.length / 2)
    if (children.length % 2)
      return children[half]
    else
      return (children[half - 1] + children[half]) / 2.0
  } */

  function $first(children) {
    return children[0]
  }

  function $last(children) {
    return children[children.length - 1]
  }

  function $get(children, n) {
    return children[n]
  }

  function $nthLast(children, n) {
    return children[children.length - n]
  }

  function $nthPct(children, n) {
    return children[Math.round(children.length * (n / 100))]
  }

  function $map(children, n) {
    return children.map(function(d) {
      return d[n]
    })
  }

  function _filters (service) {
    return {
      filter: filter,
      filterAll: filterAll,
      applyFilters: applyFilters,
      makeFunction: makeFunction,
      scanForDynamicFilters: scanForDynamicFilters,
    }

    function filter(column, fil, isRange, replace) {
      return getColumn(column)
        .then(function (column) {
        // Clone a copy of the new filters
          var newFilters = Object.assign({}, service.filters);
          // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
          var filterKey = column.key;
          if (column.complex === 'array') {
            filterKey = JSON.stringify(column.key);
          }
          if (column.complex === 'function') {
            filterKey = column.key.toString();
          }
          // Build the filter object
          newFilters[filterKey] = buildFilterObject(fil, isRange, replace);

          return applyFilters(newFilters)
        })
    }

    function getColumn(column) {
      var exists = service.column.find(column);
      // If the filters dimension doesn't exist yet, try and create it
      return new Promise(function (resolve, reject) {
        try {
          if (!exists) {
            return resolve(service.column({
              key: column,
              temporary: true,
            })
              .then(function () {
                // It was able to be created, so retrieve and return it
                return service.column.find(column)
              })
            )
          } else {
            // It exists, so just return what we found
            resolve(exists);
          }
        } catch (err) {
          reject(err);
        }
      })
    }

    function filterAll(fils) {
      // If empty, remove all filters
      if (!fils) {
        service.columns.forEach(function (col) {
          col.dimension.filterAll();
        });
        return applyFilters({})
      }

      // Clone a copy for the new filters
      var newFilters = Object.assign({}, service.filters);

      var ds = _.map(fils, function (fil) {
        return getColumn(fil.column)
          .then(function (column) {
            // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
            var filterKey = column.complex ? JSON.stringify(column.key) : column.key;
            // Build the filter object
            newFilters[filterKey] = buildFilterObject(fil.value, fil.isRange, fil.replace);
          })
      });

      return Promise.all(ds)
        .then(function () {
          return applyFilters(newFilters)
        })
    }

    function buildFilterObject(fil, isRange, replace) {
      if (_.isUndefined(fil)) {
        return false
      }
      if (_.isFunction(fil)) {
        return {
          value: fil,
          function: fil,
          replace: true,
          type: 'function',
        }
      }
      if (_.isObject(fil)) {
        return {
          value: fil,
          function: makeFunction(fil),
          replace: true,
          type: 'function',
        }
      }
      if (_.isArray(fil)) {
        return {
          value: fil,
          replace: isRange || replace,
          type: isRange ? 'range' : 'inclusive',
        }
      }
      return {
        value: fil,
        replace: replace,
        type: 'exact',
      }
    }

    function applyFilters(newFilters) {
      var ds = _.map(newFilters, function (fil, i) {
        var existing = service.filters[i];
        // Filters are the same, so no change is needed on this column
        if (fil === existing) {
          return Promise.resolve()
        }
        var column;
        // Retrieve complex columns by decoding the column key as json
        if (i.charAt(0) === '[') {
          column = service.column.find(JSON.parse(i));
        } else {
          // Retrieve the column normally
          column = service.column.find(i);
        }

        // Toggling a filter value is a bit different from replacing them
        if (fil && existing && !fil.replace) {
          newFilters[i] = fil = toggleFilters(fil, existing);
        }

        // If no filter, remove everything from the dimension
        if (!fil) {
          return Promise.resolve(column.dimension.filterAll())
        }
        if (fil.type === 'exact') {
          return Promise.resolve(column.dimension.filterExact(fil.value))
        }
        if (fil.type === 'range') {
          return Promise.resolve(column.dimension.filterRange(fil.value))
        }
        if (fil.type === 'inclusive') {
          return Promise.resolve(column.dimension.filterFunction(function (d) {
            return fil.value.indexOf(d) > -1
          }))
        }
        if (fil.type === 'function') {
          return Promise.resolve(column.dimension.filterFunction(fil.function))
        }
        // By default if something craps up, just remove all filters
        return Promise.resolve(column.dimension.filterAll())
      });

      return Promise.all(ds)
        .then(function () {
          // Save the new filters satate
          service.filters = newFilters;

          // Pluck and remove falsey filters from the mix
          var tryRemoval = [];
          _.forEach(service.filters, function (val, key) {
            if (!val) {
              tryRemoval.push({
                key: key,
                val: val,
              });
              delete service.filters[key];
            }
          });

          // If any of those filters are the last dependency for the column, then remove the column
          return Promise.all(_.map(tryRemoval, function (v) {
            var column = service.column.find((v.key.charAt(0) === '[') ? JSON.parse(v.key) : v.key);
            if (column.temporary && !column.dynamicReference) {
              return service.clear(column.key)
            }
          }))
        })
        .then(function () {
          // Call the filterListeners and wait for their return
          return Promise.all(_.map(service.filterListeners, function (listener) {
            return listener()
          }))
        })
        .then(function () {
          return service
        })
    }

    function toggleFilters(fil, existing) {
      // Exact from Inclusive
      if (fil.type === 'exact' && existing.type === 'inclusive') {
        fil.value = _.xor([fil.value], existing.value);
      } else if (fil.type === 'inclusive' && existing.type === 'exact') { // Inclusive from Exact
        fil.value = _.xor(fil.value, [existing.value]);
      } else if (fil.type === 'inclusive' && existing.type === 'inclusive') { // Inclusive / Inclusive Merge
        fil.value = _.xor(fil.value, existing.value);
      } else if (fil.type === 'exact' && existing.type === 'exact') { // Exact / Exact
        // If the values are the same, remove the filter entirely
        if (fil.value === existing.value) {
          return false
        }
        // They they are different, make an array
        fil.value = [fil.value, existing.value];
      }

      // Set the new type based on the merged values
      if (!fil.value.length) {
        fil = false;
      } else if (fil.value.length === 1) {
        fil.type = 'exact';
        fil.value = fil.value[0];
      } else {
        fil.type = 'inclusive';
      }

      return fil
    }

    function scanForDynamicFilters(query) {
      // Here we check to see if there are any relative references to the raw data
      // being used in the filter. If so, we need to build those dimensions and keep
      // them updated so the filters can be rebuilt if needed
      // The supported keys right now are: $column, $data
      var columns = [];
      walk(query.filter);
      return columns

      function walk(obj) {
        _.forEach(obj, function (val, key) {
          // find the data references, if any
          var ref = findDataReferences(val, key);
          if (ref) {
            columns.push(ref);
          }
          // if it's a string
          if (_.isString(val)) {
            ref = findDataReferences(null, val);
            if (ref) {
              columns.push(ref);
            }
          }
          // If it's another object, keep looking
          if (_.isObject(val)) {
            walk(val);
          }
        });
      }
    }

    function findDataReferences(val, key) {
      // look for the $data string as a value
      if (key === '$data') {
        return true
      }

      // look for the $column key and it's value as a string
      if (key && key === '$column') {
        if (_.isString(val)) {
          return val
        }
        console.warn('The value for filter "$column" must be a valid column key', val);
        return false
      }
    }

    function makeFunction(obj, isAggregation) {
      var subGetters;

      // Detect raw $data reference
      if (_.isString(obj)) {
        var dataRef = findDataReferences(null, obj);
        if (dataRef) {
          var data = service.cf.all();
          return function () {
            return data
          }
        }
      }

      if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
        return function (d) {
          if (typeof d === 'undefined') {
            return obj
          }
          return expressions.$eq(d, function () {
            return obj
          })
        }
      }

      // If an array, recurse into each item and return as a map
      if (_.isArray(obj)) {
        subGetters = _.map(obj, function (o) {
          return makeFunction(o, isAggregation)
        });
        return function (d) {
          return subGetters.map(function (s) {
            return s(d)
          })
        }
      }

      // If object, return a recursion function that itself, returns the results of all of the object keys
      if (_.isObject(obj)) {
        subGetters = _.map(obj, function (val, key) {
          // Get the child
          var getSub = makeFunction(val, isAggregation);

          // Detect raw $column references
          var dataRef = findDataReferences(val, key);
          if (dataRef) {
            var column = service.column.find(dataRef);
            var data = column.values;
            return function () {
              return data
            }
          }

          // If expression, pass the parentValue and the subGetter
          if (expressions[key]) {
            return function (d) {
              return expressions[key](d, getSub)
            }
          }

          var aggregatorObj = aggregation.parseAggregatorParams(key);
          if (aggregatorObj) {
            // Make sure that any further operations are for aggregations
            // and not filters
            isAggregation = true;
            // here we pass true to makeFunction which denotes that
            // an aggregatino chain has started and to stop using $AND
            getSub = makeFunction(val, isAggregation);
            // If it's an aggregation object, be sure to pass in the children, and then any additional params passed into the aggregation string
            return function () {
              return aggregatorObj.aggregator.apply(null, [getSub()].concat(aggregatorObj.params))
            }
          }

          // It must be a string then. Pluck that string key from parent, and pass it as the new value to the subGetter
          return function (d) {
            d = d[key];
            return getSub(d, getSub)
          }
        });

        // All object expressions are basically AND's
        // Return AND with a map of the subGetters
        if (isAggregation) {
          if (subGetters.length === 1) {
            return function (d) {
              return subGetters[0](d)
            }
          }
          return function (d) {
            return _.map(subGetters, function (getSub) {
              return getSub(d)
            })
          }
        }
        return function (d) {
          return expressions.$and(d, function (d) {
            return _.map(subGetters, function (getSub) {
              return getSub(d)
            })
          })
        }
      }

      console.log('no expression found for ', obj);
      return false
    }
  }

  function _crossfilter (service) {
    return {
      build: build,
      generateColumns: generateColumns,
      add: add,
      remove: remove,
    }

    function build(c) {
      if (_.isArray(c)) {
        // This allows support for crossfilter async
        return Promise.resolve(crossfilter(c))
      }
      if (!c || typeof c.dimension !== 'function') {
        return Promise.reject(new Error('No Crossfilter data or instance found!'))
      }
      return Promise.resolve(c)
    }

    function generateColumns(data) {
      if (!service.options.generatedColumns) {
        return data
      }
      return _.map(data, function (d/* , i */) {
        _.forEach(service.options.generatedColumns, function (val, key) {
          d[key] = val(d);
        });
        return d
      })
    }

    function add(data) {
      data = generateColumns(data);
      return new Promise(function (resolve, reject) {
        try {
          resolve(service.cf.add(data));
        } catch (err) {
          reject(err);
        }
      })
        .then(function () {
          return _.map(service.dataListeners, function (listener) {
            return function () {
              return listener({
                added: data,
              })
            }
          }).reduce(function(promise, data) {
            return promise.then(data)
          }, Promise.resolve(true))
        })

        .then(function() {
          return Promise.all(_.map(service.filterListeners, function (listener) {
            return listener()
          }))      
        })

        .then(function () {
          return service
        })
    }

    function remove(predicate) {
      return new Promise(function (resolve, reject) {
        try {
          resolve(service.cf.remove(predicate));
        } catch (err) {
          reject(err);
        }
      })
      
        .then(function() {
          return Promise.all(_.map(service.filterListeners, function (listener) {
            return listener()
          }))      
        })
      
        .then(function () {
          return service
        })
    }
  }

  function _dimension (service) {
    return {
      make: make,
      makeAccessor: makeAccessor,
    }

    function make(key, type, complex) {
      var accessor = makeAccessor(key, complex);
      // Promise.resolve will handle promises or non promises, so
      // this crossfilter async is supported if present
      return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
    }

    function makeAccessor(key, complex) {
      var accessorFunction;

      if (complex === 'string') {
        accessorFunction = function (d) {
          return _.get(d, key)
        };
      } else if (complex === 'function') {
        accessorFunction = key;
      } else if (complex === 'array') {
        var arrayString = _.map(key, function (k) {
          return 'd[\'' + k + '\']'
        });
        accessorFunction = new Function('d', String('return ' + JSON.stringify(arrayString).replace(/"/g, '')));  // eslint-disable-line  no-new-func
      } else {
        accessorFunction =
          // Index Dimension
          key === true ? function accessor(d, i) {
            return i
          } :
            // Value Accessor Dimension
            function (d) {
              return d[key]
            };
      }
      return accessorFunction
    }
  }

  function column (service) {
    var dimension = _dimension(service);

    var columnFunc = column;
    columnFunc.find = findColumn;

    return columnFunc

    function column(def) {
      // Support groupAll dimension
      if (_.isUndefined(def)) {
        def = true;
      }

      // Always deal in bulk.  Like Costco!
      if (!_.isArray(def)) {
        def = [def];
      }

      // Mapp all column creation, wait for all to settle, then return the instance
      return Promise.all(_.map(def, makeColumn))
        .then(function () {
          return service
        })
    }

    function findColumn(d) {
      return _.find(service.columns, function (c) {
        if (_.isArray(d)) {
          return !_.xor(c.key, d).length
        }
        return c.key === d
      })
    }

    function getType(d) {
      if (_.isNumber(d)) {
        return 'number'
      }
      if (_.isBoolean(d)) {
        return 'bool'
      }
      if (_.isArray(d)) {
        return 'array'
      }
      if (_.isObject(d)) {
        return 'object'
      }
      return 'string'
    }

    function makeColumn(d) {
      var column = _.isObject(d) ? d : {
        key: d,
      };

      var existing = findColumn(column.key);

      if (existing) {
        existing.temporary = false;
        if (existing.dynamicReference) {
          existing.dynamicReference = false;
        }
        return existing.promise
          .then(function () {
            return service
          })
      }

      // for storing info about queries and post aggregations
      column.queries = [];
      service.columns.push(column);

      column.promise = new Promise(function (resolve, reject) {
        try {
          resolve(service.cf.all());
        } catch (err) {
          reject(err);
        }
      })
        .then(function (all) {
          var sample;

          // Complex column Keys
          if (_.isFunction(column.key)) {
            column.complex = 'function';
            sample = column.key(all[0]);
          } else if (_.isString(column.key) && (column.key.indexOf('.') > -1 || column.key.indexOf('[') > -1)) {
            column.complex = 'string';
            sample = _.get(all[0], column.key);
          } else if (_.isArray(column.key)) {
            column.complex = 'array';
            sample = _.values(_.pick(all[0], column.key));
            if (sample.length !== column.key.length) {
              throw new Error('Column key does not exist in data!', column.key)
            }
          } else {
            sample = all[0][column.key];
          }

          // Index Column
          if (!column.complex && column.key !== true && typeof sample === 'undefined') {
            throw new Error('Column key does not exist in data!', column.key)
          }

          // If the column exists, let's at least make sure it's marked
          // as permanent. There is a slight chance it exists because
          // of a filter, and the user decides to make it permanent

          if (column.key === true) {
            column.type = 'all';
          } else if (column.complex) {
            column.type = 'complex';
          } else if (column.array) {
            column.type = 'array';
          } else {
            column.type = getType(sample);
          }

          return dimension.make(column.key, column.type, column.complex)
        })
        .then(function (dim) {
          column.dimension = dim;
          column.filterCount = 0;
          var stopListeningForData = service.onDataChange(buildColumnKeys);
          column.removeListeners = [stopListeningForData];

          return buildColumnKeys()

          // Build the columnKeys
          function buildColumnKeys(changes) {
            if (column.key === true) {
              return Promise.resolve()
            }

            var accessor = dimension.makeAccessor(column.key, column.complex);
            column.values = column.values || [];

            return new Promise(function (resolve, reject) {
              try {
                if (changes && changes.added) {
                  resolve(changes.added);
                } else {
                  resolve(column.dimension.bottom(Infinity));
                }
              } catch (err) {
                reject(err);
              }
            })
              .then(function (rows) {
                var newValues;
                if (column.complex === 'string' || column.complex === 'function') {
                  newValues = _.map(rows, accessor);
                  // console.log(rows, accessor.toString(), newValues)
                } else if (column.type === 'array') {
                  newValues = _.flatten(_.map(rows, accessor));
                } else {
                  newValues = _.map(rows, accessor);
                }
                column.values = _.uniq(column.values.concat(newValues));
              })
          }
        });

      return column.promise
        .then(function () {
          return service
        })
    }
  }

  var rAggregators = {
    shorthandLabels: {
      $count: 'count',
      $sum: 'sum',
      $avg: 'avg',
      $min: 'min',
      $max: 'max',
      $med: 'med',
      $sumSq: 'sumSq',
      $std: 'std',
    },
    aggregators: {
      $count: $count$1,
      $sum: $sum$1,
      $avg: $avg$1,
      $min: $min$1,
      $max: $max$1,
      $med: $med,
      $sumSq: $sumSq,
      $std: $std,
      $valueList: $valueList,
      $dataList: $dataList,
    },
  };

  // Aggregators

  function $count$1(reducer/* , value */) {
    return reducer.count(true)
  }

  function $sum$1(reducer, value) {
    return reducer.sum(value)
  }

  function $avg$1(reducer, value) {
    return reducer.avg(value)
  }

  function $min$1(reducer, value) {
    return reducer.min(value)
  }

  function $max$1(reducer, value) {
    return reducer.max(value)
  }

  function $med(reducer, value) {
    return reducer.median(value)
  }

  function $sumSq(reducer, value) {
    return reducer.sumOfSq(value)
  }

  function $std(reducer, value) {
    return reducer.std(value)
  }

  function $valueList(reducer, value) {
    return reducer.valueList(value)
  }

  function $dataList(reducer/* , value */) {
    return reducer.dataList(true)
  }

  // TODO histograms
  // TODO exceptions

  function _reductiofy (service) {
    var filters = _filters(service);

    return function reductiofy(query) {
      var reducer = reductio();
      // var groupBy = query.groupBy // groupBy is defined but never used
      aggregateOrNest(reducer, query.select);

      if (query.filter) {
        var filterFunction = filters.makeFunction(query.filter);
        if (filterFunction) {
          reducer.filter(filterFunction);
        }
      }

      return Promise.resolve(reducer)

      // This function recursively find the first level of reductio methods in
      // each object and adds that reduction method to reductio
      function aggregateOrNest(reducer, selects) {
        // Sort so nested values are calculated last by reductio's .value method
        var sortedSelectKeyValue = _.sortBy(
          _.map(selects, function (val, key) {
            return {
              key: key,
              value: val,
            }
          }),
          function (s) {
            if (rAggregators.aggregators[s.key]) {
              return 0
            }
            return 1
          });

        // dive into each key/value
        return _.forEach(sortedSelectKeyValue, function (s) {
          // Found a Reductio Aggregation
          if (rAggregators.aggregators[s.key]) {
            // Build the valueAccessorFunction
            var accessor = aggregation.makeValueAccessor(s.value);
            // Add the reducer with the ValueAccessorFunction to the reducer
            reducer = rAggregators.aggregators[s.key](reducer, accessor);
            return
          }

          // Found a top level key value that is not an aggregation or a
          // nested object. This is unacceptable.
          if (!_.isObject(s.value)) {
            console.error('Nested selects must be an object', s.key);
            return
          }

          // It's another nested object, so just repeat this process on it
          aggregateOrNest(reducer.value(s.key), s.value);
        })
      }
    }
  }

  function _postAggregation (/* service */) {
    return {
      post: post,
      sortByKey: sortByKey,
      limit: limit,
      squash: squash,
      change: change,
      changeMap: changeMap,
    }

    function post(query, parent, cb) {
      query.data = cloneIfLocked(parent);
      return Promise.resolve(cb(query, parent))
    }

    function sortByKey(query, parent, desc) {
      query.data = cloneIfLocked(parent);
      query.data = _.sortBy(query.data, function (d) {
        return d.key
      });
      if (desc) {
        query.data.reverse();
      }
    }

    // Limit results to n, or from start to end
    function limit(query, parent, start, end) {
      query.data = cloneIfLocked(parent);
      if (_.isUndefined(end)) {
        end = start || 0;
        start = 0;
      } else {
        start = start || 0;
        end = end || query.data.length;
      }
      query.data = query.data.splice(start, end - start);
    }

    // Squash results to n, or from start to end
    function squash(query, parent, start, end, aggObj, label) {
      query.data = cloneIfLocked(parent);
      start = start || 0;
      end = end || query.data.length;
      var toSquash = query.data.splice(start, end - start);
      var squashed = {
        key: label || 'Other',
        value: {},
      };
      _.recurseObject(aggObj, function (val, key, path) {
        var items = [];
        _.forEach(toSquash, function (record) {
          items.push(_.get(record.value, path));
        });
        _.set(squashed.value, path, aggregation.aggregators[val](items));
      });
      query.data.splice(start, 0, squashed);
    }

    function change(query, parent, start, end, aggObj) {
      query.data = cloneIfLocked(parent);
      start = start || 0;
      end = end || query.data.length;
      var obj = {
        key: [query.data[start].key, query.data[end].key],
        value: {},
      };
      _.recurseObject(aggObj, function (val, key, path) {
        var changePath = _.clone(path);
        changePath.pop();
        changePath.push(key + 'Change');
        _.set(obj.value, changePath, _.get(query.data[end].value, path) - _.get(query.data[start].value, path));
      });
      query.data = obj;
    }

    function changeMap(query, parent, aggObj, defaultNull) {
      defaultNull = _.isUndefined(defaultNull) ? 0 : defaultNull;
      query.data = cloneIfLocked(parent);
      _.recurseObject(aggObj, function (val, key, path) {
        var changePath = _.clone(path);
        var fromStartPath = _.clone(path);
        var fromEndPath = _.clone(path);

        changePath.pop();
        fromStartPath.pop();
        fromEndPath.pop();

        changePath.push(key + 'Change');
        fromStartPath.push(key + 'ChangeFromStart');
        fromEndPath.push(key + 'ChangeFromEnd');

        var start = _.get(query.data[0].value, path, defaultNull);
        var end = _.get(query.data[query.data.length - 1].value, path, defaultNull);

        _.forEach(query.data, function (record, i) {
          var previous = query.data[i - 1] || query.data[0];
          _.set(query.data[i].value, changePath, _.get(record.value, path, defaultNull) - (previous ? _.get(previous.value, path, defaultNull) : defaultNull));
          _.set(query.data[i].value, fromStartPath, _.get(record.value, path, defaultNull) - start);
          _.set(query.data[i].value, fromEndPath, _.get(record.value, path, defaultNull) - end);
        });
      });
    }
  }

  function cloneIfLocked(parent) {
    return parent.locked ? _.clone(parent.data) : parent.data
  }

  function query (service) {
    var reductiofy = _reductiofy(service);
    var filters = _filters(service);
    var postAggregation = _postAggregation();

    var postAggregationMethods = _.keys(postAggregation);

    return function doQuery(queryObj) {
      var queryHash = JSON.stringify(queryObj);

      // Attempt to reuse an exact copy of this query that is present elsewhere
      for (var i = 0; i < service.columns.length; i++) {
        for (var j = 0; j < service.columns[i].queries.length; j++) {
          if (service.columns[i].queries[j].hash === queryHash) {
            return new Promise(function (resolve, reject) { // eslint-disable-line no-loop-func
              try {
                resolve(service.columns[i].queries[j]);
              } catch (err) {
                reject(err);
              }
            })
          }
        }
      }

      var query = {
        // Original query passed in to query method
        original: queryObj,
        hash: queryHash,
      };

      // Default queryObj
      if (_.isUndefined(query.original)) {
        query.original = {};
      }
      // Default select
      if (_.isUndefined(query.original.select)) {
        query.original.select = {
          $count: true,
        };
      }
      // Default to groupAll
      query.original.groupBy = query.original.groupBy || true;

      // Attach the query api to the query object
      query = newQueryObj(query);

      return createColumn(query)
        .then(makeCrossfilterGroup)
        .then(buildRequiredColumns)
        .then(setupDataListeners)
        .then(applyQuery)

      function createColumn(query) {
        // Ensure column is created
        return service.column({
          key: query.original.groupBy,
          type: _.isUndefined(query.type) ? null : query.type,
          array: Boolean(query.array),
        })
          .then(function () {
          // Attach the column to the query
            var column = service.column.find(query.original.groupBy);
            query.column = column;
            column.queries.push(query);
            column.removeListeners.push(function () {
              return query.clear()
            });
            return query
          })
      }

      function makeCrossfilterGroup(query) {
        // Create the grouping on the columns dimension
        // Using Promise Resolve allows support for crossfilter async
        // TODO check if query already exists, and use the same base query // if possible
        return Promise.resolve(query.column.dimension.group())
          .then(function (g) {
            query.group = g;
            return query
          })
      }

      function buildRequiredColumns(query) {
        var requiredColumns = filters.scanForDynamicFilters(query.original);
        // We need to scan the group for any filters that would require
        // the group to be rebuilt when data is added or removed in any way.
        if (requiredColumns.length) {
          return Promise.all(_.map(requiredColumns, function (columnKey) {
            return service.column({
              key: columnKey,
              dynamicReference: query.group,
            })
          }))
            .then(function () {
              return query
            })
        }
        return query
      }

      function setupDataListeners(query) {
        // Here, we create a listener to recreate and apply the reducer to
        // the group anytime underlying data changes
        var stopDataListen = service.onDataChange(function () {
          return applyQuery(query)
        });
        query.removeListeners.push(stopDataListen);

        // This is a similar listener for filtering which will (if needed)
        // run any post aggregations on the data after each filter action
        var stopFilterListen = service.onFilter(function () {
          return postAggregate(query)
        });
        query.removeListeners.push(stopFilterListen);

        return query
      }

      function applyQuery(query) {
        return buildReducer(query)
          .then(applyReducer)
          .then(attachData)
          .then(postAggregate)
      }

      function buildReducer(query) {
        return reductiofy(query.original)
          .then(function (reducer) {
            query.reducer = reducer;
            return query
          })
      }

      function applyReducer(query) {
        return Promise.resolve(query.reducer(query.group))
          .then(function () {
            return query
          })
      }

      function attachData(query) {
        return Promise.resolve(query.group.all())
          .then(function (data) {
            query.data = data;
            return query
          })
      }

      function postAggregate(query) {
        if (query.postAggregations.length > 1) {
          // If the query is used by 2+ post aggregations, we need to lock
          // it against getting mutated by the post-aggregations
          query.locked = true;
        }
        return Promise.all(_.map(query.postAggregations, function (post) {
          return post()
        }))
          .then(function () {
            return query
          })
      }

      function newQueryObj(q, parent) {
        var locked = false;
        if (!parent) {
          parent = q;
          q = {};
          locked = true;
        }

        // Assign the regular query properties
        Object.assign(q, {
          // The Universe for continuous promise chaining
          universe: service,
          // Crossfilter instance
          crossfilter: service.cf,

          // parent Information
          parent: parent,
          column: parent.column,
          dimension: parent.dimension,
          group: parent.group,
          reducer: parent.reducer,
          original: parent.original,
          hash: parent.hash,

          // It's own removeListeners
          removeListeners: [],

          // It's own postAggregations
          postAggregations: [],

          // Data method
          locked: locked,
          lock: lock,
          unlock: unlock,
          // Disposal method
          clear: clearQuery,
        });

        _.forEach(postAggregationMethods, function (method) {
          q[method] = postAggregateMethodWrap(postAggregation[method]);
        });

        return q

        function lock(set) {
          if (!_.isUndefined(set)) {
            q.locked = Boolean(set);
            return
          }
          q.locked = true;
        }

        function unlock() {
          q.locked = false;
        }

        function clearQuery() {
          _.forEach(q.removeListeners, function (l) {
            l();
          });
          return new Promise(function (resolve, reject) {
            try {
              resolve(q.group.dispose());
            } catch (err) {
              reject(err);
            }
          })
            .then(function () {
              q.column.queries.splice(q.column.queries.indexOf(q), 1);
              // Automatically recycle the column if there are no queries active on it
              if (!q.column.queries.length) {
                return service.clear(q.column.key)
              }
            })
            .then(function () {
              return service
            })
        }

        function postAggregateMethodWrap(postMethod) {
          return function () {
            var args = Array.prototype.slice.call(arguments);
            var sub = {};
            newQueryObj(sub, q);
            args.unshift(sub, q);

            q.postAggregations.push(function () {
              Promise.resolve(postMethod.apply(null, args))
                .then(postAggregateChildren);
            });

            return Promise.resolve(postMethod.apply(null, args))
              .then(postAggregateChildren)

            function postAggregateChildren() {
              return postAggregate(sub)
                .then(function () {
                  return sub
                })
            }
          }
        }
      }
    }
  }

  function clear(service) {
    return function clear(def) {
      // Clear a single or multiple column definitions
      if (def) {
        def = _.isArray(def) ? def : [def];
      }

      if (!def) {
        // Clear all of the column defenitions
        return Promise.all(
          _.map(service.columns, disposeColumn)
        ).then(function() {
          service.columns = [];
          return service
        })
      }

      return Promise.all(
        _.map(def, function(d) {
          if (_.isObject(d)) {
            d = d.key;
          }
          // Clear the column
          var column = _.remove(service.columns, function(c) {
            if (_.isArray(d)) {
              return !_.xor(c.key, d).length
            }
            if (c.key === d) {
              if (c.dynamicReference) {
                return false
              }
              return true
            }
          })[0];

          if (!column) {
            // console.info('Attempted to clear a column that is required for another query!', c)
            return
          }

          disposeColumn(column);
        })
      ).then(function() {
        return service
      })

      function disposeColumn(column) {
        var disposalActions = [];
        // Dispose the dimension
        if (column.removeListeners) {
          disposalActions = _.map(column.removeListeners, function(listener) {
            return Promise.resolve(listener())
          });
        }
        var filterKey = column.key;
        if (column.complex === 'array') {
          filterKey = JSON.stringify(column.key);
        }
        if (column.complex === 'function') {
          filterKey = column.key.toString();
        }
        delete service.filters[filterKey];
        if (column.dimension) {
          disposalActions.push(Promise.resolve(column.dimension.dispose()));
        }
        return Promise.all(disposalActions)
      }
    }
  }

  function destroy (service) {
    return function destroy() {
      return service.clear()
        .then(function () {
          service.cf.dataListeners = [];
          service.cf.filterListeners = [];
          return Promise.resolve(service.cf.remove())
        })
        .then(function () {
          return service
        })
    }
  }

  function universe(data, options) {
    var service = {
      options: Object.assign({}, options),
      columns: [],
      filters: {},
      dataListeners: [],
      filterListeners: [],
    };

    var cf = _crossfilter(service);
    var filters = _filters(service);

    data = cf.generateColumns(data);

    return cf.build(data)
      .then(function (data) {
        service.cf = data;
        return Object.assign(service, {
          add: cf.add,
          remove: cf.remove,
          column: column(service),
          query: query(service),
          filter: filters.filter,
          filterAll: filters.filterAll,
          applyFilters: filters.applyFilters,
          clear: clear(service),
          destroy: destroy(service),
          onDataChange: onDataChange,
          onFilter: onFilter,
        })
      })

    function onDataChange(cb) {
      service.dataListeners.push(cb);
      return function () {
        service.dataListeners.splice(service.dataListeners.indexOf(cb), 1);
      }
    }

    function onFilter(cb) {
      service.filterListeners.push(cb);
      return function () {
        service.filterListeners.splice(service.filterListeners.indexOf(cb), 1);
      }
    }
  }

  return universe;

}));
