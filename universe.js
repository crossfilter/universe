(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.universe = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(exports){
crossfilter.version = "2.0.0-alpha.03";
function crossfilter_identity(d) {
  return d;
}
crossfilter.permute = permute;

function permute(array, index, deep) {
  for (var i = 0, n = index.length, copy = deep ? JSON.parse(JSON.stringify(array)) : new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}
var bisect = crossfilter.bisect = bisect_by(crossfilter_identity);

bisect.by = bisect_by;

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
var heap = crossfilter.heap = heap_by(crossfilter_identity);

heap.by = heap_by;

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
var heapselect = crossfilter.heapselect = heapselect_by(crossfilter_identity);

heapselect.by = heapselect_by;

function heapselect_by(f) {
  var heap = heap_by(f);

  // Returns a new array containing the top k elements in the array a[lo:hi].
  // The returned array is not sorted, but maintains the heap property. If k is
  // greater than hi - lo, then fewer than k elements will be returned. The
  // order of elements in a is unchanged by this operation.
  function heapselect(a, lo, hi, k) {
    var queue = new Array(k = Math.min(hi - lo, k)),
        min,
        i,
        x,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (x = f(d = a[lo]) > min) {
          queue[0] = d;
          min = f(heap(queue, 0, k)[0]);
        }
      } while (++lo < hi);
    }

    return queue;
  }

  return heapselect;
}
var insertionsort = crossfilter.insertionsort = insertionsort_by(crossfilter_identity);

insertionsort.by = insertionsort_by;

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
// Algorithm designed by Vladimir Yaroslavskiy.
// Implementation based on the Dart project; see lib/dart/LICENSE for details.

var quicksort = crossfilter.quicksort = quicksort_by(crossfilter_identity);

quicksort.by = quicksort_by;

function quicksort_by(f) {
  var insertionsort = insertionsort_by(f);

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
            while (true) {
              var greatValue = f(a[great]);
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
var crossfilter_array8 = crossfilter_arrayUntyped,
    crossfilter_array16 = crossfilter_arrayUntyped,
    crossfilter_array32 = crossfilter_arrayUntyped,
    crossfilter_arrayLengthen = crossfilter_arrayLengthenUntyped,
    crossfilter_arrayWiden = crossfilter_arrayWidenUntyped;

if (typeof Uint8Array !== "undefined") {
  crossfilter_array8 = function(n) { return new Uint8Array(n); };
  crossfilter_array16 = function(n) { return new Uint16Array(n); };
  crossfilter_array32 = function(n) { return new Uint32Array(n); };

  crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  crossfilter_arrayWiden = function(array, width) {
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
function crossfilter_null() {
  return null;
}
function crossfilter_zero() {
  return 0;
}
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
exports.crossfilter = crossfilter;

function crossfilter() {
  var crossfilter = {
    add: add,
    remove: removeData,
    dimension: dimension,
    groupAll: groupAll,
    size: size,
    all: all,
    onChange: onChange,
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      filters, // 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = [], // when data is removed
      callbacks = [];

  filters = new crossfilter_bitarray(0);

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

  // Removes all records that match the current filters.
  function removeData() {
    var newIndex = crossfilter_index(n, n),
        removed = [];
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) newIndex[i] = j++;
      else removed.push(i);
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(-1, -1, [], removed, true); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) {
        if (i !== j) filters.copy(j, i), data[j] = data[i];
        ++j;
      }
    }

    data.length = n = j;
    filters.truncate(j);
    triggerOnChange('dataRemoved');
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value, iterable) {
    var dimension = {
      filter: filter,
      filterExact: filterExact,
      filterRange: filterRange,
      filterFunction: filterFunction,
      filterAll: filterAll,
      top: top,
      bottom: bottom,
      group: group,
      groupAll: groupAll,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var one, // lowest unset bit as mask, e.g., 00001000
        zero, // inverted one, e.g., 11110111
        offset, // offset into the filters arrays
        values, // sorted, cached array
        index, // value rank ↦ object id
        oldValues, // temporary array storing previously-added values
        oldIndex, // temporary array storing previously-added index
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        iterablesIndexCount,
        newIterablesIndexCount,
        iterablesIndexFilterStatus,
        newIterablesIndexFilterStatus,
        oldIterablesIndexFilterStatus,
        iterablesEmptyRows,
        sort = quicksort_by(function(i) { return newValues[i]; }),
        refilter = crossfilter_filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0,
        t = 0;

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

        for (i = 0; i < newData.length; i++) {
          for(j = 0, k = value(newData[i]); j < k.length; j++) {
            t++;
          }
        }

        newValues = [];
        newIterablesIndexCount = crossfilter_range(newData.length);
        newIterablesIndexFilterStatus = crossfilter_index(t,1);
        iterablesEmptyRows = [];
        var unsortedIndex = crossfilter_range(t);

        for (l = 0, i = 0; i < newData.length; i++) {
          k = value(newData[i])
          //
          if(!k.length){
            newIterablesIndexCount[i] = 0;
            iterablesEmptyRows.push(i);
            continue;
          }
          newIterablesIndexCount[i] = k.length
          for (j = 0; j < k.length; j++) {
            newValues.push(k[j]);
            unsortedIndex[l] = i;
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
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) {
            filters[offset][newIndex[i] + n0] |= one;
            if(iterable) newIterablesIndexFilterStatus[i] = 1;
          }
        }
      } else {
        for (i = 0; i < lo1; ++i) { 
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
        }
        for (i = hi1; i < n1; ++i) {
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
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



      oldValues = values,
        oldIndex = index,
        oldIterablesIndexFilterStatus = iterablesIndexFilterStatus
        i0 = 0,
        i1 = 0;

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
        iterablesIndexCount = crossfilter_arrayLengthen(iterablesIndexCount, n);
        for(var j=0; j+oldiiclength < n; j++) {
          iterablesIndexCount[j+oldiiclength] = newIterablesIndexCount[j];
        }
      }

      // Merge the old and new sorted values, and old and new index.
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
          index[i] = newIndex[i1++] + (iterable ? old_n0 : n0);
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
        index[i] = newIndex[i1] + (iterable ? old_n0 : n0);
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
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (!filters.zero(k = index[i])) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[k];
          ++j;
        }
      }
      values.length = j;
      while (j < n) index[j++] = 0;

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
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; }, bounds[0] === 0 && bounds[1] === index.length);
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
        if(bounds[0] === 0 && bounds[1] === index.length) {
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
      return filterIndexBounds((refilter = crossfilter_filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      return filterIndexBounds((refilter = crossfilter_filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      return filterIndexBounds((refilter = crossfilter_filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      refilter = crossfilter_filterAll;

      filterIndexFunction(refilterFunction = f, false);

      lo0 = 0;
      hi0 = n;

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
          indexLength = index.length;

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

    // Returns the top K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function top(k) {
      var array = [],
          i = hi0,
          j;

      while (--i >= lo0 && k > 0) {
        if (filters.zero(j = index[i])) {
          array.push(data[j]);
          --k;
        }
      }

      if(iterable){
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          // Add empty rows at the end
          if(filters.zero(j = iterablesEmptyRows[i])) {
            array.push(data[j]);
            --k;
          }
        }
      }

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k) {
      var array = [],
          i,
          j;

      if(iterable) {
        // Add empty rows at the top
        for(i = 0; i < iterablesEmptyRows.length && k > 0; i++) {
          if(filters.zero(j = iterablesEmptyRows[i])) {
            array.push(data[j]);
            --k;
          }
        }
      }

      i = lo0;

      while (i < hi0 && k > 0) {
        if (filters.zero(j = index[i])) {
          array.push(data[j]);
          --k;
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
          groupAll = key === crossfilter_null;

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
          groupIndex = k0 > 1 ? groupIndex : [];
        }
        else{
          groupIndex = k0 > 1 ? crossfilter_arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);
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
            if (g0 = oldGroups[++i0]) x0 = g0.key;
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
          for (i = 0; i < n; i++) {
            if(!groupIndex[i]){
              groupIndex[i] = []
            }
          }
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if(k > i0){
          if(iterable){
            groupIndex = permute(groupIndex, reIndex, true)
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
        if (k > 1) {
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
            reIndex = crossfilter_arrayWiden(reIndex, groupWidth <<= 1);
            groupIndex = crossfilter_arrayWiden(groupIndex, groupWidth);
            groupCapacity = crossfilter_capacity(groupWidth);
          }
        }
      }

      function removeData() {
        if (k > 1) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK);

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          for (var i = 0, j = 0; i < n; ++i) {
            if (!filters.zero(i)) {
              seenGroups[groupIndex[j] = groupIndex[i]] = 1;
              ++j;
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

          if (k > 1) {
            // Reindex the group index using seenGroups to find the new index.
            for (var i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var i = 0; i < n; ++i) if (!filters.zero(i)) return;
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
        return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
      }

      // Sets the reduce order, using the specified accessor.
      function order(value) {
        select = heapselect_by(valueOf);
        heap = heap_by(valueOf);
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
      return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
    }

    // A convenience method for reducing by sum(value).
    function reduceSum(value) {
      return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
    }

    // Returns the computed reduce value.
    function value() {
      if (resetNeeded) reset(), resetNeeded = false;
      return reduceValue;
    }

    // Removes this group and associated event listeners.
    function dispose() {
      var i = filterListeners.indexOf(update);
      if (i >= 0) filterListeners.splice(i);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i);
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

  function onChange(cb){
    if(typeof cb !== 'function'){
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
      ? crossfilter_array8 : m < 0x10001
      ? crossfilter_array16
      : crossfilter_array32)(n);
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
})(typeof exports !== 'undefined' && exports || this);

},{}],2:[function(require,module,exports){
module.exports = require("./crossfilter").crossfilter;

},{"./crossfilter":1}],3:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
var baseToString = require('lodash._basetostring');

/** Used as the `TypeError` message for "Functions" methods. */
var FUNC_ERROR_TEXT = 'Expected a function';

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used to match property names within property paths. */
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]/g;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
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
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/** Built-in value references. */
var splice = arrayProto.splice;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map'),
    nativeCreate = getNative(Object, 'create');

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
 * @param {Array} array The array to search.
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
  var value = object[key];
  return isNative(value) ? value : undefined;
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
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoize(function(string) {
  var result = [];
  toString(string).replace(rePropName, function(match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : (number || match));
  });
  return result;
});

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
 * [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
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
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
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
 * var object = { 'user': 'fred' };
 * var other = { 'user': 'fred' };
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
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
 * Checks if `value` is a native function.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 * @example
 *
 * _.isNative(Array.prototype.push);
 * // => true
 *
 * _.isNative(_);
 * // => false
 */
function isNative(value) {
  if (!isObject(value)) {
    return false;
  }
  var pattern = (isFunction(value) || isHostObject(value)) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
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

module.exports = stringToPath;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"lodash._basetostring":4}],4:[function(require,module,exports){
(function (global){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used to determine if values are of the language type `Object`. */
var objectTypes = {
  'function': true,
  'object': true
};

/** Detect free variable `exports`. */
var freeExports = (objectTypes[typeof exports] && exports && !exports.nodeType)
  ? exports
  : undefined;

/** Detect free variable `module`. */
var freeModule = (objectTypes[typeof module] && module && !module.nodeType)
  ? module
  : undefined;

/** Detect free variable `global` from Node.js. */
var freeGlobal = checkGlobal(freeExports && freeModule && typeof global == 'object' && global);

/** Detect free variable `self`. */
var freeSelf = checkGlobal(objectTypes[typeof self] && self);

/** Detect free variable `window`. */
var freeWindow = checkGlobal(objectTypes[typeof window] && window);

/** Detect `this` as the global object. */
var thisGlobal = checkGlobal(objectTypes[typeof this] && this);

/**
 * Used as a reference to the global object.
 *
 * The `this` value is used if it's the global object to avoid Greasemonkey's
 * restricted `window` object, otherwise the `window` object is used.
 */
var root = freeGlobal ||
  ((freeWindow !== (thisGlobal && thisGlobal.window)) && freeWindow) ||
    freeSelf || thisGlobal || Function('return this')();

/**
 * Checks if `value` is a global object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {null|Object} Returns `value` if it's a global object, else `null`.
 */
function checkGlobal(value) {
  return (value && value.Object === Object) ? value : null;
}

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Built-in value references. */
var Symbol = root.Symbol;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol ? Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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

module.exports = baseToString;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],5:[function(require,module,exports){
/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
var stringToPath = require('lodash._stringtopath');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    symbolTag = '[object Symbol]';

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @type {Function}
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
 * @returns {boolean} Returns `true` if `value` is correctly classified,
 *  else `false`.
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

},{"lodash._stringtopath":3}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
(function (process){
// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (typeof exports === "object" && typeof module === "object") {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});

}).call(this,require('_process'))

},{"_process":6}],8:[function(require,module,exports){
module.exports = require("./src/crossfilter").crossfilter;

},{"./src/crossfilter":12}],9:[function(require,module,exports){
module.exports={
  "_args": [
    [
      {
        "name": "crossfilter2",
        "raw": "crossfilter2@^1.4.0-alpha.05",
        "rawSpec": "^1.4.0-alpha.05",
        "scope": null,
        "spec": ">=1.4.0-alpha.5 <2.0.0",
        "type": "range"
      },
      "/Users/jayson/workspace/components/universe/node_modules/reductio"
    ]
  ],
  "_from": "crossfilter2@>=1.4.0-alpha.5 <2.0.0",
  "_id": "crossfilter2@1.4.0-alpha.6",
  "_inCache": true,
  "_installable": true,
  "_location": "/reductio/crossfilter2",
  "_nodeVersion": "5.10.1",
  "_npmOperationalInternal": {
    "host": "packages-12-west.internal.npmjs.com",
    "tmp": "tmp/crossfilter2-1.4.0-alpha.6.tgz_1463519571786_0.49269671249203384"
  },
  "_npmUser": {
    "email": "esjewett@gmail.com",
    "name": "esjewett"
  },
  "_npmVersion": "3.8.3",
  "_phantomChildren": {},
  "_requested": {
    "name": "crossfilter2",
    "raw": "crossfilter2@^1.4.0-alpha.05",
    "rawSpec": "^1.4.0-alpha.05",
    "scope": null,
    "spec": ">=1.4.0-alpha.5 <2.0.0",
    "type": "range"
  },
  "_requiredBy": [
    "/reductio"
  ],
  "_resolved": "https://registry.npmjs.org/crossfilter2/-/crossfilter2-1.4.0-alpha.6.tgz",
  "_shasum": "f0197c6fab2d6a583b51254bfc6357093f80521b",
  "_shrinkwrap": null,
  "_spec": "crossfilter2@^1.4.0-alpha.05",
  "_where": "/Users/jayson/workspace/components/universe/node_modules/reductio",
  "author": {
    "name": "Mike Bostock",
    "url": "http://bost.ocks.org/mike"
  },
  "bugs": {
    "url": "https://github.com/crossfilter/crossfilter/issues"
  },
  "contributors": [
    {
      "name": "Jason Davies",
      "url": "http://www.jasondavies.com/"
    }
  ],
  "dependencies": {
    "lodash.result": "^4.4.0"
  },
  "description": "Fast multidimensional filtering for coordinated views.",
  "devDependencies": {
    "browserify": "^13.0.0",
    "d3": "3.5",
    "package-json-versionify": "1.0.2",
    "uglify-js": "2.4.0",
    "vows": "0.7.0"
  },
  "directories": {},
  "dist": {
    "shasum": "f0197c6fab2d6a583b51254bfc6357093f80521b",
    "tarball": "https://registry.npmjs.org/crossfilter2/-/crossfilter2-1.4.0-alpha.6.tgz"
  },
  "files": [
    "src",
    "index.js",
    "crossfilter.js",
    "crossfilter.min.js"
  ],
  "gitHead": "509a96798f5153a58d1b6cae5fb3e7893129ce7c",
  "homepage": "http://crossfilter.github.com/crossfilter/",
  "keywords": [
    "analytics",
    "visualization",
    "crossfilter"
  ],
  "main": "./index.js",
  "maintainers": [
    {
      "email": "esjewett@gmail.com",
      "name": "esjewett"
    },
    {
      "email": "gordon@woodhull.com",
      "name": "gordonwoodhull"
    },
    {
      "email": "tannerlinsley@gmail.com",
      "name": "tannerlinsley"
    }
  ],
  "name": "crossfilter2",
  "optionalDependencies": {},
  "readme": "ERROR: No README data found!",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/crossfilter/crossfilter.git"
  },
  "scripts": {
    "benchmark": "node test/benchmark.js",
    "build": "browserify index.js -t package-json-versionify --standalone crossfilter -o crossfilter.js && uglifyjs --compress --mangle --screw-ie8 crossfilter.js -o crossfilter.min.js",
    "clean": "rm -f crossfilter.js crossfilter.min.js",
    "test": "vows --verbose"
  },
  "version": "1.4.0-alpha.6"
}

},{}],10:[function(require,module,exports){
if (typeof Uint8Array !== "undefined") {
  crossfilter_array8 = function(n) { return new Uint8Array(n); };
  crossfilter_array16 = function(n) { return new Uint16Array(n); };
  crossfilter_array32 = function(n) { return new Uint32Array(n); };

  crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  crossfilter_arrayWiden = function(array, width) {
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

},{}],11:[function(require,module,exports){
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

},{"./identity":16}],12:[function(require,module,exports){
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
    onChange: onChange,
    isElementFiltered: isElementFiltered,
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

  // Removes all records that match the current filters.
  function removeData() {
    var newIndex = crossfilter_index(n, n),
        removed = [];
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) newIndex[i] = j++;
      else removed.push(i);
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(-1, -1, [], removed, true); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var i = 0, j = 0; i < n; ++i) {
      if (!filters.zero(i)) {
        if (i !== j) filters.copy(j, i), data[j] = data[i];
        ++j;
      }
    }

    data.length = n = j;
    filters.truncate(j);
    triggerOnChange('dataRemoved');
  }

  // Return true if the data element at index i is filtered IN.
  // Optionally, ignore the filters of any dimensions in the ignore_dimensions list.
  function isElementFiltered(i, ignore_dimensions) {
    var n,
        d,
        id,
        len,
        mask = Array(filters.subarrays);
    for (n = 0; n < filters.subarrays; n++) { mask[n] = ~0; }
    if (ignore_dimensions) {
      for (d = 0, len = ignore_dimensions.length; d < len; d++) {
        // The top bits of the ID are the subarray offset and the lower bits are the bit
        // offset of the "one" mask.
        id = ignore_dimensions[d].id();
        mask[id >> 7] &= ~(0x1 << (id & 0x3f));
      }
    }
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
        index, // value rank ↦ object id
        oldValues, // temporary array storing previously-added values
        oldIndex, // temporary array storing previously-added index
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        iterablesIndexCount,
        newIterablesIndexCount,
        iterablesIndexFilterStatus,
        newIterablesIndexFilterStatus,
        oldIterablesIndexFilterStatus,
        iterablesEmptyRows,
        sort = quicksort.by(function(i) { return newValues[i]; }),
        refilter = xfilterFilter.filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0,
        t = 0;

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

        for (i = 0; i < newData.length; i++) {
          for(j = 0, k = value(newData[i]); j < k.length; j++) {
            t++;
          }
        }

        newValues = [];
        newIterablesIndexCount = crossfilter_range(newData.length);
        newIterablesIndexFilterStatus = crossfilter_index(t,1);
        iterablesEmptyRows = [];
        var unsortedIndex = crossfilter_range(t);

        for (l = 0, i = 0; i < newData.length; i++) {
          k = value(newData[i])
          //
          if(!k.length){
            newIterablesIndexCount[i] = 0;
            iterablesEmptyRows.push(i);
            continue;
          }
          newIterablesIndexCount[i] = k.length
          for (j = 0; j < k.length; j++) {
            newValues.push(k[j]);
            unsortedIndex[l] = i;
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
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) {
            filters[offset][newIndex[i] + n0] |= one;
            if(iterable) newIterablesIndexFilterStatus[i] = 1;
          }
        }
      } else {
        for (i = 0; i < lo1; ++i) {
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
        }
        for (i = hi1; i < n1; ++i) {
          filters[offset][newIndex[i] + n0] |= one;
          if(iterable) newIterablesIndexFilterStatus[i] = 1;
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
        oldIterablesIndexFilterStatus = iterablesIndexFilterStatus
        i0 = 0,
        i1 = 0;

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
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
          index[i] = newIndex[i1++] + (iterable ? old_n0 : n0);
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        if(iterable) iterablesIndexFilterStatus[i] = oldIterablesIndexFilterStatus[i1];
        index[i] = newIndex[i1] + (iterable ? old_n0 : n0);
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
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (!filters.zero(k = index[i])) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[k];
          ++j;
        }
      }
      values.length = j;
      while (j < n) index[j++] = 0;

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
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; }, bounds[0] === 0 && bounds[1] === index.length);
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
        if(bounds[0] === 0 && bounds[1] === index.length) {
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
      return filterIndexBounds((refilter = xfilterFilter.filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      return filterIndexBounds((refilter = xfilterFilter.filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      return filterIndexBounds((refilter = xfilterFilter.filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      refilterFunction = f;
      refilter = xfilterFilter.filterAll;

      filterIndexFunction(f, false);

      lo0 = 0;
      hi0 = n;

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
          indexLength = index.length;

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
          groupAll = key === crossfilter_null;

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
          groupIndex = k0 > 1 ? groupIndex : [];
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
            if (g0 = oldGroups[++i0]) x0 = g0.key;
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
          for (i = 0; i < n; i++) {
            if(!groupIndex[i]){
              groupIndex[i] = []
            }
          }
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if(k > i0){
          if(iterable){
            groupIndex = permute(groupIndex, reIndex, true)
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
        if (k > 1) {
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

      function removeData() {
        if (k > 1) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK);

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          for (var i = 0, j = 0; i < n; ++i) {
            if (!filters.zero(i)) {
              seenGroups[groupIndex[j] = groupIndex[i]] = 1;
              ++j;
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

          if (k > 1) {
            // Reindex the group index using seenGroups to find the new index.
            for (var i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var i = 0; i < n; ++i) if (!filters.zero(i)) return;
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
      if (i >= 0) filterListeners.splice(i);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i);
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

  function onChange(cb){
    if(typeof cb !== 'function'){
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

},{"./../package.json":9,"./array":10,"./bisect":11,"./filter":13,"./heap":14,"./heapselect":15,"./identity":16,"./insertionsort":17,"./null":18,"./permute":19,"./quicksort":20,"./reduce":21,"./zero":22,"lodash.result":5}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"./identity":16}],15:[function(require,module,exports){
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
        x,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (x = f(d = a[lo]) > min) {
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

},{"./heap":14,"./identity":16}],16:[function(require,module,exports){
function crossfilter_identity(d) {
  return d;
}

module.exports = crossfilter_identity;

},{}],17:[function(require,module,exports){
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

},{"./identity":16}],18:[function(require,module,exports){
function crossfilter_null() {
  return null;
}

module.exports = crossfilter_null;

},{}],19:[function(require,module,exports){
function permute(array, index, deep) {
  for (var i = 0, n = index.length, copy = deep ? JSON.parse(JSON.stringify(array)) : new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}

module.exports = permute;

},{}],20:[function(require,module,exports){
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
            while (true) {
              var greatValue = f(a[great]);
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

},{"./identity":16,"./insertionsort":17}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
function crossfilter_zero() {
  return 0;
}

module.exports = crossfilter_zero;

},{}],23:[function(require,module,exports){
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
			if(p.sum) console.warn('SUM aggregation is being overwritten by AVG aggregation');
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
			if(p.valueList) console.warn('VALUELIST accessor is being overwritten by median aggregation');
			p.valueList = value;
		}
		p.median = value;
		return obj;
	};

	obj.min = function(value) {
		if (!arguments.length) return p.min;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList) console.warn('VALUELIST accessor is being overwritten by median aggregation');
			p.valueList = value;
		}
		p.min = value;
		return obj;
	};

	obj.max = function(value) {
		if (!arguments.length) return p.max;

		value = accessorifyNumeric(value);

		if(typeof value === 'function') {
			if(p.valueList) console.warn('VALUELIST accessor is being overwritten by median aggregation');
			p.valueList = value;
		}
		p.max = value;
		return obj;
	};

	obj.exceptionCount = function(value) {
		if (!arguments.length) return p.exceptionCount;

		value = accessorify(value);

		if( typeof value === 'function' ) {
			if(p.sum) console.warn('EXCEPTION accessor is being overwritten by exception count aggregation');
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

},{"./parameters.js":40}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
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

},{"./alias.js":24,"./aliasProp.js":25,"./avg.js":26,"./count.js":29,"./custom.js":30,"./data-list.js":31,"./exception-count.js":32,"./exception-sum.js":33,"./filter.js":34,"./histogram.js":35,"./max.js":36,"./median.js":37,"./min.js":38,"./nest.js":39,"./std.js":45,"./sum-of-squares.js":46,"./sum.js":47,"./value-count.js":48,"./value-list.js":49}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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
},{}],33:[function(require,module,exports){
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
},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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
},{"crossfilter2":8}],36:[function(require,module,exports){
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
},{}],37:[function(require,module,exports){
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
},{}],38:[function(require,module,exports){
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
},{}],39:[function(require,module,exports){
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
},{"crossfilter2":8}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
module.exports = function(reductio){
    reductio.postprocessors = {};
    reductio.registerPostProcessor = function(name, func){
        reductio.postprocessors[name] = func;
    };

    reductio.registerPostProcessor('cap', require('./cap'));
    reductio.registerPostProcessor('sortBy', require('./sortBy'));
};

},{"./cap":28,"./sortBy":44}],43:[function(require,module,exports){
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

},{"./accessors.js":23,"./build.js":27,"./parameters.js":40,"./postprocess":41,"./postprocessors":42,"crossfilter2":8}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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
},{}],46:[function(require,module,exports){
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
},{}],47:[function(require,module,exports){
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
},{}],48:[function(require,module,exports){
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
},{"crossfilter2":8}],49:[function(require,module,exports){
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
},{"crossfilter2":8}],50:[function(require,module,exports){
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
      return subStack.map(function (s) {
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
        value: obj[key]
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
    params: params
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
    return '"' + str.replace(outerParens, function (p, pr) {
      if (hasComma.test(pr)) {
        if (pr.charAt(0) === '$') {
          return '":{"' + pr.replace(hasComma, function (p2/* , pr2 */) {
            if (p2 === ',') {
              return ',"'
            }
            return unwrapParensAndCommas(p2).trim()
          }) + '}'
        }
        return ':["' + pr.replace(hasComma, function (/* p2 , pr2 */) {
          return '","'
        }) + '"]'
      }
    })
  }
}

// Collection Aggregators

function $sum(children) {
  return children.reduce(function (a, b) {
    return a + b
  }, 0)
}

function $avg(children) {
  return children.reduce(function (a, b) {
    return a + b
  }, 0) / children.length
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
  return children.map(function (d) {
    return d[n]
  })
}

},{"./lodash":58}],51:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  return function clear(def) {
    // Clear a single or multiple column definitions
    if (def) {
      def = _.isArray(def) ? def : [def]
    }

    if (!def) {
      // Clear all of the column defenitions
      return Promise.all(_.map(service.columns, disposeColumn))
        .then(function () {
          service.columns = []
          return service
        })
    }

    return Promise.all(_.map(def, function (d) {
      if (_.isObject(d)) {
        d = d.key
      }
      // Clear the column
      var column = _.remove(service.columns, function (c) {
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
    }))
    .then(function () {
      return service
    })

    function disposeColumn(column) {
      var disposalActions = []
        // Dispose the dimension
      if (column.removeListeners) {
        disposalActions = _.map(column.removeListeners, function (listener) {
          return Promise.resolve(listener())
        })
      }
      var filterKey = column.complex ? JSON.stringify(column.key) : column.key
      delete service.filters[filterKey]
      if (column.dimension) {
        disposalActions.push(Promise.resolve(column.dimension.dispose()))
      }
      return Promise.all(disposalActions)
    }
  }
}

},{"./lodash":58,"q":7}],52:[function(require,module,exports){
'use strict'

var Promise = require('q')
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

    column.promise = Promise.try(function () {
      return Promise.resolve(service.cf.all())
    })
    .then(function (all) {
      var sample

      // Complex column Keys
      if (_.isArray(column.key)) {
        column.complex = true
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

      column.type =
        column.key === true ? 'all' :
        column.complex ? 'complex' :
        column.array ? 'array' :
        getType(sample)

      return dimension.make(column.key, column.type)
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

        var accessor = dimension.makeAccessor(column.key)
        column.values = column.values || []

        return Promise.try(function () {
          if (changes && changes.added) {
            return Promise.resolve(changes.added)
          }
          return Promise.resolve(column.dimension.bottom(Infinity))
        })
        .then(function (rows) {
          var newValues
          if (column.type === 'complex') {
            newValues = _.flatten(_.map(rows, accessor))
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

},{"./dimension":55,"./lodash":58,"q":7}],53:[function(require,module,exports){
'use strict'

var Promise = require('q')
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
    return Promise.try(function () {
      return Promise.resolve(service.cf.add(data))
    })
    .then(function () {
      return Promise.serial(_.map(service.dataListeners, function (listener) {
        return function () {
          return listener({
            added: data
          })
        }
      }))
    })
    .then(function () {
      return service
    })
  }

  function remove() {
    return Promise.try(function () {
      return Promise.resolve(service.cf.remove())
    })
    .then(function () {
      return service
    })
  }
}

},{"./lodash":58,"crossfilter2":2,"q":7}],54:[function(require,module,exports){
'use strict'

var Promise = require('q')
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

},{"q":7}],55:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = function (service) {
  return {
    make: make,
    makeAccessor: makeAccessor,
  }

  function make(key, type) {
    var accessor = makeAccessor(key)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
  }

  function makeAccessor(key) {
    var accessorFunction

    // Multi-key dimension
    if (_.isArray(key)) {
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

},{"./lodash":58,"q":7}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function (service) {
  return {
    filter: filter,
    filterAll: filterAll,
    applyFilters: applyFilters,
    makeFunction: makeFunction,
    scanForDynamicFilters: scanForDynamicFilters
  }

  function filter(column, fil, isRange, replace) {
    var exists = service.column.find(column)

    // If the filters dimension doesn't exist yet, try and create it
    return Promise.try(function () {
      if (!exists) {
        return service.column({
          key: column,
          temporary: true,
        })
        .then(function () {
          // It was able to be created, so retrieve and return it
          return service.column.find(column)
        })
      }
      // It exists, so just return what we found
      return exists
    })
    .then(function (column) {
      // Clone a copy of the new filters
      var newFilters = _.assign({}, service.filters)
      // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
      var filterKey = column.complex ? JSON.stringify(column.key) : column.key
      // Build the filter object
      newFilters[filterKey] = buildFilterObject(fil, isRange, replace)

      return applyFilters(newFilters)
    })
  }

  function filterAll() {
    service.columns.forEach(function (col) {
      col.dimension.filterAll()
    })
    return applyFilters({})
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
        type: 'function'
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

},{"./aggregation":50,"./expressions":56,"./lodash":58,"q":7}],58:[function(require,module,exports){
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
      arr[j] = arr[j - 1];
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

},{}],59:[function(require,module,exports){
'use strict'

var Promise = require('q')
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
      value: {}
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
      value: {}
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

},{"./aggregation":50,"./lodash":58,"q":7}],60:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

Promise.serial = serial

var isPromiseLike = function (obj) {
  return obj && _.isFunction(obj.then)
}

function serial(tasks) {
  // Fake a "previous task" for our initial iteration
  var prevPromise
  var error = new Error()
  _.forEach(tasks, function (task, key) {
    var success = task.success || task
    var fail = task.fail
    var notify = task.notify
    var nextPromise

    // First task
    if (!prevPromise) { // eslint-disable-line no-negated-condition
      nextPromise = success()
      if (!isPromiseLike(nextPromise)) {
        error.message = 'Task ' + key + ' did not return a promise.'
        throw error
      }
    } else {
      // Wait until the previous promise has resolved or rejected to execute the next task
      nextPromise = prevPromise.then(
        /* success */
        function (data) {
          if (!success) {
            return data
          }
          var ret = success(data)
          if (!isPromiseLike(ret)) {
            error.message = 'Task ' + key + ' did not return a promise.'
            throw error
          }
          return ret
        },
        /* failure */
        function (reason) {
          if (!fail) {
            return Promise.reject(reason)
          }
          var ret = fail(reason)
          if (!isPromiseLike(ret)) {
            error.message = 'Fail for task ' + key + ' did not return a promise.'
            throw error
          }
          return ret
        },
        notify)
    }
    prevPromise = nextPromise
  })

  return prevPromise || Promise.when()
}

},{"./lodash":58,"q":7}],61:[function(require,module,exports){
'use strict'

var Promise = require('q')
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
          return Promise.try(function () { // eslint-disable-line no-loop-func
            return service.columns[i].queries[j]
          })
        }
      }
    }

    var query = {
      // Original query passed in to query method
      original: queryObj,
      hash: queryHash
    }

    // Default queryObj
    if (_.isUndefined(query.original)) {
      query.original = {}
    }
    // Default select
    if (_.isUndefined(query.original.select)) {
      query.original.select = {
        $count: true
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
        array: Boolean(query.array)
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
            dynamicReference: query.group
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
        return Promise.try(function () {
          return q.group.dispose()
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

},{"./filters":57,"./lodash":58,"./postAggregation":59,"./reductiofy":63,"q":7}],62:[function(require,module,exports){
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
  }
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

},{}],63:[function(require,module,exports){
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
            value: val
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
        reducer = aggregateOrNest(reducer.value(s.key), s.value)
      })
    }
  }
}

},{"./aggregation":50,"./filters":57,"./lodash":58,"./reductioAggregators":62,"reductio":43}],64:[function(require,module,exports){
'use strict'

require('./q.serial')

// var Promise = require('q')  // Promise is defined but never used
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

},{"./clear":51,"./column":52,"./crossfilter":53,"./destroy":54,"./filters":57,"./lodash":58,"./q.serial":60,"./query":61}]},{},[64])(64)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2guX3N0cmluZ3RvcGF0aC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sb2Rhc2guX3N0cmluZ3RvcGF0aC9ub2RlX21vZHVsZXMvbG9kYXNoLl9iYXNldG9zdHJpbmcvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbG9kYXNoLnJlc3VsdC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9wYWNrYWdlLmpzb24iLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvYXJyYXkuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvYmlzZWN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2Nyb3NzZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9oZWFwLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL2hlYXBzZWxlY3QuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaWRlbnRpdHkuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvaW5zZXJ0aW9uc29ydC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy9udWxsLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3Blcm11dGUuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vbm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9zcmMvcXVpY2tzb3J0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvc3JjL3JlZHVjZS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9ub2RlX21vZHVsZXMvY3Jvc3NmaWx0ZXIyL3NyYy96ZXJvLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hY2Nlc3NvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FsaWFzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9hbGlhc1Byb3AuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2F2Zy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYnVpbGQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2NhcC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2N1c3RvbS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvZGF0YS1saXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9leGNlcHRpb24tY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2V4Y2VwdGlvbi1zdW0uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvaGlzdG9ncmFtLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9tYXguanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL21lZGlhbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbWluLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9uZXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wYXJhbWV0ZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wb3N0cHJvY2Vzcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcG9zdHByb2Nlc3NvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3JlZHVjdGlvLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zb3J0QnkuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N0ZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvc3VtLW9mLXNxdWFyZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N1bS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvdmFsdWUtY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3ZhbHVlLWxpc3QuanMiLCJzcmMvYWdncmVnYXRpb24uanMiLCJzcmMvY2xlYXIuanMiLCJzcmMvY29sdW1uLmpzIiwic3JjL2Nyb3NzZmlsdGVyLmpzIiwic3JjL2Rlc3Ryb3kuanMiLCJzcmMvZGltZW5zaW9uLmpzIiwic3JjL2V4cHJlc3Npb25zLmpzIiwic3JjL2ZpbHRlcnMuanMiLCJzcmMvbG9kYXNoLmpzIiwic3JjL3Bvc3RBZ2dyZWdhdGlvbi5qcyIsInNyYy9xLnNlcmlhbC5qcyIsInNyYy9xdWVyeS5qcyIsInNyYy9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzLmpzIiwic3JjL3JlZHVjdGlvZnkuanMiLCJzcmMvdW5pdmVyc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2g1REE7QUFDQTs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUN0dUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDekpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hnRUE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2MUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiKGZ1bmN0aW9uKGV4cG9ydHMpe1xuY3Jvc3NmaWx0ZXIudmVyc2lvbiA9IFwiMi4wLjAtYWxwaGEuMDNcIjtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2lkZW50aXR5KGQpIHtcbiAgcmV0dXJuIGQ7XG59XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcblxuZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgsIGRlZXApIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBkZWVwID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhcnJheSkpIDogbmV3IEFycmF5KG4pOyBpIDwgbjsgKytpKSB7XG4gICAgY29weVtpXSA9IGFycmF5W2luZGV4W2ldXTtcbiAgfVxuICByZXR1cm4gY29weTtcbn1cbnZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5iaXNlY3QuYnkgPSBiaXNlY3RfYnk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cbnZhciBoZWFwID0gY3Jvc3NmaWx0ZXIuaGVhcCA9IGhlYXBfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwLmJ5ID0gaGVhcF9ieTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG52YXIgaGVhcHNlbGVjdCA9IGNyb3NzZmlsdGVyLmhlYXBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcHNlbGVjdC5ieSA9IGhlYXBzZWxlY3RfYnk7XG5cbmZ1bmN0aW9uIGhlYXBzZWxlY3RfYnkoZikge1xuICB2YXIgaGVhcCA9IGhlYXBfYnkoZik7XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgayBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYVtsbzpoaV0uXG4gIC8vIFRoZSByZXR1cm5lZCBhcnJheSBpcyBub3Qgc29ydGVkLCBidXQgbWFpbnRhaW5zIHRoZSBoZWFwIHByb3BlcnR5LiBJZiBrIGlzXG4gIC8vIGdyZWF0ZXIgdGhhbiBoaSAtIGxvLCB0aGVuIGZld2VyIHRoYW4gayBlbGVtZW50cyB3aWxsIGJlIHJldHVybmVkLiBUaGVcbiAgLy8gb3JkZXIgb2YgZWxlbWVudHMgaW4gYSBpcyB1bmNoYW5nZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gIGZ1bmN0aW9uIGhlYXBzZWxlY3QoYSwgbG8sIGhpLCBrKSB7XG4gICAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KGsgPSBNYXRoLm1pbihoaSAtIGxvLCBrKSksXG4gICAgICAgIG1pbixcbiAgICAgICAgaSxcbiAgICAgICAgeCxcbiAgICAgICAgZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHF1ZXVlW2ldID0gYVtsbysrXTtcbiAgICBoZWFwKHF1ZXVlLCAwLCBrKTtcblxuICAgIGlmIChsbyA8IGhpKSB7XG4gICAgICBtaW4gPSBmKHF1ZXVlWzBdKTtcbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHggPSBmKGQgPSBhW2xvXSkgPiBtaW4pIHtcbiAgICAgICAgICBxdWV1ZVswXSA9IGQ7XG4gICAgICAgICAgbWluID0gZihoZWFwKHF1ZXVlLCAwLCBrKVswXSk7XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKCsrbG8gPCBoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXVlO1xuICB9XG5cbiAgcmV0dXJuIGhlYXBzZWxlY3Q7XG59XG52YXIgaW5zZXJ0aW9uc29ydCA9IGNyb3NzZmlsdGVyLmluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaW5zZXJ0aW9uc29ydC5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG5cbmZ1bmN0aW9uIGluc2VydGlvbnNvcnRfYnkoZikge1xuXG4gIGZ1bmN0aW9uIGluc2VydGlvbnNvcnQoYSwgbG8sIGhpKSB7XG4gICAgZm9yICh2YXIgaSA9IGxvICsgMTsgaSA8IGhpOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSBpLCB0ID0gYVtpXSwgeCA9IGYodCk7IGogPiBsbyAmJiBmKGFbaiAtIDFdKSA+IHg7IC0taikge1xuICAgICAgICBhW2pdID0gYVtqIC0gMV07XG4gICAgICB9XG4gICAgICBhW2pdID0gdDtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICByZXR1cm4gaW5zZXJ0aW9uc29ydDtcbn1cbi8vIEFsZ29yaXRobSBkZXNpZ25lZCBieSBWbGFkaW1pciBZYXJvc2xhdnNraXkuXG4vLyBJbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiB0aGUgRGFydCBwcm9qZWN0OyBzZWUgbGliL2RhcnQvTElDRU5TRSBmb3IgZGV0YWlscy5cblxudmFyIHF1aWNrc29ydCA9IGNyb3NzZmlsdGVyLnF1aWNrc29ydCA9IHF1aWNrc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbnF1aWNrc29ydC5ieSA9IHF1aWNrc29ydF9ieTtcblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGYpO1xuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgcmV0dXJuIChoaSAtIGxvIDwgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGRcbiAgICAgICAgPyBpbnNlcnRpb25zb3J0XG4gICAgICAgIDogcXVpY2tzb3J0KShhLCBsbywgaGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVpY2tzb3J0KGEsIGxvLCBoaSkge1xuICAgIC8vIENvbXB1dGUgdGhlIHR3byBwaXZvdHMgYnkgbG9va2luZyBhdCA1IGVsZW1lbnRzLlxuICAgIHZhciBzaXh0aCA9IChoaSAtIGxvKSAvIDYgfCAwLFxuICAgICAgICBpMSA9IGxvICsgc2l4dGgsXG4gICAgICAgIGk1ID0gaGkgLSAxIC0gc2l4dGgsXG4gICAgICAgIGkzID0gbG8gKyBoaSAtIDEgPj4gMSwgIC8vIFRoZSBtaWRwb2ludC5cbiAgICAgICAgaTIgPSBpMyAtIHNpeHRoLFxuICAgICAgICBpNCA9IGkzICsgc2l4dGg7XG5cbiAgICB2YXIgZTEgPSBhW2kxXSwgeDEgPSBmKGUxKSxcbiAgICAgICAgZTIgPSBhW2kyXSwgeDIgPSBmKGUyKSxcbiAgICAgICAgZTMgPSBhW2kzXSwgeDMgPSBmKGUzKSxcbiAgICAgICAgZTQgPSBhW2k0XSwgeDQgPSBmKGU0KSxcbiAgICAgICAgZTUgPSBhW2k1XSwgeDUgPSBmKGU1KTtcblxuICAgIHZhciB0O1xuXG4gICAgLy8gU29ydCB0aGUgc2VsZWN0ZWQgNSBlbGVtZW50cyB1c2luZyBhIHNvcnRpbmcgbmV0d29yay5cbiAgICBpZiAoeDEgPiB4MikgdCA9IGUxLCBlMSA9IGUyLCBlMiA9IHQsIHQgPSB4MSwgeDEgPSB4MiwgeDIgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgxID4geDMpIHQgPSBlMSwgZTEgPSBlMywgZTMgPSB0LCB0ID0geDEsIHgxID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MSA+IHg0KSB0ID0gZTEsIGUxID0gZTQsIGU0ID0gdCwgdCA9IHgxLCB4MSA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgzID4geDQpIHQgPSBlMywgZTMgPSBlNCwgZTQgPSB0LCB0ID0geDMsIHgzID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDIgPiB4NSkgdCA9IGUyLCBlMiA9IGU1LCBlNSA9IHQsIHQgPSB4MiwgeDIgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcblxuICAgIHZhciBwaXZvdDEgPSBlMiwgcGl2b3RWYWx1ZTEgPSB4MixcbiAgICAgICAgcGl2b3QyID0gZTQsIHBpdm90VmFsdWUyID0geDQ7XG5cbiAgICAvLyBlMiBhbmQgZTQgaGF2ZSBiZWVuIHNhdmVkIGluIHRoZSBwaXZvdCB2YXJpYWJsZXMuIFRoZXkgd2lsbCBiZSB3cml0dGVuXG4gICAgLy8gYmFjaywgb25jZSB0aGUgcGFydGl0aW9uaW5nIGlzIGZpbmlzaGVkLlxuICAgIGFbaTFdID0gZTE7XG4gICAgYVtpMl0gPSBhW2xvXTtcbiAgICBhW2kzXSA9IGUzO1xuICAgIGFbaTRdID0gYVtoaSAtIDFdO1xuICAgIGFbaTVdID0gZTU7XG5cbiAgICB2YXIgbGVzcyA9IGxvICsgMSwgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuICAgICAgICBncmVhdCA9IGhpIC0gMjsgIC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cblxuICAgIC8vIE5vdGUgdGhhdCBmb3IgdmFsdWUgY29tcGFyaXNvbiwgPCwgPD0sID49IGFuZCA+IGNvZXJjZSB0byBhIHByaW1pdGl2ZSB2aWFcbiAgICAvLyBPYmplY3QucHJvdG90eXBlLnZhbHVlT2Y7ID09IGFuZCA9PT0gZG8gbm90LCBzbyBpbiBvcmRlciB0byBiZSBjb25zaXN0ZW50XG4gICAgLy8gd2l0aCBuYXR1cmFsIG9yZGVyIChzdWNoIGFzIGZvciBEYXRlIG9iamVjdHMpLCB3ZSBtdXN0IGRvIHR3byBjb21wYXJlcy5cbiAgICB2YXIgcGl2b3RzRXF1YWwgPSBwaXZvdFZhbHVlMSA8PSBwaXZvdFZhbHVlMiAmJiBwaXZvdFZhbHVlMSA+PSBwaXZvdFZhbHVlMjtcbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcblxuICAgICAgLy8gRGVnZW5lcmF0ZWQgY2FzZSB3aGVyZSB0aGUgcGFydGl0aW9uaW5nIGJlY29tZXMgYSBkdXRjaCBuYXRpb25hbCBmbGFnXG4gICAgICAvLyBwcm9ibGVtLlxuICAgICAgLy9cbiAgICAgIC8vIFsgfCAgPCBwaXZvdCAgfCA9PSBwaXZvdCB8IHVucGFydGl0aW9uZWQgfCA+IHBpdm90ICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgIF4gICAgICAgICAgXiAgICAgICAgICAgICBeICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICBrICAgICAgICAgICBncmVhdCAgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxKSBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QuXG4gICAgICAvLyAgIDIpIGZvciB4IGluIFtsZXNzLCBrWyA6IHggPT0gcGl2b3QuXG4gICAgICAvLyAgIDMpIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90LlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7ICsraykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2UgaWYgKHhrID4gcGl2b3RWYWx1ZTEpIHtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgPD0gcGl2b3QgaW4gdGhlIHJhbmdlIFtrIC0gMSwgZ3JlYXRdIGFuZFxuICAgICAgICAgIC8vIHB1dCBbOmVrOl0gdGhlcmUuIFdlIGtub3cgdGhhdCBzdWNoIGFuIGVsZW1lbnQgbXVzdCBleGlzdDpcbiAgICAgICAgICAvLyBXaGVuIGsgPT0gbGVzcywgdGhlbiBlbDMgKHdoaWNoIGlzIGVxdWFsIHRvIHBpdm90KSBsaWVzIGluIHRoZVxuICAgICAgICAgIC8vIGludGVydmFsLiBPdGhlcndpc2UgYVtrIC0gMV0gPT0gcGl2b3QgYW5kIHRoZSBzZWFyY2ggc3RvcHMgYXQgay0xLlxuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpbiB0aGUgbGF0dGVyIGNhc2UgaW52YXJpYW50IDIgd2lsbCBiZSB2aW9sYXRlZCBmb3IgYVxuICAgICAgICAgIC8vIHNob3J0IGFtb3VudCBvZiB0aW1lLiBUaGUgaW52YXJpYW50IHdpbGwgYmUgcmVzdG9yZWQgd2hlbiB0aGVcbiAgICAgICAgICAvLyBwaXZvdHMgYXJlIHB1dCBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbiB0aGUgd2hpbGUtbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAvLyBOb3RlOiBpZiBncmVhdCA8IGsgdGhlbiB3ZSB3aWxsIGV4aXQgdGhlIG91dGVyIGxvb3AgYW5kIGZpeFxuICAgICAgICAgICAgICAvLyBpbnZhcmlhbnQgMiAod2hpY2ggd2UganVzdCB2aW9sYXRlZCkuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuIDwgcGl2b3QxXG4gICAgICAvLyAgMi4gPj0gcGl2b3QxICYmIDw9IHBpdm90MlxuICAgICAgLy8gIDMuID4gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbIHwgPCBwaXZvdDEgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA+IHBpdm90MiAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8PSB4ICYmIHggPD0gcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDw9IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA+PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTW92ZSBwaXZvdHMgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgLy8gV2Ugc2hydW5rIHRoZSBsaXN0IGZyb20gYm90aCBzaWRlcyAoYVtsZWZ0XSBhbmQgYVtyaWdodF0gaGF2ZVxuICAgIC8vIG1lYW5pbmdsZXNzIHZhbHVlcyBpbiB0aGVtKSBhbmQgbm93IHdlIG1vdmUgZWxlbWVudHMgZnJvbSB0aGUgZmlyc3RcbiAgICAvLyBhbmQgdGhpcmQgcGFydGl0aW9uIGludG8gdGhlc2UgbG9jYXRpb25zIHNvIHRoYXQgd2UgY2FuIHN0b3JlIHRoZVxuICAgIC8vIHBpdm90cy5cbiAgICBhW2xvXSA9IGFbbGVzcyAtIDFdO1xuICAgIGFbbGVzcyAtIDFdID0gcGl2b3QxO1xuICAgIGFbaGkgLSAxXSA9IGFbZ3JlYXQgKyAxXTtcbiAgICBhW2dyZWF0ICsgMV0gPSBwaXZvdDI7XG5cbiAgICAvLyBUaGUgbGlzdCBpcyBub3cgcGFydGl0aW9uZWQgaW50byB0aHJlZSBwYXJ0aXRpb25zOlxuICAgIC8vIFsgPCBwaXZvdDEgICB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgICB8ICA+IHBpdm90MiAgIF1cbiAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuXG4gICAgLy8gUmVjdXJzaXZlIGRlc2NlbnQuIChEb24ndCBpbmNsdWRlIHRoZSBwaXZvdCB2YWx1ZXMuKVxuICAgIHNvcnQoYSwgbG8sIGxlc3MgLSAxKTtcbiAgICBzb3J0KGEsIGdyZWF0ICsgMiwgaGkpO1xuXG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG4gICAgICAvLyBBbGwgZWxlbWVudHMgaW4gdGhlIHNlY29uZCBwYXJ0aXRpb24gYXJlIGVxdWFsIHRvIHRoZSBwaXZvdC4gTm9cbiAgICAgIC8vIG5lZWQgdG8gc29ydCB0aGVtLlxuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlb3J5IGl0IHNob3VsZCBiZSBlbm91Z2ggdG8gY2FsbCBfZG9Tb3J0IHJlY3Vyc2l2ZWx5IG9uIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJ0aXRpb24uXG4gICAgLy8gVGhlIEFuZHJvaWQgc291cmNlIGhvd2V2ZXIgcmVtb3ZlcyB0aGUgcGl2b3QgZWxlbWVudHMgZnJvbSB0aGUgcmVjdXJzaXZlXG4gICAgLy8gY2FsbCBpZiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBpcyB0b28gbGFyZ2UgKG1vcmUgdGhhbiAyLzMgb2YgdGhlIGxpc3QpLlxuICAgIGlmIChsZXNzIDwgaTEgJiYgZ3JlYXQgPiBpNSkge1xuICAgICAgdmFyIGxlc3NWYWx1ZSwgZ3JlYXRWYWx1ZTtcbiAgICAgIHdoaWxlICgobGVzc1ZhbHVlID0gZihhW2xlc3NdKSkgPD0gcGl2b3RWYWx1ZTEgJiYgbGVzc1ZhbHVlID49IHBpdm90VmFsdWUxKSArK2xlc3M7XG4gICAgICB3aGlsZSAoKGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKSkgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikgLS1ncmVhdDtcblxuICAgICAgLy8gQ29weSBwYXN0ZSBvZiB0aGUgcHJldmlvdXMgMy13YXkgcGFydGl0aW9uaW5nIHdpdGggYWRhcHRpb25zLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuID09IHBpdm90MVxuICAgICAgLy8gIDIuID4gcGl2b3QxICYmIDwgcGl2b3QyXG4gICAgICAvLyAgMy4gPT0gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbID09IHBpdm90MSB8ID4gcGl2b3QxICYmIDwgcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA9PSBwaXZvdDIgXVxuICAgICAgLy8gICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXlxuICAgICAgLy8gICAgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXRcbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBbICosIGxlc3NbIDogeCA9PSBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDwgeCAmJiB4IDwgcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgKiBdIDogeCA9PSBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUxICYmIHhrID49IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXNzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUyICYmIHhrID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBoYXMgbm93IGJlZW4gY2xlYXJlZCBvZiBwaXZvdCBlbGVtZW50cyBhbmQgbG9va3NcbiAgICAvLyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID4gcGl2b3QxICYmIDwgcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTb3J0IHRoZSBzZWNvbmQgcGFydGl0aW9uIHVzaW5nIHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gbG9va3MgYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU2ltcGx5IHNvcnQgaXQgYnkgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICByZXR1cm4gc29ydChhLCBsZXNzLCBncmVhdCArIDEpO1xuICB9XG5cbiAgcmV0dXJuIHNvcnQ7XG59XG5cbnZhciBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZCA9IDMyO1xudmFyIGNyb3NzZmlsdGVyX2FycmF5OCA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZDtcblxuaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG4pOyB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gZnVuY3Rpb24oYXJyYXksIHdpZHRoKSB7XG4gICAgdmFyIGNvcHk7XG4gICAgc3dpdGNoICh3aWR0aCkge1xuICAgICAgY2FzZSAxNjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MTYoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkzMihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICAgIH1cbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZChuKSB7XG4gIHZhciBhcnJheSA9IG5ldyBBcnJheShuKSwgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbikgYXJyYXlbaV0gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkKGFycmF5LCBsZW5ndGgpIHtcbiAgdmFyIG4gPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChuIDwgbGVuZ3RoKSBhcnJheVtuKytdID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZChhcnJheSwgd2lkdGgpIHtcbiAgaWYgKHdpZHRoID4gMzIpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIEFuIGFyYml0cmFyaWx5LXdpZGUgYXJyYXkgb2YgYml0bWFza3NcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2JpdGFycmF5KG4pIHtcbiAgdGhpcy5sZW5ndGggPSBuO1xuICB0aGlzLnN1YmFycmF5cyA9IDE7XG4gIHRoaXMud2lkdGggPSA4O1xuICB0aGlzLm1hc2tzID0ge1xuICAgIDA6IDBcbiAgfVxuXG4gIHRoaXNbMF0gPSBjcm9zc2ZpbHRlcl9hcnJheTgobik7XG59XG5cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5sZW5ndGhlbiA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKHRoaXNbaV0sIG4pO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIFJlc2VydmUgYSBuZXcgYml0IGluZGV4IGluIHRoZSBhcnJheSwgcmV0dXJucyB7b2Zmc2V0LCBvbmV9XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtLCB3LCBvbmUsIGksIGxlbjtcblxuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbSA9IHRoaXMubWFza3NbaV07XG4gICAgdyA9IHRoaXMud2lkdGggLSAoMzIgKiBpKTtcbiAgICBvbmUgPSB+bSAmIC1+bTtcblxuICAgIGlmICh3ID49IDMyICYmICFvbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICh3IDwgMzIgJiYgKG9uZSAmICgxIDw8IHcpKSkge1xuICAgICAgLy8gd2lkZW4gdGhpcyBzdWJhcnJheVxuICAgICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4odGhpc1tpXSwgdyA8PD0gMSk7XG4gICAgICB0aGlzLndpZHRoID0gMzIgKiBpICsgdztcbiAgICB9XG5cbiAgICB0aGlzLm1hc2tzW2ldIHw9IG9uZTtcblxuICAgIHJldHVybiB7XG4gICAgICBvZmZzZXQ6IGksXG4gICAgICBvbmU6IG9uZVxuICAgIH07XG4gIH1cblxuICAvLyBhZGQgYSBuZXcgc3ViYXJyYXlcbiAgdGhpc1t0aGlzLnN1YmFycmF5c10gPSBjcm9zc2ZpbHRlcl9hcnJheTgodGhpcy5sZW5ndGgpO1xuICB0aGlzLm1hc2tzW3RoaXMuc3ViYXJyYXlzXSA9IDE7XG4gIHRoaXMud2lkdGggKz0gODtcbiAgcmV0dXJuIHtcbiAgICBvZmZzZXQ6IHRoaXMuc3ViYXJyYXlzKyssXG4gICAgb25lOiAxXG4gIH07XG59O1xuXG4vLyBDb3B5IHJlY29yZCBmcm9tIGluZGV4IHNyYyB0byBpbmRleCBkZXN0XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGRlc3QsIHNyYykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXVtkZXN0XSA9IHRoaXNbaV1bc3JjXTtcbiAgfVxufTtcblxuLy8gVHJ1bmNhdGUgdGhlIGFycmF5IHRvIHRoZSBnaXZlbiBsZW5ndGhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS50cnVuY2F0ZSA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGZvciAodmFyIGogPSB0aGlzLmxlbmd0aCAtIDE7IGogPj0gbjsgai0tKSB7XG4gICAgICB0aGlzW2ldW2pdID0gMDtcbiAgICB9XG4gICAgdGhpc1tpXS5sZW5ndGggPSBuO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDBcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwIGV4Y2VwdCBmb3IgcG9zc2libHkgb25lXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPT09IG9mZnNldCA/IHRoaXNbaV1bbl0gJiB6ZXJvIDogdGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCBvbmUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICE9IChpID09PSBvZmZzZXQgPyBvbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXggZXhjZXB0IGZvciBwb3NzaWJseSBvbmUgb3RoZXJcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5RXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvLCBvbmx5T2Zmc2V0LCBvbmx5T25lKSB7XG4gIHZhciBtYXNrO1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbWFzayA9IHRoaXNbaV1bbl07XG4gICAgaWYgKGkgPT09IG9mZnNldClcbiAgICAgIG1hc2sgJj0gemVybztcbiAgICBpZiAobWFzayAhPSAoaSA9PT0gb25seU9mZnNldCA/IG9ubHlPbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKHZhbHVlcykge1xuICByZXR1cm4gWzAsIHZhbHVlcy5sZW5ndGhdO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfbnVsbCgpIHtcbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudChwKSB7XG4gIHJldHVybiBwICsgMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwICsgK2Yodik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCAtIGYodik7XG4gIH07XG59XG5leHBvcnRzLmNyb3NzZmlsdGVyID0gY3Jvc3NmaWx0ZXI7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyKCkge1xuICB2YXIgY3Jvc3NmaWx0ZXIgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmVEYXRhLFxuICAgIGRpbWVuc2lvbjogZGltZW5zaW9uLFxuICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICBzaXplOiBzaXplLFxuICAgIGFsbDogYWxsLFxuICAgIG9uQ2hhbmdlOiBvbkNoYW5nZSxcbiAgfTtcblxuICB2YXIgZGF0YSA9IFtdLCAvLyB0aGUgcmVjb3Jkc1xuICAgICAgbiA9IDAsIC8vIHRoZSBudW1iZXIgb2YgcmVjb3JkczsgZGF0YS5sZW5ndGhcbiAgICAgIGZpbHRlcnMsIC8vIDEgaXMgZmlsdGVyZWQgb3V0XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiB0aGUgZmlsdGVycyBjaGFuZ2VcbiAgICAgIGRhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyByZW1vdmVkXG4gICAgICBjYWxsYmFja3MgPSBbXTtcblxuICBmaWx0ZXJzID0gbmV3IGNyb3NzZmlsdGVyX2JpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhQWRkZWQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgtMSwgLTEsIFtdLCByZW1vdmVkLCB0cnVlKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVycy5jb3B5KGosIGkpLCBkYXRhW2pdID0gZGF0YVtpXTtcbiAgICAgICAgKytqO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEubGVuZ3RoID0gbiA9IGo7XG4gICAgZmlsdGVycy50cnVuY2F0ZShqKTtcbiAgICB0cmlnZ2VyT25DaGFuZ2UoJ2RhdGFSZW1vdmVkJyk7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSwgaXRlcmFibGUpIHtcbiAgICB2YXIgZGltZW5zaW9uID0ge1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICBmaWx0ZXJFeGFjdDogZmlsdGVyRXhhY3QsXG4gICAgICBmaWx0ZXJSYW5nZTogZmlsdGVyUmFuZ2UsXG4gICAgICBmaWx0ZXJGdW5jdGlvbjogZmlsdGVyRnVuY3Rpb24sXG4gICAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgb25lLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8sIC8vIGludmVydGVkIG9uZSwgZS5nLiwgMTExMTAxMTFcbiAgICAgICAgb2Zmc2V0LCAvLyBvZmZzZXQgaW50byB0aGUgZmlsdGVycyBhcnJheXNcbiAgICAgICAgdmFsdWVzLCAvLyBzb3J0ZWQsIGNhY2hlZCBhcnJheVxuICAgICAgICBpbmRleCwgLy8gdmFsdWUgcmFuayDihqYgb2JqZWN0IGlkXG4gICAgICAgIG9sZFZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgcHJldmlvdXNseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgb2xkSW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIHByZXZpb3VzbHktYWRkZWQgaW5kZXhcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMsXG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cyxcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydF9ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwLFxuICAgICAgICB0ID0gMDtcblxuICAgIC8vIFVwZGF0aW5nIGEgZGltZW5zaW9uIGlzIGEgdHdvLXN0YWdlIHByb2Nlc3MuIEZpcnN0LCB3ZSBtdXN0IHVwZGF0ZSB0aGVcbiAgICAvLyBhc3NvY2lhdGVkIGZpbHRlcnMgZm9yIHRoZSBuZXdseS1hZGRlZCByZWNvcmRzLiBPbmNlIGFsbCBkaW1lbnNpb25zIGhhdmVcbiAgICAvLyB1cGRhdGVkIHRoZWlyIGZpbHRlcnMsIHRoZSBncm91cHMgYXJlIG5vdGlmaWVkIHRvIHVwZGF0ZS5cbiAgICBkYXRhTGlzdGVuZXJzLnVuc2hpZnQocHJlQWRkKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2gocG9zdEFkZCk7XG5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAvLyBBZGQgYSBuZXcgZGltZW5zaW9uIGluIHRoZSBmaWx0ZXIgYml0bWFwIGFuZCBzdG9yZSB0aGUgb2Zmc2V0IGFuZCBiaXRtYXNrLlxuICAgIHZhciB0bXAgPSBmaWx0ZXJzLmFkZCgpO1xuICAgIG9mZnNldCA9IHRtcC5vZmZzZXQ7XG4gICAgb25lID0gdG1wLm9uZTtcbiAgICB6ZXJvID0gfm9uZTtcblxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG5cbiAgICAgIGlmIChpdGVyYWJsZSl7XG4gICAgICAgIC8vIENvdW50IGFsbCB0aGUgdmFsdWVzXG4gICAgICAgIHQgPSAwO1xuICAgICAgICBqID0gMDtcbiAgICAgICAgayA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm9yKGogPSAwLCBrID0gdmFsdWUobmV3RGF0YVtpXSk7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbmV3VmFsdWVzID0gW107XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQgPSBjcm9zc2ZpbHRlcl9yYW5nZShuZXdEYXRhLmxlbmd0aCk7XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgodCwxKTtcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzID0gW107XG4gICAgICAgIHZhciB1bnNvcnRlZEluZGV4ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UodCk7XG5cbiAgICAgICAgZm9yIChsID0gMCwgaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgayA9IHZhbHVlKG5ld0RhdGFbaV0pXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZighay5sZW5ndGgpe1xuICAgICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpXSA9IDA7XG4gICAgICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3MucHVzaChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2ldID0gay5sZW5ndGhcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgbmV3VmFsdWVzLnB1c2goa1tqXSk7XG4gICAgICAgICAgICB1bnNvcnRlZEluZGV4W2xdID0gaTtcbiAgICAgICAgICAgIGwrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIFNvcnQgbWFwIHVzZWQgdG8gc29ydCBib3RoIHRoZSB2YWx1ZXMgYW5kIHRoZSB2YWx1ZVRvRGF0YSBpbmRpY2VzXG4gICAgICAgIHZhciBzb3J0TWFwID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZSh0KSwgMCwgdCk7XG5cbiAgICAgICAgLy8gVXNlIHRoZSBzb3J0TWFwIHRvIHNvcnQgdGhlIG5ld1ZhbHVlc1xuICAgICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgc29ydE1hcCk7XG5cblxuICAgICAgICAvLyBVc2UgdGhlIHNvcnRNYXAgdG8gc29ydCB0aGUgdW5zb3J0ZWRJbmRleCBtYXBcbiAgICAgICAgLy8gbmV3SW5kZXggc2hvdWxkIGJlIGEgbWFwIG9mIHNvcnRlZFZhbHVlIC0+IGNyb3NzZmlsdGVyRGF0YVxuICAgICAgICBuZXdJbmRleCA9IHBlcm11dGUodW5zb3J0ZWRJbmRleCwgc29ydE1hcClcblxuICAgICAgfSBlbHNle1xuICAgICAgICAvLyBQZXJtdXRlIG5ldyB2YWx1ZXMgaW50byBuYXR1cmFsIG9yZGVyIHVzaW5nIGEgc3RhbmRhcmQgc29ydGVkIGluZGV4LlxuICAgICAgICBuZXdWYWx1ZXMgPSBuZXdEYXRhLm1hcCh2YWx1ZSk7XG4gICAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIG5ld0luZGV4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgbjEgPSB0O1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV07XG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGlmICghcmVmaWx0ZXJGdW5jdGlvbihuZXdWYWx1ZXNbaV0sIGkpKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsbzE7ICsraSkgeyBcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gaGkxOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGRpbWVuc2lvbiBwcmV2aW91c2x5IGhhZCBubyBkYXRhLCB0aGVuIHdlIGRvbid0IG5lZWQgdG8gZG8gdGhlXG4gICAgICAvLyBtb3JlIGV4cGVuc2l2ZSBtZXJnZSBvcGVyYXRpb247IHVzZSB0aGUgbmV3IHZhbHVlcyBhbmQgaW5kZXggYXMtaXMuXG4gICAgICBpZiAoIW4wKSB7XG4gICAgICAgIHZhbHVlcyA9IG5ld1ZhbHVlcztcbiAgICAgICAgaW5kZXggPSBuZXdJbmRleDtcbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudCA9IG5ld0l0ZXJhYmxlc0luZGV4Q291bnQ7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXM7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cblxuXG4gICAgICBvbGRWYWx1ZXMgPSB2YWx1ZXMsXG4gICAgICAgIG9sZEluZGV4ID0gaW5kZXgsXG4gICAgICAgIG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNcbiAgICAgICAgaTAgPSAwLFxuICAgICAgICBpMSA9IDA7XG5cbiAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgb2xkX24wID0gbjBcbiAgICAgICAgbjAgPSBvbGRWYWx1ZXMubGVuZ3RoO1xuICAgICAgICBuMSA9IHRcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgbmV3IGFycmF5cyBpbnRvIHdoaWNoIHRvIG1lcmdlIG5ldyBhbmQgb2xkLlxuICAgICAgdmFsdWVzID0gaXRlcmFibGUgPyBuZXcgQXJyYXkobjAgKyBuMSkgOiBuZXcgQXJyYXkobik7XG4gICAgICBpbmRleCA9IGl0ZXJhYmxlID8gbmV3IEFycmF5KG4wICsgbjEpIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7IFxuICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgobjAgKyBuMSwgMSk7IFxuICAgICAgXG4gICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgbmV3SXRlcmFibGVzSW5kZXhDb3VudCBvbnRvIHRoZSBvbGQgb25lLlxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgdmFyIG9sZGlpY2xlbmd0aCA9IGl0ZXJhYmxlc0luZGV4Q291bnQubGVuZ3RoO1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihpdGVyYWJsZXNJbmRleENvdW50LCBuKTtcbiAgICAgICAgZm9yKHZhciBqPTA7IGorb2xkaWljbGVuZ3RoIDwgbjsgaisrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtqK29sZGlpY2xlbmd0aF0gPSBuZXdJdGVyYWJsZXNJbmRleENvdW50W2pdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIHRoZSBvbGQgYW5kIG5ldyBzb3J0ZWQgdmFsdWVzLCBhbmQgb2xkIGFuZCBuZXcgaW5kZXguXG4gICAgICBmb3IgKGkgPSAwOyBpMCA8IG4wICYmIGkxIDwgbjE7ICsraSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTErK10gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgbmV3IHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMSA8IG4xOyArK2kxLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG9sZF9uMCA6IG4wKTtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyksIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFdoZW4gYWxsIGZpbHRlcnMgaGF2ZSB1cGRhdGVkLCBub3RpZnkgaW5kZXggbGlzdGVuZXJzIG9mIHRoZSBuZXcgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHBvc3RBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICBpbmRleExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpOyB9KTtcbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0luZGV4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhrID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhba107XG4gICAgICAgICAgKytqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZXMubGVuZ3RoID0gajtcbiAgICAgIHdoaWxlIChqIDwgbikgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG5cbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9LCBib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSBpbmRleC5sZW5ndGgpO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkID0gW107XG4gICAgICAgICAgXG4gICAgICAgICAgXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBsbyBpbmRleC5cbiAgICAgIGlmIChsbzEgPCBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8xLCBqID0gTWF0aC5taW4obG8wLCBoaTEpOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBoaSBpbmRleC5cbiAgICAgIGlmIChoaTEgPiBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8xLCBoaTApLCBqID0gaGkxOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaGkxIDwgaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMCwgaGkxKSwgaiA9IGhpMDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgLy8gRmxpcCBmaWx0ZXJzIG5vcm1hbGx5LlxuICAgICAgICBcbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIGl0ZXJhYmxlcywgd2UgbmVlZCB0byBmaWd1cmUgb3V0IGlmIHRoZSByb3cgaGFzIGJlZW4gY29tcGxldGVseSByZW1vdmVkIHZzIHBhcnRpYWxseSBpbmNsdWRlZFxuICAgICAgICAvLyBPbmx5IGNvdW50IGEgcm93IGFzIGFkZGVkIGlmIGl0IGlzIG5vdCBhbHJlYWR5IGJlaW5nIGFnZ3JlZ2F0ZWQuIE9ubHkgY291bnQgYSByb3dcbiAgICAgICAgLy8gYXMgcmVtb3ZlZCBpZiB0aGUgbGFzdCBlbGVtZW50IGJlaW5nIGFnZ3JlZ2F0ZWQgaXMgcmVtb3ZlZC5cblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPSAwO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dID09PSAxKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld0FkZGVkLnB1c2goYWRkZWRbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9IDE7XG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld1JlbW92ZWQucHVzaChyZW1vdmVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRlZCA9IG5ld0FkZGVkO1xuICAgICAgICByZW1vdmVkID0gbmV3UmVtb3ZlZDtcblxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IGluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIHRoZSBzcGVjaWZpZWQgcmFuZ2UsIHZhbHVlLCBvciBudWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBudWxsLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyQWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBhbiBhcnJheSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlclJhbmdlLlxuICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckV4YWN0LlxuICAgIGZ1bmN0aW9uIGZpbHRlcihyYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlID09IG51bGxcbiAgICAgICAgICA/IGZpbHRlckFsbCgpIDogQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgICA/IGZpbHRlclJhbmdlKHJhbmdlKSA6IHR5cGVvZiByYW5nZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBmaWx0ZXJGdW5jdGlvbihyYW5nZSlcbiAgICAgICAgICA6IGZpbHRlckV4YWN0KHJhbmdlKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgZXhhY3QgdmFsdWUuXG4gICAgZnVuY3Rpb24gZmlsdGVyRXhhY3QodmFsdWUpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIHNwZWNpZmllZCByYW5nZSBbbG8sIGhpXS5cbiAgICAvLyBUaGUgbG93ZXIgYm91bmQgaXMgaW5jbHVzaXZlLCBhbmQgdGhlIHVwcGVyIGJvdW5kIGlzIGV4Y2x1c2l2ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJSYW5nZShyYW5nZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhcnMgYW55IGZpbHRlcnMgb24gdGhpcyBkaW1lbnNpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyQWxsKCkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyBhbiBhcmJpdHJhcnkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyRnVuY3Rpb24oZikge1xuICAgICAgcmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGw7XG5cbiAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24ocmVmaWx0ZXJGdW5jdGlvbiA9IGYsIGZhbHNlKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmLCBmaWx0ZXJBbGwpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgeCxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIGluZGV4TGVuZ3RoID0gaW5kZXgubGVuZ3RoO1xuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgICAgaWYgKHgpIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICBlbHNlIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIFxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZihmKHZhbHVlc1tpXSwgaSkpIHtcbiAgICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJiBvbmUpIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJj0gemVybztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgZm9yKGk9MDsgaTxyZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gJiBvbmUpKSBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gfD0gb25lO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBcbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIHRoaXMgcGFydGljdWxhciB2YWx1ZSBuZWVkcyB0byBiZSBhZGRlZFxuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPT09IDEpIHsgIFxuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9IDA7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3QWRkZWQucHVzaChhZGRlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPT09IDApIHsgIFxuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXS0tXG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPSAxO1xuICAgICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICAgICAgICBuZXdSZW1vdmVkLnB1c2gocmVtb3ZlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkZWQgPSBuZXdBZGRlZDtcbiAgICAgICAgcmVtb3ZlZCA9IG5ld1JlbW92ZWQ7XG4gICAgICAgIFxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGZpbHRlckFsbCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHRvcCBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGhpMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoLS1pID49IGxvMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGogPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggJiYgayA+IDA7IGkrKykge1xuICAgICAgICAgIC8vIEFkZCBlbXB0eSByb3dzIGF0IHRoZSBlbmRcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGksXG4gICAgICAgICAgajtcblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgLy8gQWRkIGVtcHR5IHJvd3MgYXQgdGhlIHRvcFxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoICYmIGsgPiAwOyBpKyspIHtcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGkgPSBsbzA7XG5cbiAgICAgIHdoaWxlIChpIDwgaGkwICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIEFkZHMgYSBuZXcgZ3JvdXAgdG8gdGhpcyBkaW1lbnNpb24sIHVzaW5nIHRoZSBzcGVjaWZpZWQga2V5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGdyb3VwKGtleSkge1xuICAgICAgdmFyIGdyb3VwID0ge1xuICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgICBvcmRlcjogb3JkZXIsXG4gICAgICAgIG9yZGVyTmF0dXJhbDogb3JkZXJOYXR1cmFsLFxuICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICB9O1xuXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGdyb3VwIHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBkaW1lbnNpb24gaXMgcmVtb3ZlZC5cbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5wdXNoKGdyb3VwKTtcblxuICAgICAgdmFyIGdyb3VwcywgLy8gYXJyYXkgb2Yge2tleSwgdmFsdWV9XG4gICAgICAgICAgZ3JvdXBJbmRleCwgLy8gb2JqZWN0IGlkIOKGpiBncm91cCBpZFxuICAgICAgICAgIGdyb3VwV2lkdGggPSA4LFxuICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKSxcbiAgICAgICAgICBrID0gMCwgLy8gY2FyZGluYWxpdHlcbiAgICAgICAgICBzZWxlY3QsXG4gICAgICAgICAgaGVhcCxcbiAgICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlLFxuICAgICAgICAgIGdyb3VwQWxsID0ga2V5ID09PSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpIGtleSA9IGNyb3NzZmlsdGVyX2lkZW50aXR5O1xuXG4gICAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSBhc3NvY2lhdGVkIHJlZHVjZSB2YWx1ZXMuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG9cbiAgICAgIC8vIHRoZSBwYXJlbnQgZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQsIGFuZCBjb21wdXRlIG5ldyBrZXlzLlxuICAgICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICAgIGluZGV4TGlzdGVuZXJzLnB1c2goYWRkKTtcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGUgZ3JvdXBpbmcuXG4gICAgICBhZGQodmFsdWVzLCBpbmRleCwgMCwgbik7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZ3JvdXBzIGFuZCBncm91cEluZGV4LlxuICAgICAgZnVuY3Rpb24gYWRkKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSkge1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgICAgbjBvbGQgPSBuMFxuICAgICAgICAgIG4wID0gdmFsdWVzLmxlbmd0aCAtIG5ld1ZhbHVlcy5sZW5ndGhcbiAgICAgICAgICBuMSA9IG5ld1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgcmVJbmRleCA9IGl0ZXJhYmxlID8gW10gOiBjcm9zc2ZpbHRlcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIHJlbW92ZSA9IHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVtb3ZlID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyBncm91cEluZGV4IDogW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuXG4gICAgICAgICAgd2hpbGUgKHgxIDw9IHgpIHtcbiAgICAgICAgICAgIGogPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBuMG9sZCA6IG4wKVxuXG5cbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgICAgaWYoZ3JvdXBJbmRleFtqXSl7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXS5wdXNoKGspXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdID0gW2tdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHdheXMgYWRkIG5ldyB2YWx1ZXMgdG8gZ3JvdXBzLiBPbmx5IHJlbW92ZSB3aGVuIG5vdCBpbiBmaWx0ZXIuXG4gICAgICAgICAgICAvLyBUaGlzIGdpdmVzIGdyb3VwcyBmdWxsIGluZm9ybWF0aW9uIG9uIGRhdGEgbGlmZS1jeWNsZS5cbiAgICAgICAgICAgIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChqLCBvZmZzZXQsIHplcm8pKSBnLnZhbHVlID0gcmVtb3ZlKGcudmFsdWUsIGRhdGFbal0sIGZhbHNlKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoMWFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBGaWxsIGluIGdhcHMgd2l0aCBlbXB0eSBhcnJheXMgd2hlcmUgdGhlcmUgbWF5IGhhdmUgYmVlbiByb3dzIHdpdGggZW1wdHkgaXRlcmFibGVzXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBpZighZ3JvdXBJbmRleFtpXSl7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaV0gPSBbXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZihrID4gaTApe1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBwZXJtdXRlKGdyb3VwSW5kZXgsIHJlSW5kZXgsIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgaysrXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihncm91cEluZGV4LCBncm91cFdpZHRoKTtcbiAgICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdmFyIG9sZEsgPSBrLFxuICAgICAgICAgICAgICBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICAgIHNlZW5Hcm91cHMgPSBjcm9zc2ZpbHRlcl9pbmRleChvbGRLLCBvbGRLKTtcblxuICAgICAgICAgIC8vIEZpbHRlciBvdXQgbm9uLW1hdGNoZXMgYnkgY29weWluZyBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzIHRvXG4gICAgICAgICAgLy8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldXSA9IDE7XG4gICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWFzc2VtYmxlIGdyb3VwcyBpbmNsdWRpbmcgb25seSB0aG9zZSBncm91cHMgdGhhdCB3ZXJlIHJlZmVycmVkXG4gICAgICAgICAgLy8gdG8gYnkgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcy4gIE5vdGUgdGhlIG5ldyBncm91cCBpbmRleCBpblxuICAgICAgICAgIC8vIHNlZW5Hcm91cHMuXG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvbGRLOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzZWVuR3JvdXBzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbaV0gPSBrKys7XG4gICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKG9sZEdyb3Vwc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgICAvLyBSZWluZGV4IHRoZSBncm91cCBpbmRleCB1c2luZyBzZWVuR3JvdXBzIHRvIGZpbmQgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgajsgKytpKSBncm91cEluZGV4W2ldID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9IGsgPiAxXG4gICAgICAgICAgICAgID8gKHJlc2V0ID0gcmVzZXRNYW55LCB1cGRhdGUgPSB1cGRhdGVNYW55KVxuICAgICAgICAgICAgICA6IGsgPT09IDEgPyAocmVzZXQgPSByZXNldE9uZSwgdXBkYXRlID0gdXBkYXRlT25lKVxuICAgICAgICAgICAgICA6IHJlc2V0ID0gdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgaWYgKGdyb3VwQWxsKSByZXR1cm47XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIGlmICghZmlsdGVycy56ZXJvKGkpKSByZXR1cm47XG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9XG4gICAgICAgICAgdXBkYXRlID0gcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hbnkoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgICAgXG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtrXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhba10ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBSZXNldCBhbGwgZ3JvdXAgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSB7XG4gICAgICAgICAgZ3JvdXBzW2ldLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldW2pdXTtcbiAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGFycmF5IG9mIGdyb3VwIHZhbHVlcywgaW4gdGhlIGRpbWVuc2lvbidzIG5hdHVyYWwgb3JkZXIuXG4gICAgICBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgSyBncm91cCB2YWx1ZXMsIGluIHJlZHVjZSBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxlY3QoYWxsKCksIDAsIGdyb3Vwcy5sZW5ndGgsIGspO1xuICAgICAgICByZXR1cm4gaGVhcC5zb3J0KHRvcCwgMCwgdG9wLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlcywgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBvcmRlciwgdXNpbmcgdGhlIHNwZWNpZmllZCBhY2Nlc3Nvci5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyKHZhbHVlKSB7XG4gICAgICAgIHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkodmFsdWVPZik7XG4gICAgICAgIGhlYXAgPSBoZWFwX2J5KHZhbHVlT2YpO1xuICAgICAgICBmdW5jdGlvbiB2YWx1ZU9mKGQpIHsgcmV0dXJuIHZhbHVlKGQudmFsdWUpOyB9XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIG5hdHVyYWwgb3JkZXJpbmcgYnkgcmVkdWNlIHZhbHVlLlxuICAgICAgZnVuY3Rpb24gb3JkZXJOYXR1cmFsKCkge1xuICAgICAgICByZXR1cm4gb3JkZXIoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBjYXJkaW5hbGl0eSBvZiB0aGlzIGdyb3VwLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gICAgICBmdW5jdGlvbiBzaXplKCkge1xuICAgICAgICByZXR1cm4gaztcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IGluZGV4TGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgaW5kZXhMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVkdWNlQ291bnQoKS5vcmRlck5hdHVyYWwoKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBnZW5lcmF0aW5nIGEgc2luZ2xldG9uIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgICAgdmFyIGcgPSBncm91cChjcm9zc2ZpbHRlcl9udWxsKSwgYWxsID0gZy5hbGw7XG4gICAgICBkZWxldGUgZy5hbGw7XG4gICAgICBkZWxldGUgZy50b3A7XG4gICAgICBkZWxldGUgZy5vcmRlcjtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyTmF0dXJhbDtcbiAgICAgIGRlbGV0ZSBnLnNpemU7XG4gICAgICBnLnZhbHVlID0gZnVuY3Rpb24oKSB7IHJldHVybiBhbGwoKVswXS52YWx1ZTsgfTtcbiAgICAgIHJldHVybiBnO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBkaW1lbnNpb24gYW5kIGFzc29jaWF0ZWQgZ3JvdXBzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7IGdyb3VwLmRpc3Bvc2UoKTsgfSk7XG4gICAgICB2YXIgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwcmVBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHBvc3RBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBmaWx0ZXJzLm1hc2tzW29mZnNldF0gJj0gemVybztcbiAgICAgIHJldHVybiBmaWx0ZXJBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGltZW5zaW9uO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIGdyb3VwQWxsIG9uIGEgZHVtbXkgZGltZW5zaW9uLlxuICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGNhbiBiZSBvcHRpbWl6ZWQgc2luY2UgaXQgYWx3YXlzIGhhcyBjYXJkaW5hbGl0eSAxLlxuICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIHJlZHVjZVZhbHVlLFxuICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZS4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0byB0aGUgcGFyZW50XG4gICAgLy8gZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQuXG4gICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2goYWRkKTtcblxuICAgIC8vIEZvciBjb25zaXN0ZW5jeTsgYWN0dWFsbHkgYSBuby1vcCBzaW5jZSByZXNldE5lZWRlZCBpcyB0cnVlLlxuICAgIGFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGFkZChuZXdEYXRhLCBuMCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gbjA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICBuO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oayA9IGFkZGVkW2ldKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMub25seShrID0gcmVtb3ZlZFtpXSwgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWUgZnJvbSBzY3JhdGNoLlxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgaXQgaXMgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZSwgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgcmF3IHJvdyBkYXRhIGNvbnRhaW5lZCBpbiB0aGlzIGNyb3NzZmlsdGVyXG4gIGZ1bmN0aW9uIGFsbCgpe1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoY2Ipe1xuICAgIGlmKHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBjb25zb2xlLndhcm4oJ29uQ2hhbmdlIGNhbGxiYWNrIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhbGxiYWNrcy5wdXNoKGNiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoY2FsbGJhY2tzLmluZGV4T2YoY2IpLCAxKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlck9uQ2hhbmdlKGV2ZW50TmFtZSl7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrc1tpXShldmVudE5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IGFkZChhcmd1bWVudHNbMF0pXG4gICAgICA6IGNyb3NzZmlsdGVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIHNpemUgbiwgYmlnIGVub3VnaCB0byBzdG9yZSBpZHMgdXAgdG8gbS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2luZGV4KG4sIG0pIHtcbiAgcmV0dXJuIChtIDwgMHgxMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXk4IDogbSA8IDB4MTAwMDFcbiAgICAgID8gY3Jvc3NmaWx0ZXJfYXJyYXkxNlxuICAgICAgOiBjcm9zc2ZpbHRlcl9hcnJheTMyKShuKTtcbn1cblxuLy8gQ29uc3RydWN0cyBhIG5ldyBhcnJheSBvZiBzaXplIG4sIHdpdGggc2VxdWVudGlhbCB2YWx1ZXMgZnJvbSAwIHRvIG4gLSAxLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmFuZ2Uobikge1xuICB2YXIgcmFuZ2UgPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgZm9yICh2YXIgaSA9IC0xOyArK2kgPCBuOykgcmFuZ2VbaV0gPSBpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2NhcGFjaXR5KHcpIHtcbiAgcmV0dXJuIHcgPT09IDhcbiAgICAgID8gMHgxMDAgOiB3ID09PSAxNlxuICAgICAgPyAweDEwMDAwXG4gICAgICA6IDB4MTAwMDAwMDAwO1xufVxufSkodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnICYmIGV4cG9ydHMgfHwgdGhpcyk7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2Nyb3NzZmlsdGVyXCIpLmNyb3NzZmlsdGVyO1xuIiwiLyoqXG4gKiBsb2Rhc2ggKEN1c3RvbSBCdWlsZCkgPGh0dHBzOi8vbG9kYXNoLmNvbS8+XG4gKiBCdWlsZDogYGxvZGFzaCBtb2R1bGFyaXplIGV4cG9ydHM9XCJucG1cIiAtbyAuL2BcbiAqIENvcHlyaWdodCBqUXVlcnkgRm91bmRhdGlvbiBhbmQgb3RoZXIgY29udHJpYnV0b3JzIDxodHRwczovL2pxdWVyeS5vcmcvPlxuICogUmVsZWFzZWQgdW5kZXIgTUlUIGxpY2Vuc2UgPGh0dHBzOi8vbG9kYXNoLmNvbS9saWNlbnNlPlxuICogQmFzZWQgb24gVW5kZXJzY29yZS5qcyAxLjguMyA8aHR0cDovL3VuZGVyc2NvcmVqcy5vcmcvTElDRU5TRT5cbiAqIENvcHlyaWdodCBKZXJlbXkgQXNoa2VuYXMsIERvY3VtZW50Q2xvdWQgYW5kIEludmVzdGlnYXRpdmUgUmVwb3J0ZXJzICYgRWRpdG9yc1xuICovXG52YXIgYmFzZVRvU3RyaW5nID0gcmVxdWlyZSgnbG9kYXNoLl9iYXNldG9zdHJpbmcnKTtcblxuLyoqIFVzZWQgYXMgdGhlIGBUeXBlRXJyb3JgIG1lc3NhZ2UgZm9yIFwiRnVuY3Rpb25zXCIgbWV0aG9kcy4gKi9cbnZhciBGVU5DX0VSUk9SX1RFWFQgPSAnRXhwZWN0ZWQgYSBmdW5jdGlvbic7XG5cbi8qKiBVc2VkIHRvIHN0YW5kLWluIGZvciBgdW5kZWZpbmVkYCBoYXNoIHZhbHVlcy4gKi9cbnZhciBIQVNIX1VOREVGSU5FRCA9ICdfX2xvZGFzaF9oYXNoX3VuZGVmaW5lZF9fJztcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIGZ1bmNUYWcgPSAnW29iamVjdCBGdW5jdGlvbl0nLFxuICAgIGdlblRhZyA9ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cbi8qKiBVc2VkIHRvIG1hdGNoIHByb3BlcnR5IG5hbWVzIHdpdGhpbiBwcm9wZXJ0eSBwYXRocy4gKi9cbnZhciByZVByb3BOYW1lID0gL1teLltcXF1dK3xcXFsoPzooLT9cXGQrKD86XFwuXFxkKyk/KXwoW1wiJ10pKCg/Oig/IVxcMilbXlxcXFxdfFxcXFwuKSo/KVxcMilcXF0vZztcblxuLyoqXG4gKiBVc2VkIHRvIG1hdGNoIGBSZWdFeHBgXG4gKiBbc3ludGF4IGNoYXJhY3RlcnNdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXBhdHRlcm5zKS5cbiAqL1xudmFyIHJlUmVnRXhwQ2hhciA9IC9bXFxcXF4kLiorPygpW1xcXXt9fF0vZztcblxuLyoqIFVzZWQgdG8gbWF0Y2ggYmFja3NsYXNoZXMgaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVFc2NhcGVDaGFyID0gL1xcXFwoXFxcXCk/L2c7XG5cbi8qKiBVc2VkIHRvIGRldGVjdCBob3N0IGNvbnN0cnVjdG9ycyAoU2FmYXJpKS4gKi9cbnZhciByZUlzSG9zdEN0b3IgPSAvXlxcW29iamVjdCAuKz9Db25zdHJ1Y3RvclxcXSQvO1xuXG4vKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBgT2JqZWN0YC4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHtcbiAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWVcbn07XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG52YXIgZnJlZUV4cG9ydHMgPSAob2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUpXG4gID8gZXhwb3J0c1xuICA6IHVuZGVmaW5lZDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSAob2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUpXG4gID8gbW9kdWxlXG4gIDogdW5kZWZpbmVkO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSBjaGVja0dsb2JhbChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlICYmIHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IGNoZWNrR2xvYmFsKG9iamVjdFR5cGVzW3R5cGVvZiBzZWxmXSAmJiBzZWxmKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGB3aW5kb3dgLiAqL1xudmFyIGZyZWVXaW5kb3cgPSBjaGVja0dsb2JhbChvYmplY3RUeXBlc1t0eXBlb2Ygd2luZG93XSAmJiB3aW5kb3cpO1xuXG4vKiogRGV0ZWN0IGB0aGlzYCBhcyB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciB0aGlzR2xvYmFsID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHRoaXNdICYmIHRoaXMpO1xuXG4vKipcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gKlxuICogVGhlIGB0aGlzYCB2YWx1ZSBpcyB1c2VkIGlmIGl0J3MgdGhlIGdsb2JhbCBvYmplY3QgdG8gYXZvaWQgR3JlYXNlbW9ua2V5J3NcbiAqIHJlc3RyaWN0ZWQgYHdpbmRvd2Agb2JqZWN0LCBvdGhlcndpc2UgdGhlIGB3aW5kb3dgIG9iamVjdCBpcyB1c2VkLlxuICovXG52YXIgcm9vdCA9IGZyZWVHbG9iYWwgfHxcbiAgKChmcmVlV2luZG93ICE9PSAodGhpc0dsb2JhbCAmJiB0aGlzR2xvYmFsLndpbmRvdykpICYmIGZyZWVXaW5kb3cpIHx8XG4gICAgZnJlZVNlbGYgfHwgdGhpc0dsb2JhbCB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZ2xvYmFsIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7bnVsbHxPYmplY3R9IFJldHVybnMgYHZhbHVlYCBpZiBpdCdzIGEgZ2xvYmFsIG9iamVjdCwgZWxzZSBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrR2xvYmFsKHZhbHVlKSB7XG4gIHJldHVybiAodmFsdWUgJiYgdmFsdWUuT2JqZWN0ID09PSBPYmplY3QpID8gdmFsdWUgOiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgaG9zdCBvYmplY3QgaW4gSUUgPCA5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgaG9zdCBvYmplY3QsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNIb3N0T2JqZWN0KHZhbHVlKSB7XG4gIC8vIE1hbnkgaG9zdCBvYmplY3RzIGFyZSBgT2JqZWN0YCBvYmplY3RzIHRoYXQgY2FuIGNvZXJjZSB0byBzdHJpbmdzXG4gIC8vIGRlc3BpdGUgaGF2aW5nIGltcHJvcGVybHkgZGVmaW5lZCBgdG9TdHJpbmdgIG1ldGhvZHMuXG4gIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgaWYgKHZhbHVlICE9IG51bGwgJiYgdHlwZW9mIHZhbHVlLnRvU3RyaW5nICE9ICdmdW5jdGlvbicpIHtcbiAgICB0cnkge1xuICAgICAgcmVzdWx0ID0gISEodmFsdWUgKyAnJyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgYXJyYXlQcm90byA9IEFycmF5LnByb3RvdHlwZSxcbiAgICBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKiBVc2VkIHRvIHJlc29sdmUgdGhlIGRlY29tcGlsZWQgc291cmNlIG9mIGZ1bmN0aW9ucy4gKi9cbnZhciBmdW5jVG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cbi8qKiBVc2VkIHRvIGNoZWNrIG9iamVjdHMgZm9yIG93biBwcm9wZXJ0aWVzLiAqL1xudmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0UHJvdG8uaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKiogVXNlZCB0byBkZXRlY3QgaWYgYSBtZXRob2QgaXMgbmF0aXZlLiAqL1xudmFyIHJlSXNOYXRpdmUgPSBSZWdFeHAoJ14nICtcbiAgZnVuY1RvU3RyaW5nLmNhbGwoaGFzT3duUHJvcGVydHkpLnJlcGxhY2UocmVSZWdFeHBDaGFyLCAnXFxcXCQmJylcbiAgLnJlcGxhY2UoL2hhc093blByb3BlcnR5fChmdW5jdGlvbikuKj8oPz1cXFxcXFwoKXwgZm9yIC4rPyg/PVxcXFxcXF0pL2csICckMS4qPycpICsgJyQnXG4pO1xuXG4vKiogQnVpbHQtaW4gdmFsdWUgcmVmZXJlbmNlcy4gKi9cbnZhciBzcGxpY2UgPSBhcnJheVByb3RvLnNwbGljZTtcblxuLyogQnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMgdGhhdCBhcmUgdmVyaWZpZWQgdG8gYmUgbmF0aXZlLiAqL1xudmFyIE1hcCA9IGdldE5hdGl2ZShyb290LCAnTWFwJyksXG4gICAgbmF0aXZlQ3JlYXRlID0gZ2V0TmF0aXZlKE9iamVjdCwgJ2NyZWF0ZScpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBoYXNoIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge0FycmF5fSBbZW50cmllc10gVGhlIGtleS12YWx1ZSBwYWlycyB0byBjYWNoZS5cbiAqL1xuZnVuY3Rpb24gSGFzaChlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA/IGVudHJpZXMubGVuZ3RoIDogMDtcblxuICB0aGlzLmNsZWFyKCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIGhhc2guXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGNsZWFyXG4gKiBAbWVtYmVyT2YgSGFzaFxuICovXG5mdW5jdGlvbiBoYXNoQ2xlYXIoKSB7XG4gIHRoaXMuX19kYXRhX18gPSBuYXRpdmVDcmVhdGUgPyBuYXRpdmVDcmVhdGUobnVsbCkgOiB7fTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgaGFzaC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZGVsZXRlXG4gKiBAbWVtYmVyT2YgSGFzaFxuICogQHBhcmFtIHtPYmplY3R9IGhhc2ggVGhlIGhhc2ggdG8gbW9kaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZW1vdmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGhhc2hEZWxldGUoa2V5KSB7XG4gIHJldHVybiB0aGlzLmhhcyhrZXkpICYmIGRlbGV0ZSB0aGlzLl9fZGF0YV9fW2tleV07XG59XG5cbi8qKlxuICogR2V0cyB0aGUgaGFzaCB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIEhhc2hcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGVudHJ5IHZhbHVlLlxuICovXG5mdW5jdGlvbiBoYXNoR2V0KGtleSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGlmIChuYXRpdmVDcmVhdGUpIHtcbiAgICB2YXIgcmVzdWx0ID0gZGF0YVtrZXldO1xuICAgIHJldHVybiByZXN1bHQgPT09IEhBU0hfVU5ERUZJTkVEID8gdW5kZWZpbmVkIDogcmVzdWx0O1xuICB9XG4gIHJldHVybiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkgPyBkYXRhW2tleV0gOiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgaGFzaCB2YWx1ZSBmb3IgYGtleWAgZXhpc3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBoYXNcbiAqIEBtZW1iZXJPZiBIYXNoXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaGFzaEhhcyhrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fO1xuICByZXR1cm4gbmF0aXZlQ3JlYXRlID8gZGF0YVtrZXldICE9PSB1bmRlZmluZWQgOiBoYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaGFzaCBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBIYXNoXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIGhhc2ggaW5zdGFuY2UuXG4gKi9cbmZ1bmN0aW9uIGhhc2hTZXQoa2V5LCB2YWx1ZSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX187XG4gIGRhdGFba2V5XSA9IChuYXRpdmVDcmVhdGUgJiYgdmFsdWUgPT09IHVuZGVmaW5lZCkgPyBIQVNIX1VOREVGSU5FRCA6IHZhbHVlO1xuICByZXR1cm4gdGhpcztcbn1cblxuLy8gQWRkIG1ldGhvZHMgdG8gYEhhc2hgLlxuSGFzaC5wcm90b3R5cGUuY2xlYXIgPSBoYXNoQ2xlYXI7XG5IYXNoLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBoYXNoRGVsZXRlO1xuSGFzaC5wcm90b3R5cGUuZ2V0ID0gaGFzaEdldDtcbkhhc2gucHJvdG90eXBlLmhhcyA9IGhhc2hIYXM7XG5IYXNoLnByb3RvdHlwZS5zZXQgPSBoYXNoU2V0O1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gbGlzdCBjYWNoZSBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gW2VudHJpZXNdIFRoZSBrZXktdmFsdWUgcGFpcnMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIExpc3RDYWNoZShlbnRyaWVzKSB7XG4gIHZhciBpbmRleCA9IC0xLFxuICAgICAgbGVuZ3RoID0gZW50cmllcyA/IGVudHJpZXMubGVuZ3RoIDogMDtcblxuICB0aGlzLmNsZWFyKCk7XG4gIHdoaWxlICgrK2luZGV4IDwgbGVuZ3RoKSB7XG4gICAgdmFyIGVudHJ5ID0gZW50cmllc1tpbmRleF07XG4gICAgdGhpcy5zZXQoZW50cnlbMF0sIGVudHJ5WzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZXMgYWxsIGtleS12YWx1ZSBlbnRyaWVzIGZyb20gdGhlIGxpc3QgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGNsZWFyXG4gKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZUNsZWFyKCkge1xuICB0aGlzLl9fZGF0YV9fID0gW107XG59XG5cbi8qKlxuICogUmVtb3ZlcyBga2V5YCBhbmQgaXRzIHZhbHVlIGZyb20gdGhlIGxpc3QgY2FjaGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGRlbGV0ZVxuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZW1vdmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZURlbGV0ZShrZXkpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcblxuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBsYXN0SW5kZXggPSBkYXRhLmxlbmd0aCAtIDE7XG4gIGlmIChpbmRleCA9PSBsYXN0SW5kZXgpIHtcbiAgICBkYXRhLnBvcCgpO1xuICB9IGVsc2Uge1xuICAgIHNwbGljZS5jYWxsKGRhdGEsIGluZGV4LCAxKTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBsaXN0IGNhY2hlIHZhbHVlIGZvciBga2V5YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQG5hbWUgZ2V0XG4gKiBAbWVtYmVyT2YgTGlzdENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbGlzdENhY2hlR2V0KGtleSkge1xuICB2YXIgZGF0YSA9IHRoaXMuX19kYXRhX18sXG4gICAgICBpbmRleCA9IGFzc29jSW5kZXhPZihkYXRhLCBrZXkpO1xuXG4gIHJldHVybiBpbmRleCA8IDAgPyB1bmRlZmluZWQgOiBkYXRhW2luZGV4XVsxXTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYSBsaXN0IGNhY2hlIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGhhc1xuICogQG1lbWJlck9mIExpc3RDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBlbnRyeSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBhbiBlbnRyeSBmb3IgYGtleWAgZXhpc3RzLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGxpc3RDYWNoZUhhcyhrZXkpIHtcbiAgcmV0dXJuIGFzc29jSW5kZXhPZih0aGlzLl9fZGF0YV9fLCBrZXkpID4gLTE7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbGlzdCBjYWNoZSBga2V5YCB0byBgdmFsdWVgLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBzZXRcbiAqIEBtZW1iZXJPZiBMaXN0Q2FjaGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gc2V0LlxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gc2V0LlxuICogQHJldHVybnMge09iamVjdH0gUmV0dXJucyB0aGUgbGlzdCBjYWNoZSBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gbGlzdENhY2hlU2V0KGtleSwgdmFsdWUpIHtcbiAgdmFyIGRhdGEgPSB0aGlzLl9fZGF0YV9fLFxuICAgICAgaW5kZXggPSBhc3NvY0luZGV4T2YoZGF0YSwga2V5KTtcblxuICBpZiAoaW5kZXggPCAwKSB7XG4gICAgZGF0YS5wdXNoKFtrZXksIHZhbHVlXSk7XG4gIH0gZWxzZSB7XG4gICAgZGF0YVtpbmRleF1bMV0gPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gdGhpcztcbn1cblxuLy8gQWRkIG1ldGhvZHMgdG8gYExpc3RDYWNoZWAuXG5MaXN0Q2FjaGUucHJvdG90eXBlLmNsZWFyID0gbGlzdENhY2hlQ2xlYXI7XG5MaXN0Q2FjaGUucHJvdG90eXBlWydkZWxldGUnXSA9IGxpc3RDYWNoZURlbGV0ZTtcbkxpc3RDYWNoZS5wcm90b3R5cGUuZ2V0ID0gbGlzdENhY2hlR2V0O1xuTGlzdENhY2hlLnByb3RvdHlwZS5oYXMgPSBsaXN0Q2FjaGVIYXM7XG5MaXN0Q2FjaGUucHJvdG90eXBlLnNldCA9IGxpc3RDYWNoZVNldDtcblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFwIGNhY2hlIG9iamVjdCB0byBzdG9yZSBrZXktdmFsdWUgcGFpcnMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gW2VudHJpZXNdIFRoZSBrZXktdmFsdWUgcGFpcnMgdG8gY2FjaGUuXG4gKi9cbmZ1bmN0aW9uIE1hcENhY2hlKGVudHJpZXMpIHtcbiAgdmFyIGluZGV4ID0gLTEsXG4gICAgICBsZW5ndGggPSBlbnRyaWVzID8gZW50cmllcy5sZW5ndGggOiAwO1xuXG4gIHRoaXMuY2xlYXIoKTtcbiAgd2hpbGUgKCsraW5kZXggPCBsZW5ndGgpIHtcbiAgICB2YXIgZW50cnkgPSBlbnRyaWVzW2luZGV4XTtcbiAgICB0aGlzLnNldChlbnRyeVswXSwgZW50cnlbMV0pO1xuICB9XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhbGwga2V5LXZhbHVlIGVudHJpZXMgZnJvbSB0aGUgbWFwLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBjbGVhclxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlQ2xlYXIoKSB7XG4gIHRoaXMuX19kYXRhX18gPSB7XG4gICAgJ2hhc2gnOiBuZXcgSGFzaCxcbiAgICAnbWFwJzogbmV3IChNYXAgfHwgTGlzdENhY2hlKSxcbiAgICAnc3RyaW5nJzogbmV3IEhhc2hcbiAgfTtcbn1cblxuLyoqXG4gKiBSZW1vdmVzIGBrZXlgIGFuZCBpdHMgdmFsdWUgZnJvbSB0aGUgbWFwLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAbmFtZSBkZWxldGVcbiAqIEBtZW1iZXJPZiBNYXBDYWNoZVxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZW1vdmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIGVudHJ5IHdhcyByZW1vdmVkLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIG1hcENhY2hlRGVsZXRlKGtleSkge1xuICByZXR1cm4gZ2V0TWFwRGF0YSh0aGlzLCBrZXkpWydkZWxldGUnXShrZXkpO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIG1hcCB2YWx1ZSBmb3IgYGtleWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGdldFxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIGdldC5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBlbnRyeSB2YWx1ZS5cbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVHZXQoa2V5KSB7XG4gIHJldHVybiBnZXRNYXBEYXRhKHRoaXMsIGtleSkuZ2V0KGtleSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGEgbWFwIHZhbHVlIGZvciBga2V5YCBleGlzdHMuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIGhhc1xuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIGVudHJ5IHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGFuIGVudHJ5IGZvciBga2V5YCBleGlzdHMsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVIYXMoa2V5KSB7XG4gIHJldHVybiBnZXRNYXBEYXRhKHRoaXMsIGtleSkuaGFzKGtleSk7XG59XG5cbi8qKlxuICogU2V0cyB0aGUgbWFwIGBrZXlgIHRvIGB2YWx1ZWAuXG4gKlxuICogQHByaXZhdGVcbiAqIEBuYW1lIHNldFxuICogQG1lbWJlck9mIE1hcENhY2hlXG4gKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBrZXkgb2YgdGhlIHZhbHVlIHRvIHNldC5cbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIHNldC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IFJldHVybnMgdGhlIG1hcCBjYWNoZSBpbnN0YW5jZS5cbiAqL1xuZnVuY3Rpb24gbWFwQ2FjaGVTZXQoa2V5LCB2YWx1ZSkge1xuICBnZXRNYXBEYXRhKHRoaXMsIGtleSkuc2V0KGtleSwgdmFsdWUpO1xuICByZXR1cm4gdGhpcztcbn1cblxuLy8gQWRkIG1ldGhvZHMgdG8gYE1hcENhY2hlYC5cbk1hcENhY2hlLnByb3RvdHlwZS5jbGVhciA9IG1hcENhY2hlQ2xlYXI7XG5NYXBDYWNoZS5wcm90b3R5cGVbJ2RlbGV0ZSddID0gbWFwQ2FjaGVEZWxldGU7XG5NYXBDYWNoZS5wcm90b3R5cGUuZ2V0ID0gbWFwQ2FjaGVHZXQ7XG5NYXBDYWNoZS5wcm90b3R5cGUuaGFzID0gbWFwQ2FjaGVIYXM7XG5NYXBDYWNoZS5wcm90b3R5cGUuc2V0ID0gbWFwQ2FjaGVTZXQ7XG5cbi8qKlxuICogR2V0cyB0aGUgaW5kZXggYXQgd2hpY2ggdGhlIGBrZXlgIGlzIGZvdW5kIGluIGBhcnJheWAgb2Yga2V5LXZhbHVlIHBhaXJzLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gc2VhcmNoLlxuICogQHBhcmFtIHsqfSBrZXkgVGhlIGtleSB0byBzZWFyY2ggZm9yLlxuICogQHJldHVybnMge251bWJlcn0gUmV0dXJucyB0aGUgaW5kZXggb2YgdGhlIG1hdGNoZWQgdmFsdWUsIGVsc2UgYC0xYC5cbiAqL1xuZnVuY3Rpb24gYXNzb2NJbmRleE9mKGFycmF5LCBrZXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKGxlbmd0aC0tKSB7XG4gICAgaWYgKGVxKGFycmF5W2xlbmd0aF1bMF0sIGtleSkpIHtcbiAgICAgIHJldHVybiBsZW5ndGg7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBkYXRhIGZvciBgbWFwYC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG1hcCBUaGUgbWFwIHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgcmVmZXJlbmNlIGtleS5cbiAqIEByZXR1cm5zIHsqfSBSZXR1cm5zIHRoZSBtYXAgZGF0YS5cbiAqL1xuZnVuY3Rpb24gZ2V0TWFwRGF0YShtYXAsIGtleSkge1xuICB2YXIgZGF0YSA9IG1hcC5fX2RhdGFfXztcbiAgcmV0dXJuIGlzS2V5YWJsZShrZXkpXG4gICAgPyBkYXRhW3R5cGVvZiBrZXkgPT0gJ3N0cmluZycgPyAnc3RyaW5nJyA6ICdoYXNoJ11cbiAgICA6IGRhdGEubWFwO1xufVxuXG4vKipcbiAqIEdldHMgdGhlIG5hdGl2ZSBmdW5jdGlvbiBhdCBga2V5YCBvZiBgb2JqZWN0YC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUga2V5IG9mIHRoZSBtZXRob2QgdG8gZ2V0LlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIGZ1bmN0aW9uIGlmIGl0J3MgbmF0aXZlLCBlbHNlIGB1bmRlZmluZWRgLlxuICovXG5mdW5jdGlvbiBnZXROYXRpdmUob2JqZWN0LCBrZXkpIHtcbiAgdmFyIHZhbHVlID0gb2JqZWN0W2tleV07XG4gIHJldHVybiBpc05hdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBzdWl0YWJsZSBmb3IgdXNlIGFzIHVuaXF1ZSBvYmplY3Qga2V5LlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIHN1aXRhYmxlLCBlbHNlIGBmYWxzZWAuXG4gKi9cbmZ1bmN0aW9uIGlzS2V5YWJsZSh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICh0eXBlID09ICdzdHJpbmcnIHx8IHR5cGUgPT0gJ251bWJlcicgfHwgdHlwZSA9PSAnc3ltYm9sJyB8fCB0eXBlID09ICdib29sZWFuJylcbiAgICA/ICh2YWx1ZSAhPT0gJ19fcHJvdG9fXycpXG4gICAgOiAodmFsdWUgPT09IG51bGwpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGBzdHJpbmdgIHRvIGEgcHJvcGVydHkgcGF0aCBhcnJheS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUaGUgc3RyaW5nIHRvIGNvbnZlcnQuXG4gKiBAcmV0dXJucyB7QXJyYXl9IFJldHVybnMgdGhlIHByb3BlcnR5IHBhdGggYXJyYXkuXG4gKi9cbnZhciBzdHJpbmdUb1BhdGggPSBtZW1vaXplKGZ1bmN0aW9uKHN0cmluZykge1xuICB2YXIgcmVzdWx0ID0gW107XG4gIHRvU3RyaW5nKHN0cmluZykucmVwbGFjZShyZVByb3BOYW1lLCBmdW5jdGlvbihtYXRjaCwgbnVtYmVyLCBxdW90ZSwgc3RyaW5nKSB7XG4gICAgcmVzdWx0LnB1c2gocXVvdGUgPyBzdHJpbmcucmVwbGFjZShyZUVzY2FwZUNoYXIsICckMScpIDogKG51bWJlciB8fCBtYXRjaCkpO1xuICB9KTtcbiAgcmV0dXJuIHJlc3VsdDtcbn0pO1xuXG4vKipcbiAqIENvbnZlcnRzIGBmdW5jYCB0byBpdHMgc291cmNlIGNvZGUuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIHByb2Nlc3MuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBSZXR1cm5zIHRoZSBzb3VyY2UgY29kZS5cbiAqL1xuZnVuY3Rpb24gdG9Tb3VyY2UoZnVuYykge1xuICBpZiAoZnVuYyAhPSBudWxsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmdW5jVG9TdHJpbmcuY2FsbChmdW5jKTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gKGZ1bmMgKyAnJyk7XG4gICAgfSBjYXRjaCAoZSkge31cbiAgfVxuICByZXR1cm4gJyc7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGZ1bmN0aW9uIHRoYXQgbWVtb2l6ZXMgdGhlIHJlc3VsdCBvZiBgZnVuY2AuIElmIGByZXNvbHZlcmAgaXNcbiAqIHByb3ZpZGVkLCBpdCBkZXRlcm1pbmVzIHRoZSBjYWNoZSBrZXkgZm9yIHN0b3JpbmcgdGhlIHJlc3VsdCBiYXNlZCBvbiB0aGVcbiAqIGFyZ3VtZW50cyBwcm92aWRlZCB0byB0aGUgbWVtb2l6ZWQgZnVuY3Rpb24uIEJ5IGRlZmF1bHQsIHRoZSBmaXJzdCBhcmd1bWVudFxuICogcHJvdmlkZWQgdG8gdGhlIG1lbW9pemVkIGZ1bmN0aW9uIGlzIHVzZWQgYXMgdGhlIG1hcCBjYWNoZSBrZXkuIFRoZSBgZnVuY2BcbiAqIGlzIGludm9rZWQgd2l0aCB0aGUgYHRoaXNgIGJpbmRpbmcgb2YgdGhlIG1lbW9pemVkIGZ1bmN0aW9uLlxuICpcbiAqICoqTm90ZToqKiBUaGUgY2FjaGUgaXMgZXhwb3NlZCBhcyB0aGUgYGNhY2hlYCBwcm9wZXJ0eSBvbiB0aGUgbWVtb2l6ZWRcbiAqIGZ1bmN0aW9uLiBJdHMgY3JlYXRpb24gbWF5IGJlIGN1c3RvbWl6ZWQgYnkgcmVwbGFjaW5nIHRoZSBgXy5tZW1vaXplLkNhY2hlYFxuICogY29uc3RydWN0b3Igd2l0aCBvbmUgd2hvc2UgaW5zdGFuY2VzIGltcGxlbWVudCB0aGVcbiAqIFtgTWFwYF0oaHR0cDovL2VjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtcHJvcGVydGllcy1vZi10aGUtbWFwLXByb3RvdHlwZS1vYmplY3QpXG4gKiBtZXRob2QgaW50ZXJmYWNlIG9mIGBkZWxldGVgLCBgZ2V0YCwgYGhhc2AsIGFuZCBgc2V0YC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgRnVuY3Rpb25cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGZ1bmN0aW9uIHRvIGhhdmUgaXRzIG91dHB1dCBtZW1vaXplZC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IFtyZXNvbHZlcl0gVGhlIGZ1bmN0aW9uIHRvIHJlc29sdmUgdGhlIGNhY2hlIGtleS5cbiAqIEByZXR1cm5zIHtGdW5jdGlvbn0gUmV0dXJucyB0aGUgbmV3IG1lbW9pemVkIGZ1bmN0aW9uLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IDEsICdiJzogMiB9O1xuICogdmFyIG90aGVyID0geyAnYyc6IDMsICdkJzogNCB9O1xuICpcbiAqIHZhciB2YWx1ZXMgPSBfLm1lbW9pemUoXy52YWx1ZXMpO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiB2YWx1ZXMob3RoZXIpO1xuICogLy8gPT4gWzMsIDRdXG4gKlxuICogb2JqZWN0LmEgPSAyO1xuICogdmFsdWVzKG9iamVjdCk7XG4gKiAvLyA9PiBbMSwgMl1cbiAqXG4gKiAvLyBNb2RpZnkgdGhlIHJlc3VsdCBjYWNoZS5cbiAqIHZhbHVlcy5jYWNoZS5zZXQob2JqZWN0LCBbJ2EnLCAnYiddKTtcbiAqIHZhbHVlcyhvYmplY3QpO1xuICogLy8gPT4gWydhJywgJ2InXVxuICpcbiAqIC8vIFJlcGxhY2UgYF8ubWVtb2l6ZS5DYWNoZWAuXG4gKiBfLm1lbW9pemUuQ2FjaGUgPSBXZWFrTWFwO1xuICovXG5mdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyKSB7XG4gIGlmICh0eXBlb2YgZnVuYyAhPSAnZnVuY3Rpb24nIHx8IChyZXNvbHZlciAmJiB0eXBlb2YgcmVzb2x2ZXIgIT0gJ2Z1bmN0aW9uJykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEZVTkNfRVJST1JfVEVYVCk7XG4gIH1cbiAgdmFyIG1lbW9pemVkID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHMsXG4gICAgICAgIGtleSA9IHJlc29sdmVyID8gcmVzb2x2ZXIuYXBwbHkodGhpcywgYXJncykgOiBhcmdzWzBdLFxuICAgICAgICBjYWNoZSA9IG1lbW9pemVkLmNhY2hlO1xuXG4gICAgaWYgKGNhY2hlLmhhcyhrZXkpKSB7XG4gICAgICByZXR1cm4gY2FjaGUuZ2V0KGtleSk7XG4gICAgfVxuICAgIHZhciByZXN1bHQgPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIG1lbW9pemVkLmNhY2hlID0gY2FjaGUuc2V0KGtleSwgcmVzdWx0KTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuICBtZW1vaXplZC5jYWNoZSA9IG5ldyAobWVtb2l6ZS5DYWNoZSB8fCBNYXBDYWNoZSk7XG4gIHJldHVybiBtZW1vaXplZDtcbn1cblxuLy8gQXNzaWduIGNhY2hlIHRvIGBfLm1lbW9pemVgLlxubWVtb2l6ZS5DYWNoZSA9IE1hcENhY2hlO1xuXG4vKipcbiAqIFBlcmZvcm1zIGFcbiAqIFtgU2FtZVZhbHVlWmVyb2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLXNhbWV2YWx1ZXplcm8pXG4gKiBjb21wYXJpc29uIGJldHdlZW4gdHdvIHZhbHVlcyB0byBkZXRlcm1pbmUgaWYgdGhleSBhcmUgZXF1aXZhbGVudC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY29tcGFyZS5cbiAqIEBwYXJhbSB7Kn0gb3RoZXIgVGhlIG90aGVyIHZhbHVlIHRvIGNvbXBhcmUuXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAndXNlcic6ICdmcmVkJyB9O1xuICogdmFyIG90aGVyID0geyAndXNlcic6ICdmcmVkJyB9O1xuICpcbiAqIF8uZXEob2JqZWN0LCBvYmplY3QpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEob2JqZWN0LCBvdGhlcik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoJ2EnLCAnYScpO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uZXEoJ2EnLCBPYmplY3QoJ2EnKSk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uZXEoTmFOLCBOYU4pO1xuICogLy8gPT4gdHJ1ZVxuICovXG5mdW5jdGlvbiBlcSh2YWx1ZSwgb3RoZXIpIHtcbiAgcmV0dXJuIHZhbHVlID09PSBvdGhlciB8fCAodmFsdWUgIT09IHZhbHVlICYmIG90aGVyICE9PSBvdGhlcik7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBGdW5jdGlvbmAgb2JqZWN0LlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGNvcnJlY3RseSBjbGFzc2lmaWVkLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc0Z1bmN0aW9uKF8pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNGdW5jdGlvbigvYWJjLyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG4gIC8vIFRoZSB1c2Ugb2YgYE9iamVjdCN0b1N0cmluZ2AgYXZvaWRzIGlzc3VlcyB3aXRoIHRoZSBgdHlwZW9mYCBvcGVyYXRvclxuICAvLyBpbiBTYWZhcmkgOCB3aGljaCByZXR1cm5zICdvYmplY3QnIGZvciB0eXBlZCBhcnJheSBhbmQgd2VhayBtYXAgY29uc3RydWN0b3JzLFxuICAvLyBhbmQgUGhhbnRvbUpTIDEuOSB3aGljaCByZXR1cm5zICdmdW5jdGlvbicgZm9yIGBOb2RlTGlzdGAgaW5zdGFuY2VzLlxuICB2YXIgdGFnID0gaXNPYmplY3QodmFsdWUpID8gb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgOiAnJztcbiAgcmV0dXJuIHRhZyA9PSBmdW5jVGFnIHx8IHRhZyA9PSBnZW5UYWc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgdGhlXG4gKiBbbGFuZ3VhZ2UgdHlwZV0oaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMpXG4gKiBvZiBgT2JqZWN0YC4gKGUuZy4gYXJyYXlzLCBmdW5jdGlvbnMsIG9iamVjdHMsIHJlZ2V4ZXMsIGBuZXcgTnVtYmVyKDApYCwgYW5kIGBuZXcgU3RyaW5nKCcnKWApXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgYW4gb2JqZWN0LCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3Qoe30pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KF8ubm9vcCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gIHZhciB0eXBlID0gdHlwZW9mIHZhbHVlO1xuICByZXR1cm4gISF2YWx1ZSAmJiAodHlwZSA9PSAnb2JqZWN0JyB8fCB0eXBlID09ICdmdW5jdGlvbicpO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMy4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGEgbmF0aXZlIGZ1bmN0aW9uLFxuICogIGVsc2UgYGZhbHNlYC5cbiAqIEBleGFtcGxlXG4gKlxuICogXy5pc05hdGl2ZShBcnJheS5wcm90b3R5cGUucHVzaCk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc05hdGl2ZShfKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzTmF0aXZlKHZhbHVlKSB7XG4gIGlmICghaXNPYmplY3QodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHZhciBwYXR0ZXJuID0gKGlzRnVuY3Rpb24odmFsdWUpIHx8IGlzSG9zdE9iamVjdCh2YWx1ZSkpID8gcmVJc05hdGl2ZSA6IHJlSXNIb3N0Q3RvcjtcbiAgcmV0dXJuIHBhdHRlcm4udGVzdCh0b1NvdXJjZSh2YWx1ZSkpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGB2YWx1ZWAgdG8gYSBzdHJpbmcuIEFuIGVtcHR5IHN0cmluZyBpcyByZXR1cm5lZCBmb3IgYG51bGxgXG4gKiBhbmQgYHVuZGVmaW5lZGAgdmFsdWVzLiBUaGUgc2lnbiBvZiBgLTBgIGlzIHByZXNlcnZlZC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqIEBleGFtcGxlXG4gKlxuICogXy50b1N0cmluZyhudWxsKTtcbiAqIC8vID0+ICcnXG4gKlxuICogXy50b1N0cmluZygtMCk7XG4gKiAvLyA9PiAnLTAnXG4gKlxuICogXy50b1N0cmluZyhbMSwgMiwgM10pO1xuICogLy8gPT4gJzEsMiwzJ1xuICovXG5mdW5jdGlvbiB0b1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUgPT0gbnVsbCA/ICcnIDogYmFzZVRvU3RyaW5nKHZhbHVlKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdHJpbmdUb1BhdGg7XG4iLCIvKipcbiAqIGxvZGFzaCAoQ3VzdG9tIEJ1aWxkKSA8aHR0cHM6Ly9sb2Rhc2guY29tLz5cbiAqIEJ1aWxkOiBgbG9kYXNoIG1vZHVsYXJpemUgZXhwb3J0cz1cIm5wbVwiIC1vIC4vYFxuICogQ29weXJpZ2h0IGpRdWVyeSBGb3VuZGF0aW9uIGFuZCBvdGhlciBjb250cmlidXRvcnMgPGh0dHBzOi8vanF1ZXJ5Lm9yZy8+XG4gKiBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZSA8aHR0cHM6Ly9sb2Rhc2guY29tL2xpY2Vuc2U+XG4gKiBCYXNlZCBvbiBVbmRlcnNjb3JlLmpzIDEuOC4zIDxodHRwOi8vdW5kZXJzY29yZWpzLm9yZy9MSUNFTlNFPlxuICogQ29weXJpZ2h0IEplcmVteSBBc2hrZW5hcywgRG9jdW1lbnRDbG91ZCBhbmQgSW52ZXN0aWdhdGl2ZSBSZXBvcnRlcnMgJiBFZGl0b3JzXG4gKi9cblxuLyoqIFVzZWQgYXMgcmVmZXJlbmNlcyBmb3IgdmFyaW91cyBgTnVtYmVyYCBjb25zdGFudHMuICovXG52YXIgSU5GSU5JVFkgPSAxIC8gMDtcblxuLyoqIGBPYmplY3QjdG9TdHJpbmdgIHJlc3VsdCByZWZlcmVuY2VzLiAqL1xudmFyIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCB0byBkZXRlcm1pbmUgaWYgdmFsdWVzIGFyZSBvZiB0aGUgbGFuZ3VhZ2UgdHlwZSBgT2JqZWN0YC4gKi9cbnZhciBvYmplY3RUeXBlcyA9IHtcbiAgJ2Z1bmN0aW9uJzogdHJ1ZSxcbiAgJ29iamVjdCc6IHRydWVcbn07XG5cbi8qKiBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZXhwb3J0c2AuICovXG52YXIgZnJlZUV4cG9ydHMgPSAob2JqZWN0VHlwZXNbdHlwZW9mIGV4cG9ydHNdICYmIGV4cG9ydHMgJiYgIWV4cG9ydHMubm9kZVR5cGUpXG4gID8gZXhwb3J0c1xuICA6IHVuZGVmaW5lZDtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgLiAqL1xudmFyIGZyZWVNb2R1bGUgPSAob2JqZWN0VHlwZXNbdHlwZW9mIG1vZHVsZV0gJiYgbW9kdWxlICYmICFtb2R1bGUubm9kZVR5cGUpXG4gID8gbW9kdWxlXG4gIDogdW5kZWZpbmVkO1xuXG4vKiogRGV0ZWN0IGZyZWUgdmFyaWFibGUgYGdsb2JhbGAgZnJvbSBOb2RlLmpzLiAqL1xudmFyIGZyZWVHbG9iYWwgPSBjaGVja0dsb2JhbChmcmVlRXhwb3J0cyAmJiBmcmVlTW9kdWxlICYmIHR5cGVvZiBnbG9iYWwgPT0gJ29iamVjdCcgJiYgZ2xvYmFsKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGBzZWxmYC4gKi9cbnZhciBmcmVlU2VsZiA9IGNoZWNrR2xvYmFsKG9iamVjdFR5cGVzW3R5cGVvZiBzZWxmXSAmJiBzZWxmKTtcblxuLyoqIERldGVjdCBmcmVlIHZhcmlhYmxlIGB3aW5kb3dgLiAqL1xudmFyIGZyZWVXaW5kb3cgPSBjaGVja0dsb2JhbChvYmplY3RUeXBlc1t0eXBlb2Ygd2luZG93XSAmJiB3aW5kb3cpO1xuXG4vKiogRGV0ZWN0IGB0aGlzYCBhcyB0aGUgZ2xvYmFsIG9iamVjdC4gKi9cbnZhciB0aGlzR2xvYmFsID0gY2hlY2tHbG9iYWwob2JqZWN0VHlwZXNbdHlwZW9mIHRoaXNdICYmIHRoaXMpO1xuXG4vKipcbiAqIFVzZWQgYXMgYSByZWZlcmVuY2UgdG8gdGhlIGdsb2JhbCBvYmplY3QuXG4gKlxuICogVGhlIGB0aGlzYCB2YWx1ZSBpcyB1c2VkIGlmIGl0J3MgdGhlIGdsb2JhbCBvYmplY3QgdG8gYXZvaWQgR3JlYXNlbW9ua2V5J3NcbiAqIHJlc3RyaWN0ZWQgYHdpbmRvd2Agb2JqZWN0LCBvdGhlcndpc2UgdGhlIGB3aW5kb3dgIG9iamVjdCBpcyB1c2VkLlxuICovXG52YXIgcm9vdCA9IGZyZWVHbG9iYWwgfHxcbiAgKChmcmVlV2luZG93ICE9PSAodGhpc0dsb2JhbCAmJiB0aGlzR2xvYmFsLndpbmRvdykpICYmIGZyZWVXaW5kb3cpIHx8XG4gICAgZnJlZVNlbGYgfHwgdGhpc0dsb2JhbCB8fCBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGEgZ2xvYmFsIG9iamVjdC5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7bnVsbHxPYmplY3R9IFJldHVybnMgYHZhbHVlYCBpZiBpdCdzIGEgZ2xvYmFsIG9iamVjdCwgZWxzZSBgbnVsbGAuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrR2xvYmFsKHZhbHVlKSB7XG4gIHJldHVybiAodmFsdWUgJiYgdmFsdWUuT2JqZWN0ID09PSBPYmplY3QpID8gdmFsdWUgOiBudWxsO1xufVxuXG4vKiogVXNlZCBmb3IgYnVpbHQtaW4gbWV0aG9kIHJlZmVyZW5jZXMuICovXG52YXIgb2JqZWN0UHJvdG8gPSBPYmplY3QucHJvdG90eXBlO1xuXG4vKipcbiAqIFVzZWQgdG8gcmVzb2x2ZSB0aGVcbiAqIFtgdG9TdHJpbmdUYWdgXShodHRwOi8vZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1vYmplY3QucHJvdG90eXBlLnRvc3RyaW5nKVxuICogb2YgdmFsdWVzLlxuICovXG52YXIgb2JqZWN0VG9TdHJpbmcgPSBvYmplY3RQcm90by50b1N0cmluZztcblxuLyoqIEJ1aWx0LWluIHZhbHVlIHJlZmVyZW5jZXMuICovXG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cbi8qKiBVc2VkIHRvIGNvbnZlcnQgc3ltYm9scyB0byBwcmltaXRpdmVzIGFuZCBzdHJpbmdzLiAqL1xudmFyIHN5bWJvbFByb3RvID0gU3ltYm9sID8gU3ltYm9sLnByb3RvdHlwZSA6IHVuZGVmaW5lZCxcbiAgICBzeW1ib2xUb1N0cmluZyA9IHN5bWJvbFByb3RvID8gc3ltYm9sUHJvdG8udG9TdHJpbmcgOiB1bmRlZmluZWQ7XG5cbi8qKlxuICogVGhlIGJhc2UgaW1wbGVtZW50YXRpb24gb2YgYF8udG9TdHJpbmdgIHdoaWNoIGRvZXNuJ3QgY29udmVydCBudWxsaXNoXG4gKiB2YWx1ZXMgdG8gZW1wdHkgc3RyaW5ncy5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gcHJvY2Vzcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFJldHVybnMgdGhlIHN0cmluZy5cbiAqL1xuZnVuY3Rpb24gYmFzZVRvU3RyaW5nKHZhbHVlKSB7XG4gIC8vIEV4aXQgZWFybHkgZm9yIHN0cmluZ3MgdG8gYXZvaWQgYSBwZXJmb3JtYW5jZSBoaXQgaW4gc29tZSBlbnZpcm9ubWVudHMuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgaWYgKGlzU3ltYm9sKHZhbHVlKSkge1xuICAgIHJldHVybiBzeW1ib2xUb1N0cmluZyA/IHN5bWJvbFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLiBBIHZhbHVlIGlzIG9iamVjdC1saWtlIGlmIGl0J3Mgbm90IGBudWxsYFxuICogYW5kIGhhcyBhIGB0eXBlb2ZgIHJlc3VsdCBvZiBcIm9iamVjdFwiLlxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgNC4wLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIG9iamVjdC1saWtlLCBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShbMSwgMiwgM10pO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKF8ubm9vcCk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNPYmplY3RMaWtlKG51bGwpO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNPYmplY3RMaWtlKHZhbHVlKSB7XG4gIHJldHVybiAhIXZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0Jztcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBjbGFzc2lmaWVkIGFzIGEgYFN5bWJvbGAgcHJpbWl0aXZlIG9yIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNTeW1ib2woU3ltYm9sLml0ZXJhdG9yKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzU3ltYm9sKCdhYmMnKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzU3ltYm9sKHZhbHVlKSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT0gJ3N5bWJvbCcgfHxcbiAgICAoaXNPYmplY3RMaWtlKHZhbHVlKSAmJiBvYmplY3RUb1N0cmluZy5jYWxsKHZhbHVlKSA9PSBzeW1ib2xUYWcpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VUb1N0cmluZztcbiIsIi8qKlxuICogbG9kYXNoIChDdXN0b20gQnVpbGQpIDxodHRwczovL2xvZGFzaC5jb20vPlxuICogQnVpbGQ6IGBsb2Rhc2ggbW9kdWxhcml6ZSBleHBvcnRzPVwibnBtXCIgLW8gLi9gXG4gKiBDb3B5cmlnaHQgalF1ZXJ5IEZvdW5kYXRpb24gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyA8aHR0cHM6Ly9qcXVlcnkub3JnLz5cbiAqIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlIDxodHRwczovL2xvZGFzaC5jb20vbGljZW5zZT5cbiAqIEJhc2VkIG9uIFVuZGVyc2NvcmUuanMgMS44LjMgPGh0dHA6Ly91bmRlcnNjb3JlanMub3JnL0xJQ0VOU0U+XG4gKiBDb3B5cmlnaHQgSmVyZW15IEFzaGtlbmFzLCBEb2N1bWVudENsb3VkIGFuZCBJbnZlc3RpZ2F0aXZlIFJlcG9ydGVycyAmIEVkaXRvcnNcbiAqL1xudmFyIHN0cmluZ1RvUGF0aCA9IHJlcXVpcmUoJ2xvZGFzaC5fc3RyaW5ndG9wYXRoJyk7XG5cbi8qKiBVc2VkIGFzIHJlZmVyZW5jZXMgZm9yIHZhcmlvdXMgYE51bWJlcmAgY29uc3RhbnRzLiAqL1xudmFyIElORklOSVRZID0gMSAvIDA7XG5cbi8qKiBgT2JqZWN0I3RvU3RyaW5nYCByZXN1bHQgcmVmZXJlbmNlcy4gKi9cbnZhciBmdW5jVGFnID0gJ1tvYmplY3QgRnVuY3Rpb25dJyxcbiAgICBnZW5UYWcgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nLFxuICAgIHN5bWJvbFRhZyA9ICdbb2JqZWN0IFN5bWJvbF0nO1xuXG4vKiogVXNlZCB0byBtYXRjaCBwcm9wZXJ0eSBuYW1lcyB3aXRoaW4gcHJvcGVydHkgcGF0aHMuICovXG52YXIgcmVJc0RlZXBQcm9wID0gL1xcLnxcXFsoPzpbXltcXF1dKnwoW1wiJ10pKD86KD8hXFwxKVteXFxcXF18XFxcXC4pKj9cXDEpXFxdLyxcbiAgICByZUlzUGxhaW5Qcm9wID0gL15cXHcqJC87XG5cbi8qKiBVc2VkIGZvciBidWlsdC1pbiBtZXRob2QgcmVmZXJlbmNlcy4gKi9cbnZhciBvYmplY3RQcm90byA9IE9iamVjdC5wcm90b3R5cGU7XG5cbi8qKlxuICogVXNlZCB0byByZXNvbHZlIHRoZVxuICogW2B0b1N0cmluZ1RhZ2BdKGh0dHA6Ly9lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC8jc2VjLW9iamVjdC5wcm90b3R5cGUudG9zdHJpbmcpXG4gKiBvZiB2YWx1ZXMuXG4gKi9cbnZhciBvYmplY3RUb1N0cmluZyA9IG9iamVjdFByb3RvLnRvU3RyaW5nO1xuXG4vKipcbiAqIENhc3RzIGB2YWx1ZWAgdG8gYSBwYXRoIGFycmF5IGlmIGl0J3Mgbm90IG9uZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gaW5zcGVjdC5cbiAqIEByZXR1cm5zIHtBcnJheX0gUmV0dXJucyB0aGUgY2FzdCBwcm9wZXJ0eSBwYXRoIGFycmF5LlxuICovXG5mdW5jdGlvbiBjYXN0UGF0aCh2YWx1ZSkge1xuICByZXR1cm4gaXNBcnJheSh2YWx1ZSkgPyB2YWx1ZSA6IHN0cmluZ1RvUGF0aCh2YWx1ZSk7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgYSBwcm9wZXJ0eSBuYW1lIGFuZCBub3QgYSBwcm9wZXJ0eSBwYXRoLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb2JqZWN0XSBUaGUgb2JqZWN0IHRvIHF1ZXJ5IGtleXMgb24uXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBhIHByb3BlcnR5IG5hbWUsIGVsc2UgYGZhbHNlYC5cbiAqL1xuZnVuY3Rpb24gaXNLZXkodmFsdWUsIG9iamVjdCkge1xuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdmFyIHR5cGUgPSB0eXBlb2YgdmFsdWU7XG4gIGlmICh0eXBlID09ICdudW1iZXInIHx8IHR5cGUgPT0gJ3N5bWJvbCcgfHwgdHlwZSA9PSAnYm9vbGVhbicgfHxcbiAgICAgIHZhbHVlID09IG51bGwgfHwgaXNTeW1ib2wodmFsdWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIHJlSXNQbGFpblByb3AudGVzdCh2YWx1ZSkgfHwgIXJlSXNEZWVwUHJvcC50ZXN0KHZhbHVlKSB8fFxuICAgIChvYmplY3QgIT0gbnVsbCAmJiB2YWx1ZSBpbiBPYmplY3Qob2JqZWN0KSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgYHZhbHVlYCB0byBhIHN0cmluZyBrZXkgaWYgaXQncyBub3QgYSBzdHJpbmcgb3Igc3ltYm9sLlxuICpcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBpbnNwZWN0LlxuICogQHJldHVybnMge3N0cmluZ3xzeW1ib2x9IFJldHVybnMgdGhlIGtleS5cbiAqL1xuZnVuY3Rpb24gdG9LZXkodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PSAnc3RyaW5nJyB8fCBpc1N5bWJvbCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cbiAgdmFyIHJlc3VsdCA9ICh2YWx1ZSArICcnKTtcbiAgcmV0dXJuIChyZXN1bHQgPT0gJzAnICYmICgxIC8gdmFsdWUpID09IC1JTkZJTklUWSkgPyAnLTAnIDogcmVzdWx0O1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYW4gYEFycmF5YCBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSAwLjEuMFxuICogQHR5cGUge0Z1bmN0aW9ufVxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzQXJyYXkoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzQXJyYXkoZG9jdW1lbnQuYm9keS5jaGlsZHJlbik7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheSgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICpcbiAqIF8uaXNBcnJheShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqL1xudmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIGNsYXNzaWZpZWQgYXMgYSBgRnVuY3Rpb25gIG9iamVjdC5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDAuMS4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBjb3JyZWN0bHkgY2xhc3NpZmllZCxcbiAqICBlbHNlIGBmYWxzZWAuXG4gKiBAZXhhbXBsZVxuICpcbiAqIF8uaXNGdW5jdGlvbihfKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzRnVuY3Rpb24oL2FiYy8pO1xuICogLy8gPT4gZmFsc2VcbiAqL1xuZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuICAvLyBUaGUgdXNlIG9mIGBPYmplY3QjdG9TdHJpbmdgIGF2b2lkcyBpc3N1ZXMgd2l0aCB0aGUgYHR5cGVvZmAgb3BlcmF0b3JcbiAgLy8gaW4gU2FmYXJpIDggd2hpY2ggcmV0dXJucyAnb2JqZWN0JyBmb3IgdHlwZWQgYXJyYXkgYW5kIHdlYWsgbWFwIGNvbnN0cnVjdG9ycyxcbiAgLy8gYW5kIFBoYW50b21KUyAxLjkgd2hpY2ggcmV0dXJucyAnZnVuY3Rpb24nIGZvciBgTm9kZUxpc3RgIGluc3RhbmNlcy5cbiAgdmFyIHRhZyA9IGlzT2JqZWN0KHZhbHVlKSA/IG9iamVjdFRvU3RyaW5nLmNhbGwodmFsdWUpIDogJyc7XG4gIHJldHVybiB0YWcgPT0gZnVuY1RhZyB8fCB0YWcgPT0gZ2VuVGFnO1xufVxuXG4vKipcbiAqIENoZWNrcyBpZiBgdmFsdWVgIGlzIHRoZVxuICogW2xhbmd1YWdlIHR5cGVdKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzKVxuICogb2YgYE9iamVjdGAuIChlLmcuIGFycmF5cywgZnVuY3Rpb25zLCBvYmplY3RzLCByZWdleGVzLCBgbmV3IE51bWJlcigwKWAsIGFuZCBgbmV3IFN0cmluZygnJylgKVxuICpcbiAqIEBzdGF0aWNcbiAqIEBtZW1iZXJPZiBfXG4gKiBAc2luY2UgMC4xLjBcbiAqIEBjYXRlZ29yeSBMYW5nXG4gKiBAcGFyYW0geyp9IHZhbHVlIFRoZSB2YWx1ZSB0byBjaGVjay5cbiAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIGB0cnVlYCBpZiBgdmFsdWVgIGlzIGFuIG9iamVjdCwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0KHt9KTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0KFsxLCAyLCAzXSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdChfLm5vb3ApO1xuICogLy8gPT4gdHJ1ZVxuICpcbiAqIF8uaXNPYmplY3QobnVsbCk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICB2YXIgdHlwZSA9IHR5cGVvZiB2YWx1ZTtcbiAgcmV0dXJuICEhdmFsdWUgJiYgKHR5cGUgPT0gJ29iamVjdCcgfHwgdHlwZSA9PSAnZnVuY3Rpb24nKTtcbn1cblxuLyoqXG4gKiBDaGVja3MgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZS4gQSB2YWx1ZSBpcyBvYmplY3QtbGlrZSBpZiBpdCdzIG5vdCBgbnVsbGBcbiAqIGFuZCBoYXMgYSBgdHlwZW9mYCByZXN1bHQgb2YgXCJvYmplY3RcIi5cbiAqXG4gKiBAc3RhdGljXG4gKiBAbWVtYmVyT2YgX1xuICogQHNpbmNlIDQuMC4wXG4gKiBAY2F0ZWdvcnkgTGFuZ1xuICogQHBhcmFtIHsqfSB2YWx1ZSBUaGUgdmFsdWUgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgYHZhbHVlYCBpcyBvYmplY3QtbGlrZSwgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZSh7fSk7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc09iamVjdExpa2UoWzEsIDIsIDNdKTtcbiAqIC8vID0+IHRydWVcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShfLm5vb3ApO1xuICogLy8gPT4gZmFsc2VcbiAqXG4gKiBfLmlzT2JqZWN0TGlrZShudWxsKTtcbiAqIC8vID0+IGZhbHNlXG4gKi9cbmZ1bmN0aW9uIGlzT2JqZWN0TGlrZSh2YWx1ZSkge1xuICByZXR1cm4gISF2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT0gJ29iamVjdCc7XG59XG5cbi8qKlxuICogQ2hlY2tzIGlmIGB2YWx1ZWAgaXMgY2xhc3NpZmllZCBhcyBhIGBTeW1ib2xgIHByaW1pdGl2ZSBvciBvYmplY3QuXG4gKlxuICogQHN0YXRpY1xuICogQG1lbWJlck9mIF9cbiAqIEBzaW5jZSA0LjAuMFxuICogQGNhdGVnb3J5IExhbmdcbiAqIEBwYXJhbSB7Kn0gdmFsdWUgVGhlIHZhbHVlIHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgYHRydWVgIGlmIGB2YWx1ZWAgaXMgY29ycmVjdGx5IGNsYXNzaWZpZWQsXG4gKiAgZWxzZSBgZmFsc2VgLlxuICogQGV4YW1wbGVcbiAqXG4gKiBfLmlzU3ltYm9sKFN5bWJvbC5pdGVyYXRvcik7XG4gKiAvLyA9PiB0cnVlXG4gKlxuICogXy5pc1N5bWJvbCgnYWJjJyk7XG4gKiAvLyA9PiBmYWxzZVxuICovXG5mdW5jdGlvbiBpc1N5bWJvbCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09ICdzeW1ib2wnIHx8XG4gICAgKGlzT2JqZWN0TGlrZSh2YWx1ZSkgJiYgb2JqZWN0VG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT0gc3ltYm9sVGFnKTtcbn1cblxuLyoqXG4gKiBUaGlzIG1ldGhvZCBpcyBsaWtlIGBfLmdldGAgZXhjZXB0IHRoYXQgaWYgdGhlIHJlc29sdmVkIHZhbHVlIGlzIGFcbiAqIGZ1bmN0aW9uIGl0J3MgaW52b2tlZCB3aXRoIHRoZSBgdGhpc2AgYmluZGluZyBvZiBpdHMgcGFyZW50IG9iamVjdCBhbmRcbiAqIGl0cyByZXN1bHQgaXMgcmV0dXJuZWQuXG4gKlxuICogQHN0YXRpY1xuICogQHNpbmNlIDAuMS4wXG4gKiBAbWVtYmVyT2YgX1xuICogQGNhdGVnb3J5IE9iamVjdFxuICogQHBhcmFtIHtPYmplY3R9IG9iamVjdCBUaGUgb2JqZWN0IHRvIHF1ZXJ5LlxuICogQHBhcmFtIHtBcnJheXxzdHJpbmd9IHBhdGggVGhlIHBhdGggb2YgdGhlIHByb3BlcnR5IHRvIHJlc29sdmUuXG4gKiBAcGFyYW0geyp9IFtkZWZhdWx0VmFsdWVdIFRoZSB2YWx1ZSByZXR1cm5lZCBmb3IgYHVuZGVmaW5lZGAgcmVzb2x2ZWQgdmFsdWVzLlxuICogQHJldHVybnMgeyp9IFJldHVybnMgdGhlIHJlc29sdmVkIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqXG4gKiB2YXIgb2JqZWN0ID0geyAnYSc6IFt7ICdiJzogeyAnYzEnOiAzLCAnYzInOiBfLmNvbnN0YW50KDQpIH0gfV0gfTtcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzEnKTtcbiAqIC8vID0+IDNcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzInKTtcbiAqIC8vID0+IDRcbiAqXG4gKiBfLnJlc3VsdChvYmplY3QsICdhWzBdLmIuYzMnLCAnZGVmYXVsdCcpO1xuICogLy8gPT4gJ2RlZmF1bHQnXG4gKlxuICogXy5yZXN1bHQob2JqZWN0LCAnYVswXS5iLmMzJywgXy5jb25zdGFudCgnZGVmYXVsdCcpKTtcbiAqIC8vID0+ICdkZWZhdWx0J1xuICovXG5mdW5jdGlvbiByZXN1bHQob2JqZWN0LCBwYXRoLCBkZWZhdWx0VmFsdWUpIHtcbiAgcGF0aCA9IGlzS2V5KHBhdGgsIG9iamVjdCkgPyBbcGF0aF0gOiBjYXN0UGF0aChwYXRoKTtcblxuICB2YXIgaW5kZXggPSAtMSxcbiAgICAgIGxlbmd0aCA9IHBhdGgubGVuZ3RoO1xuXG4gIC8vIEVuc3VyZSB0aGUgbG9vcCBpcyBlbnRlcmVkIHdoZW4gcGF0aCBpcyBlbXB0eS5cbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBvYmplY3QgPSB1bmRlZmluZWQ7XG4gICAgbGVuZ3RoID0gMTtcbiAgfVxuICB3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xuICAgIHZhciB2YWx1ZSA9IG9iamVjdCA9PSBudWxsID8gdW5kZWZpbmVkIDogb2JqZWN0W3RvS2V5KHBhdGhbaW5kZXhdKV07XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGluZGV4ID0gbGVuZ3RoO1xuICAgICAgdmFsdWUgPSBkZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIG9iamVjdCA9IGlzRnVuY3Rpb24odmFsdWUpID8gdmFsdWUuY2FsbChvYmplY3QpIDogdmFsdWU7XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZXN1bHQ7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG4oZnVuY3Rpb24gKCkge1xuICB0cnkge1xuICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICB9IGNhdGNoIChlKSB7XG4gICAgY2FjaGVkU2V0VGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBpcyBub3QgZGVmaW5lZCcpO1xuICAgIH1cbiAgfVxuICB0cnkge1xuICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGlzIG5vdCBkZWZpbmVkJyk7XG4gICAgfVxuICB9XG59ICgpKVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gY2FjaGVkU2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2FjaGVkQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8vIHZpbTp0cz00OnN0cz00OnN3PTQ6XG4vKiFcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEyIEtyaXMgS293YWwgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVRcbiAqIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvcmF3L21hc3Rlci9MSUNFTlNFXG4gKlxuICogV2l0aCBwYXJ0cyBieSBUeWxlciBDbG9zZVxuICogQ29weXJpZ2h0IDIwMDctMjAwOSBUeWxlciBDbG9zZSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBYIGxpY2Vuc2UgZm91bmRcbiAqIGF0IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbFxuICogRm9ya2VkIGF0IHJlZl9zZW5kLmpzIHZlcnNpb246IDIwMDktMDUtMTFcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IE1hcmsgTWlsbGVyXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUaGlzIGZpbGUgd2lsbCBmdW5jdGlvbiBwcm9wZXJseSBhcyBhIDxzY3JpcHQ+IHRhZywgb3IgYSBtb2R1bGVcbiAgICAvLyB1c2luZyBDb21tb25KUyBhbmQgTm9kZUpTIG9yIFJlcXVpcmVKUyBtb2R1bGUgZm9ybWF0cy4gIEluXG4gICAgLy8gQ29tbW9uL05vZGUvUmVxdWlyZUpTLCB0aGUgbW9kdWxlIGV4cG9ydHMgdGhlIFEgQVBJIGFuZCB3aGVuXG4gICAgLy8gZXhlY3V0ZWQgYXMgYSBzaW1wbGUgPHNjcmlwdD4sIGl0IGNyZWF0ZXMgYSBRIGdsb2JhbCBpbnN0ZWFkLlxuXG4gICAgLy8gTW9udGFnZSBSZXF1aXJlXG4gICAgaWYgKHR5cGVvZiBib290c3RyYXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBib290c3RyYXAoXCJwcm9taXNlXCIsIGRlZmluaXRpb24pO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIFByZWZlciB3aW5kb3cgb3ZlciBzZWxmIGZvciBhZGQtb24gc2NyaXB0cy4gVXNlIHNlbGYgZm9yXG4gICAgICAgIC8vIG5vbi13aW5kb3dlZCBjb250ZXh0cy5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBzZWxmO1xuXG4gICAgICAgIC8vIEdldCB0aGUgYHdpbmRvd2Agb2JqZWN0LCBzYXZlIHRoZSBwcmV2aW91cyBRIGdsb2JhbFxuICAgICAgICAvLyBhbmQgaW5pdGlhbGl6ZSBRIGFzIGEgZ2xvYmFsLlxuICAgICAgICB2YXIgcHJldmlvdXNRID0gZ2xvYmFsLlE7XG4gICAgICAgIGdsb2JhbC5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgICAgIC8vIEFkZCBhIG5vQ29uZmxpY3QgZnVuY3Rpb24gc28gUSBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAvLyBnbG9iYWwgbmFtZXNwYWNlLlxuICAgICAgICBnbG9iYWwuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ2xvYmFsLlEgPSBwcmV2aW91c1E7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcbiAgICAvLyBxdWV1ZSBmb3IgbGF0ZSB0YXNrcywgdXNlZCBieSB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nXG4gICAgdmFyIGxhdGVyUXVldWUgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cbiAgICAgICAgdmFyIHRhc2ssIGRvbWFpbjtcblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzaywgZG9tYWluKTtcblxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChsYXRlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFzayA9IGxhdGVyUXVldWUucG9wKCk7XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHNpbmdsZSBmdW5jdGlvbiBpbiB0aGUgYXN5bmMgcXVldWVcbiAgICBmdW5jdGlvbiBydW5TaW5nbGUodGFzaywgZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBwcm9jZXNzLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gRW5zdXJlIFEgaXMgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnQsIHdpdGggYSBgcHJvY2Vzcy5uZXh0VGlja2AuXG4gICAgICAgIC8vIFRvIHNlZSB0aHJvdWdoIGZha2UgTm9kZSBlbnZpcm9ubWVudHM6XG4gICAgICAgIC8vICogTW9jaGEgdGVzdCBydW5uZXIgLSBleHBvc2VzIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYFxuICAgICAgICAvLyAqIEJyb3dzZXJpZnkgLSBleHBvc2VzIGEgYHByb2Nlc3MubmV4VGlja2AgZnVuY3Rpb24gdGhhdCB1c2VzXG4gICAgICAgIC8vICAgYHNldFRpbWVvdXRgLiBJbiB0aGlzIGNhc2UgYHNldEltbWVkaWF0ZWAgaXMgcHJlZmVycmVkIGJlY2F1c2VcbiAgICAgICAgLy8gICAgaXQgaXMgZmFzdGVyLiBCcm93c2VyaWZ5J3MgYHByb2Nlc3MudG9TdHJpbmcoKWAgeWllbGRzXG4gICAgICAgIC8vICAgXCJbb2JqZWN0IE9iamVjdF1cIiwgd2hpbGUgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnRcbiAgICAgICAgLy8gICBgcHJvY2Vzcy5uZXh0VGljaygpYCB5aWVsZHMgXCJbb2JqZWN0IHByb2Nlc3NdXCIuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHRhc2sgYWZ0ZXIgYWxsIG90aGVyIHRhc2tzIGhhdmUgYmVlbiBydW5cbiAgICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZyB0aGF0IG5lZWRzIHRvIGhhcHBlblxuICAgIC8vIGFmdGVyIGFsbCBgdGhlbmBkIHRhc2tzIGhhdmUgYmVlbiBydW4uXG4gICAgbmV4dFRpY2sucnVuQWZ0ZXIgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBsYXRlclF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5RLnJlc29sdmUgPSBRO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzIGlmIFFfREVCVUcgaXMgc2V0XG5pZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5RX0RFQlVHKSB7XG4gICAgUS5sb25nU3RhY2tTdXBwb3J0ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShyZXNvbHZlZFByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWRcbiAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXIocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZS1zdHlsZSBjYWxsYmFjayB0aGF0IHdpbGwgcmVzb2x2ZSBvciByZWplY3QgdGhlIGRlZmVycmVkXG4gKiBwcm9taXNlLlxuICogQHJldHVybnMgYSBub2RlYmFja1xuICovXG5kZWZlci5wcm90b3R5cGUubWFrZU5vZGVSZXNvbHZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBzZWxmLnJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZShhcnJheV9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gcmVzb2x2ZXIge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBub3RoaW5nIGFuZCBhY2NlcHRzXG4gKiB0aGUgcmVzb2x2ZSwgcmVqZWN0LCBhbmQgbm90aWZ5IGZ1bmN0aW9ucyBmb3IgYSBkZWZlcnJlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IG1heSBiZSByZXNvbHZlZCB3aXRoIHRoZSBnaXZlbiByZXNvbHZlIGFuZCByZWplY3RcbiAqIGZ1bmN0aW9ucywgb3IgcmVqZWN0ZWQgYnkgYSB0aHJvd24gZXhjZXB0aW9uIGluIHJlc29sdmVyXG4gKi9cblEuUHJvbWlzZSA9IHByb21pc2U7IC8vIEVTNlxuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbnByb21pc2UucmFjZSA9IHJhY2U7IC8vIEVTNlxucHJvbWlzZS5hbGwgPSBhbGw7IC8vIEVTNlxucHJvbWlzZS5yZWplY3QgPSByZWplY3Q7IC8vIEVTNlxucHJvbWlzZS5yZXNvbHZlID0gUTsgLy8gRVM2XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBzZXR0bGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgc2V0dGxlZFxuICovXG5RLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShhbnN3ZXJQcykge1xuICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0UmVwb3J0ID0gYXJyYXlfaW5kZXhPZihyZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChhdFJlcG9ydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwicmVqZWN0aW9uSGFuZGxlZFwiLCB1bmhhbmRsZWRSZWFzb25zW2F0XSwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXRSZXBvcnQsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IGZhbHNlO1xufTtcblxucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG5cbi8vLy8gRU5EIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqIEBwYXJhbSByZWFzb24gdmFsdWUgZGVzY3JpYmluZyB0aGUgZmFpbHVyZVxuICovXG5RLnJlamVjdCA9IHJlamVjdDtcbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICB2YXIgcmVqZWN0aW9uID0gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgZXJyb3IgaGFzIGJlZW4gaGFuZGxlZFxuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja1JlamVjdGlvbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkKHJlYXNvbikgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcInJlamVjdGVkXCIsIHJlYXNvbjogcmVhc29uIH07XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHJlYXNvbiBoYXMgbm90IGJlZW4gaGFuZGxlZC5cbiAgICB0cmFja1JlamVjdGlvbihyZWplY3Rpb24sIHJlYXNvbik7XG5cbiAgICByZXR1cm4gcmVqZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBmdWxmaWxsZWQgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlXG4gKi9cblEuZnVsZmlsbCA9IGZ1bGZpbGw7XG5mdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbiAobmFtZSwgcmhzKSB7XG4gICAgICAgICAgICB2YWx1ZVtuYW1lXSA9IHJocztcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3N0XCI6IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBNYXJrIE1pbGxlciBwcm9wb3NlcyB0aGF0IHBvc3Qgd2l0aCBubyBuYW1lIHNob3VsZCBhcHBseSBhXG4gICAgICAgICAgICAvLyBwcm9taXNlZCBmdW5jdGlvbi5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV0uYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImFwcGx5XCI6IGZ1bmN0aW9uICh0aGlzcCwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXNwLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJrZXlzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB2b2lkIDAsIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcImZ1bGZpbGxlZFwiLCB2YWx1ZTogdmFsdWUgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGVuYWJsZXMgdG8gUSBwcm9taXNlcy5cbiAqIEBwYXJhbSBwcm9taXNlIHRoZW5hYmxlIHByb21pc2VcbiAqIEByZXR1cm5zIGEgUSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZShwcm9taXNlKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEoZXhjZXB0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGdldFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcHJvcGVydHkgdmFsdWVcbiAqL1xuUS5nZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciBvYmplY3Qgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gc2V0XG4gKiBAcGFyYW0gdmFsdWUgICAgIG5ldyB2YWx1ZSBvZiBwcm9wZXJ0eVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGRlbGV0ZVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSB2YWx1ZSAgICAgYSB2YWx1ZSB0byBwb3N0LCB0eXBpY2FsbHkgYW4gYXJyYXkgb2ZcbiAqICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbiBhcmd1bWVudHMgZm9yIHByb21pc2VzIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgYXJlIHVsdGltYXRlbHkgYmFja2VkIHdpdGggYHJlc29sdmVgIHZhbHVlcyxcbiAqICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aG9zZSBiYWNrZWQgd2l0aCBVUkxzXG4gKiAgICAgICAgICAgICAgICAgIHdoZXJlaW4gdGhlIHBvc3RlZCB2YWx1ZSBjYW4gYmUgYW55XG4gKiAgICAgICAgICAgICAgICAgIEpTT04gc2VyaWFsaXphYmxlIG9iamVjdC5cbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG4vLyBib3VuZCBsb2NhbGx5IGJlY2F1c2UgaXQgaXMgdXNlZCBieSBvdGhlciBtZXRob2RzXG5RLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGludm9jYXRpb24gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblEubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMildKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUHJvbWlzZS5wcm90b3R5cGUubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSBhcmdzICAgICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmFwcGx5ID0gZnVuY3Rpb24gKG9iamVjdCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblFbXCJ0cnlcIl0gPVxuUS5mY2FsbCA9IGZ1bmN0aW9uIChvYmplY3QgLyogLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMpXSk7XG59O1xuXG4vKipcbiAqIEJpbmRzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiwgdHJhbnNmb3JtaW5nIHJldHVybiB2YWx1ZXMgaW50byBhIGZ1bGZpbGxlZFxuICogcHJvbWlzZSBhbmQgdGhyb3duIGVycm9ycyBpbnRvIGEgcmVqZWN0ZWQgb25lLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYmluZCA9IGZ1bmN0aW9uIChvYmplY3QgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IFEob2JqZWN0KTtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5Qcm9taXNlLnByb3RvdHlwZS5mYmluZCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrcGVuZGluZ0NvdW50O1xuICAgICAgICAgICAgICAgIHdoZW4oXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1wZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7IGluZGV4OiBpbmRleCwgdmFsdWU6IHByb2dyZXNzIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlIG9mIGFuIGFycmF5LiBQcmlvciByZWplY3RlZCBwcm9taXNlcyBhcmVcbiAqIGlnbm9yZWQuICBSZWplY3RzIG9ubHkgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyBvciBwcm9taXNlcyBmb3IgdmFsdWVzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlLFxuICogb3IgYSByZWplY3RlZCBwcm9taXNlIGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKi9cblEuYW55ID0gYW55O1xuXG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBRLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUS5ub0NvbmZsaWN0IG9ubHkgd29ya3Mgd2hlbiBRIGlzIHVzZWQgYXMgYSBnbG9iYWxcIik7XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9zcmMvY3Jvc3NmaWx0ZXJcIikuY3Jvc3NmaWx0ZXI7XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwiX2FyZ3NcIjogW1xuICAgIFtcbiAgICAgIHtcbiAgICAgICAgXCJuYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gICAgICAgIFwicmF3XCI6IFwiY3Jvc3NmaWx0ZXIyQF4xLjQuMC1hbHBoYS4wNVwiLFxuICAgICAgICBcInJhd1NwZWNcIjogXCJeMS40LjAtYWxwaGEuMDVcIixcbiAgICAgICAgXCJzY29wZVwiOiBudWxsLFxuICAgICAgICBcInNwZWNcIjogXCI+PTEuNC4wLWFscGhhLjUgPDIuMC4wXCIsXG4gICAgICAgIFwidHlwZVwiOiBcInJhbmdlXCJcbiAgICAgIH0sXG4gICAgICBcIi9Vc2Vycy9qYXlzb24vd29ya3NwYWNlL2NvbXBvbmVudHMvdW5pdmVyc2Uvbm9kZV9tb2R1bGVzL3JlZHVjdGlvXCJcbiAgICBdXG4gIF0sXG4gIFwiX2Zyb21cIjogXCJjcm9zc2ZpbHRlcjJAPj0xLjQuMC1hbHBoYS41IDwyLjAuMFwiLFxuICBcIl9pZFwiOiBcImNyb3NzZmlsdGVyMkAxLjQuMC1hbHBoYS42XCIsXG4gIFwiX2luQ2FjaGVcIjogdHJ1ZSxcbiAgXCJfaW5zdGFsbGFibGVcIjogdHJ1ZSxcbiAgXCJfbG9jYXRpb25cIjogXCIvcmVkdWN0aW8vY3Jvc3NmaWx0ZXIyXCIsXG4gIFwiX25vZGVWZXJzaW9uXCI6IFwiNS4xMC4xXCIsXG4gIFwiX25wbU9wZXJhdGlvbmFsSW50ZXJuYWxcIjoge1xuICAgIFwiaG9zdFwiOiBcInBhY2thZ2VzLTEyLXdlc3QuaW50ZXJuYWwubnBtanMuY29tXCIsXG4gICAgXCJ0bXBcIjogXCJ0bXAvY3Jvc3NmaWx0ZXIyLTEuNC4wLWFscGhhLjYudGd6XzE0NjM1MTk1NzE3ODZfMC40OTI2OTY3MTI0OTIwMzM4NFwiXG4gIH0sXG4gIFwiX25wbVVzZXJcIjoge1xuICAgIFwiZW1haWxcIjogXCJlc2pld2V0dEBnbWFpbC5jb21cIixcbiAgICBcIm5hbWVcIjogXCJlc2pld2V0dFwiXG4gIH0sXG4gIFwiX25wbVZlcnNpb25cIjogXCIzLjguM1wiLFxuICBcIl9waGFudG9tQ2hpbGRyZW5cIjoge30sXG4gIFwiX3JlcXVlc3RlZFwiOiB7XG4gICAgXCJuYW1lXCI6IFwiY3Jvc3NmaWx0ZXIyXCIsXG4gICAgXCJyYXdcIjogXCJjcm9zc2ZpbHRlcjJAXjEuNC4wLWFscGhhLjA1XCIsXG4gICAgXCJyYXdTcGVjXCI6IFwiXjEuNC4wLWFscGhhLjA1XCIsXG4gICAgXCJzY29wZVwiOiBudWxsLFxuICAgIFwic3BlY1wiOiBcIj49MS40LjAtYWxwaGEuNSA8Mi4wLjBcIixcbiAgICBcInR5cGVcIjogXCJyYW5nZVwiXG4gIH0sXG4gIFwiX3JlcXVpcmVkQnlcIjogW1xuICAgIFwiL3JlZHVjdGlvXCJcbiAgXSxcbiAgXCJfcmVzb2x2ZWRcIjogXCJodHRwczovL3JlZ2lzdHJ5Lm5wbWpzLm9yZy9jcm9zc2ZpbHRlcjIvLS9jcm9zc2ZpbHRlcjItMS40LjAtYWxwaGEuNi50Z3pcIixcbiAgXCJfc2hhc3VtXCI6IFwiZjAxOTdjNmZhYjJkNmE1ODNiNTEyNTRiZmM2MzU3MDkzZjgwNTIxYlwiLFxuICBcIl9zaHJpbmt3cmFwXCI6IG51bGwsXG4gIFwiX3NwZWNcIjogXCJjcm9zc2ZpbHRlcjJAXjEuNC4wLWFscGhhLjA1XCIsXG4gIFwiX3doZXJlXCI6IFwiL1VzZXJzL2pheXNvbi93b3Jrc3BhY2UvY29tcG9uZW50cy91bml2ZXJzZS9ub2RlX21vZHVsZXMvcmVkdWN0aW9cIixcbiAgXCJhdXRob3JcIjoge1xuICAgIFwibmFtZVwiOiBcIk1pa2UgQm9zdG9ja1wiLFxuICAgIFwidXJsXCI6IFwiaHR0cDovL2Jvc3Qub2Nrcy5vcmcvbWlrZVwiXG4gIH0sXG4gIFwiYnVnc1wiOiB7XG4gICAgXCJ1cmxcIjogXCJodHRwczovL2dpdGh1Yi5jb20vY3Jvc3NmaWx0ZXIvY3Jvc3NmaWx0ZXIvaXNzdWVzXCJcbiAgfSxcbiAgXCJjb250cmlidXRvcnNcIjogW1xuICAgIHtcbiAgICAgIFwibmFtZVwiOiBcIkphc29uIERhdmllc1wiLFxuICAgICAgXCJ1cmxcIjogXCJodHRwOi8vd3d3Lmphc29uZGF2aWVzLmNvbS9cIlxuICAgIH1cbiAgXSxcbiAgXCJkZXBlbmRlbmNpZXNcIjoge1xuICAgIFwibG9kYXNoLnJlc3VsdFwiOiBcIl40LjQuMFwiXG4gIH0sXG4gIFwiZGVzY3JpcHRpb25cIjogXCJGYXN0IG11bHRpZGltZW5zaW9uYWwgZmlsdGVyaW5nIGZvciBjb29yZGluYXRlZCB2aWV3cy5cIixcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiYnJvd3NlcmlmeVwiOiBcIl4xMy4wLjBcIixcbiAgICBcImQzXCI6IFwiMy41XCIsXG4gICAgXCJwYWNrYWdlLWpzb24tdmVyc2lvbmlmeVwiOiBcIjEuMC4yXCIsXG4gICAgXCJ1Z2xpZnktanNcIjogXCIyLjQuMFwiLFxuICAgIFwidm93c1wiOiBcIjAuNy4wXCJcbiAgfSxcbiAgXCJkaXJlY3Rvcmllc1wiOiB7fSxcbiAgXCJkaXN0XCI6IHtcbiAgICBcInNoYXN1bVwiOiBcImYwMTk3YzZmYWIyZDZhNTgzYjUxMjU0YmZjNjM1NzA5M2Y4MDUyMWJcIixcbiAgICBcInRhcmJhbGxcIjogXCJodHRwczovL3JlZ2lzdHJ5Lm5wbWpzLm9yZy9jcm9zc2ZpbHRlcjIvLS9jcm9zc2ZpbHRlcjItMS40LjAtYWxwaGEuNi50Z3pcIlxuICB9LFxuICBcImZpbGVzXCI6IFtcbiAgICBcInNyY1wiLFxuICAgIFwiaW5kZXguanNcIixcbiAgICBcImNyb3NzZmlsdGVyLmpzXCIsXG4gICAgXCJjcm9zc2ZpbHRlci5taW4uanNcIlxuICBdLFxuICBcImdpdEhlYWRcIjogXCI1MDlhOTY3OThmNTE1M2E1OGQxYjZjYWU1ZmIzZTc4OTMxMjljZTdjXCIsXG4gIFwiaG9tZXBhZ2VcIjogXCJodHRwOi8vY3Jvc3NmaWx0ZXIuZ2l0aHViLmNvbS9jcm9zc2ZpbHRlci9cIixcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJhbmFseXRpY3NcIixcbiAgICBcInZpc3VhbGl6YXRpb25cIixcbiAgICBcImNyb3NzZmlsdGVyXCJcbiAgXSxcbiAgXCJtYWluXCI6IFwiLi9pbmRleC5qc1wiLFxuICBcIm1haW50YWluZXJzXCI6IFtcbiAgICB7XG4gICAgICBcImVtYWlsXCI6IFwiZXNqZXdldHRAZ21haWwuY29tXCIsXG4gICAgICBcIm5hbWVcIjogXCJlc2pld2V0dFwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImVtYWlsXCI6IFwiZ29yZG9uQHdvb2RodWxsLmNvbVwiLFxuICAgICAgXCJuYW1lXCI6IFwiZ29yZG9ud29vZGh1bGxcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJlbWFpbFwiOiBcInRhbm5lcmxpbnNsZXlAZ21haWwuY29tXCIsXG4gICAgICBcIm5hbWVcIjogXCJ0YW5uZXJsaW5zbGV5XCJcbiAgICB9XG4gIF0sXG4gIFwibmFtZVwiOiBcImNyb3NzZmlsdGVyMlwiLFxuICBcIm9wdGlvbmFsRGVwZW5kZW5jaWVzXCI6IHt9LFxuICBcInJlYWRtZVwiOiBcIkVSUk9SOiBObyBSRUFETUUgZGF0YSBmb3VuZCFcIixcbiAgXCJyZXBvc2l0b3J5XCI6IHtcbiAgICBcInR5cGVcIjogXCJnaXRcIixcbiAgICBcInVybFwiOiBcImdpdCtzc2g6Ly9naXRAZ2l0aHViLmNvbS9jcm9zc2ZpbHRlci9jcm9zc2ZpbHRlci5naXRcIlxuICB9LFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwiYmVuY2htYXJrXCI6IFwibm9kZSB0ZXN0L2JlbmNobWFyay5qc1wiLFxuICAgIFwiYnVpbGRcIjogXCJicm93c2VyaWZ5IGluZGV4LmpzIC10IHBhY2thZ2UtanNvbi12ZXJzaW9uaWZ5IC0tc3RhbmRhbG9uZSBjcm9zc2ZpbHRlciAtbyBjcm9zc2ZpbHRlci5qcyAmJiB1Z2xpZnlqcyAtLWNvbXByZXNzIC0tbWFuZ2xlIC0tc2NyZXctaWU4IGNyb3NzZmlsdGVyLmpzIC1vIGNyb3NzZmlsdGVyLm1pbi5qc1wiLFxuICAgIFwiY2xlYW5cIjogXCJybSAtZiBjcm9zc2ZpbHRlci5qcyBjcm9zc2ZpbHRlci5taW4uanNcIixcbiAgICBcInRlc3RcIjogXCJ2b3dzIC0tdmVyYm9zZVwiXG4gIH0sXG4gIFwidmVyc2lvblwiOiBcIjEuNC4wLWFscGhhLjZcIlxufVxuIiwiaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG4pOyB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gZnVuY3Rpb24oYXJyYXksIHdpZHRoKSB7XG4gICAgdmFyIGNvcHk7XG4gICAgc3dpdGNoICh3aWR0aCkge1xuICAgICAgY2FzZSAxNjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MTYoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkzMihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICAgIH1cbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZChuKSB7XG4gIHZhciBhcnJheSA9IG5ldyBBcnJheShuKSwgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbikgYXJyYXlbaV0gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkKGFycmF5LCBsZW5ndGgpIHtcbiAgdmFyIG4gPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChuIDwgbGVuZ3RoKSBhcnJheVtuKytdID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZChhcnJheSwgd2lkdGgpIHtcbiAgaWYgKHdpZHRoID4gMzIpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIEFuIGFyYml0cmFyaWx5LXdpZGUgYXJyYXkgb2YgYml0bWFza3NcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2JpdGFycmF5KG4pIHtcbiAgdGhpcy5sZW5ndGggPSBuO1xuICB0aGlzLnN1YmFycmF5cyA9IDE7XG4gIHRoaXMud2lkdGggPSA4O1xuICB0aGlzLm1hc2tzID0ge1xuICAgIDA6IDBcbiAgfVxuXG4gIHRoaXNbMF0gPSBjcm9zc2ZpbHRlcl9hcnJheTgobik7XG59XG5cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5sZW5ndGhlbiA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKHRoaXNbaV0sIG4pO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIFJlc2VydmUgYSBuZXcgYml0IGluZGV4IGluIHRoZSBhcnJheSwgcmV0dXJucyB7b2Zmc2V0LCBvbmV9XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtLCB3LCBvbmUsIGksIGxlbjtcblxuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbSA9IHRoaXMubWFza3NbaV07XG4gICAgdyA9IHRoaXMud2lkdGggLSAoMzIgKiBpKTtcbiAgICBvbmUgPSB+bSAmIC1+bTtcblxuICAgIGlmICh3ID49IDMyICYmICFvbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICh3IDwgMzIgJiYgKG9uZSAmICgxIDw8IHcpKSkge1xuICAgICAgLy8gd2lkZW4gdGhpcyBzdWJhcnJheVxuICAgICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4odGhpc1tpXSwgdyA8PD0gMSk7XG4gICAgICB0aGlzLndpZHRoID0gMzIgKiBpICsgdztcbiAgICB9XG5cbiAgICB0aGlzLm1hc2tzW2ldIHw9IG9uZTtcblxuICAgIHJldHVybiB7XG4gICAgICBvZmZzZXQ6IGksXG4gICAgICBvbmU6IG9uZVxuICAgIH07XG4gIH1cblxuICAvLyBhZGQgYSBuZXcgc3ViYXJyYXlcbiAgdGhpc1t0aGlzLnN1YmFycmF5c10gPSBjcm9zc2ZpbHRlcl9hcnJheTgodGhpcy5sZW5ndGgpO1xuICB0aGlzLm1hc2tzW3RoaXMuc3ViYXJyYXlzXSA9IDE7XG4gIHRoaXMud2lkdGggKz0gODtcbiAgcmV0dXJuIHtcbiAgICBvZmZzZXQ6IHRoaXMuc3ViYXJyYXlzKyssXG4gICAgb25lOiAxXG4gIH07XG59O1xuXG4vLyBDb3B5IHJlY29yZCBmcm9tIGluZGV4IHNyYyB0byBpbmRleCBkZXN0XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGRlc3QsIHNyYykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXVtkZXN0XSA9IHRoaXNbaV1bc3JjXTtcbiAgfVxufTtcblxuLy8gVHJ1bmNhdGUgdGhlIGFycmF5IHRvIHRoZSBnaXZlbiBsZW5ndGhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS50cnVuY2F0ZSA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGZvciAodmFyIGogPSB0aGlzLmxlbmd0aCAtIDE7IGogPj0gbjsgai0tKSB7XG4gICAgICB0aGlzW2ldW2pdID0gMDtcbiAgICB9XG4gICAgdGhpc1tpXS5sZW5ndGggPSBuO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDBcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwIGV4Y2VwdCBmb3IgcG9zc2libHkgb25lXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPT09IG9mZnNldCA/IHRoaXNbaV1bbl0gJiB6ZXJvIDogdGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXogYXJlIDAgZXhjZXB0IGZvciB0aGUgc3BlY2lmaWVkIG1hc2suXG4vLyBUaGUgbWFzayBzaG91bGQgYmUgYW4gYXJyYXkgb2YgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgZmlsdGVyIHN1YmFycmF5cyB3aWR0aC5cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvRXhjZXB0TWFzayA9IGZ1bmN0aW9uKG4sIG1hc2spIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICYgbWFza1tpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLm9ubHkgPSBmdW5jdGlvbihuLCBvZmZzZXQsIG9uZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0gIT0gKGkgPT09IG9mZnNldCA/IG9uZSA6IDApKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleCBleGNlcHQgZm9yIHBvc3NpYmx5IG9uZSBvdGhlclxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLm9ubHlFeGNlcHQgPSBmdW5jdGlvbihuLCBvZmZzZXQsIHplcm8sIG9ubHlPZmZzZXQsIG9ubHlPbmUpIHtcbiAgdmFyIG1hc2s7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtYXNrID0gdGhpc1tpXVtuXTtcbiAgICBpZiAoaSA9PT0gb2Zmc2V0KVxuICAgICAgbWFzayAmPSB6ZXJvO1xuICAgIGlmIChtYXNrICE9IChpID09PSBvbmx5T2Zmc2V0ID8gb25seU9uZSA6IDApKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFycmF5ODogY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICBhcnJheTE2OiBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gIGFycmF5MzI6IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgYXJyYXlMZW5ndGhlbjogY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gIGFycmF5V2lkZW46IGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkLFxuICBiaXRhcnJheTogY3Jvc3NmaWx0ZXJfYml0YXJyYXlcbn07XG4iLCJ2YXIgY3Jvc3NmaWx0ZXJfaWRlbnRpdHkgPSByZXF1aXJlKCcuL2lkZW50aXR5Jyk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xubW9kdWxlLmV4cG9ydHMuYnkgPSBiaXNlY3RfYnk7IC8vIGFzc2lnbiB0aGUgcmF3IGZ1bmN0aW9uIHRvIHRoZSBleHBvcnQgYXMgd2VsbFxuIiwidmFyIHhmaWx0ZXJBcnJheSA9IHJlcXVpcmUoJy4vYXJyYXknKTtcbnZhciB4ZmlsdGVyRmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXInKTtcbnZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcbnZhciBjcm9zc2ZpbHRlcl9udWxsID0gcmVxdWlyZSgnLi9udWxsJyk7XG52YXIgY3Jvc3NmaWx0ZXJfemVybyA9IHJlcXVpcmUoJy4vemVybycpO1xudmFyIHhmaWx0ZXJIZWFwc2VsZWN0ID0gcmVxdWlyZSgnLi9oZWFwc2VsZWN0Jyk7XG52YXIgeGZpbHRlckhlYXAgPSByZXF1aXJlKCcuL2hlYXAnKTtcbnZhciBiaXNlY3QgPSByZXF1aXJlKCcuL2Jpc2VjdCcpO1xudmFyIGluc2VydGlvbnNvcnQgPSByZXF1aXJlKCcuL2luc2VydGlvbnNvcnQnKTtcbnZhciBwZXJtdXRlID0gcmVxdWlyZSgnLi9wZXJtdXRlJyk7XG52YXIgcXVpY2tzb3J0ID0gcmVxdWlyZSgnLi9xdWlja3NvcnQnKTtcbnZhciB4ZmlsdGVyUmVkdWNlID0gcmVxdWlyZSgnLi9yZWR1Y2UnKTtcbnZhciBwYWNrYWdlSnNvbiA9IHJlcXVpcmUoJy4vLi4vcGFja2FnZS5qc29uJyk7IC8vIHJlcXVpcmUgb3duIHBhY2thZ2UuanNvbiBmb3IgdGhlIHZlcnNpb24gZmllbGRcbnZhciByZXN1bHQgPSByZXF1aXJlKCdsb2Rhc2gucmVzdWx0Jyk7XG4vLyBleHBvc2UgQVBJIGV4cG9ydHNcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIgPSBjcm9zc2ZpbHRlcjtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIuaGVhcCA9IHhmaWx0ZXJIZWFwO1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5oZWFwc2VsZWN0ID0geGZpbHRlckhlYXBzZWxlY3Q7XG5leHBvcnRzLmNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdDtcbmV4cG9ydHMuY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnQ7XG5leHBvcnRzLmNyb3NzZmlsdGVyLnBlcm11dGUgPSBwZXJtdXRlO1xuZXhwb3J0cy5jcm9zc2ZpbHRlci5xdWlja3NvcnQgPSBxdWlja3NvcnQ7XG5leHBvcnRzLmNyb3NzZmlsdGVyLnZlcnNpb24gPSBwYWNrYWdlSnNvbi52ZXJzaW9uOyAvLyBwbGVhc2Ugbm90ZSB1c2Ugb2YgXCJwYWNrYWdlLWpzb24tdmVyc2lvbmlmeVwiIHRyYW5zZm9ybVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZSxcbiAgICBhbGw6IGFsbCxcbiAgICBvbkNoYW5nZTogb25DaGFuZ2UsXG4gICAgaXNFbGVtZW50RmlsdGVyZWQ6IGlzRWxlbWVudEZpbHRlcmVkLFxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgZmlsdGVycywgLy8gMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcbiAgICAgIGNhbGxiYWNrcyA9IFtdO1xuXG4gIGZpbHRlcnMgPSBuZXcgeGZpbHRlckFycmF5LmJpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhQWRkZWQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgtMSwgLTEsIFtdLCByZW1vdmVkLCB0cnVlKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVycy5jb3B5KGosIGkpLCBkYXRhW2pdID0gZGF0YVtpXTtcbiAgICAgICAgKytqO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEubGVuZ3RoID0gbiA9IGo7XG4gICAgZmlsdGVycy50cnVuY2F0ZShqKTtcbiAgICB0cmlnZ2VyT25DaGFuZ2UoJ2RhdGFSZW1vdmVkJyk7XG4gIH1cblxuICAvLyBSZXR1cm4gdHJ1ZSBpZiB0aGUgZGF0YSBlbGVtZW50IGF0IGluZGV4IGkgaXMgZmlsdGVyZWQgSU4uXG4gIC8vIE9wdGlvbmFsbHksIGlnbm9yZSB0aGUgZmlsdGVycyBvZiBhbnkgZGltZW5zaW9ucyBpbiB0aGUgaWdub3JlX2RpbWVuc2lvbnMgbGlzdC5cbiAgZnVuY3Rpb24gaXNFbGVtZW50RmlsdGVyZWQoaSwgaWdub3JlX2RpbWVuc2lvbnMpIHtcbiAgICB2YXIgbixcbiAgICAgICAgZCxcbiAgICAgICAgaWQsXG4gICAgICAgIGxlbixcbiAgICAgICAgbWFzayA9IEFycmF5KGZpbHRlcnMuc3ViYXJyYXlzKTtcbiAgICBmb3IgKG4gPSAwOyBuIDwgZmlsdGVycy5zdWJhcnJheXM7IG4rKykgeyBtYXNrW25dID0gfjA7IH1cbiAgICBpZiAoaWdub3JlX2RpbWVuc2lvbnMpIHtcbiAgICAgIGZvciAoZCA9IDAsIGxlbiA9IGlnbm9yZV9kaW1lbnNpb25zLmxlbmd0aDsgZCA8IGxlbjsgZCsrKSB7XG4gICAgICAgIC8vIFRoZSB0b3AgYml0cyBvZiB0aGUgSUQgYXJlIHRoZSBzdWJhcnJheSBvZmZzZXQgYW5kIHRoZSBsb3dlciBiaXRzIGFyZSB0aGUgYml0XG4gICAgICAgIC8vIG9mZnNldCBvZiB0aGUgXCJvbmVcIiBtYXNrLlxuICAgICAgICBpZCA9IGlnbm9yZV9kaW1lbnNpb25zW2RdLmlkKCk7XG4gICAgICAgIG1hc2tbaWQgPj4gN10gJj0gfigweDEgPDwgKGlkICYgMHgzZikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmlsdGVycy56ZXJvRXhjZXB0TWFzayhpLG1hc2spO1xuICB9XG5cbiAgLy8gQWRkcyBhIG5ldyBkaW1lbnNpb24gd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlIGFjY2Vzc29yIGZ1bmN0aW9uLlxuICBmdW5jdGlvbiBkaW1lbnNpb24odmFsdWUsIGl0ZXJhYmxlKSB7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgICAgdmFyIGFjY2Vzc29yUGF0aCA9IHZhbHVlO1xuICAgICAgdmFsdWUgPSBmdW5jdGlvbihkKSB7IHJldHVybiByZXN1bHQoZCwgYWNjZXNzb3JQYXRoKTsgfTtcbiAgICB9XG5cbiAgICB2YXIgZGltZW5zaW9uID0ge1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICBmaWx0ZXJFeGFjdDogZmlsdGVyRXhhY3QsXG4gICAgICBmaWx0ZXJSYW5nZTogZmlsdGVyUmFuZ2UsXG4gICAgICBmaWx0ZXJGdW5jdGlvbjogZmlsdGVyRnVuY3Rpb24sXG4gICAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlLCAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIGFjY2Vzc29yOiB2YWx1ZSxcbiAgICAgIGlkOiBmdW5jdGlvbigpIHsgcmV0dXJuIGlkOyB9XG4gICAgfTtcblxuICAgIHZhciBvbmUsIC8vIGxvd2VzdCB1bnNldCBiaXQgYXMgbWFzaywgZS5nLiwgMDAwMDEwMDBcbiAgICAgICAgemVybywgLy8gaW52ZXJ0ZWQgb25lLCBlLmcuLCAxMTExMDExMVxuICAgICAgICBvZmZzZXQsIC8vIG9mZnNldCBpbnRvIHRoZSBmaWx0ZXJzIGFycmF5c1xuICAgICAgICBpZCwgLy8gdW5pcXVlIElEIGZvciB0aGlzIGRpbWVuc2lvbiAocmV1c2VkIHdoZW4gZGltZW5zaW9ucyBhcmUgZGlzcG9zZWQpXG4gICAgICAgIHZhbHVlcywgLy8gc29ydGVkLCBjYWNoZWQgYXJyYXlcbiAgICAgICAgaW5kZXgsIC8vIHZhbHVlIHJhbmsg4oamIG9iamVjdCBpZFxuICAgICAgICBvbGRWYWx1ZXMsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIHByZXZpb3VzbHktYWRkZWQgdmFsdWVzXG4gICAgICAgIG9sZEluZGV4LCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBwcmV2aW91c2x5LWFkZGVkIGluZGV4XG4gICAgICAgIG5ld1ZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgdmFsdWVzXG4gICAgICAgIG5ld0luZGV4LCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCBpbmRleFxuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50LFxuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50LFxuICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMsXG4gICAgICAgIG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3MsXG4gICAgICAgIHNvcnQgPSBxdWlja3NvcnQuYnkoZnVuY3Rpb24oaSkgeyByZXR1cm4gbmV3VmFsdWVzW2ldOyB9KSxcbiAgICAgICAgcmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwLFxuICAgICAgICB0ID0gMDtcblxuICAgIC8vIFVwZGF0aW5nIGEgZGltZW5zaW9uIGlzIGEgdHdvLXN0YWdlIHByb2Nlc3MuIEZpcnN0LCB3ZSBtdXN0IHVwZGF0ZSB0aGVcbiAgICAvLyBhc3NvY2lhdGVkIGZpbHRlcnMgZm9yIHRoZSBuZXdseS1hZGRlZCByZWNvcmRzLiBPbmNlIGFsbCBkaW1lbnNpb25zIGhhdmVcbiAgICAvLyB1cGRhdGVkIHRoZWlyIGZpbHRlcnMsIHRoZSBncm91cHMgYXJlIG5vdGlmaWVkIHRvIHVwZGF0ZS5cbiAgICBkYXRhTGlzdGVuZXJzLnVuc2hpZnQocHJlQWRkKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2gocG9zdEFkZCk7XG5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAvLyBBZGQgYSBuZXcgZGltZW5zaW9uIGluIHRoZSBmaWx0ZXIgYml0bWFwIGFuZCBzdG9yZSB0aGUgb2Zmc2V0IGFuZCBiaXRtYXNrLlxuICAgIHZhciB0bXAgPSBmaWx0ZXJzLmFkZCgpO1xuICAgIG9mZnNldCA9IHRtcC5vZmZzZXQ7XG4gICAgb25lID0gdG1wLm9uZTtcbiAgICB6ZXJvID0gfm9uZTtcblxuICAgIC8vIENyZWF0ZSBhIHVuaXF1ZSBJRCBmb3IgdGhlIGRpbWVuc2lvblxuICAgIC8vIElEcyB3aWxsIGJlIHJlLXVzZWQgaWYgZGltZW5zaW9ucyBhcmUgZGlzcG9zZWQuXG4gICAgLy8gRm9yIGludGVybmFsIHVzZSB0aGUgSUQgaXMgdGhlIHN1YmFycmF5IG9mZnNldCBzaGlmdGVkIGxlZnQgNyBiaXRzIG9yJ2Qgd2l0aCB0aGVcbiAgICAvLyBiaXQgb2Zmc2V0IG9mIHRoZSBzZXQgYml0IGluIHRoZSBkaW1lbnNpb24ncyBcIm9uZVwiIG1hc2suXG4gICAgaWQgPSAob2Zmc2V0IDw8IDcpIHwgKE1hdGgubG9nKG9uZSkgLyBNYXRoLmxvZygyKSk7XG5cbiAgICBwcmVBZGQoZGF0YSwgMCwgbik7XG4gICAgcG9zdEFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIGludG8gdGhpcyBkaW1lbnNpb24uXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZmlsdGVycywgdmFsdWVzLCBhbmQgaW5kZXguXG4gICAgZnVuY3Rpb24gcHJlQWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuXG4gICAgICBpZiAoaXRlcmFibGUpe1xuICAgICAgICAvLyBDb3VudCBhbGwgdGhlIHZhbHVlc1xuICAgICAgICB0ID0gMDtcbiAgICAgICAgaiA9IDA7XG4gICAgICAgIGsgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbmV3RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZvcihqID0gMCwgayA9IHZhbHVlKG5ld0RhdGFbaV0pOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5ld1ZhbHVlcyA9IFtdO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UobmV3RGF0YS5sZW5ndGgpO1xuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyb3NzZmlsdGVyX2luZGV4KHQsMSk7XG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cyA9IFtdO1xuICAgICAgICB2YXIgdW5zb3J0ZWRJbmRleCA9IGNyb3NzZmlsdGVyX3JhbmdlKHQpO1xuXG4gICAgICAgIGZvciAobCA9IDAsIGkgPSAwOyBpIDwgbmV3RGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGsgPSB2YWx1ZShuZXdEYXRhW2ldKVxuICAgICAgICAgIC8vXG4gICAgICAgICAgaWYoIWsubGVuZ3RoKXtcbiAgICAgICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnRbaV0gPSAwO1xuICAgICAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzLnB1c2goaSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpXSA9IGsubGVuZ3RoXG4gICAgICAgICAgZm9yIChqID0gMDsgaiA8IGsubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlcy5wdXNoKGtbal0pO1xuICAgICAgICAgICAgdW5zb3J0ZWRJbmRleFtsXSA9IGk7XG4gICAgICAgICAgICBsKys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBTb3J0IG1hcCB1c2VkIHRvIHNvcnQgYm90aCB0aGUgdmFsdWVzIGFuZCB0aGUgdmFsdWVUb0RhdGEgaW5kaWNlc1xuICAgICAgICB2YXIgc29ydE1hcCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UodCksIDAsIHQpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgc29ydE1hcCB0byBzb3J0IHRoZSBuZXdWYWx1ZXNcbiAgICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIHNvcnRNYXApO1xuXG5cbiAgICAgICAgLy8gVXNlIHRoZSBzb3J0TWFwIHRvIHNvcnQgdGhlIHVuc29ydGVkSW5kZXggbWFwXG4gICAgICAgIC8vIG5ld0luZGV4IHNob3VsZCBiZSBhIG1hcCBvZiBzb3J0ZWRWYWx1ZSAtPiBjcm9zc2ZpbHRlckRhdGFcbiAgICAgICAgbmV3SW5kZXggPSBwZXJtdXRlKHVuc29ydGVkSW5kZXgsIHNvcnRNYXApXG5cbiAgICAgIH0gZWxzZXtcbiAgICAgICAgLy8gUGVybXV0ZSBuZXcgdmFsdWVzIGludG8gbmF0dXJhbCBvcmRlciB1c2luZyBhIHN0YW5kYXJkIHNvcnRlZCBpbmRleC5cbiAgICAgICAgbmV3VmFsdWVzID0gbmV3RGF0YS5tYXAodmFsdWUpO1xuICAgICAgICBuZXdJbmRleCA9IHNvcnQoY3Jvc3NmaWx0ZXJfcmFuZ2UobjEpLCAwLCBuMSk7XG4gICAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBuZXdJbmRleCk7XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIG4xID0gdDtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IG5ld1ZhbHVlcyB0byBkZXRlcm1pbmUgd2hpY2ggbmV3IHJlY29yZHMgYXJlIHNlbGVjdGVkLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKG5ld1ZhbHVlcyksIGxvMSA9IGJvdW5kc1swXSwgaGkxID0gYm91bmRzWzFdO1xuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4xOyArK2kpIHtcbiAgICAgICAgICBpZiAoIXJlZmlsdGVyRnVuY3Rpb24obmV3VmFsdWVzW2ldLCBpKSkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlKSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IDE7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbG8xOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gaGkxOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGRpbWVuc2lvbiBwcmV2aW91c2x5IGhhZCBubyBkYXRhLCB0aGVuIHdlIGRvbid0IG5lZWQgdG8gZG8gdGhlXG4gICAgICAvLyBtb3JlIGV4cGVuc2l2ZSBtZXJnZSBvcGVyYXRpb247IHVzZSB0aGUgbmV3IHZhbHVlcyBhbmQgaW5kZXggYXMtaXMuXG4gICAgICBpZiAoIW4wKSB7XG4gICAgICAgIHZhbHVlcyA9IG5ld1ZhbHVlcztcbiAgICAgICAgaW5kZXggPSBuZXdJbmRleDtcbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudCA9IG5ld0l0ZXJhYmxlc0luZGV4Q291bnQ7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXM7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cblxuXG4gICAgICB2YXIgb2xkVmFsdWVzID0gdmFsdWVzLFxuICAgICAgICBvbGRJbmRleCA9IGluZGV4LFxuICAgICAgICBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzXG4gICAgICAgIGkwID0gMCxcbiAgICAgICAgaTEgPSAwO1xuXG4gICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgIG9sZF9uMCA9IG4wXG4gICAgICAgIG4wID0gb2xkVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgbjEgPSB0XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG5ldyBhcnJheXMgaW50byB3aGljaCB0byBtZXJnZSBuZXcgYW5kIG9sZC5cbiAgICAgIHZhbHVlcyA9IGl0ZXJhYmxlID8gbmV3IEFycmF5KG4wICsgbjEpIDogbmV3IEFycmF5KG4pO1xuICAgICAgaW5kZXggPSBpdGVyYWJsZSA/IG5ldyBBcnJheShuMCArIG4xKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgobjAgKyBuMSwgMSk7XG5cbiAgICAgIC8vIENvbmNhdGVuYXRlIHRoZSBuZXdJdGVyYWJsZXNJbmRleENvdW50IG9udG8gdGhlIG9sZCBvbmUuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICB2YXIgb2xkaWljbGVuZ3RoID0gaXRlcmFibGVzSW5kZXhDb3VudC5sZW5ndGg7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQgPSB4ZmlsdGVyQXJyYXkuYXJyYXlMZW5ndGhlbihpdGVyYWJsZXNJbmRleENvdW50LCBuKTtcbiAgICAgICAgZm9yKHZhciBqPTA7IGorb2xkaWljbGVuZ3RoIDwgbjsgaisrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtqK29sZGlpY2xlbmd0aF0gPSBuZXdJdGVyYWJsZXNJbmRleENvdW50W2pdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIHRoZSBvbGQgYW5kIG5ldyBzb3J0ZWQgdmFsdWVzLCBhbmQgb2xkIGFuZCBuZXcgaW5kZXguXG4gICAgICBmb3IgKGkgPSAwOyBpMCA8IG4wICYmIGkxIDwgbjE7ICsraSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTErK10gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgbmV3IHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMSA8IG4xOyArK2kxLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG9sZF9uMCA6IG4wKTtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyksIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFdoZW4gYWxsIGZpbHRlcnMgaGF2ZSB1cGRhdGVkLCBub3RpZnkgaW5kZXggbGlzdGVuZXJzIG9mIHRoZSBuZXcgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHBvc3RBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICBpbmRleExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpOyB9KTtcbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0luZGV4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhrID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhba107XG4gICAgICAgICAgKytqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZXMubGVuZ3RoID0gajtcbiAgICAgIHdoaWxlIChqIDwgbikgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG5cbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9LCBib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSBpbmRleC5sZW5ndGgpO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkID0gW107XG5cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvMSA+IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzAsIGogPSBNYXRoLm1pbihsbzEsIGhpMCk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhpMSA8IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzAsIGhpMSksIGogPSBoaTA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIC8vIEZsaXAgZmlsdGVycyBub3JtYWxseS5cblxuICAgICAgICBmb3IoaT0wOyBpPGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZvciBpdGVyYWJsZXMsIHdlIG5lZWQgdG8gZmlndXJlIG91dCBpZiB0aGUgcm93IGhhcyBiZWVuIGNvbXBsZXRlbHkgcmVtb3ZlZCB2cyBwYXJ0aWFsbHkgaW5jbHVkZWRcbiAgICAgICAgLy8gT25seSBjb3VudCBhIHJvdyBhcyBhZGRlZCBpZiBpdCBpcyBub3QgYWxyZWFkeSBiZWluZyBhZ2dyZWdhdGVkLiBPbmx5IGNvdW50IGEgcm93XG4gICAgICAgIC8vIGFzIHJlbW92ZWQgaWYgdGhlIGxhc3QgZWxlbWVudCBiZWluZyBhZ2dyZWdhdGVkIGlzIHJlbW92ZWQuXG5cbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dKytcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4QWRkZWRbaV1dID0gMDtcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdBZGRlZC5wdXNoKGFkZGVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dLS1cbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPSAxO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdSZW1vdmVkLnB1c2gocmVtb3ZlZFtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkZWQgPSBuZXdBZGRlZDtcbiAgICAgICAgcmVtb3ZlZCA9IG5ld1JlbW92ZWQ7XG5cbiAgICAgICAgLy8gTm93IGhhbmRsZSBlbXB0eSByb3dzLlxuICAgICAgICBpZihib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSBpbmRleC5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKChmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBub3QgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIGFkZFxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgaW4gcGxhY2UgLSByZW1vdmUgZW1wdHkgcm93cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIHJlbW92ZVxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHRyaWdnZXJPbkNoYW5nZSgnZmlsdGVyZWQnKTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0geGZpbHRlckZpbHRlci5maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIHNwZWNpZmllZCByYW5nZSBbbG8sIGhpXS5cbiAgICAvLyBUaGUgbG93ZXIgYm91bmQgaXMgaW5jbHVzaXZlLCBhbmQgdGhlIHVwcGVyIGJvdW5kIGlzIGV4Y2x1c2l2ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJSYW5nZShyYW5nZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IHhmaWx0ZXJGaWx0ZXIuZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIENsZWFycyBhbnkgZmlsdGVycyBvbiB0aGlzIGRpbWVuc2lvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0geGZpbHRlckZpbHRlci5maWx0ZXJBbGwpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckZ1bmN0aW9uKGYpIHtcbiAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBmO1xuICAgICAgcmVmaWx0ZXIgPSB4ZmlsdGVyRmlsdGVyLmZpbHRlckFsbDtcblxuICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmLCBmYWxzZSk7XG5cbiAgICAgIGxvMCA9IDA7XG4gICAgICBoaTAgPSBuO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZiwgZmlsdGVyQWxsKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQgPSBbXSxcbiAgICAgICAgICBpbmRleExlbmd0aCA9IGluZGV4Lmxlbmd0aDtcblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbmRleExlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpbmRleFtpXV0gJiBvbmUpIF4gISEoeCA9IGYodmFsdWVzW2ldLCBpKSkpIHtcbiAgICAgICAgICAgIGlmICh4KSBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgZWxzZSByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIGZvcihpPTA7IGkgPCBpbmRleExlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYoZih2YWx1ZXNbaV0sIGkpKSB7XG4gICAgICAgICAgICBhZGRlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIGZvcihpPTA7IGk8YWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZihmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dICYgb25lKSBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dICY9IHplcm87XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZighKGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSAmIG9uZSkpIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSB8PSBvbmU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIHRoaXMgcGFydGljdWxhciB2YWx1ZSBuZWVkcyB0byBiZSBhZGRlZFxuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPT09IDEpIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dKytcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPSAwO1xuICAgICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0gPT09IDEpIHtcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICAgIG5ld0FkZGVkLnB1c2goYWRkZWRbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIHRoaXMgcGFydGljdWxhciB2YWx1ZSBuZWVkcyB0byBiZSByZW1vdmVkXG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID09PSAwKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dLS1cbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9IDE7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dID09PSAwKSB7XG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICAgIG5ld1JlbW92ZWQucHVzaChyZW1vdmVkW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRlZCA9IG5ld0FkZGVkO1xuICAgICAgICByZW1vdmVkID0gbmV3UmVtb3ZlZDtcblxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGZpbHRlckFsbCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHRvcCBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiB0b3AoaywgdG9wX29mZnNldCkge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGhpMCxcbiAgICAgICAgICBqLFxuICAgICAgICAgIHRvU2tpcCA9IDA7XG5cbiAgICAgIGlmKHRvcF9vZmZzZXQgJiYgdG9wX29mZnNldCA+IDApIHRvU2tpcCA9IHRvcF9vZmZzZXQ7XG5cbiAgICAgIHdoaWxlICgtLWkgPj0gbG8wICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGlmKHRvU2tpcCA+IDApIHtcbiAgICAgICAgICAgIC8vc2tpcCBtYXRjaGluZyByb3dcbiAgICAgICAgICAgIC0tdG9Ta2lwO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgICAgLS1rO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggJiYgayA+IDA7IGkrKykge1xuICAgICAgICAgIC8vIEFkZCByb3cgd2l0aCBlbXB0eSBpdGVyYWJsZSBjb2x1bW4gYXQgdGhlIGVuZFxuICAgICAgICAgIGlmKGZpbHRlcnMuemVybyhqID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldKSkge1xuICAgICAgICAgICAgaWYodG9Ta2lwID4gMCkge1xuICAgICAgICAgICAgICAvL3NraXAgbWF0Y2hpbmcgcm93XG4gICAgICAgICAgICAgIC0tdG9Ta2lwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgICAgLS1rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgYm90dG9tIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIGJvdHRvbShrLCBib3R0b21fb2Zmc2V0KSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgdG9Ta2lwID0gMDtcblxuICAgICAgaWYoYm90dG9tX29mZnNldCAmJiBib3R0b21fb2Zmc2V0ID4gMCkgdG9Ta2lwID0gYm90dG9tX29mZnNldDtcblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgLy8gQWRkIHJvdyB3aXRoIGVtcHR5IGl0ZXJhYmxlIGNvbHVtbiBhdCB0aGUgdG9wXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggJiYgayA+IDA7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnMuemVybyhqID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldKSkge1xuICAgICAgICAgICAgaWYodG9Ta2lwID4gMCkge1xuICAgICAgICAgICAgICAvL3NraXAgbWF0Y2hpbmcgcm93XG4gICAgICAgICAgICAgIC0tdG9Ta2lwO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgICAgLS1rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpID0gbG8wO1xuXG4gICAgICB3aGlsZSAoaSA8IGhpMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGogPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBpZih0b1NraXAgPiAwKSB7XG4gICAgICAgICAgICAvL3NraXAgbWF0Y2hpbmcgcm93XG4gICAgICAgICAgICAtLXRvU2tpcDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgIC0taztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gQWRkcyBhIG5ldyBncm91cCB0byB0aGlzIGRpbWVuc2lvbiwgdXNpbmcgdGhlIHNwZWNpZmllZCBrZXkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZ3JvdXAoa2V5KSB7XG4gICAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICAgIHRvcDogdG9wLFxuICAgICAgICBhbGw6IGFsbCxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICAgIG9yZGVyOiBvcmRlcixcbiAgICAgICAgb3JkZXJOYXR1cmFsOiBvcmRlck5hdHVyYWwsXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZ3JvdXAgd2lsbCBiZSByZW1vdmVkIHdoZW4gdGhlIGRpbWVuc2lvbiBpcyByZW1vdmVkLlxuICAgICAgZGltZW5zaW9uR3JvdXBzLnB1c2goZ3JvdXApO1xuXG4gICAgICB2YXIgZ3JvdXBzLCAvLyBhcnJheSBvZiB7a2V5LCB2YWx1ZX1cbiAgICAgICAgICBncm91cEluZGV4LCAvLyBvYmplY3QgaWQg4oamIGdyb3VwIGlkXG4gICAgICAgICAgZ3JvdXBXaWR0aCA9IDgsXG4gICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpLFxuICAgICAgICAgIGsgPSAwLCAvLyBjYXJkaW5hbGl0eVxuICAgICAgICAgIHNlbGVjdCxcbiAgICAgICAgICBoZWFwLFxuICAgICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldE5lZWRlZCA9IHRydWUsXG4gICAgICAgICAgZ3JvdXBBbGwgPSBrZXkgPT09IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkga2V5ID0gY3Jvc3NmaWx0ZXJfaWRlbnRpdHk7XG5cbiAgICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIGFzc29jaWF0ZWQgcmVkdWNlIHZhbHVlcy4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0b1xuICAgICAgLy8gdGhlIHBhcmVudCBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZCwgYW5kIGNvbXB1dGUgbmV3IGtleXMuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgICAgaW5kZXhMaXN0ZW5lcnMucHVzaChhZGQpO1xuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoZSBncm91cGluZy5cbiAgICAgIGFkZCh2YWx1ZXMsIGluZGV4LCAwLCBuKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBncm91cHMgYW5kIGdyb3VwSW5kZXguXG4gICAgICBmdW5jdGlvbiBhZGQobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKSB7XG5cbiAgICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgICBuMG9sZCA9IG4wXG4gICAgICAgICAgbjAgPSB2YWx1ZXMubGVuZ3RoIC0gbmV3VmFsdWVzLmxlbmd0aFxuICAgICAgICAgIG4xID0gbmV3VmFsdWVzLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICByZUluZGV4ID0gaXRlcmFibGUgPyBbXSA6IGNyb3NzZmlsdGVyX2luZGV4KGssIGdyb3VwQ2FwYWNpdHkpLFxuICAgICAgICAgICAgYWRkID0gcmVkdWNlQWRkLFxuICAgICAgICAgICAgcmVtb3ZlID0gcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgICAgaW5pdGlhbCA9IHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgICBrMCA9IGssIC8vIG9sZCBjYXJkaW5hbGl0eVxuICAgICAgICAgICAgaTAgPSAwLCAvLyBpbmRleCBvZiBvbGQgZ3JvdXBcbiAgICAgICAgICAgIGkxID0gMCwgLy8gaW5kZXggb2YgbmV3IHJlY29yZFxuICAgICAgICAgICAgaiwgLy8gb2JqZWN0IGlkXG4gICAgICAgICAgICBnMCwgLy8gb2xkIGdyb3VwXG4gICAgICAgICAgICB4MCwgLy8gb2xkIGtleVxuICAgICAgICAgICAgeDEsIC8vIG5ldyBrZXlcbiAgICAgICAgICAgIGcsIC8vIGdyb3VwIHRvIGFkZFxuICAgICAgICAgICAgeDsgLy8ga2V5IG9mIGdyb3VwIHRvIGFkZFxuXG4gICAgICAgIC8vIElmIGEgcmVzZXQgaXMgbmVlZGVkLCB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlcy5cbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSBhZGQgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZW1vdmUgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgICAvLyBSZXNldCB0aGUgbmV3IGdyb3VwcyAoayBpcyBhIGxvd2VyIGJvdW5kKS5cbiAgICAgICAgLy8gQWxzbywgbWFrZSBzdXJlIHRoYXQgZ3JvdXBJbmRleCBleGlzdHMgYW5kIGlzIGxvbmcgZW5vdWdoLlxuICAgICAgICBncm91cHMgPSBuZXcgQXJyYXkoayksIGsgPSAwO1xuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IGdyb3VwSW5kZXggOiBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyB4ZmlsdGVyQXJyYXkuYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuXG4gICAgICAgICAgd2hpbGUgKHgxIDw9IHgpIHtcbiAgICAgICAgICAgIGogPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBuMG9sZCA6IG4wKVxuXG5cbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgICAgaWYoZ3JvdXBJbmRleFtqXSl7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXS5wdXNoKGspXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdID0gW2tdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHdheXMgYWRkIG5ldyB2YWx1ZXMgdG8gZ3JvdXBzLiBPbmx5IHJlbW92ZSB3aGVuIG5vdCBpbiBmaWx0ZXIuXG4gICAgICAgICAgICAvLyBUaGlzIGdpdmVzIGdyb3VwcyBmdWxsIGluZm9ybWF0aW9uIG9uIGRhdGEgbGlmZS1jeWNsZS5cbiAgICAgICAgICAgIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChqLCBvZmZzZXQsIHplcm8pKSBnLnZhbHVlID0gcmVtb3ZlKGcudmFsdWUsIGRhdGFbal0sIGZhbHNlKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoMWFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBGaWxsIGluIGdhcHMgd2l0aCBlbXB0eSBhcnJheXMgd2hlcmUgdGhlcmUgbWF5IGhhdmUgYmVlbiByb3dzIHdpdGggZW1wdHkgaXRlcmFibGVzXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBpZighZ3JvdXBJbmRleFtpXSl7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaV0gPSBbXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZihrID4gaTApe1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBwZXJtdXRlKGdyb3VwSW5kZXgsIHJlSW5kZXgsIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgaysrXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IHhmaWx0ZXJBcnJheS5hcnJheVdpZGVuKHJlSW5kZXgsIGdyb3VwV2lkdGggPDw9IDEpO1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IHhmaWx0ZXJBcnJheS5hcnJheVdpZGVuKGdyb3VwSW5kZXgsIGdyb3VwV2lkdGgpO1xuICAgICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB2YXIgb2xkSyA9IGssXG4gICAgICAgICAgICAgIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgICAgc2Vlbkdyb3VwcyA9IGNyb3NzZmlsdGVyX2luZGV4KG9sZEssIG9sZEspO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIG91dCBub24tbWF0Y2hlcyBieSBjb3B5aW5nIG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMgdG9cbiAgICAgICAgICAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtqXSA9IGdyb3VwSW5kZXhbaV1dID0gMTtcbiAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlYXNzZW1ibGUgZ3JvdXBzIGluY2x1ZGluZyBvbmx5IHRob3NlIGdyb3VwcyB0aGF0IHdlcmUgcmVmZXJyZWRcbiAgICAgICAgICAvLyB0byBieSBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzLiAgTm90ZSB0aGUgbmV3IGdyb3VwIGluZGV4IGluXG4gICAgICAgICAgLy8gc2Vlbkdyb3Vwcy5cbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9sZEs7ICsraSkge1xuICAgICAgICAgICAgaWYgKHNlZW5Hcm91cHNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tpXSA9IGsrKztcbiAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gob2xkR3JvdXBzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICAgIC8vIFJlaW5kZXggdGhlIGdyb3VwIGluZGV4IHVzaW5nIHNlZW5Hcm91cHMgdG8gZmluZCB0aGUgbmV3IGluZGV4LlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqOyArK2kpIGdyb3VwSW5kZXhbaV0gPSBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID0gayA+IDFcbiAgICAgICAgICAgICAgPyAocmVzZXQgPSByZXNldE1hbnksIHVwZGF0ZSA9IHVwZGF0ZU1hbnkpXG4gICAgICAgICAgICAgIDogayA9PT0gMSA/IChyZXNldCA9IHJlc2V0T25lLCB1cGRhdGUgPSB1cGRhdGVPbmUpXG4gICAgICAgICAgICAgIDogcmVzZXQgPSB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBBbGwpIHJldHVybjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHJldHVybjtcbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID1cbiAgICAgICAgICB1cGRhdGUgPSByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlTWFueShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuXG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtrXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhba10ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBqLFxuICAgICAgICAgICAgZztcblxuICAgICAgICAvLyBSZXNldCBhbGwgZ3JvdXAgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgazsgKytpKSB7XG4gICAgICAgICAgZ3JvdXBzW2ldLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldW2pdXTtcbiAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlLCBqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGFycmF5IG9mIGdyb3VwIHZhbHVlcywgaW4gdGhlIGRpbWVuc2lvbidzIG5hdHVyYWwgb3JkZXIuXG4gICAgICBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgSyBncm91cCB2YWx1ZXMsIGluIHJlZHVjZSBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxlY3QoYWxsKCksIDAsIGdyb3Vwcy5sZW5ndGgsIGspO1xuICAgICAgICByZXR1cm4gaGVhcC5zb3J0KHRvcCwgMCwgdG9wLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlcywgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoeGZpbHRlclJlZHVjZS5yZWR1Y2VJbmNyZW1lbnQsIHhmaWx0ZXJSZWR1Y2UucmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUFkZCh2YWx1ZSksIHhmaWx0ZXJSZWR1Y2UucmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0geGZpbHRlckhlYXBzZWxlY3QuYnkodmFsdWVPZik7XG4gICAgICAgIGhlYXAgPSB4ZmlsdGVySGVhcC5ieSh2YWx1ZU9mKTtcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVPZihkKSB7IHJldHVybiB2YWx1ZShkLnZhbHVlKTsgfVxuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBuYXR1cmFsIG9yZGVyaW5nIGJ5IHJlZHVjZSB2YWx1ZS5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyTmF0dXJhbCgpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyKGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgY2FyZGluYWxpdHkgb2YgdGhpcyBncm91cCwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICAgICAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBpbmRleExpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICAgIGlmIChpID49IDApIGluZGV4TGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZHVjZUNvdW50KCkub3JkZXJOYXR1cmFsKCk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyBhIHNpbmdsZXRvbiBncm91cC5cbiAgICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICAgIHZhciBnID0gZ3JvdXAoY3Jvc3NmaWx0ZXJfbnVsbCksIGFsbCA9IGcuYWxsO1xuICAgICAgZGVsZXRlIGcuYWxsO1xuICAgICAgZGVsZXRlIGcudG9wO1xuICAgICAgZGVsZXRlIGcub3JkZXI7XG4gICAgICBkZWxldGUgZy5vcmRlck5hdHVyYWw7XG4gICAgICBkZWxldGUgZy5zaXplO1xuICAgICAgZy52YWx1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsKClbMF0udmFsdWU7IH07XG4gICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZGltZW5zaW9uIGFuZCBhc3NvY2lhdGVkIGdyb3VwcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICBkaW1lbnNpb25Hcm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBncm91cC5kaXNwb3NlKCk7IH0pO1xuICAgICAgdmFyIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocHJlQWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwb3N0QWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgZmlsdGVycy5tYXNrc1tvZmZzZXRdICY9IHplcm87XG4gICAgICByZXR1cm4gZmlsdGVyQWxsKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgfVxuXG4gIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBncm91cEFsbCBvbiBhIGR1bW15IGRpbWVuc2lvbi5cbiAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgb3B0aW1pemVkIHNpbmNlIGl0IGFsd2F5cyBoYXMgY2FyZGluYWxpdHkgMS5cbiAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgdmFyIGdyb3VwID0ge1xuICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciByZWR1Y2VWYWx1ZSxcbiAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcblxuICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWUuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG8gdGhlIHBhcmVudFxuICAgIC8vIGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLlxuICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKGFkZCk7XG5cbiAgICAvLyBGb3IgY29uc2lzdGVuY3k7IGFjdHVhbGx5IGEgbm8tb3Agc2luY2UgcmVzZXROZWVkZWQgaXMgdHJ1ZS5cbiAgICBhZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICBmdW5jdGlvbiBhZGQobmV3RGF0YSwgbjApIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IG4wOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICBmdW5jdGlvbiB1cGRhdGUoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbjtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGsgPSBhZGRlZFtpXSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLm9ubHkoayA9IHJlbW92ZWRbaV0sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlIGZyb20gc2NyYXRjaC5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGl0IGlzIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWUsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUluY3JlbWVudCwgeGZpbHRlclJlZHVjZS5yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJlZHVjZSh4ZmlsdGVyUmVkdWNlLnJlZHVjZUFkZCh2YWx1ZSksIHhmaWx0ZXJSZWR1Y2UucmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgcmF3IHJvdyBkYXRhIGNvbnRhaW5lZCBpbiB0aGlzIGNyb3NzZmlsdGVyXG4gIGZ1bmN0aW9uIGFsbCgpe1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgZnVuY3Rpb24gb25DaGFuZ2UoY2Ipe1xuICAgIGlmKHR5cGVvZiBjYiAhPT0gJ2Z1bmN0aW9uJyl7XG4gICAgICBjb25zb2xlLndhcm4oJ29uQ2hhbmdlIGNhbGxiYWNrIHBhcmFtZXRlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNhbGxiYWNrcy5wdXNoKGNiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoY2FsbGJhY2tzLmluZGV4T2YoY2IpLCAxKTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gdHJpZ2dlck9uQ2hhbmdlKGV2ZW50TmFtZSl7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNhbGxiYWNrc1tpXShldmVudE5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhcmd1bWVudHMubGVuZ3RoXG4gICAgICA/IGFkZChhcmd1bWVudHNbMF0pXG4gICAgICA6IGNyb3NzZmlsdGVyO1xufVxuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIHNpemUgbiwgYmlnIGVub3VnaCB0byBzdG9yZSBpZHMgdXAgdG8gbS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2luZGV4KG4sIG0pIHtcbiAgcmV0dXJuIChtIDwgMHgxMDFcbiAgICAgID8geGZpbHRlckFycmF5LmFycmF5OCA6IG0gPCAweDEwMDAxXG4gICAgICA/IHhmaWx0ZXJBcnJheS5hcnJheTE2XG4gICAgICA6IHhmaWx0ZXJBcnJheS5hcnJheTMyKShuKTtcbn1cblxuLy8gQ29uc3RydWN0cyBhIG5ldyBhcnJheSBvZiBzaXplIG4sIHdpdGggc2VxdWVudGlhbCB2YWx1ZXMgZnJvbSAwIHRvIG4gLSAxLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmFuZ2Uobikge1xuICB2YXIgcmFuZ2UgPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgZm9yICh2YXIgaSA9IC0xOyArK2kgPCBuOykgcmFuZ2VbaV0gPSBpO1xuICByZXR1cm4gcmFuZ2U7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2NhcGFjaXR5KHcpIHtcbiAgcmV0dXJuIHcgPT09IDhcbiAgICAgID8gMHgxMDAgOiB3ID09PSAxNlxuICAgICAgPyAweDEwMDAwXG4gICAgICA6IDB4MTAwMDAwMDAwO1xufVxuIiwiZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCB2YWx1ZSwgMCwgbiksIGJpc2VjdC5yaWdodCh2YWx1ZXMsIHZhbHVlLCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpIHtcbiAgdmFyIG1pbiA9IHJhbmdlWzBdLFxuICAgICAgbWF4ID0gcmFuZ2VbMV07XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIG1pbiwgMCwgbiksIGJpc2VjdC5sZWZ0KHZhbHVlcywgbWF4LCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckFsbCh2YWx1ZXMpIHtcbiAgcmV0dXJuIFswLCB2YWx1ZXMubGVuZ3RoXTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGZpbHRlckV4YWN0OiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdCxcbiAgZmlsdGVyUmFuZ2U6IGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlLFxuICBmaWx0ZXJBbGw6IGNyb3NzZmlsdGVyX2ZpbHRlckFsbFxufTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGhlYXBfYnk7XG4iLCJ2YXIgY3Jvc3NmaWx0ZXJfaWRlbnRpdHkgPSByZXF1aXJlKCcuL2lkZW50aXR5Jyk7XG52YXIgeEZpbHRlckhlYXAgPSByZXF1aXJlKCcuL2hlYXAnKTtcblxuZnVuY3Rpb24gaGVhcHNlbGVjdF9ieShmKSB7XG4gIHZhciBoZWFwID0geEZpbHRlckhlYXAuYnkoZik7XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgayBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYVtsbzpoaV0uXG4gIC8vIFRoZSByZXR1cm5lZCBhcnJheSBpcyBub3Qgc29ydGVkLCBidXQgbWFpbnRhaW5zIHRoZSBoZWFwIHByb3BlcnR5LiBJZiBrIGlzXG4gIC8vIGdyZWF0ZXIgdGhhbiBoaSAtIGxvLCB0aGVuIGZld2VyIHRoYW4gayBlbGVtZW50cyB3aWxsIGJlIHJldHVybmVkLiBUaGVcbiAgLy8gb3JkZXIgb2YgZWxlbWVudHMgaW4gYSBpcyB1bmNoYW5nZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gIGZ1bmN0aW9uIGhlYXBzZWxlY3QoYSwgbG8sIGhpLCBrKSB7XG4gICAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KGsgPSBNYXRoLm1pbihoaSAtIGxvLCBrKSksXG4gICAgICAgIG1pbixcbiAgICAgICAgaSxcbiAgICAgICAgeCxcbiAgICAgICAgZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHF1ZXVlW2ldID0gYVtsbysrXTtcbiAgICBoZWFwKHF1ZXVlLCAwLCBrKTtcblxuICAgIGlmIChsbyA8IGhpKSB7XG4gICAgICBtaW4gPSBmKHF1ZXVlWzBdKTtcbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHggPSBmKGQgPSBhW2xvXSkgPiBtaW4pIHtcbiAgICAgICAgICBxdWV1ZVswXSA9IGQ7XG4gICAgICAgICAgbWluID0gZihoZWFwKHF1ZXVlLCAwLCBrKVswXSk7XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKCsrbG8gPCBoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXVlO1xuICB9XG5cbiAgcmV0dXJuIGhlYXBzZWxlY3Q7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gaGVhcHNlbGVjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5tb2R1bGUuZXhwb3J0cy5ieSA9IGhlYXBzZWxlY3RfYnk7IC8vIGFzc2lnbiB0aGUgcmF3IGZ1bmN0aW9uIHRvIHRoZSBleHBvcnQgYXMgd2VsbFxuIiwiZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaWRlbnRpdHkoZCkge1xuICByZXR1cm4gZDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcblxuZnVuY3Rpb24gaW5zZXJ0aW9uc29ydF9ieShmKSB7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0aW9uc29ydChhLCBsbywgaGkpIHtcbiAgICBmb3IgKHZhciBpID0gbG8gKyAxOyBpIDwgaGk7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IGksIHQgPSBhW2ldLCB4ID0gZih0KTsgaiA+IGxvICYmIGYoYVtqIC0gMV0pID4geDsgLS1qKSB7XG4gICAgICAgIGFbal0gPSBhW2ogLSAxXTtcbiAgICAgIH1cbiAgICAgIGFbal0gPSB0O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHJldHVybiBpbnNlcnRpb25zb3J0O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGluc2VydGlvbnNvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xubW9kdWxlLmV4cG9ydHMuYnkgPSBpbnNlcnRpb25zb3J0X2J5O1xuIiwiZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfbnVsbCgpIHtcbiAgcmV0dXJuIG51bGw7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiIsImZ1bmN0aW9uIHBlcm11dGUoYXJyYXksIGluZGV4LCBkZWVwKSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW5kZXgubGVuZ3RoLCBjb3B5ID0gZGVlcCA/IEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYXJyYXkpKSA6IG5ldyBBcnJheShuKTsgaSA8IG47ICsraSkge1xuICAgIGNvcHlbaV0gPSBhcnJheVtpbmRleFtpXV07XG4gIH1cbiAgcmV0dXJuIGNvcHk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGVybXV0ZTtcbiIsInZhciBjcm9zc2ZpbHRlcl9pZGVudGl0eSA9IHJlcXVpcmUoJy4vaWRlbnRpdHknKTtcbnZhciB4RmlsdGVySW5zZXJ0aW9uc29ydCA9IHJlcXVpcmUoJy4vaW5zZXJ0aW9uc29ydCcpO1xuXG4vLyBBbGdvcml0aG0gZGVzaWduZWQgYnkgVmxhZGltaXIgWWFyb3NsYXZza2l5LlxuLy8gSW1wbGVtZW50YXRpb24gYmFzZWQgb24gdGhlIERhcnQgcHJvamVjdDsgc2VlIE5PVElDRSBhbmQgQVVUSE9SUyBmb3IgZGV0YWlscy5cblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSB4RmlsdGVySW5zZXJ0aW9uc29ydC5ieShmKTtcblxuICBmdW5jdGlvbiBzb3J0KGEsIGxvLCBoaSkge1xuICAgIHJldHVybiAoaGkgLSBsbyA8IHF1aWNrc29ydF9zaXplVGhyZXNob2xkXG4gICAgICAgID8gaW5zZXJ0aW9uc29ydFxuICAgICAgICA6IHF1aWNrc29ydCkoYSwgbG8sIGhpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHF1aWNrc29ydChhLCBsbywgaGkpIHtcbiAgICAvLyBDb21wdXRlIHRoZSB0d28gcGl2b3RzIGJ5IGxvb2tpbmcgYXQgNSBlbGVtZW50cy5cbiAgICB2YXIgc2l4dGggPSAoaGkgLSBsbykgLyA2IHwgMCxcbiAgICAgICAgaTEgPSBsbyArIHNpeHRoLFxuICAgICAgICBpNSA9IGhpIC0gMSAtIHNpeHRoLFxuICAgICAgICBpMyA9IGxvICsgaGkgLSAxID4+IDEsICAvLyBUaGUgbWlkcG9pbnQuXG4gICAgICAgIGkyID0gaTMgLSBzaXh0aCxcbiAgICAgICAgaTQgPSBpMyArIHNpeHRoO1xuXG4gICAgdmFyIGUxID0gYVtpMV0sIHgxID0gZihlMSksXG4gICAgICAgIGUyID0gYVtpMl0sIHgyID0gZihlMiksXG4gICAgICAgIGUzID0gYVtpM10sIHgzID0gZihlMyksXG4gICAgICAgIGU0ID0gYVtpNF0sIHg0ID0gZihlNCksXG4gICAgICAgIGU1ID0gYVtpNV0sIHg1ID0gZihlNSk7XG5cbiAgICB2YXIgdDtcblxuICAgIC8vIFNvcnQgdGhlIHNlbGVjdGVkIDUgZWxlbWVudHMgdXNpbmcgYSBzb3J0aW5nIG5ldHdvcmsuXG4gICAgaWYgKHgxID4geDIpIHQgPSBlMSwgZTEgPSBlMiwgZTIgPSB0LCB0ID0geDEsIHgxID0geDIsIHgyID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MSA+IHgzKSB0ID0gZTEsIGUxID0gZTMsIGUzID0gdCwgdCA9IHgxLCB4MSA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDEgPiB4NCkgdCA9IGUxLCBlMSA9IGU0LCBlNCA9IHQsIHQgPSB4MSwgeDEgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MyA+IHg0KSB0ID0gZTMsIGUzID0gZTQsIGU0ID0gdCwgdCA9IHgzLCB4MyA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgyID4geDUpIHQgPSBlMiwgZTIgPSBlNSwgZTUgPSB0LCB0ID0geDIsIHgyID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG5cbiAgICB2YXIgcGl2b3QxID0gZTIsIHBpdm90VmFsdWUxID0geDIsXG4gICAgICAgIHBpdm90MiA9IGU0LCBwaXZvdFZhbHVlMiA9IHg0O1xuXG4gICAgLy8gZTIgYW5kIGU0IGhhdmUgYmVlbiBzYXZlZCBpbiB0aGUgcGl2b3QgdmFyaWFibGVzLiBUaGV5IHdpbGwgYmUgd3JpdHRlblxuICAgIC8vIGJhY2ssIG9uY2UgdGhlIHBhcnRpdGlvbmluZyBpcyBmaW5pc2hlZC5cbiAgICBhW2kxXSA9IGUxO1xuICAgIGFbaTJdID0gYVtsb107XG4gICAgYVtpM10gPSBlMztcbiAgICBhW2k0XSA9IGFbaGkgLSAxXTtcbiAgICBhW2k1XSA9IGU1O1xuXG4gICAgdmFyIGxlc3MgPSBsbyArIDEsICAgLy8gRmlyc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cbiAgICAgICAgZ3JlYXQgPSBoaSAtIDI7ICAvLyBMYXN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG5cbiAgICAvLyBOb3RlIHRoYXQgZm9yIHZhbHVlIGNvbXBhcmlzb24sIDwsIDw9LCA+PSBhbmQgPiBjb2VyY2UgdG8gYSBwcmltaXRpdmUgdmlhXG4gICAgLy8gT2JqZWN0LnByb3RvdHlwZS52YWx1ZU9mOyA9PSBhbmQgPT09IGRvIG5vdCwgc28gaW4gb3JkZXIgdG8gYmUgY29uc2lzdGVudFxuICAgIC8vIHdpdGggbmF0dXJhbCBvcmRlciAoc3VjaCBhcyBmb3IgRGF0ZSBvYmplY3RzKSwgd2UgbXVzdCBkbyB0d28gY29tcGFyZXMuXG4gICAgdmFyIHBpdm90c0VxdWFsID0gcGl2b3RWYWx1ZTEgPD0gcGl2b3RWYWx1ZTIgJiYgcGl2b3RWYWx1ZTEgPj0gcGl2b3RWYWx1ZTI7XG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG5cbiAgICAgIC8vIERlZ2VuZXJhdGVkIGNhc2Ugd2hlcmUgdGhlIHBhcnRpdGlvbmluZyBiZWNvbWVzIGEgZHV0Y2ggbmF0aW9uYWwgZmxhZ1xuICAgICAgLy8gcHJvYmxlbS5cbiAgICAgIC8vXG4gICAgICAvLyBbIHwgIDwgcGl2b3QgIHwgPT0gcGl2b3QgfCB1bnBhcnRpdGlvbmVkIHwgPiBwaXZvdCAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgICBeICAgICAgICAgIF4gICAgICAgICAgICAgXiAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgayAgICAgICAgICAgZ3JlYXQgICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMSkgZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90LlxuICAgICAgLy8gICAyKSBmb3IgeCBpbiBbbGVzcywga1sgOiB4ID09IHBpdm90LlxuICAgICAgLy8gICAzKSBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdC5cbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyArK2spIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIGlmICh4ayA+IHBpdm90VmFsdWUxKSB7XG5cbiAgICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBlbGVtZW50IDw9IHBpdm90IGluIHRoZSByYW5nZSBbayAtIDEsIGdyZWF0XSBhbmRcbiAgICAgICAgICAvLyBwdXQgWzplazpdIHRoZXJlLiBXZSBrbm93IHRoYXQgc3VjaCBhbiBlbGVtZW50IG11c3QgZXhpc3Q6XG4gICAgICAgICAgLy8gV2hlbiBrID09IGxlc3MsIHRoZW4gZWwzICh3aGljaCBpcyBlcXVhbCB0byBwaXZvdCkgbGllcyBpbiB0aGVcbiAgICAgICAgICAvLyBpbnRlcnZhbC4gT3RoZXJ3aXNlIGFbayAtIDFdID09IHBpdm90IGFuZCB0aGUgc2VhcmNoIHN0b3BzIGF0IGstMS5cbiAgICAgICAgICAvLyBOb3RlIHRoYXQgaW4gdGhlIGxhdHRlciBjYXNlIGludmFyaWFudCAyIHdpbGwgYmUgdmlvbGF0ZWQgZm9yIGFcbiAgICAgICAgICAvLyBzaG9ydCBhbW91bnQgb2YgdGltZS4gVGhlIGludmFyaWFudCB3aWxsIGJlIHJlc3RvcmVkIHdoZW4gdGhlXG4gICAgICAgICAgLy8gcGl2b3RzIGFyZSBwdXQgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW4gdGhlIHdoaWxlLWxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgLy8gTm90ZTogaWYgZ3JlYXQgPCBrIHRoZW4gd2Ugd2lsbCBleGl0IHRoZSBvdXRlciBsb29wIGFuZCBmaXhcbiAgICAgICAgICAgICAgLy8gaW52YXJpYW50IDIgKHdoaWNoIHdlIGp1c3QgdmlvbGF0ZWQpLlxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA8IHBpdm90MVxuICAgICAgLy8gIDIuID49IHBpdm90MSAmJiA8PSBwaXZvdDJcbiAgICAgIC8vICAzLiA+IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyB8IDwgcGl2b3QxIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPiBwaXZvdDIgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuICAgICAgLy9cbiAgICAgIC8vIGFbbGVmdF0gYW5kIGFbcmlnaHRdIGFyZSB1bmRlZmluZWQgYW5kIGFyZSBmaWxsZWQgYWZ0ZXIgdGhlXG4gICAgICAvLyBwYXJ0aXRpb25pbmcuXG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gXWxlZnQsIGxlc3NbIDogeCA8IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPD0geCAmJiB4IDw9IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsIHJpZ2h0WyA6IHggPiBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgICsrbGVzcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8PSBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPj0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIE1vdmUgcGl2b3RzIGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgIC8vIFdlIHNocnVuayB0aGUgbGlzdCBmcm9tIGJvdGggc2lkZXMgKGFbbGVmdF0gYW5kIGFbcmlnaHRdIGhhdmVcbiAgICAvLyBtZWFuaW5nbGVzcyB2YWx1ZXMgaW4gdGhlbSkgYW5kIG5vdyB3ZSBtb3ZlIGVsZW1lbnRzIGZyb20gdGhlIGZpcnN0XG4gICAgLy8gYW5kIHRoaXJkIHBhcnRpdGlvbiBpbnRvIHRoZXNlIGxvY2F0aW9ucyBzbyB0aGF0IHdlIGNhbiBzdG9yZSB0aGVcbiAgICAvLyBwaXZvdHMuXG4gICAgYVtsb10gPSBhW2xlc3MgLSAxXTtcbiAgICBhW2xlc3MgLSAxXSA9IHBpdm90MTtcbiAgICBhW2hpIC0gMV0gPSBhW2dyZWF0ICsgMV07XG4gICAgYVtncmVhdCArIDFdID0gcGl2b3QyO1xuXG4gICAgLy8gVGhlIGxpc3QgaXMgbm93IHBhcnRpdGlvbmVkIGludG8gdGhyZWUgcGFydGl0aW9uczpcbiAgICAvLyBbIDwgcGl2b3QxICAgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICAgfCAgPiBwaXZvdDIgICBdXG4gICAgLy8gIF4gICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICBeXG4gICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcblxuICAgIC8vIFJlY3Vyc2l2ZSBkZXNjZW50LiAoRG9uJ3QgaW5jbHVkZSB0aGUgcGl2b3QgdmFsdWVzLilcbiAgICBzb3J0KGEsIGxvLCBsZXNzIC0gMSk7XG4gICAgc29ydChhLCBncmVhdCArIDIsIGhpKTtcblxuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuICAgICAgLy8gQWxsIGVsZW1lbnRzIGluIHRoZSBzZWNvbmQgcGFydGl0aW9uIGFyZSBlcXVhbCB0byB0aGUgcGl2b3QuIE5vXG4gICAgICAvLyBuZWVkIHRvIHNvcnQgdGhlbS5cbiAgICAgIHJldHVybiBhO1xuICAgIH1cblxuICAgIC8vIEluIHRoZW9yeSBpdCBzaG91bGQgYmUgZW5vdWdoIHRvIGNhbGwgX2RvU29ydCByZWN1cnNpdmVseSBvbiB0aGUgc2Vjb25kXG4gICAgLy8gcGFydGl0aW9uLlxuICAgIC8vIFRoZSBBbmRyb2lkIHNvdXJjZSBob3dldmVyIHJlbW92ZXMgdGhlIHBpdm90IGVsZW1lbnRzIGZyb20gdGhlIHJlY3Vyc2l2ZVxuICAgIC8vIGNhbGwgaWYgdGhlIHNlY29uZCBwYXJ0aXRpb24gaXMgdG9vIGxhcmdlIChtb3JlIHRoYW4gMi8zIG9mIHRoZSBsaXN0KS5cbiAgICBpZiAobGVzcyA8IGkxICYmIGdyZWF0ID4gaTUpIHtcbiAgICAgIHZhciBsZXNzVmFsdWUsIGdyZWF0VmFsdWU7XG4gICAgICB3aGlsZSAoKGxlc3NWYWx1ZSA9IGYoYVtsZXNzXSkpIDw9IHBpdm90VmFsdWUxICYmIGxlc3NWYWx1ZSA+PSBwaXZvdFZhbHVlMSkgKytsZXNzO1xuICAgICAgd2hpbGUgKChncmVhdFZhbHVlID0gZihhW2dyZWF0XSkpIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIC0tZ3JlYXQ7XG5cbiAgICAgIC8vIENvcHkgcGFzdGUgb2YgdGhlIHByZXZpb3VzIDMtd2F5IHBhcnRpdGlvbmluZyB3aXRoIGFkYXB0aW9ucy5cbiAgICAgIC8vXG4gICAgICAvLyBXZSBwYXJ0aXRpb24gdGhlIGxpc3QgaW50byB0aHJlZSBwYXJ0czpcbiAgICAgIC8vICAxLiA9PSBwaXZvdDFcbiAgICAgIC8vICAyLiA+IHBpdm90MSAmJiA8IHBpdm90MlxuICAgICAgLy8gIDMuID09IHBpdm90MlxuICAgICAgLy9cbiAgICAgIC8vIER1cmluZyB0aGUgbG9vcCB3ZSBoYXZlOlxuICAgICAgLy8gWyA9PSBwaXZvdDEgfCA+IHBpdm90MSAmJiA8IHBpdm90MiB8IHVucGFydGl0aW9uZWQgIHwgPT0gcGl2b3QyIF1cbiAgICAgIC8vICAgICAgICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF5cbiAgICAgIC8vICAgICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGsgICAgICAgICAgICAgIGdyZWF0XG4gICAgICAvL1xuICAgICAgLy8gSW52YXJpYW50czpcbiAgICAgIC8vICAgMS4gZm9yIHggaW4gWyAqLCBsZXNzWyA6IHggPT0gcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8IHggJiYgeCA8IHBpdm90MlxuICAgICAgLy8gICAzLiBmb3IgeCBpbiBdZ3JlYXQsICogXSA6IHggPT0gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMSAmJiB4ayA+PSBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgbGVzcysrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA8PSBwaXZvdFZhbHVlMiAmJiB4ayA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikge1xuICAgICAgICAgICAgICAgIGdyZWF0LS07XG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0IDwgaykgYnJlYWs7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbnNpZGUgdGhlIGxvb3Agd2hlcmUgYSBuZXdcbiAgICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA8IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA9PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gaGFzIG5vdyBiZWVuIGNsZWFyZWQgb2YgcGl2b3QgZWxlbWVudHMgYW5kIGxvb2tzXG4gICAgLy8gYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+IHBpdm90MSAmJiA8IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU29ydCB0aGUgc2Vjb25kIHBhcnRpdGlvbiB1c2luZyByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGxvb2tzIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgfCAqIF1cbiAgICAvLyAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNpbXBseSBzb3J0IGl0IGJ5IHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgcmV0dXJuIHNvcnQoYSwgbGVzcywgZ3JlYXQgKyAxKTtcbiAgfVxuXG4gIHJldHVybiBzb3J0O1xufVxuXG52YXIgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGQgPSAzMjtcblxubW9kdWxlLmV4cG9ydHMgPSBxdWlja3NvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xubW9kdWxlLmV4cG9ydHMuYnkgPSBxdWlja3NvcnRfYnk7XG4iLCJmdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQocCkge1xuICByZXR1cm4gcCArIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudChwKSB7XG4gIHJldHVybiBwIC0gMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgLSBmKHYpO1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgcmVkdWNlSW5jcmVtZW50OiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsXG4gIHJlZHVjZURlY3JlbWVudDogY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LFxuICByZWR1Y2VBZGQ6IGNyb3NzZmlsdGVyX3JlZHVjZUFkZCxcbiAgcmVkdWNlU3VidHJhY3Q6IGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0XG59O1xuIiwiZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfemVybygpIHtcbiAgcmV0dXJuIDA7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gY3Jvc3NmaWx0ZXJfemVybztcbiIsInZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gcmVxdWlyZSgnLi9wYXJhbWV0ZXJzLmpzJyk7XG5cbl9hc3NpZ24gPSBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG5cdGlmICh0YXJnZXQgPT0gbnVsbCkge1xuXHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuXHR9XG5cblx0dmFyIG91dHB1dCA9IE9iamVjdCh0YXJnZXQpO1xuXHRmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgKytpbmRleCkge1xuXHRcdHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXHRcdGlmIChzb3VyY2UgIT0gbnVsbCkge1xuXHRcdFx0Zm9yICh2YXIgbmV4dEtleSBpbiBzb3VyY2UpIHtcblx0XHRcdFx0aWYoc291cmNlLmhhc093blByb3BlcnR5KG5leHRLZXkpKSB7XG5cdFx0XHRcdFx0b3V0cHV0W25leHRLZXldID0gc291cmNlW25leHRLZXldO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvdXRwdXQ7XG59O1xuXG5mdW5jdGlvbiBhY2Nlc3Nvcl9idWlsZChvYmosIHApIHtcblx0Ly8gb2JqLm9yZGVyID0gZnVuY3Rpb24odmFsdWUpIHtcblx0Ly8gXHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm9yZGVyO1xuXHQvLyBcdHAub3JkZXIgPSB2YWx1ZTtcblx0Ly8gXHRyZXR1cm4gb2JqO1xuXHQvLyB9O1xuXG5cdC8vIENvbnZlcnRzIGEgc3RyaW5nIHRvIGFuIGFjY2Vzc29yIGZ1bmN0aW9uXG5cdGZ1bmN0aW9uIGFjY2Vzc29yaWZ5KHYpIHtcblx0XHRpZiggdHlwZW9mIHYgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0Ly8gUmV3cml0ZSB0byBhIGZ1bmN0aW9uXG5cdFx0XHR2YXIgdGVtcFZhbHVlID0gdjtcblx0XHRcdHZhciBmdW5jID0gZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGRbdGVtcFZhbHVlXTsgfVxuXHRcdFx0cmV0dXJuIGZ1bmM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB2O1xuXHRcdH1cblx0fVxuXG5cdC8vIENvbnZlcnRzIGEgc3RyaW5nIHRvIGFuIGFjY2Vzc29yIGZ1bmN0aW9uXG5cdGZ1bmN0aW9uIGFjY2Vzc29yaWZ5TnVtZXJpYyh2KSB7XG5cdFx0aWYoIHR5cGVvZiB2ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdC8vIFJld3JpdGUgdG8gYSBmdW5jdGlvblxuXHRcdFx0dmFyIHRlbXBWYWx1ZSA9IHY7XG5cdFx0XHR2YXIgZnVuYyA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiArZFt0ZW1wVmFsdWVdOyB9XG5cdFx0XHRyZXR1cm4gZnVuYztcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHY7XG5cdFx0fVxuXHR9XG5cblx0b2JqLmZyb21PYmplY3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcDtcblx0XHRfYXNzaWduKHAsIHZhbHVlKTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai50b09iamVjdCA9IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBwO1xuXHR9O1xuXG5cdG9iai5jb3VudCA9IGZ1bmN0aW9uKHZhbHVlLCBwcm9wTmFtZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuY291bnQ7XG4gICAgaWYgKCFwcm9wTmFtZSkge1xuICAgICAgcHJvcE5hbWUgPSAnY291bnQnO1xuICAgIH1cblx0XHRwLmNvdW50ID0gcHJvcE5hbWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouc3VtID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN1bTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuc3VtID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYXZnID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmF2ZztcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdC8vIFdlIGNhbiB0YWtlIGFuIGFjY2Vzc29yIGZ1bmN0aW9uLCBhIGJvb2xlYW4sIG9yIGEgc3RyaW5nXG5cdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdGlmKHAuc3VtKSBjb25zb2xlLndhcm4oJ1NVTSBhZ2dyZWdhdGlvbiBpcyBiZWluZyBvdmVyd3JpdHRlbiBieSBBVkcgYWdncmVnYXRpb24nKTtcblx0XHRcdHAuc3VtID0gdmFsdWU7XG5cdFx0XHRwLmF2ZyA9IHRydWU7XG5cdFx0XHRwLmNvdW50ID0gJ2NvdW50Jztcblx0XHR9IGVsc2Uge1xuXHRcdFx0cC5hdmcgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvbkFjY2Vzc29yO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeSh2YWx1ZSk7XG5cblx0XHRwLmV4Y2VwdGlvbkFjY2Vzc29yID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZmlsdGVyID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmZpbHRlcjtcblx0XHRwLmZpbHRlciA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnZhbHVlTGlzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC52YWx1ZUxpc3Q7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdHAudmFsdWVMaXN0ID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoubWVkaWFuID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm1lZGlhbjtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdGlmKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYocC52YWx1ZUxpc3QpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1lZGlhbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tZWRpYW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5taW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWluO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCkgY29uc29sZS53YXJuKCdWQUxVRUxJU1QgYWNjZXNzb3IgaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgbWVkaWFuIGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLnZhbHVlTGlzdCA9IHZhbHVlO1xuXHRcdH1cblx0XHRwLm1pbiA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLm1heCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5tYXg7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGlmKHAudmFsdWVMaXN0KSBjb25zb2xlLndhcm4oJ1ZBTFVFTElTVCBhY2Nlc3NvciBpcyBiZWluZyBvdmVyd3JpdHRlbiBieSBtZWRpYW4gYWdncmVnYXRpb24nKTtcblx0XHRcdHAudmFsdWVMaXN0ID0gdmFsdWU7XG5cdFx0fVxuXHRcdHAubWF4ID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uQ291bnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uQ291bnQ7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZihwLnN1bSkgY29uc29sZS53YXJuKCdFWENFUFRJT04gYWNjZXNzb3IgaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgZXhjZXB0aW9uIGNvdW50IGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLmV4Y2VwdGlvbkFjY2Vzc29yID0gdmFsdWU7XG5cdFx0XHRwLmV4Y2VwdGlvbkNvdW50ID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cC5leGNlcHRpb25Db3VudCA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb25TdW0gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uU3VtO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0cC5leGNlcHRpb25TdW0gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5oaXN0b2dyYW1WYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5oaXN0b2dyYW1WYWx1ZTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuaGlzdG9ncmFtVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5oaXN0b2dyYW1CaW5zID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmhpc3RvZ3JhbVRocmVzaG9sZHM7XG5cdFx0cC5oaXN0b2dyYW1UaHJlc2hvbGRzID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouc3RkID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN0ZDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdGlmKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHAuc3VtT2ZTcXVhcmVzID0gdmFsdWU7XG5cdFx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdFx0cC5jb3VudCA9ICdjb3VudCc7XG5cdFx0XHRwLnN0ZCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuc3RkID0gdmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN1bU9mU3EgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuc3VtT2ZTcXVhcmVzO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0cC5zdW1PZlNxdWFyZXMgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai52YWx1ZSA9IGZ1bmN0aW9uKHZhbHVlLCBhY2Nlc3Nvcikge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIid2YWx1ZScgcmVxdWlyZXMgYSBzdHJpbmcgYXJndW1lbnQuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighcC52YWx1ZXMpIHAudmFsdWVzID0ge307XG5cdFx0XHRwLnZhbHVlc1t2YWx1ZV0gPSB7fTtcblx0XHRcdHAudmFsdWVzW3ZhbHVlXS5wYXJhbWV0ZXJzID0gcmVkdWN0aW9fcGFyYW1ldGVycygpO1xuXHRcdFx0YWNjZXNzb3JfYnVpbGQocC52YWx1ZXNbdmFsdWVdLCBwLnZhbHVlc1t2YWx1ZV0ucGFyYW1ldGVycyk7XG5cdFx0XHRpZihhY2Nlc3NvcikgcC52YWx1ZXNbdmFsdWVdLmFjY2Vzc29yID0gYWNjZXNzb3I7XG5cdFx0XHRyZXR1cm4gcC52YWx1ZXNbdmFsdWVdO1xuXHRcdH1cblx0fTtcblxuXHRvYmoubmVzdCA9IGZ1bmN0aW9uKGtleUFjY2Vzc29yQXJyYXkpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubmVzdEtleXM7XG5cblx0XHRrZXlBY2Nlc3NvckFycmF5Lm1hcChhY2Nlc3NvcmlmeSk7XG5cblx0XHRwLm5lc3RLZXlzID0ga2V5QWNjZXNzb3JBcnJheTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5hbGlhcyA9IGZ1bmN0aW9uKHByb3BBY2Nlc3Nvck9iaikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hbGlhc0tleXM7XG5cdFx0cC5hbGlhc0tleXMgPSBwcm9wQWNjZXNzb3JPYmo7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYWxpYXNQcm9wID0gZnVuY3Rpb24ocHJvcEFjY2Vzc29yT2JqKSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmFsaWFzUHJvcEtleXM7XG5cdFx0cC5hbGlhc1Byb3BLZXlzID0gcHJvcEFjY2Vzc29yT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmdyb3VwQWxsID0gZnVuY3Rpb24oZ3JvdXBUZXN0KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmdyb3VwQWxsO1xuXHRcdHAuZ3JvdXBBbGwgPSBncm91cFRlc3Q7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZGF0YUxpc3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZGF0YUxpc3Q7XG5cdFx0cC5kYXRhTGlzdCA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmN1c3RvbSA9IGZ1bmN0aW9uKGFkZFJlbW92ZUluaXRpYWxPYmopIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmN1c3RvbTtcblx0XHRwLmN1c3RvbSA9IGFkZFJlbW92ZUluaXRpYWxPYmo7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxufVxuXG52YXIgcmVkdWN0aW9fYWNjZXNzb3JzID0ge1xuXHRidWlsZDogYWNjZXNzb3JfYnVpbGRcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYWNjZXNzb3JzO1xuIiwidmFyIHJlZHVjdGlvX2FsaWFzID0ge1xuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgb2JqKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRpZihwcmlvcikgcCA9IHByaW9yKHApO1xuXHRcdFx0ZnVuY3Rpb24gYnVpbGRBbGlhc0Z1bmN0aW9uKGtleSl7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbigpe1xuXHRcdFx0XHRcdHJldHVybiBvYmpba2V5XShwYXRoKHApKTtcblx0XHRcdFx0fTtcblx0XHRcdH1cblx0XHRcdGZvcih2YXIgcHJvcCBpbiBvYmopIHtcblx0XHRcdFx0cGF0aChwKVtwcm9wXSA9IGJ1aWxkQWxpYXNGdW5jdGlvbihwcm9wKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYWxpYXM7IiwidmFyIHJlZHVjdGlvX2FsaWFzX3Byb3AgPSB7XG5cdGFkZDogZnVuY3Rpb24gKG9iaiwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Zm9yKHZhciBwcm9wIGluIG9iaikge1xuXHRcdFx0XHRwYXRoKHApW3Byb3BdID0gb2JqW3Byb3BdKHBhdGgocCksdik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FsaWFzX3Byb3A7IiwidmFyIHJlZHVjdGlvX2F2ZyA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSBwYXRoKHApLnN1bSAvIHBhdGgocCkuY291bnQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpZihwYXRoKHApLmNvdW50ID4gMCkge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IHBhdGgocCkuc3VtIC8gcGF0aChwKS5jb3VudDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5hdmcgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hdmc7IiwidmFyIHJlZHVjdGlvX2ZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyLmpzJyk7XG52YXIgcmVkdWN0aW9fY291bnQgPSByZXF1aXJlKCcuL2NvdW50LmpzJyk7XG52YXIgcmVkdWN0aW9fc3VtID0gcmVxdWlyZSgnLi9zdW0uanMnKTtcbnZhciByZWR1Y3Rpb19hdmcgPSByZXF1aXJlKCcuL2F2Zy5qcycpO1xudmFyIHJlZHVjdGlvX21lZGlhbiA9IHJlcXVpcmUoJy4vbWVkaWFuLmpzJyk7XG52YXIgcmVkdWN0aW9fbWluID0gcmVxdWlyZSgnLi9taW4uanMnKTtcbnZhciByZWR1Y3Rpb19tYXggPSByZXF1aXJlKCcuL21heC5qcycpO1xudmFyIHJlZHVjdGlvX3ZhbHVlX2NvdW50ID0gcmVxdWlyZSgnLi92YWx1ZS1jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX3ZhbHVlX2xpc3QgPSByZXF1aXJlKCcuL3ZhbHVlLWxpc3QuanMnKTtcbnZhciByZWR1Y3Rpb19leGNlcHRpb25fY291bnQgPSByZXF1aXJlKCcuL2V4Y2VwdGlvbi1jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbi1zdW0uanMnKTtcbnZhciByZWR1Y3Rpb19oaXN0b2dyYW0gPSByZXF1aXJlKCcuL2hpc3RvZ3JhbS5qcycpO1xudmFyIHJlZHVjdGlvX3N1bV9vZl9zcSA9IHJlcXVpcmUoJy4vc3VtLW9mLXNxdWFyZXMuanMnKTtcbnZhciByZWR1Y3Rpb19zdGQgPSByZXF1aXJlKCcuL3N0ZC5qcycpO1xudmFyIHJlZHVjdGlvX25lc3QgPSByZXF1aXJlKCcuL25lc3QuanMnKTtcbnZhciByZWR1Y3Rpb19hbGlhcyA9IHJlcXVpcmUoJy4vYWxpYXMuanMnKTtcbnZhciByZWR1Y3Rpb19hbGlhc19wcm9wID0gcmVxdWlyZSgnLi9hbGlhc1Byb3AuanMnKTtcbnZhciByZWR1Y3Rpb19kYXRhX2xpc3QgPSByZXF1aXJlKCcuL2RhdGEtbGlzdC5qcycpO1xudmFyIHJlZHVjdGlvX2N1c3RvbSA9IHJlcXVpcmUoJy4vY3VzdG9tLmpzJyk7XG5cbmZ1bmN0aW9uIGJ1aWxkX2Z1bmN0aW9uKHAsIGYsIHBhdGgpIHtcblx0Ly8gV2UgaGF2ZSB0byBidWlsZCB0aGVzZSBmdW5jdGlvbnMgaW4gb3JkZXIuIEV2ZW50dWFsbHkgd2UgY2FuIGluY2x1ZGUgZGVwZW5kZW5jeVxuXHQvLyBpbmZvcm1hdGlvbiBhbmQgY3JlYXRlIGEgZGVwZW5kZW5jeSBncmFwaCBpZiB0aGUgcHJvY2VzcyBiZWNvbWVzIGNvbXBsZXggZW5vdWdoLlxuXG5cdGlmKCFwYXRoKSBwYXRoID0gZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQ7IH07XG5cblx0Ly8gS2VlcCB0cmFjayBvZiB0aGUgb3JpZ2luYWwgcmVkdWNlcnMgc28gdGhhdCBmaWx0ZXJpbmcgY2FuIHNraXAgYmFjayB0b1xuXHQvLyB0aGVtIGlmIHRoaXMgcGFydGljdWxhciB2YWx1ZSBpcyBmaWx0ZXJlZCBvdXQuXG5cdHZhciBvcmlnRiA9IHtcblx0XHRyZWR1Y2VBZGQ6IGYucmVkdWNlQWRkLFxuXHRcdHJlZHVjZVJlbW92ZTogZi5yZWR1Y2VSZW1vdmUsXG5cdFx0cmVkdWNlSW5pdGlhbDogZi5yZWR1Y2VJbml0aWFsXG5cdH07XG5cblx0aWYocC5jb3VudCB8fCBwLnN0ZCkge1xuICAgIGYucmVkdWNlQWRkID0gcmVkdWN0aW9fY291bnQuYWRkKGYucmVkdWNlQWRkLCBwYXRoLCBwLmNvdW50KTtcbiAgICBmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2NvdW50LnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCwgcC5jb3VudCk7XG4gICAgZi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fY291bnQuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgsIHAuY291bnQpO1xuXHR9XG5cblx0aWYocC5zdW0pIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N1bS5hZGQocC5zdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N1bS5yZW1vdmUocC5zdW0sIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19zdW0uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5hdmcpIHtcblx0XHRpZighcC5jb3VudCB8fCAhcC5zdW0pIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBzZXQgLmNvdW50KHRydWUpIGFuZCBkZWZpbmUgYSAuc3VtKGFjY2Vzc29yKSB0byB1c2UgLmF2Zyh0cnVlKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fYXZnLmFkZChwLnN1bSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19hdmcucmVtb3ZlKHAuc3VtLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19hdmcuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFRoZSB1bmlxdWUtb25seSByZWR1Y2VycyBjb21lIGJlZm9yZSB0aGUgdmFsdWVfY291bnQgcmVkdWNlcnMuIFRoZXkgbmVlZCB0byBjaGVjayBpZlxuXHQvLyB0aGUgdmFsdWUgaXMgYWxyZWFkeSBpbiB0aGUgdmFsdWVzIGFycmF5IG9uIHRoZSBncm91cC4gVGhleSBzaG91bGQgb25seSBpbmNyZW1lbnQvZGVjcmVtZW50XG5cdC8vIGNvdW50cyBpZiB0aGUgdmFsdWUgbm90IGluIHRoZSBhcnJheSBvciB0aGUgY291bnQgb24gdGhlIHZhbHVlIGlzIDAuXG5cdGlmKHAuZXhjZXB0aW9uQ291bnQpIHtcblx0XHRpZighcC5leGNlcHRpb25BY2Nlc3Nvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIllvdSBtdXN0IGRlZmluZSBhbiAuZXhjZXB0aW9uKGFjY2Vzc29yKSB0byB1c2UgLmV4Y2VwdGlvbkNvdW50KHRydWUpLlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQuYWRkKHAuZXhjZXB0aW9uQWNjZXNzb3IsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LnJlbW92ZShwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdGlmKHAuZXhjZXB0aW9uU3VtKSB7XG5cdFx0aWYoIXAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBkZWZpbmUgYW4gLmV4Y2VwdGlvbihhY2Nlc3NvcikgdG8gdXNlIC5leGNlcHRpb25TdW0oYWNjZXNzb3IpLlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19leGNlcHRpb25fc3VtLmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBwLmV4Y2VwdGlvblN1bSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19leGNlcHRpb25fc3VtLnJlbW92ZShwLmV4Y2VwdGlvbkFjY2Vzc29yLCBwLmV4Y2VwdGlvblN1bSwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTWFpbnRhaW4gdGhlIHZhbHVlcyBhcnJheS5cblx0aWYocC52YWx1ZUxpc3QgfHwgcC5tZWRpYW4gfHwgcC5taW4gfHwgcC5tYXgpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3ZhbHVlX2xpc3QuYWRkKHAudmFsdWVMaXN0LCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb192YWx1ZV9saXN0LnJlbW92ZShwLnZhbHVlTGlzdCwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3ZhbHVlX2xpc3QuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gTWFpbnRhaW4gdGhlIGRhdGEgYXJyYXkuXG5cdGlmKHAuZGF0YUxpc3QpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2RhdGFfbGlzdC5hZGQocC5kYXRhTGlzdCwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZGF0YV9saXN0LnJlbW92ZShwLmRhdGFMaXN0LCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZGF0YV9saXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAubWVkaWFuKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19tZWRpYW4uYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX21lZGlhbi5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX21lZGlhbi5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHRpZihwLm1pbikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbWluLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19taW4ucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19taW4uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5tYXgpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX21heC5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbWF4LnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbWF4LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSB2YWx1ZXMgY291bnQgYXJyYXkuXG5cdGlmKHAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3ZhbHVlX2NvdW50LmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3ZhbHVlX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIEhpc3RvZ3JhbVxuXHRpZihwLmhpc3RvZ3JhbVZhbHVlICYmIHAuaGlzdG9ncmFtVGhyZXNob2xkcykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9faGlzdG9ncmFtLmFkZChwLmhpc3RvZ3JhbVZhbHVlLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19oaXN0b2dyYW0ucmVtb3ZlKHAuaGlzdG9ncmFtVmFsdWUsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19oaXN0b2dyYW0uaW5pdGlhbChwLmhpc3RvZ3JhbVRocmVzaG9sZHMgLGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBTdW0gb2YgU3F1YXJlc1xuXHRpZihwLnN1bU9mU3F1YXJlcykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fc3VtX29mX3NxLmFkZChwLnN1bU9mU3F1YXJlcywgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fc3VtX29mX3NxLnJlbW92ZShwLnN1bU9mU3F1YXJlcywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3N1bV9vZl9zcS5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBTdGFuZGFyZCBkZXZpYXRpb25cblx0aWYocC5zdGQpIHtcblx0XHRpZighcC5zdW1PZlNxdWFyZXMgfHwgIXAuc3VtKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3Qgc2V0IC5zdW1PZlNxKGFjY2Vzc29yKSBhbmQgZGVmaW5lIGEgLnN1bShhY2Nlc3NvcikgdG8gdXNlIC5zdGQodHJ1ZSkuIE9yIHVzZSAuc3RkKGFjY2Vzc29yKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fc3RkLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N0ZC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fc3RkLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBDdXN0b20gcmVkdWNlciBkZWZpbmVkIGJ5IDMgZnVuY3Rpb25zIDogYWRkLCByZW1vdmUsIGluaXRpYWxcblx0aWYgKHAuY3VzdG9tKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19jdXN0b20uYWRkKGYucmVkdWNlQWRkLCBwYXRoLCBwLmN1c3RvbS5hZGQpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fY3VzdG9tLnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCwgcC5jdXN0b20ucmVtb3ZlKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19jdXN0b20uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgsIHAuY3VzdG9tLmluaXRpYWwpO1xuXHR9XG5cblx0Ly8gTmVzdGluZ1xuXHRpZihwLm5lc3RLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19uZXN0LmFkZChwLm5lc3RLZXlzLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19uZXN0LnJlbW92ZShwLm5lc3RLZXlzLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbmVzdC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBBbGlhcyBmdW5jdGlvbnNcblx0aWYocC5hbGlhc0tleXMpIHtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19hbGlhcy5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCwgcC5hbGlhc0tleXMpO1xuXHR9XG5cblx0Ly8gQWxpYXMgcHJvcGVydGllcyAtIHRoaXMgaXMgbGVzcyBlZmZpY2llbnQgdGhhbiBhbGlhcyBmdW5jdGlvbnNcblx0aWYocC5hbGlhc1Byb3BLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19hbGlhc19wcm9wLmFkZChwLmFsaWFzUHJvcEtleXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHQvLyBUaGlzIGlzbid0IGEgdHlwby4gVGhlIGZ1bmN0aW9uIGlzIHRoZSBzYW1lIGZvciBhZGQvcmVtb3ZlLlxuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fYWxpYXNfcHJvcC5hZGQocC5hbGlhc1Byb3BLZXlzLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdH1cblxuXHQvLyBGaWx0ZXJzIGRldGVybWluZSBpZiBvdXIgYnVpbHQtdXAgcHJpb3JzIHNob3VsZCBydW4sIG9yIGlmIGl0IHNob3VsZCBza2lwXG5cdC8vIGJhY2sgdG8gdGhlIGZpbHRlcnMgZ2l2ZW4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGlzIGJ1aWxkIGZ1bmN0aW9uLlxuXHRpZiAocC5maWx0ZXIpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2ZpbHRlci5hZGQocC5maWx0ZXIsIGYucmVkdWNlQWRkLCBvcmlnRi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZmlsdGVyLnJlbW92ZShwLmZpbHRlciwgZi5yZWR1Y2VSZW1vdmUsIG9yaWdGLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdH1cblxuXHQvLyBWYWx1ZXMgZ28gbGFzdC5cblx0aWYocC52YWx1ZXMpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwLnZhbHVlcykuZm9yRWFjaChmdW5jdGlvbihuKSB7XG5cdFx0XHQvLyBTZXQgdXAgdGhlIHBhdGggb24gZWFjaCBncm91cC5cblx0XHRcdHZhciBzZXR1cFBhdGggPSBmdW5jdGlvbihwcmlvcikge1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRcdFx0cGF0aChwKVtuXSA9IHt9O1xuXHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHNldHVwUGF0aChmLnJlZHVjZUluaXRpYWwpO1xuXHRcdFx0YnVpbGRfZnVuY3Rpb24ocC52YWx1ZXNbbl0ucGFyYW1ldGVycywgZiwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIHBbbl07IH0pO1xuXHRcdH0pO1xuXHR9XG59XG5cbnZhciByZWR1Y3Rpb19idWlsZCA9IHtcblx0YnVpbGQ6IGJ1aWxkX2Z1bmN0aW9uXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2J1aWxkO1xuIiwidmFyIHBsdWNrID0gZnVuY3Rpb24obil7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQpe1xuICAgICAgICByZXR1cm4gZFtuXTtcbiAgICB9O1xufTtcblxuLy8gc3VwcG9ydGVkIG9wZXJhdG9ycyBhcmUgc3VtLCBhdmcsIGFuZCBjb3VudFxuX2dyb3VwZXIgPSBmdW5jdGlvbihwYXRoLCBwcmlvcil7XG4gICAgaWYoIXBhdGgpIHBhdGggPSBmdW5jdGlvbihkKXtyZXR1cm4gZDt9O1xuICAgIHJldHVybiBmdW5jdGlvbihwLCB2KXtcbiAgICAgICAgaWYocHJpb3IpIHByaW9yKHAsIHYpO1xuICAgICAgICB2YXIgeCA9IHBhdGgocCksIHkgPSBwYXRoKHYpO1xuICAgICAgICBpZih0eXBlb2YgeS5jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHguY291bnQgKz0geS5jb3VudDtcbiAgICAgICAgaWYodHlwZW9mIHkuc3VtICE9PSAndW5kZWZpbmVkJykgeC5zdW0gKz0geS5zdW07XG4gICAgICAgIGlmKHR5cGVvZiB5LmF2ZyAhPT0gJ3VuZGVmaW5lZCcpIHguYXZnID0geC5zdW0veC5jb3VudDtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbn07XG5cbnJlZHVjdGlvX2NhcCA9IGZ1bmN0aW9uIChwcmlvciwgZiwgcCkge1xuICAgIHZhciBvYmogPSBmLnJlZHVjZUluaXRpYWwoKTtcbiAgICAvLyB3ZSB3YW50IHRvIHN1cHBvcnQgdmFsdWVzIHNvIHdlJ2xsIG5lZWQgdG8ga25vdyB3aGF0IHRob3NlIGFyZVxuICAgIHZhciB2YWx1ZXMgPSBwLnZhbHVlcyA/IE9iamVjdC5rZXlzKHAudmFsdWVzKSA6IFtdO1xuICAgIHZhciBfb3RoZXJzR3JvdXBlciA9IF9ncm91cGVyKCk7XG4gICAgaWYgKHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIF9vdGhlcnNHcm91cGVyID0gX2dyb3VwZXIocGx1Y2sodmFsdWVzW2ldKSwgX290aGVyc0dyb3VwZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoY2FwLCBvdGhlcnNOYW1lKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHByaW9yKCk7XG4gICAgICAgIGlmKCBjYXAgPT09IEluZmluaXR5IHx8ICFjYXAgKSByZXR1cm4gcHJpb3IoKTtcbiAgICAgICAgdmFyIGFsbCA9IHByaW9yKCk7XG4gICAgICAgIHZhciBzbGljZV9pZHggPSBjYXAtMTtcbiAgICAgICAgaWYoYWxsLmxlbmd0aCA8PSBjYXApIHJldHVybiBhbGw7XG4gICAgICAgIHZhciBkYXRhID0gYWxsLnNsaWNlKDAsIHNsaWNlX2lkeCk7XG4gICAgICAgIHZhciBvdGhlcnMgPSB7a2V5OiBvdGhlcnNOYW1lIHx8ICdPdGhlcnMnfTtcbiAgICAgICAgb3RoZXJzLnZhbHVlID0gZi5yZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSBzbGljZV9pZHg7IGkgPCBhbGwubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIF9vdGhlcnNHcm91cGVyKG90aGVycy52YWx1ZSwgYWxsW2ldLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhLnB1c2gob3RoZXJzKTtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY2FwO1xuIiwidmFyIHJlZHVjdGlvX2NvdW50ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uKHByaW9yLCBwYXRoLCBwcm9wTmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApW3Byb3BOYW1lXSsrO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcHJvcE5hbWUpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKVtwcm9wTmFtZV0tLTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uKHByaW9yLCBwYXRoLCBwcm9wTmFtZSkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdC8vIGlmKHAgPT09IHVuZGVmaW5lZCkgcCA9IHt9O1xuXHRcdFx0cGF0aChwKVtwcm9wTmFtZV0gPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19jb3VudDsiLCJ2YXIgcmVkdWN0aW9fY3VzdG9tID0ge1xuXHRhZGQ6IGZ1bmN0aW9uKHByaW9yLCBwYXRoLCBhZGRGbikge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRyZXR1cm4gYWRkRm4ocCwgdik7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihwcmlvciwgcGF0aCwgcmVtb3ZlRm4pIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cmV0dXJuIHJlbW92ZUZuKHAsIHYpO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uKHByaW9yLCBwYXRoLCBpbml0aWFsRm4pIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcdFxuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdHJldHVybiBpbml0aWFsRm4ocCk7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19jdXN0b207IiwidmFyIHJlZHVjdGlvX2RhdGFfbGlzdCA9IHtcblx0YWRkOiBmdW5jdGlvbihhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0LnB1c2godik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuZGF0YUxpc3Quc3BsaWNlKHBhdGgocCkuZGF0YUxpc3QuaW5kZXhPZih2KSwgMSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuZGF0YUxpc3QgPSBbXTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fZGF0YV9saXN0O1xuIiwidmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudCA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBjb3VudCsrIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBkb2Vzbid0IGNvbnRhaW4gYSh2KSBvciBpZiBpdCdzIDAuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZigoIWN1cnIgfHwgY3VyclswXSAhPT0gYSh2KSkgfHwgY3VyclsxXSA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvbkNvdW50Kys7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpLCBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBPbmx5IGNvdW50LS0gaWYgdGhlIHAudmFsdWVzIGFycmF5IGNvbnRhaW5zIGEodikgdmFsdWUgb2YgMS5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKGN1cnIgJiYgY3VyclswXSA9PT0gYSh2KSAmJiBjdXJyWzFdID09PSAxKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uQ291bnQtLTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5leGNlcHRpb25Db3VudCA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudDsiLCJ2YXIgcmVkdWN0aW9fZXhjZXB0aW9uX3N1bSA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgc3VtLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpLCBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBPbmx5IHN1bSBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgZG9lc24ndCBjb250YWluIGEodikgb3IgaWYgaXQncyAwLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoKCFjdXJyIHx8IGN1cnJbMF0gIT09IGEodikpIHx8IGN1cnJbMV0gPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25TdW0gPSBwYXRoKHApLmV4Y2VwdGlvblN1bSArIHN1bSh2KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHN1bSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBzdW0gaWYgdGhlIHAudmFsdWVzIGFycmF5IGNvbnRhaW5zIGEodikgdmFsdWUgb2YgMS5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKGN1cnIgJiYgY3VyclswXSA9PT0gYSh2KSAmJiBjdXJyWzFdID09PSAxKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uU3VtID0gcGF0aChwKS5leGNlcHRpb25TdW0gLSBzdW0odik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuZXhjZXB0aW9uU3VtID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bTsiLCJ2YXIgcmVkdWN0aW9fZmlsdGVyID0ge1xuXHQvLyBUaGUgYmlnIGlkZWEgaGVyZSBpcyB0aGF0IHlvdSBnaXZlIHVzIGEgZmlsdGVyIGZ1bmN0aW9uIHRvIHJ1biBvbiB2YWx1ZXMsXG5cdC8vIGEgJ3ByaW9yJyByZWR1Y2VyIHRvIHJ1biAoanVzdCBsaWtlIHRoZSByZXN0IG9mIHRoZSBzdGFuZGFyZCByZWR1Y2VycyksXG5cdC8vIGFuZCBhIHJlZmVyZW5jZSB0byB0aGUgbGFzdCByZWR1Y2VyIChjYWxsZWQgJ3NraXAnIGJlbG93KSBkZWZpbmVkIGJlZm9yZVxuXHQvLyB0aGUgbW9zdCByZWNlbnQgY2hhaW4gb2YgcmVkdWNlcnMuICBUaGlzIHN1cHBvcnRzIGluZGl2aWR1YWwgZmlsdGVycyBmb3Jcblx0Ly8gZWFjaCAudmFsdWUoJy4uLicpIGNoYWluIHRoYXQgeW91IGFkZCB0byB5b3VyIHJlZHVjZXIuXG5cdGFkZDogZnVuY3Rpb24gKGZpbHRlciwgcHJpb3IsIHNraXApIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZiAoZmlsdGVyKHYsIG5mKSkge1xuXHRcdFx0XHRpZiAocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChza2lwKSBza2lwKHAsIHYsIG5mKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGZpbHRlciwgcHJpb3IsIHNraXApIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZiAoZmlsdGVyKHYsIG5mKSkge1xuXHRcdFx0XHRpZiAocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmIChza2lwKSBza2lwKHAsIHYsIG5mKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fZmlsdGVyO1xuIiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJyk7XG5cbnZhciByZWR1Y3Rpb19oaXN0b2dyYW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KS5sZWZ0O1xuXHRcdHZhciBiaXNlY3RIaXN0byA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLnJpZ2h0O1xuXHRcdHZhciBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRjdXJyID0gcGF0aChwKS5oaXN0b2dyYW1bYmlzZWN0SGlzdG8ocGF0aChwKS5oaXN0b2dyYW0sIGEodiksIDAsIHBhdGgocCkuaGlzdG9ncmFtLmxlbmd0aCkgLSAxXTtcblx0XHRcdGN1cnIueSsrO1xuXHRcdFx0Y3Vyci5zcGxpY2UoYmlzZWN0KGN1cnIsIGEodiksIDAsIGN1cnIubGVuZ3RoKSwgMCwgYSh2KSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHR2YXIgYmlzZWN0SGlzdG8gPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KS5yaWdodDtcblx0XHR2YXIgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkuaGlzdG9ncmFtW2Jpc2VjdEhpc3RvKHBhdGgocCkuaGlzdG9ncmFtLCBhKHYpLCAwLCBwYXRoKHApLmhpc3RvZ3JhbS5sZW5ndGgpIC0gMV07XG5cdFx0XHRjdXJyLnktLTtcblx0XHRcdGN1cnIuc3BsaWNlKGJpc2VjdChjdXJyLCBhKHYpLCAwLCBjdXJyLmxlbmd0aCksIDEpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHRocmVzaG9sZHMsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmhpc3RvZ3JhbSA9IFtdO1xuXHRcdFx0dmFyIGFyciA9IFtdO1xuXHRcdFx0Zm9yKHZhciBpID0gMTsgaSA8IHRocmVzaG9sZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0YXJyID0gW107XG5cdFx0XHRcdGFyci54ID0gdGhyZXNob2xkc1tpIC0gMV07XG5cdFx0XHRcdGFyci5keCA9ICh0aHJlc2hvbGRzW2ldIC0gdGhyZXNob2xkc1tpIC0gMV0pO1xuXHRcdFx0XHRhcnIueSA9IDA7XG5cdFx0XHRcdHBhdGgocCkuaGlzdG9ncmFtLnB1c2goYXJyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9faGlzdG9ncmFtOyIsInZhciByZWR1Y3Rpb19tYXggPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcbiBcblx0XHRcdHBhdGgocCkubWF4ID0gcGF0aChwKS52YWx1ZUxpc3RbcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoIC0gMV07XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1heCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRwYXRoKHApLm1heCA9IHBhdGgocCkudmFsdWVMaXN0W3BhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkubWF4ID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19tYXg7IiwidmFyIHJlZHVjdGlvX21lZGlhbiA9IHtcblx0YWRkOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaGFsZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRoYWxmID0gTWF0aC5mbG9vcihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgvMik7XG4gXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggJSAyKSB7XG5cdFx0XHRcdHBhdGgocCkubWVkaWFuID0gcGF0aChwKS52YWx1ZUxpc3RbaGFsZl07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IChwYXRoKHApLnZhbHVlTGlzdFtoYWxmLTFdICsgcGF0aChwKS52YWx1ZUxpc3RbaGFsZl0pIC8gMi4wO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHZhciBoYWxmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGhhbGYgPSBNYXRoLmZsb29yKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aC8yKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDEgfHwgcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoICUgMikge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHBhdGgocCkudmFsdWVMaXN0W2hhbGZdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSAocGF0aChwKS52YWx1ZUxpc3RbaGFsZi0xXSArIHBhdGgocCkudmFsdWVMaXN0W2hhbGZdKSAvIDIuMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1lZGlhbiA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWVkaWFuOyIsInZhciByZWR1Y3Rpb19taW4gPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcbiBcblx0XHRcdHBhdGgocCkubWluID0gcGF0aChwKS52YWx1ZUxpc3RbMF07XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1pbiA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRwYXRoKHApLm1pbiA9IHBhdGgocCkudmFsdWVMaXN0WzBdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkubWluID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19taW47IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJyk7XG5cbnZhciByZWR1Y3Rpb19uZXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChrZXlBY2Nlc3NvcnMsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7IC8vIEN1cnJlbnQga2V5IGFjY2Vzc29yXG5cdFx0dmFyIGFyclJlZjtcblx0XHR2YXIgbmV3UmVmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGFyclJlZiA9IHBhdGgocCkubmVzdDtcblx0XHRcdGtleUFjY2Vzc29ycy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcblx0XHRcdFx0bmV3UmVmID0gYXJyUmVmLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleSA9PT0gYSh2KTsgfSlbMF07XG5cdFx0XHRcdGlmKG5ld1JlZikge1xuXHRcdFx0XHRcdC8vIFRoZXJlIGlzIGFub3RoZXIgbGV2ZWwuXG5cdFx0XHRcdFx0YXJyUmVmID0gbmV3UmVmLnZhbHVlcztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBOZXh0IGxldmVsIGRvZXNuJ3QgeWV0IGV4aXN0IHNvIHdlIGNyZWF0ZSBpdC5cblx0XHRcdFx0XHRuZXdSZWYgPSBbXTtcblx0XHRcdFx0XHRhcnJSZWYucHVzaCh7IGtleTogYSh2KSwgdmFsdWVzOiBuZXdSZWYgfSk7XG5cdFx0XHRcdFx0YXJyUmVmID0gbmV3UmVmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0YXJyUmVmLnB1c2godik7XG5cdFx0XHRcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGtleUFjY2Vzc29ycywgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgYXJyUmVmO1xuXHRcdHZhciBuZXh0UmVmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGFyclJlZiA9IHBhdGgocCkubmVzdDtcblx0XHRcdGtleUFjY2Vzc29ycy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcblx0XHRcdFx0YXJyUmVmID0gYXJyUmVmLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleSA9PT0gYSh2KTsgfSlbMF0udmFsdWVzO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFycmF5IGNvbnRhaW5zIGFuIGFjdHVhbCByZWZlcmVuY2UgdG8gdGhlIHJvdywgc28ganVzdCBzcGxpY2UgaXQgb3V0LlxuXHRcdFx0YXJyUmVmLnNwbGljZShhcnJSZWYuaW5kZXhPZih2KSwgMSk7XG5cblx0XHRcdC8vIElmIHRoZSBsZWFmIG5vdyBoYXMgbGVuZ3RoIDAgYW5kIGl0J3Mgbm90IHRoZSBiYXNlIGFycmF5IHJlbW92ZSBpdC5cblx0XHRcdC8vIFRPRE9cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm5lc3QgPSBbXTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbmVzdDsiLCJ2YXIgcmVkdWN0aW9fcGFyYW1ldGVycyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdG9yZGVyOiBmYWxzZSxcblx0XHRhdmc6IGZhbHNlLFxuXHRcdGNvdW50OiBmYWxzZSxcblx0XHRzdW06IGZhbHNlLFxuXHRcdGV4Y2VwdGlvbkFjY2Vzc29yOiBmYWxzZSxcblx0XHRleGNlcHRpb25Db3VudDogZmFsc2UsXG5cdFx0ZXhjZXB0aW9uU3VtOiBmYWxzZSxcblx0XHRmaWx0ZXI6IGZhbHNlLFxuXHRcdHZhbHVlTGlzdDogZmFsc2UsXG5cdFx0bWVkaWFuOiBmYWxzZSxcblx0XHRoaXN0b2dyYW1WYWx1ZTogZmFsc2UsXG5cdFx0bWluOiBmYWxzZSxcblx0XHRtYXg6IGZhbHNlLFxuXHRcdGhpc3RvZ3JhbVRocmVzaG9sZHM6IGZhbHNlLFxuXHRcdHN0ZDogZmFsc2UsXG5cdFx0c3VtT2ZTcXVhcmVzOiBmYWxzZSxcblx0XHR2YWx1ZXM6IGZhbHNlLFxuXHRcdG5lc3RLZXlzOiBmYWxzZSxcblx0XHRhbGlhc0tleXM6IGZhbHNlLFxuXHRcdGFsaWFzUHJvcEtleXM6IGZhbHNlLFxuXHRcdGdyb3VwQWxsOiBmYWxzZSxcblx0XHRkYXRhTGlzdDogZmFsc2UsXG5cdFx0Y3VzdG9tOiBmYWxzZVxuXHR9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19wYXJhbWV0ZXJzO1xuIiwiZnVuY3Rpb24gcG9zdFByb2Nlc3MocmVkdWN0aW8pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGdyb3VwLCBwLCBmKSB7XG4gICAgICAgIGdyb3VwLnBvc3QgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHBvc3Rwcm9jZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2Vzcy5hbGwoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwb3N0cHJvY2Vzcy5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwLmFsbCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwb3N0cHJvY2Vzc29ycyA9IHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocG9zdHByb2Nlc3NvcnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBwb3N0cHJvY2Vzc1tuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hbGwgPSBwb3N0cHJvY2Vzcy5hbGw7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0cHJvY2Vzcy5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvcnNbbmFtZV0oX2FsbCwgZiwgcCkuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2VzcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3M7XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwb3N0UHJvY2VzcztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocmVkdWN0aW8pe1xuICAgIHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzID0ge307XG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yID0gZnVuY3Rpb24obmFtZSwgZnVuYyl7XG4gICAgICAgIHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzW25hbWVdID0gZnVuYztcbiAgICB9O1xuXG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yKCdjYXAnLCByZXF1aXJlKCcuL2NhcCcpKTtcbiAgICByZWR1Y3Rpby5yZWdpc3RlclBvc3RQcm9jZXNzb3IoJ3NvcnRCeScsIHJlcXVpcmUoJy4vc29ydEJ5JykpO1xufTtcbiIsInZhciByZWR1Y3Rpb19idWlsZCA9IHJlcXVpcmUoJy4vYnVpbGQuanMnKTtcbnZhciByZWR1Y3Rpb19hY2Nlc3NvcnMgPSByZXF1aXJlKCcuL2FjY2Vzc29ycy5qcycpO1xudmFyIHJlZHVjdGlvX3BhcmFtZXRlcnMgPSByZXF1aXJlKCcuL3BhcmFtZXRlcnMuanMnKTtcbnZhciByZWR1Y3Rpb19wb3N0cHJvY2VzcyA9IHJlcXVpcmUoJy4vcG9zdHByb2Nlc3MnKTtcbnZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyMicpO1xuXG5mdW5jdGlvbiByZWR1Y3RpbygpIHtcblx0dmFyIHBhcmFtZXRlcnMgPSByZWR1Y3Rpb19wYXJhbWV0ZXJzKCk7XG5cblx0dmFyIGZ1bmNzID0ge307XG5cblx0ZnVuY3Rpb24gbXkoZ3JvdXApIHtcblx0XHQvLyBTdGFydCBmcmVzaCBlYWNoIHRpbWUuXG5cdFx0ZnVuY3MgPSB7XG5cdFx0XHRyZWR1Y2VBZGQ6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG5cdFx0XHRyZWR1Y2VSZW1vdmU6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG5cdFx0XHRyZWR1Y2VJbml0aWFsOiBmdW5jdGlvbiAoKSB7IHJldHVybiB7fTsgfSxcblx0XHR9O1xuXG5cdFx0cmVkdWN0aW9fYnVpbGQuYnVpbGQocGFyYW1ldGVycywgZnVuY3MpO1xuXG5cdFx0Ly8gSWYgd2UncmUgZG9pbmcgZ3JvdXBBbGxcblx0XHRpZihwYXJhbWV0ZXJzLmdyb3VwQWxsKSB7XG5cdFx0XHRpZihncm91cC50b3ApIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiJ2dyb3VwQWxsJyBpcyBkZWZpbmVkIGJ1dCBhdHRlbXB0aW5nIHRvIHJ1biBvbiBhIHN0YW5kYXJkIGRpbWVuc2lvbi5ncm91cCgpLiBNdXN0IHJ1biBvbiBkaW1lbnNpb24uZ3JvdXBBbGwoKS5cIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KS5sZWZ0O1xuXHRcdFx0XHR2YXIgaSwgajtcblx0XHRcdFx0dmFyIGtleXM7XG4gICAgICAgIHZhciBrZXlzTGVuZ3RoO1xuICAgICAgICB2YXIgazsgLy8gS2V5XG5cdFx0XHRcdGdyb3VwLnJlZHVjZShcblx0XHRcdFx0XHRmdW5jdGlvbihwLCB2LCBuZikge1xuXHRcdFx0XHRcdFx0a2V5cyA9IHBhcmFtZXRlcnMuZ3JvdXBBbGwodik7XG4gICAgICAgICAgICBrZXlzTGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICBmb3Ioaj0wO2o8a2V5c0xlbmd0aDtqKyspIHtcbiAgICAgICAgICAgICAgayA9IGtleXNbal07XG4gICAgICAgICAgICAgIGkgPSBiaXNlY3QocCwgaywgMCwgcC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHRpZighcFtpXSB8fCBwW2ldLmtleSAhPT0gaykge1xuXHRcdFx0XHRcdFx0XHRcdC8vIElmIHRoZSBncm91cCBkb2Vzbid0IHlldCBleGlzdCwgY3JlYXRlIGl0IGZpcnN0LlxuXHRcdFx0XHRcdFx0XHRcdHAuc3BsaWNlKGksIDAsIHsga2V5OiBrLCB2YWx1ZTogZnVuY3MucmVkdWNlSW5pdGlhbCgpIH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Ly8gVGhlbiBwYXNzIHRoZSByZWNvcmQgYW5kIHRoZSBncm91cCB2YWx1ZSB0byB0aGUgcmVkdWNlcnNcblx0XHRcdFx0XHRcdFx0ZnVuY3MucmVkdWNlQWRkKHBbaV0udmFsdWUsIHYsIG5mKTtcbiAgICAgICAgICAgIH1cblx0XHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZnVuY3Rpb24ocCwgdiwgbmYpIHtcblx0XHRcdFx0XHRcdGtleXMgPSBwYXJhbWV0ZXJzLmdyb3VwQWxsKHYpO1xuICAgICAgICAgICAga2V5c0xlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGo9MDtqPGtleXNMZW5ndGg7aisrKSB7XG4gICAgICAgICAgICAgIGkgPSBiaXNlY3QocCwga2V5c1tqXSwgMCwgcC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHQvLyBUaGUgZ3JvdXAgc2hvdWxkIGV4aXN0IG9yIHdlJ3JlIGluIHRyb3VibGUhXG5cdFx0XHRcdFx0XHRcdC8vIFRoZW4gcGFzcyB0aGUgcmVjb3JkIGFuZCB0aGUgZ3JvdXAgdmFsdWUgdG8gdGhlIHJlZHVjZXJzXG5cdFx0XHRcdFx0XHRcdGZ1bmNzLnJlZHVjZVJlbW92ZShwW2ldLnZhbHVlLCB2LCBuZik7XG4gICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdFx0aWYoIWdyb3VwLmFsbCkge1xuXHRcdFx0XHRcdC8vIEFkZCBhbiAnYWxsJyBtZXRob2QgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBzdGFuZGFyZCBDcm9zc2ZpbHRlciBncm91cHMuXG5cdFx0XHRcdFx0Z3JvdXAuYWxsID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnZhbHVlKCk7IH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JvdXAucmVkdWNlKGZ1bmNzLnJlZHVjZUFkZCwgZnVuY3MucmVkdWNlUmVtb3ZlLCBmdW5jcy5yZWR1Y2VJbml0aWFsKTtcblx0XHR9XG5cblx0XHRyZWR1Y3Rpb19wb3N0cHJvY2Vzcyhncm91cCwgcGFyYW1ldGVycywgZnVuY3MpO1xuXG5cdFx0cmV0dXJuIGdyb3VwO1xuXHR9XG5cblx0cmVkdWN0aW9fYWNjZXNzb3JzLmJ1aWxkKG15LCBwYXJhbWV0ZXJzKTtcblxuXHRyZXR1cm4gbXk7XG59XG5cbnJlcXVpcmUoJy4vcG9zdHByb2Nlc3NvcnMnKShyZWR1Y3Rpbyk7XG5yZWR1Y3Rpb19wb3N0cHJvY2VzcyA9IHJlZHVjdGlvX3Bvc3Rwcm9jZXNzKHJlZHVjdGlvKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3RpbztcbiIsInZhciBwbHVja19uID0gZnVuY3Rpb24gKG4pIHtcbiAgICBpZiAodHlwZW9mIG4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgfVxuICAgIGlmICh+bi5pbmRleE9mKCcuJykpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gbi5zcGxpdCgnLicpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBzcGxpdC5yZWR1Y2UoZnVuY3Rpb24gKHAsIHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcFt2XTtcbiAgICAgICAgICAgIH0sIGQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGRbbl07XG4gICAgfTtcbn07XG5cbmZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiBhID49IGIgPyAwIDogTmFOO1xufVxuXG52YXIgY29tcGFyZXIgPSBmdW5jdGlvbiAoYWNjZXNzb3IsIG9yZGVyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBvcmRlcmluZyhhY2Nlc3NvcihhKSwgYWNjZXNzb3IoYikpO1xuICAgIH07XG59O1xuXG52YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIG9yZGVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBvcmRlciA9IGFzY2VuZGluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJpb3IoKS5zb3J0KGNvbXBhcmVyKHBsdWNrX24odmFsdWUpLCBvcmRlcikpO1xuICAgIH07XG59O1xuIiwidmFyIHJlZHVjdGlvX3N0ZCA9IHtcblx0YWRkOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwLjA7XG5cdFx0XHRcdHZhciBuID0gcGF0aChwKS5zdW1PZlNxIC0gcGF0aChwKS5zdW0qcGF0aChwKS5zdW0vcGF0aChwKS5jb3VudDtcblx0XHRcdFx0aWYgKG4+MC4wKSBwYXRoKHApLnN0ZCA9IE1hdGguc3FydChuLyhwYXRoKHApLmNvdW50LTEpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwLjA7XG5cdFx0XHRcdHZhciBuID0gcGF0aChwKS5zdW1PZlNxIC0gcGF0aChwKS5zdW0qcGF0aChwKS5zdW0vcGF0aChwKS5jb3VudDtcblx0XHRcdFx0aWYgKG4+MC4wKSBwYXRoKHApLnN0ZCA9IE1hdGguc3FydChuLyhwYXRoKHApLmNvdW50LTEpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdGQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdGQ7IiwidmFyIHJlZHVjdGlvX3N1bV9vZl9zcSA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gcGF0aChwKS5zdW1PZlNxICsgYSh2KSphKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gcGF0aChwKS5zdW1PZlNxIC0gYSh2KSphKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLnN1bU9mU3EgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdW1fb2Zfc3E7IiwidmFyIHJlZHVjdGlvX3N1bSA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW0gPSBwYXRoKHApLnN1bSArIGEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLnN1bSA9IHBhdGgocCkuc3VtIC0gYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdW0gPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdW07IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJyk7XG5cbnZhciByZWR1Y3Rpb192YWx1ZV9jb3VudCA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gTm90IHN1cmUgaWYgdGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIHNvcnRpbmcuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikpIHtcblx0XHRcdFx0Ly8gVmFsdWUgYWxyZWFkeSBleGlzdHMgaW4gdGhlIGFycmF5IC0gaW5jcmVtZW50IGl0XG5cdFx0XHRcdGN1cnJbMV0rKztcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFZhbHVlIGRvZXNuJ3QgZXhpc3QgLSBhZGQgaXQgaW4gZm9ybSBbdmFsdWUsIDFdXG5cdFx0XHRcdHBhdGgocCkudmFsdWVzLnNwbGljZShpLCAwLCBbYSh2KSwgMV0pO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaTtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Ly8gVmFsdWUgYWxyZWFkeSBleGlzdHMgb3Igc29tZXRoaW5nIGhhcyBnb25lIHRlcnJpYmx5IHdyb25nLlxuXHRcdFx0cGF0aChwKS52YWx1ZXNbaV1bMV0tLTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0Ly8gQXJyYXlbQXJyYXlbdmFsdWUsIGNvdW50XV1cblx0XHRcdHBhdGgocCkudmFsdWVzID0gW107XG5cdFx0XHRwYXRoKHApLmJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkWzBdOyB9KS5sZWZ0O1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb192YWx1ZV9jb3VudDsiLCJ2YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcjInKTtcblxudmFyIHJlZHVjdGlvX3ZhbHVlX2xpc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KS5sZWZ0O1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBOb3Qgc3VyZSBpZiB0aGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gc29ydGluZy5cblx0XHRcdGkgPSBiaXNlY3QocGF0aChwKS52YWx1ZUxpc3QsIGEodiksIDAsIHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCk7XG5cdFx0XHRwYXRoKHApLnZhbHVlTGlzdC5zcGxpY2UoaSwgMCwgYSh2KSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aSA9IGJpc2VjdChwYXRoKHApLnZhbHVlTGlzdCwgYSh2KSwgMCwgcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoKTtcblx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIG9yIHNvbWV0aGluZyBoYXMgZ29uZSB0ZXJyaWJseSB3cm9uZy5cblx0XHRcdHBhdGgocCkudmFsdWVMaXN0LnNwbGljZShpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS52YWx1ZUxpc3QgPSBbXTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fdmFsdWVfbGlzdDsiLCIndXNlIHN0cmljdCdcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbnZhciBhZ2dyZWdhdG9ycyA9IHtcbiAgLy8gQ29sbGVjdGlvbnNcbiAgJHN1bTogJHN1bSxcbiAgJGF2ZzogJGF2ZyxcbiAgJG1heDogJG1heCxcbiAgJG1pbjogJG1pbixcblxuICAvLyBQaWNrZXJzXG4gICRjb3VudDogJGNvdW50LFxuICAkZmlyc3Q6ICRmaXJzdCxcbiAgJGxhc3Q6ICRsYXN0LFxuICAkZ2V0OiAkZ2V0LFxuICAkbnRoOiAkZ2V0LCAvLyBudGggaXMgc2FtZSBhcyB1c2luZyBhIGdldFxuICAkbnRoTGFzdDogJG50aExhc3QsXG4gICRudGhQY3Q6ICRudGhQY3QsXG4gICRtYXA6ICRtYXAsXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtYWtlVmFsdWVBY2Nlc3NvcjogbWFrZVZhbHVlQWNjZXNzb3IsXG4gIGFnZ3JlZ2F0b3JzOiBhZ2dyZWdhdG9ycyxcbiAgZXh0cmFjdEtleVZhbE9yQXJyYXk6IGV4dHJhY3RLZXlWYWxPckFycmF5LFxuICBwYXJzZUFnZ3JlZ2F0b3JQYXJhbXM6IHBhcnNlQWdncmVnYXRvclBhcmFtcyxcbn1cbiAgLy8gVGhpcyBpcyB1c2VkIHRvIGJ1aWxkIGFnZ3JlZ2F0aW9uIHN0YWNrcyBmb3Igc3ViLXJlZHVjdGlvXG4gIC8vIGFnZ3JlZ2F0aW9ucywgb3IgcGx1Y2tpbmcgdmFsdWVzIGZvciB1c2UgaW4gZmlsdGVycyBmcm9tIHRoZSBkYXRhXG5mdW5jdGlvbiBtYWtlVmFsdWVBY2Nlc3NvcihvYmopIHtcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKGlzU3RyaW5nU3ludGF4KG9iaikpIHtcbiAgICAgIG9iaiA9IGNvbnZlcnRBZ2dyZWdhdG9yU3RyaW5nKG9iailcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTXVzdCBiZSBhIGNvbHVtbiBrZXkuIFJldHVybiBhbiBpZGVudGl0eSBhY2Nlc3NvclxuICAgICAgcmV0dXJuIG9ialxuICAgIH1cbiAgfVxuICAvLyBNdXN0IGJlIGEgY29sdW1uIGluZGV4LiBSZXR1cm4gYW4gaWRlbnRpdHkgYWNjZXNzb3JcbiAgaWYgKHR5cGVvZiBvYmogPT09ICdudW1iZXInKSB7XG4gICAgcmV0dXJuIG9ialxuICB9XG4gIC8vIElmIGl0J3MgYW4gb2JqZWN0LCB3ZSBuZWVkIHRvIGJ1aWxkIGEgY3VzdG9tIHZhbHVlIGFjY2Vzc29yIGZ1bmN0aW9uXG4gIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICByZXR1cm4gbWFrZSgpXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlKCkge1xuICAgIHZhciBzdGFjayA9IG1ha2VTdWJBZ2dyZWdhdGlvbkZ1bmN0aW9uKG9iailcbiAgICByZXR1cm4gZnVuY3Rpb24gdG9wU3RhY2soZCkge1xuICAgICAgcmV0dXJuIHN0YWNrKGQpXG4gICAgfVxuICB9XG59XG5cbi8vIEEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgd2Fsa3MgdGhlIGFnZ3JlZ2F0aW9uIHN0YWNrIGFuZCByZXR1cm5zXG4vLyBhIGZ1bmN0aW9uLiBUaGUgcmV0dXJuZWQgZnVuY3Rpb24sIHdoZW4gY2FsbGVkLCB3aWxsIHJlY3Vyc2l2ZWx5IGludm9rZVxuLy8gd2l0aCB0aGUgcHJvcGVydGllcyBmcm9tIHRoZSBwcmV2aW91cyBzdGFjayBpbiByZXZlcnNlIG9yZGVyXG5mdW5jdGlvbiBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihvYmopIHtcbiAgLy8gSWYgaXRzIGFuIG9iamVjdCwgZWl0aGVyIHVud3JhcCBhbGwgb2YgdGhlIHByb3BlcnRpZXMgYXMgYW5cbiAgLy8gYXJyYXkgb2Yga2V5VmFsdWVzLCBvciB1bndyYXAgdGhlIGZpcnN0IGtleVZhbHVlIHNldCBhcyBhbiBvYmplY3RcbiAgb2JqID0gXy5pc09iamVjdChvYmopID8gZXh0cmFjdEtleVZhbE9yQXJyYXkob2JqKSA6IG9ialxuXG4gIC8vIERldGVjdCBzdHJpbmdzXG4gIGlmIChfLmlzU3RyaW5nKG9iaikpIHtcbiAgICAvLyBJZiBiZWdpbnMgd2l0aCBhICQsIHRoZW4gd2UgbmVlZCB0byBjb252ZXJ0IGl0IG92ZXIgdG8gYSByZWd1bGFyIHF1ZXJ5IG9iamVjdCBhbmQgYW5hbHl6ZSBpdCBhZ2FpblxuICAgIGlmIChpc1N0cmluZ1N5bnRheChvYmopKSB7XG4gICAgICByZXR1cm4gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24oY29udmVydEFnZ3JlZ2F0b3JTdHJpbmcob2JqKSlcbiAgICB9XG4gICAgLy8gSWYgbm9ybWFsIHN0cmluZywgdGhlbiBqdXN0IHJldHVybiBhIGFuIGl0ZW50aXR5IGFjY2Vzc29yXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGlkZW50aXR5KGQpIHtcbiAgICAgIHJldHVybiBkW29ial1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBhcnJheSwgcmVjdXJzZSBpbnRvIGVhY2ggaXRlbSBhbmQgcmV0dXJuIGFzIGEgbWFwXG4gIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgIHZhciBzdWJTdGFjayA9IF8ubWFwKG9iaiwgbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGdldFN1YlN0YWNrKGQpIHtcbiAgICAgIHJldHVybiBzdWJTdGFjay5tYXAoZnVuY3Rpb24gKHMpIHtcbiAgICAgICAgcmV0dXJuIHMoZClcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgLy8gSWYgb2JqZWN0LCBmaW5kIHRoZSBhZ2dyZWdhdGlvbiwgYW5kIHJlY3Vyc2UgaW50byB0aGUgdmFsdWVcbiAgaWYgKG9iai5rZXkpIHtcbiAgICBpZiAoYWdncmVnYXRvcnNbb2JqLmtleV0pIHtcbiAgICAgIHZhciBzdWJBZ2dyZWdhdGlvbkZ1bmN0aW9uID0gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24ob2JqLnZhbHVlKVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uIGdldEFnZ3JlZ2F0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0b3JzW29iai5rZXldKHN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24oZCkpXG4gICAgICB9XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkIG5vdCBmaW5kIGFnZ3JlZ3JhdGlvbiBtZXRob2QnLCBvYmopXG4gIH1cblxuICByZXR1cm4gW11cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEtleVZhbE9yQXJyYXkob2JqKSB7XG4gIHZhciBrZXlWYWxcbiAgdmFyIHZhbHVlcyA9IFtdXG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIGtleVZhbCA9IHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHZhbHVlOiBvYmpba2V5XVxuICAgICAgfVxuICAgICAgdmFyIHN1Yk9iaiA9IHt9XG4gICAgICBzdWJPYmpba2V5XSA9IG9ialtrZXldXG4gICAgICB2YWx1ZXMucHVzaChzdWJPYmopXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZXMubGVuZ3RoID4gMSA/IHZhbHVlcyA6IGtleVZhbFxufVxuXG5mdW5jdGlvbiBpc1N0cmluZ1N5bnRheChzdHIpIHtcbiAgcmV0dXJuIFsnJCcsICcoJ10uaW5kZXhPZihzdHIuY2hhckF0KDApKSA+IC0xXG59XG5cbmZ1bmN0aW9uIHBhcnNlQWdncmVnYXRvclBhcmFtcyhrZXlTdHJpbmcpIHtcbiAgdmFyIHBhcmFtcyA9IFtdXG4gIHZhciBwMSA9IGtleVN0cmluZy5pbmRleE9mKCcoJylcbiAgdmFyIHAyID0ga2V5U3RyaW5nLmluZGV4T2YoJyknKVxuICB2YXIga2V5ID0gcDEgPiAtMSA/IGtleVN0cmluZy5zdWJzdHJpbmcoMCwgcDEpIDoga2V5U3RyaW5nXG4gIGlmICghYWdncmVnYXRvcnNba2V5XSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG4gIGlmIChwMSA+IC0xICYmIHAyID4gLTEgJiYgcDIgPiBwMSkge1xuICAgIHBhcmFtcyA9IGtleVN0cmluZy5zdWJzdHJpbmcocDEgKyAxLCBwMikuc3BsaXQoJywnKVxuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBhZ2dyZWdhdG9yOiBhZ2dyZWdhdG9yc1trZXldLFxuICAgIHBhcmFtczogcGFyYW1zXG4gIH1cbn1cblxuZnVuY3Rpb24gY29udmVydEFnZ3JlZ2F0b3JTdHJpbmcoa2V5U3RyaW5nKSB7XG4gIC8vIHZhciBvYmogPSB7fSAvLyBvYmogaXMgZGVmaW5lZCBidXQgbm90IHVzZWRcblxuICAvLyAxLiB1bndyYXAgdG9wIHBhcmVudGhlc2VzXG4gIC8vIDIuIGRldGVjdCBhcnJheXNcblxuICAvLyBwYXJlbnRoZXNlc1xuICB2YXIgb3V0ZXJQYXJlbnMgPSAvXFwoKC4rKVxcKS9nXG4gIC8vIHZhciBpbm5lclBhcmVucyA9IC9cXCgoW15cXChcXCldKylcXCkvZyAgLy8gaW5uZXJQYXJlbnMgaXMgZGVmaW5lZCBidXQgbm90IHVzZWRcbiAgICAvLyBjb21tYSBub3QgaW4gKClcbiAgdmFyIGhhc0NvbW1hID0gLyg/OlxcKFteXFwoXFwpXSpcXCkpfCgsKS9nXG5cbiAgcmV0dXJuIEpTT04ucGFyc2UoJ3snICsgdW53cmFwUGFyZW5zQW5kQ29tbWFzKGtleVN0cmluZykgKyAnfScpXG5cbiAgZnVuY3Rpb24gdW53cmFwUGFyZW5zQW5kQ29tbWFzKHN0cikge1xuICAgIHN0ciA9IHN0ci5yZXBsYWNlKCcgJywgJycpXG4gICAgcmV0dXJuICdcIicgKyBzdHIucmVwbGFjZShvdXRlclBhcmVucywgZnVuY3Rpb24gKHAsIHByKSB7XG4gICAgICBpZiAoaGFzQ29tbWEudGVzdChwcikpIHtcbiAgICAgICAgaWYgKHByLmNoYXJBdCgwKSA9PT0gJyQnKSB7XG4gICAgICAgICAgcmV0dXJuICdcIjp7XCInICsgcHIucmVwbGFjZShoYXNDb21tYSwgZnVuY3Rpb24gKHAyLyogLCBwcjIgKi8pIHtcbiAgICAgICAgICAgIGlmIChwMiA9PT0gJywnKSB7XG4gICAgICAgICAgICAgIHJldHVybiAnLFwiJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVud3JhcFBhcmVuc0FuZENvbW1hcyhwMikudHJpbSgpXG4gICAgICAgICAgfSkgKyAnfSdcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJzpbXCInICsgcHIucmVwbGFjZShoYXNDb21tYSwgZnVuY3Rpb24gKC8qIHAyICwgcHIyICovKSB7XG4gICAgICAgICAgcmV0dXJuICdcIixcIidcbiAgICAgICAgfSkgKyAnXCJdJ1xuICAgICAgfVxuICAgIH0pXG4gIH1cbn1cblxuLy8gQ29sbGVjdGlvbiBBZ2dyZWdhdG9yc1xuXG5mdW5jdGlvbiAkc3VtKGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSArIGJcbiAgfSwgMClcbn1cblxuZnVuY3Rpb24gJGF2ZyhjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW4ucmVkdWNlKGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGEgKyBiXG4gIH0sIDApIC8gY2hpbGRyZW4ubGVuZ3RoXG59XG5cbmZ1bmN0aW9uICRtYXgoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGNoaWxkcmVuKVxufVxuXG5mdW5jdGlvbiAkbWluKGNoaWxkcmVuKSB7XG4gIHJldHVybiBNYXRoLm1pbi5hcHBseShudWxsLCBjaGlsZHJlbilcbn1cblxuZnVuY3Rpb24gJGNvdW50KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5sZW5ndGhcbn1cblxuLyogZnVuY3Rpb24gJG1lZChjaGlsZHJlbikgeyAvLyAkbWVkIGlzIGRlZmluZWQgYnV0IG5vdCB1c2VkXG4gIGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhIC0gYlxuICB9KVxuICB2YXIgaGFsZiA9IE1hdGguZmxvb3IoY2hpbGRyZW4ubGVuZ3RoIC8gMilcbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAlIDIpXG4gICAgcmV0dXJuIGNoaWxkcmVuW2hhbGZdXG4gIGVsc2VcbiAgICByZXR1cm4gKGNoaWxkcmVuW2hhbGYgLSAxXSArIGNoaWxkcmVuW2hhbGZdKSAvIDIuMFxufSAqL1xuXG5mdW5jdGlvbiAkZmlyc3QoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuWzBdXG59XG5cbmZ1bmN0aW9uICRsYXN0KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxufVxuXG5mdW5jdGlvbiAkZ2V0KGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbltuXVxufVxuXG5mdW5jdGlvbiAkbnRoTGFzdChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gbl1cbn1cblxuZnVuY3Rpb24gJG50aFBjdChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bTWF0aC5yb3VuZChjaGlsZHJlbi5sZW5ndGggKiAobiAvIDEwMCkpXVxufVxuXG5mdW5jdGlvbiAkbWFwKGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5tYXAoZnVuY3Rpb24gKGQpIHtcbiAgICByZXR1cm4gZFtuXVxuICB9KVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICByZXR1cm4gZnVuY3Rpb24gY2xlYXIoZGVmKSB7XG4gICAgLy8gQ2xlYXIgYSBzaW5nbGUgb3IgbXVsdGlwbGUgY29sdW1uIGRlZmluaXRpb25zXG4gICAgaWYgKGRlZikge1xuICAgICAgZGVmID0gXy5pc0FycmF5KGRlZikgPyBkZWYgOiBbZGVmXVxuICAgIH1cblxuICAgIGlmICghZGVmKSB7XG4gICAgICAvLyBDbGVhciBhbGwgb2YgdGhlIGNvbHVtbiBkZWZlbml0aW9uc1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHNlcnZpY2UuY29sdW1ucywgZGlzcG9zZUNvbHVtbikpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzZXJ2aWNlLmNvbHVtbnMgPSBbXVxuICAgICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKGRlZiwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIGlmIChfLmlzT2JqZWN0KGQpKSB7XG4gICAgICAgIGQgPSBkLmtleVxuICAgICAgfVxuICAgICAgLy8gQ2xlYXIgdGhlIGNvbHVtblxuICAgICAgdmFyIGNvbHVtbiA9IF8ucmVtb3ZlKHNlcnZpY2UuY29sdW1ucywgZnVuY3Rpb24gKGMpIHtcbiAgICAgICAgaWYgKF8uaXNBcnJheShkKSkge1xuICAgICAgICAgIHJldHVybiAhXy54b3IoYy5rZXksIGQpLmxlbmd0aFxuICAgICAgICB9XG4gICAgICAgIGlmIChjLmtleSA9PT0gZCkge1xuICAgICAgICAgIGlmIChjLmR5bmFtaWNSZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KVswXVxuXG4gICAgICBpZiAoIWNvbHVtbikge1xuICAgICAgICAvLyBjb25zb2xlLmluZm8oJ0F0dGVtcHRlZCB0byBjbGVhciBhIGNvbHVtbiB0aGF0IGlzIHJlcXVpcmVkIGZvciBhbm90aGVyIHF1ZXJ5IScsIGMpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBkaXNwb3NlQ29sdW1uKGNvbHVtbilcbiAgICB9KSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc2VydmljZVxuICAgIH0pXG5cbiAgICBmdW5jdGlvbiBkaXNwb3NlQ29sdW1uKGNvbHVtbikge1xuICAgICAgdmFyIGRpc3Bvc2FsQWN0aW9ucyA9IFtdXG4gICAgICAgIC8vIERpc3Bvc2UgdGhlIGRpbWVuc2lvblxuICAgICAgaWYgKGNvbHVtbi5yZW1vdmVMaXN0ZW5lcnMpIHtcbiAgICAgICAgZGlzcG9zYWxBY3Rpb25zID0gXy5tYXAoY29sdW1uLnJlbW92ZUxpc3RlbmVycywgZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShsaXN0ZW5lcigpKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2ZpbHRlcktleV1cbiAgICAgIGlmIChjb2x1bW4uZGltZW5zaW9uKSB7XG4gICAgICAgIGRpc3Bvc2FsQWN0aW9ucy5wdXNoKFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmRpc3Bvc2UoKSkpXG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZGlzcG9zYWxBY3Rpb25zKVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICB2YXIgZGltZW5zaW9uID0gcmVxdWlyZSgnLi9kaW1lbnNpb24nKShzZXJ2aWNlKVxuXG4gIHZhciBjb2x1bW5GdW5jID0gY29sdW1uXG4gIGNvbHVtbkZ1bmMuZmluZCA9IGZpbmRDb2x1bW5cblxuICByZXR1cm4gY29sdW1uRnVuY1xuXG4gIGZ1bmN0aW9uIGNvbHVtbihkZWYpIHtcbiAgICAvLyBTdXBwb3J0IGdyb3VwQWxsIGRpbWVuc2lvblxuICAgIGlmIChfLmlzVW5kZWZpbmVkKGRlZikpIHtcbiAgICAgIGRlZiA9IHRydWVcbiAgICB9XG5cbiAgICAvLyBBbHdheXMgZGVhbCBpbiBidWxrLiAgTGlrZSBDb3N0Y28hXG4gICAgaWYgKCFfLmlzQXJyYXkoZGVmKSkge1xuICAgICAgZGVmID0gW2RlZl1cbiAgICB9XG5cbiAgICAvLyBNYXBwIGFsbCBjb2x1bW4gY3JlYXRpb24sIHdhaXQgZm9yIGFsbCB0byBzZXR0bGUsIHRoZW4gcmV0dXJuIHRoZSBpbnN0YW5jZVxuICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChkZWYsIG1ha2VDb2x1bW4pKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRDb2x1bW4oZCkge1xuICAgIHJldHVybiBfLmZpbmQoc2VydmljZS5jb2x1bW5zLCBmdW5jdGlvbiAoYykge1xuICAgICAgaWYgKF8uaXNBcnJheShkKSkge1xuICAgICAgICByZXR1cm4gIV8ueG9yKGMua2V5LCBkKS5sZW5ndGhcbiAgICAgIH1cbiAgICAgIHJldHVybiBjLmtleSA9PT0gZFxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBnZXRUeXBlKGQpIHtcbiAgICBpZiAoXy5pc051bWJlcihkKSkge1xuICAgICAgcmV0dXJuICdudW1iZXInXG4gICAgfVxuICAgIGlmIChfLmlzQm9vbGVhbihkKSkge1xuICAgICAgcmV0dXJuICdib29sJ1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICByZXR1cm4gJ2FycmF5J1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChkKSkge1xuICAgICAgcmV0dXJuICdvYmplY3QnXG4gICAgfVxuICAgIHJldHVybiAnc3RyaW5nJ1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUNvbHVtbihkKSB7XG4gICAgdmFyIGNvbHVtbiA9IF8uaXNPYmplY3QoZCkgPyBkIDoge1xuICAgICAga2V5OiBkLFxuICAgIH1cblxuICAgIHZhciBleGlzdGluZyA9IGZpbmRDb2x1bW4oY29sdW1uLmtleSlcblxuICAgIGlmIChleGlzdGluZykge1xuICAgICAgZXhpc3RpbmcudGVtcG9yYXJ5ID0gZmFsc2VcbiAgICAgIGlmIChleGlzdGluZy5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgIGV4aXN0aW5nLmR5bmFtaWNSZWZlcmVuY2UgPSBmYWxzZVxuICAgICAgfVxuICAgICAgcmV0dXJuIGV4aXN0aW5nLnByb21pc2VcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLy8gZm9yIHN0b3JpbmcgaW5mbyBhYm91dCBxdWVyaWVzIGFuZCBwb3N0IGFnZ3JlZ2F0aW9uc1xuICAgIGNvbHVtbi5xdWVyaWVzID0gW11cbiAgICBzZXJ2aWNlLmNvbHVtbnMucHVzaChjb2x1bW4pXG5cbiAgICBjb2x1bW4ucHJvbWlzZSA9IFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5hbGwoKSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChhbGwpIHtcbiAgICAgIHZhciBzYW1wbGVcblxuICAgICAgLy8gQ29tcGxleCBjb2x1bW4gS2V5c1xuICAgICAgaWYgKF8uaXNBcnJheShjb2x1bW4ua2V5KSkge1xuICAgICAgICBjb2x1bW4uY29tcGxleCA9IHRydWVcbiAgICAgICAgc2FtcGxlID0gXy52YWx1ZXMoXy5waWNrKGFsbFswXSwgY29sdW1uLmtleSkpXG4gICAgICAgIGlmIChzYW1wbGUubGVuZ3RoICE9PSBjb2x1bW4ua2V5Lmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29sdW1uIGtleSBkb2VzIG5vdCBleGlzdCBpbiBkYXRhIScsIGNvbHVtbi5rZXkpXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNhbXBsZSA9IGFsbFswXVtjb2x1bW4ua2V5XVxuICAgICAgfVxuXG4gICAgICAvLyBJbmRleCBDb2x1bW5cbiAgICAgIGlmICghY29sdW1uLmNvbXBsZXggJiYgY29sdW1uLmtleSAhPT0gdHJ1ZSAmJiB0eXBlb2Ygc2FtcGxlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbHVtbiBrZXkgZG9lcyBub3QgZXhpc3QgaW4gZGF0YSEnLCBjb2x1bW4ua2V5KVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGUgY29sdW1uIGV4aXN0cywgbGV0J3MgYXQgbGVhc3QgbWFrZSBzdXJlIGl0J3MgbWFya2VkXG4gICAgICAvLyBhcyBwZXJtYW5lbnQuIFRoZXJlIGlzIGEgc2xpZ2h0IGNoYW5jZSBpdCBleGlzdHMgYmVjYXVzZVxuICAgICAgLy8gb2YgYSBmaWx0ZXIsIGFuZCB0aGUgdXNlciBkZWNpZGVzIHRvIG1ha2UgaXQgcGVybWFuZW50XG5cbiAgICAgIGNvbHVtbi50eXBlID1cbiAgICAgICAgY29sdW1uLmtleSA9PT0gdHJ1ZSA/ICdhbGwnIDpcbiAgICAgICAgY29sdW1uLmNvbXBsZXggPyAnY29tcGxleCcgOlxuICAgICAgICBjb2x1bW4uYXJyYXkgPyAnYXJyYXknIDpcbiAgICAgICAgZ2V0VHlwZShzYW1wbGUpXG5cbiAgICAgIHJldHVybiBkaW1lbnNpb24ubWFrZShjb2x1bW4ua2V5LCBjb2x1bW4udHlwZSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uIChkaW0pIHtcbiAgICAgIGNvbHVtbi5kaW1lbnNpb24gPSBkaW1cbiAgICAgIGNvbHVtbi5maWx0ZXJDb3VudCA9IDBcbiAgICAgIHZhciBzdG9wTGlzdGVuaW5nRm9yRGF0YSA9IHNlcnZpY2Uub25EYXRhQ2hhbmdlKGJ1aWxkQ29sdW1uS2V5cylcbiAgICAgIGNvbHVtbi5yZW1vdmVMaXN0ZW5lcnMgPSBbc3RvcExpc3RlbmluZ0ZvckRhdGFdXG5cbiAgICAgIHJldHVybiBidWlsZENvbHVtbktleXMoKVxuXG4gICAgICAvLyBCdWlsZCB0aGUgY29sdW1uS2V5c1xuICAgICAgZnVuY3Rpb24gYnVpbGRDb2x1bW5LZXlzKGNoYW5nZXMpIHtcbiAgICAgICAgaWYgKGNvbHVtbi5rZXkgPT09IHRydWUpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY2Nlc3NvciA9IGRpbWVuc2lvbi5tYWtlQWNjZXNzb3IoY29sdW1uLmtleSlcbiAgICAgICAgY29sdW1uLnZhbHVlcyA9IGNvbHVtbi52YWx1ZXMgfHwgW11cblxuICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmIChjaGFuZ2VzICYmIGNoYW5nZXMuYWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhbmdlcy5hZGRlZClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmJvdHRvbShJbmZpbml0eSkpXG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChyb3dzKSB7XG4gICAgICAgICAgdmFyIG5ld1ZhbHVlc1xuICAgICAgICAgIGlmIChjb2x1bW4udHlwZSA9PT0gJ2NvbXBsZXgnKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMgPSBfLmZsYXR0ZW4oXy5tYXAocm93cywgYWNjZXNzb3IpKVxuICAgICAgICAgIH0gZWxzZSBpZiAoY29sdW1uLnR5cGUgPT09ICdhcnJheScpIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlcyA9IF8uZmxhdHRlbihfLm1hcChyb3dzLCBhY2Nlc3NvcikpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5ld1ZhbHVlcyA9IF8ubWFwKHJvd3MsIGFjY2Vzc29yKVxuICAgICAgICAgIH1cbiAgICAgICAgICBjb2x1bW4udmFsdWVzID0gXy51bmlxKGNvbHVtbi52YWx1ZXMuY29uY2F0KG5ld1ZhbHVlcykpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfSlcblxuICAgIHJldHVybiBjb2x1bW4ucHJvbWlzZVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcjInKVxuXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICByZXR1cm4ge1xuICAgIGJ1aWxkOiBidWlsZCxcbiAgICBnZW5lcmF0ZUNvbHVtbnM6IGdlbmVyYXRlQ29sdW1ucyxcbiAgICBhZGQ6IGFkZCxcbiAgICByZW1vdmU6IHJlbW92ZSxcbiAgfVxuXG4gIGZ1bmN0aW9uIGJ1aWxkKGMpIHtcbiAgICBpZiAoXy5pc0FycmF5KGMpKSB7XG4gICAgICAvLyBUaGlzIGFsbG93cyBzdXBwb3J0IGZvciBjcm9zc2ZpbHRlciBhc3luY1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjcm9zc2ZpbHRlcihjKSlcbiAgICB9XG4gICAgaWYgKCFjIHx8IHR5cGVvZiBjLmRpbWVuc2lvbiAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gQ3Jvc3NmaWx0ZXIgZGF0YSBvciBpbnN0YW5jZSBmb3VuZCEnKSlcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVDb2x1bW5zKGRhdGEpIHtcbiAgICBpZiAoIXNlcnZpY2Uub3B0aW9ucy5nZW5lcmF0ZWRDb2x1bW5zKSB7XG4gICAgICByZXR1cm4gZGF0YVxuICAgIH1cbiAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24gKGQvKiAsIGkgKi8pIHtcbiAgICAgIF8uZm9yRWFjaChzZXJ2aWNlLm9wdGlvbnMuZ2VuZXJhdGVkQ29sdW1ucywgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgIGRba2V5XSA9IHZhbChkKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBkXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZChkYXRhKSB7XG4gICAgZGF0YSA9IGdlbmVyYXRlQ29sdW1ucyhkYXRhKVxuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YuYWRkKGRhdGEpKVxuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIFByb21pc2Uuc2VyaWFsKF8ubWFwKHNlcnZpY2UuZGF0YUxpc3RlbmVycywgZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIGxpc3RlbmVyKHtcbiAgICAgICAgICAgIGFkZGVkOiBkYXRhXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSkpXG4gICAgfSlcbiAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gc2VydmljZVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5yZW1vdmUoKSlcbiAgICB9KVxuICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgfSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG4vLyB2YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJykgLy8gXyBpcyBkZWZpbmVkIGJ1dCBuZXZlciB1c2VkXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlc3Ryb3koKSB7XG4gICAgcmV0dXJuIHNlcnZpY2UuY2xlYXIoKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICBzZXJ2aWNlLmNmLmRhdGFMaXN0ZW5lcnMgPSBbXVxuICAgICAgICBzZXJ2aWNlLmNmLmZpbHRlckxpc3RlbmVycyA9IFtdXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5yZW1vdmUoKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZXJ2aWNlKSB7XG4gIHJldHVybiB7XG4gICAgbWFrZTogbWFrZSxcbiAgICBtYWtlQWNjZXNzb3I6IG1ha2VBY2Nlc3NvcixcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2Uoa2V5LCB0eXBlKSB7XG4gICAgdmFyIGFjY2Vzc29yID0gbWFrZUFjY2Vzc29yKGtleSlcbiAgICAvLyBQcm9taXNlLnJlc29sdmUgd2lsbCBoYW5kbGUgcHJvbWlzZXMgb3Igbm9uIHByb21pc2VzLCBzb1xuICAgIC8vIHRoaXMgY3Jvc3NmaWx0ZXIgYXN5bmMgaXMgc3VwcG9ydGVkIGlmIHByZXNlbnRcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YuZGltZW5zaW9uKGFjY2Vzc29yLCB0eXBlID09PSAnYXJyYXknKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VBY2Nlc3NvcihrZXkpIHtcbiAgICB2YXIgYWNjZXNzb3JGdW5jdGlvblxuXG4gICAgLy8gTXVsdGkta2V5IGRpbWVuc2lvblxuICAgIGlmIChfLmlzQXJyYXkoa2V5KSkge1xuICAgICAgdmFyIGFycmF5U3RyaW5nID0gXy5tYXAoa2V5LCBmdW5jdGlvbiAoaykge1xuICAgICAgICByZXR1cm4gJ2RbXFwnJyArIGsgKyAnXFwnXSdcbiAgICAgIH0pXG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID0gbmV3IEZ1bmN0aW9uKCdkJywgU3RyaW5nKCdyZXR1cm4gJyArIEpTT04uc3RyaW5naWZ5KGFycmF5U3RyaW5nKS5yZXBsYWNlKC9cIi9nLCAnJykpKSAgLy8gZXNsaW50LWRpc2FibGUtbGluZSAgbm8tbmV3LWZ1bmNcbiAgICB9IGVsc2Uge1xuICAgICAgYWNjZXNzb3JGdW5jdGlvbiA9XG4gICAgICAgIC8vIEluZGV4IERpbWVuc2lvblxuICAgICAgICBrZXkgPT09IHRydWUgPyBmdW5jdGlvbiBhY2Nlc3NvcihkLCBpKSB7XG4gICAgICAgICAgcmV0dXJuIGlcbiAgICAgICAgfSA6XG4gICAgICAgIC8vIFZhbHVlIEFjY2Vzc29yIERpbWVuc2lvblxuICAgICAgICBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHJldHVybiBkW2tleV1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzb3JGdW5jdGlvblxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLy8gdmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvLyBHZXR0ZXJzXG4gICRmaWVsZDogJGZpZWxkLFxuICAvLyBCb29sZWFuc1xuICAkYW5kOiAkYW5kLFxuICAkb3I6ICRvcixcbiAgJG5vdDogJG5vdCxcblxuICAvLyBFeHByZXNzaW9uc1xuICAkZXE6ICRlcSxcbiAgJGd0OiAkZ3QsXG4gICRndGU6ICRndGUsXG4gICRsdDogJGx0LFxuICAkbHRlOiAkbHRlLFxuICAkbmU6ICRuZSxcbiAgJHR5cGU6ICR0eXBlLFxuXG4gIC8vIEFycmF5IEV4cHJlc3Npb25zXG4gICRpbjogJGluLFxuICAkbmluOiAkbmluLFxuICAkY29udGFpbnM6ICRjb250YWlucyxcbiAgJGV4Y2x1ZGVzOiAkZXhjbHVkZXMsXG4gICRzaXplOiAkc2l6ZSxcbn1cblxuLy8gR2V0dGVyc1xuZnVuY3Rpb24gJGZpZWxkKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkW2NoaWxkXVxufVxuXG4vLyBPcGVyYXRvcnNcblxuZnVuY3Rpb24gJGFuZChkLCBjaGlsZCkge1xuICBjaGlsZCA9IGNoaWxkKGQpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWNoaWxkW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gJG9yKGQsIGNoaWxkKSB7XG4gIGNoaWxkID0gY2hpbGQoZClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChjaGlsZFtpXSkge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uICRub3QoZCwgY2hpbGQpIHtcbiAgY2hpbGQgPSBjaGlsZChkKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoaWxkW2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxuLy8gRXhwcmVzc2lvbnNcblxuZnVuY3Rpb24gJGVxKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID09PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRndChkLCBjaGlsZCkge1xuICByZXR1cm4gZCA+IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGd0ZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCA+PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRsdChkLCBjaGlsZCkge1xuICByZXR1cm4gZCA8IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGx0ZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCA8PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRuZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCAhPT0gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkdHlwZShkLCBjaGlsZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09IGNoaWxkKClcbn1cblxuLy8gQXJyYXkgRXhwcmVzc2lvbnNcblxuZnVuY3Rpb24gJGluKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkLmluZGV4T2YoY2hpbGQoKSkgPiAtMVxufVxuXG5mdW5jdGlvbiAkbmluKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkLmluZGV4T2YoY2hpbGQoKSkgPT09IC0xXG59XG5cbmZ1bmN0aW9uICRjb250YWlucyhkLCBjaGlsZCkge1xuICByZXR1cm4gY2hpbGQoKS5pbmRleE9mKGQpID4gLTFcbn1cblxuZnVuY3Rpb24gJGV4Y2x1ZGVzKGQsIGNoaWxkKSB7XG4gIHJldHVybiBjaGlsZCgpLmluZGV4T2YoZCkgPT09IC0xXG59XG5cbmZ1bmN0aW9uICRzaXplKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkLmxlbmd0aCA9PT0gY2hpbGQoKVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxudmFyIGV4cHJlc3Npb25zID0gcmVxdWlyZSgnLi9leHByZXNzaW9ucycpXG52YXIgYWdncmVnYXRpb24gPSByZXF1aXJlKCcuL2FnZ3JlZ2F0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VydmljZSkge1xuICByZXR1cm4ge1xuICAgIGZpbHRlcjogZmlsdGVyLFxuICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgIGFwcGx5RmlsdGVyczogYXBwbHlGaWx0ZXJzLFxuICAgIG1ha2VGdW5jdGlvbjogbWFrZUZ1bmN0aW9uLFxuICAgIHNjYW5Gb3JEeW5hbWljRmlsdGVyczogc2NhbkZvckR5bmFtaWNGaWx0ZXJzXG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIoY29sdW1uLCBmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpIHtcbiAgICB2YXIgZXhpc3RzID0gc2VydmljZS5jb2x1bW4uZmluZChjb2x1bW4pXG5cbiAgICAvLyBJZiB0aGUgZmlsdGVycyBkaW1lbnNpb24gZG9lc24ndCBleGlzdCB5ZXQsIHRyeSBhbmQgY3JlYXRlIGl0XG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghZXhpc3RzKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAga2V5OiBjb2x1bW4sXG4gICAgICAgICAgdGVtcG9yYXJ5OiB0cnVlLFxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgLy8gSXQgd2FzIGFibGUgdG8gYmUgY3JlYXRlZCwgc28gcmV0cmlldmUgYW5kIHJldHVybiBpdFxuICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbi5maW5kKGNvbHVtbilcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIC8vIEl0IGV4aXN0cywgc28ganVzdCByZXR1cm4gd2hhdCB3ZSBmb3VuZFxuICAgICAgcmV0dXJuIGV4aXN0c1xuICAgIH0pXG4gICAgLnRoZW4oZnVuY3Rpb24gKGNvbHVtbikge1xuICAgICAgLy8gQ2xvbmUgYSBjb3B5IG9mIHRoZSBuZXcgZmlsdGVyc1xuICAgICAgdmFyIG5ld0ZpbHRlcnMgPSBfLmFzc2lnbih7fSwgc2VydmljZS5maWx0ZXJzKVxuICAgICAgLy8gSGVyZSB3ZSB1c2UgdGhlIHJlZ2lzdGVyZWQgY29sdW1uIGtleSBkZXNwaXRlIHRoZSBmaWx0ZXIga2V5IHBhc3NlZCwganVzdCBpbiBjYXNlIHRoZSBmaWx0ZXIga2V5J3Mgb3JkZXJpbmcgaXMgb3JkZXJlZCBkaWZmZXJlbnRseSA6KVxuICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICAvLyBCdWlsZCB0aGUgZmlsdGVyIG9iamVjdFxuICAgICAgbmV3RmlsdGVyc1tmaWx0ZXJLZXldID0gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKVxuXG4gICAgICByZXR1cm4gYXBwbHlGaWx0ZXJzKG5ld0ZpbHRlcnMpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICBzZXJ2aWNlLmNvbHVtbnMuZm9yRWFjaChmdW5jdGlvbiAoY29sKSB7XG4gICAgICBjb2wuZGltZW5zaW9uLmZpbHRlckFsbCgpXG4gICAgfSlcbiAgICByZXR1cm4gYXBwbHlGaWx0ZXJzKHt9KVxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKSB7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQoZmlsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IGZpbCxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKF8uaXNPYmplY3QoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IG1ha2VGdW5jdGlvbihmaWwpLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgcmVwbGFjZTogaXNSYW5nZSB8fCByZXBsYWNlLFxuICAgICAgICB0eXBlOiBpc1JhbmdlID8gJ3JhbmdlJyA6ICdpbmNsdXNpdmUnLFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IGZpbCxcbiAgICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgICB0eXBlOiAnZXhhY3QnLFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5RmlsdGVycyhuZXdGaWx0ZXJzKSB7XG4gICAgdmFyIGRzID0gXy5tYXAobmV3RmlsdGVycywgZnVuY3Rpb24gKGZpbCwgaSkge1xuICAgICAgdmFyIGV4aXN0aW5nID0gc2VydmljZS5maWx0ZXJzW2ldXG4gICAgICAgIC8vIEZpbHRlcnMgYXJlIHRoZSBzYW1lLCBzbyBubyBjaGFuZ2UgaXMgbmVlZGVkIG9uIHRoaXMgY29sdW1uXG4gICAgICBpZiAoZmlsID09PSBleGlzdGluZykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIH1cbiAgICAgIHZhciBjb2x1bW5cbiAgICAgICAgLy8gUmV0cmlldmUgY29tcGxleCBjb2x1bW5zIGJ5IGRlY29kaW5nIHRoZSBjb2x1bW4ga2V5IGFzIGpzb25cbiAgICAgIGlmIChpLmNoYXJBdCgwKSA9PT0gJ1snKSB7XG4gICAgICAgIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoSlNPTi5wYXJzZShpKSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFJldHJpZXZlIHRoZSBjb2x1bW4gbm9ybWFsbHlcbiAgICAgICAgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChpKVxuICAgICAgfVxuXG4gICAgICAvLyBUb2dnbGluZyBhIGZpbHRlciB2YWx1ZSBpcyBhIGJpdCBkaWZmZXJlbnQgZnJvbSByZXBsYWNpbmcgdGhlbVxuICAgICAgaWYgKGZpbCAmJiBleGlzdGluZyAmJiAhZmlsLnJlcGxhY2UpIHtcbiAgICAgICAgbmV3RmlsdGVyc1tpXSA9IGZpbCA9IHRvZ2dsZUZpbHRlcnMoZmlsLCBleGlzdGluZylcbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gZmlsdGVyLCByZW1vdmUgZXZlcnl0aGluZyBmcm9tIHRoZSBkaW1lbnNpb25cbiAgICAgIGlmICghZmlsKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0Jykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRXhhY3QoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyUmFuZ2UoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2luY2x1c2l2ZScpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgcmV0dXJuIGZpbC52YWx1ZS5pbmRleE9mKGQpID4gLTFcbiAgICAgICAgfSkpXG4gICAgICB9XG4gICAgICBpZiAoZmlsLnR5cGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZpbC5mdW5jdGlvbikpXG4gICAgICB9XG4gICAgICAvLyBCeSBkZWZhdWx0IGlmIHNvbWV0aGluZyBjcmFwcyB1cCwganVzdCByZW1vdmUgYWxsIGZpbHRlcnNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKGRzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgZmlsdGVycyBzYXRhdGVcbiAgICAgICAgc2VydmljZS5maWx0ZXJzID0gbmV3RmlsdGVyc1xuXG4gICAgICAgIC8vIFBsdWNrIGFuZCByZW1vdmUgZmFsc2V5IGZpbHRlcnMgZnJvbSB0aGUgbWl4XG4gICAgICAgIHZhciB0cnlSZW1vdmFsID0gW11cbiAgICAgICAgXy5mb3JFYWNoKHNlcnZpY2UuZmlsdGVycywgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgIHRyeVJlbW92YWwucHVzaCh7XG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gSWYgYW55IG9mIHRob3NlIGZpbHRlcnMgYXJlIHRoZSBsYXN0IGRlcGVuZGVuY3kgZm9yIHRoZSBjb2x1bW4sIHRoZW4gcmVtb3ZlIHRoZSBjb2x1bW5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHRyeVJlbW92YWwsIGZ1bmN0aW9uICh2KSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoKHYua2V5LmNoYXJBdCgwKSA9PT0gJ1snKSA/IEpTT04ucGFyc2Uodi5rZXkpIDogdi5rZXkpXG4gICAgICAgICAgaWYgKGNvbHVtbi50ZW1wb3JhcnkgJiYgIWNvbHVtbi5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VydmljZS5jbGVhcihjb2x1bW4ua2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBDYWxsIHRoZSBmaWx0ZXJMaXN0ZW5lcnMgYW5kIHdhaXQgZm9yIHRoZWlyIHJldHVyblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoc2VydmljZS5maWx0ZXJMaXN0ZW5lcnMsIGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgIHJldHVybiBsaXN0ZW5lcigpXG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVGaWx0ZXJzKGZpbCwgZXhpc3RpbmcpIHtcbiAgICAvLyBFeGFjdCBmcm9tIEluY2x1c2l2ZVxuICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgZmlsLnZhbHVlID0gXy54b3IoW2ZpbC52YWx1ZV0sIGV4aXN0aW5nLnZhbHVlKVxuICAgIH0gZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdpbmNsdXNpdmUnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdleGFjdCcpIHsgLy8gSW5jbHVzaXZlIGZyb20gRXhhY3RcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgW2V4aXN0aW5nLnZhbHVlXSlcbiAgICB9IGVsc2UgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykgeyAvLyBJbmNsdXNpdmUgLyBJbmNsdXNpdmUgTWVyZ2VcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWUpXG4gICAgfSBlbHNlIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnZXhhY3QnKSB7IC8vIEV4YWN0IC8gRXhhY3RcbiAgICAgIC8vIElmIHRoZSB2YWx1ZXMgYXJlIHRoZSBzYW1lLCByZW1vdmUgdGhlIGZpbHRlciBlbnRpcmVseVxuICAgICAgaWYgKGZpbC52YWx1ZSA9PT0gZXhpc3RpbmcudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICAvLyBUaGV5IHRoZXkgYXJlIGRpZmZlcmVudCwgbWFrZSBhbiBhcnJheVxuICAgICAgZmlsLnZhbHVlID0gW2ZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWVdXG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBuZXcgdHlwZSBiYXNlZCBvbiB0aGUgbWVyZ2VkIHZhbHVlc1xuICAgIGlmICghZmlsLnZhbHVlLmxlbmd0aCkge1xuICAgICAgZmlsID0gZmFsc2VcbiAgICB9IGVsc2UgaWYgKGZpbC52YWx1ZS5sZW5ndGggPT09IDEpIHtcbiAgICAgIGZpbC50eXBlID0gJ2V4YWN0J1xuICAgICAgZmlsLnZhbHVlID0gZmlsLnZhbHVlWzBdXG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbC50eXBlID0gJ2luY2x1c2l2ZSdcbiAgICB9XG5cbiAgICByZXR1cm4gZmlsXG4gIH1cblxuICBmdW5jdGlvbiBzY2FuRm9yRHluYW1pY0ZpbHRlcnMocXVlcnkpIHtcbiAgICAvLyBIZXJlIHdlIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgYW55IHJlbGF0aXZlIHJlZmVyZW5jZXMgdG8gdGhlIHJhdyBkYXRhXG4gICAgLy8gYmVpbmcgdXNlZCBpbiB0aGUgZmlsdGVyLiBJZiBzbywgd2UgbmVlZCB0byBidWlsZCB0aG9zZSBkaW1lbnNpb25zIGFuZCBrZWVwXG4gICAgLy8gdGhlbSB1cGRhdGVkIHNvIHRoZSBmaWx0ZXJzIGNhbiBiZSByZWJ1aWx0IGlmIG5lZWRlZFxuICAgIC8vIFRoZSBzdXBwb3J0ZWQga2V5cyByaWdodCBub3cgYXJlOiAkY29sdW1uLCAkZGF0YVxuICAgIHZhciBjb2x1bW5zID0gW11cbiAgICB3YWxrKHF1ZXJ5LmZpbHRlcilcbiAgICByZXR1cm4gY29sdW1uc1xuXG4gICAgZnVuY3Rpb24gd2FsayhvYmopIHtcbiAgICAgIF8uZm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAvLyBmaW5kIHRoZSBkYXRhIHJlZmVyZW5jZXMsIGlmIGFueVxuICAgICAgICB2YXIgcmVmID0gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KVxuICAgICAgICBpZiAocmVmKSB7XG4gICAgICAgICAgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgfVxuICAgICAgICAgIC8vIGlmIGl0J3MgYSBzdHJpbmdcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgIHJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCB2YWwpXG4gICAgICAgICAgaWYgKHJlZikge1xuICAgICAgICAgICAgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgaXQncyBhbm90aGVyIG9iamVjdCwga2VlcCBsb29raW5nXG4gICAgICAgIGlmIChfLmlzT2JqZWN0KHZhbCkpIHtcbiAgICAgICAgICB3YWxrKHZhbClcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kRGF0YVJlZmVyZW5jZXModmFsLCBrZXkpIHtcbiAgICAvLyBsb29rIGZvciB0aGUgJGRhdGEgc3RyaW5nIGFzIGEgdmFsdWVcbiAgICBpZiAoa2V5ID09PSAnJGRhdGEnKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIGxvb2sgZm9yIHRoZSAkY29sdW1uIGtleSBhbmQgaXQncyB2YWx1ZSBhcyBhIHN0cmluZ1xuICAgIGlmIChrZXkgJiYga2V5ID09PSAnJGNvbHVtbicpIHtcbiAgICAgIGlmIChfLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgcmV0dXJuIHZhbFxuICAgICAgfVxuICAgICAgY29uc29sZS53YXJuKCdUaGUgdmFsdWUgZm9yIGZpbHRlciBcIiRjb2x1bW5cIiBtdXN0IGJlIGEgdmFsaWQgY29sdW1uIGtleScsIHZhbClcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VGdW5jdGlvbihvYmosIGlzQWdncmVnYXRpb24pIHtcbiAgICB2YXIgc3ViR2V0dGVyc1xuXG4gICAgLy8gRGV0ZWN0IHJhdyAkZGF0YSByZWZlcmVuY2VcbiAgICBpZiAoXy5pc1N0cmluZyhvYmopKSB7XG4gICAgICB2YXIgZGF0YVJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCBvYmopXG4gICAgICBpZiAoZGF0YVJlZikge1xuICAgICAgICB2YXIgZGF0YSA9IHNlcnZpY2UuY2YuYWxsKClcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzTnVtYmVyKG9iaikgfHwgXy5pc0Jvb2xlYW4ob2JqKSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zLiRlcShkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmV0dXJuIG9ialxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIGFuIGFycmF5LCByZWN1cnNlIGludG8gZWFjaCBpdGVtIGFuZCByZXR1cm4gYXMgYSBtYXBcbiAgICBpZiAoXy5pc0FycmF5KG9iaikpIHtcbiAgICAgIHN1YkdldHRlcnMgPSBfLm1hcChvYmosIGZ1bmN0aW9uIChvKSB7XG4gICAgICAgIHJldHVybiBtYWtlRnVuY3Rpb24obywgaXNBZ2dyZWdhdGlvbilcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIHN1YkdldHRlcnMubWFwKGZ1bmN0aW9uIChzKSB7XG4gICAgICAgICAgcmV0dXJuIHMoZClcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBvYmplY3QsIHJldHVybiBhIHJlY3Vyc2lvbiBmdW5jdGlvbiB0aGF0IGl0c2VsZiwgcmV0dXJucyB0aGUgcmVzdWx0cyBvZiBhbGwgb2YgdGhlIG9iamVjdCBrZXlzXG4gICAgaWYgKF8uaXNPYmplY3Qob2JqKSkge1xuICAgICAgc3ViR2V0dGVycyA9IF8ubWFwKG9iaiwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgICAgIC8vIEdldCB0aGUgY2hpbGRcbiAgICAgICAgdmFyIGdldFN1YiA9IG1ha2VGdW5jdGlvbih2YWwsIGlzQWdncmVnYXRpb24pXG5cbiAgICAgICAgLy8gRGV0ZWN0IHJhdyAkY29sdW1uIHJlZmVyZW5jZXNcbiAgICAgICAgdmFyIGRhdGFSZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXModmFsLCBrZXkpXG4gICAgICAgIGlmIChkYXRhUmVmKSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoZGF0YVJlZilcbiAgICAgICAgICB2YXIgZGF0YSA9IGNvbHVtbi52YWx1ZXNcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBleHByZXNzaW9uLCBwYXNzIHRoZSBwYXJlbnRWYWx1ZSBhbmQgdGhlIHN1YkdldHRlclxuICAgICAgICBpZiAoZXhwcmVzc2lvbnNba2V5XSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zW2tleV0oZCwgZ2V0U3ViKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZ2dyZWdhdG9yT2JqID0gYWdncmVnYXRpb24ucGFyc2VBZ2dyZWdhdG9yUGFyYW1zKGtleSlcbiAgICAgICAgaWYgKGFnZ3JlZ2F0b3JPYmopIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBhbnkgZnVydGhlciBvcGVyYXRpb25zIGFyZSBmb3IgYWdncmVnYXRpb25zXG4gICAgICAgICAgLy8gYW5kIG5vdCBmaWx0ZXJzXG4gICAgICAgICAgaXNBZ2dyZWdhdGlvbiA9IHRydWVcbiAgICAgICAgICAgIC8vIGhlcmUgd2UgcGFzcyB0cnVlIHRvIG1ha2VGdW5jdGlvbiB3aGljaCBkZW5vdGVzIHRoYXRcbiAgICAgICAgICAgIC8vIGFuIGFnZ3JlZ2F0aW5vIGNoYWluIGhhcyBzdGFydGVkIGFuZCB0byBzdG9wIHVzaW5nICRBTkRcbiAgICAgICAgICBnZXRTdWIgPSBtYWtlRnVuY3Rpb24odmFsLCBpc0FnZ3JlZ2F0aW9uKVxuICAgICAgICAgICAgLy8gSWYgaXQncyBhbiBhZ2dyZWdhdGlvbiBvYmplY3QsIGJlIHN1cmUgdG8gcGFzcyBpbiB0aGUgY2hpbGRyZW4sIGFuZCB0aGVuIGFueSBhZGRpdGlvbmFsIHBhcmFtcyBwYXNzZWQgaW50byB0aGUgYWdncmVnYXRpb24gc3RyaW5nXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdG9yT2JqLmFnZ3JlZ2F0b3IuYXBwbHkobnVsbCwgW2dldFN1YigpXS5jb25jYXQoYWdncmVnYXRvck9iai5wYXJhbXMpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0IG11c3QgYmUgYSBzdHJpbmcgdGhlbi4gUGx1Y2sgdGhhdCBzdHJpbmcga2V5IGZyb20gcGFyZW50LCBhbmQgcGFzcyBpdCBhcyB0aGUgbmV3IHZhbHVlIHRvIHRoZSBzdWJHZXR0ZXJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgZCA9IGRba2V5XVxuICAgICAgICAgIHJldHVybiBnZXRTdWIoZCwgZ2V0U3ViKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBBbGwgb2JqZWN0IGV4cHJlc3Npb25zIGFyZSBiYXNpY2FsbHkgQU5EJ3NcbiAgICAgIC8vIFJldHVybiBBTkQgd2l0aCBhIG1hcCBvZiB0aGUgc3ViR2V0dGVyc1xuICAgICAgaWYgKGlzQWdncmVnYXRpb24pIHtcbiAgICAgICAgaWYgKHN1YkdldHRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ViR2V0dGVyc1swXShkKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICByZXR1cm4gXy5tYXAoc3ViR2V0dGVycywgZnVuY3Rpb24gKGdldFN1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YihkKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbnMuJGFuZChkLCBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgIHJldHVybiBfLm1hcChzdWJHZXR0ZXJzLCBmdW5jdGlvbiAoZ2V0U3ViKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3ViKGQpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnbm8gZXhwcmVzc2lvbiBmb3VuZCBmb3IgJywgb2JqKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iLCIvKiBlc2xpbnQgbm8tcHJvdG90eXBlLWJ1aWx0aW5zOiAwICovXG4ndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2lnbjogYXNzaWduLFxuICBmaW5kOiBmaW5kLFxuICByZW1vdmU6IHJlbW92ZSxcbiAgaXNBcnJheTogaXNBcnJheSxcbiAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICBpc0Jvb2xlYW46IGlzQm9vbGVhbixcbiAgaXNTdHJpbmc6IGlzU3RyaW5nLFxuICBpc051bWJlcjogaXNOdW1iZXIsXG4gIGlzRnVuY3Rpb246IGlzRnVuY3Rpb24sXG4gIGdldDogZ2V0LFxuICBzZXQ6IHNldCxcbiAgbWFwOiBtYXAsXG4gIGtleXM6IGtleXMsXG4gIHNvcnRCeTogc29ydEJ5LFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBpc1VuZGVmaW5lZDogaXNVbmRlZmluZWQsXG4gIHBpY2s6IHBpY2ssXG4gIHhvcjogeG9yLFxuICBjbG9uZTogY2xvbmUsXG4gIGlzRXF1YWw6IGlzRXF1YWwsXG4gIHJlcGxhY2VBcnJheTogcmVwbGFjZUFycmF5LFxuICB1bmlxOiB1bmlxLFxuICBmbGF0dGVuOiBmbGF0dGVuLFxuICBzb3J0OiBzb3J0LFxuICB2YWx1ZXM6IHZhbHVlcyxcbiAgcmVjdXJzZU9iamVjdDogcmVjdXJzZU9iamVjdCxcbn1cblxuZnVuY3Rpb24gYXNzaWduKG91dCkge1xuICBvdXQgPSBvdXQgfHwge31cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWFyZ3VtZW50c1tpXSkge1xuICAgICAgY29udGludWVcbiAgICB9XG4gICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuICAgICAgaWYgKGFyZ3VtZW50c1tpXS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIG91dFtrZXldID0gYXJndW1lbnRzW2ldW2tleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBmaW5kKGEsIGIpIHtcbiAgcmV0dXJuIGEuZmluZChiKVxufVxuXG5mdW5jdGlvbiByZW1vdmUoYSwgYikge1xuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24gKG8sIGkpIHtcbiAgICB2YXIgciA9IGIobylcbiAgICBpZiAocikge1xuICAgICAgYS5zcGxpY2UoaSwgMSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICAgIHJldHVybiBmYWxzZVxuICB9KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSlcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoZCkge1xuICByZXR1cm4gdHlwZW9mIGQgPT09ICdvYmplY3QnICYmICFpc0FycmF5KGQpXG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ2Jvb2xlYW4nXG59XG5cbmZ1bmN0aW9uIGlzU3RyaW5nKGQpIHtcbiAgcmV0dXJuIHR5cGVvZiBkID09PSAnc3RyaW5nJ1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihkKSB7XG4gIHJldHVybiB0eXBlb2YgZCA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhKSB7XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJ1xufVxuXG5mdW5jdGlvbiBnZXQoYSwgYikge1xuICBpZiAoaXNBcnJheShiKSkge1xuICAgIGIgPSBiLmpvaW4oJy4nKVxuICB9XG4gIHJldHVybiBiXG4gICAgLnJlcGxhY2UoJ1snLCAnLicpLnJlcGxhY2UoJ10nLCAnJylcbiAgICAuc3BsaXQoJy4nKVxuICAgIC5yZWR1Y2UoXG4gICAgICBmdW5jdGlvbiAob2JqLCBwcm9wZXJ0eSkge1xuICAgICAgICByZXR1cm4gb2JqW3Byb3BlcnR5XVxuICAgICAgfSwgYVxuICAgIClcbn1cblxuZnVuY3Rpb24gc2V0KG9iaiwgcHJvcCwgdmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBwcm9wID09PSAnc3RyaW5nJykge1xuICAgIHByb3AgPSBwcm9wXG4gICAgICAucmVwbGFjZSgnWycsICcuJykucmVwbGFjZSgnXScsICcnKVxuICAgICAgLnNwbGl0KCcuJylcbiAgfVxuICBpZiAocHJvcC5sZW5ndGggPiAxKSB7XG4gICAgdmFyIGUgPSBwcm9wLnNoaWZ0KClcbiAgICBhc3NpZ24ob2JqW2VdID1cbiAgICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmpbZV0pID09PSAnW29iamVjdCBPYmplY3RdJyA/IG9ialtlXSA6IHt9LFxuICAgICAgcHJvcCxcbiAgICAgIHZhbHVlKVxuICB9IGVsc2Uge1xuICAgIG9ialtwcm9wWzBdXSA9IHZhbHVlXG4gIH1cbn1cblxuZnVuY3Rpb24gbWFwKGEsIGIpIHtcbiAgdmFyIG1cbiAgdmFyIGtleVxuICBpZiAoaXNGdW5jdGlvbihiKSkge1xuICAgIGlmIChpc09iamVjdChhKSkge1xuICAgICAgbSA9IFtdXG4gICAgICBmb3IgKGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBtLnB1c2goYihhW2tleV0sIGtleSwgYSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtXG4gICAgfVxuICAgIHJldHVybiBhLm1hcChiKVxuICB9XG4gIGlmIChpc09iamVjdChhKSkge1xuICAgIG0gPSBbXVxuICAgIGZvciAoa2V5IGluIGEpIHtcbiAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbS5wdXNoKGFba2V5XSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1cbiAgfVxuICByZXR1cm4gYS5tYXAoZnVuY3Rpb24gKGFhKSB7XG4gICAgcmV0dXJuIGFhW2JdXG4gIH0pXG59XG5cbmZ1bmN0aW9uIGtleXMob2JqKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhvYmopXG59XG5cbmZ1bmN0aW9uIHNvcnRCeShhLCBiKSB7XG4gIGlmIChpc0Z1bmN0aW9uKGIpKSB7XG4gICAgcmV0dXJuIGEuc29ydChmdW5jdGlvbiAoYWEsIGJiKSB7XG4gICAgICBpZiAoYihhYSkgPiBiKGJiKSkge1xuICAgICAgICByZXR1cm4gMVxuICAgICAgfVxuICAgICAgaWYgKGIoYWEpIDwgYihiYikpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICAvLyBhIG11c3QgYmUgZXF1YWwgdG8gYlxuICAgICAgcmV0dXJuIDBcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2goYSwgYikge1xuICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgaWYgKGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBiKGFba2V5XSwga2V5LCBhKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXNBcnJheShhKSkge1xuICAgIHJldHVybiBhLmZvckVhY2goYilcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhKSB7XG4gIHJldHVybiB0eXBlb2YgYSA9PT0gJ3VuZGVmaW5lZCdcbn1cblxuZnVuY3Rpb24gcGljayhhLCBiKSB7XG4gIHZhciBjID0ge31cbiAgZm9yRWFjaChiLCBmdW5jdGlvbiAoYmIpIHtcbiAgICBpZiAodHlwZW9mIGFbYmJdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY1tiYl0gPSBhW2JiXVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGNcbn1cblxuZnVuY3Rpb24geG9yKGEsIGIpIHtcbiAgdmFyIHVuaXF1ZSA9IFtdXG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKGFhKSB7XG4gICAgaWYgKGIuaW5kZXhPZihhYSkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5pcXVlLnB1c2goYWEpXG4gICAgfVxuICB9KVxuICBmb3JFYWNoKGIsIGZ1bmN0aW9uIChiYikge1xuICAgIGlmIChhLmluZGV4T2YoYmIpID09PSAtMSkge1xuICAgICAgcmV0dXJuIHVuaXF1ZS5wdXNoKGJiKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIHVuaXF1ZVxufVxuXG5mdW5jdGlvbiBjbG9uZShhKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGEsIGZ1bmN0aW9uIHJlcGxhY2VyKGtleSwgdmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfSkpXG59XG5cbmZ1bmN0aW9uIGlzRXF1YWwoeCwgeSkge1xuICBpZiAoKHR5cGVvZiB4ID09PSAnb2JqZWN0JyAmJiB4ICE9PSBudWxsKSAmJiAodHlwZW9mIHkgPT09ICdvYmplY3QnICYmIHkgIT09IG51bGwpKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHgpLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoeSkubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICBmb3IgKHZhciBwcm9wIGluIHgpIHtcbiAgICAgIGlmICh5Lmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgIGlmICghaXNFcXVhbCh4W3Byb3BdLCB5W3Byb3BdKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxuICB9IGVsc2UgaWYgKHggIT09IHkpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiByZXBsYWNlQXJyYXkoYSwgYikge1xuICB2YXIgYWwgPSBhLmxlbmd0aFxuICB2YXIgYmwgPSBiLmxlbmd0aFxuICBpZiAoYWwgPiBibCkge1xuICAgIGEuc3BsaWNlKGJsLCBhbCAtIGJsKVxuICB9IGVsc2UgaWYgKGFsIDwgYmwpIHtcbiAgICBhLnB1c2guYXBwbHkoYSwgbmV3IEFycmF5KGJsIC0gYWwpKVxuICB9XG4gIGZvckVhY2goYSwgZnVuY3Rpb24gKHZhbCwga2V5KSB7XG4gICAgYVtrZXldID0gYltrZXldXG4gIH0pXG4gIHJldHVybiBhXG59XG5cbmZ1bmN0aW9uIHVuaXEoYSkge1xuICB2YXIgc2VlbiA9IG5ldyBTZXQoKVxuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICB2YXIgYWxsb3cgPSBmYWxzZVxuICAgIGlmICghc2Vlbi5oYXMoaXRlbSkpIHtcbiAgICAgIHNlZW4uYWRkKGl0ZW0pXG4gICAgICBhbGxvdyA9IHRydWVcbiAgICB9XG4gICAgcmV0dXJuIGFsbG93XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW4oYWEpIHtcbiAgdmFyIGZsYXR0ZW5lZCA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWEubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY3VycmVudCA9IGFhW2ldXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBjdXJyZW50Lmxlbmd0aDsgKytqKSB7XG4gICAgICBmbGF0dGVuZWQucHVzaChjdXJyZW50W2pdKVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmxhdHRlbmVkXG59XG5cbmZ1bmN0aW9uIHNvcnQoYXJyKSB7XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRtcCA9IGFycltpXVxuICAgIHZhciBqID0gaVxuICAgIHdoaWxlIChhcnJbaiAtIDFdID4gdG1wKSB7XG4gICAgICBhcnJbal0gPSBhcnJbaiAtIDFdO1xuICAgICAgLS1qXG4gICAgfVxuICAgIGFycltqXSA9IHRtcFxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB2YWx1ZXMoYSkge1xuICB2YXIgdmFsdWVzID0gW11cbiAgZm9yICh2YXIga2V5IGluIGEpIHtcbiAgICBpZiAoYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB2YWx1ZXMucHVzaChhW2tleV0pXG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZXNcbn1cblxuZnVuY3Rpb24gcmVjdXJzZU9iamVjdChvYmosIGNiKSB7XG4gIF9yZWN1cnNlT2JqZWN0KG9iaiwgW10pXG4gIHJldHVybiBvYmpcbiAgZnVuY3Rpb24gX3JlY3Vyc2VPYmplY3Qob2JqLCBwYXRoKSB7XG4gICAgZm9yICh2YXIgayBpbiBvYmopIHsgLy8gIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICB2YXIgbmV3UGF0aCA9IGNsb25lKHBhdGgpXG4gICAgICBuZXdQYXRoLnB1c2goaylcbiAgICAgIGlmICh0eXBlb2Ygb2JqW2tdID09PSAnb2JqZWN0JyAmJiBvYmpba10gIT09IG51bGwpIHtcbiAgICAgICAgX3JlY3Vyc2VPYmplY3Qob2JqW2tdLCBuZXdQYXRoKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFvYmouaGFzT3duUHJvcGVydHkoaykpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG4gICAgICAgIGNiKG9ialtrXSwgaywgbmV3UGF0aClcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbnZhciBhZ2dyZWdhdGlvbiA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgvKiBzZXJ2aWNlICovKSB7XG4gIHJldHVybiB7XG4gICAgcG9zdDogcG9zdCxcbiAgICBzb3J0QnlLZXk6IHNvcnRCeUtleSxcbiAgICBsaW1pdDogbGltaXQsXG4gICAgc3F1YXNoOiBzcXVhc2gsXG4gICAgY2hhbmdlOiBjaGFuZ2UsXG4gICAgY2hhbmdlTWFwOiBjaGFuZ2VNYXAsXG4gIH1cblxuICBmdW5jdGlvbiBwb3N0KHF1ZXJ5LCBwYXJlbnQsIGNiKSB7XG4gICAgcXVlcnkuZGF0YSA9IGNsb25lSWZMb2NrZWQocGFyZW50KVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2IocXVlcnksIHBhcmVudCkpXG4gIH1cblxuICBmdW5jdGlvbiBzb3J0QnlLZXkocXVlcnksIHBhcmVudCwgZGVzYykge1xuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBxdWVyeS5kYXRhID0gXy5zb3J0QnkocXVlcnkuZGF0YSwgZnVuY3Rpb24gKGQpIHtcbiAgICAgIHJldHVybiBkLmtleVxuICAgIH0pXG4gICAgaWYgKGRlc2MpIHtcbiAgICAgIHF1ZXJ5LmRhdGEucmV2ZXJzZSgpXG4gICAgfVxuICB9XG5cbiAgLy8gTGltaXQgcmVzdWx0cyB0byBuLCBvciBmcm9tIHN0YXJ0IHRvIGVuZFxuICBmdW5jdGlvbiBsaW1pdChxdWVyeSwgcGFyZW50LCBzdGFydCwgZW5kKSB7XG4gICAgcXVlcnkuZGF0YSA9IGNsb25lSWZMb2NrZWQocGFyZW50KVxuICAgIGlmIChfLmlzVW5kZWZpbmVkKGVuZCkpIHtcbiAgICAgIGVuZCA9IHN0YXJ0IHx8IDBcbiAgICAgIHN0YXJ0ID0gMFxuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IHN0YXJ0IHx8IDBcbiAgICAgIGVuZCA9IGVuZCB8fCBxdWVyeS5kYXRhLmxlbmd0aFxuICAgIH1cbiAgICBxdWVyeS5kYXRhID0gcXVlcnkuZGF0YS5zcGxpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0KVxuICB9XG5cbiAgLy8gU3F1YXNoIHJlc3VsdHMgdG8gbiwgb3IgZnJvbSBzdGFydCB0byBlbmRcbiAgZnVuY3Rpb24gc3F1YXNoKHF1ZXJ5LCBwYXJlbnQsIHN0YXJ0LCBlbmQsIGFnZ09iaiwgbGFiZWwpIHtcbiAgICBxdWVyeS5kYXRhID0gY2xvbmVJZkxvY2tlZChwYXJlbnQpXG4gICAgc3RhcnQgPSBzdGFydCB8fCAwXG4gICAgZW5kID0gZW5kIHx8IHF1ZXJ5LmRhdGEubGVuZ3RoXG4gICAgdmFyIHRvU3F1YXNoID0gcXVlcnkuZGF0YS5zcGxpY2Uoc3RhcnQsIGVuZCAtIHN0YXJ0KVxuICAgIHZhciBzcXVhc2hlZCA9IHtcbiAgICAgIGtleTogbGFiZWwgfHwgJ090aGVyJyxcbiAgICAgIHZhbHVlOiB7fVxuICAgIH1cbiAgICBfLnJlY3Vyc2VPYmplY3QoYWdnT2JqLCBmdW5jdGlvbiAodmFsLCBrZXksIHBhdGgpIHtcbiAgICAgIHZhciBpdGVtcyA9IFtdXG4gICAgICBfLmZvckVhY2godG9TcXVhc2gsIGZ1bmN0aW9uIChyZWNvcmQpIHtcbiAgICAgICAgaXRlbXMucHVzaChfLmdldChyZWNvcmQudmFsdWUsIHBhdGgpKVxuICAgICAgfSlcbiAgICAgIF8uc2V0KHNxdWFzaGVkLnZhbHVlLCBwYXRoLCBhZ2dyZWdhdGlvbi5hZ2dyZWdhdG9yc1t2YWxdKGl0ZW1zKSlcbiAgICB9KVxuICAgIHF1ZXJ5LmRhdGEuc3BsaWNlKHN0YXJ0LCAwLCBzcXVhc2hlZClcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZShxdWVyeSwgcGFyZW50LCBzdGFydCwgZW5kLCBhZ2dPYmopIHtcbiAgICBxdWVyeS5kYXRhID0gY2xvbmVJZkxvY2tlZChwYXJlbnQpXG4gICAgc3RhcnQgPSBzdGFydCB8fCAwXG4gICAgZW5kID0gZW5kIHx8IHF1ZXJ5LmRhdGEubGVuZ3RoXG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGtleTogW3F1ZXJ5LmRhdGFbc3RhcnRdLmtleSwgcXVlcnkuZGF0YVtlbmRdLmtleV0sXG4gICAgICB2YWx1ZToge31cbiAgICB9XG4gICAgXy5yZWN1cnNlT2JqZWN0KGFnZ09iaiwgZnVuY3Rpb24gKHZhbCwga2V5LCBwYXRoKSB7XG4gICAgICB2YXIgY2hhbmdlUGF0aCA9IF8uY2xvbmUocGF0aClcbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIF8uc2V0KG9iai52YWx1ZSwgY2hhbmdlUGF0aCwgXy5nZXQocXVlcnkuZGF0YVtlbmRdLnZhbHVlLCBwYXRoKSAtIF8uZ2V0KHF1ZXJ5LmRhdGFbc3RhcnRdLnZhbHVlLCBwYXRoKSlcbiAgICB9KVxuICAgIHF1ZXJ5LmRhdGEgPSBvYmpcbiAgfVxuXG4gIGZ1bmN0aW9uIGNoYW5nZU1hcChxdWVyeSwgcGFyZW50LCBhZ2dPYmosIGRlZmF1bHROdWxsKSB7XG4gICAgZGVmYXVsdE51bGwgPSBfLmlzVW5kZWZpbmVkKGRlZmF1bHROdWxsKSA/IDAgOiBkZWZhdWx0TnVsbFxuICAgIHF1ZXJ5LmRhdGEgPSBjbG9uZUlmTG9ja2VkKHBhcmVudClcbiAgICBfLnJlY3Vyc2VPYmplY3QoYWdnT2JqLCBmdW5jdGlvbiAodmFsLCBrZXksIHBhdGgpIHtcbiAgICAgIHZhciBjaGFuZ2VQYXRoID0gXy5jbG9uZShwYXRoKVxuICAgICAgdmFyIGZyb21TdGFydFBhdGggPSBfLmNsb25lKHBhdGgpXG4gICAgICB2YXIgZnJvbUVuZFBhdGggPSBfLmNsb25lKHBhdGgpXG5cbiAgICAgIGNoYW5nZVBhdGgucG9wKClcbiAgICAgIGZyb21TdGFydFBhdGgucG9wKClcbiAgICAgIGZyb21FbmRQYXRoLnBvcCgpXG5cbiAgICAgIGNoYW5nZVBhdGgucHVzaChrZXkgKyAnQ2hhbmdlJylcbiAgICAgIGZyb21TdGFydFBhdGgucHVzaChrZXkgKyAnQ2hhbmdlRnJvbVN0YXJ0JylcbiAgICAgIGZyb21FbmRQYXRoLnB1c2goa2V5ICsgJ0NoYW5nZUZyb21FbmQnKVxuXG4gICAgICB2YXIgc3RhcnQgPSBfLmdldChxdWVyeS5kYXRhWzBdLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbClcbiAgICAgIHZhciBlbmQgPSBfLmdldChxdWVyeS5kYXRhW3F1ZXJ5LmRhdGEubGVuZ3RoIC0gMV0udmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKVxuXG4gICAgICBfLmZvckVhY2gocXVlcnkuZGF0YSwgZnVuY3Rpb24gKHJlY29yZCwgaSkge1xuICAgICAgICB2YXIgcHJldmlvdXMgPSBxdWVyeS5kYXRhW2kgLSAxXSB8fCBxdWVyeS5kYXRhWzBdXG4gICAgICAgIF8uc2V0KHF1ZXJ5LmRhdGFbaV0udmFsdWUsIGNoYW5nZVBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gKHByZXZpb3VzID8gXy5nZXQocHJldmlvdXMudmFsdWUsIHBhdGgsIGRlZmF1bHROdWxsKSA6IGRlZmF1bHROdWxsKSlcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbVN0YXJ0UGF0aCwgXy5nZXQocmVjb3JkLnZhbHVlLCBwYXRoLCBkZWZhdWx0TnVsbCkgLSBzdGFydClcbiAgICAgICAgXy5zZXQocXVlcnkuZGF0YVtpXS52YWx1ZSwgZnJvbUVuZFBhdGgsIF8uZ2V0KHJlY29yZC52YWx1ZSwgcGF0aCwgZGVmYXVsdE51bGwpIC0gZW5kKVxuICAgICAgfSlcbiAgICB9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGNsb25lSWZMb2NrZWQocGFyZW50KSB7XG4gIHJldHVybiBwYXJlbnQubG9ja2VkID8gXy5jbG9uZShwYXJlbnQuZGF0YSkgOiBwYXJlbnQuZGF0YVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxuUHJvbWlzZS5zZXJpYWwgPSBzZXJpYWxcblxudmFyIGlzUHJvbWlzZUxpa2UgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBvYmogJiYgXy5pc0Z1bmN0aW9uKG9iai50aGVuKVxufVxuXG5mdW5jdGlvbiBzZXJpYWwodGFza3MpIHtcbiAgLy8gRmFrZSBhIFwicHJldmlvdXMgdGFza1wiIGZvciBvdXIgaW5pdGlhbCBpdGVyYXRpb25cbiAgdmFyIHByZXZQcm9taXNlXG4gIHZhciBlcnJvciA9IG5ldyBFcnJvcigpXG4gIF8uZm9yRWFjaCh0YXNrcywgZnVuY3Rpb24gKHRhc2ssIGtleSkge1xuICAgIHZhciBzdWNjZXNzID0gdGFzay5zdWNjZXNzIHx8IHRhc2tcbiAgICB2YXIgZmFpbCA9IHRhc2suZmFpbFxuICAgIHZhciBub3RpZnkgPSB0YXNrLm5vdGlmeVxuICAgIHZhciBuZXh0UHJvbWlzZVxuXG4gICAgLy8gRmlyc3QgdGFza1xuICAgIGlmICghcHJldlByb21pc2UpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZWdhdGVkLWNvbmRpdGlvblxuICAgICAgbmV4dFByb21pc2UgPSBzdWNjZXNzKClcbiAgICAgIGlmICghaXNQcm9taXNlTGlrZShuZXh0UHJvbWlzZSkpIHtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9ICdUYXNrICcgKyBrZXkgKyAnIGRpZCBub3QgcmV0dXJuIGEgcHJvbWlzZS4nXG4gICAgICAgIHRocm93IGVycm9yXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdhaXQgdW50aWwgdGhlIHByZXZpb3VzIHByb21pc2UgaGFzIHJlc29sdmVkIG9yIHJlamVjdGVkIHRvIGV4ZWN1dGUgdGhlIG5leHQgdGFza1xuICAgICAgbmV4dFByb21pc2UgPSBwcmV2UHJvbWlzZS50aGVuKFxuICAgICAgICAvKiBzdWNjZXNzICovXG4gICAgICAgIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmV0ID0gc3VjY2VzcyhkYXRhKVxuICAgICAgICAgIGlmICghaXNQcm9taXNlTGlrZShyZXQpKSB7XG4gICAgICAgICAgICBlcnJvci5tZXNzYWdlID0gJ1Rhc2sgJyArIGtleSArICcgZGlkIG5vdCByZXR1cm4gYSBwcm9taXNlLidcbiAgICAgICAgICAgIHRocm93IGVycm9yXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXRcbiAgICAgICAgfSxcbiAgICAgICAgLyogZmFpbHVyZSAqL1xuICAgICAgICBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgICAgaWYgKCFmYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QocmVhc29uKVxuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgcmV0ID0gZmFpbChyZWFzb24pXG4gICAgICAgICAgaWYgKCFpc1Byb21pc2VMaWtlKHJldCkpIHtcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgPSAnRmFpbCBmb3IgdGFzayAnICsga2V5ICsgJyBkaWQgbm90IHJldHVybiBhIHByb21pc2UuJ1xuICAgICAgICAgICAgdGhyb3cgZXJyb3JcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldFxuICAgICAgICB9LFxuICAgICAgICBub3RpZnkpXG4gICAgfVxuICAgIHByZXZQcm9taXNlID0gbmV4dFByb21pc2VcbiAgfSlcblxuICByZXR1cm4gcHJldlByb21pc2UgfHwgUHJvbWlzZS53aGVuKClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgdmFyIHJlZHVjdGlvZnkgPSByZXF1aXJlKCcuL3JlZHVjdGlvZnknKShzZXJ2aWNlKVxuICB2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpXG4gIHZhciBwb3N0QWdncmVnYXRpb24gPSByZXF1aXJlKCcuL3Bvc3RBZ2dyZWdhdGlvbicpKHNlcnZpY2UpXG5cbiAgdmFyIHBvc3RBZ2dyZWdhdGlvbk1ldGhvZHMgPSBfLmtleXMocG9zdEFnZ3JlZ2F0aW9uKVxuXG4gIHJldHVybiBmdW5jdGlvbiBkb1F1ZXJ5KHF1ZXJ5T2JqKSB7XG4gICAgdmFyIHF1ZXJ5SGFzaCA9IEpTT04uc3RyaW5naWZ5KHF1ZXJ5T2JqKVxuXG4gICAgLy8gQXR0ZW1wdCB0byByZXVzZSBhbiBleGFjdCBjb3B5IG9mIHRoaXMgcXVlcnkgdGhhdCBpcyBwcmVzZW50IGVsc2V3aGVyZVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VydmljZS5jb2x1bW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHNlcnZpY2UuY29sdW1uc1tpXS5xdWVyaWVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChzZXJ2aWNlLmNvbHVtbnNbaV0ucXVlcmllc1tqXS5oYXNoID09PSBxdWVyeUhhc2gpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvb3AtZnVuY1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uc1tpXS5xdWVyaWVzW2pdXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBxdWVyeSA9IHtcbiAgICAgIC8vIE9yaWdpbmFsIHF1ZXJ5IHBhc3NlZCBpbiB0byBxdWVyeSBtZXRob2RcbiAgICAgIG9yaWdpbmFsOiBxdWVyeU9iaixcbiAgICAgIGhhc2g6IHF1ZXJ5SGFzaFxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgcXVlcnlPYmpcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbCkpIHtcbiAgICAgIHF1ZXJ5Lm9yaWdpbmFsID0ge31cbiAgICB9XG4gICAgLy8gRGVmYXVsdCBzZWxlY3RcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChxdWVyeS5vcmlnaW5hbC5zZWxlY3QpKSB7XG4gICAgICBxdWVyeS5vcmlnaW5hbC5zZWxlY3QgPSB7XG4gICAgICAgICRjb3VudDogdHJ1ZVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBEZWZhdWx0IHRvIGdyb3VwQWxsXG4gICAgcXVlcnkub3JpZ2luYWwuZ3JvdXBCeSA9IHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkgfHwgdHJ1ZVxuXG4gICAgLy8gQXR0YWNoIHRoZSBxdWVyeSBhcGkgdG8gdGhlIHF1ZXJ5IG9iamVjdFxuICAgIHF1ZXJ5ID0gbmV3UXVlcnlPYmoocXVlcnkpXG5cbiAgICByZXR1cm4gY3JlYXRlQ29sdW1uKHF1ZXJ5KVxuICAgICAgLnRoZW4obWFrZUNyb3NzZmlsdGVyR3JvdXApXG4gICAgICAudGhlbihidWlsZFJlcXVpcmVkQ29sdW1ucylcbiAgICAgIC50aGVuKHNldHVwRGF0YUxpc3RlbmVycylcbiAgICAgIC50aGVuKGFwcGx5UXVlcnkpXG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb2x1bW4ocXVlcnkpIHtcbiAgICAgIC8vIEVuc3VyZSBjb2x1bW4gaXMgY3JlYXRlZFxuICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAga2V5OiBxdWVyeS5vcmlnaW5hbC5ncm91cEJ5LFxuICAgICAgICB0eXBlOiBfLmlzVW5kZWZpbmVkKHF1ZXJ5LnR5cGUpID8gbnVsbCA6IHF1ZXJ5LnR5cGUsXG4gICAgICAgIGFycmF5OiBCb29sZWFuKHF1ZXJ5LmFycmF5KVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gQXR0YWNoIHRoZSBjb2x1bW4gdG8gdGhlIHF1ZXJ5XG4gICAgICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKHF1ZXJ5Lm9yaWdpbmFsLmdyb3VwQnkpXG4gICAgICAgIHF1ZXJ5LmNvbHVtbiA9IGNvbHVtblxuICAgICAgICBjb2x1bW4ucXVlcmllcy5wdXNoKHF1ZXJ5KVxuICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeS5jbGVhcigpXG4gICAgICAgIH0pXG4gICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlQ3Jvc3NmaWx0ZXJHcm91cChxdWVyeSkge1xuICAgICAgLy8gQ3JlYXRlIHRoZSBncm91cGluZyBvbiB0aGUgY29sdW1ucyBkaW1lbnNpb25cbiAgICAgIC8vIFVzaW5nIFByb21pc2UgUmVzb2x2ZSBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgIC8vIFRPRE8gY2hlY2sgaWYgcXVlcnkgYWxyZWFkeSBleGlzdHMsIGFuZCB1c2UgdGhlIHNhbWUgYmFzZSBxdWVyeSAvLyBpZiBwb3NzaWJsZVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeS5jb2x1bW4uZGltZW5zaW9uLmdyb3VwKCkpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChnKSB7XG4gICAgICAgICAgcXVlcnkuZ3JvdXAgPSBnXG4gICAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRSZXF1aXJlZENvbHVtbnMocXVlcnkpIHtcbiAgICAgIHZhciByZXF1aXJlZENvbHVtbnMgPSBmaWx0ZXJzLnNjYW5Gb3JEeW5hbWljRmlsdGVycyhxdWVyeS5vcmlnaW5hbClcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FuIHRoZSBncm91cCBmb3IgYW55IGZpbHRlcnMgdGhhdCB3b3VsZCByZXF1aXJlXG4gICAgICAgIC8vIHRoZSBncm91cCB0byBiZSByZWJ1aWx0IHdoZW4gZGF0YSBpcyBhZGRlZCBvciByZW1vdmVkIGluIGFueSB3YXkuXG4gICAgICBpZiAocmVxdWlyZWRDb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAocmVxdWlyZWRDb2x1bW5zLCBmdW5jdGlvbiAoY29sdW1uS2V5KSB7XG4gICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAgICAgIGtleTogY29sdW1uS2V5LFxuICAgICAgICAgICAgZHluYW1pY1JlZmVyZW5jZTogcXVlcnkuZ3JvdXBcbiAgICAgICAgICB9KVxuICAgICAgICB9KSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgICAgfVxuICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2V0dXBEYXRhTGlzdGVuZXJzKHF1ZXJ5KSB7XG4gICAgICAvLyBIZXJlLCB3ZSBjcmVhdGUgYSBsaXN0ZW5lciB0byByZWNyZWF0ZSBhbmQgYXBwbHkgdGhlIHJlZHVjZXIgdG9cbiAgICAgIC8vIHRoZSBncm91cCBhbnl0aW1lIHVuZGVybHlpbmcgZGF0YSBjaGFuZ2VzXG4gICAgICB2YXIgc3RvcERhdGFMaXN0ZW4gPSBzZXJ2aWNlLm9uRGF0YUNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBhcHBseVF1ZXJ5KHF1ZXJ5KVxuICAgICAgfSlcbiAgICAgIHF1ZXJ5LnJlbW92ZUxpc3RlbmVycy5wdXNoKHN0b3BEYXRhTGlzdGVuKVxuXG4gICAgICAvLyBUaGlzIGlzIGEgc2ltaWxhciBsaXN0ZW5lciBmb3IgZmlsdGVyaW5nIHdoaWNoIHdpbGwgKGlmIG5lZWRlZClcbiAgICAgIC8vIHJ1biBhbnkgcG9zdCBhZ2dyZWdhdGlvbnMgb24gdGhlIGRhdGEgYWZ0ZXIgZWFjaCBmaWx0ZXIgYWN0aW9uXG4gICAgICB2YXIgc3RvcEZpbHRlckxpc3RlbiA9IHNlcnZpY2Uub25GaWx0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gcG9zdEFnZ3JlZ2F0ZShxdWVyeSlcbiAgICAgIH0pXG4gICAgICBxdWVyeS5yZW1vdmVMaXN0ZW5lcnMucHVzaChzdG9wRmlsdGVyTGlzdGVuKVxuXG4gICAgICByZXR1cm4gcXVlcnlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhcHBseVF1ZXJ5KHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gYnVpbGRSZWR1Y2VyKHF1ZXJ5KVxuICAgICAgICAudGhlbihhcHBseVJlZHVjZXIpXG4gICAgICAgIC50aGVuKGF0dGFjaERhdGEpXG4gICAgICAgIC50aGVuKHBvc3RBZ2dyZWdhdGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRSZWR1Y2VyKHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gcmVkdWN0aW9meShxdWVyeS5vcmlnaW5hbClcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlZHVjZXIpIHtcbiAgICAgICAgICBxdWVyeS5yZWR1Y2VyID0gcmVkdWNlclxuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFwcGx5UmVkdWNlcihxdWVyeSkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeS5yZWR1Y2VyKHF1ZXJ5Lmdyb3VwKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxdWVyeVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGF0dGFjaERhdGEocXVlcnkpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocXVlcnkuZ3JvdXAuYWxsKCkpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgcXVlcnkuZGF0YSA9IGRhdGFcbiAgICAgICAgICByZXR1cm4gcXVlcnlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlKHF1ZXJ5KSB7XG4gICAgICBpZiAocXVlcnkucG9zdEFnZ3JlZ2F0aW9ucy5sZW5ndGggPiAxKSB7XG4gICAgICAgIC8vIElmIHRoZSBxdWVyeSBpcyB1c2VkIGJ5IDIrIHBvc3QgYWdncmVnYXRpb25zLCB3ZSBuZWVkIHRvIGxvY2tcbiAgICAgICAgLy8gaXQgYWdhaW5zdCBnZXR0aW5nIG11dGF0ZWQgYnkgdGhlIHBvc3QtYWdncmVnYXRpb25zXG4gICAgICAgIHF1ZXJ5LmxvY2tlZCA9IHRydWVcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChxdWVyeS5wb3N0QWdncmVnYXRpb25zLCBmdW5jdGlvbiAocG9zdCkge1xuICAgICAgICByZXR1cm4gcG9zdCgpXG4gICAgICB9KSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHF1ZXJ5XG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5ld1F1ZXJ5T2JqKHEsIHBhcmVudCkge1xuICAgICAgdmFyIGxvY2tlZCA9IGZhbHNlXG4gICAgICBpZiAoIXBhcmVudCkge1xuICAgICAgICBwYXJlbnQgPSBxXG4gICAgICAgIHEgPSB7fVxuICAgICAgICBsb2NrZWQgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIC8vIEFzc2lnbiB0aGUgcmVndWxhciBxdWVyeSBwcm9wZXJ0aWVzXG4gICAgICBfLmFzc2lnbihxLCB7XG4gICAgICAgIC8vIFRoZSBVbml2ZXJzZSBmb3IgY29udGludW91cyBwcm9taXNlIGNoYWluaW5nXG4gICAgICAgIHVuaXZlcnNlOiBzZXJ2aWNlLFxuICAgICAgICAvLyBDcm9zc2ZpbHRlciBpbnN0YW5jZVxuICAgICAgICBjcm9zc2ZpbHRlcjogc2VydmljZS5jZixcblxuICAgICAgICAvLyBwYXJlbnQgSW5mb3JtYXRpb25cbiAgICAgICAgcGFyZW50OiBwYXJlbnQsXG4gICAgICAgIGNvbHVtbjogcGFyZW50LmNvbHVtbixcbiAgICAgICAgZGltZW5zaW9uOiBwYXJlbnQuZGltZW5zaW9uLFxuICAgICAgICBncm91cDogcGFyZW50Lmdyb3VwLFxuICAgICAgICByZWR1Y2VyOiBwYXJlbnQucmVkdWNlcixcbiAgICAgICAgb3JpZ2luYWw6IHBhcmVudC5vcmlnaW5hbCxcbiAgICAgICAgaGFzaDogcGFyZW50Lmhhc2gsXG5cbiAgICAgICAgLy8gSXQncyBvd24gcmVtb3ZlTGlzdGVuZXJzXG4gICAgICAgIHJlbW92ZUxpc3RlbmVyczogW10sXG5cbiAgICAgICAgLy8gSXQncyBvd24gcG9zdEFnZ3JlZ2F0aW9uc1xuICAgICAgICBwb3N0QWdncmVnYXRpb25zOiBbXSxcblxuICAgICAgICAvLyBEYXRhIG1ldGhvZFxuICAgICAgICBsb2NrZWQ6IGxvY2tlZCxcbiAgICAgICAgbG9jazogbG9jayxcbiAgICAgICAgdW5sb2NrOiB1bmxvY2ssXG4gICAgICAgIC8vIERpc3Bvc2FsIG1ldGhvZFxuICAgICAgICBjbGVhcjogY2xlYXJRdWVyeSxcbiAgICAgIH0pXG5cbiAgICAgIF8uZm9yRWFjaChwb3N0QWdncmVnYXRpb25NZXRob2RzLCBmdW5jdGlvbiAobWV0aG9kKSB7XG4gICAgICAgIHFbbWV0aG9kXSA9IHBvc3RBZ2dyZWdhdGVNZXRob2RXcmFwKHBvc3RBZ2dyZWdhdGlvblttZXRob2RdKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHFcblxuICAgICAgZnVuY3Rpb24gbG9jayhzZXQpIHtcbiAgICAgICAgaWYgKCFfLmlzVW5kZWZpbmVkKHNldCkpIHtcbiAgICAgICAgICBxLmxvY2tlZCA9IEJvb2xlYW4oc2V0KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHEubG9ja2VkID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiB1bmxvY2soKSB7XG4gICAgICAgIHEubG9ja2VkID0gZmFsc2VcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY2xlYXJRdWVyeSgpIHtcbiAgICAgICAgXy5mb3JFYWNoKHEucmVtb3ZlTGlzdGVuZXJzLCBmdW5jdGlvbiAobCkge1xuICAgICAgICAgIGwoKVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHJldHVybiBxLmdyb3VwLmRpc3Bvc2UoKVxuICAgICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcS5jb2x1bW4ucXVlcmllcy5zcGxpY2UocS5jb2x1bW4ucXVlcmllcy5pbmRleE9mKHEpLCAxKVxuICAgICAgICAgIC8vIEF1dG9tYXRpY2FsbHkgcmVjeWNsZSB0aGUgY29sdW1uIGlmIHRoZXJlIGFyZSBubyBxdWVyaWVzIGFjdGl2ZSBvbiBpdFxuICAgICAgICAgIGlmICghcS5jb2x1bW4ucXVlcmllcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNsZWFyKHEuY29sdW1uLmtleSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlTWV0aG9kV3JhcChwb3N0TWV0aG9kKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAgICAgdmFyIHN1YiA9IHt9XG4gICAgICAgICAgbmV3UXVlcnlPYmooc3ViLCBxKVxuICAgICAgICAgIGFyZ3MudW5zaGlmdChzdWIsIHEpXG5cbiAgICAgICAgICBxLnBvc3RBZ2dyZWdhdGlvbnMucHVzaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBQcm9taXNlLnJlc29sdmUocG9zdE1ldGhvZC5hcHBseShudWxsLCBhcmdzKSlcbiAgICAgICAgICAgICAgLnRoZW4ocG9zdEFnZ3JlZ2F0ZUNoaWxkcmVuKVxuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHBvc3RNZXRob2QuYXBwbHkobnVsbCwgYXJncykpXG4gICAgICAgICAgICAudGhlbihwb3N0QWdncmVnYXRlQ2hpbGRyZW4pXG5cbiAgICAgICAgICBmdW5jdGlvbiBwb3N0QWdncmVnYXRlQ2hpbGRyZW4oKSB7XG4gICAgICAgICAgICByZXR1cm4gcG9zdEFnZ3JlZ2F0ZShzdWIpXG4gICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3ViXG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLy8gdmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpIC8vIF8gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2hvcnRoYW5kTGFiZWxzOiB7XG4gICAgJGNvdW50OiAnY291bnQnLFxuICAgICRzdW06ICdzdW0nLFxuICAgICRhdmc6ICdhdmcnLFxuICAgICRtaW46ICdtaW4nLFxuICAgICRtYXg6ICdtYXgnLFxuICAgICRtZWQ6ICdtZWQnLFxuICAgICRzdW1TcTogJ3N1bVNxJyxcbiAgICAkc3RkOiAnc3RkJyxcbiAgfSxcbiAgYWdncmVnYXRvcnM6IHtcbiAgICAkY291bnQ6ICRjb3VudCxcbiAgICAkc3VtOiAkc3VtLFxuICAgICRhdmc6ICRhdmcsXG4gICAgJG1pbjogJG1pbixcbiAgICAkbWF4OiAkbWF4LFxuICAgICRtZWQ6ICRtZWQsXG4gICAgJHN1bVNxOiAkc3VtU3EsXG4gICAgJHN0ZDogJHN0ZCxcbiAgICAkdmFsdWVMaXN0OiAkdmFsdWVMaXN0LFxuICAgICRkYXRhTGlzdDogJGRhdGFMaXN0LFxuICB9XG59XG5cbi8vIEFnZ3JlZ2F0b3JzXG5cbmZ1bmN0aW9uICRjb3VudChyZWR1Y2VyLyogLCB2YWx1ZSAqLykge1xuICByZXR1cm4gcmVkdWNlci5jb3VudCh0cnVlKVxufVxuXG5mdW5jdGlvbiAkc3VtKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLnN1bSh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJGF2ZyhyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5hdmcodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRtaW4ocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIubWluKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkbWF4KHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLm1heCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJG1lZChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5tZWRpYW4odmFsdWUpXG59XG5cbmZ1bmN0aW9uICRzdW1TcShyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdW1PZlNxKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkc3RkKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLnN0ZCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJHZhbHVlTGlzdChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci52YWx1ZUxpc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRkYXRhTGlzdChyZWR1Y2VyLyogLCB2YWx1ZSAqLykge1xuICByZXR1cm4gcmVkdWNlci5kYXRhTGlzdCh0cnVlKVxufVxuXG4vLyBUT0RPIGhpc3RvZ3JhbXNcbi8vIFRPRE8gZXhjZXB0aW9uc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciByZWR1Y3RpbyA9IHJlcXVpcmUoJ3JlZHVjdGlvJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG52YXIgckFnZ3JlZ2F0b3JzID0gcmVxdWlyZSgnLi9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzJylcbi8vIHZhciBleHByZXNzaW9ucyA9IHJlcXVpcmUoJy4vZXhwcmVzc2lvbnMnKSAgLy8gZXhwb3Jlc3Npb24gaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxudmFyIGFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHNlcnZpY2UpIHtcbiAgdmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuL2ZpbHRlcnMnKShzZXJ2aWNlKVxuXG4gIHJldHVybiBmdW5jdGlvbiByZWR1Y3Rpb2Z5KHF1ZXJ5KSB7XG4gICAgdmFyIHJlZHVjZXIgPSByZWR1Y3RpbygpXG4gICAgLy8gdmFyIGdyb3VwQnkgPSBxdWVyeS5ncm91cEJ5IC8vIGdyb3VwQnkgaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxuICAgIGFnZ3JlZ2F0ZU9yTmVzdChyZWR1Y2VyLCBxdWVyeS5zZWxlY3QpXG5cbiAgICBpZiAocXVlcnkuZmlsdGVyKSB7XG4gICAgICB2YXIgZmlsdGVyRnVuY3Rpb24gPSBmaWx0ZXJzLm1ha2VGdW5jdGlvbihxdWVyeS5maWx0ZXIpXG4gICAgICBpZiAoZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgcmVkdWNlci5maWx0ZXIoZmlsdGVyRnVuY3Rpb24pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWR1Y2VyKVxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZWN1cnNpdmVseSBmaW5kIHRoZSBmaXJzdCBsZXZlbCBvZiByZWR1Y3RpbyBtZXRob2RzIGluXG4gICAgLy8gZWFjaCBvYmplY3QgYW5kIGFkZHMgdGhhdCByZWR1Y3Rpb24gbWV0aG9kIHRvIHJlZHVjdGlvXG4gICAgZnVuY3Rpb24gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIsIHNlbGVjdHMpIHtcbiAgICAgIC8vIFNvcnQgc28gbmVzdGVkIHZhbHVlcyBhcmUgY2FsY3VsYXRlZCBsYXN0IGJ5IHJlZHVjdGlvJ3MgLnZhbHVlIG1ldGhvZFxuICAgICAgdmFyIHNvcnRlZFNlbGVjdEtleVZhbHVlID0gXy5zb3J0QnkoXG4gICAgICAgIF8ubWFwKHNlbGVjdHMsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWxcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBmdW5jdGlvbiAocykge1xuICAgICAgICAgIGlmIChyQWdncmVnYXRvcnMuYWdncmVnYXRvcnNbcy5rZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gMVxuICAgICAgICB9KVxuXG4gICAgICAvLyBkaXZlIGludG8gZWFjaCBrZXkvdmFsdWVcbiAgICAgIHJldHVybiBfLmZvckVhY2goc29ydGVkU2VsZWN0S2V5VmFsdWUsIGZ1bmN0aW9uIChzKSB7XG4gICAgICAgIC8vIEZvdW5kIGEgUmVkdWN0aW8gQWdncmVnYXRpb25cbiAgICAgICAgaWYgKHJBZ2dyZWdhdG9ycy5hZ2dyZWdhdG9yc1tzLmtleV0pIHtcbiAgICAgICAgICAvLyBCdWlsZCB0aGUgdmFsdWVBY2Nlc3NvckZ1bmN0aW9uXG4gICAgICAgICAgdmFyIGFjY2Vzc29yID0gYWdncmVnYXRpb24ubWFrZVZhbHVlQWNjZXNzb3Iocy52YWx1ZSlcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVkdWNlciB3aXRoIHRoZSBWYWx1ZUFjY2Vzc29yRnVuY3Rpb24gdG8gdGhlIHJlZHVjZXJcbiAgICAgICAgICByZWR1Y2VyID0gckFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XShyZWR1Y2VyLCBhY2Nlc3NvcilcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvdW5kIGEgdG9wIGxldmVsIGtleSB2YWx1ZSB0aGF0IGlzIG5vdCBhbiBhZ2dyZWdhdGlvbiBvciBhXG4gICAgICAgIC8vIG5lc3RlZCBvYmplY3QuIFRoaXMgaXMgdW5hY2NlcHRhYmxlLlxuICAgICAgICBpZiAoIV8uaXNPYmplY3Qocy52YWx1ZSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdOZXN0ZWQgc2VsZWN0cyBtdXN0IGJlIGFuIG9iamVjdCcsIHMua2V5KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQncyBhbm90aGVyIG5lc3RlZCBvYmplY3QsIHNvIGp1c3QgcmVwZWF0IHRoaXMgcHJvY2VzcyBvbiBpdFxuICAgICAgICByZWR1Y2VyID0gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIudmFsdWUocy5rZXkpLCBzLnZhbHVlKVxuICAgICAgfSlcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5yZXF1aXJlKCcuL3Euc2VyaWFsJylcblxuLy8gdmFyIFByb21pc2UgPSByZXF1aXJlKCdxJykgIC8vIFByb21pc2UgaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZFxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdW5pdmVyc2VcblxuZnVuY3Rpb24gdW5pdmVyc2UoZGF0YSwgb3B0aW9ucykge1xuICB2YXIgc2VydmljZSA9IHtcbiAgICBvcHRpb25zOiBfLmFzc2lnbih7fSwgb3B0aW9ucyksXG4gICAgY29sdW1uczogW10sXG4gICAgZmlsdGVyczoge30sXG4gICAgZGF0YUxpc3RlbmVyczogW10sXG4gICAgZmlsdGVyTGlzdGVuZXJzOiBbXSxcbiAgfVxuXG4gIHZhciBjZiA9IHJlcXVpcmUoJy4vY3Jvc3NmaWx0ZXInKShzZXJ2aWNlKVxuICB2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpXG5cbiAgZGF0YSA9IGNmLmdlbmVyYXRlQ29sdW1ucyhkYXRhKVxuXG4gIHJldHVybiBjZi5idWlsZChkYXRhKVxuICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBzZXJ2aWNlLmNmID0gZGF0YVxuICAgICAgcmV0dXJuIF8uYXNzaWduKHNlcnZpY2UsIHtcbiAgICAgICAgYWRkOiBjZi5hZGQsXG4gICAgICAgIHJlbW92ZTogY2YucmVtb3ZlLFxuICAgICAgICBjb2x1bW46IHJlcXVpcmUoJy4vY29sdW1uJykoc2VydmljZSksXG4gICAgICAgIHF1ZXJ5OiByZXF1aXJlKCcuL3F1ZXJ5Jykoc2VydmljZSksXG4gICAgICAgIGZpbHRlcjogZmlsdGVycy5maWx0ZXIsXG4gICAgICAgIGZpbHRlckFsbDogZmlsdGVycy5maWx0ZXJBbGwsXG4gICAgICAgIGNsZWFyOiByZXF1aXJlKCcuL2NsZWFyJykoc2VydmljZSksXG4gICAgICAgIGRlc3Ryb3k6IHJlcXVpcmUoJy4vZGVzdHJveScpKHNlcnZpY2UpLFxuICAgICAgICBvbkRhdGFDaGFuZ2U6IG9uRGF0YUNoYW5nZSxcbiAgICAgICAgb25GaWx0ZXI6IG9uRmlsdGVyLFxuICAgICAgfSlcbiAgICB9KVxuXG4gIGZ1bmN0aW9uIG9uRGF0YUNoYW5nZShjYikge1xuICAgIHNlcnZpY2UuZGF0YUxpc3RlbmVycy5wdXNoKGNiKVxuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICBzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMuc3BsaWNlKHNlcnZpY2UuZGF0YUxpc3RlbmVycy5pbmRleE9mKGNiKSwgMSlcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBvbkZpbHRlcihjYikge1xuICAgIHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLnB1c2goY2IpXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHNlcnZpY2UuZmlsdGVyTGlzdGVuZXJzLnNwbGljZShzZXJ2aWNlLmZpbHRlckxpc3RlbmVycy5pbmRleE9mKGNiKSwgMSlcbiAgICB9XG4gIH1cbn1cbiJdfQ==
