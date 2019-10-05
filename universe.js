(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.universe = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports = require("./src/crossfilter").crossfilter;

},{"./src/crossfilter":5}],2:[function(require,module,exports){
module.exports={
  "_from": "crossfilter2@1.4.6",
  "_id": "crossfilter2@1.4.6",
  "_inBundle": false,
  "_integrity": "sha512-Fdmb6NqdUqreOuQ9qiNvTLOxMFBQRPDeRBBnqM8Zlebdf2i7Bn5hRhE8RlO9YzbGRyYxvYzdDXt6C1muyanolg==",
  "_location": "/crossfilter2",
  "_phantomChildren": {},
  "_requested": {
    "type": "version",
    "registry": true,
    "raw": "crossfilter2@1.4.6",
    "name": "crossfilter2",
    "escapedName": "crossfilter2",
    "rawSpec": "1.4.6",
    "saveSpec": null,
    "fetchSpec": "1.4.6"
  },
  "_requiredBy": [
    "/",
    "/reductio"
  ],
  "_resolved": "https://registry.npmjs.org/crossfilter2/-/crossfilter2-1.4.6.tgz",
  "_shasum": "c173f0d75a04344ad226b1f8ae747f0386f98750",
  "_spec": "crossfilter2@1.4.6",
  "_where": "/home/christophe/Programming/Polymer/litElement/universe",
  "author": {
    "name": "Mike Bostock",
    "url": "http://bost.ocks.org/mike"
  },
  "bugs": {
    "url": "https://github.com/crossfilter/crossfilter/issues"
  },
  "bundleDependencies": false,
  "contributors": [
    {
      "name": "Jason Davies",
      "url": "http://www.jasondavies.com/"
    }
  ],
  "dependencies": {
    "lodash.result": "^4.4.0"
  },
  "deprecated": false,
  "description": "Fast multidimensional filtering for coordinated views.",
  "devDependencies": {
    "browserify": "^13.0.0",
    "d3": "3.5",
    "eslint": "2.10.2",
    "package-json-versionify": "1.0.2",
    "semver": "^5.3.0",
    "sinon": "^4.0.2",
    "uglify-js": "2.4.0",
    "vows": "0.7.0"
  },
  "eslintConfig": {
    "env": {
      "browser": true,
      "node": true
    },
    "globals": {
      "Uint8Array": true,
      "Uint16Array": true,
      "Uint32Array": true
    },
    "extends": "eslint:recommended"
  },
  "files": [
    "src",
    "index.js",
    "index.d.ts",
    "crossfilter.js",
    "crossfilter.min.js"
  ],
  "homepage": "https://crossfilter.github.io/crossfilter/",
  "keywords": [
    "analytics",
    "visualization",
    "crossfilter"
  ],
  "license": "Apache-2.0",
  "main": "./index.js",
  "maintainers": [
    {
      "name": "Gordon Woodhull",
      "url": "https://github.com/gordonwoodhull"
    },
    {
      "name": "Tanner Linsley",
      "url": "https://github.com/tannerlinsley"
    },
    {
      "name": "Ethan Jewett",
      "url": "https://github.com/esjewett"
    }
  ],
  "name": "crossfilter2",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/crossfilter/crossfilter.git"
  },
  "scripts": {
    "benchmark": "node test/benchmark.js",
    "build": "browserify index.js -t package-json-versionify --standalone crossfilter -o crossfilter.js && uglifyjs --compress --mangle --screw-ie8 crossfilter.js -o crossfilter.min.js",
    "clean": "rm -f crossfilter.js crossfilter.min.js",
    "test": "vows --verbose && eslint src/"
  },
  "types": "./index.d.ts",
  "unpkg": "./crossfilter.min.js",
  "version": "1.4.6"
}

},{}],3:[function(require,module,exports){
if (typeof Uint8Array !== "undefined") {
  var crossfilter_array8 = function(n) { return new Uint8Array(n); };
  var crossfilter_array16 = function(n) { return new Uint16Array(n); };
  var crossfilter_array32 = function(n) { return new Uint32Array(n); };

  var crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  var crossfilter_arrayWiden = function(array, width) {
    var copy;
    switch (width) {
      case 16: copy = crossfilter_array16(array.length); break;
      case 32: copy = crossfilter_array32(array.length); break;
      default: throw new Error("invalid array width!");
    }
    copy.set(array);
    return copy;
  };
}

function crossfilter_arrayUntyped(n) {
  var array = new Array(n), i = -1;
  while (++i < n) array[i] = 0;
  return array;
}

function crossfilter_arrayLengthenUntyped(array, length) {
  var n = array.length;
  while (n < length) array[n++] = 0;
  return array;
}

function crossfilter_arrayWidenUntyped(array, width) {
  if (width > 32) throw new Error("invalid array width!");
  return array;
}

// An arbitrarily-wide array of bitmasks
function crossfilter_bitarray(n) {
  this.length = n;
  this.subarrays = 1;
  this.width = 8;
  this.masks = {
    0: 0
  }

  this[0] = crossfilter_array8(n);
}

crossfilter_bitarray.prototype.lengthen = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    this[i] = crossfilter_arrayLengthen(this[i], n);
  }
  this.length = n;
};

// Reserve a new bit index in the array, returns {offset, one}
crossfilter_bitarray.prototype.add = function() {
  var m, w, one, i, len;

  for (i = 0, len = this.subarrays; i < len; ++i) {
    m = this.masks[i];
    w = this.width - (32 * i);
    one = ~m & -~m;

    if (w >= 32 && !one) {
      continue;
    }

    if (w < 32 && (one & (1 << w))) {
      // widen this subarray
      this[i] = crossfilter_arrayWiden(this[i], w <<= 1);
      this.width = 32 * i + w;
    }

    this.masks[i] |= one;

    return {
      offset: i,
      one: one
    };
  }

  // add a new subarray
  this[this.subarrays] = crossfilter_array8(this.length);
  this.masks[this.subarrays] = 1;
  this.width += 8;
  return {
    offset: this.subarrays++,
    one: 1
  };
};

// Copy record from index src to index dest
crossfilter_bitarray.prototype.copy = function(dest, src) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    this[i][dest] = this[i][src];
  }
};

// Truncate the array to the given length
crossfilter_bitarray.prototype.truncate = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    for (var j = this.length - 1; j >= n; j--) {
      this[i][j] = 0;
    }
    this[i].length = n;
  }
  this.length = n;
};

// Checks that all bits for the given index are 0
crossfilter_bitarray.prototype.zero = function(n) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n]) {
      return false;
    }
  }
  return true;
};

// Checks that all bits for the given index are 0 except for possibly one
crossfilter_bitarray.prototype.zeroExcept = function(n, offset, zero) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (i === offset ? this[i][n] & zero : this[i][n]) {
      return false;
    }
  }
  return true;
};

// Checks that all bits for the given indez are 0 except for the specified mask.
// The mask should be an array of the same size as the filter subarrays width.
crossfilter_bitarray.prototype.zeroExceptMask = function(n, mask) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n] & mask[i]) {
      return false;
    }
  }
  return true;
}

// Checks that only the specified bit is set for the given index
crossfilter_bitarray.prototype.only = function(n, offset, one) {
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    if (this[i][n] != (i === offset ? one : 0)) {
      return false;
    }
  }
  return true;
};

// Checks that only the specified bit is set for the given index except for possibly one other
crossfilter_bitarray.prototype.onlyExcept = function(n, offset, zero, onlyOffset, onlyOne) {
  var mask;
  var i, len;
  for (i = 0, len = this.subarrays; i < len; ++i) {
    mask = this[i][n];
    if (i === offset)
      mask &= zero;
    if (mask != (i === onlyOffset ? onlyOne : 0)) {
      return false;
    }
  }
  return true;
};

module.exports = {
  array8: crossfilter_arrayUntyped,
  array16: crossfilter_arrayUntyped,
  array32: crossfilter_arrayUntyped,
  arrayLengthen: crossfilter_arrayLengthenUntyped,
  arrayWiden: crossfilter_arrayWidenUntyped,
  bitarray: crossfilter_bitarray
};

},{}],4:[function(require,module,exports){
'use strict';

var crossfilter_identity = require('./identity');

function bisect_by(f) {

  // Locate the insertion point for x in a to maintain sorted order. The
  // arguments lo and hi may be used to specify a subset of the array which
  // should be considered; by default the entire array is used. If x is already
  // present in a, the insertion point will be before (to the left of) any
  // existing entries. The return value is suitable for use as the first
  // argument to `array.splice` assuming that a is already sorted.
  //
  // The returned insertion point i partitions the array a into two halves so
  // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
  // a[i:hi] for the right side.
  function bisectLeft(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (f(a[mid]) < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Similar to bisectLeft, but returns an insertion point which comes after (to
  // the right of) any existing entries of x in a.
  //
  // The returned insertion point i partitions the array into two halves so that
  // all v <= x for v in a[lo:i] for the left side and all v > x for v in
  // a[i:hi] for the right side.
  function bisectRight(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (x < f(a[mid])) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  bisectRight.right = bisectRight;
  bisectRight.left = bisectLeft;
  return bisectRight;
}

module.exports = bisect_by(crossfilter_identity);
module.exports.by = bisect_by; // assign the raw function to the export as well

},{"./identity":9}],5:[function(require,module,exports){
'use strict';

var xfilterArray = require('./array');
var xfilterFilter = require('./filter');
var crossfilter_identity = require('./identity');
var crossfilter_null = require('./null');
var crossfilter_zero = require('./zero');
var xfilterHeapselect = require('./heapselect');
var xfilterHeap = require('./heap');
var bisect = require('./bisect');
var insertionsort = require('./insertionsort');
var permute = require('./permute');
var quicksort = require('./quicksort');
var xfilterReduce = require('./reduce');
var packageJson = require('./../package.json'); // require own package.json for the version field
var result = require('lodash.result');

// constants
var REMOVED_INDEX = -1;

// expose API exports
exports.crossfilter = crossfilter;
exports.crossfilter.heap = xfilterHeap;
exports.crossfilter.heapselect = xfilterHeapselect;
exports.crossfilter.bisect = bisect;
exports.crossfilter.insertionsort = insertionsort;
exports.crossfilter.permute = permute;
exports.crossfilter.quicksort = quicksort;
exports.crossfilter.version = packageJson.version; // please note use of "package-json-versionify" transform

function crossfilter() {
  var crossfilter = {
    add: add,
    remove: removeData,
    dimension: dimension,
    groupAll: groupAll,
    size: size,
    all: all,
    allFiltered: allFiltered,
    onChange: onChange,
    isElementFiltered: isElementFiltered
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      filters, // 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = [], // when data is removed
      callbacks = [];

  filters = new xfilterArray.bitarray(0);

  // Adds the specified new records to this crossfilter.
  function add(newData) {
    var n0 = n,
        n1 = newData.length;

    // If there's actually new data to add…
    // Merge the new data into the existing data.
    // Lengthen the filter bitset to handle the new records.
    // Notify listeners (dimensions and groups) that new data is available.
    if (n1) {
      data = data.concat(newData);
      filters.lengthen(n += n1);
      dataListeners.forEach(function(l) { l(newData, n0, n1); });
      triggerOnChange('dataAdded');
    }

    return crossfilter;
  }

  // Removes all records that match the current filters, or if a predicate function is passed,
  // removes all records matching the predicate (ignoring filters).
  function removeData(predicate) {
    var // Mapping from old record indexes to new indexes (after records removed)
        newIndex = crossfilter_index(n, n),
        removed = [],
        usePred = typeof predicate === 'function',
        shouldRemove = function (i) {
          return usePred ? predicate(data[i], i) : filters.zero(i)
        };

    for (var index1 = 0, index2 = 0; index1 < n; ++index1) {
      if ( shouldRemove(index1) ) {
        removed.push(index1);
        newIndex[index1] = REMOVED_INDEX;
      } else {
        newIndex[index1] = index2++;
      }
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(-1, -1, [], removed, true); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var index3 = 0, index4 = 0; index3 < n; ++index3) {
      if ( newIndex[index3] !== REMOVED_INDEX ) {
        if (index3 !== index4) filters.copy(index4, index3), data[index4] = data[index3];
        ++index4;
      }
    }

    data.length = n = index4;
    filters.truncate(index4);
    triggerOnChange('dataRemoved');
  }

  function maskForDimensions(dimensions) {
    var n,
        d,
        len,
        id,
        mask = Array(filters.subarrays);
    for (n = 0; n < filters.subarrays; n++) { mask[n] = ~0; }
    for (d = 0, len = dimensions.length; d < len; d++) {
      // The top bits of the ID are the subarray offset and the lower bits are the bit
      // offset of the "one" mask.
      id = dimensions[d].id();
      mask[id >> 7] &= ~(0x1 << (id & 0x3f));
    }
    return mask;
  }

  // Return true if the data element at index i is filtered IN.
  // Optionally, ignore the filters of any dimensions in the ignore_dimensions list.
  function isElementFiltered(i, ignore_dimensions) {
    var mask = maskForDimensions(ignore_dimensions || []);
    return filters.zeroExceptMask(i,mask);
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value, iterable) {

    if (typeof value === 'string') {
      var accessorPath = value;
      value = function(d) { return result(d, accessorPath); };
    }

    var dimension = {
      filter: filter,
      filterExact: filterExact,
      filterRange: filterRange,
      filterFunction: filterFunction,
      filterAll: filterAll,
      currentFilter: currentFilter,
      hasCurrentFilter: hasCurrentFilter,
      top: top,
      bottom: bottom,
      group: group,
      groupAll: groupAll,
      dispose: dispose,
      remove: dispose, // for backwards-compatibility
      accessor: value,
      id: function() { return id; }
    };

    var one, // lowest unset bit as mask, e.g., 00001000
        zero, // inverted one, e.g., 11110111
        offset, // offset into the filters arrays
        id, // unique ID for this dimension (reused when dimensions are disposed)
        values, // sorted, cached array
        index, // maps sorted value index -> record index (in data)
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        iterablesIndexCount,
        newIterablesIndexCount,
        iterablesIndexFilterStatus,
        newIterablesIndexFilterStatus,
        iterablesEmptyRows = [],
        sort = quicksort.by(function(i) { return newValues[i]; }),
        refilter = xfilterFilter.filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        filterValue, // the value used for filtering (value, array, function or undefined)
        filterValuePresent, // true if filterValue contains something
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0,
        t = 0,
        k;

    // Updating a dimension is a two-stage process. First, we must update the
    // associated filters for the newly-added records. Once all dimensions have
    // updated their filters, the groups are notified to update.
    dataListeners.unshift(preAdd);
    dataListeners.push(postAdd);

    removeDataListeners.push(removeData);

    // Add a new dimension in the filter bitmap and store the offset and bitmask.
    var tmp = filters.add();
    offset = tmp.offset;
    one = tmp.one;
    zero = ~one;

    // Create a unique ID for the dimension
    // IDs will be re-used if dimensions are disposed.
    // For internal use the ID is the subarray offset shifted left 7 bits or'd with the
    // bit offset of the set bit in the dimension's "one" mask.
    id = (offset << 7) | (Math.log(one) / Math.log(2));

    preAdd(data, 0, n);
    postAdd(data, 0, n);

    // Incorporates the specified new records into this dimension.
    // This function is responsible for updating filters, values, and index.
    function preAdd(newData, n0, n1) {

      if (iterable){
        // Count all the values
        t = 0;
        j = 0;
        k = [];

        for (var i0 = 0; i0 < newData.length; i0++) {
          for(j = 0, k = value(newData[i0]); j < k.length; j++) {
            t++;
          }
        }

        newValues = [];
        newIterablesIndexCount = crossfilter_range(newData.length);
        newIterablesIndexFilterStatus = crossfilter_index(t,1);
        var unsortedIndex = crossfilter_range(t);

        for (var l = 0, index1 = 0; index1 < newData.length; index1++) {
          k = value(newData[index1])
          //
          if(!k.length){
            newIterablesIndexCount[index1] = 0;
            iterablesEmptyRows.push(index1 + n0);
            continue;
          }
          newIterablesIndexCount[index1] = k.length
          for (j = 0; j < k.length; j++) {
            newValues.push(k[j]);
            unsortedIndex[l] = index1;
            l++;
          }
        }

        // Create the Sort map used to sort both the values and the valueToData indices
        var sortMap = sort(crossfilter_range(t), 0, t);

        // Use the sortMap to sort the newValues
        newValues = permute(newValues, sortMap);


        // Use the sortMap to sort the unsortedIndex map
        // newIndex should be a map of sortedValue -> crossfilterData
        newIndex = permute(unsortedIndex, sortMap)

      } else{
        // Permute new values into natural order using a standard sorted index.
        newValues = newData.map(value);
        newIndex = sort(crossfilter_range(n1), 0, n1);
        newValues = permute(newValues, newIndex);
      }

      if(iterable) {
        n1 = t;
      }

      // Bisect newValues to determine which new records are selected.
      var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1];
      if (refilterFunction) {
        for (var index2 = 0; index2 < n1; ++index2) {
          if (!refilterFunction(newValues[index2], index2)) {
            filters[offset][newIndex[index2] + n0] |= one;
            if(iterable) newIterablesIndexFilterStatus[index2] = 1;
          }
        }
      } else {
        for (var index3 = 0; index3 < lo1; ++index3) {
          filters[offset][newIndex[index3] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[index3] = 1;
        }
        for (var index4 = hi1; index4 < n1; ++index4) {
          filters[offset][newIndex[index4] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[index4] = 1;
        }
      }

      // If this dimension previously had no data, then we don't need to do the
      // more expensive merge operation; use the new values and index as-is.
      if (!n0) {
        values = newValues;
        index = newIndex;
        iterablesIndexCount = newIterablesIndexCount;
        iterablesIndexFilterStatus = newIterablesIndexFilterStatus;
        lo0 = lo1;
        hi0 = hi1;
        return;
      }



      var oldValues = values,
        oldIndex = index,
        oldIterablesIndexFilterStatus = iterablesIndexFilterStatus,
        old_n0,
        i1 = 0;

      i0 = 0;

      if(iterable){
        old_n0 = n0
        n0 = oldValues.length;
        n1 = t
      }

      // Otherwise, create new arrays into which to merge new and old.
      values = iterable ? new Array(n0 + n1) : new Array(n);
      index = iterable ? new Array(n0 + n1) : crossfilter_index(n, n);
      if(iterable) iterablesIndexFilterStatus = crossfilter_index(n0 + n1, 1);

      // Concatenate the newIterablesIndexCount onto the old one.
      if(iterable) {
        var oldiiclength = iterablesIndexCount.length;
        iterablesIndexCount = xfilterArray.arrayLengthen(iterablesIndexCount, n);
        for(var j=0; j+oldiiclength < n; j++) {
          iterablesIndexCount[j+oldiiclength] = newIterablesIndexCount[j];
        }
      }

      // Merge the old and new sorted values, and old and new index.
      var index5 = 0;
      for (; i0 < n0 && i1 < n1; ++index5) {
        if (oldValues[i0] < newValues[i1]) {
          values[index5] = oldValues[i0];
          if(iterable) iterablesIndexFilterStatus[index5] = oldIterablesIndexFilterStatus[i0];
          index[index5] = oldIndex[i0++];
        } else {
          values[index5] = newValues[i1];
          if(iterable) iterablesIndexFilterStatus[index5] = newIterablesIndexFilterStatus[i1];
          index[index5] = newIndex[i1++] + (iterable ? old_n0 : n0);
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++index5) {
        values[index5] = oldValues[i0];
        if(iterable) iterablesIndexFilterStatus[index5] = oldIterablesIndexFilterStatus[i0];
        index[index5] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++index5) {
        values[index5] = newValues[i1];
        if(iterable) iterablesIndexFilterStatus[index5] = newIterablesIndexFilterStatus[i1];
        index[index5] = newIndex[i1] + (iterable ? old_n0 : n0);
      }

      // Bisect again to recompute lo0 and hi0.
      bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
    }

    // When all filters have updated, notify index listeners of the new values.
    function postAdd(newData, n0, n1) {
      indexListeners.forEach(function(l) { l(newValues, newIndex, n0, n1); });
      newValues = newIndex = null;
    }

    function removeData(reIndex) {
      if (iterable) {
        for (var i0 = 0, i1 = 0; i0 < iterablesEmptyRows.length; i0++) {
          if (reIndex[iterablesEmptyRows[i0]] !== REMOVED_INDEX) {
            iterablesEmptyRows[i1] = reIndex[iterablesEmptyRows[i0]];
            i1++;
          }
        }
        iterablesEmptyRows.length = i1;
        for (i0 = 0, i1 = 0; i0 < n; i0++) {
          if (reIndex[i0] !== REMOVED_INDEX) {
            if (i1 !== i0) iterablesIndexCount[i1] = iterablesIndexCount[i0];
            i1++;
          }
        }
        iterablesIndexCount.length = i1;
      }
      // Rewrite our index, overwriting removed values
      var n0 = values.length;
      for (var i = 0, j = 0, oldDataIndex; i < n0; ++i) {
        oldDataIndex = index[i];
        if (reIndex[oldDataIndex] !== REMOVED_INDEX) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[oldDataIndex];
          if (iterable) {
            iterablesIndexFilterStatus[j] = iterablesIndexFilterStatus[i];
          }
          ++j;
        }
      }
      values.length = j;
      if (iterable) iterablesIndexFilterStatus.length = j;
      while (j < n0) index[j++] = 0;

      // Bisect again to recompute lo0 and hi0.
      var bounds = refilter(values);
      lo0 = bounds[0], hi0 = bounds[1];
    }

    // Updates the selected values based on the specified bounds [lo, hi].
    // This implementation is used by all the public filter methods.
    function filterIndexBounds(bounds) {

      var lo1 = bounds[0],
          hi1 = bounds[1];

      if (refilterFunction) {
        refilterFunction = null;
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; }, bounds[0] === 0 && bounds[1] === values.length);
        lo0 = lo1;
        hi0 = hi1;
        return dimension;
      }

      var i,
          j,
          k,
          added = [],
          removed = [],
          valueIndexAdded = [],
          valueIndexRemoved = [];


      // Fast incremental update based on previous lo index.
      if (lo1 < lo0) {
        for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
          added.push(index[i]);
          valueIndexAdded.push(i);
        }
      } else if (lo1 > lo0) {
        for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
          removed.push(index[i]);
          valueIndexRemoved.push(i);
        }
      }

      // Fast incremental update based on previous hi index.
      if (hi1 > hi0) {
        for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
          added.push(index[i]);
          valueIndexAdded.push(i);
        }
      } else if (hi1 < hi0) {
        for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
          removed.push(index[i]);
          valueIndexRemoved.push(i);
        }
      }

      if(!iterable) {
        // Flip filters normally.

        for(i=0; i<added.length; i++) {
          filters[offset][added[i]] ^= one;
        }

        for(i=0; i<removed.length; i++) {
          filters[offset][removed[i]] ^= one;
        }

      } else {
        // For iterables, we need to figure out if the row has been completely removed vs partially included
        // Only count a row as added if it is not already being aggregated. Only count a row
        // as removed if the last element being aggregated is removed.

        var newAdded = [];
        var newRemoved = [];
        for (i = 0; i < added.length; i++) {
          iterablesIndexCount[added[i]]++
          iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
          if(iterablesIndexCount[added[i]] === 1) {
            filters[offset][added[i]] ^= one;
            newAdded.push(added[i]);
          }
        }
        for (i = 0; i < removed.length; i++) {
          iterablesIndexCount[removed[i]]--
          iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
          if(iterablesIndexCount[removed[i]] === 0) {
            filters[offset][removed[i]] ^= one;
            newRemoved.push(removed[i]);
          }
        }

        added = newAdded;
        removed = newRemoved;

        // Now handle empty rows.
        if(bounds[0] === 0 && bounds[1] === values.length) {
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was not in the filter, so set the filter and add
              filters[offset][k] ^= one;
              added.push(k);
            }
          }
        } else {
          // filter in place - remove empty rows if necessary
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was in the filter, so set the filter and remove
              filters[offset][k] ^= one;
              removed.push(k);
            }
          }
        }
      }

      lo0 = lo1;
      hi0 = hi1;
      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
      triggerOnChange('filtered');
      return dimension;
    }

    // Filters this dimension using the specified range, value, or null.
    // If the range is null, this is equivalent to filterAll.
    // If the range is an array, this is equivalent to filterRange.
    // Otherwise, this is equivalent to filterExact.
    function filter(range) {
      return range == null
          ? filterAll() : Array.isArray(range)
          ? filterRange(range) : typeof range === "function"
          ? filterFunction(range)
          : filterExact(range);
    }

    // Filters this dimension to select the exact value.
    function filterExact(value) {
      filterValue = value;
      filterValuePresent = true;
      return filterIndexBounds((refilter = xfilterFilter.filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      filterValue = range;
      filterValuePresent = true;
      return filterIndexBounds((refilter = xfilterFilter.filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      filterValue = undefined;
      filterValuePresent = false;
      return filterIndexBounds((refilter = xfilterFilter.filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      filterValue = f;
      filterValuePresent = true;
      
      refilterFunction = f;
      refilter = xfilterFilter.filterAll;

      filterIndexFunction(f, false);

      var bounds = refilter(values);
      lo0 = bounds[0], hi0 = bounds[1];

      return dimension;
    }

    function filterIndexFunction(f, filterAll) {
      var i,
          k,
          x,
          added = [],
          removed = [],
          valueIndexAdded = [],
          valueIndexRemoved = [],
          indexLength = values.length;

      if(!iterable) {
        for (i = 0; i < indexLength; ++i) {
          if (!(filters[offset][k = index[i]] & one) ^ !!(x = f(values[i], i))) {
            if (x) added.push(k);
            else removed.push(k);
          }
        }
      }

      if(iterable) {
        for(i=0; i < indexLength; ++i) {
          if(f(values[i], i)) {
            added.push(index[i]);
            valueIndexAdded.push(i);
          } else {
            removed.push(index[i]);
            valueIndexRemoved.push(i);
          }
        }
      }

      if(!iterable) {
        for(i=0; i<added.length; i++) {
          if(filters[offset][added[i]] & one) filters[offset][added[i]] &= zero;
        }

        for(i=0; i<removed.length; i++) {
          if(!(filters[offset][removed[i]] & one)) filters[offset][removed[i]] |= one;
        }
      } else {

        var newAdded = [];
        var newRemoved = [];
        for (i = 0; i < added.length; i++) {
          // First check this particular value needs to be added
          if(iterablesIndexFilterStatus[valueIndexAdded[i]] === 1) {
            iterablesIndexCount[added[i]]++
            iterablesIndexFilterStatus[valueIndexAdded[i]] = 0;
            if(iterablesIndexCount[added[i]] === 1) {
              filters[offset][added[i]] ^= one;
              newAdded.push(added[i]);
            }
          }
        }
        for (i = 0; i < removed.length; i++) {
          // First check this particular value needs to be removed
          if(iterablesIndexFilterStatus[valueIndexRemoved[i]] === 0) {
            iterablesIndexCount[removed[i]]--
            iterablesIndexFilterStatus[valueIndexRemoved[i]] = 1;
            if(iterablesIndexCount[removed[i]] === 0) {
              filters[offset][removed[i]] ^= one;
              newRemoved.push(removed[i]);
            }
          }
        }

        added = newAdded;
        removed = newRemoved;

        // Now handle empty rows.
        if(filterAll) {
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if((filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was not in the filter, so set the filter and add
              filters[offset][k] ^= one;
              added.push(k);
            }
          }
        } else {
          // filter in place - remove empty rows if necessary
          for(i = 0; i < iterablesEmptyRows.length; i++) {
            if(!(filters[offset][k = iterablesEmptyRows[i]] & one)) {
              // Was in the filter, so set the filter and remove
              filters[offset][k] ^= one;
              removed.push(k);
            }
          }
        }
      }

      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
      triggerOnChange('filtered');
    }
    
    function currentFilter() {
      return filterValue;
    }
    
    function hasCurrentFilter() {
      return filterValuePresent;
    }

    // Returns the top K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function top(k, top_offset) {
      var array = [],
          i = hi0,
          j,
          toSkip = 0;

      if(top_offset && top_offset > 0) toSkip = top_offset;

      while (--i >= lo0 && k > 0) {
        if (filters.zero(j = index[i])) {
          if(toSkip > 0) {
            //skip matching row
            --toSkip;
          } else {
            array.push(data[j]);
            --k;
          }
        }
      }

      if(iterable){
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          // Add row with empty iterable column at the end
          if(filters.zero(j = iterablesEmptyRows[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
        }
      }

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k, bottom_offset) {
      var array = [],
          i,
          j,
          toSkip = 0;

      if(bottom_offset && bottom_offset > 0) toSkip = bottom_offset;

      if(iterable) {
        // Add row with empty iterable column at the top
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          if(filters.zero(j = iterablesEmptyRows[i])) {
            if(toSkip > 0) {
              //skip matching row
              --toSkip;
            } else {
              array.push(data[j]);
              --k;
            }
          }
        }
      }

      i = lo0;

      while (i < hi0 && k > 0) {
        if (filters.zero(j = index[i])) {
          if(toSkip > 0) {
            //skip matching row
            --toSkip;
          } else {
            array.push(data[j]);
            --k;
          }
        }
        i++;
      }

      return array;
    }

    // Adds a new group to this dimension, using the specified key function.
    function group(key) {
      var group = {
        top: top,
        all: all,
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        order: order,
        orderNatural: orderNatural,
        size: size,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      // Ensure that this group will be removed when the dimension is removed.
      dimensionGroups.push(group);

      var groups, // array of {key, value}
          groupIndex, // object id ↦ group id
          groupWidth = 8,
          groupCapacity = crossfilter_capacity(groupWidth),
          k = 0, // cardinality
          select,
          heap,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          update = crossfilter_null,
          reset = crossfilter_null,
          resetNeeded = true,
          groupAll = key === crossfilter_null,
          n0old;

      if (arguments.length < 1) key = crossfilter_identity;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the associated reduce values. It must also listen to
      // the parent dimension for when data is added, and compute new keys.
      filterListeners.push(update);
      indexListeners.push(add);
      removeDataListeners.push(removeData);

      // Incorporate any existing data into the grouping.
      add(values, index, 0, n);

      // Incorporates the specified new values into this group.
      // This function is responsible for updating groups and groupIndex.
      function add(newValues, newIndex, n0, n1) {

        if(iterable) {
          n0old = n0
          n0 = values.length - newValues.length
          n1 = newValues.length;
        }

        var oldGroups = groups,
            reIndex = iterable ? [] : crossfilter_index(k, groupCapacity),
            add = reduceAdd,
            remove = reduceRemove,
            initial = reduceInitial,
            k0 = k, // old cardinality
            i0 = 0, // index of old group
            i1 = 0, // index of new record
            j, // object id
            g0, // old group
            x0, // old key
            x1, // new key
            g, // group to add
            x; // key of group to add

        // If a reset is needed, we don't need to update the reduce values.
        if (resetNeeded) add = initial = crossfilter_null;
        if (resetNeeded) remove = initial = crossfilter_null;

        // Reset the new groups (k is a lower bound).
        // Also, make sure that groupIndex exists and is long enough.
        groups = new Array(k), k = 0;
        if(iterable){
          groupIndex = k0 ? groupIndex : [];
        }
        else{
          groupIndex = k0 > 1 ? xfilterArray.arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);
        }


        // Get the first old key (x0 of g0), if it exists.
        if (k0) x0 = (g0 = oldGroups[0]).key;

        // Find the first new key (x1), skipping NaN keys.
        while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) ++i1;

        // While new keys remain…
        while (i1 < n1) {

          // Determine the lesser of the two current keys; new and old.
          // If there are no old keys remaining, then always add the new key.
          if (g0 && x0 <= x1) {
            g = g0, x = x0;

            // Record the new index of the old group.
            reIndex[i0] = k;

            // Retrieve the next old key.
            g0 = oldGroups[++i0];
            if (g0) x0 = g0.key;
          } else {
            g = {key: x1, value: initial()}, x = x1;
          }

          // Add the lesser group.
          groups[k] = g;

          // Add any selected records belonging to the added group, while
          // advancing the new key and populating the associated group index.

          while (x1 <= x) {
            j = newIndex[i1] + (iterable ? n0old : n0)


            if(iterable){
              if(groupIndex[j]){
                groupIndex[j].push(k)
              }
              else{
                groupIndex[j] = [k]
              }
            }
            else{
              groupIndex[j] = k;
            }

            // Always add new values to groups. Only remove when not in filter.
            // This gives groups full information on data life-cycle.
            g.value = add(g.value, data[j], true);
            if (!filters.zeroExcept(j, offset, zero)) g.value = remove(g.value, data[j], false);
            if (++i1 >= n1) break;
            x1 = key(newValues[i1]);
          }

          groupIncrement();
        }

        // Add any remaining old groups that were greater th1an all new keys.
        // No incremental reduce is needed; these groups have no new records.
        // Also record the new index of the old group.
        while (i0 < k0) {
          groups[reIndex[i0] = k] = oldGroups[i0++];
          groupIncrement();
        }


        // Fill in gaps with empty arrays where there may have been rows with empty iterables
        if(iterable){
          for (var index1 = 0; index1 < n; index1++) {
            if(!groupIndex[index1]){
              groupIndex[index1] = [];
            }
          }
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if(k > i0){
          if(iterable){
            for (i0 = 0; i0 < n0old; ++i0) {
              for (index1 = 0; index1 < groupIndex[i0].length; index1++) {
                groupIndex[i0][index1] = reIndex[groupIndex[i0][index1]];
              }
            }
          }
          else{
            for (i0 = 0; i0 < n0; ++i0) {
              groupIndex[i0] = reIndex[groupIndex[i0]];
            }
          }
        }

        // Modify the update and reset behavior based on the cardinality.
        // If the cardinality is less than or equal to one, then the groupIndex
        // is not needed. If the cardinality is zero, then there are no records
        // and therefore no groups to update or reset. Note that we also must
        // change the registered listener to point to the new method.
        j = filterListeners.indexOf(update);
        if (k > 1 || iterable) {
          update = updateMany;
          reset = resetMany;
        } else {
          if (!k && groupAll) {
            k = 1;
            groups = [{key: null, value: initial()}];
          }
          if (k === 1) {
            update = updateOne;
            reset = resetOne;
          } else {
            update = crossfilter_null;
            reset = crossfilter_null;
          }
          groupIndex = null;
        }
        filterListeners[j] = update;

        // Count the number of added groups,
        // and widen the group index as needed.
        function groupIncrement() {
          if(iterable){
            k++
            return
          }
          if (++k === groupCapacity) {
            reIndex = xfilterArray.arrayWiden(reIndex, groupWidth <<= 1);
            groupIndex = xfilterArray.arrayWiden(groupIndex, groupWidth);
            groupCapacity = crossfilter_capacity(groupWidth);
          }
        }
      }

      function removeData(reIndex) {
        if (k > 1 || iterable) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK),
              i,
              i0,
              j;

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          if (!iterable) {
            for (i = 0, j = 0; i < n; ++i) {
              if (reIndex[i] !== REMOVED_INDEX) {
                seenGroups[groupIndex[j] = groupIndex[i]] = 1;
                ++j;
              }
            }
          } else {
            for (i = 0, j = 0; i < n; ++i) {
              if (reIndex[i] !== REMOVED_INDEX) {
                groupIndex[j] = groupIndex[i];
                for (i0 = 0; i0 < groupIndex[j].length; i0++) {
                  seenGroups[groupIndex[j][i0]] = 1;
                }
                ++j;
              }
            }
          }

          // Reassemble groups including only those groups that were referred
          // to by matching group index entries.  Note the new group index in
          // seenGroups.
          groups = [], k = 0;
          for (i = 0; i < oldK; ++i) {
            if (seenGroups[i]) {
              seenGroups[i] = k++;
              groups.push(oldGroups[i]);
            }
          }

          if (k > 1 || iterable) {
            // Reindex the group index using seenGroups to find the new index.
            if (!iterable) {
              for (i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
            } else {
              for (i = 0; i < j; ++i) {
                for (i0 = 0; i0 < groupIndex[i].length; ++i0) {
                  groupIndex[i][i0] = seenGroups[groupIndex[i][i0]];
                }
              }
            }
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1 || iterable
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var index3 = 0; index3 < n; ++index3) if (reIndex[index3] !== REMOVED_INDEX) return;
          groups = [], k = 0;
          filterListeners[filterListeners.indexOf(update)] =
          update = reset = crossfilter_null;
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is greater than 1.
      // notFilter indicates a crossfilter.add/remove operation.
      function updateMany(filterOne, filterOffset, added, removed, notFilter) {

        if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

        var i,
            j,
            k,
            n,
            g;

        if(iterable){
          // Add the added values.
          for (i = 0, n = added.length; i < n; ++i) {
            if (filters.zeroExcept(k = added[i], offset, zero)) {
              for (j = 0; j < groupIndex[k].length; j++) {
                g = groups[groupIndex[k][j]];
                g.value = reduceAdd(g.value, data[k], false, j);
              }
            }
          }

          // Remove the removed values.
          for (i = 0, n = removed.length; i < n; ++i) {
            if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
              for (j = 0; j < groupIndex[k].length; j++) {
                g = groups[groupIndex[k][j]];
                g.value = reduceRemove(g.value, data[k], notFilter, j);
              }
            }
          }
          return;
        }

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zeroExcept(k = added[i], offset, zero)) {
            g = groups[groupIndex[k]];
            g.value = reduceAdd(g.value, data[k], false);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
            g = groups[groupIndex[k]];
            g.value = reduceRemove(g.value, data[k], notFilter);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is 1.
      // notFilter indicates a crossfilter.add/remove operation.
      function updateOne(filterOne, filterOffset, added, removed, notFilter) {
        if ((filterOne === one && filterOffset === offset) || resetNeeded) return;

        var i,
            k,
            n,
            g = groups[0];

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zeroExcept(k = added[i], offset, zero)) {
            g.value = reduceAdd(g.value, data[k], false);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if (filters.onlyExcept(k = removed[i], offset, zero, filterOffset, filterOne)) {
            g.value = reduceRemove(g.value, data[k], notFilter);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is greater than 1.
      function resetMany() {
        var i,
            j,
            g;

        // Reset all group values.
        for (i = 0; i < k; ++i) {
          groups[i].value = reduceInitial();
        }

        // We add all records and then remove filtered records so that reducers
        // can build an 'unfiltered' view even if there are already filters in
        // place on other dimensions.
        if(iterable){
          for (i = 0; i < n; ++i) {
            for (j = 0; j < groupIndex[i].length; j++) {
              g = groups[groupIndex[i][j]];
              g.value = reduceAdd(g.value, data[i], true, j);
            }
          }
          for (i = 0; i < n; ++i) {
            if (!filters.zeroExcept(i, offset, zero)) {
              for (j = 0; j < groupIndex[i].length; j++) {
                g = groups[groupIndex[i][j]];
                g.value = reduceRemove(g.value, data[i], false, j);
              }
            }
          }
          return;
        }

        for (i = 0; i < n; ++i) {
          g = groups[groupIndex[i]];
          g.value = reduceAdd(g.value, data[i], true);
        }
        for (i = 0; i < n; ++i) {
          if (!filters.zeroExcept(i, offset, zero)) {
            g = groups[groupIndex[i]];
            g.value = reduceRemove(g.value, data[i], false);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is 1.
      function resetOne() {
        var i,
            g = groups[0];

        // Reset the singleton group values.
        g.value = reduceInitial();

        // We add all records and then remove filtered records so that reducers
        // can build an 'unfiltered' view even if there are already filters in
        // place on other dimensions.
        for (i = 0; i < n; ++i) {
          g.value = reduceAdd(g.value, data[i], true);
        }

        for (i = 0; i < n; ++i) {
          if (!filters.zeroExcept(i, offset, zero)) {
            g.value = reduceRemove(g.value, data[i], false);
          }
        }
      }

      // Returns the array of group values, in the dimension's natural order.
      function all() {
        if (resetNeeded) reset(), resetNeeded = false;
        return groups;
      }

      // Returns a new array containing the top K group values, in reduce order.
      function top(k) {
        var top = select(all(), 0, groups.length, k);
        return heap.sort(top, 0, top.length);
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce values, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), crossfilter_zero);
      }

      // Sets the reduce order, using the specified accessor.
      function order(value) {
        select = xfilterHeapselect.by(valueOf);
        heap = xfilterHeap.by(valueOf);
        function valueOf(d) { return value(d.value); }
        return group;
      }

      // A convenience method for natural ordering by reduce value.
      function orderNatural() {
        return order(crossfilter_identity);
      }

      // Returns the cardinality of this group, irrespective of any filters.
      function size() {
        return k;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i, 1);
        i = indexListeners.indexOf(add);
        if (i >= 0) indexListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        i = dimensionGroups.indexOf(group);
        if (i >= 0) dimensionGroups.splice(i, 1);
        return group;
      }

      return reduceCount().orderNatural();
    }

    // A convenience function for generating a singleton group.
    function groupAll() {
      var g = group(crossfilter_null), all = g.all;
      delete g.all;
      delete g.top;
      delete g.order;
      delete g.orderNatural;
      delete g.size;
      g.value = function() { return all()[0].value; };
      return g;
    }

    // Removes this dimension and associated groups and event listeners.
    function dispose() {
      dimensionGroups.forEach(function(group) { group.dispose(); });
      var i = dataListeners.indexOf(preAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = dataListeners.indexOf(postAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = removeDataListeners.indexOf(removeData);
      if (i >= 0) removeDataListeners.splice(i, 1);
      filters.masks[offset] &= zero;
      return filterAll();
    }

    return dimension;
  }

  // A convenience method for groupAll on a dummy dimension.
  // This implementation can be optimized since it always has cardinality 1.
  function groupAll() {
    var group = {
      reduce: reduce,
      reduceCount: reduceCount,
      reduceSum: reduceSum,
      value: value,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var reduceValue,
        reduceAdd,
        reduceRemove,
        reduceInitial,
        resetNeeded = true;

    // The group listens to the crossfilter for when any dimension changes, so
    // that it can update the reduce value. It must also listen to the parent
    // dimension for when data is added.
    filterListeners.push(update);
    dataListeners.push(add);

    // For consistency; actually a no-op since resetNeeded is true.
    add(data, 0, n);

    // Incorporates the specified new values into this group.
    function add(newData, n0) {
      var i;

      if (resetNeeded) return;

      // Cycle through all the values.
      for (i = n0; i < n; ++i) {

        // Add all values all the time.
        reduceValue = reduceAdd(reduceValue, data[i], true);

        // Remove the value if filtered.
        if (!filters.zero(i)) {
          reduceValue = reduceRemove(reduceValue, data[i], false);
        }
      }
    }

    // Reduces the specified selected or deselected records.
    function update(filterOne, filterOffset, added, removed, notFilter) {
      var i,
          k,
          n;

      if (resetNeeded) return;

      // Add the added values.
      for (i = 0, n = added.length; i < n; ++i) {
        if (filters.zero(k = added[i])) {
          reduceValue = reduceAdd(reduceValue, data[k], notFilter);
        }
      }

      // Remove the removed values.
      for (i = 0, n = removed.length; i < n; ++i) {
        if (filters.only(k = removed[i], filterOffset, filterOne)) {
          reduceValue = reduceRemove(reduceValue, data[k], notFilter);
        }
      }
    }

    // Recomputes the group reduce value from scratch.
    function reset() {
      var i;

      reduceValue = reduceInitial();

      // Cycle through all the values.
      for (i = 0; i < n; ++i) {

        // Add all values all the time.
        reduceValue = reduceAdd(reduceValue, data[i], true);

        // Remove the value if it is filtered.
        if (!filters.zero(i)) {
          reduceValue = reduceRemove(reduceValue, data[i], false);
        }
      }
    }

    // Sets the reduce behavior for this group to use the specified functions.
    // This method lazily recomputes the reduce value, waiting until needed.
    function reduce(add, remove, initial) {
      reduceAdd = add;
      reduceRemove = remove;
      reduceInitial = initial;
      resetNeeded = true;
      return group;
    }

    // A convenience method for reducing by count.
    function reduceCount() {
      return reduce(xfilterReduce.reduceIncrement, xfilterReduce.reduceDecrement, crossfilter_zero);
    }

    // A convenience method for reducing by sum(value).
    function reduceSum(value) {
      return reduce(xfilterReduce.reduceAdd(value), xfilterReduce.reduceSubtract(value), crossfilter_zero);
    }

    // Returns the computed reduce value.
    function value() {
      if (resetNeeded) reset(), resetNeeded = false;
      return reduceValue;
    }

    // Removes this group and associated event listeners.
    function dispose() {
      var i = filterListeners.indexOf(update);
      if (i >= 0) filterListeners.splice(i, 1);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i, 1);
      return group;
    }

    return reduceCount();
  }

  // Returns the number of records in this crossfilter, irrespective of any filters.
  function size() {
    return n;
  }

  // Returns the raw row data contained in this crossfilter
  function all(){
    return data;
  }

  // Returns row data with all dimension filters applied, except for filters in ignore_dimensions
  function allFiltered(ignore_dimensions) {
    var array = [],
        i = 0,
        mask = maskForDimensions(ignore_dimensions || []);

      for (i = 0; i < n; i++) {
        if (filters.zeroExceptMask(i, mask)) {
          array.push(data[i]);
        }
      }

      return array;
  }

  function onChange(cb){
    if(typeof cb !== 'function'){
      /* eslint no-console: 0 */
      console.warn('onChange callback parameter must be a function!');
      return;
    }
    callbacks.push(cb);
    return function(){
      callbacks.splice(callbacks.indexOf(cb), 1);
    };
  }

  function triggerOnChange(eventName){
    for (var i = 0; i < callbacks.length; i++) {
      callbacks[i](eventName);
    }
  }

  return arguments.length
      ? add(arguments[0])
      : crossfilter;
}

// Returns an array of size n, big enough to store ids up to m.
function crossfilter_index(n, m) {
  return (m < 0x101
      ? xfilterArray.array8 : m < 0x10001
      ? xfilterArray.array16
      : xfilterArray.array32)(n);
}

// Constructs a new array of size n, with sequential values from 0 to n - 1.
function crossfilter_range(n) {
  var range = crossfilter_index(n, n);
  for (var i = -1; ++i < n;) range[i] = i;
  return range;
}

function crossfilter_capacity(w) {
  return w === 8
      ? 0x100 : w === 16
      ? 0x10000
      : 0x100000000;
}

},{"./../package.json":2,"./array":3,"./bisect":4,"./filter":6,"./heap":7,"./heapselect":8,"./identity":9,"./insertionsort":10,"./null":11,"./permute":12,"./quicksort":13,"./reduce":14,"./zero":15,"lodash.result":16}],6:[function(require,module,exports){
'use strict';

function crossfilter_filterExact(bisect, value) {
  return function(values) {
    var n = values.length;
    return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
  };
}

function crossfilter_filterRange(bisect, range) {
  var min = range[0],
      max = range[1];
  return function(values) {
    var n = values.length;
    return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
  };
}

function crossfilter_filterAll(values) {
  return [0, values.length];
}

module.exports = {
  filterExact: crossfilter_filterExact,
  filterRange: crossfilter_filterRange,
  filterAll: crossfilter_filterAll
};

},{}],7:[function(require,module,exports){
'use strict';

var crossfilter_identity = require('./identity');

function heap_by(f) {

  // Builds a binary heap within the specified array a[lo:hi]. The heap has the
  // property such that the parent a[lo+i] is always less than or equal to its
  // two children: a[lo+2*i+1] and a[lo+2*i+2].
  function heap(a, lo, hi) {
    var n = hi - lo,
        i = (n >>> 1) + 1;
    while (--i > 0) sift(a, i, n, lo);
    return a;
  }

  // Sorts the specified array a[lo:hi] in descending order, assuming it is
  // already a heap.
  function sort(a, lo, hi) {
    var n = hi - lo,
        t;
    while (--n > 0) t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
    return a;
  }

  // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
  // slice of array a[lo:lo+n]. This method can also be used to update the heap
  // incrementally, without incurring the full cost of reconstructing the heap.
  function sift(a, i, n, lo) {
    var d = a[--lo + i],
        x = f(d),
        child;
    while ((child = i << 1) <= n) {
      if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
      if (x <= f(a[lo + child])) break;
      a[lo + i] = a[lo + child];
      i = child;
    }
    a[lo + i] = d;
  }

  heap.sort = sort;
  return heap;
}

module.exports = heap_by(crossfilter_identity);
module.exports.by = heap_by;

},{"./identity":9}],8:[function(require,module,exports){
'use strict';

var crossfilter_identity = require('./identity');
var xFilterHeap = require('./heap');

function heapselect_by(f) {
  var heap = xFilterHeap.by(f);

  // Returns a new array containing the top k elements in the array a[lo:hi].
  // The returned array is not sorted, but maintains the heap property. If k is
  // greater than hi - lo, then fewer than k elements will be returned. The
  // order of elements in a is unchanged by this operation.
  function heapselect(a, lo, hi, k) {
    var queue = new Array(k = Math.min(hi - lo, k)),
        min,
        i,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (f(d = a[lo]) > min) {
          queue[0] = d;
          min = f(heap(queue, 0, k)[0]);
        }
      } while (++lo < hi);
    }

    return queue;
  }

  return heapselect;
}

module.exports = heapselect_by(crossfilter_identity);
module.exports.by = heapselect_by; // assign the raw function to the export as well

},{"./heap":7,"./identity":9}],9:[function(require,module,exports){
'use strict';

function crossfilter_identity(d) {
  return d;
}

module.exports = crossfilter_identity;

},{}],10:[function(require,module,exports){
'use strict';

var crossfilter_identity = require('./identity');

function insertionsort_by(f) {

  function insertionsort(a, lo, hi) {
    for (var i = lo + 1; i < hi; ++i) {
      for (var j = i, t = a[i], x = f(t); j > lo && f(a[j - 1]) > x; --j) {
        a[j] = a[j - 1];
      }
      a[j] = t;
    }
    return a;
  }

  return insertionsort;
}

module.exports = insertionsort_by(crossfilter_identity);
module.exports.by = insertionsort_by;

},{"./identity":9}],11:[function(require,module,exports){
'use strict';

function crossfilter_null() {
  return null;
}

module.exports = crossfilter_null;

},{}],12:[function(require,module,exports){
'use strict';

function permute(array, index, deep) {
  for (var i = 0, n = index.length, copy = deep ? JSON.parse(JSON.stringify(array)) : new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}

module.exports = permute;

},{}],13:[function(require,module,exports){
var crossfilter_identity = require('./identity');
var xFilterInsertionsort = require('./insertionsort');

// Algorithm designed by Vladimir Yaroslavskiy.
// Implementation based on the Dart project; see NOTICE and AUTHORS for details.

function quicksort_by(f) {
  var insertionsort = xFilterInsertionsort.by(f);

  function sort(a, lo, hi) {
    return (hi - lo < quicksort_sizeThreshold
        ? insertionsort
        : quicksort)(a, lo, hi);
  }

  function quicksort(a, lo, hi) {
    // Compute the two pivots by looking at 5 elements.
    var sixth = (hi - lo) / 6 | 0,
        i1 = lo + sixth,
        i5 = hi - 1 - sixth,
        i3 = lo + hi - 1 >> 1,  // The midpoint.
        i2 = i3 - sixth,
        i4 = i3 + sixth;

    var e1 = a[i1], x1 = f(e1),
        e2 = a[i2], x2 = f(e2),
        e3 = a[i3], x3 = f(e3),
        e4 = a[i4], x4 = f(e4),
        e5 = a[i5], x5 = f(e5);

    var t;

    // Sort the selected 5 elements using a sorting network.
    if (x1 > x2) t = e1, e1 = e2, e2 = t, t = x1, x1 = x2, x2 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;
    if (x1 > x3) t = e1, e1 = e3, e3 = t, t = x1, x1 = x3, x3 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x1 > x4) t = e1, e1 = e4, e4 = t, t = x1, x1 = x4, x4 = t;
    if (x3 > x4) t = e3, e3 = e4, e4 = t, t = x3, x3 = x4, x4 = t;
    if (x2 > x5) t = e2, e2 = e5, e5 = t, t = x2, x2 = x5, x5 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;

    var pivot1 = e2, pivotValue1 = x2,
        pivot2 = e4, pivotValue2 = x4;

    // e2 and e4 have been saved in the pivot variables. They will be written
    // back, once the partitioning is finished.
    a[i1] = e1;
    a[i2] = a[lo];
    a[i3] = e3;
    a[i4] = a[hi - 1];
    a[i5] = e5;

    var less = lo + 1,   // First element in the middle partition.
        great = hi - 2;  // Last element in the middle partition.

    // Note that for value comparison, <, <=, >= and > coerce to a primitive via
    // Object.prototype.valueOf; == and === do not, so in order to be consistent
    // with natural order (such as for Date objects), we must do two compares.
    var pivotsEqual = pivotValue1 <= pivotValue2 && pivotValue1 >= pivotValue2;
    if (pivotsEqual) {

      // Degenerated case where the partitioning becomes a dutch national flag
      // problem.
      //
      // [ |  < pivot  | == pivot | unpartitioned | > pivot  | ]
      //  ^             ^          ^             ^            ^
      // left         less         k           great         right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1) for x in ]left, less[ : x < pivot.
      //   2) for x in [less, k[ : x == pivot.
      //   3) for x in ]great, right[ : x > pivot.
      for (var k = less; k <= great; ++k) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else if (xk > pivotValue1) {

          // Find the first element <= pivot in the range [k - 1, great] and
          // put [:ek:] there. We know that such an element must exist:
          // When k == less, then el3 (which is equal to pivot) lies in the
          // interval. Otherwise a[k - 1] == pivot and the search stops at k-1.
          // Note that in the latter case invariant 2 will be violated for a
          // short amount of time. The invariant will be restored when the
          // pivots are put into their final positions.
          /* eslint no-constant-condition: 0 */
          while (true) {
            var greatValue = f(a[great]);
            if (greatValue > pivotValue1) {
              great--;
              // This is the only location in the while-loop where a new
              // iteration is started.
              continue;
            } else if (greatValue < pivotValue1) {
              // Triple exchange.
              a[k] = a[less];
              a[less++] = a[great];
              a[great--] = ek;
              break;
            } else {
              a[k] = a[great];
              a[great--] = ek;
              // Note: if great < k then we will exit the outer loop and fix
              // invariant 2 (which we just violated).
              break;
            }
          }
        }
      }
    } else {

      // We partition the list into three parts:
      //  1. < pivot1
      //  2. >= pivot1 && <= pivot2
      //  3. > pivot2
      //
      // During the loop we have:
      // [ | < pivot1 | >= pivot1 && <= pivot2 | unpartitioned  | > pivot2  | ]
      //  ^            ^                        ^              ^             ^
      // left         less                     k              great        right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1. for x in ]left, less[ : x < pivot1
      //   2. for x in [less, k[ : pivot1 <= x && x <= pivot2
      //   3. for x in ]great, right[ : x > pivot2
      (function () { // isolate scope
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else {
          if (xk > pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue > pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] <= pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] >= pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
      })(); // isolate scope
    }

    // Move pivots into their final positions.
    // We shrunk the list from both sides (a[left] and a[right] have
    // meaningless values in them) and now we move elements from the first
    // and third partition into these locations so that we can store the
    // pivots.
    a[lo] = a[less - 1];
    a[less - 1] = pivot1;
    a[hi - 1] = a[great + 1];
    a[great + 1] = pivot2;

    // The list is now partitioned into three partitions:
    // [ < pivot1   | >= pivot1 && <= pivot2   |  > pivot2   ]
    //  ^            ^                        ^             ^
    // left         less                     great        right

    // Recursive descent. (Don't include the pivot values.)
    sort(a, lo, less - 1);
    sort(a, great + 2, hi);

    if (pivotsEqual) {
      // All elements in the second partition are equal to the pivot. No
      // need to sort them.
      return a;
    }

    // In theory it should be enough to call _doSort recursively on the second
    // partition.
    // The Android source however removes the pivot elements from the recursive
    // call if the second partition is too large (more than 2/3 of the list).
    if (less < i1 && great > i5) {

      (function () { // isolate scope
      var lessValue, greatValue;
      while ((lessValue = f(a[less])) <= pivotValue1 && lessValue >= pivotValue1) ++less;
      while ((greatValue = f(a[great])) <= pivotValue2 && greatValue >= pivotValue2) --great;

      // Copy paste of the previous 3-way partitioning with adaptions.
      //
      // We partition the list into three parts:
      //  1. == pivot1
      //  2. > pivot1 && < pivot2
      //  3. == pivot2
      //
      // During the loop we have:
      // [ == pivot1 | > pivot1 && < pivot2 | unpartitioned  | == pivot2 ]
      //              ^                      ^              ^
      //            less                     k              great
      //
      // Invariants:
      //   1. for x in [ *, less[ : x == pivot1
      //   2. for x in [less, k[ : pivot1 < x && x < pivot2
      //   3. for x in ]great, * ] : x == pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk <= pivotValue1 && xk >= pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          less++;
        } else {
          if (xk <= pivotValue2 && xk >= pivotValue2) {
            /* eslint no-constant-condition: 0 */
            while (true) {
              greatValue = f(a[great]);
              if (greatValue <= pivotValue2 && greatValue >= pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] < pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] == pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
      })(); // isolate scope

    }

    // The second partition has now been cleared of pivot elements and looks
    // as follows:
    // [  *  |  > pivot1 && < pivot2  | * ]
    //        ^                      ^
    //       less                  great
    // Sort the second partition using recursive descent.

    // The second partition looks as follows:
    // [  *  |  >= pivot1 && <= pivot2  | * ]
    //        ^                        ^
    //       less                    great
    // Simply sort it by recursive descent.

    return sort(a, less, great + 1);
  }

  return sort;
}

var quicksort_sizeThreshold = 32;

module.exports = quicksort_by(crossfilter_identity);
module.exports.by = quicksort_by;

},{"./identity":9,"./insertionsort":10}],14:[function(require,module,exports){
'use strict';

function crossfilter_reduceIncrement(p) {
  return p + 1;
}

function crossfilter_reduceDecrement(p) {
  return p - 1;
}

function crossfilter_reduceAdd(f) {
  return function(p, v) {
    return p + +f(v);
  };
}

function crossfilter_reduceSubtract(f) {
  return function(p, v) {
    return p - f(v);
  };
}

module.exports = {
  reduceIncrement: crossfilter_reduceIncrement,
  reduceDecrement: crossfilter_reduceDecrement,
  reduceAdd: crossfilter_reduceAdd,
  reduceSubtract: crossfilter_reduceSubtract
};

},{}],15:[function(require,module,exports){
'use strict';

function crossfilter_zero() {
  return 0;
}

module.exports = crossfilter_zero;

},{}],16:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/,
    reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype,
    funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var Symbol = root.Symbol,
    splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = (nativeCreate && value === undefined) ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash,
    'map': new (Map || ListCache),
    'string': new Hash
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key)
    ? data[typeof key == 'string' ? 'string' : 'hash']
    : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value;
  if (type == 'number' || type == 'symbol' || type == 'boolean' ||
      value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) ||
    (object != null && value in Object(object));
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value;
  return (type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean')
    ? (value !== '__proto__')
    : (value === null);
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  string = toString(string);

  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || (resolver && typeof resolver != 'function')) {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache);
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && typeof value == 'object';
}

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && objectToString.call(value) == symbolTag);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/**
 * This method is like `_.get` except that if the resolved value is a
 * function it's invoked with the `this` binding of its parent object and
 * its result is returned.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to resolve.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c1': 3, 'c2': _.constant(4) } }] };
 *
 * _.result(object, 'a[0].b.c1');
 * // => 3
 *
 * _.result(object, 'a[0].b.c2');
 * // => 4
 *
 * _.result(object, 'a[0].b.c3', 'default');
 * // => 'default'
 *
 * _.result(object, 'a[0].b.c3', _.constant('default'));
 * // => 'default'
 */
function result(object, path, defaultValue) {
  path = isKey(path, object) ? [path] : castPath(path);

  var index = -1,
      length = path.length;

  // Ensure the loop is entered when path is empty.
  if (!length) {
    object = undefined;
    length = 1;
  }
  while (++index < length) {
    var value = object == null ? undefined : object[toKey(path[index])];
    if (value === undefined) {
      index = length;
      value = defaultValue;
    }
    object = isFunction(value) ? value.call(object) : value;
  }
  return object;
}

module.exports = result;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],17:[function(require,module,exports){
var reductio_parameters = require('./parameters.js');

_assign = function assign(target) {
	if (target == null) {
		throw new TypeError('Cannot convert undefined or null to object');
	}

	var output = Object(target);
	for (var index = 1; index < arguments.length; ++index) {
		var source = arguments[index];
		if (source != null) {
			for (var nextKey in source) {
				if(source.hasOwnProperty(nextKey)) {
					output[nextKey] = source[nextKey];
				}
			}
		}
	}
	return output;
};

function accessor_build(obj, p) {
	// obj.order = function(value) {
	// 	if (!arguments.length) return p.order;
	// 	p.order = value;
	// 	return obj;
	// };

	// Converts a string to an accessor function
	function accessorify(v) {
		if( typeof v === 'string' ) {
			// Rewrite to a function
			var tempValue = v;
			var func = function (d) { return d[tempValue]; }
			return func;
		} else {
			return v;
		}
	}

	// Converts a string to an accessor function
	function accessorifyNumeric(v) {
		if( typeof v === 'string' ) {
			// Rewrite to a function
			var tempValue = v;
			var func = function (d) { return +d[tempValue]; }
			return func;
		} else {
			return v;
		}
	}

	obj.fromObject = function(value) {
		if(!arguments.length) return p;
		_assign(p, value);
		return obj;
	};

	obj.toObject = function() {
		return p;
	};

	obj.count = function(value, propName) {
		if (!arguments.length) return p.count;
    if (!propName) {
      propName = 'count';
    }
		p.count = propName;
		return obj;
	};

	obj.sum = function(value) {
		if (!arguments.length) return p.sum;

		value = accessorifyNumeric(value);

		p.sum = value;
		return obj;
	};

	obj.avg = function(value) {
		if (!arguments.length) return p.avg;

		value = accessorifyNumeric(value);

		// We can take an accessor function, a boolean, or a string
		if( typeof value === 'function' ) {
			if(p.sum && p.sum !== value) console.warn('SUM aggregation is being overwritten by AVG aggregation');
			p.sum = value;
			p.avg = true;
			p.count = 'count';
		} else {
			p.avg = value;
		}
		return obj;
	};

	obj.exception = function(value) {
		if (!arguments.length) return p.exceptionAccessor;

		value = accessorify(value);

		p.exceptionAccessor = value;
		return obj;
	};

	obj.filter = function(value) {
		if (!arguments.length) return p.filter;
		p.filter = value;
		return obj;
	};

	obj.valueList = function(value) {
		if (!arguments.length) return p.valueList;

		value = accessorify(value);

		p.valueList = value;
		return obj;
	};

	obj.median = function(value) {
		if (!arguments.length) return p.median;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by median aggregation');
			p.valueList = value;
		}
		p.median = value;
		return obj;
	};

	obj.min = function(value) {
		if (!arguments.length) return p.min;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by min aggregation');
			p.valueList = value;
		}
		p.min = value;
		return obj;
	};

	obj.max = function(value) {
		if (!arguments.length) return p.max;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList && p.valueList !== value) console.warn('VALUELIST accessor is being overwritten by max aggregation');
			p.valueList = value;
		}
		p.max = value;
		return obj;
	};

	obj.exceptionCount = function(value) {
		if (!arguments.length) return p.exceptionCount;

		value = accessorify(value);

		if( typeof value === 'function' ) {
			if(p.exceptionAccessor && p.exceptionAccessor !== value) console.warn('EXCEPTION accessor is being overwritten by exception count aggregation');
			p.exceptionAccessor = value;
			p.exceptionCount = true;
		} else {
			p.exceptionCount = value;
		}
		return obj;
	};

	obj.exceptionSum = function(value) {
		if (!arguments.length) return p.exceptionSum;

		value = accessorifyNumeric(value);

		p.exceptionSum = value;
		return obj;
	};

	obj.histogramValue = function(value) {
		if (!arguments.length) return p.histogramValue;

		value = accessorifyNumeric(value);

		p.histogramValue = value;
		return obj;
	};

	obj.histogramBins = function(value) {
		if (!arguments.length) return p.histogramThresholds;
		p.histogramThresholds = value;
		return obj;
	};

	obj.std = function(value) {
		if (!arguments.length) return p.std;

		value = accessorifyNumeric(value);

		if(typeof(value) === 'function') {
			p.sumOfSquares = value;
			p.sum = value;
			p.count = 'count';
			p.std = true;
		} else {
			p.std = value;
		}
		return obj;
	};

	obj.sumOfSq = function(value) {
		if (!arguments.length) return p.sumOfSquares;

		value = accessorifyNumeric(value);

		p.sumOfSquares = value;
		return obj;
	};

	obj.value = function(value, accessor) {
		if (!arguments.length || typeof value !== 'string' ) {
			console.error("'value' requires a string argument.");
		} else {
			if(!p.values) p.values = {};
			p.values[value] = {};
			p.values[value].parameters = reductio_parameters();
			accessor_build(p.values[value], p.values[value].parameters);
			if(accessor) p.values[value].accessor = accessor;
			return p.values[value];
		}
	};

	obj.nest = function(keyAccessorArray) {
		if(!arguments.length) return p.nestKeys;

		keyAccessorArray.map(accessorify);

		p.nestKeys = keyAccessorArray;
		return obj;
	};

	obj.alias = function(propAccessorObj) {
		if(!arguments.length) return p.aliasKeys;
		p.aliasKeys = propAccessorObj;
		return obj;
	};

	obj.aliasProp = function(propAccessorObj) {
		if(!arguments.length) return p.aliasPropKeys;
		p.aliasPropKeys = propAccessorObj;
		return obj;
	};

	obj.groupAll = function(groupTest) {
		if(!arguments.length) return p.groupAll;
		p.groupAll = groupTest;
		return obj;
	};

	obj.dataList = function(value) {
		if (!arguments.length) return p.dataList;
		p.dataList = value;
		return obj;
	};

	obj.custom = function(addRemoveInitialObj) {
		if (!arguments.length) return p.custom;
		p.custom = addRemoveInitialObj;
		return obj;
	};

}

var reductio_accessors = {
	build: accessor_build
};

module.exports = reductio_accessors;

},{"./parameters.js":34}],18:[function(require,module,exports){
var reductio_alias = {
	initial: function(prior, path, obj) {
		return function (p) {
			if(prior) p = prior(p);
			function buildAliasFunction(key){
				return function(){
					return obj[key](path(p));
				};
			}
			for(var prop in obj) {
				path(p)[prop] = buildAliasFunction(prop);
			}
			return p;
		};
	}
};

module.exports = reductio_alias;
},{}],19:[function(require,module,exports){
var reductio_alias_prop = {
	add: function (obj, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			for(var prop in obj) {
				path(p)[prop] = obj[prop](path(p),v);
			}
			return p;
		};
	}
};

module.exports = reductio_alias_prop;
},{}],20:[function(require,module,exports){
var reductio_avg = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).avg = path(p).sum / path(p).count;
			} else {
				path(p).avg = 0;
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).avg = path(p).sum / path(p).count;
			} else {
				path(p).avg = 0;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).avg = 0;
			return p;
		};
	}
};

module.exports = reductio_avg;
},{}],21:[function(require,module,exports){
var reductio_filter = require('./filter.js');
var reductio_count = require('./count.js');
var reductio_sum = require('./sum.js');
var reductio_avg = require('./avg.js');
var reductio_median = require('./median.js');
var reductio_min = require('./min.js');
var reductio_max = require('./max.js');
var reductio_value_count = require('./value-count.js');
var reductio_value_list = require('./value-list.js');
var reductio_exception_count = require('./exception-count.js');
var reductio_exception_sum = require('./exception-sum.js');
var reductio_histogram = require('./histogram.js');
var reductio_sum_of_sq = require('./sum-of-squares.js');
var reductio_std = require('./std.js');
var reductio_nest = require('./nest.js');
var reductio_alias = require('./alias.js');
var reductio_alias_prop = require('./aliasProp.js');
var reductio_data_list = require('./data-list.js');
var reductio_custom = require('./custom.js');

function build_function(p, f, path) {
	// We have to build these functions in order. Eventually we can include dependency
	// information and create a dependency graph if the process becomes complex enough.

	if(!path) path = function (d) { return d; };

	// Keep track of the original reducers so that filtering can skip back to
	// them if this particular value is filtered out.
	var origF = {
		reduceAdd: f.reduceAdd,
		reduceRemove: f.reduceRemove,
		reduceInitial: f.reduceInitial
	};

	if(p.count || p.std) {
    f.reduceAdd = reductio_count.add(f.reduceAdd, path, p.count);
    f.reduceRemove = reductio_count.remove(f.reduceRemove, path, p.count);
    f.reduceInitial = reductio_count.initial(f.reduceInitial, path, p.count);
	}

	if(p.sum) {
		f.reduceAdd = reductio_sum.add(p.sum, f.reduceAdd, path);
		f.reduceRemove = reductio_sum.remove(p.sum, f.reduceRemove, path);
		f.reduceInitial = reductio_sum.initial(f.reduceInitial, path);
	}

	if(p.avg) {
		if(!p.count || !p.sum) {
			console.error("You must set .count(true) and define a .sum(accessor) to use .avg(true).");
		} else {
			f.reduceAdd = reductio_avg.add(p.sum, f.reduceAdd, path);
			f.reduceRemove = reductio_avg.remove(p.sum, f.reduceRemove, path);
			f.reduceInitial = reductio_avg.initial(f.reduceInitial, path);
		}
	}

	// The unique-only reducers come before the value_count reducers. They need to check if
	// the value is already in the values array on the group. They should only increment/decrement
	// counts if the value not in the array or the count on the value is 0.
	if(p.exceptionCount) {
		if(!p.exceptionAccessor) {
			console.error("You must define an .exception(accessor) to use .exceptionCount(true).");
		} else {
			f.reduceAdd = reductio_exception_count.add(p.exceptionAccessor, f.reduceAdd, path);
			f.reduceRemove = reductio_exception_count.remove(p.exceptionAccessor, f.reduceRemove, path);
			f.reduceInitial = reductio_exception_count.initial(f.reduceInitial, path);
		}
	}

	if(p.exceptionSum) {
		if(!p.exceptionAccessor) {
			console.error("You must define an .exception(accessor) to use .exceptionSum(accessor).");
		} else {
			f.reduceAdd = reductio_exception_sum.add(p.exceptionAccessor, p.exceptionSum, f.reduceAdd, path);
			f.reduceRemove = reductio_exception_sum.remove(p.exceptionAccessor, p.exceptionSum, f.reduceRemove, path);
			f.reduceInitial = reductio_exception_sum.initial(f.reduceInitial, path);
		}
	}

	// Maintain the values array.
	if(p.valueList || p.median || p.min || p.max) {
		f.reduceAdd = reductio_value_list.add(p.valueList, f.reduceAdd, path);
		f.reduceRemove = reductio_value_list.remove(p.valueList, f.reduceRemove, path);
		f.reduceInitial = reductio_value_list.initial(f.reduceInitial, path);
	}

	// Maintain the data array.
	if(p.dataList) {
		f.reduceAdd = reductio_data_list.add(p.dataList, f.reduceAdd, path);
		f.reduceRemove = reductio_data_list.remove(p.dataList, f.reduceRemove, path);
		f.reduceInitial = reductio_data_list.initial(f.reduceInitial, path);
	}

	if(p.median) {
		f.reduceAdd = reductio_median.add(f.reduceAdd, path);
		f.reduceRemove = reductio_median.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_median.initial(f.reduceInitial, path);
	}

	if(p.min) {
		f.reduceAdd = reductio_min.add(f.reduceAdd, path);
		f.reduceRemove = reductio_min.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_min.initial(f.reduceInitial, path);
	}

	if(p.max) {
		f.reduceAdd = reductio_max.add(f.reduceAdd, path);
		f.reduceRemove = reductio_max.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_max.initial(f.reduceInitial, path);
	}

	// Maintain the values count array.
	if(p.exceptionAccessor) {
		f.reduceAdd = reductio_value_count.add(p.exceptionAccessor, f.reduceAdd, path);
		f.reduceRemove = reductio_value_count.remove(p.exceptionAccessor, f.reduceRemove, path);
		f.reduceInitial = reductio_value_count.initial(f.reduceInitial, path);
	}

	// Histogram
	if(p.histogramValue && p.histogramThresholds) {
		f.reduceAdd = reductio_histogram.add(p.histogramValue, f.reduceAdd, path);
		f.reduceRemove = reductio_histogram.remove(p.histogramValue, f.reduceRemove, path);
		f.reduceInitial = reductio_histogram.initial(p.histogramThresholds ,f.reduceInitial, path);
	}

	// Sum of Squares
	if(p.sumOfSquares) {
		f.reduceAdd = reductio_sum_of_sq.add(p.sumOfSquares, f.reduceAdd, path);
		f.reduceRemove = reductio_sum_of_sq.remove(p.sumOfSquares, f.reduceRemove, path);
		f.reduceInitial = reductio_sum_of_sq.initial(f.reduceInitial, path);
	}

	// Standard deviation
	if(p.std) {
		if(!p.sumOfSquares || !p.sum) {
			console.error("You must set .sumOfSq(accessor) and define a .sum(accessor) to use .std(true). Or use .std(accessor).");
		} else {
			f.reduceAdd = reductio_std.add(f.reduceAdd, path);
			f.reduceRemove = reductio_std.remove(f.reduceRemove, path);
			f.reduceInitial = reductio_std.initial(f.reduceInitial, path);
		}
	}

	// Custom reducer defined by 3 functions : add, remove, initial
	if (p.custom) {
		f.reduceAdd = reductio_custom.add(f.reduceAdd, path, p.custom.add);
		f.reduceRemove = reductio_custom.remove(f.reduceRemove, path, p.custom.remove);
		f.reduceInitial = reductio_custom.initial(f.reduceInitial, path, p.custom.initial);
	}

	// Nesting
	if(p.nestKeys) {
		f.reduceAdd = reductio_nest.add(p.nestKeys, f.reduceAdd, path);
		f.reduceRemove = reductio_nest.remove(p.nestKeys, f.reduceRemove, path);
		f.reduceInitial = reductio_nest.initial(f.reduceInitial, path);
	}

	// Alias functions
	if(p.aliasKeys) {
		f.reduceInitial = reductio_alias.initial(f.reduceInitial, path, p.aliasKeys);
	}

	// Alias properties - this is less efficient than alias functions
	if(p.aliasPropKeys) {
		f.reduceAdd = reductio_alias_prop.add(p.aliasPropKeys, f.reduceAdd, path);
		// This isn't a typo. The function is the same for add/remove.
		f.reduceRemove = reductio_alias_prop.add(p.aliasPropKeys, f.reduceRemove, path);
	}

	// Filters determine if our built-up priors should run, or if it should skip
	// back to the filters given at the beginning of this build function.
	if (p.filter) {
		f.reduceAdd = reductio_filter.add(p.filter, f.reduceAdd, origF.reduceAdd, path);
		f.reduceRemove = reductio_filter.remove(p.filter, f.reduceRemove, origF.reduceRemove, path);
	}

	// Values go last.
	if(p.values) {
		Object.getOwnPropertyNames(p.values).forEach(function(n) {
			// Set up the path on each group.
			var setupPath = function(prior) {
				return function (p) {
					p = prior(p);
					path(p)[n] = {};
					return p;
				};
			};
			f.reduceInitial = setupPath(f.reduceInitial);
			build_function(p.values[n].parameters, f, function (p) { return p[n]; });
		});
	}
}

var reductio_build = {
	build: build_function
};

module.exports = reductio_build;

},{"./alias.js":18,"./aliasProp.js":19,"./avg.js":20,"./count.js":23,"./custom.js":24,"./data-list.js":25,"./exception-count.js":26,"./exception-sum.js":27,"./filter.js":28,"./histogram.js":29,"./max.js":30,"./median.js":31,"./min.js":32,"./nest.js":33,"./std.js":39,"./sum-of-squares.js":40,"./sum.js":41,"./value-count.js":42,"./value-list.js":43}],22:[function(require,module,exports){
var pluck = function(n){
    return function(d){
        return d[n];
    };
};

// supported operators are sum, avg, and count
_grouper = function(path, prior){
    if(!path) path = function(d){return d;};
    return function(p, v){
        if(prior) prior(p, v);
        var x = path(p), y = path(v);
        if(typeof y.count !== 'undefined') x.count += y.count;
        if(typeof y.sum !== 'undefined') x.sum += y.sum;
        if(typeof y.avg !== 'undefined') x.avg = x.sum/x.count;
        return p;
    };
};

reductio_cap = function (prior, f, p) {
    var obj = f.reduceInitial();
    // we want to support values so we'll need to know what those are
    var values = p.values ? Object.keys(p.values) : [];
    var _othersGrouper = _grouper();
    if (values.length) {
        for (var i = 0; i < values.length; ++i) {
            _othersGrouper = _grouper(pluck(values[i]), _othersGrouper);
        }
    }
    return function (cap, othersName) {
        if (!arguments.length) return prior();
        if( cap === Infinity || !cap ) return prior();
        var all = prior();
        var slice_idx = cap-1;
        if(all.length <= cap) return all;
        var data = all.slice(0, slice_idx);
        var others = {key: othersName || 'Others'};
        others.value = f.reduceInitial();
        for (var i = slice_idx; i < all.length; ++i) {
            _othersGrouper(others.value, all[i].value);
        }
        data.push(others);
        return data;
    };
};

module.exports = reductio_cap;

},{}],23:[function(require,module,exports){
var reductio_count = {
	add: function(prior, path, propName) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p)[propName]++;
			return p;
		};
	},
	remove: function(prior, path, propName) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p)[propName]--;
			return p;
		};
	},
	initial: function(prior, path, propName) {
		return function (p) {
			if(prior) p = prior(p);
			// if(p === undefined) p = {};
			path(p)[propName] = 0;
			return p;
		};
	}
};

module.exports = reductio_count;
},{}],24:[function(require,module,exports){
var reductio_custom = {
	add: function(prior, path, addFn) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			return addFn(p, v);
		};
	},
	remove: function(prior, path, removeFn) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			return removeFn(p, v);
		};
	},
	initial: function(prior, path, initialFn) {
		return function (p) {	
			if(prior) p = prior(p);
			return initialFn(p);
		};
	}
};

module.exports = reductio_custom;
},{}],25:[function(require,module,exports){
var reductio_data_list = {
	add: function(a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).dataList.push(v);
			return p;
		};
	},
	remove: function(a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).dataList.splice(path(p).dataList.indexOf(v), 1);
			return p;
		};
	},
	initial: function(prior, path) {
		return function (p) {
			if(prior) p = prior(p);
			path(p).dataList = [];
			return p;
		};
	}
};

module.exports = reductio_data_list;

},{}],26:[function(require,module,exports){
var reductio_exception_count = {
	add: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only count++ if the p.values array doesn't contain a(v) or if it's 0.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if((!curr || curr[0] !== a(v)) || curr[1] === 0) {
				path(p).exceptionCount++;
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only count-- if the p.values array contains a(v) value of 1.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v) && curr[1] === 1) {
				path(p).exceptionCount--;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).exceptionCount = 0;
			return p;
		};
	}
};

module.exports = reductio_exception_count;
},{}],27:[function(require,module,exports){
var reductio_exception_sum = {
	add: function (a, sum, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only sum if the p.values array doesn't contain a(v) or if it's 0.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if((!curr || curr[0] !== a(v)) || curr[1] === 0) {
				path(p).exceptionSum = path(p).exceptionSum + sum(v);
			}
			return p;
		};
	},
	remove: function (a, sum, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Only sum if the p.values array contains a(v) value of 1.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v) && curr[1] === 1) {
				path(p).exceptionSum = path(p).exceptionSum - sum(v);
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).exceptionSum = 0;
			return p;
		};
	}
};

module.exports = reductio_exception_sum;
},{}],28:[function(require,module,exports){
var reductio_filter = {
	// The big idea here is that you give us a filter function to run on values,
	// a 'prior' reducer to run (just like the rest of the standard reducers),
	// and a reference to the last reducer (called 'skip' below) defined before
	// the most recent chain of reducers.  This supports individual filters for
	// each .value('...') chain that you add to your reducer.
	add: function (filter, prior, skip) {
		return function (p, v, nf) {
			if (filter(v, nf)) {
				if (prior) prior(p, v, nf);
			} else {
				if (skip) skip(p, v, nf);
			}
			return p;
		};
	},
	remove: function (filter, prior, skip) {
		return function (p, v, nf) {
			if (filter(v, nf)) {
				if (prior) prior(p, v, nf);
			} else {
				if (skip) skip(p, v, nf);
			}
			return p;
		};
	}
};

module.exports = reductio_filter;

},{}],29:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_histogram = {
	add: function (a, prior, path) {
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		var bisectHisto = crossfilter.bisect.by(function(d) { return d.x; }).right;
		var curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			curr = path(p).histogram[bisectHisto(path(p).histogram, a(v), 0, path(p).histogram.length) - 1];
			curr.y++;
			curr.splice(bisect(curr, a(v), 0, curr.length), 0, a(v));
			return p;
		};
	},
	remove: function (a, prior, path) {
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		var bisectHisto = crossfilter.bisect.by(function(d) { return d.x; }).right;
		var curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			curr = path(p).histogram[bisectHisto(path(p).histogram, a(v), 0, path(p).histogram.length) - 1];
			curr.y--;
			curr.splice(bisect(curr, a(v), 0, curr.length), 1);
			return p;
		};
	},
	initial: function (thresholds, prior, path) {
		return function (p) {
			p = prior(p);
			path(p).histogram = [];
			var arr = [];
			for(var i = 1; i < thresholds.length; i++) {
				arr = [];
				arr.x = thresholds[i - 1];
				arr.dx = (thresholds[i] - thresholds[i - 1]);
				arr.y = 0;
				path(p).histogram.push(arr);
			}
			return p;
		};
	}
};

module.exports = reductio_histogram;
},{"crossfilter2":1}],30:[function(require,module,exports){
var reductio_max = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
 
			path(p).max = path(p).valueList[path(p).valueList.length - 1];

			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).max = undefined;
				return p;
			}
 
			path(p).max = path(p).valueList[path(p).valueList.length - 1];

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).max = undefined;
			return p;
		};
	}
};

module.exports = reductio_max;
},{}],31:[function(require,module,exports){
var reductio_median = {
	add: function (prior, path) {
		var half;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			half = Math.floor(path(p).valueList.length/2);
 
			if(path(p).valueList.length % 2) {
				path(p).median = path(p).valueList[half];
			} else {
				path(p).median = (path(p).valueList[half-1] + path(p).valueList[half]) / 2.0;
			}

			return p;
		};
	},
	remove: function (prior, path) {
		var half;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			half = Math.floor(path(p).valueList.length/2);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).median = undefined;
				return p;
			}
 
			if(path(p).valueList.length === 1 || path(p).valueList.length % 2) {
				path(p).median = path(p).valueList[half];
			} else {
				path(p).median = (path(p).valueList[half-1] + path(p).valueList[half]) / 2.0;
			}

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).median = undefined;
			return p;
		};
	}
};

module.exports = reductio_median;
},{}],32:[function(require,module,exports){
var reductio_min = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
 
			path(p).min = path(p).valueList[0];

			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			// Check for undefined.
			if(path(p).valueList.length === 0) {
				path(p).min = undefined;
				return p;
			}
 
			path(p).min = path(p).valueList[0];

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).min = undefined;
			return p;
		};
	}
};

module.exports = reductio_min;
},{}],33:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_nest = {
	add: function (keyAccessors, prior, path) {
		var i; // Current key accessor
		var arrRef;
		var newRef;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			arrRef = path(p).nest;
			keyAccessors.forEach(function(a) {
				newRef = arrRef.filter(function(d) { return d.key === a(v); })[0];
				if(newRef) {
					// There is another level.
					arrRef = newRef.values;
				} else {
					// Next level doesn't yet exist so we create it.
					newRef = [];
					arrRef.push({ key: a(v), values: newRef });
					arrRef = newRef;
				}
			});

			arrRef.push(v);
			
			return p;
		};
	},
	remove: function (keyAccessors, prior, path) {
		var arrRef;
		var nextRef;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);

			arrRef = path(p).nest;
			keyAccessors.forEach(function(a) {
				arrRef = arrRef.filter(function(d) { return d.key === a(v); })[0].values;
			});

			// Array contains an actual reference to the row, so just splice it out.
			arrRef.splice(arrRef.indexOf(v), 1);

			// If the leaf now has length 0 and it's not the base array remove it.
			// TODO

			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).nest = [];
			return p;
		};
	}
};

module.exports = reductio_nest;
},{"crossfilter2":1}],34:[function(require,module,exports){
var reductio_parameters = function() {
	return {
		order: false,
		avg: false,
		count: false,
		sum: false,
		exceptionAccessor: false,
		exceptionCount: false,
		exceptionSum: false,
		filter: false,
		valueList: false,
		median: false,
		histogramValue: false,
		min: false,
		max: false,
		histogramThresholds: false,
		std: false,
		sumOfSquares: false,
		values: false,
		nestKeys: false,
		aliasKeys: false,
		aliasPropKeys: false,
		groupAll: false,
		dataList: false,
		custom: false
	};
};

module.exports = reductio_parameters;

},{}],35:[function(require,module,exports){
function postProcess(reductio) {
    return function (group, p, f) {
        group.post = function(){
            var postprocess = function () {
                return postprocess.all();
            };
            postprocess.all = function () {
                return group.all();
            };
            var postprocessors = reductio.postprocessors;
            Object.keys(postprocessors).forEach(function (name) {
                postprocess[name] = function () {
                    var _all = postprocess.all;
                    var args = [].slice.call(arguments);
                    postprocess.all = function () {
                        return postprocessors[name](_all, f, p).apply(null, args);
                    };
                    return postprocess;
                };
            });
            return postprocess;
        };
    };
}

module.exports = postProcess;

},{}],36:[function(require,module,exports){
module.exports = function(reductio){
    reductio.postprocessors = {};
    reductio.registerPostProcessor = function(name, func){
        reductio.postprocessors[name] = func;
    };

    reductio.registerPostProcessor('cap', require('./cap'));
    reductio.registerPostProcessor('sortBy', require('./sortBy'));
};

},{"./cap":22,"./sortBy":38}],37:[function(require,module,exports){
var reductio_build = require('./build.js');
var reductio_accessors = require('./accessors.js');
var reductio_parameters = require('./parameters.js');
var reductio_postprocess = require('./postprocess');
var crossfilter = require('crossfilter2');

function reductio() {
	var parameters = reductio_parameters();

	var funcs = {};

	function my(group) {
		// Start fresh each time.
		funcs = {
			reduceAdd: function(p) { return p; },
			reduceRemove: function(p) { return p; },
			reduceInitial: function () { return {}; },
		};

		reductio_build.build(parameters, funcs);

		// If we're doing groupAll
		if(parameters.groupAll) {
			if(group.top) {
				console.warn("'groupAll' is defined but attempting to run on a standard dimension.group(). Must run on dimension.groupAll().");
			} else {
				var bisect = crossfilter.bisect.by(function(d) { return d.key; }).left;
				var i, j;
				var keys;
        var keysLength;
        var k; // Key
				group.reduce(
					function(p, v, nf) {
						keys = parameters.groupAll(v);
            keysLength = keys.length;
            for(j=0;j<keysLength;j++) {
              k = keys[j];
              i = bisect(p, k, 0, p.length);
							if(!p[i] || p[i].key !== k) {
								// If the group doesn't yet exist, create it first.
								p.splice(i, 0, { key: k, value: funcs.reduceInitial() });
							}

							// Then pass the record and the group value to the reducers
							funcs.reduceAdd(p[i].value, v, nf);
            }
						return p;
					},
					function(p, v, nf) {
						keys = parameters.groupAll(v);
            keysLength = keys.length;
            for(j=0;j<keysLength;j++) {
              i = bisect(p, keys[j], 0, p.length);
							// The group should exist or we're in trouble!
							// Then pass the record and the group value to the reducers
							funcs.reduceRemove(p[i].value, v, nf);
            }
						return p;
					},
					function() {
						return [];
					}
				);
				if(!group.all) {
					// Add an 'all' method for compatibility with standard Crossfilter groups.
					group.all = function() { return this.value(); };
				}
			}
		} else {
			group.reduce(funcs.reduceAdd, funcs.reduceRemove, funcs.reduceInitial);
		}

		reductio_postprocess(group, parameters, funcs);

		return group;
	}

	reductio_accessors.build(my, parameters);

	return my;
}

require('./postprocessors')(reductio);
reductio_postprocess = reductio_postprocess(reductio);

module.exports = reductio;

},{"./accessors.js":17,"./build.js":21,"./parameters.js":34,"./postprocess":35,"./postprocessors":36,"crossfilter2":1}],38:[function(require,module,exports){
var pluck_n = function (n) {
    if (typeof n === 'function') {
        return n;
    }
    if (~n.indexOf('.')) {
        var split = n.split('.');
        return function (d) {
            return split.reduce(function (p, v) {
                return p[v];
            }, d);
        };
    }
    return function (d) {
        return d[n];
    };
};

function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var comparer = function (accessor, ordering) {
    return function (a, b) {
        return ordering(accessor(a), accessor(b));
    };
};

var type = {}.toString;

module.exports = function (prior) {
    return function (value, order) {
        if (arguments.length === 1) {
            order = ascending;
        }
        return prior().sort(comparer(pluck_n(value), order));
    };
};

},{}],39:[function(require,module,exports){
var reductio_std = {
	add: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).std = 0.0;
				var n = path(p).sumOfSq - path(p).sum*path(p).sum/path(p).count;
				if (n>0.0) path(p).std = Math.sqrt(n/(path(p).count-1));
			} else {
				path(p).std = 0.0;
			}
			return p;
		};
	},
	remove: function (prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			if(path(p).count > 0) {
				path(p).std = 0.0;
				var n = path(p).sumOfSq - path(p).sum*path(p).sum/path(p).count;
				if (n>0.0) path(p).std = Math.sqrt(n/(path(p).count-1));
			} else {
				path(p).std = 0;
			}
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).std = 0;
			return p;
		};
	}
};

module.exports = reductio_std;
},{}],40:[function(require,module,exports){
var reductio_sum_of_sq = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sumOfSq = path(p).sumOfSq + a(v)*a(v);
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sumOfSq = path(p).sumOfSq - a(v)*a(v);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).sumOfSq = 0;
			return p;
		};
	}
};

module.exports = reductio_sum_of_sq;
},{}],41:[function(require,module,exports){
var reductio_sum = {
	add: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sum = path(p).sum + a(v);
			return p;
		};
	},
	remove: function (a, prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).sum = path(p).sum - a(v);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).sum = 0;
			return p;
		};
	}
};

module.exports = reductio_sum;
},{}],42:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_value_count = {
	add: function (a, prior, path) {
		var i, curr;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Not sure if this is more efficient than sorting.
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			curr = path(p).values[i];
			if(curr && curr[0] === a(v)) {
				// Value already exists in the array - increment it
				curr[1]++;
			} else {
				// Value doesn't exist - add it in form [value, 1]
				path(p).values.splice(i, 0, [a(v), 1]);
			}
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			i = path(p).bisect(path(p).values, a(v), 0, path(p).values.length);
			// Value already exists or something has gone terribly wrong.
			path(p).values[i][1]--;
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			// Array[Array[value, count]]
			path(p).values = [];
			path(p).bisect = crossfilter.bisect.by(function(d) { return d[0]; }).left;
			return p;
		};
	}
};

module.exports = reductio_value_count;
},{"crossfilter2":1}],43:[function(require,module,exports){
var crossfilter = require('crossfilter2');

var reductio_value_list = {
	add: function (a, prior, path) {
		var i;
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			// Not sure if this is more efficient than sorting.
			i = bisect(path(p).valueList, a(v), 0, path(p).valueList.length);
			path(p).valueList.splice(i, 0, a(v));
			return p;
		};
	},
	remove: function (a, prior, path) {
		var i;
		var bisect = crossfilter.bisect.by(function(d) { return d; }).left;
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			i = bisect(path(p).valueList, a(v), 0, path(p).valueList.length);
			// Value already exists or something has gone terribly wrong.
			path(p).valueList.splice(i, 1);
			return p;
		};
	},
	initial: function (prior, path) {
		return function (p) {
			p = prior(p);
			path(p).valueList = [];
			return p;
		};
	}
};

module.exports = reductio_value_list;
},{"crossfilter2":1}],44:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

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
}

module.exports = {
  makeValueAccessor: makeValueAccessor,
  aggregators: aggregators,
  extractKeyValOrArray: extractKeyValOrArray,
  parseAggregatorParams: parseAggregatorParams,
}
// This is used to build aggregation stacks for sub-reductio
// aggregations, or plucking values for use in filters from the data
function makeValueAccessor(obj) {
  if (typeof obj === 'string') {
    if (isStringSyntax(obj)) {
      obj = convertAggregatorString(obj)
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
    var stack = makeSubAggregationFunction(obj)
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
  obj = _.isObject(obj) ? extractKeyValOrArray(obj) : obj

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
    var subStack = _.map(obj, makeSubAggregationFunction)
    return function getSubStack(d) {
      return subStack.map(function(s) {
        return s(d)
      })
    }
  }

  // If object, find the aggregation, and recurse into the value
  if (obj.key) {
    if (aggregators[obj.key]) {
      var subAggregationFunction = makeSubAggregationFunction(obj.value)
      return function getAggregation(d) {
        return aggregators[obj.key](subAggregationFunction(d))
      }
    }
    console.error('Could not find aggregration method', obj)
  }

  return []
}

function extractKeyValOrArray(obj) {
  var keyVal
  var values = []
  for (var key in obj) {
    if ({}.hasOwnProperty.call(obj, key)) {
      keyVal = {
        key: key,
        value: obj[key],
      }
      var subObj = {}
      subObj[key] = obj[key]
      values.push(subObj)
    }
  }
  return values.length > 1 ? values : keyVal
}

function isStringSyntax(str) {
  return ['$', '('].indexOf(str.charAt(0)) > -1
}

function parseAggregatorParams(keyString) {
  var params = []
  var p1 = keyString.indexOf('(')
  var p2 = keyString.indexOf(')')
  var key = p1 > -1 ? keyString.substring(0, p1) : keyString
  if (!aggregators[key]) {
    return false
  }
  if (p1 > -1 && p2 > -1 && p2 > p1) {
    params = keyString.substring(p1 + 1, p2).split(',')
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
  var outerParens = /\((.+)\)/g
  // var innerParens = /\(([^\(\)]+)\)/g  // innerParens is defined but not used
  // comma not in ()
  var hasComma = /(?:\([^\(\)]*\))|(,)/g

  return JSON.parse('{' + unwrapParensAndCommas(keyString) + '}')

  function unwrapParensAndCommas(str) {
    str = str.replace(' ', '')
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

},{"./lodash":52}],45:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

module.exports = function(service) {
  return function clear(def) {
    // Clear a single or multiple column definitions
    if (def) {
      def = _.isArray(def) ? def : [def]
    }

    if (!def) {
      // Clear all of the column defenitions
      return Promise.all(
        _.map(service.columns, disposeColumn)
      ).then(function() {
        service.columns = []
        return service
      })
    }

    return Promise.all(
      _.map(def, function(d) {
        if (_.isObject(d)) {
          d = d.key
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
        })[0]

        if (!column) {
          // console.info('Attempted to clear a column that is required for another query!', c)
          return
        }

        disposeColumn(column)
      })
    ).then(function() {
      return service
    })

    function disposeColumn(column) {
      var disposalActions = []
      // Dispose the dimension
      if (column.removeListeners) {
        disposalActions = _.map(column.removeListeners, function(listener) {
          return Promise.resolve(listener())
        })
      }
      var filterKey = column.key
      if (column.complex === 'array') {
        filterKey = JSON.stringify(column.key)
      }
      if (column.complex === 'function') {
        filterKey = column.key.toString()
      }
      delete service.filters[filterKey]
      if (column.dimension) {
        disposalActions.push(Promise.resolve(column.dimension.dispose()))
      }
      return Promise.all(disposalActions)
    }
  }
}

},{"./lodash":52}],46:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

module.exports = function (service) {
  var dimension = require('./dimension')(service)

  var columnFunc = column
  columnFunc.find = findColumn

  return columnFunc

  function column(def) {
    // Support groupAll dimension
    if (_.isUndefined(def)) {
      def = true
    }

    // Always deal in bulk.  Like Costco!
    if (!_.isArray(def)) {
      def = [def]
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
    }

    var existing = findColumn(column.key)

    if (existing) {
      existing.temporary = false
      if (existing.dynamicReference) {
        existing.dynamicReference = false
      }
      return existing.promise
        .then(function () {
          return service
        })
    }

    // for storing info about queries and post aggregations
    column.queries = []
    service.columns.push(column)

    column.promise = new Promise(function (resolve, reject) {
      try {
        resolve(service.cf.all())
      } catch (err) {
        reject(err)
      }
    })
      .then(function (all) {
        var sample

        // Complex column Keys
        if (_.isFunction(column.key)) {
          column.complex = 'function'
          sample = column.key(all[0])
        } else if (_.isString(column.key) && (column.key.indexOf('.') > -1 || column.key.indexOf('[') > -1)) {
          column.complex = 'string'
          sample = _.get(all[0], column.key)
        } else if (_.isArray(column.key)) {
          column.complex = 'array'
          sample = _.values(_.pick(all[0], column.key))
          if (sample.length !== column.key.length) {
            throw new Error('Column key does not exist in data!', column.key)
          }
        } else {
          sample = all[0][column.key]
        }

        // Index Column
        if (!column.complex && column.key !== true && typeof sample === 'undefined') {
          throw new Error('Column key does not exist in data!', column.key)
        }

        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user decides to make it permanent

        if (column.key === true) {
          column.type = 'all'
        } else if (column.complex) {
          column.type = 'complex'
        } else if (column.array) {
          column.type = 'array'
        } else {
          column.type = getType(sample)
        }

        return dimension.make(column.key, column.type, column.complex)
      })
      .then(function (dim) {
        column.dimension = dim
        column.filterCount = 0
        var stopListeningForData = service.onDataChange(buildColumnKeys)
        column.removeListeners = [stopListeningForData]

        return buildColumnKeys()

        // Build the columnKeys
        function buildColumnKeys(changes) {
          if (column.key === true) {
            return Promise.resolve()
          }

          var accessor = dimension.makeAccessor(column.key, column.complex)
          column.values = column.values || []

          return new Promise(function (resolve, reject) {
            try {
              if (changes && changes.added) {
                resolve(changes.added)
              } else {
                resolve(column.dimension.bottom(Infinity))
              }
            } catch (err) {
              reject(err)
            }
          })
            .then(function (rows) {
              var newValues
              if (column.complex === 'string' || column.complex === 'function') {
                newValues = _.map(rows, accessor)
                // console.log(rows, accessor.toString(), newValues)
              } else if (column.type === 'array') {
                newValues = _.flatten(_.map(rows, accessor))
              } else {
                newValues = _.map(rows, accessor)
              }
              column.values = _.uniq(column.values.concat(newValues))
            })
        }
      })

    return column.promise
      .then(function () {
        return service
      })
  }
}

},{"./dimension":49,"./lodash":52}],47:[function(require,module,exports){
'use strict'

var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = function (service) {
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
        d[key] = val(d)
      })
      return d
    })
  }

  function add(data) {
    data = generateColumns(data)
    return new Promise(function (resolve, reject) {
      try {
        resolve(service.cf.add(data))
      } catch (err) {
        reject(err)
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
        resolve(service.cf.remove(predicate))
      } catch (err) {
        reject(err)
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



},{"./lodash":52,"crossfilter2":1}],48:[function(require,module,exports){
'use strict'

// var _ = require('./lodash') // _ is defined but never used

module.exports = function (service) {
  return function destroy() {
    return service.clear()
      .then(function () {
        service.cf.dataListeners = []
        service.cf.filterListeners = []
        return Promise.resolve(service.cf.remove())
      })
      .then(function () {
        return service
      })
  }
}

},{}],49:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

module.exports = function (service) {
  return {
    make: make,
    makeAccessor: makeAccessor,
  }

  function make(key, type, complex) {
    var accessor = makeAccessor(key, complex)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
  }

  function makeAccessor(key, complex) {
    var accessorFunction

    if (complex === 'string') {
      accessorFunction = function (d) {
        return _.get(d, key)
      }
    } else if (complex === 'function') {
      accessorFunction = key
    } else if (complex === 'array') {
      var arrayString = _.map(key, function (k) {
        return 'd[\'' + k + '\']'
      })
      accessorFunction = new Function('d', String('return ' + JSON.stringify(arrayString).replace(/"/g, '')))  // eslint-disable-line  no-new-func
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? function accessor(d, i) {
          return i
        } :
          // Value Accessor Dimension
          function (d) {
            return d[key]
          }
    }
    return accessorFunction
  }
}

},{"./lodash":52}],50:[function(require,module,exports){
'use strict'

// var moment = require('moment')

module.exports = {
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
}

// Getters
function $field(d, child) {
  return d[child]
}

// Operators

function $and(d, child) {
  child = child(d)
  for (var i = 0; i < child.length; i++) {
    if (!child[i]) {
      return false
    }
  }
  return true
}

function $or(d, child) {
  child = child(d)
  for (var i = 0; i < child.length; i++) {
    if (child[i]) {
      return true
    }
  }
  return false
}

function $not(d, child) {
  child = child(d)
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

},{}],51:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function (service) {
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
        var newFilters = _.assign({}, service.filters)
        // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
        var filterKey = column.key
        if (column.complex === 'array') {
          filterKey = JSON.stringify(column.key)
        }
        if (column.complex === 'function') {
          filterKey = column.key.toString()
        }
        // Build the filter object
        newFilters[filterKey] = buildFilterObject(fil, isRange, replace)

        return applyFilters(newFilters)
      })
  }

  function getColumn(column) {
    var exists = service.column.find(column)
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
          resolve(exists)
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  function filterAll(fils) {
    // If empty, remove all filters
    if (!fils) {
      service.columns.forEach(function (col) {
        col.dimension.filterAll()
      })
      return applyFilters({})
    }

    // Clone a copy for the new filters
    var newFilters = _.assign({}, service.filters)

    var ds = _.map(fils, function (fil) {
      return getColumn(fil.column)
        .then(function (column) {
          // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
          var filterKey = column.complex ? JSON.stringify(column.key) : column.key
          // Build the filter object
          newFilters[filterKey] = buildFilterObject(fil.value, fil.isRange, fil.replace)
        })
    })

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
      var existing = service.filters[i]
      // Filters are the same, so no change is needed on this column
      if (fil === existing) {
        return Promise.resolve()
      }
      var column
      // Retrieve complex columns by decoding the column key as json
      if (i.charAt(0) === '[') {
        column = service.column.find(JSON.parse(i))
      } else {
        // Retrieve the column normally
        column = service.column.find(i)
      }

      // Toggling a filter value is a bit different from replacing them
      if (fil && existing && !fil.replace) {
        newFilters[i] = fil = toggleFilters(fil, existing)
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
    })

    return Promise.all(ds)
      .then(function () {
        // Save the new filters satate
        service.filters = newFilters

        // Pluck and remove falsey filters from the mix
        var tryRemoval = []
        _.forEach(service.filters, function (val, key) {
          if (!val) {
            tryRemoval.push({
              key: key,
              val: val,
            })
            delete service.filters[key]
          }
        })

        // If any of those filters are the last dependency for the column, then remove the column
        return Promise.all(_.map(tryRemoval, function (v) {
          var column = service.column.find((v.key.charAt(0) === '[') ? JSON.parse(v.key) : v.key)
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
      fil.value = _.xor([fil.value], existing.value)
    } else if (fil.type === 'inclusive' && existing.type === 'exact') { // Inclusive from Exact
      fil.value = _.xor(fil.value, [existing.value])
    } else if (fil.type === 'inclusive' && existing.type === 'inclusive') { // Inclusive / Inclusive Merge
      fil.value = _.xor(fil.value, existing.value)
    } else if (fil.type === 'exact' && existing.type === 'exact') { // Exact / Exact
      // If the values are the same, remove the filter entirely
      if (fil.value === existing.value) {
        return false
      }
      // They they are different, make an array
      fil.value = [fil.value, existing.value]
    }

    // Set the new type based on the merged values
    if (!fil.value.length) {
      fil = false
    } else if (fil.value.length === 1) {
      fil.type = 'exact'
      fil.value = fil.value[0]
    } else {
      fil.type = 'inclusive'
    }

    return fil
  }

  function scanForDynamicFilters(query) {
    // Here we check to see if there are any relative references to the raw data
    // being used in the filter. If so, we need to build those dimensions and keep
    // them updated so the filters can be rebuilt if needed
    // The supported keys right now are: $column, $data
    var columns = []
    walk(query.filter)
    return columns

    function walk(obj) {
      _.forEach(obj, function (val, key) {
        // find the data references, if any
        var ref = findDataReferences(val, key)
        if (ref) {
          columns.push(ref)
        }
        // if it's a string
        if (_.isString(val)) {
          ref = findDataReferences(null, val)
          if (ref) {
            columns.push(ref)
          }
        }
        // If it's another object, keep looking
        if (_.isObject(val)) {
          walk(val)
        }
      })
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
      console.warn('The value for filter "$column" must be a valid column key', val)
      return false
    }
  }

  function makeFunction(obj, isAggregation) {
    var subGetters

    // Detect raw $data reference
    if (_.isString(obj)) {
      var dataRef = findDataReferences(null, obj)
      if (dataRef) {
        var data = service.cf.all()
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
      })
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
        var getSub = makeFunction(val, isAggregation)

        // Detect raw $column references
        var dataRef = findDataReferences(val, key)
        if (dataRef) {
          var column = service.column.find(dataRef)
          var data = column.values
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

        var aggregatorObj = aggregation.parseAggregatorParams(key)
        if (aggregatorObj) {
          // Make sure that any further operations are for aggregations
          // and not filters
          isAggregation = true
          // here we pass true to makeFunction which denotes that
          // an aggregatino chain has started and to stop using $AND
          getSub = makeFunction(val, isAggregation)
          // If it's an aggregation object, be sure to pass in the children, and then any additional params passed into the aggregation string
          return function () {
            return aggregatorObj.aggregator.apply(null, [getSub()].concat(aggregatorObj.params))
          }
        }

        // It must be a string then. Pluck that string key from parent, and pass it as the new value to the subGetter
        return function (d) {
          d = d[key]
          return getSub(d, getSub)
        }
      })

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

    console.log('no expression found for ', obj)
    return false
  }
}

},{"./aggregation":44,"./expressions":50,"./lodash":52}],52:[function(require,module,exports){
/* eslint no-prototype-builtins: 0 */
'use strict'

module.exports = {
  assign: assign,
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
}

function assign(out) {
  out = out || {}
  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i]) {
      continue
    }
    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key)) {
        out[key] = arguments[i][key]
      }
    }
  }
  return out
}

function find(a, b) {
  return a.find(b)
}

function remove(a, b) {
  return a.filter(function (o, i) {
    var r = b(o)
    if (r) {
      a.splice(i, 1)
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
    b = b.join('.')
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
      .split('.')
  }
  if (prop.length > 1) {
    var e = prop.shift()
    assign(obj[e] =
      Object.prototype.toString.call(obj[e]) === '[object Object]' ? obj[e] : {},
    prop,
    value)
  } else {
    obj[prop[0]] = value
  }
}

function map(a, b) {
  var m
  var key
  if (isFunction(b)) {
    if (isObject(a)) {
      m = []
      for (key in a) {
        if (a.hasOwnProperty(key)) {
          m.push(b(a[key], key, a))
        }
      }
      return m
    }
    return a.map(b)
  }
  if (isObject(a)) {
    m = []
    for (key in a) {
      if (a.hasOwnProperty(key)) {
        m.push(a[key])
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
        b(a[key], key, a)
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
  var c = {}
  forEach(b, function (bb) {
    if (typeof a[bb] !== 'undefined') {
      c[bb] = a[bb]
    }
  })
  return c
}

function xor(a, b) {
  var unique = []
  forEach(a, function (aa) {
    if (b.indexOf(aa) === -1) {
      return unique.push(aa)
    }
  })
  forEach(b, function (bb) {
    if (a.indexOf(bb) === -1) {
      return unique.push(bb)
    }
  })
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
  var al = a.length
  var bl = b.length
  if (al > bl) {
    a.splice(bl, al - bl)
  } else if (al < bl) {
    a.push.apply(a, new Array(bl - al))
  }
  forEach(a, function (val, key) {
    a[key] = b[key]
  })
  return a
}

function uniq(a) {
  var seen = new Set()
  return a.filter(function (item) {
    var allow = false
    if (!seen.has(item)) {
      seen.add(item)
      allow = true
    }
    return allow
  })
}

function flatten(aa) {
  var flattened = []
  for (var i = 0; i < aa.length; ++i) {
    var current = aa[i]
    for (var j = 0; j < current.length; ++j) {
      flattened.push(current[j])
    }
  }
  return flattened
}

function sort(arr) {
  for (var i = 1; i < arr.length; i++) {
    var tmp = arr[i]
    var j = i
    while (arr[j - 1] > tmp) {
      arr[j] = arr[j - 1]
      --j
    }
    arr[j] = tmp
  }

  return arr
}

function values(a) {
  var values = []
  for (var key in a) {
    if (a.hasOwnProperty(key)) {
      values.push(a[key])
    }
  }
  return values
}

function recurseObject(obj, cb) {
  _recurseObject(obj, [])
  return obj
  function _recurseObject(obj, path) {
    for (var k in obj) { //  eslint-disable-line guard-for-in
      var newPath = clone(path)
      newPath.push(k)
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        _recurseObject(obj[k], newPath)
      } else {
        if (!obj.hasOwnProperty(k)) {
          continue
        }
        cb(obj[k], k, newPath)
      }
    }
  }
}

},{}],53:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

var aggregation = require('./aggregation')

module.exports = function (/* service */) {
  return {
    post: post,
    sortByKey: sortByKey,
    limit: limit,
    squash: squash,
    change: change,
    changeMap: changeMap,
  }

  function post(query, parent, cb) {
    query.data = cloneIfLocked(parent)
    return Promise.resolve(cb(query, parent))
  }

  function sortByKey(query, parent, desc) {
    query.data = cloneIfLocked(parent)
    query.data = _.sortBy(query.data, function (d) {
      return d.key
    })
    if (desc) {
      query.data.reverse()
    }
  }

  // Limit results to n, or from start to end
  function limit(query, parent, start, end) {
    query.data = cloneIfLocked(parent)
    if (_.isUndefined(end)) {
      end = start || 0
      start = 0
    } else {
      start = start || 0
      end = end || query.data.length
    }
    query.data = query.data.splice(start, end - start)
  }

  // Squash results to n, or from start to end
  function squash(query, parent, start, end, aggObj, label) {
    query.data = cloneIfLocked(parent)
    start = start || 0
    end = end || query.data.length
    var toSquash = query.data.splice(start, end - start)
    var squashed = {
      key: label || 'Other',
      value: {},
    }
    _.recurseObject(aggObj, function (val, key, path) {
      var items = []
      _.forEach(toSquash, function (record) {
        items.push(_.get(record.value, path))
      })
      _.set(squashed.value, path, aggregation.aggregators[val](items))
    })
    query.data.splice(start, 0, squashed)
  }

  function change(query, parent, start, end, aggObj) {
    query.data = cloneIfLocked(parent)
    start = start || 0
    end = end || query.data.length
    var obj = {
      key: [query.data[start].key, query.data[end].key],
      value: {},
    }
    _.recurseObject(aggObj, function (val, key, path) {
      var changePath = _.clone(path)
      changePath.pop()
      changePath.push(key + 'Change')
      _.set(obj.value, changePath, _.get(query.data[end].value, path) - _.get(query.data[start].value, path))
    })
    query.data = obj
  }

  function changeMap(query, parent, aggObj, defaultNull) {
    defaultNull = _.isUndefined(defaultNull) ? 0 : defaultNull
    query.data = cloneIfLocked(parent)
    _.recurseObject(aggObj, function (val, key, path) {
      var changePath = _.clone(path)
      var fromStartPath = _.clone(path)
      var fromEndPath = _.clone(path)

      changePath.pop()
      fromStartPath.pop()
      fromEndPath.pop()

      changePath.push(key + 'Change')
      fromStartPath.push(key + 'ChangeFromStart')
      fromEndPath.push(key + 'ChangeFromEnd')

      var start = _.get(query.data[0].value, path, defaultNull)
      var end = _.get(query.data[query.data.length - 1].value, path, defaultNull)

      _.forEach(query.data, function (record, i) {
        var previous = query.data[i - 1] || query.data[0]
        _.set(query.data[i].value, changePath, _.get(record.value, path, defaultNull) - (previous ? _.get(previous.value, path, defaultNull) : defaultNull))
        _.set(query.data[i].value, fromStartPath, _.get(record.value, path, defaultNull) - start)
        _.set(query.data[i].value, fromEndPath, _.get(record.value, path, defaultNull) - end)
      })
    })
  }
}

function cloneIfLocked(parent) {
  return parent.locked ? _.clone(parent.data) : parent.data
}

},{"./aggregation":44,"./lodash":52}],54:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

module.exports = function (service) {
  var reductiofy = require('./reductiofy')(service)
  var filters = require('./filters')(service)
  var postAggregation = require('./postAggregation')(service)

  var postAggregationMethods = _.keys(postAggregation)

  return function doQuery(queryObj) {
    var queryHash = JSON.stringify(queryObj)

    // Attempt to reuse an exact copy of this query that is present elsewhere
    for (var i = 0; i < service.columns.length; i++) {
      for (var j = 0; j < service.columns[i].queries.length; j++) {
        if (service.columns[i].queries[j].hash === queryHash) {
          return new Promise(function (resolve, reject) { // eslint-disable-line no-loop-func
            try {
              resolve(service.columns[i].queries[j])
            } catch (err) {
              reject(err)
            }
          })
        }
      }
    }

    var query = {
      // Original query passed in to query method
      original: queryObj,
      hash: queryHash,
    }

    // Default queryObj
    if (_.isUndefined(query.original)) {
      query.original = {}
    }
    // Default select
    if (_.isUndefined(query.original.select)) {
      query.original.select = {
        $count: true,
      }
    }
    // Default to groupAll
    query.original.groupBy = query.original.groupBy || true

    // Attach the query api to the query object
    query = newQueryObj(query)

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
          var column = service.column.find(query.original.groupBy)
          query.column = column
          column.queries.push(query)
          column.removeListeners.push(function () {
            return query.clear()
          })
          return query
        })
    }

    function makeCrossfilterGroup(query) {
      // Create the grouping on the columns dimension
      // Using Promise Resolve allows support for crossfilter async
      // TODO check if query already exists, and use the same base query // if possible
      return Promise.resolve(query.column.dimension.group())
        .then(function (g) {
          query.group = g
          return query
        })
    }

    function buildRequiredColumns(query) {
      var requiredColumns = filters.scanForDynamicFilters(query.original)
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
      })
      query.removeListeners.push(stopDataListen)

      // This is a similar listener for filtering which will (if needed)
      // run any post aggregations on the data after each filter action
      var stopFilterListen = service.onFilter(function () {
        return postAggregate(query)
      })
      query.removeListeners.push(stopFilterListen)

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
          query.reducer = reducer
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
          query.data = data
          return query
        })
    }

    function postAggregate(query) {
      if (query.postAggregations.length > 1) {
        // If the query is used by 2+ post aggregations, we need to lock
        // it against getting mutated by the post-aggregations
        query.locked = true
      }
      return Promise.all(_.map(query.postAggregations, function (post) {
        return post()
      }))
        .then(function () {
          return query
        })
    }

    function newQueryObj(q, parent) {
      var locked = false
      if (!parent) {
        parent = q
        q = {}
        locked = true
      }

      // Assign the regular query properties
      _.assign(q, {
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
      })

      _.forEach(postAggregationMethods, function (method) {
        q[method] = postAggregateMethodWrap(postAggregation[method])
      })

      return q

      function lock(set) {
        if (!_.isUndefined(set)) {
          q.locked = Boolean(set)
          return
        }
        q.locked = true
      }

      function unlock() {
        q.locked = false
      }

      function clearQuery() {
        _.forEach(q.removeListeners, function (l) {
          l()
        })
        return new Promise(function (resolve, reject) {
          try {
            resolve(q.group.dispose())
          } catch (err) {
            reject(err)
          }
        })
          .then(function () {
            q.column.queries.splice(q.column.queries.indexOf(q), 1)
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
          var args = Array.prototype.slice.call(arguments)
          var sub = {}
          newQueryObj(sub, q)
          args.unshift(sub, q)

          q.postAggregations.push(function () {
            Promise.resolve(postMethod.apply(null, args))
              .then(postAggregateChildren)
          })

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

},{"./filters":51,"./lodash":52,"./postAggregation":53,"./reductiofy":56}],55:[function(require,module,exports){
'use strict'

// var _ = require('./lodash') // _ is defined but never used

module.exports = {
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
    $count: $count,
    $sum: $sum,
    $avg: $avg,
    $min: $min,
    $max: $max,
    $med: $med,
    $sumSq: $sumSq,
    $std: $std,
    $valueList: $valueList,
    $dataList: $dataList,
  },
}

// Aggregators

function $count(reducer/* , value */) {
  return reducer.count(true)
}

function $sum(reducer, value) {
  return reducer.sum(value)
}

function $avg(reducer, value) {
  return reducer.avg(value)
}

function $min(reducer, value) {
  return reducer.min(value)
}

function $max(reducer, value) {
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

},{}],56:[function(require,module,exports){
'use strict'

var reductio = require('reductio')

var _ = require('./lodash')
var rAggregators = require('./reductioAggregators')
// var expressions = require('./expressions')  // exporession is defined but never used
var aggregation = require('./aggregation')

module.exports = function (service) {
  var filters = require('./filters')(service)

  return function reductiofy(query) {
    var reducer = reductio()
    // var groupBy = query.groupBy // groupBy is defined but never used
    aggregateOrNest(reducer, query.select)

    if (query.filter) {
      var filterFunction = filters.makeFunction(query.filter)
      if (filterFunction) {
        reducer.filter(filterFunction)
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
        })

      // dive into each key/value
      return _.forEach(sortedSelectKeyValue, function (s) {
        // Found a Reductio Aggregation
        if (rAggregators.aggregators[s.key]) {
          // Build the valueAccessorFunction
          var accessor = aggregation.makeValueAccessor(s.value)
          // Add the reducer with the ValueAccessorFunction to the reducer
          reducer = rAggregators.aggregators[s.key](reducer, accessor)
          return
        }

        // Found a top level key value that is not an aggregation or a
        // nested object. This is unacceptable.
        if (!_.isObject(s.value)) {
          console.error('Nested selects must be an object', s.key)
          return
        }

        // It's another nested object, so just repeat this process on it
        aggregateOrNest(reducer.value(s.key), s.value)
      })
    }
  }
}

},{"./aggregation":44,"./filters":51,"./lodash":52,"./reductioAggregators":55,"reductio":37}],57:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

module.exports = universe

function universe(data, options) {
  var service = {
    options: _.assign({}, options),
    columns: [],
    filters: {},
    dataListeners: [],
    filterListeners: [],
  }

  var cf = require('./crossfilter')(service)
  var filters = require('./filters')(service)

  data = cf.generateColumns(data)

  return cf.build(data)
    .then(function (data) {
      service.cf = data
      return _.assign(service, {
        add: cf.add,
        remove: cf.remove,
        column: require('./column')(service),
        query: require('./query')(service),
        filter: filters.filter,
        filterAll: filters.filterAll,
        applyFilters: filters.applyFilters,
        clear: require('./clear')(service),
        destroy: require('./destroy')(service),
        onDataChange: onDataChange,
        onFilter: onFilter,
      })
    })

  function onDataChange(cb) {
    service.dataListeners.push(cb)
    return function () {
      service.dataListeners.splice(service.dataListeners.indexOf(cb), 1)
    }
  }

  function onFilter(cb) {
    service.filterListeners.push(cb)
    return function () {
      service.filterListeners.splice(service.filterListeners.indexOf(cb), 1)
    }
  }
}

},{"./clear":45,"./column":46,"./crossfilter":47,"./destroy":48,"./filters":51,"./lodash":52,"./query":54}]},{},[57])(57)
});

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9wYWNrYWdlLmpzb24iLCJub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2Jpc2VjdC5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaGVhcC5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2hlYXBzZWxlY3QuanMiLCJub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9pZGVudGl0eS5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2luc2VydGlvbnNvcnQuanMiLCJub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9udWxsLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvcGVybXV0ZS5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3F1aWNrc29ydC5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3JlZHVjZS5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3plcm8uanMiLCJub2RlX21vZHVsZXMvbG9kYXNoLnJlc3VsdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYWNjZXNzb3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hbGlhcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYWxpYXNQcm9wLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hdmcuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2J1aWxkLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9jYXAuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2NvdW50LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9jdXN0b20uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2RhdGEtbGlzdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvZXhjZXB0aW9uLWNvdW50LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9leGNlcHRpb24tc3VtLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9maWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2hpc3RvZ3JhbS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbWF4LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9tZWRpYW4uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL21pbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbmVzdC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcGFyYW1ldGVycy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcG9zdHByb2Nlc3MuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3Bvc3Rwcm9jZXNzb3JzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9yZWR1Y3Rpby5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvc29ydEJ5LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zdGQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N1bS1vZi1zcXVhcmVzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zdW0uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3ZhbHVlLWNvdW50LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy92YWx1ZS1saXN0LmpzIiwic3JjL2FnZ3JlZ2F0aW9uLmpzIiwic3JjL2NsZWFyLmpzIiwic3JjL2NvbHVtbi5qcyIsInNyYy9jcm9zc2ZpbHRlci5qcyIsInNyYy9kZXN0cm95LmpzIiwic3JjL2RpbWVuc2lvbi5qcyIsInNyYy9leHByZXNzaW9ucy5qcyIsInNyYy9maWx0ZXJzLmpzIiwic3JjL2xvZGFzaC5qcyIsInNyYy9wb3N0QWdncmVnYXRpb24uanMiLCJzcmMvcXVlcnkuanMiLCJzcmMvcmVkdWN0aW9BZ2dyZWdhdG9ycy5qcyIsInNyYy9yZWR1Y3Rpb2Z5LmpzIiwic3JjL3VuaXZlcnNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3Y4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDclNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3A2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvY3Jvc3NmaWx0ZXJcIikuY3Jvc3NmaWx0ZXI7XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwiX2Zyb21cIjogXCJjcm9zc2ZpbHRlcjJAMS40LjZcIixcbiAgXCJfaWRcIjogXCJjcm9zc2ZpbHRlcjJAMS40LjZcIixcbiAgXCJfaW5CdW5kbGVcIjogZmFsc2UsXG4gIFwiX2ludGVncml0eVwiOiBcInNoYTUxMi1GZG1iNk5xZFVxcmVPdVE5cWlOdlRMT3hNRkJRUlBEZVJCQm5xTThabGViZGYyaTdCbjVoUmhFOFJsTzlZemJHUnlZeHZZemREWHQ2QzFtdXlhbm9sZz09XCIsXG4gIFwiX2xvY2F0aW9uXCI6IFwiL2Nyb3NzZmlsdGVyMlwiLFxuICBcIl9waGFudG9tQ2hpbGRyZW5cIjoge30sXG4gIFwiX3JlcXVlc3RlZFwiOiB7XG4gICAgXCJ0eXBlXCI6IFwidmVyc2lvblwiLFxuICAgIFwicmVnaXN0cnlcIjogdHJ1ZSxcbiAgICBcInJhd1wiOiBcImNyb3NzZmlsdGVyMkAxLjQuNlwiLFxuICAgIFwibmFtZVwiOiBcImNyb3NzZmlsdGVyMlwiLFxuICAgIFwiZXNjYXBlZE5hbWVcIjogXCJjcm9zc2ZpbHRlcjJcIixcbiAgICBcInJhd1NwZWNcIjogXCIxLjQuNlwiLFxuICAgIFwic2F2ZVNwZWNcIjogbnVsbCxcbiAgICBcImZldGNoU3BlY1wiOiBcIjEuNC42XCJcbiAgfSxcbiAgXCJfcmVxdWlyZWRCeVwiOiBbXG4gICAgXCIvXCIsXG4gICAgXCIvcmVkdWN0aW9cIlxuICBdLFxuICBcIl9yZXNvbHZlZFwiOiBcImh0dHBzOi8vcmVnaXN0cnkubnBtanMub3JnL2Nyb3NzZmlsdGVyMi8tL2Nyb3NzZmlsdGVyMi0xLjQuNi50Z3pcIixcbiAgXCJfc2hhc3VtXCI6IFwiYzE3M2YwZDc1YTA0MzQ0YWQyMjZiMWY4YWU3NDdmMDM4NmY5ODc1MFwiLFxuICBcIl9zcGVjXCI6IFwiY3Jvc3NmaWx0ZXIyQDEuNC42XCIsXG4gIFwiX3doZXJlXCI6IFwiL2hvbWUvY2hyaXN0b3BoZS9Qcm9ncmFtbWluZy9Qb2x5bWVyL2xpdEVsZW1lbnQvdW5pdmVyc2VcIixcbiAgXCJhdXRob3JcIjoge1xuICAgIFwibmFtZVwiOiBcIk1pa2UgQm9zdG9ja1wiLFxuICAgIFwidXJsXCI6IFwiaHR0cDovL2Jvc3Qub2Nrcy5vcmcvbWlrZVwiXG4gIH0sXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY3Jvc3NmaWx0ZXIvY3Jvc3NmaWx0ZXIvaXNzdWVzXCJcbiAgfSxcbiAgXCJidW5kbGVEZXBlbmRlbmNpZXNcIjogZmFsc2UsXG4gIFwiY29udHJpYnV0b3JzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJKYXNvbiBEYXZpZXNcIixcbiAgICAgIFwidXJsXCI6IFwiaHR0cDovL3d3dy5qYXNvbmRhdmllcy5jb20vXCJcbiAgICB9XG4gIF0sXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcbiAgICBcImxvZGFzaC5yZXN1bHRcIjogXCJeNC40LjBcIlxuICB9LFxuICBcImRlcHJlY2F0ZWRcIjogZmFsc2UsXG4gIFwiZGVzY3JpcHRpb25cIjogXCJGYXN0IG11bHRpZGltZW5zaW9uYWwgZmlsdGVyaW5nIGZvciBjb29yZGluYXRlZCB2aWV3cy5cIixcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiYnJvd3NlcmlmeVwiOiBcIl4xMy4wLjBcIixcbiAgICBcImQzXCI6IFwiMy41XCIsXG4gICAgXCJlc2xpbnRcIjogXCIyLjEwLjJcIixcbiAgICBcInBhY2thZ2UtanNvbi12ZXJzaW9uaWZ5XCI6IFwiMS4wLjJcIixcbiAgICBcInNlbXZlclwiOiBcIl41LjMuMFwiLFxuICAgIFwic2lub25cIjogXCJeNC4wLjJcIixcbiAgICBcInVnbGlmeS1qc1wiOiBcIjIuNC4wXCIsXG4gICAgXCJ2b3dzXCI6IFwiMC43LjBcIlxuICB9LFxuICBcImVzbGludENvbmZpZ1wiOiB7XG4gICAgXCJlbnZcIjoge1xuICAgICAgXCJicm93c2VyXCI6IHRydWUsXG4gICAgICBcIm5vZGVcIjogdHJ1ZVxuICAgIH0sXG4gICAgXCJnbG9iYWxzXCI6IHtcbiAgICAgIFwiVWludDhBcnJheVwiOiB0cnVlLFxuICAgICAgXCJVaW50MTZBcnJheVwiOiB0cnVlLFxuICAgICAgXCJVaW50MzJBcnJheVwiOiB0cnVlXG4gICAgfSxcbiAgICBcImV4dGVuZHNcIjogXCJlc2xpbnQ6cmVjb21tZW5kZWRcIlxuICB9LFxuICBcImZpbGVzXCI6IFtcbiAgICBcInNyY1wiLFxuICAgIFwiaW5kZXguanNcIixcbiAgICBcImluZGV4LmQudHNcIixcbiAgICBcImNyb3NzZmlsdGVyLmpzXCIsXG4gICAgXCJjcm9zc2ZpbHRlci5taW4uanNcIlxuICBdLFxuICBcImhvbWVwYWdlXCI6IFwiaHR0cHM6Ly9jcm9zc2ZpbHRlci5naXRodWIuaW8vY3Jvc3NmaWx0ZXIvXCIsXG4gIFwia2V5d29yZHNcIjogW1xuICAgIFwiYW5hbHl0aWNzXCIsXG4gICAgXCJ2aXN1YWxpemF0aW9uXCIsXG4gICAgXCJjcm9zc2ZpbHRlclwiXG4gIF0sXG4gIFwibGljZW5zZVwiOiBcIkFwYWNoZS0yLjBcIixcbiAgXCJtYWluXCI6IFwiLi9pbmRleC5qc1wiLFxuICBcIm1haW50YWluZXJzXCI6IFtcbiAgICB7XG4gICAgICBcIm5hbWVcIjogXCJHb3Jkb24gV29vZGh1bGxcIixcbiAgICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL2dvcmRvbndvb2RodWxsXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIlRhbm5lciBMaW5zbGV5XCIsXG4gICAgICBcInVybFwiOiBcImh0dHBzOi8vZ2l0aHViLmNvbS90YW5uZXJsaW5zbGV5XCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIkV0aGFuIEpld2V0dFwiLFxuICAgICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vZXNqZXdldHRcIlxuICAgIH1cbiAgXSxcbiAgXCJuYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gIFwicmVwb3NpdG9yeVwiOiB7XG4gICAgXCJ0eXBlXCI6IFwiZ2l0XCIsXG4gICAgXCJ1cmxcIjogXCJnaXQrc3NoOi8vZ2l0QGdpdGh1Yi5jb20vY3Jvc3NmaWx0ZXIvY3Jvc3NmaWx0ZXIuZ2l0XCJcbiAgfSxcbiAgXCJzY3JpcHRzXCI6IHtcbiAgICBcImJlbmNobWFya1wiOiBcIm5vZGUgdGVzdC9iZW5jaG1hcmsuanNcIixcbiAgICBcImJ1aWxkXCI6IFwiYnJvd3NlcmlmeSBpbmRleC5qcyAtdCBwYWNrYWdlLWpzb24tdmVyc2lvbmlmeSAtLXN0YW5kYWxvbmUgY3Jvc3NmaWx0ZXIgLW8gY3Jvc3NmaWx0ZXIuanMgJiYgdWdsaWZ5anMgLS1jb21wcmVzcyAtLW1hbmdsZSAtLXNjcmV3LWllOCBjcm9zc2ZpbHRlci5qcyAtbyBjcm9zc2ZpbHRlci5taW4uanNcIixcbiAgICBcImNsZWFuXCI6IFwicm0gLWYgY3Jvc3NmaWx0ZXIuanMgY3Jvc3NmaWx0ZXIubWluLmpzXCIsXG4gICAgXCJ0ZXN0XCI6IFwidm93cyAtLXZlcmJvc2UgJiYgZXNsaW50IHNyYy9cIlxuICB9LFxuICBcInR5cGVzXCI6IFwiLi9pbmRleC5kLnRzXCIsXG4gIFwidW5wa2dcIjogXCIuL2Nyb3NzZmlsdGVyLm1pbi5qc1wiLFxuICBcInZlcnNpb25cIjogXCIxLjQuNlwiXG59XG4iLCJpZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgdmFyIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICB2YXIgY3Jvc3NmaWx0ZXJfYXJyYXkxNiA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50MTZBcnJheShuKTsgfTtcbiAgdmFyIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgdmFyIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICB2YXIgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGZ1bmN0aW9uKGFycmF5LCB3aWR0aCkge1xuICAgIHZhciBjb3B5O1xuICAgIHN3aXRjaCAod2lkdGgpIHtcbiAgICAgIGNhc2UgMTY6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTE2KGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgY2FzZSAzMjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MzIoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgICB9XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQobikge1xuICB2YXIgYXJyYXkgPSBuZXcgQXJyYXkobiksIGkgPSAtMTtcbiAgd2hpbGUgKCsraSA8IG4pIGFycmF5W2ldID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuVW50eXBlZChhcnJheSwgbGVuZ3RoKSB7XG4gIHZhciBuID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobiA8IGxlbmd0aCkgYXJyYXlbbisrXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlblVudHlwZWQoYXJyYXksIHdpZHRoKSB7XG4gIGlmICh3aWR0aCA+IDMyKSB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFycmF5IHdpZHRoIVwiKTtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG4vLyBBbiBhcmJpdHJhcmlseS13aWRlIGFycmF5IG9mIGJpdG1hc2tzXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9iaXRhcnJheShuKSB7XG4gIHRoaXMubGVuZ3RoID0gbjtcbiAgdGhpcy5zdWJhcnJheXMgPSAxO1xuICB0aGlzLndpZHRoID0gODtcbiAgdGhpcy5tYXNrcyA9IHtcbiAgICAwOiAwXG4gIH1cblxuICB0aGlzWzBdID0gY3Jvc3NmaWx0ZXJfYXJyYXk4KG4pO1xufVxuXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUubGVuZ3RoZW4gPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzW2ldID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbih0aGlzW2ldLCBuKTtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IG47XG59O1xuXG4vLyBSZXNlcnZlIGEgbmV3IGJpdCBpbmRleCBpbiB0aGUgYXJyYXksIHJldHVybnMge29mZnNldCwgb25lfVxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbSwgdywgb25lLCBpLCBsZW47XG5cbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIG0gPSB0aGlzLm1hc2tzW2ldO1xuICAgIHcgPSB0aGlzLndpZHRoIC0gKDMyICogaSk7XG4gICAgb25lID0gfm0gJiAtfm07XG5cbiAgICBpZiAodyA+PSAzMiAmJiAhb25lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAodyA8IDMyICYmIChvbmUgJiAoMSA8PCB3KSkpIHtcbiAgICAgIC8vIHdpZGVuIHRoaXMgc3ViYXJyYXlcbiAgICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKHRoaXNbaV0sIHcgPDw9IDEpO1xuICAgICAgdGhpcy53aWR0aCA9IDMyICogaSArIHc7XG4gICAgfVxuXG4gICAgdGhpcy5tYXNrc1tpXSB8PSBvbmU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb2Zmc2V0OiBpLFxuICAgICAgb25lOiBvbmVcbiAgICB9O1xuICB9XG5cbiAgLy8gYWRkIGEgbmV3IHN1YmFycmF5XG4gIHRoaXNbdGhpcy5zdWJhcnJheXNdID0gY3Jvc3NmaWx0ZXJfYXJyYXk4KHRoaXMubGVuZ3RoKTtcbiAgdGhpcy5tYXNrc1t0aGlzLnN1YmFycmF5c10gPSAxO1xuICB0aGlzLndpZHRoICs9IDg7XG4gIHJldHVybiB7XG4gICAgb2Zmc2V0OiB0aGlzLnN1YmFycmF5cysrLFxuICAgIG9uZTogMVxuICB9O1xufTtcblxuLy8gQ29weSByZWNvcmQgZnJvbSBpbmRleCBzcmMgdG8gaW5kZXggZGVzdFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihkZXN0LCBzcmMpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV1bZGVzdF0gPSB0aGlzW2ldW3NyY107XG4gIH1cbn07XG5cbi8vIFRydW5jYXRlIHRoZSBhcnJheSB0byB0aGUgZ2l2ZW4gbGVuZ3RoXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUudHJ1bmNhdGUgPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBmb3IgKHZhciBqID0gdGhpcy5sZW5ndGggLSAxOyBqID49IG47IGotLSkge1xuICAgICAgdGhpc1tpXVtqXSA9IDA7XG4gICAgfVxuICAgIHRoaXNbaV0ubGVuZ3RoID0gbjtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IG47XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVybyA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgYWxsIGJpdHMgZm9yIHRoZSBnaXZlbiBpbmRleCBhcmUgMCBleGNlcHQgZm9yIHBvc3NpYmx5IG9uZVxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnplcm9FeGNlcHQgPSBmdW5jdGlvbihuLCBvZmZzZXQsIHplcm8pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChpID09PSBvZmZzZXQgPyB0aGlzW2ldW25dICYgemVybyA6IHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV6IGFyZSAwIGV4Y2VwdCBmb3IgdGhlIHNwZWNpZmllZCBtYXNrLlxuLy8gVGhlIG1hc2sgc2hvdWxkIGJlIGFuIGFycmF5IG9mIHRoZSBzYW1lIHNpemUgYXMgdGhlIGZpbHRlciBzdWJhcnJheXMgd2lkdGguXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdE1hc2sgPSBmdW5jdGlvbihuLCBtYXNrKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc1tpXVtuXSAmIG1hc2tbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCBvbmUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICE9IChpID09PSBvZmZzZXQgPyBvbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXggZXhjZXB0IGZvciBwb3NzaWJseSBvbmUgb3RoZXJcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5RXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvLCBvbmx5T2Zmc2V0LCBvbmx5T25lKSB7XG4gIHZhciBtYXNrO1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbWFzayA9IHRoaXNbaV1bbl07XG4gICAgaWYgKGkgPT09IG9mZnNldClcbiAgICAgIG1hc2sgJj0gemVybztcbiAgICBpZiAobWFzayAhPSAoaSA9PT0gb25seU9mZnNldCA/IG9ubHlPbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhcnJheTg6IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgYXJyYXkxNjogY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICBhcnJheTMyOiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gIGFycmF5TGVuZ3RoZW46IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkLFxuICBhcnJheVdpZGVuOiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZCxcbiAgYml0YXJyYXk6IGNyb3NzZmlsdGVyX2JpdGFycmF5XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY3Jvc3NmaWx0ZXJfaWRlbnRpdHkgPSByZXF1aXJlKCcuL2lkZW50aXR5Jyk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xubW9kdWxlLmV4cG9ydHMuYnkgPSBiaXNlY3RfYnk7IC8vIGFzc2lnbiB0aGUgcmF3IGZ1bmN0aW9uIHRvIHRoZSBleHBvcnQgYXMgd2VsbFxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgeGZpbHRlckFycmF5ID0gcmVxdWlyZSgnLi9hcnJheScpO1xudmFyIHhmaWx0ZXJGaWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlcicpO1xudmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xudmFyIGNyb3NzZmlsdGVyX251bGwgPSByZXF1aXJlKCcuL251bGwnKTtcbnZhciBjcm9zc2ZpbHRlcl96ZXJvID0gcmVxdWlyZSgnLi96ZXJvJyk7XG52YXIgeGZpbHRlckhlYXBzZWxlY3QgPSByZXF1aXJlKCcuL2hlYXBzZWxlY3QnKTtcbnZhciB4ZmlsdGVySGVhcCA9IHJlcXVpcmUoJy4vaGVhcCcpO1xudmFyIGJpc2VjdCA9IHJlcXVpcmUoJy4vYmlzZWN0Jyk7XG52YXIgaW5zZXJ0aW9uc29ydCA9IHJlcXVpcmUoJy4vaW5zZXJ0aW9uc29ydCcpO1xudmFyIHBlcm11dGUgPSByZXF1aXJlKCcuL3Blcm11dGUnKTtcbnZhciBxdWlja3NvcnQgPSByZXF1aXJlKCcuL3F1aWNrc29ydCcpO1xudmFyIHhmaWx0ZXJSZWR1Y2UgPSByZXF1aXJlKCcuL3JlZHVjZScpO1xudmFyIHBhY2thZ2VKc29uID0gcmVxdWlyZSgnLi8uLi9wYWNrYWdlLmpzb24nKTsgLy8gcmVxdWlyZSBvd24gcGFja2FnZS5qc29uIGZvciB0aGUgdmVyc2lvbiBmaWVsZFxudmFyIHJlc3VsdCA9IHJlcXVpcmUoJ2xvZGFzaC5yZXN1bHQnKTtcblxuLy8gY29uc3RhbnRzXG52YXIgUkVNT1ZFRF9JTkRFWCA9IC0xO1xuXG4vLyBleHBvc2UgQVBJIGV4cG9ydHNcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIgPSBjcm9zc2ZpbHRlcjtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIuaGVhcCA9IHhmaWx0ZXJIZWFwO1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5oZWFwc2VsZWN0ID0geGZpbHRlckhlYXBzZWxlY3Q7XG5leHBvcnRzLmNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdDtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnQ7XG5leHBvcnRzLmNyb3NzZmlsdGVyLnBlcm11dGUgPSBwZXJtdXRlO1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5xdWlja3NvcnQgPSBxdWlja3NvcnQ7XG5leHBvcnRzLmNyb3NzZmlsdGVyLnZlcnNpb24gPSBwYWNrYWdlSnNvbi52ZXJzaW9uOyAvLyBwbGVhc2Ugbm90ZSB1c2Ugb2YgXCJwYWNrYWdlLWpzb24tdmVyc2lvbmlmeVwiIHRyYW5zZm9ybVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZSxcbiAgICBhbGw6IGFsbCxcbiAgICBhbGxGaWx0ZXJlZDogYWxsRmlsdGVyZWQsXG4gICAgb25DaGFuZ2U6IG9uQ2hhbmdlLFxuICAgIGlzRWxlbWVudEZpbHRlcmVkOiBpc0VsZW1lbnRGaWx0ZXJlZFxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgZmlsdGVycywgLy8gMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcbiAgICAgIGNhbGxiYWNrcyA9IFtdO1xuXG4gIGZpbHRlcnMgPSBuZXcgeGZpbHRlckFycmF5LmJpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhQWRkZWQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycywgb3IgaWYgYSBwcmVkaWNhdGUgZnVuY3Rpb24gaXMgcGFzc2VkLFxuICAvLyByZW1vdmVzIGFsbCByZWNvcmRzIG1hdGNoaW5nIHRoZSBwcmVkaWNhdGUgKGlnbm9yaW5nIGZpbHRlcnMpLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKHByZWRpY2F0ZSkge1xuICAgIHZhciAvLyBNYXBwaW5nIGZyb20gb2xkIHJlY29yZCBpbmRleGVzIHRvIG5ldyBpbmRleGVzIChhZnRlciByZWNvcmRzIHJlbW92ZWQpXG4gICAgICAgIG5ld0luZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbiksXG4gICAgICAgIHJlbW92ZWQgPSBbXSxcbiAgICAgICAgdXNlUHJlZCA9IHR5cGVvZiBwcmVkaWNhdGUgPT09ICdmdW5jdGlvbicsXG4gICAgICAgIHNob3VsZFJlbW92ZSA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgICAgcmV0dXJuIHVzZVByZWQgPyBwcmVkaWNhdGUoZGF0YVtpXSwgaSkgOiBmaWx0ZXJzLnplcm8oaSlcbiAgICAgICAgfTtcblxuICAgIGZvciAodmFyIGluZGV4MSA9IDAsIGluZGV4MiA9IDA7IGluZGV4MSA8IG47ICsraW5kZXgxKSB7XG4gICAgICBpZiAoIHNob3VsZFJlbW92ZShpbmRleDEpICkge1xuICAgICAgICByZW1vdmVkLnB1c2goaW5kZXgxKTtcbiAgICAgICAgbmV3SW5kZXhbaW5kZXgxXSA9IFJFTU9WRURfSU5ERVg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdJbmRleFtpbmRleDFdID0gaW5kZXgyKys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgtMSwgLTEsIFtdLCByZW1vdmVkLCB0cnVlKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaW5kZXgzID0gMCwgaW5kZXg0ID0gMDsgaW5kZXgzIDwgbjsgKytpbmRleDMpIHtcbiAgICAgIGlmICggbmV3SW5kZXhbaW5kZXgzXSAhPT0gUkVNT1ZFRF9JTkRFWCApIHtcbiAgICAgICAgaWYgKGluZGV4MyAhPT0gaW5kZXg0KSBmaWx0ZXJzLmNvcHkoaW5kZXg0LCBpbmRleDMpLCBkYXRhW2luZGV4NF0gPSBkYXRhW2luZGV4M107XG4gICAgICAgICsraW5kZXg0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEubGVuZ3RoID0gbiA9IGluZGV4NDtcbiAgICBmaWx0ZXJzLnRydW5jYXRlKGluZGV4NCk7XG4gICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhUmVtb3ZlZCcpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWFza0ZvckRpbWVuc2lvbnMoZGltZW5zaW9ucykge1xuICAgIHZhciBuLFxuICAgICAgICBkLFxuICAgICAgICBsZW4sXG4gICAgICAgIGlkLFxuICAgICAgICBtYXNrID0gQXJyYXkoZmlsdGVycy5zdWJhcnJheXMpO1xuICAgIGZvciAobiA9IDA7IG4gPCBmaWx0ZXJzLnN1YmFycmF5czsgbisrKSB7IG1hc2tbbl0gPSB+MDsgfVxuICAgIGZvciAoZCA9IDAsIGxlbiA9IGRpbWVuc2lvbnMubGVuZ3RoOyBkIDwgbGVuOyBkKyspIHtcbiAgICAgIC8vIFRoZSB0b3AgYml0cyBvZiB0aGUgSUQgYXJlIHRoZSBzdWJhcnJheSBvZmZzZXQgYW5kIHRoZSBsb3dlciBiaXRzIGFyZSB0aGUgYml0XG4gICAgICAvLyBvZmZzZXQgb2YgdGhlIFwib25lXCIgbWFzay5cbiAgICAgIGlkID0gZGltZW5zaW9uc1tkXS5pZCgpO1xuICAgICAgbWFza1tpZCA+PiA3XSAmPSB+KDB4MSA8PCAoaWQgJiAweDNmKSk7XG4gICAgfVxuICAgIHJldHVybiBtYXNrO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIGRhdGEgZWxlbWVudCBhdCBpbmRleCBpIGlzIGZpbHRlcmVkIElOLlxuICAvLyBPcHRpb25hbGx5LCBpZ25vcmUgdGhlIGZpbHRlcnMgb2YgYW55IGRpbWVuc2lvbnMgaW4gdGhlIGlnbm9yZV9kaW1lbnNpb25zIGxpc3QuXG4gIGZ1bmN0aW9uIGlzRWxlbWVudEZpbHRlcmVkKGksIGlnbm9yZV9kaW1lbnNpb25zKSB7XG4gICAgdmFyIG1hc2sgPSBtYXNrRm9yRGltZW5zaW9ucyhpZ25vcmVfZGltZW5zaW9ucyB8fCBbXSk7XG4gICAgcmV0dXJuIGZpbHRlcnMuemVyb0V4Y2VwdE1hc2soaSxtYXNrKTtcbiAgfVxuXG4gIC8vIEFkZHMgYSBuZXcgZGltZW5zaW9uIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZSBhY2Nlc3NvciBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gZGltZW5zaW9uKHZhbHVlLCBpdGVyYWJsZSkge1xuXG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHZhciBhY2Nlc3NvclBhdGggPSB2YWx1ZTtcbiAgICAgIHZhbHVlID0gZnVuY3Rpb24oZCkgeyByZXR1cm4gcmVzdWx0KGQsIGFjY2Vzc29yUGF0aCk7IH07XG4gICAgfVxuXG4gICAgdmFyIGRpbWVuc2lvbiA9IHtcbiAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgZmlsdGVyRXhhY3Q6IGZpbHRlckV4YWN0LFxuICAgICAgZmlsdGVyUmFuZ2U6IGZpbHRlclJhbmdlLFxuICAgICAgZmlsdGVyRnVuY3Rpb246IGZpbHRlckZ1bmN0aW9uLFxuICAgICAgZmlsdGVyQWxsOiBmaWx0ZXJBbGwsXG4gICAgICBjdXJyZW50RmlsdGVyOiBjdXJyZW50RmlsdGVyLFxuICAgICAgaGFzQ3VycmVudEZpbHRlcjogaGFzQ3VycmVudEZpbHRlcixcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlLCAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIGFjY2Vzc29yOiB2YWx1ZSxcbiAgICAgIGlkOiBmdW5jdGlvbigpIHsgcmV0dXJuIGlkOyB9XG4gICAgfTtcblxuICAgIHZhciBvbmUsIC8vIGxvd2VzdCB1bnNldCBiaXQgYXMgbWFzaywgZS5nLiwgMDAwMDEwMDBcbiAgICAgICAgemVybywgLy8gaW52ZXJ0ZWQgb25lLCBlLmcuLCAxMTExMDExMVxuICAgICAgICBvZmZzZXQsIC8vIG9mZnNldCBpbnRvIHRoZSBmaWx0ZXJzIGFycmF5c1xuICAgICAgICBpZCwgLy8gdW5pcXVlIElEIGZvciB0aGlzIGRpbWVuc2lvbiAocmV1c2VkIHdoZW4gZGltZW5zaW9ucyBhcmUgZGlzcG9zZWQpXG4gICAgICAgIHZhbHVlcywgLy8gc29ydGVkLCBjYWNoZWQgYXJyYXlcbiAgICAgICAgaW5kZXgsIC8vIG1hcHMgc29ydGVkIHZhbHVlIGluZGV4IC0+IHJlY29yZCBpbmRleCAoaW4gZGF0YSlcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzID0gW10sXG4gICAgICAgIHNvcnQgPSBxdWlja3NvcnQuYnkoZnVuY3Rpb24oaSkgeyByZXR1cm4gbmV3VmFsdWVzW2ldOyB9KSxcbiAgICAgICAgcmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgZmlsdGVyVmFsdWUsIC8vIHRoZSB2YWx1ZSB1c2VkIGZvciBmaWx0ZXJpbmcgKHZhbHVlLCBhcnJheSwgZnVuY3Rpb24gb3IgdW5kZWZpbmVkKVxuICAgICAgICBmaWx0ZXJWYWx1ZVByZXNlbnQsIC8vIHRydWUgaWYgZmlsdGVyVmFsdWUgY29udGFpbnMgc29tZXRoaW5nXG4gICAgICAgIGluZGV4TGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyBhZGRlZFxuICAgICAgICBkaW1lbnNpb25Hcm91cHMgPSBbXSxcbiAgICAgICAgbG8wID0gMCxcbiAgICAgICAgaGkwID0gMCxcbiAgICAgICAgdCA9IDAsXG4gICAgICAgIGs7XG5cbiAgICAvLyBVcGRhdGluZyBhIGRpbWVuc2lvbiBpcyBhIHR3by1zdGFnZSBwcm9jZXNzLiBGaXJzdCwgd2UgbXVzdCB1cGRhdGUgdGhlXG4gICAgLy8gYXNzb2NpYXRlZCBmaWx0ZXJzIGZvciB0aGUgbmV3bHktYWRkZWQgcmVjb3Jkcy4gT25jZSBhbGwgZGltZW5zaW9ucyBoYXZlXG4gICAgLy8gdXBkYXRlZCB0aGVpciBmaWx0ZXJzLCB0aGUgZ3JvdXBzIGFyZSBub3RpZmllZCB0byB1cGRhdGUuXG4gICAgZGF0YUxpc3RlbmVycy51bnNoaWZ0KHByZUFkZCk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKHBvc3RBZGQpO1xuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgLy8gQWRkIGEgbmV3IGRpbWVuc2lvbiBpbiB0aGUgZmlsdGVyIGJpdG1hcCBhbmQgc3RvcmUgdGhlIG9mZnNldCBhbmQgYml0bWFzay5cbiAgICB2YXIgdG1wID0gZmlsdGVycy5hZGQoKTtcbiAgICBvZmZzZXQgPSB0bXAub2Zmc2V0O1xuICAgIG9uZSA9IHRtcC5vbmU7XG4gICAgemVybyA9IH5vbmU7XG5cbiAgICAvLyBDcmVhdGUgYSB1bmlxdWUgSUQgZm9yIHRoZSBkaW1lbnNpb25cbiAgICAvLyBJRHMgd2lsbCBiZSByZS11c2VkIGlmIGRpbWVuc2lvbnMgYXJlIGRpc3Bvc2VkLlxuICAgIC8vIEZvciBpbnRlcm5hbCB1c2UgdGhlIElEIGlzIHRoZSBzdWJhcnJheSBvZmZzZXQgc2hpZnRlZCBsZWZ0IDcgYml0cyBvcidkIHdpdGggdGhlXG4gICAgLy8gYml0IG9mZnNldCBvZiB0aGUgc2V0IGJpdCBpbiB0aGUgZGltZW5zaW9uJ3MgXCJvbmVcIiBtYXNrLlxuICAgIGlkID0gKG9mZnNldCA8PCA3KSB8IChNYXRoLmxvZyhvbmUpIC8gTWF0aC5sb2coMikpO1xuXG4gICAgcHJlQWRkKGRhdGEsIDAsIG4pO1xuICAgIHBvc3RBZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyBpbnRvIHRoaXMgZGltZW5zaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGZpbHRlcnMsIHZhbHVlcywgYW5kIGluZGV4LlxuICAgIGZ1bmN0aW9uIHByZUFkZChuZXdEYXRhLCBuMCwgbjEpIHtcblxuICAgICAgaWYgKGl0ZXJhYmxlKXtcbiAgICAgICAgLy8gQ291bnQgYWxsIHRoZSB2YWx1ZXNcbiAgICAgICAgdCA9IDA7XG4gICAgICAgIGogPSAwO1xuICAgICAgICBrID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaTAgPSAwOyBpMCA8IG5ld0RhdGEubGVuZ3RoOyBpMCsrKSB7XG4gICAgICAgICAgZm9yKGogPSAwLCBrID0gdmFsdWUobmV3RGF0YVtpMF0pOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5ld1ZhbHVlcyA9IFtdO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UobmV3RGF0YS5sZW5ndGgpO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyb3NzZmlsdGVyX2luZGV4KHQsMSk7XG4gICAgICAgIHZhciB1bnNvcnRlZEluZGV4ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UodCk7XG5cbiAgICAgICAgZm9yICh2YXIgbCA9IDAsIGluZGV4MSA9IDA7IGluZGV4MSA8IG5ld0RhdGEubGVuZ3RoOyBpbmRleDErKykge1xuICAgICAgICAgIGsgPSB2YWx1ZShuZXdEYXRhW2luZGV4MV0pXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZighay5sZW5ndGgpe1xuICAgICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpbmRleDFdID0gMDtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cy5wdXNoKGluZGV4MSArIG4wKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2luZGV4MV0gPSBrLmxlbmd0aFxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMucHVzaChrW2pdKTtcbiAgICAgICAgICAgIHVuc29ydGVkSW5kZXhbbF0gPSBpbmRleDE7XG4gICAgICAgICAgICBsKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBTb3J0IG1hcCB1c2VkIHRvIHNvcnQgYm90aCB0aGUgdmFsdWVzIGFuZCB0aGUgdmFsdWVUb0RhdGEgaW5kaWNlc1xuICAgICAgICB2YXIgc29ydE1hcCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UodCksIDAsIHQpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgc29ydE1hcCB0byBzb3J0IHRoZSBuZXdWYWx1ZXNcbiAgICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIHNvcnRNYXApO1xuXG5cbiAgICAgICAgLy8gVXNlIHRoZSBzb3J0TWFwIHRvIHNvcnQgdGhlIHVuc29ydGVkSW5kZXggbWFwXG4gICAgICAgIC8vIG5ld0luZGV4IHNob3VsZCBiZSBhIG1hcCBvZiBzb3J0ZWRWYWx1ZSAtPiBjcm9zc2ZpbHRlckRhdGFcbiAgICAgICAgbmV3SW5kZXggPSBwZXJtdXRlKHVuc29ydGVkSW5kZXgsIHNvcnRNYXApXG5cbiAgICAgIH0gZWxzZXtcbiAgICAgICAgLy8gUGVybXV0ZSBuZXcgdmFsdWVzIGludG8gbmF0dXJhbCBvcmRlciB1c2luZyBhIHN0YW5kYXJkIHNvcnRlZCBpbmRleC5cbiAgICAgICAgbmV3VmFsdWVzID0gbmV3RGF0YS5tYXAodmFsdWUpO1xuICAgICAgICBuZXdJbmRleCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UobjEpLCAwLCBuMSk7XG4gICAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBuZXdJbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIG4xID0gdDtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IG5ld1ZhbHVlcyB0byBkZXRlcm1pbmUgd2hpY2ggbmV3IHJlY29yZHMgYXJlIHNlbGVjdGVkLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKG5ld1ZhbHVlcyksIGxvMSA9IGJvdW5kc1swXSwgaGkxID0gYm91bmRzWzFdO1xuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgZm9yICh2YXIgaW5kZXgyID0gMDsgaW5kZXgyIDwgbjE7ICsraW5kZXgyKSB7XG4gICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpbmRleDJdLCBpbmRleDIpKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaW5kZXgyXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaW5kZXgyXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpbmRleDMgPSAwOyBpbmRleDMgPCBsbzE7ICsraW5kZXgzKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2luZGV4M10gKyBuMF0gfD0gb25lO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpbmRleDNdID0gMTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpbmRleDQgPSBoaTE7IGluZGV4NCA8IG4xOyArK2luZGV4NCkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpbmRleDRdICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaW5kZXg0XSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQgPSBuZXdJdGVyYWJsZXNJbmRleENvdW50O1xuICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG5cblxuICAgICAgdmFyIG9sZFZhbHVlcyA9IHZhbHVlcyxcbiAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgb2xkX24wLFxuICAgICAgICBpMSA9IDA7XG5cbiAgICAgIGkwID0gMDtcblxuICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICBvbGRfbjAgPSBuMFxuICAgICAgICBuMCA9IG9sZFZhbHVlcy5sZW5ndGg7XG4gICAgICAgIG4xID0gdFxuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBpdGVyYWJsZSA/IG5ldyBBcnJheShuMCArIG4xKSA6IG5ldyBBcnJheShuKTtcbiAgICAgIGluZGV4ID0gaXRlcmFibGUgPyBuZXcgQXJyYXkobjAgKyBuMSkgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyb3NzZmlsdGVyX2luZGV4KG4wICsgbjEsIDEpO1xuXG4gICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgbmV3SXRlcmFibGVzSW5kZXhDb3VudCBvbnRvIHRoZSBvbGQgb25lLlxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgdmFyIG9sZGlpY2xlbmd0aCA9IGl0ZXJhYmxlc0luZGV4Q291bnQubGVuZ3RoO1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0geGZpbHRlckFycmF5LmFycmF5TGVuZ3RoZW4oaXRlcmFibGVzSW5kZXhDb3VudCwgbik7XG4gICAgICAgIGZvcih2YXIgaj0wOyBqK29sZGlpY2xlbmd0aCA8IG47IGorKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbaitvbGRpaWNsZW5ndGhdID0gbmV3SXRlcmFibGVzSW5kZXhDb3VudFtqXTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNZXJnZSB0aGUgb2xkIGFuZCBuZXcgc29ydGVkIHZhbHVlcywgYW5kIG9sZCBhbmQgbmV3IGluZGV4LlxuICAgICAgdmFyIGluZGV4NSA9IDA7XG4gICAgICBmb3IgKDsgaTAgPCBuMCAmJiBpMSA8IG4xOyArK2luZGV4NSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaW5kZXg1XSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4NV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMF07XG4gICAgICAgICAgaW5kZXhbaW5kZXg1XSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpbmRleDVdID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaW5kZXg1XSA9IG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2kxXTtcbiAgICAgICAgICBpbmRleFtpbmRleDVdID0gbmV3SW5kZXhbaTErK10gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2luZGV4NSkge1xuICAgICAgICB2YWx1ZXNbaW5kZXg1XSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpbmRleDVdID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICBpbmRleFtpbmRleDVdID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraW5kZXg1KSB7XG4gICAgICAgIHZhbHVlc1tpbmRleDVdID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2luZGV4NV0gPSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgIGluZGV4W2luZGV4NV0gPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpLCBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIGFsbCBmaWx0ZXJzIGhhdmUgdXBkYXRlZCwgbm90aWZ5IGluZGV4IGxpc3RlbmVycyBvZiB0aGUgbmV3IHZhbHVlcy5cbiAgICBmdW5jdGlvbiBwb3N0QWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuICAgICAgaW5kZXhMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKTsgfSk7XG4gICAgICBuZXdWYWx1ZXMgPSBuZXdJbmRleCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRGF0YShyZUluZGV4KSB7XG4gICAgICBpZiAoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yICh2YXIgaTAgPSAwLCBpMSA9IDA7IGkwIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaTArKykge1xuICAgICAgICAgIGlmIChyZUluZGV4W2l0ZXJhYmxlc0VtcHR5Um93c1tpMF1dICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3NbaTFdID0gcmVJbmRleFtpdGVyYWJsZXNFbXB0eVJvd3NbaTBdXTtcbiAgICAgICAgICAgIGkxKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggPSBpMTtcbiAgICAgICAgZm9yIChpMCA9IDAsIGkxID0gMDsgaTAgPCBuOyBpMCsrKSB7XG4gICAgICAgICAgaWYgKHJlSW5kZXhbaTBdICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICBpZiAoaTEgIT09IGkwKSBpdGVyYWJsZXNJbmRleENvdW50W2kxXSA9IGl0ZXJhYmxlc0luZGV4Q291bnRbaTBdO1xuICAgICAgICAgICAgaTErKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudC5sZW5ndGggPSBpMTtcbiAgICAgIH1cbiAgICAgIC8vIFJld3JpdGUgb3VyIGluZGV4LCBvdmVyd3JpdGluZyByZW1vdmVkIHZhbHVlc1xuICAgICAgdmFyIG4wID0gdmFsdWVzLmxlbmd0aDtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgb2xkRGF0YUluZGV4OyBpIDwgbjA7ICsraSkge1xuICAgICAgICBvbGREYXRhSW5kZXggPSBpbmRleFtpXTtcbiAgICAgICAgaWYgKHJlSW5kZXhbb2xkRGF0YUluZGV4XSAhPT0gUkVNT1ZFRF9JTkRFWCkge1xuICAgICAgICAgIGlmIChpICE9PSBqKSB2YWx1ZXNbal0gPSB2YWx1ZXNbaV07XG4gICAgICAgICAgaW5kZXhbal0gPSByZUluZGV4W29sZERhdGFJbmRleF07XG4gICAgICAgICAgaWYgKGl0ZXJhYmxlKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tqXSA9IGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgaWYgKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuMCkgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG5cbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9LCBib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSB2YWx1ZXMubGVuZ3RoKTtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgayxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZCA9IFtdO1xuXG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGxvIGluZGV4LlxuICAgICAgaWYgKGxvMSA8IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzEsIGogPSBNYXRoLm1pbihsbzAsIGhpMSk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBhZGRlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChsbzEgPiBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8wLCBqID0gTWF0aC5taW4obG8xLCBoaTApOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGhpIGluZGV4LlxuICAgICAgaWYgKGhpMSA+IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzEsIGhpMCksIGogPSBoaTE7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBhZGRlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoaTEgPCBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8wLCBoaTEpLCBqID0gaGkwOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCFpdGVyYWJsZSkge1xuICAgICAgICAvLyBGbGlwIGZpbHRlcnMgbm9ybWFsbHkuXG5cbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGk9MDsgaTxyZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgfVxuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3IgaXRlcmFibGVzLCB3ZSBuZWVkIHRvIGZpZ3VyZSBvdXQgaWYgdGhlIHJvdyBoYXMgYmVlbiBjb21wbGV0ZWx5IHJlbW92ZWQgdnMgcGFydGlhbGx5IGluY2x1ZGVkXG4gICAgICAgIC8vIE9ubHkgY291bnQgYSByb3cgYXMgYWRkZWQgaWYgaXQgaXMgbm90IGFscmVhZHkgYmVpbmcgYWdncmVnYXRlZC4gT25seSBjb3VudCBhIHJvd1xuICAgICAgICAvLyBhcyByZW1vdmVkIGlmIHRoZSBsYXN0IGVsZW1lbnQgYmVpbmcgYWdncmVnYXRlZCBpcyByZW1vdmVkLlxuXG4gICAgICAgIHZhciBuZXdBZGRlZCA9IFtdO1xuICAgICAgICB2YXIgbmV3UmVtb3ZlZCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSsrXG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9IDA7XG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0gPT09IDEpIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gXj0gb25lO1xuICAgICAgICAgICAgbmV3QWRkZWQucHVzaChhZGRlZFtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXS0tXG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID0gMTtcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dID09PSAwKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICAgICAgbmV3UmVtb3ZlZC5wdXNoKHJlbW92ZWRbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZGVkID0gbmV3QWRkZWQ7XG4gICAgICAgIHJlbW92ZWQgPSBuZXdSZW1vdmVkO1xuXG4gICAgICAgIC8vIE5vdyBoYW5kbGUgZW1wdHkgcm93cy5cbiAgICAgICAgaWYoYm91bmRzWzBdID09PSAwICYmIGJvdW5kc1sxXSA9PT0gdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIHRoZSBzcGVjaWZpZWQgcmFuZ2UsIHZhbHVlLCBvciBudWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBudWxsLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyQWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBhbiBhcnJheSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlclJhbmdlLlxuICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckV4YWN0LlxuICAgIGZ1bmN0aW9uIGZpbHRlcihyYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlID09IG51bGxcbiAgICAgICAgICA/IGZpbHRlckFsbCgpIDogQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgICA/IGZpbHRlclJhbmdlKHJhbmdlKSA6IHR5cGVvZiByYW5nZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBmaWx0ZXJGdW5jdGlvbihyYW5nZSlcbiAgICAgICAgICA6IGZpbHRlckV4YWN0KHJhbmdlKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgZXhhY3QgdmFsdWUuXG4gICAgZnVuY3Rpb24gZmlsdGVyRXhhY3QodmFsdWUpIHtcbiAgICAgIGZpbHRlclZhbHVlID0gdmFsdWU7XG4gICAgICBmaWx0ZXJWYWx1ZVByZXNlbnQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBzcGVjaWZpZWQgcmFuZ2UgW2xvLCBoaV0uXG4gICAgLy8gVGhlIGxvd2VyIGJvdW5kIGlzIGluY2x1c2l2ZSwgYW5kIHRoZSB1cHBlciBib3VuZCBpcyBleGNsdXNpdmUuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmFuZ2UocmFuZ2UpIHtcbiAgICAgIGZpbHRlclZhbHVlID0gcmFuZ2U7XG4gICAgICBmaWx0ZXJWYWx1ZVByZXNlbnQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIENsZWFycyBhbnkgZmlsdGVycyBvbiB0aGlzIGRpbWVuc2lvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgICBmaWx0ZXJWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgIGZpbHRlclZhbHVlUHJlc2VudCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyQWxsKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIGFuIGFyYml0cmFyeSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJGdW5jdGlvbihmKSB7XG4gICAgICBmaWx0ZXJWYWx1ZSA9IGY7XG4gICAgICBmaWx0ZXJWYWx1ZVByZXNlbnQgPSB0cnVlO1xuICAgICAgXG4gICAgICByZWZpbHRlckZ1bmN0aW9uID0gZjtcbiAgICAgIHJlZmlsdGVyID0geGZpbHRlckZpbHRlci5maWx0ZXJBbGw7XG5cbiAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24oZiwgZmFsc2UpO1xuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZiwgZmlsdGVyQWxsKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQgPSBbXSxcbiAgICAgICAgICBpbmRleExlbmd0aCA9IHZhbHVlcy5sZW5ndGg7XG5cbiAgICAgIGlmKCFpdGVyYWJsZSkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5kZXhMZW5ndGg7ICsraSkge1xuICAgICAgICAgIGlmICghKGZpbHRlcnNbb2Zmc2V0XVtrID0gaW5kZXhbaV1dICYgb25lKSBeICEhKHggPSBmKHZhbHVlc1tpXSwgaSkpKSB7XG4gICAgICAgICAgICBpZiAoeCkgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICAgIGVsc2UgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICBmb3IoaT0wOyBpIDwgaW5kZXhMZW5ndGg7ICsraSkge1xuICAgICAgICAgIGlmKGYodmFsdWVzW2ldLCBpKSkge1xuICAgICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQucHVzaChpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKCFpdGVyYWJsZSkge1xuICAgICAgICBmb3IoaT0wOyBpPGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSAmIG9uZSkgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSAmPSB6ZXJvO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yKGk9MDsgaTxyZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gJiBvbmUpKSBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gfD0gb25lO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuXG4gICAgICAgIHZhciBuZXdBZGRlZCA9IFtdO1xuICAgICAgICB2YXIgbmV3UmVtb3ZlZCA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBGaXJzdCBjaGVjayB0aGlzIHBhcnRpY3VsYXIgdmFsdWUgbmVlZHMgdG8gYmUgYWRkZWRcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4QWRkZWRbaV1dID09PSAxKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSsrXG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4QWRkZWRbaV1dID0gMDtcbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dID09PSAxKSB7XG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gXj0gb25lO1xuICAgICAgICAgICAgICBuZXdBZGRlZC5wdXNoKGFkZGVkW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAvLyBGaXJzdCBjaGVjayB0aGlzIHBhcnRpY3VsYXIgdmFsdWUgbmVlZHMgdG8gYmUgcmVtb3ZlZFxuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXS0tXG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPSAxO1xuICAgICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICAgICAgICBuZXdSZW1vdmVkLnB1c2gocmVtb3ZlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkZWQgPSBuZXdBZGRlZDtcbiAgICAgICAgcmVtb3ZlZCA9IG5ld1JlbW92ZWQ7XG5cbiAgICAgICAgLy8gTm93IGhhbmRsZSBlbXB0eSByb3dzLlxuICAgICAgICBpZihmaWx0ZXJBbGwpIHtcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKChmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBub3QgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIGFkZFxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgaW4gcGxhY2UgLSByZW1vdmUgZW1wdHkgcm93cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIHJlbW92ZVxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHRyaWdnZXJPbkNoYW5nZSgnZmlsdGVyZWQnKTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gY3VycmVudEZpbHRlcigpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJWYWx1ZTtcbiAgICB9XG4gICAgXG4gICAgZnVuY3Rpb24gaGFzQ3VycmVudEZpbHRlcigpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJWYWx1ZVByZXNlbnQ7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrLCB0b3Bfb2Zmc2V0KSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGosXG4gICAgICAgICAgdG9Ta2lwID0gMDtcblxuICAgICAgaWYodG9wX29mZnNldCAmJiB0b3Bfb2Zmc2V0ID4gMCkgdG9Ta2lwID0gdG9wX29mZnNldDtcblxuICAgICAgd2hpbGUgKC0taSA+PSBsbzAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYodG9Ta2lwID4gMCkge1xuICAgICAgICAgICAgLy9za2lwIG1hdGNoaW5nIHJvd1xuICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aCAmJiBrID4gMDsgaSsrKSB7XG4gICAgICAgICAgLy8gQWRkIHJvdyB3aXRoIGVtcHR5IGl0ZXJhYmxlIGNvbHVtbiBhdCB0aGUgZW5kXG4gICAgICAgICAgaWYoZmlsdGVycy56ZXJvKGogPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV0pKSB7XG4gICAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgICAtLWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGssIGJvdHRvbV9vZmZzZXQpIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICB0b1NraXAgPSAwO1xuXG4gICAgICBpZihib3R0b21fb2Zmc2V0ICYmIGJvdHRvbV9vZmZzZXQgPiAwKSB0b1NraXAgPSBib3R0b21fb2Zmc2V0O1xuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICAvLyBBZGQgcm93IHdpdGggZW1wdHkgaXRlcmFibGUgY29sdW1uIGF0IHRoZSB0b3BcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aCAmJiBrID4gMDsgaSsrKSB7XG4gICAgICAgICAgaWYoZmlsdGVycy56ZXJvKGogPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV0pKSB7XG4gICAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgICAgLS10b1NraXA7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgICAtLWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGkgPSBsbzA7XG5cbiAgICAgIHdoaWxlIChpIDwgaGkwICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGlmKHRvU2tpcCA+IDApIHtcbiAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgIC0tdG9Ta2lwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgLS1rO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIGEgbmV3IGdyb3VwIHRvIHRoaXMgZGltZW5zaW9uLCB1c2luZyB0aGUgc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBncm91cChrZXkpIHtcbiAgICAgIHZhciBncm91cCA9IHtcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgICAgb3JkZXI6IG9yZGVyLFxuICAgICAgICBvcmRlck5hdHVyYWw6IG9yZGVyTmF0dXJhbCxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgfTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBncm91cCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgZGltZW5zaW9uIGlzIHJlbW92ZWQuXG4gICAgICBkaW1lbnNpb25Hcm91cHMucHVzaChncm91cCk7XG5cbiAgICAgIHZhciBncm91cHMsIC8vIGFycmF5IG9mIHtrZXksIHZhbHVlfVxuICAgICAgICAgIGdyb3VwSW5kZXgsIC8vIG9iamVjdCBpZCDihqYgZ3JvdXAgaWRcbiAgICAgICAgICBncm91cFdpZHRoID0gOCxcbiAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCksXG4gICAgICAgICAgayA9IDAsIC8vIGNhcmRpbmFsaXR5XG4gICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgIGhlYXAsXG4gICAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZSxcbiAgICAgICAgICBncm91cEFsbCA9IGtleSA9PT0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICBuMG9sZDtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSBrZXkgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcblxuICAgICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgYXNzb2NpYXRlZCByZWR1Y2UgdmFsdWVzLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvXG4gICAgICAvLyB0aGUgcGFyZW50IGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLCBhbmQgY29tcHV0ZSBuZXcga2V5cy5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgICBpbmRleExpc3RlbmVycy5wdXNoKGFkZCk7XG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhlIGdyb3VwaW5nLlxuICAgICAgYWRkKHZhbHVlcywgaW5kZXgsIDAsIG4pO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGdyb3VwcyBhbmQgZ3JvdXBJbmRleC5cbiAgICAgIGZ1bmN0aW9uIGFkZChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpIHtcblxuICAgICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICAgIG4wb2xkID0gbjBcbiAgICAgICAgICBuMCA9IHZhbHVlcy5sZW5ndGggLSBuZXdWYWx1ZXMubGVuZ3RoXG4gICAgICAgICAgbjEgPSBuZXdWYWx1ZXMubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgIHJlSW5kZXggPSBpdGVyYWJsZSA/IFtdIDogY3Jvc3NmaWx0ZXJfaW5kZXgoaywgZ3JvdXBDYXBhY2l0eSksXG4gICAgICAgICAgICBhZGQgPSByZWR1Y2VBZGQsXG4gICAgICAgICAgICByZW1vdmUgPSByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgICBpbml0aWFsID0gcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICAgIGswID0gaywgLy8gb2xkIGNhcmRpbmFsaXR5XG4gICAgICAgICAgICBpMCA9IDAsIC8vIGluZGV4IG9mIG9sZCBncm91cFxuICAgICAgICAgICAgaTEgPSAwLCAvLyBpbmRleCBvZiBuZXcgcmVjb3JkXG4gICAgICAgICAgICBqLCAvLyBvYmplY3QgaWRcbiAgICAgICAgICAgIGcwLCAvLyBvbGQgZ3JvdXBcbiAgICAgICAgICAgIHgwLCAvLyBvbGQga2V5XG4gICAgICAgICAgICB4MSwgLy8gbmV3IGtleVxuICAgICAgICAgICAgZywgLy8gZ3JvdXAgdG8gYWRkXG4gICAgICAgICAgICB4OyAvLyBrZXkgb2YgZ3JvdXAgdG8gYWRkXG5cbiAgICAgICAgLy8gSWYgYSByZXNldCBpcyBuZWVkZWQsIHdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWVzLlxuICAgICAgICBpZiAocmVzZXROZWVkZWQpIGFkZCA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlbW92ZSA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBuZXcgZ3JvdXBzIChrIGlzIGEgbG93ZXIgYm91bmQpLlxuICAgICAgICAvLyBBbHNvLCBtYWtlIHN1cmUgdGhhdCBncm91cEluZGV4IGV4aXN0cyBhbmQgaXMgbG9uZyBlbm91Z2guXG4gICAgICAgIGdyb3VwcyA9IG5ldyBBcnJheShrKSwgayA9IDA7XG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBncm91cEluZGV4ID0gazAgPyBncm91cEluZGV4IDogW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8geGZpbHRlckFycmF5LmFycmF5TGVuZ3RoZW4oZ3JvdXBJbmRleCwgbikgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBncm91cENhcGFjaXR5KTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBvbGQga2V5ICh4MCBvZiBnMCksIGlmIGl0IGV4aXN0cy5cbiAgICAgICAgaWYgKGswKSB4MCA9IChnMCA9IG9sZEdyb3Vwc1swXSkua2V5O1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IG5ldyBrZXkgKHgxKSwgc2tpcHBpbmcgTmFOIGtleXMuXG4gICAgICAgIHdoaWxlIChpMSA8IG4xICYmICEoKHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pKSA+PSB4MSkpICsraTE7XG5cbiAgICAgICAgLy8gV2hpbGUgbmV3IGtleXMgcmVtYWlu4oCmXG4gICAgICAgIHdoaWxlIChpMSA8IG4xKSB7XG5cbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGxlc3NlciBvZiB0aGUgdHdvIGN1cnJlbnQga2V5czsgbmV3IGFuZCBvbGQuXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG9sZCBrZXlzIHJlbWFpbmluZywgdGhlbiBhbHdheXMgYWRkIHRoZSBuZXcga2V5LlxuICAgICAgICAgIGlmIChnMCAmJiB4MCA8PSB4MSkge1xuICAgICAgICAgICAgZyA9IGcwLCB4ID0geDA7XG5cbiAgICAgICAgICAgIC8vIFJlY29yZCB0aGUgbmV3IGluZGV4IG9mIHRoZSBvbGQgZ3JvdXAuXG4gICAgICAgICAgICByZUluZGV4W2kwXSA9IGs7XG5cbiAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBuZXh0IG9sZCBrZXkuXG4gICAgICAgICAgICBnMCA9IG9sZEdyb3Vwc1srK2kwXTtcbiAgICAgICAgICAgIGlmIChnMCkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuXG4gICAgICAgICAgd2hpbGUgKHgxIDw9IHgpIHtcbiAgICAgICAgICAgIGogPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBuMG9sZCA6IG4wKVxuXG5cbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgICAgaWYoZ3JvdXBJbmRleFtqXSl7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXS5wdXNoKGspXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdID0gW2tdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHdheXMgYWRkIG5ldyB2YWx1ZXMgdG8gZ3JvdXBzLiBPbmx5IHJlbW92ZSB3aGVuIG5vdCBpbiBmaWx0ZXIuXG4gICAgICAgICAgICAvLyBUaGlzIGdpdmVzIGdyb3VwcyBmdWxsIGluZm9ybWF0aW9uIG9uIGRhdGEgbGlmZS1jeWNsZS5cbiAgICAgICAgICAgIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChqLCBvZmZzZXQsIHplcm8pKSBnLnZhbHVlID0gcmVtb3ZlKGcudmFsdWUsIGRhdGFbal0sIGZhbHNlKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoMWFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBGaWxsIGluIGdhcHMgd2l0aCBlbXB0eSBhcnJheXMgd2hlcmUgdGhlcmUgbWF5IGhhdmUgYmVlbiByb3dzIHdpdGggZW1wdHkgaXRlcmFibGVzXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKHZhciBpbmRleDEgPSAwOyBpbmRleDEgPCBuOyBpbmRleDErKykge1xuICAgICAgICAgICAgaWYoIWdyb3VwSW5kZXhbaW5kZXgxXSl7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaW5kZXgxXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZihrID4gaTApe1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgIGZvciAoaTAgPSAwOyBpMCA8IG4wb2xkOyArK2kwKSB7XG4gICAgICAgICAgICAgIGZvciAoaW5kZXgxID0gMDsgaW5kZXgxIDwgZ3JvdXBJbmRleFtpMF0ubGVuZ3RoOyBpbmRleDErKykge1xuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbaTBdW2luZGV4MV0gPSByZUluZGV4W2dyb3VwSW5kZXhbaTBdW2luZGV4MV1dO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEgfHwgaXRlcmFibGUpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgaysrXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IHhmaWx0ZXJBcnJheS5hcnJheVdpZGVuKHJlSW5kZXgsIGdyb3VwV2lkdGggPDw9IDEpO1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IHhmaWx0ZXJBcnJheS5hcnJheVdpZGVuKGdyb3VwSW5kZXgsIGdyb3VwV2lkdGgpO1xuICAgICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgICAgaWYgKGsgPiAxIHx8IGl0ZXJhYmxlKSB7XG4gICAgICAgICAgdmFyIG9sZEsgPSBrLFxuICAgICAgICAgICAgICBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICAgIHNlZW5Hcm91cHMgPSBjcm9zc2ZpbHRlcl9pbmRleChvbGRLLCBvbGRLKSxcbiAgICAgICAgICAgICAgaSxcbiAgICAgICAgICAgICAgaTAsXG4gICAgICAgICAgICAgIGo7XG5cbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IG5vbi1tYXRjaGVzIGJ5IGNvcHlpbmcgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcyB0b1xuICAgICAgICAgIC8vIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGlmICghaXRlcmFibGUpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgIGlmIChyZUluZGV4W2ldICE9PSBSRU1PVkVEX0lOREVYKSB7XG4gICAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tncm91cEluZGV4W2pdID0gZ3JvdXBJbmRleFtpXV0gPSAxO1xuICAgICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICBpZiAocmVJbmRleFtpXSAhPT0gUkVNT1ZFRF9JTkRFWCkge1xuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldO1xuICAgICAgICAgICAgICAgIGZvciAoaTAgPSAwOyBpMCA8IGdyb3VwSW5kZXhbal0ubGVuZ3RoOyBpMCsrKSB7XG4gICAgICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal1baTBdXSA9IDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlYXNzZW1ibGUgZ3JvdXBzIGluY2x1ZGluZyBvbmx5IHRob3NlIGdyb3VwcyB0aGF0IHdlcmUgcmVmZXJyZWRcbiAgICAgICAgICAvLyB0byBieSBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzLiAgTm90ZSB0aGUgbmV3IGdyb3VwIGluZGV4IGluXG4gICAgICAgICAgLy8gc2Vlbkdyb3Vwcy5cbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9sZEs7ICsraSkge1xuICAgICAgICAgICAgaWYgKHNlZW5Hcm91cHNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tpXSA9IGsrKztcbiAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gob2xkR3JvdXBzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoayA+IDEgfHwgaXRlcmFibGUpIHtcbiAgICAgICAgICAgIC8vIFJlaW5kZXggdGhlIGdyb3VwIGluZGV4IHVzaW5nIHNlZW5Hcm91cHMgdG8gZmluZCB0aGUgbmV3IGluZGV4LlxuICAgICAgICAgICAgaWYgKCFpdGVyYWJsZSkge1xuICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgajsgKytpKSBncm91cEluZGV4W2ldID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkwID0gMDsgaTAgPCBncm91cEluZGV4W2ldLmxlbmd0aDsgKytpMCkge1xuICAgICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtpXVtpMF0gPSBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbaV1baTBdXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9IGsgPiAxIHx8IGl0ZXJhYmxlXG4gICAgICAgICAgICAgID8gKHJlc2V0ID0gcmVzZXRNYW55LCB1cGRhdGUgPSB1cGRhdGVNYW55KVxuICAgICAgICAgICAgICA6IGsgPT09IDEgPyAocmVzZXQgPSByZXNldE9uZSwgdXBkYXRlID0gdXBkYXRlT25lKVxuICAgICAgICAgICAgICA6IHJlc2V0ID0gdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgaWYgKGdyb3VwQWxsKSByZXR1cm47XG4gICAgICAgICAgZm9yICh2YXIgaW5kZXgzID0gMDsgaW5kZXgzIDwgbjsgKytpbmRleDMpIGlmIChyZUluZGV4W2luZGV4M10gIT09IFJFTU9WRURfSU5ERVgpIHJldHVybjtcbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID1cbiAgICAgICAgICB1cGRhdGUgPSByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlTWFueShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuXG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtrXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhba10ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBSZXNldCBhbGwgZ3JvdXAgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSB7XG4gICAgICAgICAgZ3JvdXBzW2ldLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldW2pdXTtcbiAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGFycmF5IG9mIGdyb3VwIHZhbHVlcywgaW4gdGhlIGRpbWVuc2lvbidzIG5hdHVyYWwgb3JkZXIuXG4gICAgICBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgSyBncm91cCB2YWx1ZXMsIGluIHJlZHVjZSBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxlY3QoYWxsKCksIDAsIGdyb3Vwcy5sZW5ndGgsIGspO1xuICAgICAgICByZXR1cm4gaGVhcC5zb3J0KHRvcCwgMCwgdG9wLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlcywgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoeGZpbHRlclJlZHVjZS5yZWR1Y2VJbmNyZW1lbnQsIHhmaWx0ZXJSZWR1Y2UucmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUFkZCh2YWx1ZSksIHhmaWx0ZXJSZWR1Y2UucmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0geGZpbHRlckhlYXBzZWxlY3QuYnkodmFsdWVPZik7XG4gICAgICAgIGhlYXAgPSB4ZmlsdGVySGVhcC5ieSh2YWx1ZU9mKTtcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVPZihkKSB7IHJldHVybiB2YWx1ZShkLnZhbHVlKTsgfVxuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBuYXR1cmFsIG9yZGVyaW5nIGJ5IHJlZHVjZSB2YWx1ZS5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyTmF0dXJhbCgpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyKGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgY2FyZGluYWxpdHkgb2YgdGhpcyBncm91cCwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICAgICAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBpbmRleExpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICAgIGlmIChpID49IDApIGluZGV4TGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBkaW1lbnNpb25Hcm91cHMuaW5kZXhPZihncm91cCk7XG4gICAgICAgIGlmIChpID49IDApIGRpbWVuc2lvbkdyb3Vwcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZHVjZUNvdW50KCkub3JkZXJOYXR1cmFsKCk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyBhIHNpbmdsZXRvbiBncm91cC5cbiAgICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICAgIHZhciBnID0gZ3JvdXAoY3Jvc3NmaWx0ZXJfbnVsbCksIGFsbCA9IGcuYWxsO1xuICAgICAgZGVsZXRlIGcuYWxsO1xuICAgICAgZGVsZXRlIGcudG9wO1xuICAgICAgZGVsZXRlIGcub3JkZXI7XG4gICAgICBkZWxldGUgZy5vcmRlck5hdHVyYWw7XG4gICAgICBkZWxldGUgZy5zaXplO1xuICAgICAgZy52YWx1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsKClbMF0udmFsdWU7IH07XG4gICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZGltZW5zaW9uIGFuZCBhc3NvY2lhdGVkIGdyb3VwcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICBkaW1lbnNpb25Hcm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBncm91cC5kaXNwb3NlKCk7IH0pO1xuICAgICAgdmFyIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocHJlQWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwb3N0QWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgZmlsdGVycy5tYXNrc1tvZmZzZXRdICY9IHplcm87XG4gICAgICByZXR1cm4gZmlsdGVyQWxsKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgfVxuXG4gIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBncm91cEFsbCBvbiBhIGR1bW15IGRpbWVuc2lvbi5cbiAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgb3B0aW1pemVkIHNpbmNlIGl0IGFsd2F5cyBoYXMgY2FyZGluYWxpdHkgMS5cbiAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgdmFyIGdyb3VwID0ge1xuICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciByZWR1Y2VWYWx1ZSxcbiAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcblxuICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWUuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG8gdGhlIHBhcmVudFxuICAgIC8vIGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLlxuICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKGFkZCk7XG5cbiAgICAvLyBGb3IgY29uc2lzdGVuY3k7IGFjdHVhbGx5IGEgbm8tb3Agc2luY2UgcmVzZXROZWVkZWQgaXMgdHJ1ZS5cbiAgICBhZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICBmdW5jdGlvbiBhZGQobmV3RGF0YSwgbjApIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IG4wOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICBmdW5jdGlvbiB1cGRhdGUoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbjtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGsgPSBhZGRlZFtpXSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLm9ubHkoayA9IHJlbW92ZWRbaV0sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlIGZyb20gc2NyYXRjaC5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGl0IGlzIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWUsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUluY3JlbWVudCwgeGZpbHRlclJlZHVjZS5yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUFkZCh2YWx1ZSksIHhmaWx0ZXJSZWR1Y2UucmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgcmF3IHJvdyBkYXRhIGNvbnRhaW5lZCBpbiB0aGlzIGNyb3NzZmlsdGVyXG4gIGZ1bmN0aW9uIGFsbCgpe1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgLy8gUmV0dXJucyByb3cgZGF0YSB3aXRoIGFsbCBkaW1lbnNpb24gZmlsdGVycyBhcHBsaWVkLCBleGNlcHQgZm9yIGZpbHRlcnMgaW4gaWdub3JlX2RpbWVuc2lvbnNcbiAgZnVuY3Rpb24gYWxsRmlsdGVyZWQoaWdub3JlX2RpbWVuc2lvbnMpIHtcbiAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgaSA9IDAsXG4gICAgICAgIG1hc2sgPSBtYXNrRm9yRGltZW5zaW9ucyhpZ25vcmVfZGltZW5zaW9ucyB8fCBbXSk7XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdE1hc2soaSwgbWFzaykpIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKGNiKXtcbiAgICBpZih0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpe1xuICAgICAgLyogZXNsaW50IG5vLWNvbnNvbGU6IDAgKi9cbiAgICAgIGNvbnNvbGUud2Fybignb25DaGFuZ2UgY2FsbGJhY2sgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbGJhY2tzLnB1c2goY2IpO1xuICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShjYWxsYmFja3MuaW5kZXhPZihjYiksIDEpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyT25DaGFuZ2UoZXZlbnROYW1lKXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2tzW2ldKGV2ZW50TmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyB4ZmlsdGVyQXJyYXkuYXJyYXk4IDogbSA8IDB4MTAwMDFcbiAgICAgID8geGZpbHRlckFycmF5LmFycmF5MTZcbiAgICAgIDogeGZpbHRlckFycmF5LmFycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgdmFsdWUsIDAsIG4pLCBiaXNlY3QucmlnaHQodmFsdWVzLCB2YWx1ZSwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSB7XG4gIHZhciBtaW4gPSByYW5nZVswXSxcbiAgICAgIG1heCA9IHJhbmdlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCBtaW4sIDAsIG4pLCBiaXNlY3QubGVmdCh2YWx1ZXMsIG1heCwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwodmFsdWVzKSB7XG4gIHJldHVybiBbMCwgdmFsdWVzLmxlbmd0aF07XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBmaWx0ZXJFeGFjdDogY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QsXG4gIGZpbHRlclJhbmdlOiBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZSxcbiAgZmlsdGVyQWxsOiBjcm9zc2ZpbHRlcl9maWx0ZXJBbGxcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGhlYXBfYnk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcbnZhciB4RmlsdGVySGVhcCA9IHJlcXVpcmUoJy4vaGVhcCcpO1xuXG5mdW5jdGlvbiBoZWFwc2VsZWN0X2J5KGYpIHtcbiAgdmFyIGhlYXAgPSB4RmlsdGVySGVhcC5ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoZihkID0gYVtsb10pID4gbWluKSB7XG4gICAgICAgICAgcXVldWVbMF0gPSBkO1xuICAgICAgICAgIG1pbiA9IGYoaGVhcChxdWV1ZSwgMCwgaylbMF0pO1xuICAgICAgICB9XG4gICAgICB9IHdoaWxlICgrK2xvIDwgaGkpO1xuICAgIH1cblxuICAgIHJldHVybiBxdWV1ZTtcbiAgfVxuXG4gIHJldHVybiBoZWFwc2VsZWN0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGhlYXBzZWxlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xubW9kdWxlLmV4cG9ydHMuYnkgPSBoZWFwc2VsZWN0X2J5OyAvLyBhc3NpZ24gdGhlIHJhdyBmdW5jdGlvbiB0byB0aGUgZXhwb3J0IGFzIHdlbGxcbiIsIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaWRlbnRpdHkoZCkge1xuICByZXR1cm4gZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNyb3NzZmlsdGVyX2lkZW50aXR5ID0gcmVxdWlyZSgnLi9pZGVudGl0eScpO1xuXG5mdW5jdGlvbiBpbnNlcnRpb25zb3J0X2J5KGYpIHtcblxuICBmdW5jdGlvbiBpbnNlcnRpb25zb3J0KGEsIGxvLCBoaSkge1xuICAgIGZvciAodmFyIGkgPSBsbyArIDE7IGkgPCBoaTsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gaSwgdCA9IGFbaV0sIHggPSBmKHQpOyBqID4gbG8gJiYgZihhW2ogLSAxXSkgPiB4OyAtLWopIHtcbiAgICAgICAgYVtqXSA9IGFbaiAtIDFdO1xuICAgICAgfVxuICAgICAgYVtqXSA9IHQ7XG4gICAgfVxuICAgIHJldHVybiBhO1xuICB9XG5cbiAgcmV0dXJuIGluc2VydGlvbnNvcnQ7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaW5zZXJ0aW9uc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX251bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyb3NzZmlsdGVyX251bGw7XG4iLCIndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIHBlcm11dGUoYXJyYXksIGluZGV4LCBkZWVwKSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW5kZXgubGVuZ3RoLCBjb3B5ID0gZGVlcCA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXJyYXkpKSA6IG5ldyBBcnJheShuKTsgaSA8IG47ICsraSkge1xuICAgIGNvcHlbaV0gPSBhcnJheVtpbmRleFtpXV07XG4gIH1cbiAgcmV0dXJuIGNvcHk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGVybXV0ZTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcbnZhciB4RmlsdGVySW5zZXJ0aW9uc29ydCA9IHJlcXVpcmUoJy4vaW5zZXJ0aW9uc29ydCcpO1xuXG4vLyBBbGdvcml0aG0gZGVzaWduZWQgYnkgVmxhZGltaXIgWWFyb3NsYXZza2l5LlxuLy8gSW1wbGVtZW50YXRpb24gYmFzZWQgb24gdGhlIERhcnQgcHJvamVjdDsgc2VlIE5PVElDRSBhbmQgQVVUSE9SUyBmb3IgZGV0YWlscy5cblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSB4RmlsdGVySW5zZXJ0aW9uc29ydC5ieShmKTtcblxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHJldHVybiAoaGkgLSBsbyA8IHF1aWNrc29ydF9zaXplVGhyZXNob2xkXG4gICAgICAgID8gaW5zZXJ0aW9uc29ydFxuICAgICAgICA6IHF1aWNrc29ydCkoYSwgbG8sIGhpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1aWNrc29ydChhLCBsbywgaGkpIHtcbiAgICAvLyBDb21wdXRlIHRoZSB0d28gcGl2b3RzIGJ5IGxvb2tpbmcgYXQgNSBlbGVtZW50cy5cbiAgICB2YXIgc2l4dGggPSAoaGkgLSBsbykgLyA2IHwgMCxcbiAgICAgICAgaTEgPSBsbyArIHNpeHRoLFxuICAgICAgICBpNSA9IGhpIC0gMSAtIHNpeHRoLFxuICAgICAgICBpMyA9IGxvICsgaGkgLSAxID4+IDEsICAvLyBUaGUgbWlkcG9pbnQuXG4gICAgICAgIGkyID0gaTMgLSBzaXh0aCxcbiAgICAgICAgaTQgPSBpMyArIHNpeHRoO1xuXG4gICAgdmFyIGUxID0gYVtpMV0sIHgxID0gZihlMSksXG4gICAgICAgIGUyID0gYVtpMl0sIHgyID0gZihlMiksXG4gICAgICAgIGUzID0gYVtpM10sIHgzID0gZihlMyksXG4gICAgICAgIGU0ID0gYVtpNF0sIHg0ID0gZihlNCksXG4gICAgICAgIGU1ID0gYVtpNV0sIHg1ID0gZihlNSk7XG5cbiAgICB2YXIgdDtcblxuICAgIC8vIFNvcnQgdGhlIHNlbGVjdGVkIDUgZWxlbWVudHMgdXNpbmcgYSBzb3J0aW5nIG5ldHdvcmsuXG4gICAgaWYgKHgxID4geDIpIHQgPSBlMSwgZTEgPSBlMiwgZTIgPSB0LCB0ID0geDEsIHgxID0geDIsIHgyID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MSA+IHgzKSB0ID0gZTEsIGUxID0gZTMsIGUzID0gdCwgdCA9IHgxLCB4MSA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDEgPiB4NCkgdCA9IGUxLCBlMSA9IGU0LCBlNCA9IHQsIHQgPSB4MSwgeDEgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MyA+IHg0KSB0ID0gZTMsIGUzID0gZTQsIGU0ID0gdCwgdCA9IHgzLCB4MyA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgyID4geDUpIHQgPSBlMiwgZTIgPSBlNSwgZTUgPSB0LCB0ID0geDIsIHgyID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG5cbiAgICB2YXIgcGl2b3QxID0gZTIsIHBpdm90VmFsdWUxID0geDIsXG4gICAgICAgIHBpdm90MiA9IGU0LCBwaXZvdFZhbHVlMiA9IHg0O1xuXG4gICAgLy8gZTIgYW5kIGU0IGhhdmUgYmVlbiBzYXZlZCBpbiB0aGUgcGl2b3QgdmFyaWFibGVzLiBUaGV5IHdpbGwgYmUgd3JpdHRlblxuICAgIC8vIGJhY2ssIG9uY2UgdGhlIHBhcnRpdGlvbmluZyBpcyBmaW5pc2hlZC5cbiAgICBhW2kxXSA9IGUxO1xuICAgIGFbaTJdID0gYVtsb107XG4gICAgYVtpM10gPSBlMztcbiAgICBhW2k0XSA9IGFbaGkgLSAxXTtcbiAgICBhW2k1XSA9IGU1O1xuXG4gICAgdmFyIGxlc3MgPSBsbyArIDEsICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cbiAgICAgICAgZ3JlYXQgPSBoaSAtIDI7ICAvLyBMYXN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG5cbiAgICAvLyBOb3RlIHRoYXQgZm9yIHZhbHVlIGNvbXBhcmlzb24sIDwsIDw9LCA+PSBhbmQgPiBjb2VyY2UgdG8gYSBwcmltaXRpdmUgdmlhXG4gICAgLy8gT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mOyA9PSBhbmQgPT09IGRvIG5vdCwgc28gaW4gb3JkZXIgdG8gYmUgY29uc2lzdGVudFxuICAgIC8vIHdpdGggbmF0dXJhbCBvcmRlciAoc3VjaCBhcyBmb3IgRGF0ZSBvYmplY3RzKSwgd2UgbXVzdCBkbyB0d28gY29tcGFyZXMuXG4gICAgdmFyIHBpdm90c0VxdWFsID0gcGl2b3RWYWx1ZTEgPD0gcGl2b3RWYWx1ZTIgJiYgcGl2b3RWYWx1ZTEgPj0gcGl2b3RWYWx1ZTI7XG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG5cbiAgICAgIC8vIERlZ2VuZXJhdGVkIGNhc2Ugd2hlcmUgdGhlIHBhcnRpdGlvbmluZyBiZWNvbWVzIGEgZHV0Y2ggbmF0aW9uYWwgZmxhZ1xuICAgICAgLy8gcHJvYmxlbS5cbiAgICAgIC8vXG4gICAgICAvLyBbIHwgIDwgcGl2b3QgIHwgPT0gcGl2b3QgfCB1bnBhcnRpdGlvbmVkIHwgPiBwaXZvdCAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgICBeICAgICAgICAgIF4gICAgICAgICAgICAgXiAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgayAgICAgICAgICAgZ3JlYXQgICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMSkgZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90LlxuICAgICAgLy8gICAyKSBmb3IgeCBpbiBbbGVzcywga1sgOiB4ID09IHBpdm90LlxuICAgICAgLy8gICAzKSBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdC5cbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyArK2spIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIGlmICh4ayA+IHBpdm90VmFsdWUxKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBlbGVtZW50IDw9IHBpdm90IGluIHRoZSByYW5nZSBbayAtIDEsIGdyZWF0XSBhbmRcbiAgICAgICAgICAvLyBwdXQgWzplazpdIHRoZXJlLiBXZSBrbm93IHRoYXQgc3VjaCBhbiBlbGVtZW50IG11c3QgZXhpc3Q6XG4gICAgICAgICAgLy8gV2hlbiBrID09IGxlc3MsIHRoZW4gZWwzICh3aGljaCBpcyBlcXVhbCB0byBwaXZvdCkgbGllcyBpbiB0aGVcbiAgICAgICAgICAvLyBpbnRlcnZhbC4gT3RoZXJ3aXNlIGFbayAtIDFdID09IHBpdm90IGFuZCB0aGUgc2VhcmNoIHN0b3BzIGF0IGstMS5cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgaW4gdGhlIGxhdHRlciBjYXNlIGludmFyaWFudCAyIHdpbGwgYmUgdmlvbGF0ZWQgZm9yIGFcbiAgICAgICAgICAvLyBzaG9ydCBhbW91bnQgb2YgdGltZS4gVGhlIGludmFyaWFudCB3aWxsIGJlIHJlc3RvcmVkIHdoZW4gdGhlXG4gICAgICAgICAgLy8gcGl2b3RzIGFyZSBwdXQgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgICAgICAgLyogZXNsaW50IG5vLWNvbnN0YW50LWNvbmRpdGlvbjogMCAqL1xuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluIHRoZSB3aGlsZS1sb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IGlmIGdyZWF0IDwgayB0aGVuIHdlIHdpbGwgZXhpdCB0aGUgb3V0ZXIgbG9vcCBhbmQgZml4XG4gICAgICAgICAgICAgIC8vIGludmFyaWFudCAyICh3aGljaCB3ZSBqdXN0IHZpb2xhdGVkKS5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPCBwaXZvdDFcbiAgICAgIC8vICAyLiA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyXG4gICAgICAvLyAgMy4gPiBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgfCA8IHBpdm90MSB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID4gcGl2b3QyICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDw9IHggJiYgeCA8PSBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QyXG4gICAgICAoZnVuY3Rpb24gKCkgeyAvLyBpc29sYXRlIHNjb3BlXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPD0gcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID49IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIH0pKCk7IC8vIGlzb2xhdGUgc2NvcGVcbiAgICB9XG5cbiAgICAvLyBNb3ZlIHBpdm90cyBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAvLyBXZSBzaHJ1bmsgdGhlIGxpc3QgZnJvbSBib3RoIHNpZGVzIChhW2xlZnRdIGFuZCBhW3JpZ2h0XSBoYXZlXG4gICAgLy8gbWVhbmluZ2xlc3MgdmFsdWVzIGluIHRoZW0pIGFuZCBub3cgd2UgbW92ZSBlbGVtZW50cyBmcm9tIHRoZSBmaXJzdFxuICAgIC8vIGFuZCB0aGlyZCBwYXJ0aXRpb24gaW50byB0aGVzZSBsb2NhdGlvbnMgc28gdGhhdCB3ZSBjYW4gc3RvcmUgdGhlXG4gICAgLy8gcGl2b3RzLlxuICAgIGFbbG9dID0gYVtsZXNzIC0gMV07XG4gICAgYVtsZXNzIC0gMV0gPSBwaXZvdDE7XG4gICAgYVtoaSAtIDFdID0gYVtncmVhdCArIDFdO1xuICAgIGFbZ3JlYXQgKyAxXSA9IHBpdm90MjtcblxuICAgIC8vIFRoZSBsaXN0IGlzIG5vdyBwYXJ0aXRpb25lZCBpbnRvIHRocmVlIHBhcnRpdGlvbnM6XG4gICAgLy8gWyA8IHBpdm90MSAgIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgIHwgID4gcGl2b3QyICAgXVxuICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG5cbiAgICAvLyBSZWN1cnNpdmUgZGVzY2VudC4gKERvbid0IGluY2x1ZGUgdGhlIHBpdm90IHZhbHVlcy4pXG4gICAgc29ydChhLCBsbywgbGVzcyAtIDEpO1xuICAgIHNvcnQoYSwgZ3JlYXQgKyAyLCBoaSk7XG5cbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcbiAgICAgIC8vIEFsbCBlbGVtZW50cyBpbiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBhcmUgZXF1YWwgdG8gdGhlIHBpdm90LiBOb1xuICAgICAgLy8gbmVlZCB0byBzb3J0IHRoZW0uXG4gICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICAvLyBJbiB0aGVvcnkgaXQgc2hvdWxkIGJlIGVub3VnaCB0byBjYWxsIF9kb1NvcnQgcmVjdXJzaXZlbHkgb24gdGhlIHNlY29uZFxuICAgIC8vIHBhcnRpdGlvbi5cbiAgICAvLyBUaGUgQW5kcm9pZCBzb3VyY2UgaG93ZXZlciByZW1vdmVzIHRoZSBwaXZvdCBlbGVtZW50cyBmcm9tIHRoZSByZWN1cnNpdmVcbiAgICAvLyBjYWxsIGlmIHRoZSBzZWNvbmQgcGFydGl0aW9uIGlzIHRvbyBsYXJnZSAobW9yZSB0aGFuIDIvMyBvZiB0aGUgbGlzdCkuXG4gICAgaWYgKGxlc3MgPCBpMSAmJiBncmVhdCA+IGk1KSB7XG5cbiAgICAgIChmdW5jdGlvbiAoKSB7IC8vIGlzb2xhdGUgc2NvcGVcbiAgICAgIHZhciBsZXNzVmFsdWUsIGdyZWF0VmFsdWU7XG4gICAgICB3aGlsZSAoKGxlc3NWYWx1ZSA9IGYoYVtsZXNzXSkpIDw9IHBpdm90VmFsdWUxICYmIGxlc3NWYWx1ZSA+PSBwaXZvdFZhbHVlMSkgKytsZXNzO1xuICAgICAgd2hpbGUgKChncmVhdFZhbHVlID0gZihhW2dyZWF0XSkpIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIC0tZ3JlYXQ7XG5cbiAgICAgIC8vIENvcHkgcGFzdGUgb2YgdGhlIHByZXZpb3VzIDMtd2F5IHBhcnRpdGlvbmluZyB3aXRoIGFkYXB0aW9ucy5cbiAgICAgIC8vXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA9PSBwaXZvdDFcbiAgICAgIC8vICAyLiA+IHBpdm90MSAmJiA8IHBpdm90MlxuICAgICAgLy8gIDMuID09IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyA9PSBwaXZvdDEgfCA+IHBpdm90MSAmJiA8IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPT0gcGl2b3QyIF1cbiAgICAgIC8vICAgICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF5cbiAgICAgIC8vICAgICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0XG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gWyAqLCBsZXNzWyA6IHggPT0gcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8IHggJiYgeCA8IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsICogXSA6IHggPT0gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMSAmJiB4ayA+PSBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVzcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMiAmJiB4ayA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgLyogZXNsaW50IG5vLWNvbnN0YW50LWNvbmRpdGlvbjogMCAqL1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIH0pKCk7IC8vIGlzb2xhdGUgc2NvcGVcblxuICAgIH1cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGhhcyBub3cgYmVlbiBjbGVhcmVkIG9mIHBpdm90IGVsZW1lbnRzIGFuZCBsb29rc1xuICAgIC8vIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPiBwaXZvdDEgJiYgPCBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNvcnQgdGhlIHNlY29uZCBwYXJ0aXRpb24gdXNpbmcgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBsb29rcyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID49IHBpdm90MSAmJiA8PSBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTaW1wbHkgc29ydCBpdCBieSByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIHJldHVybiBzb3J0KGEsIGxlc3MsIGdyZWF0ICsgMSk7XG4gIH1cblxuICByZXR1cm4gc29ydDtcbn1cblxudmFyIHF1aWNrc29ydF9zaXplVGhyZXNob2xkID0gMzI7XG5cbm1vZHVsZS5leHBvcnRzID0gcXVpY2tzb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbm1vZHVsZS5leHBvcnRzLmJ5ID0gcXVpY2tzb3J0X2J5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQocCkge1xuICByZXR1cm4gcCArIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudChwKSB7XG4gIHJldHVybiBwIC0gMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgLSBmKHYpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVkdWNlSW5jcmVtZW50OiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsXG4gIHJlZHVjZURlY3JlbWVudDogY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LFxuICByZWR1Y2VBZGQ6IGNyb3NzZmlsdGVyX3JlZHVjZUFkZCxcbiAgcmVkdWNlU3VidHJhY3Q6IGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcm9zc2ZpbHRlcl96ZXJvO1xuIiwiLyoqXG4gKiBsb2Rhc2ggKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pxdWVyeS5vcmcvPlxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICovXG5cbi8qKiBVc2VkIGFzIHRoZSBgVHlwZUVycm9yYCBtZXNzYWdlIGZvciBcIkZ1bmN0aW9uc1wiIG1ldGhvZHMuICovXG52YXIgRlVOQ19FUlJPUl9URVhUID0gJ0V4cGVjdGVkIGEgZnVuY3Rpb24nO1xuXG4vKiogVXNlZCB0byBzdGFuZC1pbiBmb3IgYHVuZGVmaW5lZGAgaGFzaCB2YWx1ZXMuICovXG52YXIgSEFTSF9VTkRFRklORUQgPSAnX19sb2Rhc2hfaGFzaF91bmRlZmluZWRfXyc7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVJc0RlZXBQcm9wID0gL1xcLnxcXFsoPzpbXltcXF1dKnwoW1wiJ10pKD86KD8hXFwxKVteXFxcXF18XFxcXC4pKj9cXDEpXFxdLyxcbiAgICByZUlzUGxhaW5Qcm9wID0gL15cXHcqJC8sXG4gICAgcmVMZWFkaW5nRG90ID0gL15cXC4vLFxuICAgIHJlUHJvcE5hbWUgPSAvW14uW1xcXV0rfFxcWyg/OigtP1xcZCsoPzpcXC5cXGQrKT8pfChbXCInXSkoKD86KD8hXFwyKVteXFxcXF18XFxcXC4pKj8pXFwyKVxcXXwoPz0oPzpcXC58XFxbXFxdKSg/OlxcLnxcXFtcXF18JCkpL2c7XG5cbi8qKlxuICogVXNlZCB0byBtYXRjaCBgUmVnRXhwYFxuICogW3N5bnRheCBjaGFyYWN0ZXJzXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1wYXR0ZXJucykuXG4gKi9cbnZhciByZVJlZ0V4cENoYXIgPSAvW1xcXFxeJC4qKz8oKVtcXF17fXxdL2c7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIGJhY2tzbGFzaGVzIGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHJlRXNjYXBlQ2hhciA9IC9cXFxcKFxcXFwpPy9nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaG9zdCBjb25zdHJ1Y3RvcnMgKFNhZmFyaSkuICovXG52YXIgcmVJc0hvc3RDdG9yID0gL15cXFtvYmplY3QgLis/Q29uc3RydWN0b3JcXF0kLztcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBnbG9iYWxgIGZyb20gTm9kZS5qcy4gKi9cbnZhciBmcmVlR2xvYmFsID0gdHlwZW9mIGdsb2JhbCA9PSAnb2JqZWN0JyAmJiBnbG9iYWwgJiYgZ2xvYmFsLk9iamVjdCA9PT0gT2JqZWN0ICYmIGdsb2JhbDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IHR5cGVvZiBzZWxmID09ICdvYmplY3QnICYmIHNlbGYgJiYgc2VsZi5PYmplY3QgPT09IE9iamVjdCAmJiBzZWxmO1xuXG4vKiogVXNlZCBhcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciByb290ID0gZnJlZUdsb2JhbCB8fCBmcmVlU2VsZiB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKipcbiAqIEdldHMgdGhlIHZhbHVlIGF0IGBrZXlgIG9mIGBvYmplY3RgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge09iamVjdH0gW29iamVjdF0gVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgcHJvcGVydHkgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHByb3BlcnR5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBnZXRWYWx1ZShvYmplY3QsIGtleSkge1xuICByZXR1cm4gb2JqZWN0ID09IG51bGwgPyB1bmRlZmluZWQgOiBvYmplY3Rba2V5XTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIGhvc3Qgb2JqZWN0IGluIElFIDwgOS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIGhvc3Qgb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzSG9zdE9iamVjdCh2YWx1ZSkge1xuICAvLyBNYW55IGhvc3Qgb2JqZWN0cyBhcmUgYE9iamVjdGAgb2JqZWN0cyB0aGF0IGNhbiBjb2VyY2UgdG8gc3RyaW5nc1xuICAvLyBkZXNwaXRlIGhhdmluZyBpbXByb3Blcmx5IGRlZmluZWQgYHRvU3RyaW5nYCBtZXRob2RzLlxuICB2YXIgcmVzdWx0ID0gZmFsc2U7XG4gIGlmICh2YWx1ZSAhPSBudWxsICYmIHR5cGVvZiB2YWx1ZS50b1N0cmluZyAhPSAnZnVuY3Rpb24nKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9ICEhKHZhbHVlICsgJycpO1xuICAgIH0gY2F0Y2ggKGUpIHt9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFVzZWQgZm9yIGJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzLiAqL1xudmFyIGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGUsXG4gICAgZnVuY1Byb3RvID0gRnVuY3Rpb24ucHJvdG90eXBlLFxuICAgIG9iamVjdFByb3RvID0gT2JqZWN0LnByb3RvdHlwZTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG92ZXJyZWFjaGluZyBjb3JlLWpzIHNoaW1zLiAqL1xudmFyIGNvcmVKc0RhdGEgPSByb290WydfX2NvcmUtanNfc2hhcmVkX18nXTtcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IG1ldGhvZHMgbWFzcXVlcmFkaW5nIGFzIG5hdGl2ZS4gKi9cbnZhciBtYXNrU3JjS2V5ID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgdWlkID0gL1teLl0rJC8uZXhlYyhjb3JlSnNEYXRhICYmIGNvcmVKc0RhdGEua2V5cyAmJiBjb3JlSnNEYXRhLmtleXMuSUVfUFJPVE8gfHwgJycpO1xuICByZXR1cm4gdWlkID8gKCdTeW1ib2woc3JjKV8xLicgKyB1aWQpIDogJyc7XG59KCkpO1xuXG4vKiogVXNlZCB0byByZXNvbHZlIHRoZSBkZWNvbXBpbGVkIHNvdXJjZSBvZiBmdW5jdGlvbnMuICovXG52YXIgZnVuY1RvU3RyaW5nID0gZnVuY1Byb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBjaGVjayBvYmplY3RzIGZvciBvd24gcHJvcGVydGllcy4gKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IG9iamVjdFByb3RvLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi83LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIFVzZWQgdG8gZGV0ZWN0IGlmIGEgbWV0aG9kIGlzIG5hdGl2ZS4gKi9cbnZhciByZUlzTmF0aXZlID0gUmVnRXhwKCdeJyArXG4gIGZ1bmNUb1N0cmluZy5jYWxsKGhhc093blByb3BlcnR5KS5yZXBsYWNlKHJlUmVnRXhwQ2hhciwgJ1xcXFwkJicpXG4gIC5yZXBsYWNlKC9oYXNPd25Qcm9wZXJ0eXwoZnVuY3Rpb24pLio/KD89XFxcXFxcKCl8IGZvciAuKz8oPz1cXFxcXFxdKS9nLCAnJDEuKj8nKSArICckJ1xuKTtcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2wsXG4gICAgc3BsaWNlID0gYXJyYXlQcm90by5zcGxpY2U7XG5cbi8qIEJ1aWx0LWluIG1ldGhvZCByZWZlcmVuY2VzIHRoYXQgYXJlIHZlcmlmaWVkIHRvIGJlIG5hdGl2ZS4gKi9cbnZhciBNYXAgPSBnZXROYXRpdmUocm9vdCwgJ01hcCcpLFxuICAgIG5hdGl2ZUNyZWF0ZSA9IGdldE5hdGl2ZShPYmplY3QsICdjcmVhdGUnKTtcblxuLyoqIFVzZWQgdG8gY29udmVydCBzeW1ib2xzIHRvIHByaW1pdGl2ZXMgYW5kIHN0cmluZ3MuICovXG52YXIgc3ltYm9sUHJvdG8gPSBTeW1ib2wgPyBTeW1ib2wucHJvdG90eXBlIDogdW5kZWZpbmVkLFxuICAgIHN5bWJvbFRvU3RyaW5nID0gc3ltYm9sUHJvdG8gPyBzeW1ib2xQcm90by50b1N0cmluZyA6IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgaGFzaCBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gW2VudHJpZXNdIFRoZSBrZXktdmFsdWUgcGFpcnMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIEhhc2goZW50cmllcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVudHJpZXMgPyBlbnRyaWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5jbGVhcigpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgIHRoaXMuc2V0KGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBoYXNoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIEhhc2hcbiAqL1xuZnVuY3Rpb24gaGFzaENsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0gbmF0aXZlQ3JlYXRlID8gbmF0aXZlQ3JlYXRlKG51bGwpIDoge307XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGhhc2guXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIEhhc2hcbiAqIEBwYXJhbSB7T2JqZWN0fSBoYXNoIFRoZSBoYXNoIHRvIG1vZGlmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBoYXNoRGVsZXRlKGtleSkge1xuICByZXR1cm4gdGhpcy5oYXMoa2V5KSAmJiBkZWxldGUgdGhpcy5fX2RhdGFfX1trZXldO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIGhhc2ggdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBIYXNoXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gaGFzaEdldChrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBpZiAobmF0aXZlQ3JlYXRlKSB7XG4gICAgdmFyIHJlc3VsdCA9IGRhdGFba2V5XTtcbiAgICByZXR1cm4gcmVzdWx0ID09PSBIQVNIX1VOREVGSU5FRCA/IHVuZGVmaW5lZCA6IHJlc3VsdDtcbiAgfVxuICByZXR1cm4gaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpID8gZGF0YVtrZXldIDogdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIGhhc2ggdmFsdWUgZm9yIGBrZXlgIGV4aXN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgaGFzXG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGhhc2hIYXMoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXztcbiAgcmV0dXJuIG5hdGl2ZUNyZWF0ZSA/IGRhdGFba2V5XSAhPT0gdW5kZWZpbmVkIDogaGFzT3duUHJvcGVydHkuY2FsbChkYXRhLCBrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGhhc2ggYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBoYXNoIGluc3RhbmNlLlxuICovXG5mdW5jdGlvbiBoYXNoU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICBkYXRhW2tleV0gPSAobmF0aXZlQ3JlYXRlICYmIHZhbHVlID09PSB1bmRlZmluZWQpID8gSEFTSF9VTkRFRklORUQgOiB2YWx1ZTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBIYXNoYC5cbkhhc2gucHJvdG90eXBlLmNsZWFyID0gaGFzaENsZWFyO1xuSGFzaC5wcm90b3R5cGVbJ2RlbGV0ZSddID0gaGFzaERlbGV0ZTtcbkhhc2gucHJvdG90eXBlLmdldCA9IGhhc2hHZXQ7XG5IYXNoLnByb3RvdHlwZS5oYXMgPSBoYXNoSGFzO1xuSGFzaC5wcm90b3R5cGUuc2V0ID0gaGFzaFNldDtcblxuLyoqXG4gKiBDcmVhdGVzIGFuIGxpc3QgY2FjaGUgb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBMaXN0Q2FjaGUoZW50cmllcykge1xuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IGVudHJpZXMgPyBlbnRyaWVzLmxlbmd0aCA6IDA7XG5cbiAgdGhpcy5jbGVhcigpO1xuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciBlbnRyeSA9IGVudHJpZXNbaW5kZXhdO1xuICAgIHRoaXMuc2V0KGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBrZXktdmFsdWUgZW50cmllcyBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVDbGVhcigpIHtcbiAgdGhpcy5fX2RhdGFfXyA9IFtdO1xufVxuXG4vKipcbiAqIFJlbW92ZXMgYGtleWAgYW5kIGl0cyB2YWx1ZSBmcm9tIHRoZSBsaXN0IGNhY2hlLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBkZWxldGVcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVEZWxldGUoa2V5KSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgbGFzdEluZGV4ID0gZGF0YS5sZW5ndGggLSAxO1xuICBpZiAoaW5kZXggPT0gbGFzdEluZGV4KSB7XG4gICAgZGF0YS5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBzcGxpY2UuY2FsbChkYXRhLCBpbmRleCwgMSk7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgbGlzdCBjYWNoZSB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZUdldChrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcblxuICByZXR1cm4gaW5kZXggPCAwID8gdW5kZWZpbmVkIDogZGF0YVtpbmRleF1bMV07XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgbGlzdCBjYWNoZSB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgZW50cnkgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYW4gZW50cnkgZm9yIGBrZXlgIGV4aXN0cywgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBsaXN0Q2FjaGVIYXMoa2V5KSB7XG4gIHJldHVybiBhc3NvY0luZGV4T2YodGhpcy5fX2RhdGFfXywga2V5KSA+IC0xO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIGxpc3QgY2FjaGUgYGtleWAgdG8gYHZhbHVlYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgc2V0XG4gKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGxpc3QgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZVNldChrZXksIHZhbHVlKSB7XG4gIHZhciBkYXRhID0gdGhpcy5fX2RhdGFfXyxcbiAgICAgIGluZGV4ID0gYXNzb2NJbmRleE9mKGRhdGEsIGtleSk7XG5cbiAgaWYgKGluZGV4IDwgMCkge1xuICAgIGRhdGEucHVzaChba2V5LCB2YWx1ZV0pO1xuICB9IGVsc2Uge1xuICAgIGRhdGFbaW5kZXhdWzFdID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBMaXN0Q2FjaGVgLlxuTGlzdENhY2hlLnByb3RvdHlwZS5jbGVhciA9IGxpc3RDYWNoZUNsZWFyO1xuTGlzdENhY2hlLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBsaXN0Q2FjaGVEZWxldGU7XG5MaXN0Q2FjaGUucHJvdG90eXBlLmdldCA9IGxpc3RDYWNoZUdldDtcbkxpc3RDYWNoZS5wcm90b3R5cGUuaGFzID0gbGlzdENhY2hlSGFzO1xuTGlzdENhY2hlLnByb3RvdHlwZS5zZXQgPSBsaXN0Q2FjaGVTZXQ7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcCBjYWNoZSBvYmplY3QgdG8gc3RvcmUga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IFtlbnRyaWVzXSBUaGUga2V5LXZhbHVlIHBhaXJzIHRvIGNhY2hlLlxuICovXG5mdW5jdGlvbiBNYXBDYWNoZShlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA/IGVudHJpZXMubGVuZ3RoIDogMDtcblxuICB0aGlzLmNsZWFyKCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgY2xlYXJcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICovXG5mdW5jdGlvbiBtYXBDYWNoZUNsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0ge1xuICAgICdoYXNoJzogbmV3IEhhc2gsXG4gICAgJ21hcCc6IG5ldyAoTWFwIHx8IExpc3RDYWNoZSksXG4gICAgJ3N0cmluZyc6IG5ldyBIYXNoXG4gIH07XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIG1hcC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZGVsZXRlXG4gKiBAbWVtYmVyT2YgTWFwQ2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmVtb3ZlLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIHRoZSBlbnRyeSB3YXMgcmVtb3ZlZCwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBtYXBDYWNoZURlbGV0ZShrZXkpIHtcbiAgcmV0dXJuIGdldE1hcERhdGEodGhpcywga2V5KVsnZGVsZXRlJ10oa2V5KTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBtYXAgdmFsdWUgZm9yIGBrZXlgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBnZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBnZXQuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgZW50cnkgdmFsdWUuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlR2V0KGtleSkge1xuICByZXR1cm4gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLmdldChrZXkpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBhIG1hcCB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlSGFzKGtleSkge1xuICByZXR1cm4gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLmhhcyhrZXkpO1xufVxuXG4vKipcbiAqIFNldHMgdGhlIG1hcCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBzZXQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBSZXR1cm5zIHRoZSBtYXAgY2FjaGUgaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlU2V0KGtleSwgdmFsdWUpIHtcbiAgZ2V0TWFwRGF0YSh0aGlzLCBrZXkpLnNldChrZXksIHZhbHVlKTtcbiAgcmV0dXJuIHRoaXM7XG59XG5cbi8vIEFkZCBtZXRob2RzIHRvIGBNYXBDYWNoZWAuXG5NYXBDYWNoZS5wcm90b3R5cGUuY2xlYXIgPSBtYXBDYWNoZUNsZWFyO1xuTWFwQ2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IG1hcENhY2hlRGVsZXRlO1xuTWFwQ2FjaGUucHJvdG90eXBlLmdldCA9IG1hcENhY2hlR2V0O1xuTWFwQ2FjaGUucHJvdG90eXBlLmhhcyA9IG1hcENhY2hlSGFzO1xuTWFwQ2FjaGUucHJvdG90eXBlLnNldCA9IG1hcENhY2hlU2V0O1xuXG4vKipcbiAqIEdldHMgdGhlIGluZGV4IGF0IHdoaWNoIHRoZSBga2V5YCBpcyBmb3VuZCBpbiBgYXJyYXlgIG9mIGtleS12YWx1ZSBwYWlycy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGluc3BlY3QuXG4gKiBAcGFyYW0geyp9IGtleSBUaGUga2V5IHRvIHNlYXJjaCBmb3IuXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBSZXR1cm5zIHRoZSBpbmRleCBvZiB0aGUgbWF0Y2hlZCB2YWx1ZSwgZWxzZSBgLTFgLlxuICovXG5mdW5jdGlvbiBhc3NvY0luZGV4T2YoYXJyYXksIGtleSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xuICB3aGlsZSAobGVuZ3RoLS0pIHtcbiAgICBpZiAoZXEoYXJyYXlbbGVuZ3RoXVswXSwga2V5KSkge1xuICAgICAgcmV0dXJuIGxlbmd0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG4vKipcbiAqIFRoZSBiYXNlIGltcGxlbWVudGF0aW9uIG9mIGBfLmlzTmF0aXZlYCB3aXRob3V0IGJhZCBzaGltIGNoZWNrcy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIG5hdGl2ZSBmdW5jdGlvbixcbiAqICBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGJhc2VJc05hdGl2ZSh2YWx1ZSkge1xuICBpZiAoIWlzT2JqZWN0KHZhbHVlKSB8fCBpc01hc2tlZCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHBhdHRlcm4gPSAoaXNGdW5jdGlvbih2YWx1ZSkgfHwgaXNIb3N0T2JqZWN0KHZhbHVlKSkgPyByZUlzTmF0aXZlIDogcmVJc0hvc3RDdG9yO1xuICByZXR1cm4gcGF0dGVybi50ZXN0KHRvU291cmNlKHZhbHVlKSk7XG59XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udG9TdHJpbmdgIHdoaWNoIGRvZXNuJ3QgY29udmVydCBudWxsaXNoXG4gKiB2YWx1ZXMgdG8gZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENhc3RzIGB2YWx1ZWAgdG8gYSBwYXRoIGFycmF5IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2FzdCBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG5mdW5jdGlvbiBjYXN0UGF0aCh2YWx1ZSkge1xuICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IHN0cmluZ1RvUGF0aCh2YWx1ZSk7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZGF0YSBmb3IgYG1hcGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBtYXAgVGhlIG1hcCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIHJlZmVyZW5jZSBrZXkuXG4gKiBAcmV0dXJucyB7Kn0gUmV0dXJucyB0aGUgbWFwIGRhdGEuXG4gKi9cbmZ1bmN0aW9uIGdldE1hcERhdGEobWFwLCBrZXkpIHtcbiAgdmFyIGRhdGEgPSBtYXAuX19kYXRhX187XG4gIHJldHVybiBpc0tleWFibGUoa2V5KVxuICAgID8gZGF0YVt0eXBlb2Yga2V5ID09ICdzdHJpbmcnID8gJ3N0cmluZycgOiAnaGFzaCddXG4gICAgOiBkYXRhLm1hcDtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBuYXRpdmUgZnVuY3Rpb24gYXQgYGtleWAgb2YgYG9iamVjdGAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3QgVGhlIG9iamVjdCB0byBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgbWV0aG9kIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBmdW5jdGlvbiBpZiBpdCdzIG5hdGl2ZSwgZWxzZSBgdW5kZWZpbmVkYC5cbiAqL1xuZnVuY3Rpb24gZ2V0TmF0aXZlKG9iamVjdCwga2V5KSB7XG4gIHZhciB2YWx1ZSA9IGdldFZhbHVlKG9iamVjdCwga2V5KTtcbiAgcmV0dXJuIGJhc2VJc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUgYW5kIG5vdCBhIHByb3BlcnR5IHBhdGguXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHBhcmFtIHtPYmplY3R9IFtvYmplY3RdIFRoZSBvYmplY3QgdG8gcXVlcnkga2V5cyBvbi5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgcHJvcGVydHkgbmFtZSwgZWxzZSBgZmFsc2VgLlxuICovXG5mdW5jdGlvbiBpc0tleSh2YWx1ZSwgb2JqZWN0KSB7XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgaWYgKHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJyB8fFxuICAgICAgdmFsdWUgPT0gbnVsbCB8fCBpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gcmVJc1BsYWluUHJvcC50ZXN0KHZhbHVlKSB8fCAhcmVJc0RlZXBQcm9wLnRlc3QodmFsdWUpIHx8XG4gICAgKG9iamVjdCAhPSBudWxsICYmIHZhbHVlIGluIE9iamVjdChvYmplY3QpKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICh0eXBlID09ICdzdHJpbmcnIHx8IHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJylcbiAgICA/ICh2YWx1ZSAhPT0gJ19fcHJvdG9fXycpXG4gICAgOiAodmFsdWUgPT09IG51bGwpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgZnVuY2AgaGFzIGl0cyBzb3VyY2UgbWFza2VkLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBmdW5jdGlvbiB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgZnVuY2AgaXMgbWFza2VkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzTWFza2VkKGZ1bmMpIHtcbiAgcmV0dXJuICEhbWFza1NyY0tleSAmJiAobWFza1NyY0tleSBpbiBmdW5jKTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBgc3RyaW5nYCB0byBhIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGhlIHN0cmluZyB0byBjb252ZXJ0LlxuICogQHJldHVybnMge0FycmF5fSBSZXR1cm5zIHRoZSBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG52YXIgc3RyaW5nVG9QYXRoID0gbWVtb2l6ZShmdW5jdGlvbihzdHJpbmcpIHtcbiAgc3RyaW5nID0gdG9TdHJpbmcoc3RyaW5nKTtcblxuICB2YXIgcmVzdWx0ID0gW107XG4gIGlmIChyZUxlYWRpbmdEb3QudGVzdChzdHJpbmcpKSB7XG4gICAgcmVzdWx0LnB1c2goJycpO1xuICB9XG4gIHN0cmluZy5yZXBsYWNlKHJlUHJvcE5hbWUsIGZ1bmN0aW9uKG1hdGNoLCBudW1iZXIsIHF1b3RlLCBzdHJpbmcpIHtcbiAgICByZXN1bHQucHVzaChxdW90ZSA/IHN0cmluZy5yZXBsYWNlKHJlRXNjYXBlQ2hhciwgJyQxJykgOiAobnVtYmVyIHx8IG1hdGNoKSk7XG4gIH0pO1xuICByZXR1cm4gcmVzdWx0O1xufSk7XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyBrZXkgaWYgaXQncyBub3QgYSBzdHJpbmcgb3Igc3ltYm9sLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBpbnNwZWN0LlxuICogQHJldHVybnMge3N0cmluZ3xzeW1ib2x9IFJldHVybnMgdGhlIGtleS5cbiAqL1xuZnVuY3Rpb24gdG9LZXkodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCBpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGBmdW5jYCB0byBpdHMgc291cmNlIGNvZGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzb3VyY2UgY29kZS5cbiAqL1xuZnVuY3Rpb24gdG9Tb3VyY2UoZnVuYykge1xuICBpZiAoZnVuYyAhPSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmdW5jVG9TdHJpbmcuY2FsbChmdW5jKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGZ1bmMgKyAnJyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgbWVtb2l6ZXMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuIElmIGByZXNvbHZlcmAgaXNcbiAqIHByb3ZpZGVkLCBpdCBkZXRlcm1pbmVzIHRoZSBjYWNoZSBrZXkgZm9yIHN0b3JpbmcgdGhlIHJlc3VsdCBiYXNlZCBvbiB0aGVcbiAqIGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24uIEJ5IGRlZmF1bHQsIHRoZSBmaXJzdCBhcmd1bWVudFxuICogcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlIG1hcCBjYWNoZSBrZXkuIFRoZSBgZnVuY2BcbiAqIGlzIGludm9rZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICpcbiAqICoqTm90ZToqKiBUaGUgY2FjaGUgaXMgZXhwb3NlZCBhcyB0aGUgYGNhY2hlYCBwcm9wZXJ0eSBvbiB0aGUgbWVtb2l6ZWRcbiAqIGZ1bmN0aW9uLiBJdHMgY3JlYXRpb24gbWF5IGJlIGN1c3RvbWl6ZWQgYnkgcmVwbGFjaW5nIHRoZSBgXy5tZW1vaXplLkNhY2hlYFxuICogY29uc3RydWN0b3Igd2l0aCBvbmUgd2hvc2UgaW5zdGFuY2VzIGltcGxlbWVudCB0aGVcbiAqIFtgTWFwYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtcHJvcGVydGllcy1vZi10aGUtbWFwLXByb3RvdHlwZS1vYmplY3QpXG4gKiBtZXRob2QgaW50ZXJmYWNlIG9mIGBkZWxldGVgLCBgZ2V0YCwgYGhhc2AsIGFuZCBgc2V0YC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtyZXNvbHZlcl0gVGhlIGZ1bmN0aW9uIHRvIHJlc29sdmUgdGhlIGNhY2hlIGtleS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IG1lbW9pemVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEsICdiJzogMiB9O1xuICogdmFyIG90aGVyID0geyAnYyc6IDMsICdkJzogNCB9O1xuICpcbiAqIHZhciB2YWx1ZXMgPSBfLm1lbW9pemUoXy52YWx1ZXMpO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiB2YWx1ZXMob3RoZXIpO1xuICogLy8gPT4gWzMsIDRdXG4gKlxuICogb2JqZWN0LmEgPSAyO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiAvLyBNb2RpZnkgdGhlIHJlc3VsdCBjYWNoZS5cbiAqIHZhbHVlcy5jYWNoZS5zZXQob2JqZWN0LCBbJ2EnLCAnYiddKTtcbiAqIHZhbHVlcyhvYmplY3QpO1xuICogLy8gPT4gWydhJywgJ2InXVxuICpcbiAqIC8vIFJlcGxhY2UgYF8ubWVtb2l6ZS5DYWNoZWAuXG4gKiBfLm1lbW9pemUuQ2FjaGUgPSBXZWFrTWFwO1xuICovXG5mdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyKSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nIHx8IChyZXNvbHZlciAmJiB0eXBlb2YgcmVzb2x2ZXIgIT0gJ2Z1bmN0aW9uJykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgdmFyIG1lbW9pemVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGtleSA9IHJlc29sdmVyID8gcmVzb2x2ZXIuYXBwbHkodGhpcywgYXJncykgOiBhcmdzWzBdLFxuICAgICAgICBjYWNoZSA9IG1lbW9pemVkLmNhY2hlO1xuXG4gICAgaWYgKGNhY2hlLmhhcyhrZXkpKSB7XG4gICAgICByZXR1cm4gY2FjaGUuZ2V0KGtleSk7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIG1lbW9pemVkLmNhY2hlID0gY2FjaGUuc2V0KGtleSwgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBtZW1vaXplZC5jYWNoZSA9IG5ldyAobWVtb2l6ZS5DYWNoZSB8fCBNYXBDYWNoZSk7XG4gIHJldHVybiBtZW1vaXplZDtcbn1cblxuLy8gQXNzaWduIGNhY2hlIHRvIGBfLm1lbW9pemVgLlxubWVtb2l6ZS5DYWNoZSA9IE1hcENhY2hlO1xuXG4vKipcbiAqIFBlcmZvcm1zIGFcbiAqIFtgU2FtZVZhbHVlWmVyb2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzcuMC8jc2VjLXNhbWV2YWx1ZXplcm8pXG4gKiBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmUgZXF1aXZhbGVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEgfTtcbiAqIHZhciBvdGhlciA9IHsgJ2EnOiAxIH07XG4gKlxuICogXy5lcShvYmplY3QsIG9iamVjdCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcShvYmplY3QsIG90aGVyKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcSgnYScsICdhJyk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5lcSgnYScsIE9iamVjdCgnYScpKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5lcShOYU4sIE5hTik7XG4gKiAvLyA9PiB0cnVlXG4gKi9cbmZ1bmN0aW9uIGVxKHZhbHVlLCBvdGhlcikge1xuICByZXR1cm4gdmFsdWUgPT09IG90aGVyIHx8ICh2YWx1ZSAhPT0gdmFsdWUgJiYgb3RoZXIgIT09IG90aGVyKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGFuIGBBcnJheWAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIGFycmF5LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNBcnJheShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNBcnJheShkb2N1bWVudC5ib2R5LmNoaWxkcmVuKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc0FycmF5KF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG52YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXk7XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgZnVuY3Rpb24sIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOC05IHdoaWNoIHJldHVybnMgJ29iamVjdCcgZm9yIHR5cGVkIGFycmF5IGFuZCBvdGhlciBjb25zdHJ1Y3RvcnMuXG4gIHZhciB0YWcgPSBpc09iamVjdCh2YWx1ZSkgPyBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA6ICcnO1xuICByZXR1cm4gdGFnID09IGZ1bmNUYWcgfHwgdGFnID09IGdlblRhZztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyB0aGVcbiAqIFtsYW5ndWFnZSB0eXBlXShodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNy4wLyNzZWMtZWNtYXNjcmlwdC1sYW5ndWFnZS10eXBlcylcbiAqIG9mIGBPYmplY3RgLiAoZS5nLiBhcnJheXMsIGZ1bmN0aW9ucywgb2JqZWN0cywgcmVnZXhlcywgYG5ldyBOdW1iZXIoMClgLCBhbmQgYG5ldyBTdHJpbmcoJycpYClcbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhbiBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdCh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoXy5ub29wKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIHJldHVybiAhIXZhbHVlICYmICh0eXBlID09ICdvYmplY3QnIHx8IHR5cGUgPT0gJ2Z1bmN0aW9uJyk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UuIEEgdmFsdWUgaXMgb2JqZWN0LWxpa2UgaWYgaXQncyBub3QgYG51bGxgXG4gKiBhbmQgaGFzIGEgYHR5cGVvZmAgcmVzdWx0IG9mIFwib2JqZWN0XCIuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgb2JqZWN0LWxpa2UsIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc09iamVjdExpa2Uoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoXy5ub29wKTtcbiAqIC8vID0+IGZhbHNlXG4gKlxuICogXy5pc09iamVjdExpa2UobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdExpa2UodmFsdWUpIHtcbiAgcmV0dXJuICEhdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09ICdvYmplY3QnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgU3ltYm9sYCBwcmltaXRpdmUgb3Igb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgc3ltYm9sLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZCBmb3IgYG51bGxgXG4gKiBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmdldGAgZXhjZXB0IHRoYXQgaWYgdGhlIHJlc29sdmVkIHZhbHVlIGlzIGFcbiAqIGZ1bmN0aW9uIGl0J3MgaW52b2tlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiBpdHMgcGFyZW50IG9iamVjdCBhbmRcbiAqIGl0cyByZXN1bHQgaXMgcmV0dXJuZWQuXG4gKlxuICogQHN0YXRpY1xuICogQHNpbmNlIDAuMS4wXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIHJlc29sdmUuXG4gKiBAcGFyYW0geyp9IFtkZWZhdWx0VmFsdWVdIFRoZSB2YWx1ZSByZXR1cm5lZCBmb3IgYHVuZGVmaW5lZGAgcmVzb2x2ZWQgdmFsdWVzLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IFt7ICdiJzogeyAnYzEnOiAzLCAnYzInOiBfLmNvbnN0YW50KDQpIH0gfV0gfTtcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzEnKTtcbiAqIC8vID0+IDNcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzInKTtcbiAqIC8vID0+IDRcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzMnLCAnZGVmYXVsdCcpO1xuICogLy8gPT4gJ2RlZmF1bHQnXG4gKlxuICogXy5yZXN1bHQob2JqZWN0LCAnYVswXS5iLmMzJywgXy5jb25zdGFudCgnZGVmYXVsdCcpKTtcbiAqIC8vID0+ICdkZWZhdWx0J1xuICovXG5mdW5jdGlvbiByZXN1bHQob2JqZWN0LCBwYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgcGF0aCA9IGlzS2V5KHBhdGgsIG9iamVjdCkgPyBbcGF0aF0gOiBjYXN0UGF0aChwYXRoKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuXG4gIC8vIEVuc3VyZSB0aGUgbG9vcCBpcyBlbnRlcmVkIHdoZW4gcGF0aCBpcyBlbXB0eS5cbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBvYmplY3QgPSB1bmRlZmluZWQ7XG4gICAgbGVuZ3RoID0gMTtcbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W3RvS2V5KHBhdGhbaW5kZXhdKV07XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGluZGV4ID0gbGVuZ3RoO1xuICAgICAgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIG9iamVjdCA9IGlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN1bHQ7XG4iLCJ2YXIgcmVkdWN0aW9fcGFyYW1ldGVycyA9IHJlcXVpcmUoJy4vcGFyYW1ldGVycy5qcycpO1xuXG5fYXNzaWduID0gZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuXHRpZiAodGFyZ2V0ID09IG51bGwpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcblx0fVxuXG5cdHZhciBvdXRwdXQgPSBPYmplY3QodGFyZ2V0KTtcblx0Zm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraW5kZXgpIHtcblx0XHR2YXIgc291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblx0XHRpZiAoc291cmNlICE9IG51bGwpIHtcblx0XHRcdGZvciAodmFyIG5leHRLZXkgaW4gc291cmNlKSB7XG5cdFx0XHRcdGlmKHNvdXJjZS5oYXNPd25Qcm9wZXJ0eShuZXh0S2V5KSkge1xuXHRcdFx0XHRcdG91dHB1dFtuZXh0S2V5XSA9IHNvdXJjZVtuZXh0S2V5XTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gb3V0cHV0O1xufTtcblxuZnVuY3Rpb24gYWNjZXNzb3JfYnVpbGQob2JqLCBwKSB7XG5cdC8vIG9iai5vcmRlciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5vcmRlcjtcblx0Ly8gXHRwLm9yZGVyID0gdmFsdWU7XG5cdC8vIFx0cmV0dXJuIG9iajtcblx0Ly8gfTtcblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeSh2KSB7XG5cdFx0aWYoIHR5cGVvZiB2ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdC8vIFJld3JpdGUgdG8gYSBmdW5jdGlvblxuXHRcdFx0dmFyIHRlbXBWYWx1ZSA9IHY7XG5cdFx0XHR2YXIgZnVuYyA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkW3RlbXBWYWx1ZV07IH1cblx0XHRcdHJldHVybiBmdW5jO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdjtcblx0XHR9XG5cdH1cblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeU51bWVyaWModikge1xuXHRcdGlmKCB0eXBlb2YgdiA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHQvLyBSZXdyaXRlIHRvIGEgZnVuY3Rpb25cblx0XHRcdHZhciB0ZW1wVmFsdWUgPSB2O1xuXHRcdFx0dmFyIGZ1bmMgPSBmdW5jdGlvbiAoZCkgeyByZXR1cm4gK2RbdGVtcFZhbHVlXTsgfVxuXHRcdFx0cmV0dXJuIGZ1bmM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB2O1xuXHRcdH1cblx0fVxuXG5cdG9iai5mcm9tT2JqZWN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHA7XG5cdFx0X2Fzc2lnbihwLCB2YWx1ZSk7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudG9PYmplY3QgPSBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gcDtcblx0fTtcblxuXHRvYmouY291bnQgPSBmdW5jdGlvbih2YWx1ZSwgcHJvcE5hbWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmNvdW50O1xuICAgIGlmICghcHJvcE5hbWUpIHtcbiAgICAgIHByb3BOYW1lID0gJ2NvdW50JztcbiAgICB9XG5cdFx0cC5jb3VudCA9IHByb3BOYW1lO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN1bSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdW07XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmF2ZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hdmc7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHQvLyBXZSBjYW4gdGFrZSBhbiBhY2Nlc3NvciBmdW5jdGlvbiwgYSBib29sZWFuLCBvciBhIHN0cmluZ1xuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZihwLnN1bSAmJiBwLnN1bSAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignU1VNIGFnZ3JlZ2F0aW9uIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IEFWRyBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC5zdW0gPSB2YWx1ZTtcblx0XHRcdHAuYXZnID0gdHJ1ZTtcblx0XHRcdHAuY291bnQgPSAnY291bnQnO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwLmF2ZyA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb24gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uQWNjZXNzb3I7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdHAuZXhjZXB0aW9uQWNjZXNzb3IgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5maWx0ZXIgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZmlsdGVyO1xuXHRcdHAuZmlsdGVyID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudmFsdWVMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnZhbHVlTGlzdDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnkodmFsdWUpO1xuXG5cdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5tZWRpYW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWVkaWFuO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1lZGlhbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tZWRpYW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5taW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWluO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1pbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5taW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5tYXggPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWF4O1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCAmJiBwLnZhbHVlTGlzdCAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1heCBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tYXggPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb25Db3VudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5leGNlcHRpb25Db3VudDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnkodmFsdWUpO1xuXG5cdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdGlmKHAuZXhjZXB0aW9uQWNjZXNzb3IgJiYgcC5leGNlcHRpb25BY2Nlc3NvciAhPT0gdmFsdWUpIGNvbnNvbGUud2FybignRVhDRVBUSU9OIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IGV4Y2VwdGlvbiBjb3VudCBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC5leGNlcHRpb25BY2Nlc3NvciA9IHZhbHVlO1xuXHRcdFx0cC5leGNlcHRpb25Db3VudCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuZXhjZXB0aW9uQ291bnQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvblN1bTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuZXhjZXB0aW9uU3VtID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuaGlzdG9ncmFtVmFsdWU7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLmhpc3RvZ3JhbVZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtQmlucyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5oaXN0b2dyYW1UaHJlc2hvbGRzO1xuXHRcdHAuaGlzdG9ncmFtVGhyZXNob2xkcyA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN0ZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdGQ7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRwLnN1bU9mU3F1YXJlcyA9IHZhbHVlO1xuXHRcdFx0cC5zdW0gPSB2YWx1ZTtcblx0XHRcdHAuY291bnQgPSAnY291bnQnO1xuXHRcdFx0cC5zdGQgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwLnN0ZCA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5zdW1PZlNxID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN1bU9mU3F1YXJlcztcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuc3VtT2ZTcXVhcmVzID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudmFsdWUgPSBmdW5jdGlvbih2YWx1ZSwgYWNjZXNzb3IpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGggfHwgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCIndmFsdWUnIHJlcXVpcmVzIGEgc3RyaW5nIGFyZ3VtZW50LlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXAudmFsdWVzKSBwLnZhbHVlcyA9IHt9O1xuXHRcdFx0cC52YWx1ZXNbdmFsdWVdID0ge307XG5cdFx0XHRwLnZhbHVlc1t2YWx1ZV0ucGFyYW1ldGVycyA9IHJlZHVjdGlvX3BhcmFtZXRlcnMoKTtcblx0XHRcdGFjY2Vzc29yX2J1aWxkKHAudmFsdWVzW3ZhbHVlXSwgcC52YWx1ZXNbdmFsdWVdLnBhcmFtZXRlcnMpO1xuXHRcdFx0aWYoYWNjZXNzb3IpIHAudmFsdWVzW3ZhbHVlXS5hY2Nlc3NvciA9IGFjY2Vzc29yO1xuXHRcdFx0cmV0dXJuIHAudmFsdWVzW3ZhbHVlXTtcblx0XHR9XG5cdH07XG5cblx0b2JqLm5lc3QgPSBmdW5jdGlvbihrZXlBY2Nlc3NvckFycmF5KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm5lc3RLZXlzO1xuXG5cdFx0a2V5QWNjZXNzb3JBcnJheS5tYXAoYWNjZXNzb3JpZnkpO1xuXG5cdFx0cC5uZXN0S2V5cyA9IGtleUFjY2Vzc29yQXJyYXk7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYWxpYXMgPSBmdW5jdGlvbihwcm9wQWNjZXNzb3JPYmopIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuYWxpYXNLZXlzO1xuXHRcdHAuYWxpYXNLZXlzID0gcHJvcEFjY2Vzc29yT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmFsaWFzUHJvcCA9IGZ1bmN0aW9uKHByb3BBY2Nlc3Nvck9iaikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hbGlhc1Byb3BLZXlzO1xuXHRcdHAuYWxpYXNQcm9wS2V5cyA9IHByb3BBY2Nlc3Nvck9iajtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5ncm91cEFsbCA9IGZ1bmN0aW9uKGdyb3VwVGVzdCkge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5ncm91cEFsbDtcblx0XHRwLmdyb3VwQWxsID0gZ3JvdXBUZXN0O1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmRhdGFMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmRhdGFMaXN0O1xuXHRcdHAuZGF0YUxpc3QgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5jdXN0b20gPSBmdW5jdGlvbihhZGRSZW1vdmVJbml0aWFsT2JqKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5jdXN0b207XG5cdFx0cC5jdXN0b20gPSBhZGRSZW1vdmVJbml0aWFsT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cbn1cblxudmFyIHJlZHVjdGlvX2FjY2Vzc29ycyA9IHtcblx0YnVpbGQ6IGFjY2Vzc29yX2J1aWxkXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FjY2Vzc29ycztcbiIsInZhciByZWR1Y3Rpb19hbGlhcyA9IHtcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIG9iaikge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdGZ1bmN0aW9uIGJ1aWxkQWxpYXNGdW5jdGlvbihrZXkpe1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRyZXR1cm4gb2JqW2tleV0ocGF0aChwKSk7XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cdFx0XHRmb3IodmFyIHByb3AgaW4gb2JqKSB7XG5cdFx0XHRcdHBhdGgocClbcHJvcF0gPSBidWlsZEFsaWFzRnVuY3Rpb24ocHJvcCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FsaWFzOyIsInZhciByZWR1Y3Rpb19hbGlhc19wcm9wID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChvYmosIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGZvcih2YXIgcHJvcCBpbiBvYmopIHtcblx0XHRcdFx0cGF0aChwKVtwcm9wXSA9IG9ialtwcm9wXShwYXRoKHApLHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hbGlhc19wcm9wOyIsInZhciByZWR1Y3Rpb19hdmcgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gcGF0aChwKS5zdW0gLyBwYXRoKHApLmNvdW50O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSBwYXRoKHApLnN1bSAvIHBhdGgocCkuY291bnQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuYXZnID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYXZnOyIsInZhciByZWR1Y3Rpb19maWx0ZXIgPSByZXF1aXJlKCcuL2ZpbHRlci5qcycpO1xudmFyIHJlZHVjdGlvX2NvdW50ID0gcmVxdWlyZSgnLi9jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX3N1bSA9IHJlcXVpcmUoJy4vc3VtLmpzJyk7XG52YXIgcmVkdWN0aW9fYXZnID0gcmVxdWlyZSgnLi9hdmcuanMnKTtcbnZhciByZWR1Y3Rpb19tZWRpYW4gPSByZXF1aXJlKCcuL21lZGlhbi5qcycpO1xudmFyIHJlZHVjdGlvX21pbiA9IHJlcXVpcmUoJy4vbWluLmpzJyk7XG52YXIgcmVkdWN0aW9fbWF4ID0gcmVxdWlyZSgnLi9tYXguanMnKTtcbnZhciByZWR1Y3Rpb192YWx1ZV9jb3VudCA9IHJlcXVpcmUoJy4vdmFsdWUtY291bnQuanMnKTtcbnZhciByZWR1Y3Rpb192YWx1ZV9saXN0ID0gcmVxdWlyZSgnLi92YWx1ZS1saXN0LmpzJyk7XG52YXIgcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50ID0gcmVxdWlyZSgnLi9leGNlcHRpb24tY291bnQuanMnKTtcbnZhciByZWR1Y3Rpb19leGNlcHRpb25fc3VtID0gcmVxdWlyZSgnLi9leGNlcHRpb24tc3VtLmpzJyk7XG52YXIgcmVkdWN0aW9faGlzdG9ncmFtID0gcmVxdWlyZSgnLi9oaXN0b2dyYW0uanMnKTtcbnZhciByZWR1Y3Rpb19zdW1fb2Zfc3EgPSByZXF1aXJlKCcuL3N1bS1vZi1zcXVhcmVzLmpzJyk7XG52YXIgcmVkdWN0aW9fc3RkID0gcmVxdWlyZSgnLi9zdGQuanMnKTtcbnZhciByZWR1Y3Rpb19uZXN0ID0gcmVxdWlyZSgnLi9uZXN0LmpzJyk7XG52YXIgcmVkdWN0aW9fYWxpYXMgPSByZXF1aXJlKCcuL2FsaWFzLmpzJyk7XG52YXIgcmVkdWN0aW9fYWxpYXNfcHJvcCA9IHJlcXVpcmUoJy4vYWxpYXNQcm9wLmpzJyk7XG52YXIgcmVkdWN0aW9fZGF0YV9saXN0ID0gcmVxdWlyZSgnLi9kYXRhLWxpc3QuanMnKTtcbnZhciByZWR1Y3Rpb19jdXN0b20gPSByZXF1aXJlKCcuL2N1c3RvbS5qcycpO1xuXG5mdW5jdGlvbiBidWlsZF9mdW5jdGlvbihwLCBmLCBwYXRoKSB7XG5cdC8vIFdlIGhhdmUgdG8gYnVpbGQgdGhlc2UgZnVuY3Rpb25zIGluIG9yZGVyLiBFdmVudHVhbGx5IHdlIGNhbiBpbmNsdWRlIGRlcGVuZGVuY3lcblx0Ly8gaW5mb3JtYXRpb24gYW5kIGNyZWF0ZSBhIGRlcGVuZGVuY3kgZ3JhcGggaWYgdGhlIHByb2Nlc3MgYmVjb21lcyBjb21wbGV4IGVub3VnaC5cblxuXHRpZighcGF0aCkgcGF0aCA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkOyB9O1xuXG5cdC8vIEtlZXAgdHJhY2sgb2YgdGhlIG9yaWdpbmFsIHJlZHVjZXJzIHNvIHRoYXQgZmlsdGVyaW5nIGNhbiBza2lwIGJhY2sgdG9cblx0Ly8gdGhlbSBpZiB0aGlzIHBhcnRpY3VsYXIgdmFsdWUgaXMgZmlsdGVyZWQgb3V0LlxuXHR2YXIgb3JpZ0YgPSB7XG5cdFx0cmVkdWNlQWRkOiBmLnJlZHVjZUFkZCxcblx0XHRyZWR1Y2VSZW1vdmU6IGYucmVkdWNlUmVtb3ZlLFxuXHRcdHJlZHVjZUluaXRpYWw6IGYucmVkdWNlSW5pdGlhbFxuXHR9O1xuXG5cdGlmKHAuY291bnQgfHwgcC5zdGQpIHtcbiAgICBmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2NvdW50LmFkZChmLnJlZHVjZUFkZCwgcGF0aCwgcC5jb3VudCk7XG4gICAgZi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19jb3VudC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgsIHAuY291bnQpO1xuICAgIGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoLCBwLmNvdW50KTtcblx0fVxuXG5cdGlmKHAuc3VtKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19zdW0uYWRkKHAuc3VtLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdW0ucmVtb3ZlKHAuc3VtLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fc3VtLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAuYXZnKSB7XG5cdFx0aWYoIXAuY291bnQgfHwgIXAuc3VtKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3Qgc2V0IC5jb3VudCh0cnVlKSBhbmQgZGVmaW5lIGEgLnN1bShhY2Nlc3NvcikgdG8gdXNlIC5hdmcodHJ1ZSkuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2F2Zy5hZGQocC5zdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fYXZnLnJlbW92ZShwLnN1bSwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fYXZnLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBUaGUgdW5pcXVlLW9ubHkgcmVkdWNlcnMgY29tZSBiZWZvcmUgdGhlIHZhbHVlX2NvdW50IHJlZHVjZXJzLiBUaGV5IG5lZWQgdG8gY2hlY2sgaWZcblx0Ly8gdGhlIHZhbHVlIGlzIGFscmVhZHkgaW4gdGhlIHZhbHVlcyBhcnJheSBvbiB0aGUgZ3JvdXAuIFRoZXkgc2hvdWxkIG9ubHkgaW5jcmVtZW50L2RlY3JlbWVudFxuXHQvLyBjb3VudHMgaWYgdGhlIHZhbHVlIG5vdCBpbiB0aGUgYXJyYXkgb3IgdGhlIGNvdW50IG9uIHRoZSB2YWx1ZSBpcyAwLlxuXHRpZihwLmV4Y2VwdGlvbkNvdW50KSB7XG5cdFx0aWYoIXAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBkZWZpbmUgYW4gLmV4Y2VwdGlvbihhY2Nlc3NvcikgdG8gdXNlIC5leGNlcHRpb25Db3VudCh0cnVlKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudC5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHRpZihwLmV4Y2VwdGlvblN1bSkge1xuXHRcdGlmKCFwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3QgZGVmaW5lIGFuIC5leGNlcHRpb24oYWNjZXNzb3IpIHRvIHVzZSAuZXhjZXB0aW9uU3VtKGFjY2Vzc29yKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSB2YWx1ZXMgYXJyYXkuXG5cdGlmKHAudmFsdWVMaXN0IHx8IHAubWVkaWFuIHx8IHAubWluIHx8IHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmFkZChwLnZhbHVlTGlzdCwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfbGlzdC5yZW1vdmUocC52YWx1ZUxpc3QsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSBkYXRhIGFycmF5LlxuXHRpZihwLmRhdGFMaXN0KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19kYXRhX2xpc3QuYWRkKHAuZGF0YUxpc3QsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2RhdGFfbGlzdC5yZW1vdmUocC5kYXRhTGlzdCwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2RhdGFfbGlzdC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHRpZihwLm1lZGlhbikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbWVkaWFuLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19tZWRpYW4ucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19tZWRpYW4uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5taW4pIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX21pbi5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbWluLnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbWluLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19tYXguYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX21heC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX21heC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBNYWludGFpbiB0aGUgdmFsdWVzIGNvdW50IGFycmF5LlxuXHRpZihwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfY291bnQucmVtb3ZlKHAuZXhjZXB0aW9uQWNjZXNzb3IsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBIaXN0b2dyYW1cblx0aWYocC5oaXN0b2dyYW1WYWx1ZSAmJiBwLmhpc3RvZ3JhbVRocmVzaG9sZHMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2hpc3RvZ3JhbS5hZGQocC5oaXN0b2dyYW1WYWx1ZSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9faGlzdG9ncmFtLnJlbW92ZShwLmhpc3RvZ3JhbVZhbHVlLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9faGlzdG9ncmFtLmluaXRpYWwocC5oaXN0b2dyYW1UaHJlc2hvbGRzICxmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3VtIG9mIFNxdWFyZXNcblx0aWYocC5zdW1PZlNxdWFyZXMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N1bV9vZl9zcS5hZGQocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N1bV9vZl9zcS5yZW1vdmUocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19zdW1fb2Zfc3EuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3RhbmRhcmQgZGV2aWF0aW9uXG5cdGlmKHAuc3RkKSB7XG5cdFx0aWYoIXAuc3VtT2ZTcXVhcmVzIHx8ICFwLnN1bSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIllvdSBtdXN0IHNldCAuc3VtT2ZTcShhY2Nlc3NvcikgYW5kIGRlZmluZSBhIC5zdW0oYWNjZXNzb3IpIHRvIHVzZSAuc3RkKHRydWUpLiBPciB1c2UgLnN0ZChhY2Nlc3NvcikuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N0ZC5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdGQucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3N0ZC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ3VzdG9tIHJlZHVjZXIgZGVmaW5lZCBieSAzIGZ1bmN0aW9ucyA6IGFkZCwgcmVtb3ZlLCBpbml0aWFsXG5cdGlmIChwLmN1c3RvbSkge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fY3VzdG9tLmFkZChmLnJlZHVjZUFkZCwgcGF0aCwgcC5jdXN0b20uYWRkKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2N1c3RvbS5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgsIHAuY3VzdG9tLnJlbW92ZSk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fY3VzdG9tLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoLCBwLmN1c3RvbS5pbml0aWFsKTtcblx0fVxuXG5cdC8vIE5lc3Rpbmdcblx0aWYocC5uZXN0S2V5cykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbmVzdC5hZGQocC5uZXN0S2V5cywgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbmVzdC5yZW1vdmUocC5uZXN0S2V5cywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX25lc3QuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gQWxpYXMgZnVuY3Rpb25zXG5cdGlmKHAuYWxpYXNLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fYWxpYXMuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgsIHAuYWxpYXNLZXlzKTtcblx0fVxuXG5cdC8vIEFsaWFzIHByb3BlcnRpZXMgLSB0aGlzIGlzIGxlc3MgZWZmaWNpZW50IHRoYW4gYWxpYXMgZnVuY3Rpb25zXG5cdGlmKHAuYWxpYXNQcm9wS2V5cykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fYWxpYXNfcHJvcC5hZGQocC5hbGlhc1Byb3BLZXlzLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Ly8gVGhpcyBpc24ndCBhIHR5cG8uIFRoZSBmdW5jdGlvbiBpcyB0aGUgc2FtZSBmb3IgYWRkL3JlbW92ZS5cblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2FsaWFzX3Byb3AuYWRkKHAuYWxpYXNQcm9wS2V5cywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHR9XG5cblx0Ly8gRmlsdGVycyBkZXRlcm1pbmUgaWYgb3VyIGJ1aWx0LXVwIHByaW9ycyBzaG91bGQgcnVuLCBvciBpZiBpdCBzaG91bGQgc2tpcFxuXHQvLyBiYWNrIHRvIHRoZSBmaWx0ZXJzIGdpdmVuIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhpcyBidWlsZCBmdW5jdGlvbi5cblx0aWYgKHAuZmlsdGVyKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19maWx0ZXIuYWRkKHAuZmlsdGVyLCBmLnJlZHVjZUFkZCwgb3JpZ0YucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2ZpbHRlci5yZW1vdmUocC5maWx0ZXIsIGYucmVkdWNlUmVtb3ZlLCBvcmlnRi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHR9XG5cblx0Ly8gVmFsdWVzIGdvIGxhc3QuXG5cdGlmKHAudmFsdWVzKSB7XG5cdFx0T2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMocC52YWx1ZXMpLmZvckVhY2goZnVuY3Rpb24obikge1xuXHRcdFx0Ly8gU2V0IHVwIHRoZSBwYXRoIG9uIGVhY2ggZ3JvdXAuXG5cdFx0XHR2YXIgc2V0dXBQYXRoID0gZnVuY3Rpb24ocHJpb3IpIHtcblx0XHRcdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0XHRcdHBhdGgocClbbl0gPSB7fTtcblx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0fTtcblx0XHRcdH07XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSBzZXR1cFBhdGgoZi5yZWR1Y2VJbml0aWFsKTtcblx0XHRcdGJ1aWxkX2Z1bmN0aW9uKHAudmFsdWVzW25dLnBhcmFtZXRlcnMsIGYsIGZ1bmN0aW9uIChwKSB7IHJldHVybiBwW25dOyB9KTtcblx0XHR9KTtcblx0fVxufVxuXG52YXIgcmVkdWN0aW9fYnVpbGQgPSB7XG5cdGJ1aWxkOiBidWlsZF9mdW5jdGlvblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19idWlsZDtcbiIsInZhciBwbHVjayA9IGZ1bmN0aW9uKG4pe1xuICAgIHJldHVybiBmdW5jdGlvbihkKXtcbiAgICAgICAgcmV0dXJuIGRbbl07XG4gICAgfTtcbn07XG5cbi8vIHN1cHBvcnRlZCBvcGVyYXRvcnMgYXJlIHN1bSwgYXZnLCBhbmQgY291bnRcbl9ncm91cGVyID0gZnVuY3Rpb24ocGF0aCwgcHJpb3Ipe1xuICAgIGlmKCFwYXRoKSBwYXRoID0gZnVuY3Rpb24oZCl7cmV0dXJuIGQ7fTtcbiAgICByZXR1cm4gZnVuY3Rpb24ocCwgdil7XG4gICAgICAgIGlmKHByaW9yKSBwcmlvcihwLCB2KTtcbiAgICAgICAgdmFyIHggPSBwYXRoKHApLCB5ID0gcGF0aCh2KTtcbiAgICAgICAgaWYodHlwZW9mIHkuY291bnQgIT09ICd1bmRlZmluZWQnKSB4LmNvdW50ICs9IHkuY291bnQ7XG4gICAgICAgIGlmKHR5cGVvZiB5LnN1bSAhPT0gJ3VuZGVmaW5lZCcpIHguc3VtICs9IHkuc3VtO1xuICAgICAgICBpZih0eXBlb2YgeS5hdmcgIT09ICd1bmRlZmluZWQnKSB4LmF2ZyA9IHguc3VtL3guY291bnQ7XG4gICAgICAgIHJldHVybiBwO1xuICAgIH07XG59O1xuXG5yZWR1Y3Rpb19jYXAgPSBmdW5jdGlvbiAocHJpb3IsIGYsIHApIHtcbiAgICB2YXIgb2JqID0gZi5yZWR1Y2VJbml0aWFsKCk7XG4gICAgLy8gd2Ugd2FudCB0byBzdXBwb3J0IHZhbHVlcyBzbyB3ZSdsbCBuZWVkIHRvIGtub3cgd2hhdCB0aG9zZSBhcmVcbiAgICB2YXIgdmFsdWVzID0gcC52YWx1ZXMgPyBPYmplY3Qua2V5cyhwLnZhbHVlcykgOiBbXTtcbiAgICB2YXIgX290aGVyc0dyb3VwZXIgPSBfZ3JvdXBlcigpO1xuICAgIGlmICh2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBfb3RoZXJzR3JvdXBlciA9IF9ncm91cGVyKHBsdWNrKHZhbHVlc1tpXSksIF9vdGhlcnNHcm91cGVyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGNhcCwgb3RoZXJzTmFtZSkge1xuICAgICAgICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwcmlvcigpO1xuICAgICAgICBpZiggY2FwID09PSBJbmZpbml0eSB8fCAhY2FwICkgcmV0dXJuIHByaW9yKCk7XG4gICAgICAgIHZhciBhbGwgPSBwcmlvcigpO1xuICAgICAgICB2YXIgc2xpY2VfaWR4ID0gY2FwLTE7XG4gICAgICAgIGlmKGFsbC5sZW5ndGggPD0gY2FwKSByZXR1cm4gYWxsO1xuICAgICAgICB2YXIgZGF0YSA9IGFsbC5zbGljZSgwLCBzbGljZV9pZHgpO1xuICAgICAgICB2YXIgb3RoZXJzID0ge2tleTogb3RoZXJzTmFtZSB8fCAnT3RoZXJzJ307XG4gICAgICAgIG90aGVycy52YWx1ZSA9IGYucmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICBmb3IgKHZhciBpID0gc2xpY2VfaWR4OyBpIDwgYWxsLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBfb3RoZXJzR3JvdXBlcihvdGhlcnMudmFsdWUsIGFsbFtpXS52YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS5wdXNoKG90aGVycyk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2NhcDtcbiIsInZhciByZWR1Y3Rpb19jb3VudCA9IHtcblx0YWRkOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcHJvcE5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKVtwcm9wTmFtZV0rKztcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIHByb3BOYW1lKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocClbcHJvcE5hbWVdLS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcHJvcE5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHQvLyBpZihwID09PSB1bmRlZmluZWQpIHAgPSB7fTtcblx0XHRcdHBhdGgocClbcHJvcE5hbWVdID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY291bnQ7IiwidmFyIHJlZHVjdGlvX2N1c3RvbSA9IHtcblx0YWRkOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgYWRkRm4pIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cmV0dXJuIGFkZEZuKHAsIHYpO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIHJlbW92ZUZuKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHJldHVybiByZW1vdmVGbihwLCB2KTtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgaW5pdGlhbEZuKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XHRcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRyZXR1cm4gaW5pdGlhbEZuKHApO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY3VzdG9tOyIsInZhciByZWR1Y3Rpb19kYXRhX2xpc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24oYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5kYXRhTGlzdC5wdXNoKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0LnNwbGljZShwYXRoKHApLmRhdGFMaXN0LmluZGV4T2YodiksIDEpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2RhdGFfbGlzdDtcbiIsInZhciByZWR1Y3Rpb19leGNlcHRpb25fY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgY291bnQrKyBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgZG9lc24ndCBjb250YWluIGEodikgb3IgaWYgaXQncyAwLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoKCFjdXJyIHx8IGN1cnJbMF0gIT09IGEodikpIHx8IGN1cnJbMV0gPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25Db3VudCsrO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBjb3VudC0tIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvbkNvdW50LS07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuZXhjZXB0aW9uQ291bnQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQ7IiwidmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHN1bSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBzdW0gaWYgdGhlIHAudmFsdWVzIGFycmF5IGRvZXNuJ3QgY29udGFpbiBhKHYpIG9yIGlmIGl0J3MgMC5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKCghY3VyciB8fCBjdXJyWzBdICE9PSBhKHYpKSB8fCBjdXJyWzFdID09PSAwKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uU3VtID0gcGF0aChwKS5leGNlcHRpb25TdW0gKyBzdW0odik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBzdW0sIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgc3VtIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IHBhdGgocCkuZXhjZXB0aW9uU3VtIC0gc3VtKHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW07IiwidmFyIHJlZHVjdGlvX2ZpbHRlciA9IHtcblx0Ly8gVGhlIGJpZyBpZGVhIGhlcmUgaXMgdGhhdCB5b3UgZ2l2ZSB1cyBhIGZpbHRlciBmdW5jdGlvbiB0byBydW4gb24gdmFsdWVzLFxuXHQvLyBhICdwcmlvcicgcmVkdWNlciB0byBydW4gKGp1c3QgbGlrZSB0aGUgcmVzdCBvZiB0aGUgc3RhbmRhcmQgcmVkdWNlcnMpLFxuXHQvLyBhbmQgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgcmVkdWNlciAoY2FsbGVkICdza2lwJyBiZWxvdykgZGVmaW5lZCBiZWZvcmVcblx0Ly8gdGhlIG1vc3QgcmVjZW50IGNoYWluIG9mIHJlZHVjZXJzLiAgVGhpcyBzdXBwb3J0cyBpbmRpdmlkdWFsIGZpbHRlcnMgZm9yXG5cdC8vIGVhY2ggLnZhbHVlKCcuLi4nKSBjaGFpbiB0aGF0IHlvdSBhZGQgdG8geW91ciByZWR1Y2VyLlxuXHRhZGQ6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2ZpbHRlcjtcbiIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9faGlzdG9ncmFtID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHR2YXIgYmlzZWN0SGlzdG8gPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KS5yaWdodDtcblx0XHR2YXIgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkuaGlzdG9ncmFtW2Jpc2VjdEhpc3RvKHBhdGgocCkuaGlzdG9ncmFtLCBhKHYpLCAwLCBwYXRoKHApLmhpc3RvZ3JhbS5sZW5ndGgpIC0gMV07XG5cdFx0XHRjdXJyLnkrKztcblx0XHRcdGN1cnIuc3BsaWNlKGJpc2VjdChjdXJyLCBhKHYpLCAwLCBjdXJyLmxlbmd0aCksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0dmFyIGJpc2VjdEhpc3RvID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkucmlnaHQ7XG5cdFx0dmFyIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLmhpc3RvZ3JhbVtiaXNlY3RIaXN0byhwYXRoKHApLmhpc3RvZ3JhbSwgYSh2KSwgMCwgcGF0aChwKS5oaXN0b2dyYW0ubGVuZ3RoKSAtIDFdO1xuXHRcdFx0Y3Vyci55LS07XG5cdFx0XHRjdXJyLnNwbGljZShiaXNlY3QoY3VyciwgYSh2KSwgMCwgY3Vyci5sZW5ndGgpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uICh0aHJlc2hvbGRzLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5oaXN0b2dyYW0gPSBbXTtcblx0XHRcdHZhciBhcnIgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDE7IGkgPCB0aHJlc2hvbGRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGFyciA9IFtdO1xuXHRcdFx0XHRhcnIueCA9IHRocmVzaG9sZHNbaSAtIDFdO1xuXHRcdFx0XHRhcnIuZHggPSAodGhyZXNob2xkc1tpXSAtIHRocmVzaG9sZHNbaSAtIDFdKTtcblx0XHRcdFx0YXJyLnkgPSAwO1xuXHRcdFx0XHRwYXRoKHApLmhpc3RvZ3JhbS5wdXNoKGFycik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2hpc3RvZ3JhbTsiLCJ2YXIgcmVkdWN0aW9fbWF4ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1heCA9IHBhdGgocCkudmFsdWVMaXN0W3BhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tYXggPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5tYXggPSBwYXRoKHApLnZhbHVlTGlzdFtwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggLSAxXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1heCA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWF4OyIsInZhciByZWR1Y3Rpb19tZWRpYW4gPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGhhbGY7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0aGFsZiA9IE1hdGguZmxvb3IocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoLzIpO1xuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoICUgMikge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHBhdGgocCkudmFsdWVMaXN0W2hhbGZdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSAocGF0aChwKS52YWx1ZUxpc3RbaGFsZi0xXSArIHBhdGgocCkudmFsdWVMaXN0W2hhbGZdKSAvIDIuMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaGFsZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRoYWxmID0gTWF0aC5mbG9vcihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgvMik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoID09PSAxIHx8IHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAlIDIpIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkubWVkaWFuID0gKHBhdGgocCkudmFsdWVMaXN0W2hhbGYtMV0gKyBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXSkgLyAyLjA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX21lZGlhbjsiLCJ2YXIgcmVkdWN0aW9fbWluID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1pbiA9IHBhdGgocCkudmFsdWVMaXN0WzBdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5taW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5taW4gPSBwYXRoKHApLnZhbHVlTGlzdFswXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1pbiA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWluOyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9fbmVzdCA9IHtcblx0YWRkOiBmdW5jdGlvbiAoa2V5QWNjZXNzb3JzLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpOyAvLyBDdXJyZW50IGtleSBhY2Nlc3NvclxuXHRcdHZhciBhcnJSZWY7XG5cdFx0dmFyIG5ld1JlZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRhcnJSZWYgPSBwYXRoKHApLm5lc3Q7XG5cdFx0XHRrZXlBY2Nlc3NvcnMuZm9yRWFjaChmdW5jdGlvbihhKSB7XG5cdFx0XHRcdG5ld1JlZiA9IGFyclJlZi5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXkgPT09IGEodik7IH0pWzBdO1xuXHRcdFx0XHRpZihuZXdSZWYpIHtcblx0XHRcdFx0XHQvLyBUaGVyZSBpcyBhbm90aGVyIGxldmVsLlxuXHRcdFx0XHRcdGFyclJlZiA9IG5ld1JlZi52YWx1ZXM7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gTmV4dCBsZXZlbCBkb2Vzbid0IHlldCBleGlzdCBzbyB3ZSBjcmVhdGUgaXQuXG5cdFx0XHRcdFx0bmV3UmVmID0gW107XG5cdFx0XHRcdFx0YXJyUmVmLnB1c2goeyBrZXk6IGEodiksIHZhbHVlczogbmV3UmVmIH0pO1xuXHRcdFx0XHRcdGFyclJlZiA9IG5ld1JlZjtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGFyclJlZi5wdXNoKHYpO1xuXHRcdFx0XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChrZXlBY2Nlc3NvcnMsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGFyclJlZjtcblx0XHR2YXIgbmV4dFJlZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRhcnJSZWYgPSBwYXRoKHApLm5lc3Q7XG5cdFx0XHRrZXlBY2Nlc3NvcnMuZm9yRWFjaChmdW5jdGlvbihhKSB7XG5cdFx0XHRcdGFyclJlZiA9IGFyclJlZi5maWx0ZXIoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXkgPT09IGEodik7IH0pWzBdLnZhbHVlcztcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBBcnJheSBjb250YWlucyBhbiBhY3R1YWwgcmVmZXJlbmNlIHRvIHRoZSByb3csIHNvIGp1c3Qgc3BsaWNlIGl0IG91dC5cblx0XHRcdGFyclJlZi5zcGxpY2UoYXJyUmVmLmluZGV4T2YodiksIDEpO1xuXG5cdFx0XHQvLyBJZiB0aGUgbGVhZiBub3cgaGFzIGxlbmd0aCAwIGFuZCBpdCdzIG5vdCB0aGUgYmFzZSBhcnJheSByZW1vdmUgaXQuXG5cdFx0XHQvLyBUT0RPXG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5uZXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX25lc3Q7IiwidmFyIHJlZHVjdGlvX3BhcmFtZXRlcnMgPSBmdW5jdGlvbigpIHtcblx0cmV0dXJuIHtcblx0XHRvcmRlcjogZmFsc2UsXG5cdFx0YXZnOiBmYWxzZSxcblx0XHRjb3VudDogZmFsc2UsXG5cdFx0c3VtOiBmYWxzZSxcblx0XHRleGNlcHRpb25BY2Nlc3NvcjogZmFsc2UsXG5cdFx0ZXhjZXB0aW9uQ291bnQ6IGZhbHNlLFxuXHRcdGV4Y2VwdGlvblN1bTogZmFsc2UsXG5cdFx0ZmlsdGVyOiBmYWxzZSxcblx0XHR2YWx1ZUxpc3Q6IGZhbHNlLFxuXHRcdG1lZGlhbjogZmFsc2UsXG5cdFx0aGlzdG9ncmFtVmFsdWU6IGZhbHNlLFxuXHRcdG1pbjogZmFsc2UsXG5cdFx0bWF4OiBmYWxzZSxcblx0XHRoaXN0b2dyYW1UaHJlc2hvbGRzOiBmYWxzZSxcblx0XHRzdGQ6IGZhbHNlLFxuXHRcdHN1bU9mU3F1YXJlczogZmFsc2UsXG5cdFx0dmFsdWVzOiBmYWxzZSxcblx0XHRuZXN0S2V5czogZmFsc2UsXG5cdFx0YWxpYXNLZXlzOiBmYWxzZSxcblx0XHRhbGlhc1Byb3BLZXlzOiBmYWxzZSxcblx0XHRncm91cEFsbDogZmFsc2UsXG5cdFx0ZGF0YUxpc3Q6IGZhbHNlLFxuXHRcdGN1c3RvbTogZmFsc2Vcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fcGFyYW1ldGVycztcbiIsImZ1bmN0aW9uIHBvc3RQcm9jZXNzKHJlZHVjdGlvKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChncm91cCwgcCwgZikge1xuICAgICAgICBncm91cC5wb3N0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBwb3N0cHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3MuYWxsKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5hbGwoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcG9zdHByb2Nlc3NvcnMgPSByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycztcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHBvc3Rwcm9jZXNzb3JzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgcG9zdHByb2Nlc3NbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYWxsID0gcG9zdHByb2Nlc3MuYWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3JzW25hbWVdKF9hbGwsIGYsIHApLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3M7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzO1xuICAgICAgICB9O1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcG9zdFByb2Nlc3M7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlZHVjdGlvKXtcbiAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycyA9IHt9O1xuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvciA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpe1xuICAgICAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29yc1tuYW1lXSA9IGZ1bmM7XG4gICAgfTtcblxuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvcignY2FwJywgcmVxdWlyZSgnLi9jYXAnKSk7XG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yKCdzb3J0QnknLCByZXF1aXJlKCcuL3NvcnRCeScpKTtcbn07XG4iLCJ2YXIgcmVkdWN0aW9fYnVpbGQgPSByZXF1aXJlKCcuL2J1aWxkLmpzJyk7XG52YXIgcmVkdWN0aW9fYWNjZXNzb3JzID0gcmVxdWlyZSgnLi9hY2Nlc3NvcnMuanMnKTtcbnZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gcmVxdWlyZSgnLi9wYXJhbWV0ZXJzLmpzJyk7XG52YXIgcmVkdWN0aW9fcG9zdHByb2Nlc3MgPSByZXF1aXJlKCcuL3Bvc3Rwcm9jZXNzJyk7XG52YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcjInKTtcblxuZnVuY3Rpb24gcmVkdWN0aW8oKSB7XG5cdHZhciBwYXJhbWV0ZXJzID0gcmVkdWN0aW9fcGFyYW1ldGVycygpO1xuXG5cdHZhciBmdW5jcyA9IHt9O1xuXG5cdGZ1bmN0aW9uIG15KGdyb3VwKSB7XG5cdFx0Ly8gU3RhcnQgZnJlc2ggZWFjaCB0aW1lLlxuXHRcdGZ1bmNzID0ge1xuXHRcdFx0cmVkdWNlQWRkOiBmdW5jdGlvbihwKSB7IHJldHVybiBwOyB9LFxuXHRcdFx0cmVkdWNlUmVtb3ZlOiBmdW5jdGlvbihwKSB7IHJldHVybiBwOyB9LFxuXHRcdFx0cmVkdWNlSW5pdGlhbDogZnVuY3Rpb24gKCkgeyByZXR1cm4ge307IH0sXG5cdFx0fTtcblxuXHRcdHJlZHVjdGlvX2J1aWxkLmJ1aWxkKHBhcmFtZXRlcnMsIGZ1bmNzKTtcblxuXHRcdC8vIElmIHdlJ3JlIGRvaW5nIGdyb3VwQWxsXG5cdFx0aWYocGFyYW1ldGVycy5ncm91cEFsbCkge1xuXHRcdFx0aWYoZ3JvdXAudG9wKSB7XG5cdFx0XHRcdGNvbnNvbGUud2FybihcIidncm91cEFsbCcgaXMgZGVmaW5lZCBidXQgYXR0ZW1wdGluZyB0byBydW4gb24gYSBzdGFuZGFyZCBkaW1lbnNpb24uZ3JvdXAoKS4gTXVzdCBydW4gb24gZGltZW5zaW9uLmdyb3VwQWxsKCkuXCIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleTsgfSkubGVmdDtcblx0XHRcdFx0dmFyIGksIGo7XG5cdFx0XHRcdHZhciBrZXlzO1xuICAgICAgICB2YXIga2V5c0xlbmd0aDtcbiAgICAgICAgdmFyIGs7IC8vIEtleVxuXHRcdFx0XHRncm91cC5yZWR1Y2UoXG5cdFx0XHRcdFx0ZnVuY3Rpb24ocCwgdiwgbmYpIHtcblx0XHRcdFx0XHRcdGtleXMgPSBwYXJhbWV0ZXJzLmdyb3VwQWxsKHYpO1xuICAgICAgICAgICAga2V5c0xlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGo9MDtqPGtleXNMZW5ndGg7aisrKSB7XG4gICAgICAgICAgICAgIGsgPSBrZXlzW2pdO1xuICAgICAgICAgICAgICBpID0gYmlzZWN0KHAsIGssIDAsIHAubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aWYoIXBbaV0gfHwgcFtpXS5rZXkgIT09IGspIHtcblx0XHRcdFx0XHRcdFx0XHQvLyBJZiB0aGUgZ3JvdXAgZG9lc24ndCB5ZXQgZXhpc3QsIGNyZWF0ZSBpdCBmaXJzdC5cblx0XHRcdFx0XHRcdFx0XHRwLnNwbGljZShpLCAwLCB7IGtleTogaywgdmFsdWU6IGZ1bmNzLnJlZHVjZUluaXRpYWwoKSB9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdC8vIFRoZW4gcGFzcyB0aGUgcmVjb3JkIGFuZCB0aGUgZ3JvdXAgdmFsdWUgdG8gdGhlIHJlZHVjZXJzXG5cdFx0XHRcdFx0XHRcdGZ1bmNzLnJlZHVjZUFkZChwW2ldLnZhbHVlLCB2LCBuZik7XG4gICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKHAsIHYsIG5mKSB7XG5cdFx0XHRcdFx0XHRrZXlzID0gcGFyYW1ldGVycy5ncm91cEFsbCh2KTtcbiAgICAgICAgICAgIGtleXNMZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihqPTA7ajxrZXlzTGVuZ3RoO2orKykge1xuICAgICAgICAgICAgICBpID0gYmlzZWN0KHAsIGtleXNbal0sIDAsIHAubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0Ly8gVGhlIGdyb3VwIHNob3VsZCBleGlzdCBvciB3ZSdyZSBpbiB0cm91YmxlIVxuXHRcdFx0XHRcdFx0XHQvLyBUaGVuIHBhc3MgdGhlIHJlY29yZCBhbmQgdGhlIGdyb3VwIHZhbHVlIHRvIHRoZSByZWR1Y2Vyc1xuXHRcdFx0XHRcdFx0XHRmdW5jcy5yZWR1Y2VSZW1vdmUocFtpXS52YWx1ZSwgdiwgbmYpO1xuICAgICAgICAgICAgfVxuXHRcdFx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRmdW5jdGlvbigpIHtcblx0XHRcdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdCk7XG5cdFx0XHRcdGlmKCFncm91cC5hbGwpIHtcblx0XHRcdFx0XHQvLyBBZGQgYW4gJ2FsbCcgbWV0aG9kIGZvciBjb21wYXRpYmlsaXR5IHdpdGggc3RhbmRhcmQgQ3Jvc3NmaWx0ZXIgZ3JvdXBzLlxuXHRcdFx0XHRcdGdyb3VwLmFsbCA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy52YWx1ZSgpOyB9O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGdyb3VwLnJlZHVjZShmdW5jcy5yZWR1Y2VBZGQsIGZ1bmNzLnJlZHVjZVJlbW92ZSwgZnVuY3MucmVkdWNlSW5pdGlhbCk7XG5cdFx0fVxuXG5cdFx0cmVkdWN0aW9fcG9zdHByb2Nlc3MoZ3JvdXAsIHBhcmFtZXRlcnMsIGZ1bmNzKTtcblxuXHRcdHJldHVybiBncm91cDtcblx0fVxuXG5cdHJlZHVjdGlvX2FjY2Vzc29ycy5idWlsZChteSwgcGFyYW1ldGVycyk7XG5cblx0cmV0dXJuIG15O1xufVxuXG5yZXF1aXJlKCcuL3Bvc3Rwcm9jZXNzb3JzJykocmVkdWN0aW8pO1xucmVkdWN0aW9fcG9zdHByb2Nlc3MgPSByZWR1Y3Rpb19wb3N0cHJvY2VzcyhyZWR1Y3Rpbyk7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW87XG4iLCJ2YXIgcGx1Y2tfbiA9IGZ1bmN0aW9uIChuKSB7XG4gICAgaWYgKHR5cGVvZiBuID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBuO1xuICAgIH1cbiAgICBpZiAofm4uaW5kZXhPZignLicpKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IG4uc3BsaXQoJy4nKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3BsaXQucmVkdWNlKGZ1bmN0aW9uIChwLCB2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBbdl07XG4gICAgICAgICAgICB9LCBkKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBkW25dO1xuICAgIH07XG59O1xuXG5mdW5jdGlvbiBhc2NlbmRpbmcoYSwgYikge1xuICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogYSA+PSBiID8gMCA6IE5hTjtcbn1cblxudmFyIGNvbXBhcmVyID0gZnVuY3Rpb24gKGFjY2Vzc29yLCBvcmRlcmluZykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gb3JkZXJpbmcoYWNjZXNzb3IoYSksIGFjY2Vzc29yKGIpKTtcbiAgICB9O1xufTtcblxudmFyIHR5cGUgPSB7fS50b1N0cmluZztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJpb3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCBvcmRlcikge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgb3JkZXIgPSBhc2NlbmRpbmc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByaW9yKCkuc29ydChjb21wYXJlcihwbHVja19uKHZhbHVlKSwgb3JkZXIpKTtcbiAgICB9O1xufTtcbiIsInZhciByZWR1Y3Rpb19zdGQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0XHR2YXIgbiA9IHBhdGgocCkuc3VtT2ZTcSAtIHBhdGgocCkuc3VtKnBhdGgocCkuc3VtL3BhdGgocCkuY291bnQ7XG5cdFx0XHRcdGlmIChuPjAuMCkgcGF0aChwKS5zdGQgPSBNYXRoLnNxcnQobi8ocGF0aChwKS5jb3VudC0xKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDAuMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0XHR2YXIgbiA9IHBhdGgocCkuc3VtT2ZTcSAtIHBhdGgocCkuc3VtKnBhdGgocCkuc3VtL3BhdGgocCkuY291bnQ7XG5cdFx0XHRcdGlmIChuPjAuMCkgcGF0aChwKS5zdGQgPSBNYXRoLnNxcnQobi8ocGF0aChwKS5jb3VudC0xKSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuc3RkID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3RkOyIsInZhciByZWR1Y3Rpb19zdW1fb2Zfc3EgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtT2ZTcSA9IHBhdGgocCkuc3VtT2ZTcSArIGEodikqYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtT2ZTcSA9IHBhdGgocCkuc3VtT2ZTcSAtIGEodikqYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3VtX29mX3NxOyIsInZhciByZWR1Y3Rpb19zdW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtID0gcGF0aChwKS5zdW0gKyBhKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW0gPSBwYXRoKHApLnN1bSAtIGEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuc3VtID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fc3VtOyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG52YXIgcmVkdWN0aW9fdmFsdWVfY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE5vdCBzdXJlIGlmIHRoaXMgaXMgbW9yZSBlZmZpY2llbnQgdGhhbiBzb3J0aW5nLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoY3VyciAmJiBjdXJyWzBdID09PSBhKHYpKSB7XG5cdFx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIGluIHRoZSBhcnJheSAtIGluY3JlbWVudCBpdFxuXHRcdFx0XHRjdXJyWzFdKys7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IC0gYWRkIGl0IGluIGZvcm0gW3ZhbHVlLCAxXVxuXHRcdFx0XHRwYXRoKHApLnZhbHVlcy5zcGxpY2UoaSwgMCwgW2EodiksIDFdKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIG9yIHNvbWV0aGluZyBoYXMgZ29uZSB0ZXJyaWJseSB3cm9uZy5cblx0XHRcdHBhdGgocCkudmFsdWVzW2ldWzFdLS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdC8vIEFycmF5W0FycmF5W3ZhbHVlLCBjb3VudF1dXG5cdFx0XHRwYXRoKHApLnZhbHVlcyA9IFtdO1xuXHRcdFx0cGF0aChwKS5iaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFswXTsgfSkubGVmdDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fdmFsdWVfY291bnQ7IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJyk7XG5cbnZhciByZWR1Y3Rpb192YWx1ZV9saXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gTm90IHN1cmUgaWYgdGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIHNvcnRpbmcuXG5cdFx0XHRpID0gYmlzZWN0KHBhdGgocCkudmFsdWVMaXN0LCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgpO1xuXHRcdFx0cGF0aChwKS52YWx1ZUxpc3Quc3BsaWNlKGksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBiaXNlY3QocGF0aChwKS52YWx1ZUxpc3QsIGEodiksIDAsIHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCk7XG5cdFx0XHQvLyBWYWx1ZSBhbHJlYWR5IGV4aXN0cyBvciBzb21ldGhpbmcgaGFzIGdvbmUgdGVycmlibHkgd3JvbmcuXG5cdFx0XHRwYXRoKHApLnZhbHVlTGlzdC5zcGxpY2UoaSwgMSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkudmFsdWVMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3ZhbHVlX2xpc3Q7IiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG52YXIgYWdncmVnYXRvcnMgPSB7XG4gIC8vIENvbGxlY3Rpb25zXG4gICRzdW06ICRzdW0sXG4gICRhdmc6ICRhdmcsXG4gICRtYXg6ICRtYXgsXG4gICRtaW46ICRtaW4sXG5cbiAgLy8gUGlja2Vyc1xuICAkY291bnQ6ICRjb3VudCxcbiAgJGZpcnN0OiAkZmlyc3QsXG4gICRsYXN0OiAkbGFzdCxcbiAgJGdldDogJGdldCxcbiAgJG50aDogJGdldCwgLy8gbnRoIGlzIHNhbWUgYXMgdXNpbmcgYSBnZXRcbiAgJG50aExhc3Q6ICRudGhMYXN0LFxuICAkbnRoUGN0OiAkbnRoUGN0LFxuICAkbWFwOiAkbWFwLFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWFrZVZhbHVlQWNjZXNzb3I6IG1ha2VWYWx1ZUFjY2Vzc29yLFxuICBhZ2dyZWdhdG9yczogYWdncmVnYXRvcnMsXG4gIGV4dHJhY3RLZXlWYWxPckFycmF5OiBleHRyYWN0S2V5VmFsT3JBcnJheSxcbiAgcGFyc2VBZ2dyZWdhdG9yUGFyYW1zOiBwYXJzZUFnZ3JlZ2F0b3JQYXJhbXMsXG59XG4vLyBUaGlzIGlzIHVzZWQgdG8gYnVpbGQgYWdncmVnYXRpb24gc3RhY2tzIGZvciBzdWItcmVkdWN0aW9cbi8vIGFnZ3JlZ2F0aW9ucywgb3IgcGx1Y2tpbmcgdmFsdWVzIGZvciB1c2UgaW4gZmlsdGVycyBmcm9tIHRoZSBkYXRhXG5mdW5jdGlvbiBtYWtlVmFsdWVBY2Nlc3NvcihvYmopIHtcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKGlzU3RyaW5nU3ludGF4KG9iaikpIHtcbiAgICAgIG9iaiA9IGNvbnZlcnRBZ2dyZWdhdG9yU3RyaW5nKG9iailcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVzdCBiZSBhIGNvbHVtbiBrZXkuIFJldHVybiBhbiBpZGVudGl0eSBhY2Nlc3NvclxuICAgICAgcmV0dXJuIG9ialxuICAgIH1cbiAgfVxuICAvLyBNdXN0IGJlIGEgY29sdW1uIGluZGV4LiBSZXR1cm4gYW4gaWRlbnRpdHkgYWNjZXNzb3JcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIG9ialxuICB9XG4gIC8vIElmIGl0J3MgYW4gb2JqZWN0LCB3ZSBuZWVkIHRvIGJ1aWxkIGEgY3VzdG9tIHZhbHVlIGFjY2Vzc29yIGZ1bmN0aW9uXG4gIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICByZXR1cm4gbWFrZSgpXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlKCkge1xuICAgIHZhciBzdGFjayA9IG1ha2VTdWJBZ2dyZWdhdGlvbkZ1bmN0aW9uKG9iailcbiAgICByZXR1cm4gZnVuY3Rpb24gdG9wU3RhY2soZCkge1xuICAgICAgcmV0dXJuIHN0YWNrKGQpXG4gICAgfVxuICB9XG59XG5cbi8vIEEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgdGhlIGFnZ3JlZ2F0aW9uIHN0YWNrIGFuZCByZXR1cm5zXG4vLyBhIGZ1bmN0aW9uLiBUaGUgcmV0dXJuZWQgZnVuY3Rpb24sIHdoZW4gY2FsbGVkLCB3aWxsIHJlY3Vyc2l2ZWx5IGludm9rZVxuLy8gd2l0aCB0aGUgcHJvcGVydGllcyBmcm9tIHRoZSBwcmV2aW91cyBzdGFjayBpbiByZXZlcnNlIG9yZGVyXG5mdW5jdGlvbiBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihvYmopIHtcbiAgLy8gSWYgaXRzIGFuIG9iamVjdCwgZWl0aGVyIHVud3JhcCBhbGwgb2YgdGhlIHByb3BlcnRpZXMgYXMgYW5cbiAgLy8gYXJyYXkgb2Yga2V5VmFsdWVzLCBvciB1bndyYXAgdGhlIGZpcnN0IGtleVZhbHVlIHNldCBhcyBhbiBvYmplY3RcbiAgb2JqID0gXy5pc09iamVjdChvYmopID8gZXh0cmFjdEtleVZhbE9yQXJyYXkob2JqKSA6IG9ialxuXG4gIC8vIERldGVjdCBzdHJpbmdzXG4gIGlmIChfLmlzU3RyaW5nKG9iaikpIHtcbiAgICAvLyBJZiBiZWdpbnMgd2l0aCBhICQsIHRoZW4gd2UgbmVlZCB0byBjb252ZXJ0IGl0IG92ZXIgdG8gYSByZWd1bGFyIHF1ZXJ5IG9iamVjdCBhbmQgYW5hbHl6ZSBpdCBhZ2FpblxuICAgIGlmIChpc1N0cmluZ1N5bnRheChvYmopKSB7XG4gICAgICByZXR1cm4gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24oY29udmVydEFnZ3JlZ2F0b3JTdHJpbmcob2JqKSlcbiAgICB9XG4gICAgLy8gSWYgbm9ybWFsIHN0cmluZywgdGhlbiBqdXN0IHJldHVybiBhIGFuIGl0ZW50aXR5IGFjY2Vzc29yXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlkZW50aXR5KGQpIHtcbiAgICAgIHJldHVybiBkW29ial1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBhcnJheSwgcmVjdXJzZSBpbnRvIGVhY2ggaXRlbSBhbmQgcmV0dXJuIGFzIGEgbWFwXG4gIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgIHZhciBzdWJTdGFjayA9IF8ubWFwKG9iaiwgbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldFN1YlN0YWNrKGQpIHtcbiAgICAgIHJldHVybiBzdWJTdGFjay5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gcyhkKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyBJZiBvYmplY3QsIGZpbmQgdGhlIGFnZ3JlZ2F0aW9uLCBhbmQgcmVjdXJzZSBpbnRvIHRoZSB2YWx1ZVxuICBpZiAob2JqLmtleSkge1xuICAgIGlmIChhZ2dyZWdhdG9yc1tvYmoua2V5XSkge1xuICAgICAgdmFyIHN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24gPSBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihvYmoudmFsdWUpXG4gICAgICByZXR1cm4gZnVuY3Rpb24gZ2V0QWdncmVnYXRpb24oZCkge1xuICAgICAgICByZXR1cm4gYWdncmVnYXRvcnNbb2JqLmtleV0oc3ViQWdncmVnYXRpb25GdW5jdGlvbihkKSlcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGZpbmQgYWdncmVncmF0aW9uIG1ldGhvZCcsIG9iailcbiAgfVxuXG4gIHJldHVybiBbXVxufVxuXG5mdW5jdGlvbiBleHRyYWN0S2V5VmFsT3JBcnJheShvYmopIHtcbiAgdmFyIGtleVZhbFxuICB2YXIgdmFsdWVzID0gW11cbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAga2V5VmFsID0ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IG9ialtrZXldLFxuICAgICAgfVxuICAgICAgdmFyIHN1Yk9iaiA9IHt9XG4gICAgICBzdWJPYmpba2V5XSA9IG9ialtrZXldXG4gICAgICB2YWx1ZXMucHVzaChzdWJPYmopXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZXMubGVuZ3RoID4gMSA/IHZhbHVlcyA6IGtleVZhbFxufVxuXG5mdW5jdGlvbiBpc1N0cmluZ1N5bnRheChzdHIpIHtcbiAgcmV0dXJuIFsnJCcsICcoJ10uaW5kZXhPZihzdHIuY2hhckF0KDApKSA+IC0xXG59XG5cbmZ1bmN0aW9uIHBhcnNlQWdncmVnYXRvclBhcmFtcyhrZXlTdHJpbmcpIHtcbiAgdmFyIHBhcmFtcyA9IFtdXG4gIHZhciBwMSA9IGtleVN0cmluZy5pbmRleE9mKCcoJylcbiAgdmFyIHAyID0ga2V5U3RyaW5nLmluZGV4T2YoJyknKVxuICB2YXIga2V5ID0gcDEgPiAtMSA/IGtleVN0cmluZy5zdWJzdHJpbmcoMCwgcDEpIDoga2V5U3RyaW5nXG4gIGlmICghYWdncmVnYXRvcnNba2V5XSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGlmIChwMSA+IC0xICYmIHAyID4gLTEgJiYgcDIgPiBwMSkge1xuICAgIHBhcmFtcyA9IGtleVN0cmluZy5zdWJzdHJpbmcocDEgKyAxLCBwMikuc3BsaXQoJywnKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZ2dyZWdhdG9yOiBhZ2dyZWdhdG9yc1trZXldLFxuICAgIHBhcmFtczogcGFyYW1zLFxuICB9XG59XG5cbmZ1bmN0aW9uIGNvbnZlcnRBZ2dyZWdhdG9yU3RyaW5nKGtleVN0cmluZykge1xuICAvLyB2YXIgb2JqID0ge30gLy8gb2JqIGlzIGRlZmluZWQgYnV0IG5vdCB1c2VkXG5cbiAgLy8gMS4gdW53cmFwIHRvcCBwYXJlbnRoZXNlc1xuICAvLyAyLiBkZXRlY3QgYXJyYXlzXG5cbiAgLy8gcGFyZW50aGVzZXNcbiAgdmFyIG91dGVyUGFyZW5zID0gL1xcKCguKylcXCkvZ1xuICAvLyB2YXIgaW5uZXJQYXJlbnMgPSAvXFwoKFteXFwoXFwpXSspXFwpL2cgIC8vIGlubmVyUGFyZW5zIGlzIGRlZmluZWQgYnV0IG5vdCB1c2VkXG4gIC8vIGNvbW1hIG5vdCBpbiAoKVxuICB2YXIgaGFzQ29tbWEgPSAvKD86XFwoW15cXChcXCldKlxcKSl8KCwpL2dcblxuICByZXR1cm4gSlNPTi5wYXJzZSgneycgKyB1bndyYXBQYXJlbnNBbmRDb21tYXMoa2V5U3RyaW5nKSArICd9JylcblxuICBmdW5jdGlvbiB1bndyYXBQYXJlbnNBbmRDb21tYXMoc3RyKSB7XG4gICAgc3RyID0gc3RyLnJlcGxhY2UoJyAnLCAnJylcbiAgICByZXR1cm4gKFxuICAgICAgJ1wiJyArXG4gICAgICBzdHIucmVwbGFjZShvdXRlclBhcmVucywgZnVuY3Rpb24ocCwgcHIpIHtcbiAgICAgICAgaWYgKGhhc0NvbW1hLnRlc3QocHIpKSB7XG4gICAgICAgICAgaWYgKHByLmNoYXJBdCgwKSA9PT0gJyQnKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAnXCI6e1wiJyArXG4gICAgICAgICAgICAgIHByLnJlcGxhY2UoaGFzQ29tbWEsIGZ1bmN0aW9uKHAyIC8qICwgcHIyICovKSB7XG4gICAgICAgICAgICAgICAgaWYgKHAyID09PSAnLCcpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiAnLFwiJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdW53cmFwUGFyZW5zQW5kQ29tbWFzKHAyKS50cmltKClcbiAgICAgICAgICAgICAgfSkgK1xuICAgICAgICAgICAgICAnfSdcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICc6W1wiJyArXG4gICAgICAgICAgICBwci5yZXBsYWNlKFxuICAgICAgICAgICAgICBoYXNDb21tYSxcbiAgICAgICAgICAgICAgZnVuY3Rpb24oLyogcDIgLCBwcjIgKi8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ1wiLFwiJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApICtcbiAgICAgICAgICAgICdcIl0nXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIClcbiAgfVxufVxuXG4vLyBDb2xsZWN0aW9uIEFnZ3JlZ2F0b3JzXG5cbmZ1bmN0aW9uICRzdW0oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGEgKyBiXG4gIH0sIDApXG59XG5cbmZ1bmN0aW9uICRhdmcoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIChcbiAgICBjaGlsZHJlbi5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuICAgICAgcmV0dXJuIGEgKyBiXG4gICAgfSwgMCkgLyBjaGlsZHJlbi5sZW5ndGhcbiAgKVxufVxuXG5mdW5jdGlvbiAkbWF4KGNoaWxkcmVuKSB7XG4gIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBjaGlsZHJlbilcbn1cblxuZnVuY3Rpb24gJG1pbihjaGlsZHJlbikge1xuICByZXR1cm4gTWF0aC5taW4uYXBwbHkobnVsbCwgY2hpbGRyZW4pXG59XG5cbmZ1bmN0aW9uICRjb3VudChjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW4ubGVuZ3RoXG59XG5cbi8qIGZ1bmN0aW9uICRtZWQoY2hpbGRyZW4pIHsgLy8gJG1lZCBpcyBkZWZpbmVkIGJ1dCBub3QgdXNlZFxuICBjaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSAtIGJcbiAgfSlcbiAgdmFyIGhhbGYgPSBNYXRoLmZsb29yKGNoaWxkcmVuLmxlbmd0aCAvIDIpXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggJSAyKVxuICAgIHJldHVybiBjaGlsZHJlbltoYWxmXVxuICBlbHNlXG4gICAgcmV0dXJuIChjaGlsZHJlbltoYWxmIC0gMV0gKyBjaGlsZHJlbltoYWxmXSkgLyAyLjBcbn0gKi9cblxuZnVuY3Rpb24gJGZpcnN0KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlblswXVxufVxuXG5mdW5jdGlvbiAkbGFzdChjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbn1cblxuZnVuY3Rpb24gJGdldChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bbl1cbn1cblxuZnVuY3Rpb24gJG50aExhc3QoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIG5dXG59XG5cbmZ1bmN0aW9uICRudGhQY3QoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW01hdGgucm91bmQoY2hpbGRyZW4ubGVuZ3RoICogKG4gLyAxMDApKV1cbn1cblxuZnVuY3Rpb24gJG1hcChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gZFtuXVxuICB9KVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNsZWFyKGRlZikge1xuICAgIC8vIENsZWFyIGEgc2luZ2xlIG9yIG11bHRpcGxlIGNvbHVtbiBkZWZpbml0aW9uc1xuICAgIGlmIChkZWYpIHtcbiAgICAgIGRlZiA9IF8uaXNBcnJheShkZWYpID8gZGVmIDogW2RlZl1cbiAgICB9XG5cbiAgICBpZiAoIWRlZikge1xuICAgICAgLy8gQ2xlYXIgYWxsIG9mIHRoZSBjb2x1bW4gZGVmZW5pdGlvbnNcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChcbiAgICAgICAgXy5tYXAoc2VydmljZS5jb2x1bW5zLCBkaXNwb3NlQ29sdW1uKVxuICAgICAgKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXJ2aWNlLmNvbHVtbnMgPSBbXVxuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXG4gICAgICBfLm1hcChkZWYsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKF8uaXNPYmplY3QoZCkpIHtcbiAgICAgICAgICBkID0gZC5rZXlcbiAgICAgICAgfVxuICAgICAgICAvLyBDbGVhciB0aGUgY29sdW1uXG4gICAgICAgIHZhciBjb2x1bW4gPSBfLnJlbW92ZShzZXJ2aWNlLmNvbHVtbnMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICAgICAgICByZXR1cm4gIV8ueG9yKGMua2V5LCBkKS5sZW5ndGhcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGMua2V5ID09PSBkKSB7XG4gICAgICAgICAgICBpZiAoYy5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgICAgICB9XG4gICAgICAgIH0pWzBdXG5cbiAgICAgICAgaWYgKCFjb2x1bW4pIHtcbiAgICAgICAgICAvLyBjb25zb2xlLmluZm8oJ0F0dGVtcHRlZCB0byBjbGVhciBhIGNvbHVtbiB0aGF0IGlzIHJlcXVpcmVkIGZvciBhbm90aGVyIHF1ZXJ5IScsIGMpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBkaXNwb3NlQ29sdW1uKGNvbHVtbilcbiAgICAgIH0pXG4gICAgKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gZGlzcG9zZUNvbHVtbihjb2x1bW4pIHtcbiAgICAgIHZhciBkaXNwb3NhbEFjdGlvbnMgPSBbXVxuICAgICAgLy8gRGlzcG9zZSB0aGUgZGltZW5zaW9uXG4gICAgICBpZiAoY29sdW1uLnJlbW92ZUxpc3RlbmVycykge1xuICAgICAgICBkaXNwb3NhbEFjdGlvbnMgPSBfLm1hcChjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLCBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobGlzdGVuZXIoKSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIHZhciBmaWx0ZXJLZXkgPSBjb2x1bW4ua2V5XG4gICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdhcnJheScpIHtcbiAgICAgICAgZmlsdGVyS2V5ID0gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSlcbiAgICAgIH1cbiAgICAgIGlmIChjb2x1bW4uY29tcGxleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBmaWx0ZXJLZXkgPSBjb2x1bW4ua2V5LnRvU3RyaW5nKClcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBzZXJ2aWNlLmZpbHRlcnNbZmlsdGVyS2V5XVxuICAgICAgaWYgKGNvbHVtbi5kaW1lbnNpb24pIHtcbiAgICAgICAgZGlzcG9zYWxBY3Rpb25zLnB1c2goUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZGlzcG9zZSgpKSlcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChkaXNwb3NhbEFjdGlvbnMpXG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgdmFyIGRpbWVuc2lvbiA9IHJlcXVpcmUoJy4vZGltZW5zaW9uJykoc2VydmljZSlcblxuICB2YXIgY29sdW1uRnVuYyA9IGNvbHVtblxuICBjb2x1bW5GdW5jLmZpbmQgPSBmaW5kQ29sdW1uXG5cbiAgcmV0dXJuIGNvbHVtbkZ1bmNcblxuICBmdW5jdGlvbiBjb2x1bW4oZGVmKSB7XG4gICAgLy8gU3VwcG9ydCBncm91cEFsbCBkaW1lbnNpb25cbiAgICBpZiAoXy5pc1VuZGVmaW5lZChkZWYpKSB7XG4gICAgICBkZWYgPSB0cnVlXG4gICAgfVxuXG4gICAgLy8gQWx3YXlzIGRlYWwgaW4gYnVsay4gIExpa2UgQ29zdGNvIVxuICAgIGlmICghXy5pc0FycmF5KGRlZikpIHtcbiAgICAgIGRlZiA9IFtkZWZdXG4gICAgfVxuXG4gICAgLy8gTWFwcCBhbGwgY29sdW1uIGNyZWF0aW9uLCB3YWl0IGZvciBhbGwgdG8gc2V0dGxlLCB0aGVuIHJldHVybiB0aGUgaW5zdGFuY2VcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoZGVmLCBtYWtlQ29sdW1uKSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBmaW5kQ29sdW1uKGQpIHtcbiAgICByZXR1cm4gXy5maW5kKHNlcnZpY2UuY29sdW1ucywgZnVuY3Rpb24gKGMpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkoZCkpIHtcbiAgICAgICAgcmV0dXJuICFfLnhvcihjLmtleSwgZCkubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gYy5rZXkgPT09IGRcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VHlwZShkKSB7XG4gICAgaWYgKF8uaXNOdW1iZXIoZCkpIHtcbiAgICAgIHJldHVybiAnbnVtYmVyJ1xuICAgIH1cbiAgICBpZiAoXy5pc0Jvb2xlYW4oZCkpIHtcbiAgICAgIHJldHVybiAnYm9vbCdcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShkKSkge1xuICAgICAgcmV0dXJuICdhcnJheSdcbiAgICB9XG4gICAgaWYgKF8uaXNPYmplY3QoZCkpIHtcbiAgICAgIHJldHVybiAnb2JqZWN0J1xuICAgIH1cbiAgICByZXR1cm4gJ3N0cmluZydcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VDb2x1bW4oZCkge1xuICAgIHZhciBjb2x1bW4gPSBfLmlzT2JqZWN0KGQpID8gZCA6IHtcbiAgICAgIGtleTogZCxcbiAgICB9XG5cbiAgICB2YXIgZXhpc3RpbmcgPSBmaW5kQ29sdW1uKGNvbHVtbi5rZXkpXG5cbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGV4aXN0aW5nLnRlbXBvcmFyeSA9IGZhbHNlXG4gICAgICBpZiAoZXhpc3RpbmcuZHluYW1pY1JlZmVyZW5jZSkge1xuICAgICAgICBleGlzdGluZy5keW5hbWljUmVmZXJlbmNlID0gZmFsc2VcbiAgICAgIH1cbiAgICAgIHJldHVybiBleGlzdGluZy5wcm9taXNlXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8vIGZvciBzdG9yaW5nIGluZm8gYWJvdXQgcXVlcmllcyBhbmQgcG9zdCBhZ2dyZWdhdGlvbnNcbiAgICBjb2x1bW4ucXVlcmllcyA9IFtdXG4gICAgc2VydmljZS5jb2x1bW5zLnB1c2goY29sdW1uKVxuXG4gICAgY29sdW1uLnByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKHNlcnZpY2UuY2YuYWxsKCkpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycilcbiAgICAgIH1cbiAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGFsbCkge1xuICAgICAgICB2YXIgc2FtcGxlXG5cbiAgICAgICAgLy8gQ29tcGxleCBjb2x1bW4gS2V5c1xuICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKGNvbHVtbi5rZXkpKSB7XG4gICAgICAgICAgY29sdW1uLmNvbXBsZXggPSAnZnVuY3Rpb24nXG4gICAgICAgICAgc2FtcGxlID0gY29sdW1uLmtleShhbGxbMF0pXG4gICAgICAgIH0gZWxzZSBpZiAoXy5pc1N0cmluZyhjb2x1bW4ua2V5KSAmJiAoY29sdW1uLmtleS5pbmRleE9mKCcuJykgPiAtMSB8fCBjb2x1bW4ua2V5LmluZGV4T2YoJ1snKSA+IC0xKSkge1xuICAgICAgICAgIGNvbHVtbi5jb21wbGV4ID0gJ3N0cmluZydcbiAgICAgICAgICBzYW1wbGUgPSBfLmdldChhbGxbMF0sIGNvbHVtbi5rZXkpXG4gICAgICAgIH0gZWxzZSBpZiAoXy5pc0FycmF5KGNvbHVtbi5rZXkpKSB7XG4gICAgICAgICAgY29sdW1uLmNvbXBsZXggPSAnYXJyYXknXG4gICAgICAgICAgc2FtcGxlID0gXy52YWx1ZXMoXy5waWNrKGFsbFswXSwgY29sdW1uLmtleSkpXG4gICAgICAgICAgaWYgKHNhbXBsZS5sZW5ndGggIT09IGNvbHVtbi5rZXkubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbHVtbiBrZXkgZG9lcyBub3QgZXhpc3QgaW4gZGF0YSEnLCBjb2x1bW4ua2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzYW1wbGUgPSBhbGxbMF1bY29sdW1uLmtleV1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGV4IENvbHVtblxuICAgICAgICBpZiAoIWNvbHVtbi5jb21wbGV4ICYmIGNvbHVtbi5rZXkgIT09IHRydWUgJiYgdHlwZW9mIHNhbXBsZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbHVtbiBrZXkgZG9lcyBub3QgZXhpc3QgaW4gZGF0YSEnLCBjb2x1bW4ua2V5KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGNvbHVtbiBleGlzdHMsIGxldCdzIGF0IGxlYXN0IG1ha2Ugc3VyZSBpdCdzIG1hcmtlZFxuICAgICAgICAvLyBhcyBwZXJtYW5lbnQuIFRoZXJlIGlzIGEgc2xpZ2h0IGNoYW5jZSBpdCBleGlzdHMgYmVjYXVzZVxuICAgICAgICAvLyBvZiBhIGZpbHRlciwgYW5kIHRoZSB1c2VyIGRlY2lkZXMgdG8gbWFrZSBpdCBwZXJtYW5lbnRcblxuICAgICAgICBpZiAoY29sdW1uLmtleSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbHVtbi50eXBlID0gJ2FsbCdcbiAgICAgICAgfSBlbHNlIGlmIChjb2x1bW4uY29tcGxleCkge1xuICAgICAgICAgIGNvbHVtbi50eXBlID0gJ2NvbXBsZXgnXG4gICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLmFycmF5KSB7XG4gICAgICAgICAgY29sdW1uLnR5cGUgPSAnYXJyYXknXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29sdW1uLnR5cGUgPSBnZXRUeXBlKHNhbXBsZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkaW1lbnNpb24ubWFrZShjb2x1bW4ua2V5LCBjb2x1bW4udHlwZSwgY29sdW1uLmNvbXBsZXgpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGRpbSkge1xuICAgICAgICBjb2x1bW4uZGltZW5zaW9uID0gZGltXG4gICAgICAgIGNvbHVtbi5maWx0ZXJDb3VudCA9IDBcbiAgICAgICAgdmFyIHN0b3BMaXN0ZW5pbmdGb3JEYXRhID0gc2VydmljZS5vbkRhdGFDaGFuZ2UoYnVpbGRDb2x1bW5LZXlzKVxuICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzID0gW3N0b3BMaXN0ZW5pbmdGb3JEYXRhXVxuXG4gICAgICAgIHJldHVybiBidWlsZENvbHVtbktleXMoKVxuXG4gICAgICAgIC8vIEJ1aWxkIHRoZSBjb2x1bW5LZXlzXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkQ29sdW1uS2V5cyhjaGFuZ2VzKSB7XG4gICAgICAgICAgaWYgKGNvbHVtbi5rZXkgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBhY2Nlc3NvciA9IGRpbWVuc2lvbi5tYWtlQWNjZXNzb3IoY29sdW1uLmtleSwgY29sdW1uLmNvbXBsZXgpXG4gICAgICAgICAgY29sdW1uLnZhbHVlcyA9IGNvbHVtbi52YWx1ZXMgfHwgW11cblxuICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBpZiAoY2hhbmdlcyAmJiBjaGFuZ2VzLmFkZGVkKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShjaGFuZ2VzLmFkZGVkKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5ib3R0b20oSW5maW5pdHkpKVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJvd3MpIHtcbiAgICAgICAgICAgICAgdmFyIG5ld1ZhbHVlc1xuICAgICAgICAgICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdzdHJpbmcnIHx8IGNvbHVtbi5jb21wbGV4ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbmV3VmFsdWVzID0gXy5tYXAocm93cywgYWNjZXNzb3IpXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2cocm93cywgYWNjZXNzb3IudG9TdHJpbmcoKSwgbmV3VmFsdWVzKVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNvbHVtbi50eXBlID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgICAgICAgbmV3VmFsdWVzID0gXy5mbGF0dGVuKF8ubWFwKHJvd3MsIGFjY2Vzc29yKSlcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXdWYWx1ZXMgPSBfLm1hcChyb3dzLCBhY2Nlc3NvcilcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb2x1bW4udmFsdWVzID0gXy51bmlxKGNvbHVtbi52YWx1ZXMuY29uY2F0KG5ld1ZhbHVlcykpXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgcmV0dXJuIGNvbHVtbi5wcm9taXNlXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIHtcbiAgICBidWlsZDogYnVpbGQsXG4gICAgZ2VuZXJhdGVDb2x1bW5zOiBnZW5lcmF0ZUNvbHVtbnMsXG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gIH1cblxuICBmdW5jdGlvbiBidWlsZChjKSB7XG4gICAgaWYgKF8uaXNBcnJheShjKSkge1xuICAgICAgLy8gVGhpcyBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3Jvc3NmaWx0ZXIoYykpXG4gICAgfVxuICAgIGlmICghYyB8fCB0eXBlb2YgYy5kaW1lbnNpb24gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgRXJyb3IoJ05vIENyb3NzZmlsdGVyIGRhdGEgb3IgaW5zdGFuY2UgZm91bmQhJykpXG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYylcbiAgfVxuXG4gIGZ1bmN0aW9uIGdlbmVyYXRlQ29sdW1ucyhkYXRhKSB7XG4gICAgaWYgKCFzZXJ2aWNlLm9wdGlvbnMuZ2VuZXJhdGVkQ29sdW1ucykge1xuICAgICAgcmV0dXJuIGRhdGFcbiAgICB9XG4gICAgcmV0dXJuIF8ubWFwKGRhdGEsIGZ1bmN0aW9uIChkLyogLCBpICovKSB7XG4gICAgICBfLmZvckVhY2goc2VydmljZS5vcHRpb25zLmdlbmVyYXRlZENvbHVtbnMsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICBkW2tleV0gPSB2YWwoZClcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZFxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBhZGQoZGF0YSkge1xuICAgIGRhdGEgPSBnZW5lcmF0ZUNvbHVtbnMoZGF0YSlcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShzZXJ2aWNlLmNmLmFkZChkYXRhKSlcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZWplY3QoZXJyKVxuICAgICAgfVxuICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfLm1hcChzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXIoe1xuICAgICAgICAgICAgICBhZGRlZDogZGF0YSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KS5yZWR1Y2UoZnVuY3Rpb24ocHJvbWlzZSwgZGF0YSkge1xuICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4oZGF0YSlcbiAgICAgICAgfSwgUHJvbWlzZS5yZXNvbHZlKHRydWUpKVxuICAgICAgfSlcblxuICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLCBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgIHJldHVybiBsaXN0ZW5lcigpXG4gICAgICB9KSkgICAgICBcbiAgICB9KVxuXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKHNlcnZpY2UuY2YucmVtb3ZlKHByZWRpY2F0ZSkpXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycilcbiAgICAgIH1cbiAgICB9KVxuICAgIFxuICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLCBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgIHJldHVybiBsaXN0ZW5lcigpXG4gICAgICB9KSkgICAgICBcbiAgICB9KVxuICAgIFxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgfSlcbiAgfVxufVxuXG5cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyB2YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJykgLy8gXyBpcyBkZWZpbmVkIGJ1dCBuZXZlciB1c2VkXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgcmV0dXJuIHNlcnZpY2UuY2xlYXIoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXJ2aWNlLmNmLmRhdGFMaXN0ZW5lcnMgPSBbXVxuICAgICAgICBzZXJ2aWNlLmNmLmZpbHRlckxpc3RlbmVycyA9IFtdXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5yZW1vdmUoKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIHtcbiAgICBtYWtlOiBtYWtlLFxuICAgIG1ha2VBY2Nlc3NvcjogbWFrZUFjY2Vzc29yLFxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZShrZXksIHR5cGUsIGNvbXBsZXgpIHtcbiAgICB2YXIgYWNjZXNzb3IgPSBtYWtlQWNjZXNzb3Ioa2V5LCBjb21wbGV4KVxuICAgIC8vIFByb21pc2UucmVzb2x2ZSB3aWxsIGhhbmRsZSBwcm9taXNlcyBvciBub24gcHJvbWlzZXMsIHNvXG4gICAgLy8gdGhpcyBjcm9zc2ZpbHRlciBhc3luYyBpcyBzdXBwb3J0ZWQgaWYgcHJlc2VudFxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5kaW1lbnNpb24oYWNjZXNzb3IsIHR5cGUgPT09ICdhcnJheScpKVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUFjY2Vzc29yKGtleSwgY29tcGxleCkge1xuICAgIHZhciBhY2Nlc3NvckZ1bmN0aW9uXG5cbiAgICBpZiAoY29tcGxleCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGFjY2Vzc29yRnVuY3Rpb24gPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gXy5nZXQoZCwga2V5KVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY29tcGxleCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgYWNjZXNzb3JGdW5jdGlvbiA9IGtleVxuICAgIH0gZWxzZSBpZiAoY29tcGxleCA9PT0gJ2FycmF5Jykge1xuICAgICAgdmFyIGFycmF5U3RyaW5nID0gXy5tYXAoa2V5LCBmdW5jdGlvbiAoaykge1xuICAgICAgICByZXR1cm4gJ2RbXFwnJyArIGsgKyAnXFwnXSdcbiAgICAgIH0pXG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID0gbmV3IEZ1bmN0aW9uKCdkJywgU3RyaW5nKCdyZXR1cm4gJyArIEpTT04uc3RyaW5naWZ5KGFycmF5U3RyaW5nKS5yZXBsYWNlKC9cIi9nLCAnJykpKSAgLy8gZXNsaW50LWRpc2FibGUtbGluZSAgbm8tbmV3LWZ1bmNcbiAgICB9IGVsc2Uge1xuICAgICAgYWNjZXNzb3JGdW5jdGlvbiA9XG4gICAgICAgIC8vIEluZGV4IERpbWVuc2lvblxuICAgICAgICBrZXkgPT09IHRydWUgPyBmdW5jdGlvbiBhY2Nlc3NvcihkLCBpKSB7XG4gICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgfSA6XG4gICAgICAgICAgLy8gVmFsdWUgQWNjZXNzb3IgRGltZW5zaW9uXG4gICAgICAgICAgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkW2tleV1cbiAgICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhY2Nlc3NvckZ1bmN0aW9uXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG4vLyB2YXIgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50JylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIC8vIEdldHRlcnNcbiAgJGZpZWxkOiAkZmllbGQsXG4gIC8vIEJvb2xlYW5zXG4gICRhbmQ6ICRhbmQsXG4gICRvcjogJG9yLFxuICAkbm90OiAkbm90LFxuXG4gIC8vIEV4cHJlc3Npb25zXG4gICRlcTogJGVxLFxuICAkZ3Q6ICRndCxcbiAgJGd0ZTogJGd0ZSxcbiAgJGx0OiAkbHQsXG4gICRsdGU6ICRsdGUsXG4gICRuZTogJG5lLFxuICAkdHlwZTogJHR5cGUsXG5cbiAgLy8gQXJyYXkgRXhwcmVzc2lvbnNcbiAgJGluOiAkaW4sXG4gICRuaW46ICRuaW4sXG4gICRjb250YWluczogJGNvbnRhaW5zLFxuICAkZXhjbHVkZXM6ICRleGNsdWRlcyxcbiAgJHNpemU6ICRzaXplLFxufVxuXG4vLyBHZXR0ZXJzXG5mdW5jdGlvbiAkZmllbGQoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGRbY2hpbGRdXG59XG5cbi8vIE9wZXJhdG9yc1xuXG5mdW5jdGlvbiAkYW5kKGQsIGNoaWxkKSB7XG4gIGNoaWxkID0gY2hpbGQoZClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiAkb3IoZCwgY2hpbGQpIHtcbiAgY2hpbGQgPSBjaGlsZChkKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoaWxkW2ldKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gJG5vdChkLCBjaGlsZCkge1xuICBjaGlsZCA9IGNoaWxkKGQpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG4vLyBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiAkZXEoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPT09IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGd0KGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID4gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkZ3RlKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID49IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGx0KGQsIGNoaWxkKSB7XG4gIHJldHVybiBkIDwgY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkbHRlKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkIDw9IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJG5lKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkICE9PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICR0eXBlKGQsIGNoaWxkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gY2hpbGQoKVxufVxuXG4vLyBBcnJheSBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiAkaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA+IC0xXG59XG5cbmZ1bmN0aW9uICRuaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA9PT0gLTFcbn1cblxuZnVuY3Rpb24gJGNvbnRhaW5zKGQsIGNoaWxkKSB7XG4gIHJldHVybiBjaGlsZCgpLmluZGV4T2YoZCkgPiAtMVxufVxuXG5mdW5jdGlvbiAkZXhjbHVkZXMoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGNoaWxkKCkuaW5kZXhPZihkKSA9PT0gLTFcbn1cblxuZnVuY3Rpb24gJHNpemUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQubGVuZ3RoID09PSBjaGlsZCgpXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbnZhciBleHByZXNzaW9ucyA9IHJlcXVpcmUoJy4vZXhwcmVzc2lvbnMnKVxudmFyIGFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIHtcbiAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICBhcHBseUZpbHRlcnM6IGFwcGx5RmlsdGVycyxcbiAgICBtYWtlRnVuY3Rpb246IG1ha2VGdW5jdGlvbixcbiAgICBzY2FuRm9yRHluYW1pY0ZpbHRlcnM6IHNjYW5Gb3JEeW5hbWljRmlsdGVycyxcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlcihjb2x1bW4sIGZpbCwgaXNSYW5nZSwgcmVwbGFjZSkge1xuICAgIHJldHVybiBnZXRDb2x1bW4oY29sdW1uKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKGNvbHVtbikge1xuICAgICAgLy8gQ2xvbmUgYSBjb3B5IG9mIHRoZSBuZXcgZmlsdGVyc1xuICAgICAgICB2YXIgbmV3RmlsdGVycyA9IF8uYXNzaWduKHt9LCBzZXJ2aWNlLmZpbHRlcnMpXG4gICAgICAgIC8vIEhlcmUgd2UgdXNlIHRoZSByZWdpc3RlcmVkIGNvbHVtbiBrZXkgZGVzcGl0ZSB0aGUgZmlsdGVyIGtleSBwYXNzZWQsIGp1c3QgaW4gY2FzZSB0aGUgZmlsdGVyIGtleSdzIG9yZGVyaW5nIGlzIG9yZGVyZWQgZGlmZmVyZW50bHkgOilcbiAgICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5rZXlcbiAgICAgICAgaWYgKGNvbHVtbi5jb21wbGV4ID09PSAnYXJyYXknKSB7XG4gICAgICAgICAgZmlsdGVyS2V5ID0gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sdW1uLmNvbXBsZXggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICBmaWx0ZXJLZXkgPSBjb2x1bW4ua2V5LnRvU3RyaW5nKClcbiAgICAgICAgfVxuICAgICAgICAvLyBCdWlsZCB0aGUgZmlsdGVyIG9iamVjdFxuICAgICAgICBuZXdGaWx0ZXJzW2ZpbHRlcktleV0gPSBidWlsZEZpbHRlck9iamVjdChmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpXG5cbiAgICAgICAgcmV0dXJuIGFwcGx5RmlsdGVycyhuZXdGaWx0ZXJzKVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldENvbHVtbihjb2x1bW4pIHtcbiAgICB2YXIgZXhpc3RzID0gc2VydmljZS5jb2x1bW4uZmluZChjb2x1bW4pXG4gICAgLy8gSWYgdGhlIGZpbHRlcnMgZGltZW5zaW9uIGRvZXNuJ3QgZXhpc3QgeWV0LCB0cnkgYW5kIGNyZWF0ZSBpdFxuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIWV4aXN0cykge1xuICAgICAgICAgIHJldHVybiByZXNvbHZlKHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAgICAgIGtleTogY29sdW1uLFxuICAgICAgICAgICAgdGVtcG9yYXJ5OiB0cnVlLFxuICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgIC8vIEl0IHdhcyBhYmxlIHRvIGJlIGNyZWF0ZWQsIHNvIHJldHJpZXZlIGFuZCByZXR1cm4gaXRcbiAgICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uLmZpbmQoY29sdW1uKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSXQgZXhpc3RzLCBzbyBqdXN0IHJldHVybiB3aGF0IHdlIGZvdW5kXG4gICAgICAgICAgcmVzb2x2ZShleGlzdHMpXG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZWplY3QoZXJyKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbGwoZmlscykge1xuICAgIC8vIElmIGVtcHR5LCByZW1vdmUgYWxsIGZpbHRlcnNcbiAgICBpZiAoIWZpbHMpIHtcbiAgICAgIHNlcnZpY2UuY29sdW1ucy5mb3JFYWNoKGZ1bmN0aW9uIChjb2wpIHtcbiAgICAgICAgY29sLmRpbWVuc2lvbi5maWx0ZXJBbGwoKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBhcHBseUZpbHRlcnMoe30pXG4gICAgfVxuXG4gICAgLy8gQ2xvbmUgYSBjb3B5IGZvciB0aGUgbmV3IGZpbHRlcnNcbiAgICB2YXIgbmV3RmlsdGVycyA9IF8uYXNzaWduKHt9LCBzZXJ2aWNlLmZpbHRlcnMpXG5cbiAgICB2YXIgZHMgPSBfLm1hcChmaWxzLCBmdW5jdGlvbiAoZmlsKSB7XG4gICAgICByZXR1cm4gZ2V0Q29sdW1uKGZpbC5jb2x1bW4pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChjb2x1bW4pIHtcbiAgICAgICAgICAvLyBIZXJlIHdlIHVzZSB0aGUgcmVnaXN0ZXJlZCBjb2x1bW4ga2V5IGRlc3BpdGUgdGhlIGZpbHRlciBrZXkgcGFzc2VkLCBqdXN0IGluIGNhc2UgdGhlIGZpbHRlciBrZXkncyBvcmRlcmluZyBpcyBvcmRlcmVkIGRpZmZlcmVudGx5IDopXG4gICAgICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICAgICAgLy8gQnVpbGQgdGhlIGZpbHRlciBvYmplY3RcbiAgICAgICAgICBuZXdGaWx0ZXJzW2ZpbHRlcktleV0gPSBidWlsZEZpbHRlck9iamVjdChmaWwudmFsdWUsIGZpbC5pc1JhbmdlLCBmaWwucmVwbGFjZSlcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGRzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYXBwbHlGaWx0ZXJzKG5ld0ZpbHRlcnMpXG4gICAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKSB7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQoZmlsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IGZpbCxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKF8uaXNPYmplY3QoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IG1ha2VGdW5jdGlvbihmaWwpLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGZpbCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZhbHVlOiBmaWwsXG4gICAgICAgIHJlcGxhY2U6IGlzUmFuZ2UgfHwgcmVwbGFjZSxcbiAgICAgICAgdHlwZTogaXNSYW5nZSA/ICdyYW5nZScgOiAnaW5jbHVzaXZlJyxcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlOiBmaWwsXG4gICAgICByZXBsYWNlOiByZXBsYWNlLFxuICAgICAgdHlwZTogJ2V4YWN0JyxcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhcHBseUZpbHRlcnMobmV3RmlsdGVycykge1xuICAgIHZhciBkcyA9IF8ubWFwKG5ld0ZpbHRlcnMsIGZ1bmN0aW9uIChmaWwsIGkpIHtcbiAgICAgIHZhciBleGlzdGluZyA9IHNlcnZpY2UuZmlsdGVyc1tpXVxuICAgICAgLy8gRmlsdGVycyBhcmUgdGhlIHNhbWUsIHNvIG5vIGNoYW5nZSBpcyBuZWVkZWQgb24gdGhpcyBjb2x1bW5cbiAgICAgIGlmIChmaWwgPT09IGV4aXN0aW5nKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgfVxuICAgICAgdmFyIGNvbHVtblxuICAgICAgLy8gUmV0cmlldmUgY29tcGxleCBjb2x1bW5zIGJ5IGRlY29kaW5nIHRoZSBjb2x1bW4ga2V5IGFzIGpzb25cbiAgICAgIGlmIChpLmNoYXJBdCgwKSA9PT0gJ1snKSB7XG4gICAgICAgIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoSlNPTi5wYXJzZShpKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHJpZXZlIHRoZSBjb2x1bW4gbm9ybWFsbHlcbiAgICAgICAgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChpKVxuICAgICAgfVxuXG4gICAgICAvLyBUb2dnbGluZyBhIGZpbHRlciB2YWx1ZSBpcyBhIGJpdCBkaWZmZXJlbnQgZnJvbSByZXBsYWNpbmcgdGhlbVxuICAgICAgaWYgKGZpbCAmJiBleGlzdGluZyAmJiAhZmlsLnJlcGxhY2UpIHtcbiAgICAgICAgbmV3RmlsdGVyc1tpXSA9IGZpbCA9IHRvZ2dsZUZpbHRlcnMoZmlsLCBleGlzdGluZylcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gZmlsdGVyLCByZW1vdmUgZXZlcnl0aGluZyBmcm9tIHRoZSBkaW1lbnNpb25cbiAgICAgIGlmICghZmlsKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0Jykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRXhhY3QoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyUmFuZ2UoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2luY2x1c2l2ZScpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbC52YWx1ZS5pbmRleE9mKGQpID4gLTFcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgICBpZiAoZmlsLnR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZpbC5mdW5jdGlvbikpXG4gICAgICB9XG4gICAgICAvLyBCeSBkZWZhdWx0IGlmIHNvbWV0aGluZyBjcmFwcyB1cCwganVzdCByZW1vdmUgYWxsIGZpbHRlcnNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGRzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgZmlsdGVycyBzYXRhdGVcbiAgICAgICAgc2VydmljZS5maWx0ZXJzID0gbmV3RmlsdGVyc1xuXG4gICAgICAgIC8vIFBsdWNrIGFuZCByZW1vdmUgZmFsc2V5IGZpbHRlcnMgZnJvbSB0aGUgbWl4XG4gICAgICAgIHZhciB0cnlSZW1vdmFsID0gW11cbiAgICAgICAgXy5mb3JFYWNoKHNlcnZpY2UuZmlsdGVycywgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgIHRyeVJlbW92YWwucHVzaCh7XG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gSWYgYW55IG9mIHRob3NlIGZpbHRlcnMgYXJlIHRoZSBsYXN0IGRlcGVuZGVuY3kgZm9yIHRoZSBjb2x1bW4sIHRoZW4gcmVtb3ZlIHRoZSBjb2x1bW5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHRyeVJlbW92YWwsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoKHYua2V5LmNoYXJBdCgwKSA9PT0gJ1snKSA/IEpTT04ucGFyc2Uodi5rZXkpIDogdi5rZXkpXG4gICAgICAgICAgaWYgKGNvbHVtbi50ZW1wb3JhcnkgJiYgIWNvbHVtbi5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5jbGVhcihjb2x1bW4ua2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBDYWxsIHRoZSBmaWx0ZXJMaXN0ZW5lcnMgYW5kIHdhaXQgZm9yIHRoZWlyIHJldHVyblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoc2VydmljZS5maWx0ZXJMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybiBsaXN0ZW5lcigpXG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVGaWx0ZXJzKGZpbCwgZXhpc3RpbmcpIHtcbiAgICAvLyBFeGFjdCBmcm9tIEluY2x1c2l2ZVxuICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgZmlsLnZhbHVlID0gXy54b3IoW2ZpbC52YWx1ZV0sIGV4aXN0aW5nLnZhbHVlKVxuICAgIH0gZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdpbmNsdXNpdmUnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdleGFjdCcpIHsgLy8gSW5jbHVzaXZlIGZyb20gRXhhY3RcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgW2V4aXN0aW5nLnZhbHVlXSlcbiAgICB9IGVsc2UgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykgeyAvLyBJbmNsdXNpdmUgLyBJbmNsdXNpdmUgTWVyZ2VcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWUpXG4gICAgfSBlbHNlIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnZXhhY3QnKSB7IC8vIEV4YWN0IC8gRXhhY3RcbiAgICAgIC8vIElmIHRoZSB2YWx1ZXMgYXJlIHRoZSBzYW1lLCByZW1vdmUgdGhlIGZpbHRlciBlbnRpcmVseVxuICAgICAgaWYgKGZpbC52YWx1ZSA9PT0gZXhpc3RpbmcudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICAvLyBUaGV5IHRoZXkgYXJlIGRpZmZlcmVudCwgbWFrZSBhbiBhcnJheVxuICAgICAgZmlsLnZhbHVlID0gW2ZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWVdXG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBuZXcgdHlwZSBiYXNlZCBvbiB0aGUgbWVyZ2VkIHZhbHVlc1xuICAgIGlmICghZmlsLnZhbHVlLmxlbmd0aCkge1xuICAgICAgZmlsID0gZmFsc2VcbiAgICB9IGVsc2UgaWYgKGZpbC52YWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgIGZpbC50eXBlID0gJ2V4YWN0J1xuICAgICAgZmlsLnZhbHVlID0gZmlsLnZhbHVlWzBdXG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbC50eXBlID0gJ2luY2x1c2l2ZSdcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsXG4gIH1cblxuICBmdW5jdGlvbiBzY2FuRm9yRHluYW1pY0ZpbHRlcnMocXVlcnkpIHtcbiAgICAvLyBIZXJlIHdlIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IHJlbGF0aXZlIHJlZmVyZW5jZXMgdG8gdGhlIHJhdyBkYXRhXG4gICAgLy8gYmVpbmcgdXNlZCBpbiB0aGUgZmlsdGVyLiBJZiBzbywgd2UgbmVlZCB0byBidWlsZCB0aG9zZSBkaW1lbnNpb25zIGFuZCBrZWVwXG4gICAgLy8gdGhlbSB1cGRhdGVkIHNvIHRoZSBmaWx0ZXJzIGNhbiBiZSByZWJ1aWx0IGlmIG5lZWRlZFxuICAgIC8vIFRoZSBzdXBwb3J0ZWQga2V5cyByaWdodCBub3cgYXJlOiAkY29sdW1uLCAkZGF0YVxuICAgIHZhciBjb2x1bW5zID0gW11cbiAgICB3YWxrKHF1ZXJ5LmZpbHRlcilcbiAgICByZXR1cm4gY29sdW1uc1xuXG4gICAgZnVuY3Rpb24gd2FsayhvYmopIHtcbiAgICAgIF8uZm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAvLyBmaW5kIHRoZSBkYXRhIHJlZmVyZW5jZXMsIGlmIGFueVxuICAgICAgICB2YXIgcmVmID0gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KVxuICAgICAgICBpZiAocmVmKSB7XG4gICAgICAgICAgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBpdCdzIGEgc3RyaW5nXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgICByZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXMobnVsbCwgdmFsKVxuICAgICAgICAgIGlmIChyZWYpIHtcbiAgICAgICAgICAgIGNvbHVtbnMucHVzaChyZWYpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGl0J3MgYW5vdGhlciBvYmplY3QsIGtlZXAgbG9va2luZ1xuICAgICAgICBpZiAoXy5pc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgd2Fsayh2YWwpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KSB7XG4gICAgLy8gbG9vayBmb3IgdGhlICRkYXRhIHN0cmluZyBhcyBhIHZhbHVlXG4gICAgaWYgKGtleSA9PT0gJyRkYXRhJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciB0aGUgJGNvbHVtbiBrZXkgYW5kIGl0J3MgdmFsdWUgYXMgYSBzdHJpbmdcbiAgICBpZiAoa2V5ICYmIGtleSA9PT0gJyRjb2x1bW4nKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgIHJldHVybiB2YWxcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybignVGhlIHZhbHVlIGZvciBmaWx0ZXIgXCIkY29sdW1uXCIgbXVzdCBiZSBhIHZhbGlkIGNvbHVtbiBrZXknLCB2YWwpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlRnVuY3Rpb24ob2JqLCBpc0FnZ3JlZ2F0aW9uKSB7XG4gICAgdmFyIHN1YkdldHRlcnNcblxuICAgIC8vIERldGVjdCByYXcgJGRhdGEgcmVmZXJlbmNlXG4gICAgaWYgKF8uaXNTdHJpbmcob2JqKSkge1xuICAgICAgdmFyIGRhdGFSZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXMobnVsbCwgb2JqKVxuICAgICAgaWYgKGRhdGFSZWYpIHtcbiAgICAgICAgdmFyIGRhdGEgPSBzZXJ2aWNlLmNmLmFsbCgpXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChfLmlzU3RyaW5nKG9iaikgfHwgXy5pc051bWJlcihvYmopIHx8IF8uaXNCb29sZWFuKG9iaikpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICBpZiAodHlwZW9mIGQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgcmV0dXJuIG9ialxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBleHByZXNzaW9ucy4kZXEoZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBhbiBhcnJheSwgcmVjdXJzZSBpbnRvIGVhY2ggaXRlbSBhbmQgcmV0dXJuIGFzIGEgbWFwXG4gICAgaWYgKF8uaXNBcnJheShvYmopKSB7XG4gICAgICBzdWJHZXR0ZXJzID0gXy5tYXAob2JqLCBmdW5jdGlvbiAobykge1xuICAgICAgICByZXR1cm4gbWFrZUZ1bmN0aW9uKG8sIGlzQWdncmVnYXRpb24pXG4gICAgICB9KVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIHJldHVybiBzdWJHZXR0ZXJzLm1hcChmdW5jdGlvbiAocykge1xuICAgICAgICAgIHJldHVybiBzKGQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgb2JqZWN0LCByZXR1cm4gYSByZWN1cnNpb24gZnVuY3Rpb24gdGhhdCBpdHNlbGYsIHJldHVybnMgdGhlIHJlc3VsdHMgb2YgYWxsIG9mIHRoZSBvYmplY3Qga2V5c1xuICAgIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHN1YkdldHRlcnMgPSBfLm1hcChvYmosIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAvLyBHZXQgdGhlIGNoaWxkXG4gICAgICAgIHZhciBnZXRTdWIgPSBtYWtlRnVuY3Rpb24odmFsLCBpc0FnZ3JlZ2F0aW9uKVxuXG4gICAgICAgIC8vIERldGVjdCByYXcgJGNvbHVtbiByZWZlcmVuY2VzXG4gICAgICAgIHZhciBkYXRhUmVmID0gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KVxuICAgICAgICBpZiAoZGF0YVJlZikge1xuICAgICAgICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKGRhdGFSZWYpXG4gICAgICAgICAgdmFyIGRhdGEgPSBjb2x1bW4udmFsdWVzXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgZXhwcmVzc2lvbiwgcGFzcyB0aGUgcGFyZW50VmFsdWUgYW5kIHRoZSBzdWJHZXR0ZXJcbiAgICAgICAgaWYgKGV4cHJlc3Npb25zW2tleV0pIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBleHByZXNzaW9uc1trZXldKGQsIGdldFN1YilcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWdncmVnYXRvck9iaiA9IGFnZ3JlZ2F0aW9uLnBhcnNlQWdncmVnYXRvclBhcmFtcyhrZXkpXG4gICAgICAgIGlmIChhZ2dyZWdhdG9yT2JqKSB7XG4gICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgYW55IGZ1cnRoZXIgb3BlcmF0aW9ucyBhcmUgZm9yIGFnZ3JlZ2F0aW9uc1xuICAgICAgICAgIC8vIGFuZCBub3QgZmlsdGVyc1xuICAgICAgICAgIGlzQWdncmVnYXRpb24gPSB0cnVlXG4gICAgICAgICAgLy8gaGVyZSB3ZSBwYXNzIHRydWUgdG8gbWFrZUZ1bmN0aW9uIHdoaWNoIGRlbm90ZXMgdGhhdFxuICAgICAgICAgIC8vIGFuIGFnZ3JlZ2F0aW5vIGNoYWluIGhhcyBzdGFydGVkIGFuZCB0byBzdG9wIHVzaW5nICRBTkRcbiAgICAgICAgICBnZXRTdWIgPSBtYWtlRnVuY3Rpb24odmFsLCBpc0FnZ3JlZ2F0aW9uKVxuICAgICAgICAgIC8vIElmIGl0J3MgYW4gYWdncmVnYXRpb24gb2JqZWN0LCBiZSBzdXJlIHRvIHBhc3MgaW4gdGhlIGNoaWxkcmVuLCBhbmQgdGhlbiBhbnkgYWRkaXRpb25hbCBwYXJhbXMgcGFzc2VkIGludG8gdGhlIGFnZ3JlZ2F0aW9uIHN0cmluZ1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWdncmVnYXRvck9iai5hZ2dyZWdhdG9yLmFwcGx5KG51bGwsIFtnZXRTdWIoKV0uY29uY2F0KGFnZ3JlZ2F0b3JPYmoucGFyYW1zKSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdCBtdXN0IGJlIGEgc3RyaW5nIHRoZW4uIFBsdWNrIHRoYXQgc3RyaW5nIGtleSBmcm9tIHBhcmVudCwgYW5kIHBhc3MgaXQgYXMgdGhlIG5ldyB2YWx1ZSB0byB0aGUgc3ViR2V0dGVyXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIGQgPSBkW2tleV1cbiAgICAgICAgICByZXR1cm4gZ2V0U3ViKGQsIGdldFN1YilcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gQWxsIG9iamVjdCBleHByZXNzaW9ucyBhcmUgYmFzaWNhbGx5IEFORCdzXG4gICAgICAvLyBSZXR1cm4gQU5EIHdpdGggYSBtYXAgb2YgdGhlIHN1YkdldHRlcnNcbiAgICAgIGlmIChpc0FnZ3JlZ2F0aW9uKSB7XG4gICAgICAgIGlmIChzdWJHZXR0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1YkdldHRlcnNbMF0oZClcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIF8ubWFwKHN1YkdldHRlcnMsIGZ1bmN0aW9uIChnZXRTdWIpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTdWIoZClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zLiRhbmQoZCwgZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICByZXR1cm4gXy5tYXAoc3ViR2V0dGVycywgZnVuY3Rpb24gKGdldFN1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YihkKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ25vIGV4cHJlc3Npb24gZm91bmQgZm9yICcsIG9iailcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuIiwiLyogZXNsaW50IG5vLXByb3RvdHlwZS1idWlsdGluczogMCAqL1xuJ3VzZSBzdHJpY3QnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3NpZ246IGFzc2lnbixcbiAgZmluZDogZmluZCxcbiAgcmVtb3ZlOiByZW1vdmUsXG4gIGlzQXJyYXk6IGlzQXJyYXksXG4gIGlzT2JqZWN0OiBpc09iamVjdCxcbiAgaXNCb29sZWFuOiBpc0Jvb2xlYW4sXG4gIGlzU3RyaW5nOiBpc1N0cmluZyxcbiAgaXNOdW1iZXI6IGlzTnVtYmVyLFxuICBpc0Z1bmN0aW9uOiBpc0Z1bmN0aW9uLFxuICBnZXQ6IGdldCxcbiAgc2V0OiBzZXQsXG4gIG1hcDogbWFwLFxuICBrZXlzOiBrZXlzLFxuICBzb3J0Qnk6IHNvcnRCeSxcbiAgZm9yRWFjaDogZm9yRWFjaCxcbiAgaXNVbmRlZmluZWQ6IGlzVW5kZWZpbmVkLFxuICBwaWNrOiBwaWNrLFxuICB4b3I6IHhvcixcbiAgY2xvbmU6IGNsb25lLFxuICBpc0VxdWFsOiBpc0VxdWFsLFxuICByZXBsYWNlQXJyYXk6IHJlcGxhY2VBcnJheSxcbiAgdW5pcTogdW5pcSxcbiAgZmxhdHRlbjogZmxhdHRlbixcbiAgc29ydDogc29ydCxcbiAgdmFsdWVzOiB2YWx1ZXMsXG4gIHJlY3Vyc2VPYmplY3Q6IHJlY3Vyc2VPYmplY3QsXG59XG5cbmZ1bmN0aW9uIGFzc2lnbihvdXQpIHtcbiAgb3V0ID0gb3V0IHx8IHt9XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFhcmd1bWVudHNbaV0pIHtcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBvdXRba2V5XSA9IGFyZ3VtZW50c1tpXVtrZXldXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gZmluZChhLCBiKSB7XG4gIHJldHVybiBhLmZpbmQoYilcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGEsIGIpIHtcbiAgcmV0dXJuIGEuZmlsdGVyKGZ1bmN0aW9uIChvLCBpKSB7XG4gICAgdmFyIHIgPSBiKG8pXG4gICAgaWYgKHIpIHtcbiAgICAgIGEuc3BsaWNlKGksIDEpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2VcbiAgfSlcbn1cblxuZnVuY3Rpb24gaXNBcnJheShhKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGEpXG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGQpIHtcbiAgcmV0dXJuIHR5cGVvZiBkID09PSAnb2JqZWN0JyAmJiAhaXNBcnJheShkKVxufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdib29sZWFuJ1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ3N0cmluZydcbn1cblxuZnVuY3Rpb24gaXNOdW1iZXIoZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYSkge1xuICByZXR1cm4gdHlwZW9mIGEgPT09ICdmdW5jdGlvbidcbn1cblxuZnVuY3Rpb24gZ2V0KGEsIGIpIHtcbiAgaWYgKGlzQXJyYXkoYikpIHtcbiAgICBiID0gYi5qb2luKCcuJylcbiAgfVxuICByZXR1cm4gYlxuICAgIC5yZXBsYWNlKCdbJywgJy4nKS5yZXBsYWNlKCddJywgJycpXG4gICAgLnNwbGl0KCcuJylcbiAgICAucmVkdWNlKFxuICAgICAgZnVuY3Rpb24gKG9iaiwgcHJvcGVydHkpIHtcbiAgICAgICAgcmV0dXJuIG9ialtwcm9wZXJ0eV1cbiAgICAgIH0sIGFcbiAgICApXG59XG5cbmZ1bmN0aW9uIHNldChvYmosIHByb3AsIHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgcHJvcCA9PT0gJ3N0cmluZycpIHtcbiAgICBwcm9wID0gcHJvcFxuICAgICAgLnJlcGxhY2UoJ1snLCAnLicpLnJlcGxhY2UoJ10nLCAnJylcbiAgICAgIC5zcGxpdCgnLicpXG4gIH1cbiAgaWYgKHByb3AubGVuZ3RoID4gMSkge1xuICAgIHZhciBlID0gcHJvcC5zaGlmdCgpXG4gICAgYXNzaWduKG9ialtlXSA9XG4gICAgICBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqW2VdKSA9PT0gJ1tvYmplY3QgT2JqZWN0XScgPyBvYmpbZV0gOiB7fSxcbiAgICBwcm9wLFxuICAgIHZhbHVlKVxuICB9IGVsc2Uge1xuICAgIG9ialtwcm9wWzBdXSA9IHZhbHVlXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFwKGEsIGIpIHtcbiAgdmFyIG1cbiAgdmFyIGtleVxuICBpZiAoaXNGdW5jdGlvbihiKSkge1xuICAgIGlmIChpc09iamVjdChhKSkge1xuICAgICAgbSA9IFtdXG4gICAgICBmb3IgKGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBtLnB1c2goYihhW2tleV0sIGtleSwgYSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtXG4gICAgfVxuICAgIHJldHVybiBhLm1hcChiKVxuICB9XG4gIGlmIChpc09iamVjdChhKSkge1xuICAgIG0gPSBbXVxuICAgIGZvciAoa2V5IGluIGEpIHtcbiAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbS5wdXNoKGFba2V5XSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1cbiAgfVxuICByZXR1cm4gYS5tYXAoZnVuY3Rpb24gKGFhKSB7XG4gICAgcmV0dXJuIGFhW2JdXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGtleXMob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopXG59XG5cbmZ1bmN0aW9uIHNvcnRCeShhLCBiKSB7XG4gIGlmIChpc0Z1bmN0aW9uKGIpKSB7XG4gICAgcmV0dXJuIGEuc29ydChmdW5jdGlvbiAoYWEsIGJiKSB7XG4gICAgICBpZiAoYihhYSkgPiBiKGJiKSkge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfVxuICAgICAgaWYgKGIoYWEpIDwgYihiYikpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICAvLyBhIG11c3QgYmUgZXF1YWwgdG8gYlxuICAgICAgcmV0dXJuIDBcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2goYSwgYikge1xuICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgaWYgKGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBiKGFba2V5XSwga2V5LCBhKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXNBcnJheShhKSkge1xuICAgIHJldHVybiBhLmZvckVhY2goYilcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhKSB7XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gJ3VuZGVmaW5lZCdcbn1cblxuZnVuY3Rpb24gcGljayhhLCBiKSB7XG4gIHZhciBjID0ge31cbiAgZm9yRWFjaChiLCBmdW5jdGlvbiAoYmIpIHtcbiAgICBpZiAodHlwZW9mIGFbYmJdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY1tiYl0gPSBhW2JiXVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGNcbn1cblxuZnVuY3Rpb24geG9yKGEsIGIpIHtcbiAgdmFyIHVuaXF1ZSA9IFtdXG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKGFhKSB7XG4gICAgaWYgKGIuaW5kZXhPZihhYSkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5pcXVlLnB1c2goYWEpXG4gICAgfVxuICB9KVxuICBmb3JFYWNoKGIsIGZ1bmN0aW9uIChiYikge1xuICAgIGlmIChhLmluZGV4T2YoYmIpID09PSAtMSkge1xuICAgICAgcmV0dXJuIHVuaXF1ZS5wdXNoKGJiKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHVuaXF1ZVxufVxuXG5mdW5jdGlvbiBjbG9uZShhKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGEsIGZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfSkpXG59XG5cbmZ1bmN0aW9uIGlzRXF1YWwoeCwgeSkge1xuICBpZiAoKHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsKSAmJiAodHlwZW9mIHkgPT09ICdvYmplY3QnICYmIHkgIT09IG51bGwpKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHgpLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoeSkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHgpIHtcbiAgICAgIGlmICh5Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmICghaXNFcXVhbCh4W3Byb3BdLCB5W3Byb3BdKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9IGVsc2UgaWYgKHggIT09IHkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiByZXBsYWNlQXJyYXkoYSwgYikge1xuICB2YXIgYWwgPSBhLmxlbmd0aFxuICB2YXIgYmwgPSBiLmxlbmd0aFxuICBpZiAoYWwgPiBibCkge1xuICAgIGEuc3BsaWNlKGJsLCBhbCAtIGJsKVxuICB9IGVsc2UgaWYgKGFsIDwgYmwpIHtcbiAgICBhLnB1c2guYXBwbHkoYSwgbmV3IEFycmF5KGJsIC0gYWwpKVxuICB9XG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgYVtrZXldID0gYltrZXldXG4gIH0pXG4gIHJldHVybiBhXG59XG5cbmZ1bmN0aW9uIHVuaXEoYSkge1xuICB2YXIgc2VlbiA9IG5ldyBTZXQoKVxuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB2YXIgYWxsb3cgPSBmYWxzZVxuICAgIGlmICghc2Vlbi5oYXMoaXRlbSkpIHtcbiAgICAgIHNlZW4uYWRkKGl0ZW0pXG4gICAgICBhbGxvdyA9IHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGFsbG93XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW4oYWEpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWEubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY3VycmVudCA9IGFhW2ldXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBjdXJyZW50Lmxlbmd0aDsgKytqKSB7XG4gICAgICBmbGF0dGVuZWQucHVzaChjdXJyZW50W2pdKVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmxhdHRlbmVkXG59XG5cbmZ1bmN0aW9uIHNvcnQoYXJyKSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRtcCA9IGFycltpXVxuICAgIHZhciBqID0gaVxuICAgIHdoaWxlIChhcnJbaiAtIDFdID4gdG1wKSB7XG4gICAgICBhcnJbal0gPSBhcnJbaiAtIDFdXG4gICAgICAtLWpcbiAgICB9XG4gICAgYXJyW2pdID0gdG1wXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHZhbHVlcyhhKSB7XG4gIHZhciB2YWx1ZXMgPSBbXVxuICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIHZhbHVlcy5wdXNoKGFba2V5XSlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlc1xufVxuXG5mdW5jdGlvbiByZWN1cnNlT2JqZWN0KG9iaiwgY2IpIHtcbiAgX3JlY3Vyc2VPYmplY3Qob2JqLCBbXSlcbiAgcmV0dXJuIG9ialxuICBmdW5jdGlvbiBfcmVjdXJzZU9iamVjdChvYmosIHBhdGgpIHtcbiAgICBmb3IgKHZhciBrIGluIG9iaikgeyAvLyAgZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgIHZhciBuZXdQYXRoID0gY2xvbmUocGF0aClcbiAgICAgIG5ld1BhdGgucHVzaChrKVxuICAgICAgaWYgKHR5cGVvZiBvYmpba10gPT09ICdvYmplY3QnICYmIG9ialtrXSAhPT0gbnVsbCkge1xuICAgICAgICBfcmVjdXJzZU9iamVjdChvYmpba10sIG5ld1BhdGgpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIW9iai5oYXNPd25Qcm9wZXJ0eShrKSkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cbiAgICAgICAgY2Iob2JqW2tdLCBrLCBuZXdQYXRoKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG52YXIgYWdncmVnYXRpb24gPSByZXF1aXJlKCcuL2FnZ3JlZ2F0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoLyogc2VydmljZSAqLykge1xuICByZXR1cm4ge1xuICAgIHBvc3Q6IHBvc3QsXG4gICAgc29ydEJ5S2V5OiBzb3J0QnlLZXksXG4gICAgbGltaXQ6IGxpbWl0LFxuICAgIHNxdWFzaDogc3F1YXNoLFxuICAgIGNoYW5nZTogY2hhbmdlLFxuICAgIGNoYW5nZU1hcDogY2hhbmdlTWFwLFxuICB9XG5cbiAgZnVuY3Rpb24gcG9zdChxdWVyeSwgcGFyZW50LCBjYikge1xuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNiKHF1ZXJ5LCBwYXJlbnQpKVxuICB9XG5cbiAgZnVuY3Rpb24gc29ydEJ5S2V5KHF1ZXJ5LCBwYXJlbnQsIGRlc2MpIHtcbiAgICBxdWVyeS5kYXRhID0gY2xvbmVJZkxvY2tlZChwYXJlbnQpXG4gICAgcXVlcnkuZGF0YSA9IF8uc29ydEJ5KHF1ZXJ5LmRhdGEsIGZ1bmN0aW9uIChkKSB7XG4gICAgICByZXR1cm4gZC5rZXlcbiAgICB9KVxuICAgIGlmIChkZXNjKSB7XG4gICAgICBxdWVyeS5kYXRhLnJldmVyc2UoKVxuICAgIH1cbiAgfVxuXG4gIC8vIExpbWl0IHJlc3VsdHMgdG8gbiwgb3IgZnJvbSBzdGFydCB0byBlbmRcbiAgZnVuY3Rpb24gbGltaXQocXVlcnksIHBhcmVudCwgc3RhcnQsIGVuZCkge1xuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChlbmQpKSB7XG4gICAgICBlbmQgPSBzdGFydCB8fCAwXG4gICAgICBzdGFydCA9IDBcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhcnQgPSBzdGFydCB8fCAwXG4gICAgICBlbmQgPSBlbmQgfHwgcXVlcnkuZGF0YS5sZW5ndGhcbiAgICB9XG4gICAgcXVlcnkuZGF0YSA9IHF1ZXJ5LmRhdGEuc3BsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydClcbiAgfVxuXG4gIC8vIFNxdWFzaCByZXN1bHRzIHRvIG4sIG9yIGZyb20gc3RhcnQgdG8gZW5kXG4gIGZ1bmN0aW9uIHNxdWFzaChxdWVyeSwgcGFyZW50LCBzdGFydCwgZW5kLCBhZ2dPYmosIGxhYmVsKSB7XG4gICAgcXVlcnkuZGF0YSA9IGNsb25lSWZMb2NrZWQocGFyZW50KVxuICAgIHN0YXJ0ID0gc3RhcnQgfHwgMFxuICAgIGVuZCA9IGVuZCB8fCBxdWVyeS5kYXRhLmxlbmd0aFxuICAgIHZhciB0b1NxdWFzaCA9IHF1ZXJ5LmRhdGEuc3BsaWNlKHN0YXJ0LCBlbmQgLSBzdGFydClcbiAgICB2YXIgc3F1YXNoZWQgPSB7XG4gICAgICBrZXk6IGxhYmVsIHx8ICdPdGhlcicsXG4gICAgICB2YWx1ZToge30sXG4gICAgfVxuICAgIF8ucmVjdXJzZU9iamVjdChhZ2dPYmosIGZ1bmN0aW9uICh2YWwsIGtleSwgcGF0aCkge1xuICAgICAgdmFyIGl0ZW1zID0gW11cbiAgICAgIF8uZm9yRWFjaCh0b1NxdWFzaCwgZnVuY3Rpb24gKHJlY29yZCkge1xuICAgICAgICBpdGVtcy5wdXNoKF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCkpXG4gICAgICB9KVxuICAgICAgXy5zZXQoc3F1YXNoZWQudmFsdWUsIHBhdGgsIGFnZ3JlZ2F0aW9uLmFnZ3JlZ2F0b3JzW3ZhbF0oaXRlbXMpKVxuICAgIH0pXG4gICAgcXVlcnkuZGF0YS5zcGxpY2Uoc3RhcnQsIDAsIHNxdWFzaGVkKVxuICB9XG5cbiAgZnVuY3Rpb24gY2hhbmdlKHF1ZXJ5LCBwYXJlbnQsIHN0YXJ0LCBlbmQsIGFnZ09iaikge1xuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBzdGFydCA9IHN0YXJ0IHx8IDBcbiAgICBlbmQgPSBlbmQgfHwgcXVlcnkuZGF0YS5sZW5ndGhcbiAgICB2YXIgb2JqID0ge1xuICAgICAga2V5OiBbcXVlcnkuZGF0YVtzdGFydF0ua2V5LCBxdWVyeS5kYXRhW2VuZF0ua2V5XSxcbiAgICAgIHZhbHVlOiB7fSxcbiAgICB9XG4gICAgXy5yZWN1cnNlT2JqZWN0KGFnZ09iaiwgZnVuY3Rpb24gKHZhbCwga2V5LCBwYXRoKSB7XG4gICAgICB2YXIgY2hhbmdlUGF0aCA9IF8uY2xvbmUocGF0aClcbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIF8uc2V0KG9iai52YWx1ZSwgY2hhbmdlUGF0aCwgXy5nZXQocXVlcnkuZGF0YVtlbmRdLnZhbHVlLCBwYXRoKSAtIF8uZ2V0KHF1ZXJ5LmRhdGFbc3RhcnRdLnZhbHVlLCBwYXRoKSlcbiAgICB9KVxuICAgIHF1ZXJ5LmRhdGEgPSBvYmpcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZU1hcChxdWVyeSwgcGFyZW50LCBhZ2dPYmosIGRlZmF1bHROdWxsKSB7XG4gICAgZGVmYXVsdE51bGwgPSBfLmlzVW5kZWZpbmVkKGRlZmF1bHROdWxsKSA/IDAgOiBkZWZhdWx0TnVsbFxuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBfLnJlY3Vyc2VPYmplY3QoYWdnT2JqLCBmdW5jdGlvbiAodmFsLCBrZXksIHBhdGgpIHtcbiAgICAgIHZhciBjaGFuZ2VQYXRoID0gXy5jbG9uZShwYXRoKVxuICAgICAgdmFyIGZyb21TdGFydFBhdGggPSBfLmNsb25lKHBhdGgpXG4gICAgICB2YXIgZnJvbUVuZFBhdGggPSBfLmNsb25lKHBhdGgpXG5cbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGZyb21TdGFydFBhdGgucG9wKClcbiAgICAgIGZyb21FbmRQYXRoLnBvcCgpXG5cbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIGZyb21TdGFydFBhdGgucHVzaChrZXkgKyAnQ2hhbmdlRnJvbVN0YXJ0JylcbiAgICAgIGZyb21FbmRQYXRoLnB1c2goa2V5ICsgJ0NoYW5nZUZyb21FbmQnKVxuXG4gICAgICB2YXIgc3RhcnQgPSBfLmdldChxdWVyeS5kYXRhWzBdLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbClcbiAgICAgIHZhciBlbmQgPSBfLmdldChxdWVyeS5kYXRhW3F1ZXJ5LmRhdGEubGVuZ3RoIC0gMV0udmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKVxuXG4gICAgICBfLmZvckVhY2gocXVlcnkuZGF0YSwgZnVuY3Rpb24gKHJlY29yZCwgaSkge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSBxdWVyeS5kYXRhW2kgLSAxXSB8fCBxdWVyeS5kYXRhWzBdXG4gICAgICAgIF8uc2V0KHF1ZXJ5LmRhdGFbaV0udmFsdWUsIGNoYW5nZVBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gKHByZXZpb3VzID8gXy5nZXQocHJldmlvdXMudmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKSA6IGRlZmF1bHROdWxsKSlcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbVN0YXJ0UGF0aCwgXy5nZXQocmVjb3JkLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbCkgLSBzdGFydClcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbUVuZFBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gZW5kKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNsb25lSWZMb2NrZWQocGFyZW50KSB7XG4gIHJldHVybiBwYXJlbnQubG9ja2VkID8gXy5jbG9uZShwYXJlbnQuZGF0YSkgOiBwYXJlbnQuZGF0YVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHZhciByZWR1Y3Rpb2Z5ID0gcmVxdWlyZSgnLi9yZWR1Y3Rpb2Z5Jykoc2VydmljZSlcbiAgdmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuL2ZpbHRlcnMnKShzZXJ2aWNlKVxuICB2YXIgcG9zdEFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9wb3N0QWdncmVnYXRpb24nKShzZXJ2aWNlKVxuXG4gIHZhciBwb3N0QWdncmVnYXRpb25NZXRob2RzID0gXy5rZXlzKHBvc3RBZ2dyZWdhdGlvbilcblxuICByZXR1cm4gZnVuY3Rpb24gZG9RdWVyeShxdWVyeU9iaikge1xuICAgIHZhciBxdWVyeUhhc2ggPSBKU09OLnN0cmluZ2lmeShxdWVyeU9iailcblxuICAgIC8vIEF0dGVtcHQgdG8gcmV1c2UgYW4gZXhhY3QgY29weSBvZiB0aGlzIHF1ZXJ5IHRoYXQgaXMgcHJlc2VudCBlbHNld2hlcmVcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlcnZpY2UuY29sdW1ucy5sZW5ndGg7IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBzZXJ2aWNlLmNvbHVtbnNbaV0ucXVlcmllcy5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoc2VydmljZS5jb2x1bW5zW2ldLnF1ZXJpZXNbal0uaGFzaCA9PT0gcXVlcnlIYXNoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1sb29wLWZ1bmNcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHJlc29sdmUoc2VydmljZS5jb2x1bW5zW2ldLnF1ZXJpZXNbal0pXG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHF1ZXJ5ID0ge1xuICAgICAgLy8gT3JpZ2luYWwgcXVlcnkgcGFzc2VkIGluIHRvIHF1ZXJ5IG1ldGhvZFxuICAgICAgb3JpZ2luYWw6IHF1ZXJ5T2JqLFxuICAgICAgaGFzaDogcXVlcnlIYXNoLFxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgcXVlcnlPYmpcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbCkpIHtcbiAgICAgIHF1ZXJ5Lm9yaWdpbmFsID0ge31cbiAgICB9XG4gICAgLy8gRGVmYXVsdCBzZWxlY3RcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbC5zZWxlY3QpKSB7XG4gICAgICBxdWVyeS5vcmlnaW5hbC5zZWxlY3QgPSB7XG4gICAgICAgICRjb3VudDogdHJ1ZSxcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gRGVmYXVsdCB0byBncm91cEFsbFxuICAgIHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkgPSBxdWVyeS5vcmlnaW5hbC5ncm91cEJ5IHx8IHRydWVcblxuICAgIC8vIEF0dGFjaCB0aGUgcXVlcnkgYXBpIHRvIHRoZSBxdWVyeSBvYmplY3RcbiAgICBxdWVyeSA9IG5ld1F1ZXJ5T2JqKHF1ZXJ5KVxuXG4gICAgcmV0dXJuIGNyZWF0ZUNvbHVtbihxdWVyeSlcbiAgICAgIC50aGVuKG1ha2VDcm9zc2ZpbHRlckdyb3VwKVxuICAgICAgLnRoZW4oYnVpbGRSZXF1aXJlZENvbHVtbnMpXG4gICAgICAudGhlbihzZXR1cERhdGFMaXN0ZW5lcnMpXG4gICAgICAudGhlbihhcHBseVF1ZXJ5KVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29sdW1uKHF1ZXJ5KSB7XG4gICAgICAvLyBFbnN1cmUgY29sdW1uIGlzIGNyZWF0ZWRcbiAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgIGtleTogcXVlcnkub3JpZ2luYWwuZ3JvdXBCeSxcbiAgICAgICAgdHlwZTogXy5pc1VuZGVmaW5lZChxdWVyeS50eXBlKSA/IG51bGwgOiBxdWVyeS50eXBlLFxuICAgICAgICBhcnJheTogQm9vbGVhbihxdWVyeS5hcnJheSksXG4gICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEF0dGFjaCB0aGUgY29sdW1uIHRvIHRoZSBxdWVyeVxuICAgICAgICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkpXG4gICAgICAgICAgcXVlcnkuY29sdW1uID0gY29sdW1uXG4gICAgICAgICAgY29sdW1uLnF1ZXJpZXMucHVzaChxdWVyeSlcbiAgICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5LmNsZWFyKClcbiAgICAgICAgICB9KVxuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VDcm9zc2ZpbHRlckdyb3VwKHF1ZXJ5KSB7XG4gICAgICAvLyBDcmVhdGUgdGhlIGdyb3VwaW5nIG9uIHRoZSBjb2x1bW5zIGRpbWVuc2lvblxuICAgICAgLy8gVXNpbmcgUHJvbWlzZSBSZXNvbHZlIGFsbG93cyBzdXBwb3J0IGZvciBjcm9zc2ZpbHRlciBhc3luY1xuICAgICAgLy8gVE9ETyBjaGVjayBpZiBxdWVyeSBhbHJlYWR5IGV4aXN0cywgYW5kIHVzZSB0aGUgc2FtZSBiYXNlIHF1ZXJ5IC8vIGlmIHBvc3NpYmxlXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHF1ZXJ5LmNvbHVtbi5kaW1lbnNpb24uZ3JvdXAoKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGcpIHtcbiAgICAgICAgICBxdWVyeS5ncm91cCA9IGdcbiAgICAgICAgICByZXR1cm4gcXVlcnlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZFJlcXVpcmVkQ29sdW1ucyhxdWVyeSkge1xuICAgICAgdmFyIHJlcXVpcmVkQ29sdW1ucyA9IGZpbHRlcnMuc2NhbkZvckR5bmFtaWNGaWx0ZXJzKHF1ZXJ5Lm9yaWdpbmFsKVxuICAgICAgLy8gV2UgbmVlZCB0byBzY2FuIHRoZSBncm91cCBmb3IgYW55IGZpbHRlcnMgdGhhdCB3b3VsZCByZXF1aXJlXG4gICAgICAvLyB0aGUgZ3JvdXAgdG8gYmUgcmVidWlsdCB3aGVuIGRhdGEgaXMgYWRkZWQgb3IgcmVtb3ZlZCBpbiBhbnkgd2F5LlxuICAgICAgaWYgKHJlcXVpcmVkQ29sdW1ucy5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHJlcXVpcmVkQ29sdW1ucywgZnVuY3Rpb24gKGNvbHVtbktleSkge1xuICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAgICBrZXk6IGNvbHVtbktleSxcbiAgICAgICAgICAgIGR5bmFtaWNSZWZlcmVuY2U6IHF1ZXJ5Lmdyb3VwLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0pKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICAgIH0pXG4gICAgICB9XG4gICAgICByZXR1cm4gcXVlcnlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXR1cERhdGFMaXN0ZW5lcnMocXVlcnkpIHtcbiAgICAgIC8vIEhlcmUsIHdlIGNyZWF0ZSBhIGxpc3RlbmVyIHRvIHJlY3JlYXRlIGFuZCBhcHBseSB0aGUgcmVkdWNlciB0b1xuICAgICAgLy8gdGhlIGdyb3VwIGFueXRpbWUgdW5kZXJseWluZyBkYXRhIGNoYW5nZXNcbiAgICAgIHZhciBzdG9wRGF0YUxpc3RlbiA9IHNlcnZpY2Uub25EYXRhQ2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGFwcGx5UXVlcnkocXVlcnkpXG4gICAgICB9KVxuICAgICAgcXVlcnkucmVtb3ZlTGlzdGVuZXJzLnB1c2goc3RvcERhdGFMaXN0ZW4pXG5cbiAgICAgIC8vIFRoaXMgaXMgYSBzaW1pbGFyIGxpc3RlbmVyIGZvciBmaWx0ZXJpbmcgd2hpY2ggd2lsbCAoaWYgbmVlZGVkKVxuICAgICAgLy8gcnVuIGFueSBwb3N0IGFnZ3JlZ2F0aW9ucyBvbiB0aGUgZGF0YSBhZnRlciBlYWNoIGZpbHRlciBhY3Rpb25cbiAgICAgIHZhciBzdG9wRmlsdGVyTGlzdGVuID0gc2VydmljZS5vbkZpbHRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBwb3N0QWdncmVnYXRlKHF1ZXJ5KVxuICAgICAgfSlcbiAgICAgIHF1ZXJ5LnJlbW92ZUxpc3RlbmVycy5wdXNoKHN0b3BGaWx0ZXJMaXN0ZW4pXG5cbiAgICAgIHJldHVybiBxdWVyeVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5UXVlcnkocXVlcnkpIHtcbiAgICAgIHJldHVybiBidWlsZFJlZHVjZXIocXVlcnkpXG4gICAgICAgIC50aGVuKGFwcGx5UmVkdWNlcilcbiAgICAgICAgLnRoZW4oYXR0YWNoRGF0YSlcbiAgICAgICAgLnRoZW4ocG9zdEFnZ3JlZ2F0ZSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZFJlZHVjZXIocXVlcnkpIHtcbiAgICAgIHJldHVybiByZWR1Y3Rpb2Z5KHF1ZXJ5Lm9yaWdpbmFsKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAocmVkdWNlcikge1xuICAgICAgICAgIHF1ZXJ5LnJlZHVjZXIgPSByZWR1Y2VyXG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXBwbHlSZWR1Y2VyKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHF1ZXJ5LnJlZHVjZXIocXVlcnkuZ3JvdXApKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXR0YWNoRGF0YShxdWVyeSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeS5ncm91cC5hbGwoKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICBxdWVyeS5kYXRhID0gZGF0YVxuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBvc3RBZ2dyZWdhdGUocXVlcnkpIHtcbiAgICAgIGlmIChxdWVyeS5wb3N0QWdncmVnYXRpb25zLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgLy8gSWYgdGhlIHF1ZXJ5IGlzIHVzZWQgYnkgMisgcG9zdCBhZ2dyZWdhdGlvbnMsIHdlIG5lZWQgdG8gbG9ja1xuICAgICAgICAvLyBpdCBhZ2FpbnN0IGdldHRpbmcgbXV0YXRlZCBieSB0aGUgcG9zdC1hZ2dyZWdhdGlvbnNcbiAgICAgICAgcXVlcnkubG9ja2VkID0gdHJ1ZVxuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHF1ZXJ5LnBvc3RBZ2dyZWdhdGlvbnMsIGZ1bmN0aW9uIChwb3N0KSB7XG4gICAgICAgIHJldHVybiBwb3N0KClcbiAgICAgIH0pKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV3UXVlcnlPYmoocSwgcGFyZW50KSB7XG4gICAgICB2YXIgbG9ja2VkID0gZmFsc2VcbiAgICAgIGlmICghcGFyZW50KSB7XG4gICAgICAgIHBhcmVudCA9IHFcbiAgICAgICAgcSA9IHt9XG4gICAgICAgIGxvY2tlZCA9IHRydWVcbiAgICAgIH1cblxuICAgICAgLy8gQXNzaWduIHRoZSByZWd1bGFyIHF1ZXJ5IHByb3BlcnRpZXNcbiAgICAgIF8uYXNzaWduKHEsIHtcbiAgICAgICAgLy8gVGhlIFVuaXZlcnNlIGZvciBjb250aW51b3VzIHByb21pc2UgY2hhaW5pbmdcbiAgICAgICAgdW5pdmVyc2U6IHNlcnZpY2UsXG4gICAgICAgIC8vIENyb3NzZmlsdGVyIGluc3RhbmNlXG4gICAgICAgIGNyb3NzZmlsdGVyOiBzZXJ2aWNlLmNmLFxuXG4gICAgICAgIC8vIHBhcmVudCBJbmZvcm1hdGlvblxuICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgY29sdW1uOiBwYXJlbnQuY29sdW1uLFxuICAgICAgICBkaW1lbnNpb246IHBhcmVudC5kaW1lbnNpb24sXG4gICAgICAgIGdyb3VwOiBwYXJlbnQuZ3JvdXAsXG4gICAgICAgIHJlZHVjZXI6IHBhcmVudC5yZWR1Y2VyLFxuICAgICAgICBvcmlnaW5hbDogcGFyZW50Lm9yaWdpbmFsLFxuICAgICAgICBoYXNoOiBwYXJlbnQuaGFzaCxcblxuICAgICAgICAvLyBJdCdzIG93biByZW1vdmVMaXN0ZW5lcnNcbiAgICAgICAgcmVtb3ZlTGlzdGVuZXJzOiBbXSxcblxuICAgICAgICAvLyBJdCdzIG93biBwb3N0QWdncmVnYXRpb25zXG4gICAgICAgIHBvc3RBZ2dyZWdhdGlvbnM6IFtdLFxuXG4gICAgICAgIC8vIERhdGEgbWV0aG9kXG4gICAgICAgIGxvY2tlZDogbG9ja2VkLFxuICAgICAgICBsb2NrOiBsb2NrLFxuICAgICAgICB1bmxvY2s6IHVubG9jayxcbiAgICAgICAgLy8gRGlzcG9zYWwgbWV0aG9kXG4gICAgICAgIGNsZWFyOiBjbGVhclF1ZXJ5LFxuICAgICAgfSlcblxuICAgICAgXy5mb3JFYWNoKHBvc3RBZ2dyZWdhdGlvbk1ldGhvZHMsIGZ1bmN0aW9uIChtZXRob2QpIHtcbiAgICAgICAgcVttZXRob2RdID0gcG9zdEFnZ3JlZ2F0ZU1ldGhvZFdyYXAocG9zdEFnZ3JlZ2F0aW9uW21ldGhvZF0pXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gcVxuXG4gICAgICBmdW5jdGlvbiBsb2NrKHNldCkge1xuICAgICAgICBpZiAoIV8uaXNVbmRlZmluZWQoc2V0KSkge1xuICAgICAgICAgIHEubG9ja2VkID0gQm9vbGVhbihzZXQpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgcS5sb2NrZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHVubG9jaygpIHtcbiAgICAgICAgcS5sb2NrZWQgPSBmYWxzZVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBjbGVhclF1ZXJ5KCkge1xuICAgICAgICBfLmZvckVhY2gocS5yZW1vdmVMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsKSB7XG4gICAgICAgICAgbCgpXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUocS5ncm91cC5kaXNwb3NlKCkpXG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBxLmNvbHVtbi5xdWVyaWVzLnNwbGljZShxLmNvbHVtbi5xdWVyaWVzLmluZGV4T2YocSksIDEpXG4gICAgICAgICAgICAvLyBBdXRvbWF0aWNhbGx5IHJlY3ljbGUgdGhlIGNvbHVtbiBpZiB0aGVyZSBhcmUgbm8gcXVlcmllcyBhY3RpdmUgb24gaXRcbiAgICAgICAgICAgIGlmICghcS5jb2x1bW4ucXVlcmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY2xlYXIocS5jb2x1bW4ua2V5KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlTWV0aG9kV3JhcChwb3N0TWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgdmFyIHN1YiA9IHt9XG4gICAgICAgICAgbmV3UXVlcnlPYmooc3ViLCBxKVxuICAgICAgICAgIGFyZ3MudW5zaGlmdChzdWIsIHEpXG5cbiAgICAgICAgICBxLnBvc3RBZ2dyZWdhdGlvbnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocG9zdE1ldGhvZC5hcHBseShudWxsLCBhcmdzKSlcbiAgICAgICAgICAgICAgLnRoZW4ocG9zdEFnZ3JlZ2F0ZUNoaWxkcmVuKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHBvc3RNZXRob2QuYXBwbHkobnVsbCwgYXJncykpXG4gICAgICAgICAgICAudGhlbihwb3N0QWdncmVnYXRlQ2hpbGRyZW4pXG5cbiAgICAgICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlQ2hpbGRyZW4oKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9zdEFnZ3JlZ2F0ZShzdWIpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLy8gdmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpIC8vIF8gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2hvcnRoYW5kTGFiZWxzOiB7XG4gICAgJGNvdW50OiAnY291bnQnLFxuICAgICRzdW06ICdzdW0nLFxuICAgICRhdmc6ICdhdmcnLFxuICAgICRtaW46ICdtaW4nLFxuICAgICRtYXg6ICdtYXgnLFxuICAgICRtZWQ6ICdtZWQnLFxuICAgICRzdW1TcTogJ3N1bVNxJyxcbiAgICAkc3RkOiAnc3RkJyxcbiAgfSxcbiAgYWdncmVnYXRvcnM6IHtcbiAgICAkY291bnQ6ICRjb3VudCxcbiAgICAkc3VtOiAkc3VtLFxuICAgICRhdmc6ICRhdmcsXG4gICAgJG1pbjogJG1pbixcbiAgICAkbWF4OiAkbWF4LFxuICAgICRtZWQ6ICRtZWQsXG4gICAgJHN1bVNxOiAkc3VtU3EsXG4gICAgJHN0ZDogJHN0ZCxcbiAgICAkdmFsdWVMaXN0OiAkdmFsdWVMaXN0LFxuICAgICRkYXRhTGlzdDogJGRhdGFMaXN0LFxuICB9LFxufVxuXG4vLyBBZ2dyZWdhdG9yc1xuXG5mdW5jdGlvbiAkY291bnQocmVkdWNlci8qICwgdmFsdWUgKi8pIHtcbiAgcmV0dXJuIHJlZHVjZXIuY291bnQodHJ1ZSlcbn1cblxuZnVuY3Rpb24gJHN1bShyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdW0odmFsdWUpXG59XG5cbmZ1bmN0aW9uICRhdmcocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuYXZnKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkbWluKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLm1pbih2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJG1heChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5tYXgodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRtZWQocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIubWVkaWFuKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkc3VtU3EocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuc3VtT2ZTcSh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJHN0ZChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdGQodmFsdWUpXG59XG5cbmZ1bmN0aW9uICR2YWx1ZUxpc3QocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIudmFsdWVMaXN0KHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkZGF0YUxpc3QocmVkdWNlci8qICwgdmFsdWUgKi8pIHtcbiAgcmV0dXJuIHJlZHVjZXIuZGF0YUxpc3QodHJ1ZSlcbn1cblxuLy8gVE9ETyBoaXN0b2dyYW1zXG4vLyBUT0RPIGV4Y2VwdGlvbnNcbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgcmVkdWN0aW8gPSByZXF1aXJlKCdyZWR1Y3RpbycpXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxudmFyIHJBZ2dyZWdhdG9ycyA9IHJlcXVpcmUoJy4vcmVkdWN0aW9BZ2dyZWdhdG9ycycpXG4vLyB2YXIgZXhwcmVzc2lvbnMgPSByZXF1aXJlKCcuL2V4cHJlc3Npb25zJykgIC8vIGV4cG9yZXNzaW9uIGlzIGRlZmluZWQgYnV0IG5ldmVyIHVzZWRcbnZhciBhZ2dyZWdhdGlvbiA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHZhciBmaWx0ZXJzID0gcmVxdWlyZSgnLi9maWx0ZXJzJykoc2VydmljZSlcblxuICByZXR1cm4gZnVuY3Rpb24gcmVkdWN0aW9meShxdWVyeSkge1xuICAgIHZhciByZWR1Y2VyID0gcmVkdWN0aW8oKVxuICAgIC8vIHZhciBncm91cEJ5ID0gcXVlcnkuZ3JvdXBCeSAvLyBncm91cEJ5IGlzIGRlZmluZWQgYnV0IG5ldmVyIHVzZWRcbiAgICBhZ2dyZWdhdGVPck5lc3QocmVkdWNlciwgcXVlcnkuc2VsZWN0KVxuXG4gICAgaWYgKHF1ZXJ5LmZpbHRlcikge1xuICAgICAgdmFyIGZpbHRlckZ1bmN0aW9uID0gZmlsdGVycy5tYWtlRnVuY3Rpb24ocXVlcnkuZmlsdGVyKVxuICAgICAgaWYgKGZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZHVjZXIuZmlsdGVyKGZpbHRlckZ1bmN0aW9uKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVkdWNlcilcblxuICAgIC8vIFRoaXMgZnVuY3Rpb24gcmVjdXJzaXZlbHkgZmluZCB0aGUgZmlyc3QgbGV2ZWwgb2YgcmVkdWN0aW8gbWV0aG9kcyBpblxuICAgIC8vIGVhY2ggb2JqZWN0IGFuZCBhZGRzIHRoYXQgcmVkdWN0aW9uIG1ldGhvZCB0byByZWR1Y3Rpb1xuICAgIGZ1bmN0aW9uIGFnZ3JlZ2F0ZU9yTmVzdChyZWR1Y2VyLCBzZWxlY3RzKSB7XG4gICAgICAvLyBTb3J0IHNvIG5lc3RlZCB2YWx1ZXMgYXJlIGNhbGN1bGF0ZWQgbGFzdCBieSByZWR1Y3RpbydzIC52YWx1ZSBtZXRob2RcbiAgICAgIHZhciBzb3J0ZWRTZWxlY3RLZXlWYWx1ZSA9IF8uc29ydEJ5KFxuICAgICAgICBfLm1hcChzZWxlY3RzLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICB2YWx1ZTogdmFsLFxuICAgICAgICAgIH1cbiAgICAgICAgfSksXG4gICAgICAgIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgaWYgKHJBZ2dyZWdhdG9ycy5hZ2dyZWdhdG9yc1tzLmtleV0pIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAxXG4gICAgICAgIH0pXG5cbiAgICAgIC8vIGRpdmUgaW50byBlYWNoIGtleS92YWx1ZVxuICAgICAgcmV0dXJuIF8uZm9yRWFjaChzb3J0ZWRTZWxlY3RLZXlWYWx1ZSwgZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgLy8gRm91bmQgYSBSZWR1Y3RpbyBBZ2dyZWdhdGlvblxuICAgICAgICBpZiAockFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XSkge1xuICAgICAgICAgIC8vIEJ1aWxkIHRoZSB2YWx1ZUFjY2Vzc29yRnVuY3Rpb25cbiAgICAgICAgICB2YXIgYWNjZXNzb3IgPSBhZ2dyZWdhdGlvbi5tYWtlVmFsdWVBY2Nlc3NvcihzLnZhbHVlKVxuICAgICAgICAgIC8vIEFkZCB0aGUgcmVkdWNlciB3aXRoIHRoZSBWYWx1ZUFjY2Vzc29yRnVuY3Rpb24gdG8gdGhlIHJlZHVjZXJcbiAgICAgICAgICByZWR1Y2VyID0gckFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XShyZWR1Y2VyLCBhY2Nlc3NvcilcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvdW5kIGEgdG9wIGxldmVsIGtleSB2YWx1ZSB0aGF0IGlzIG5vdCBhbiBhZ2dyZWdhdGlvbiBvciBhXG4gICAgICAgIC8vIG5lc3RlZCBvYmplY3QuIFRoaXMgaXMgdW5hY2NlcHRhYmxlLlxuICAgICAgICBpZiAoIV8uaXNPYmplY3Qocy52YWx1ZSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdOZXN0ZWQgc2VsZWN0cyBtdXN0IGJlIGFuIG9iamVjdCcsIHMua2V5KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQncyBhbm90aGVyIG5lc3RlZCBvYmplY3QsIHNvIGp1c3QgcmVwZWF0IHRoaXMgcHJvY2VzcyBvbiBpdFxuICAgICAgICBhZ2dyZWdhdGVPck5lc3QocmVkdWNlci52YWx1ZShzLmtleSksIHMudmFsdWUpXG4gICAgICB9KVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaXZlcnNlXG5cbmZ1bmN0aW9uIHVuaXZlcnNlKGRhdGEsIG9wdGlvbnMpIHtcbiAgdmFyIHNlcnZpY2UgPSB7XG4gICAgb3B0aW9uczogXy5hc3NpZ24oe30sIG9wdGlvbnMpLFxuICAgIGNvbHVtbnM6IFtdLFxuICAgIGZpbHRlcnM6IHt9LFxuICAgIGRhdGFMaXN0ZW5lcnM6IFtdLFxuICAgIGZpbHRlckxpc3RlbmVyczogW10sXG4gIH1cblxuICB2YXIgY2YgPSByZXF1aXJlKCcuL2Nyb3NzZmlsdGVyJykoc2VydmljZSlcbiAgdmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuL2ZpbHRlcnMnKShzZXJ2aWNlKVxuXG4gIGRhdGEgPSBjZi5nZW5lcmF0ZUNvbHVtbnMoZGF0YSlcblxuICByZXR1cm4gY2YuYnVpbGQoZGF0YSlcbiAgICAudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgc2VydmljZS5jZiA9IGRhdGFcbiAgICAgIHJldHVybiBfLmFzc2lnbihzZXJ2aWNlLCB7XG4gICAgICAgIGFkZDogY2YuYWRkLFxuICAgICAgICByZW1vdmU6IGNmLnJlbW92ZSxcbiAgICAgICAgY29sdW1uOiByZXF1aXJlKCcuL2NvbHVtbicpKHNlcnZpY2UpLFxuICAgICAgICBxdWVyeTogcmVxdWlyZSgnLi9xdWVyeScpKHNlcnZpY2UpLFxuICAgICAgICBmaWx0ZXI6IGZpbHRlcnMuZmlsdGVyLFxuICAgICAgICBmaWx0ZXJBbGw6IGZpbHRlcnMuZmlsdGVyQWxsLFxuICAgICAgICBhcHBseUZpbHRlcnM6IGZpbHRlcnMuYXBwbHlGaWx0ZXJzLFxuICAgICAgICBjbGVhcjogcmVxdWlyZSgnLi9jbGVhcicpKHNlcnZpY2UpLFxuICAgICAgICBkZXN0cm95OiByZXF1aXJlKCcuL2Rlc3Ryb3knKShzZXJ2aWNlKSxcbiAgICAgICAgb25EYXRhQ2hhbmdlOiBvbkRhdGFDaGFuZ2UsXG4gICAgICAgIG9uRmlsdGVyOiBvbkZpbHRlcixcbiAgICAgIH0pXG4gICAgfSlcblxuICBmdW5jdGlvbiBvbkRhdGFDaGFuZ2UoY2IpIHtcbiAgICBzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMucHVzaChjYilcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgc2VydmljZS5kYXRhTGlzdGVuZXJzLnNwbGljZShzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMuaW5kZXhPZihjYiksIDEpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gb25GaWx0ZXIoY2IpIHtcbiAgICBzZXJ2aWNlLmZpbHRlckxpc3RlbmVycy5wdXNoKGNiKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBzZXJ2aWNlLmZpbHRlckxpc3RlbmVycy5zcGxpY2Uoc2VydmljZS5maWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZihjYiksIDEpXG4gICAgfVxuICB9XG59XG4iXX0=
