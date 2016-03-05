(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.universe = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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

},{}],2:[function(require,module,exports){
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
          for (i = 0; i < groupIndex.length; i++) {
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

},{}],3:[function(require,module,exports){
module.exports = require("./crossfilter").crossfilter;

},{"./crossfilter":2}],4:[function(require,module,exports){
/*
 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 */
/*jshint unused:false */
module.exports = function naturalSort (a, b) {
	"use strict";
	var re = /(^([+\-]?(?:0|[1-9]\d*)(?:\.\d*)?(?:[eE][+\-]?\d+)?)?$|^0x[0-9a-f]+$|\d+)/gi,
		sre = /(^[ ]*|[ ]*$)/g,
		dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
		hre = /^0x[0-9a-f]+$/i,
		ore = /^0/,
		i = function(s) { return naturalSort.insensitive && ('' + s).toLowerCase() || '' + s; },
		// convert all to strings strip whitespace
		x = i(a).replace(sre, '') || '',
		y = i(b).replace(sre, '') || '',
		// chunk/tokenize
		xN = x.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
		yN = y.replace(re, '\0$1\0').replace(/\0$/,'').replace(/^\0/,'').split('\0'),
		// numeric, hex or date detection
		xD = parseInt(x.match(hre), 16) || (xN.length !== 1 && x.match(dre) && Date.parse(x)),
		yD = parseInt(y.match(hre), 16) || xD && y.match(dre) && Date.parse(y) || null,
		oFxNcL, oFyNcL;
	// first try and sort Hex codes or Dates
	if (yD) {
		if ( xD < yD ) { return -1; }
		else if ( xD > yD ) { return 1; }
	}
	// natural sorting through split numeric strings and default strings
	for(var cLoc=0, numS=Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
		// find floats not starting with '0', string or 0 if not defined (Clint Priest)
		oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
		oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
		// handle numeric vs string comparison - number < string - (Kyle Adams)
		if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
		// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
		else if (typeof oFxNcL !== typeof oFyNcL) {
			oFxNcL += '';
			oFyNcL += '';
		}
		if (oFxNcL < oFyNcL) { return -1; }
		if (oFxNcL > oFyNcL) { return 1; }
	}
	return 0;
};

},{}],5:[function(require,module,exports){
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

},{"_process":1}],6:[function(require,module,exports){
(function(exports){
crossfilter.version = "2.0.0-alpha.03";
function crossfilter_identity(d) {
  return d;
}
crossfilter.permute = permute;

function permute(array, index) {
  for (var i = 0, n = index.length, copy = new Array(n); i < n; ++i) {
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
};

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
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      filters, // 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = []; // when data is removed

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
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value) {
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
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        sort = quicksort_by(function(i) { return newValues[i]; }),
        refilter = crossfilter_filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0;

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

      // Permute new values into natural order using a sorted index.
      newValues = newData.map(value);
      newIndex = sort(crossfilter_range(n1), 0, n1);
      newValues = permute(newValues, newIndex);

      // Bisect newValues to determine which new records are selected.
      var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1], i;
      if (refilterFunction) {
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) filters[offset][newIndex[i] + n0] |= one;
        }
      } else {
        for (i = 0; i < lo1; ++i) filters[offset][newIndex[i] + n0] |= one;
        for (i = hi1; i < n1; ++i) filters[offset][newIndex[i] + n0] |= one;
      }

      // If this dimension previously had no data, then we don't need to do the
      // more expensive merge operation; use the new values and index as-is.
      if (!n0) {
        values = newValues;
        index = newIndex;
        lo0 = lo1;
        hi0 = hi1;
        return;
      }

      var oldValues = values,
          oldIndex = index,
          i0 = 0,
          i1 = 0;

      // Otherwise, create new arrays into which to merge new and old.
      values = new Array(n);
      index = crossfilter_index(n, n);

      // Merge the old and new sorted values, and old and new index.
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          index[i] = newIndex[i1++] + n0;
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        index[i] = newIndex[i1] + n0;
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
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; });
        lo0 = lo1;
        hi0 = hi1;
        return dimension;
      }

      var i,
          j,
          k,
          added = [],
          removed = [];

      // Fast incremental update based on previous lo index.
      if (lo1 < lo0) {
        for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
          filters[offset][k = index[i]] ^= one;
          added.push(k);
        }
      } else if (lo1 > lo0) {
        for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
          filters[offset][k = index[i]] ^= one;
          removed.push(k);
        }
      }

      // Fast incremental update based on previous hi index.
      if (hi1 > hi0) {
        for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
          filters[offset][k = index[i]] ^= one;
          added.push(k);
        }
      } else if (hi1 < hi0) {
        for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
          filters[offset][k = index[i]] ^= one;
          removed.push(k);
        }
      }

      lo0 = lo1;
      hi0 = hi1;
      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
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

      filterIndexFunction(refilterFunction = f);

      lo0 = 0;
      hi0 = n;

      return dimension;
    }

    function filterIndexFunction(f) {
      var i,
          k,
          x,
          added = [],
          removed = [];

      for (i = 0; i < n; ++i) {
        if (!(filters[offset][k = index[i]] & one) ^ !!(x = f(values[i], i))) {
          if (x) filters[offset][k] &= zero, added.push(k);
          else filters[offset][k] |= one, removed.push(k);
        }
      }
      filterListeners.forEach(function(l) { l(one, offset, added, removed); });
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

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k) {
      var array = [],
          i = lo0,
          j;

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
        var oldGroups = groups,
            reIndex = crossfilter_index(k, groupCapacity),
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
        groupIndex = k0 > 1 ? crossfilter_arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);

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
          while (!(x1 > x)) {
            groupIndex[j = newIndex[i1] + n0] = k;

            // Always add new values to groups. Only remove when not in filter.
            // This gives groups full information on data life-cycle.
            g.value = add(g.value, data[j], true);
            if (!filters.zeroExcept(j, offset, zero)) g.value = remove(g.value, data[j], false);
            if (++i1 >= n1) break;
            x1 = key(newValues[i1]);
          }

          groupIncrement();
        }

        // Add any remaining old groups that were greater than all new keys.
        // No incremental reduce is needed; these groups have no new records.
        // Also record the new index of the old group.
        while (i0 < k0) {
          groups[reIndex[i0] = k] = oldGroups[i0++];
          groupIncrement();
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if (k > i0) for (i0 = 0; i0 < n0; ++i0) {
          groupIndex[i0] = reIndex[groupIndex[i0]];
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
            k,
            n,
            g;

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (filters.zeroExcept(k = added[i], offset, zero)) {
            g = groups[groupIndex[k]];
            g.value = reduceAdd(g.value, data[k]);
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
            g.value = reduceAdd(g.value, data[k]);
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
            g;

        // Reset all group values.
        for (i = 0; i < k; ++i) {
          groups[i].value = reduceInitial();
        }

        // We add all records and then remove filtered records so that reducers
        // can build an 'unfiltered' view even if there are already filters in
        // place on other dimensions.
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

},{}],7:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"./crossfilter":6,"dup":3}],8:[function(require,module,exports){
var reductio_parameters = require('./parameters.js');

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

	obj.count = function(value) {
		if (!arguments.length) return p.count;
		p.count = value;
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
			p.count = true;
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
			p.count = true;
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

}

var reductio_accessors = {
	build: accessor_build
};

module.exports = reductio_accessors;

},{"./parameters.js":24}],9:[function(require,module,exports){
var reductio_alias = {
	initial: function(prior, path, obj) {
		return function (p) {
			if(prior) p = prior(p);
			for(var prop in obj) {
				path(p)[prop] = function() { return obj[prop](path(p)); };
			}
			return p;
		};
	}
};

module.exports = reductio_alias;
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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
		f.reduceAdd = reductio_count.add(f.reduceAdd, path);
		f.reduceRemove = reductio_count.remove(f.reduceRemove, path);
		f.reduceInitial = reductio_count.initial(f.reduceInitial, path);
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

},{"./alias.js":9,"./aliasProp.js":10,"./avg.js":11,"./count.js":14,"./data-list.js":15,"./exception-count.js":16,"./exception-sum.js":17,"./filter.js":18,"./histogram.js":19,"./max.js":20,"./median.js":21,"./min.js":22,"./nest.js":23,"./std.js":29,"./sum-of-squares.js":30,"./sum.js":31,"./value-count.js":32,"./value-list.js":33}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
var reductio_count = {
	add: function(prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).count++;
			return p;
		};
	},
	remove: function(prior, path) {
		return function (p, v, nf) {
			if(prior) prior(p, v, nf);
			path(p).count--;
			return p;
		};
	},
	initial: function(prior, path) {
		return function (p) {
			if(prior) p = prior(p);
			// if(p === undefined) p = {};
			path(p).count = 0;
			return p;
		};
	}
};

module.exports = reductio_count;
},{}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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
},{}],18:[function(require,module,exports){
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

},{}],19:[function(require,module,exports){
var crossfilter = require('crossfilter');

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
},{"crossfilter":7}],20:[function(require,module,exports){
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
},{}],21:[function(require,module,exports){
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
},{}],22:[function(require,module,exports){
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
},{}],23:[function(require,module,exports){
var crossfilter = require('crossfilter');

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
},{"crossfilter":7}],24:[function(require,module,exports){
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
		dataList: false
	};
};

module.exports = reductio_parameters;

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
module.exports = function(reductio){
    reductio.postprocessors = {};
    reductio.registerPostProcessor = function(name, func){
        reductio.postprocessors[name] = func;
    };

    reductio.registerPostProcessor('cap', require('./cap'));
    reductio.registerPostProcessor('sortBy', require('./sortBy'));
};

},{"./cap":13,"./sortBy":28}],27:[function(require,module,exports){
var reductio_build = require('./build.js');
var reductio_accessors = require('./accessors.js');
var reductio_parameters = require('./parameters.js');
var reductio_postprocess = require('./postprocess');
var crossfilter = require('crossfilter');

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

},{"./accessors.js":8,"./build.js":12,"./parameters.js":24,"./postprocess":25,"./postprocessors":26,"crossfilter":7}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
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
},{}],30:[function(require,module,exports){
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
},{}],31:[function(require,module,exports){
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
},{}],32:[function(require,module,exports){
var crossfilter = require('crossfilter');

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
},{"crossfilter":7}],33:[function(require,module,exports){
var crossfilter = require('crossfilter');

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
},{"crossfilter":7}],34:[function(require,module,exports){
'use strict'

var _ = require('./lodash')
var naturalSort = require('javascript-natural-sort');

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
  $sort: $sort,
}


module.exports = {
    makeFunction: makeFunction,
    aggregators: aggregators,
    parseAggregatorParams: parseAggregatorParams,
  }
  // This is used to build aggregation stacks for sub-reductio
  // aggregations, or plucking values for use in filters from the data
function makeFunction(obj) {
  var stack = makeSubAggregationFunction(obj).reverse()

  return function(d) {
    return stack.reduce(function(previous, current) {
      return current(previous)
    }, d)
  }
}

// A recursive function that walks the aggregation stack and returns
// a function. The returned function, when called, will recursively invoke
// with the properties from the previous stack in reverse order
function makeSubAggregationFunction(obj) {

  var keyVal = _.isObject(obj) ? extractKeyVal(obj) : obj

  // Detect strings, the end of the line
  if (_.isString(obj)) {
    return function(d) {
      return d[obj]
    }
  }

  // If an array, recurse into each item and return as a map
  if (_.isArray(obj)) {
    var subStack = _.map(obj, makeSubAggregationFunction)
    return function(d) {
      return subStack.map(function(s) {
        return s(d)
      })
    }
  }

  // If object, find the aggregation, and recurse into the value
  if (keyVal.key) {
    if (aggregators[keyVal.key]) {
      return [aggregators[keyVal.key], makeSubAggregationFunction(keyVal.value)]
    } else {
      console.error('Could not find aggregration method', keyVal)
    }
  }

  return []
}

function extractKeyVal(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return {
        key: key,
        value: obj[key]
      }
    }
  }
  return
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




// Collection Aggregators

function $sum(children) {
  return children.reduce(function(a, b) {
    return a + b
  })
}

function $avg(children) {
  return children.reduce(function(a, b) {
    return a + b
  }) / children.length
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

function $med(children) {
  children.sort(function(a, b) {
    return a - b
  })
  var half = Math.floor(children.length / 2)
  if (children.length % 2)
    return children[half]
  else
    return (children[half - 1] + children[half]) / 2.0
}

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

function $sort(children, n) {
  // Alphanumeric by property
  if (_.isString(n)) {
    children.sort(function sortByKey(a, b) {
      if (a[n] < b[n])
        return -1;
      else if (a[n] > b[n])
        return 1;
      else
        return 0;
    });
  }
  // Numeric by property
  if (_.isNumber(n)) {
    children.sort(function sortByKey(a, b) {
      return a[n] - b[n]
    });
  }
  // Flat, natural sorting
  // Be sure to copy the array as to not mutate the original
  return Array.prototype.slice.call(children).sort(naturalSort)
}

},{"./lodash":41,"javascript-natural-sort":4}],35:[function(require,module,exports){
'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {
  return function clear(def) {

    // Clear a single or multiple column definitions
    if (def) {
      def = _.isArray(def) ? def : [def]
    }

    if (!def) {
      // Clear all of the column defenitions
      return Promise.all(_.map(service.columns, disposeColumn))
        .then(function() {
          service.columns = []
          return service
        })

    }


    return Promise.all(_.map(def, function(d) {
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
      }))
      .then(function() {
        return service
      })

    function disposeColumn(column) {
      // Dispose the dimension
      var disposalActions = _.map(column.removeListeners, function(listener) {
        return Promise.resolve(listener())
      })
      var filterKey = column.complex ? JSON.stringify(column.key) : column.key
      delete service.filters[filterKey]
      disposalActions.push(Promise.resolve(column.dimension.dispose()))
      return Promise.all(disposalActions)
    }

  }
}

},{"./lodash":41,"q":5}],36:[function(require,module,exports){
'use strict'

var Promise = require("q");
var _ = require('./lodash')

module.exports = function(service) {

  var dimension = require('./dimension')(service)

  var columnFunc = column
  columnFunc.find = findColumn

  return columnFunc

  function column(def) {

    // Support groupAll dimension
    if (def === true || _.isUndefined(def)) {
      def = {
        key: true
      }
    }

    // Always deal in bulk.  Like Costco!
    if (!_.isArray(def)) {
      def = [def]
    }

    // Mapp all column creation, wait for all to settle, then return the instance
    return Promise.all(_.map(def, makeColumn))
      .then(function(res) {
        return service
      })
  }

  function findColumn(d){
    return _.find(service.columns, function(c){
      if(_.isArray(d)){
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

    // Get a sample of the column
    return Promise.try(function() {
        return Promise.resolve(service.cf.all())
      })
      .then(function(all) {

        var sample

        // Complex column Keys
        if (_.isArray(column.key)) {
          column.complex = true
          sample = _.map(_.pick(all[0], column.key))
          if (sample.length !== column.key.length) {
            throw new Error('Column key does not exist in data!', column.key)
          }
        } else {
          sample = all[0][column.key]
        }

        // Index Column
        if (!column.complex && column.key !== true && typeof(sample) === 'undefined') {
          throw new Error('Column key does not exist in data!', column.key)
        }

        var existing = findColumn(column.key)

        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user decides to make it permanent
        if (existing && !column.temporary) {
          existing.temporary = false
          if(column.dynamicReference){
            existing.dynamicReference = true
          }
          // console.info('Column has already been defined', arguments)
          return service
        }

        column.type =
          column.key === true ? 'all' :
          column.complex ? 'complex' :
          column.array ? 'array' :
          getType(sample)

        return dimension.make(column.key, column.type)
      })
      .then(function(dim) {
        column.dimension = dim
        column.filterCount = column.filterCount || 0
        column.removeListeners = [buildColumnKeys]
        column.addListeners = [buildColumnKeys]

        service.columns.push(column)

        return buildColumnKeys()

        // Build the columnKeys
        function buildColumnKeys(){
          return Promise.try(function(){
            return Promise.resolve(column.dimension.bottom(Infinity))
          })
          .then(function(rows){
            var accessor = dimension.makeAccessor(column.key)
            column.values = _.sort(_.uniq(_.flatten(_.map(rows, accessor))))
          })
        }
      })
      .then(function(){
        return service
      })
  }

}

},{"./dimension":38,"./lodash":41,"q":5}],37:[function(require,module,exports){
'use strict'

var Promise = require('q');
var crossfilter = require('crossfilter2')

var _ = require('./lodash')

module.exports = function(service) {

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
    if (!c || typeof(c.dimension) !== 'function') {
      return Promise.reject(new Error('No Crossfilter data or instance found!'))
    }
    return Promise.resolve(c)
  }

  function generateColumns(data){
    if(!service.options.generatedColumns){
      return data
    }
    return _.map(data, function(d, i){
      _.forEach(service.options.generatedColumns, function(val, key){
        d[key] = val(d)
      })
      return d
    })
  }

  function add(data) {
    data = generateColumns(data)
    return Promise.try(function() {
        return Promise.resolve(service.cf.add(data))
      })
      .then(function() {
        var ds = []
        _.forEach(service.columns, function(column) {
          _.forEach(column.addListeners, function(listener) {
            ds.push(listener())
          })
        })
        return Promise.all(ds)
      })
      .then(function() {
        return service
      })
  }

  function remove() {
    return Promise.try(function() {
        return Promise.resolve(service.cf.remove())
      })
      .then(function() {
        return service
      })
  }
}

},{"./lodash":41,"crossfilter2":3,"q":5}],38:[function(require,module,exports){
'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {

  return {
    make: make,
    makeAccessor: makeAccessor,
  }

  function make(key, type) {
    var accessor = makeAccessor(key)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type == 'array'))
  }

  function makeAccessor(key){
    var accessorFunction

    // Multi-key dimension
    if (_.isArray(key)) {
      var arrayString = _.map(key, function(k) {
        return "d['" + k + "']"
      })
      accessorFunction = new Function('d', 'return ' + JSON.stringify(arrayString).replace(/\"/g, '') + '')
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? function accessor(d, i) {
          return i
        } :
        // Value Accessor Dimension
        function(d) {
          return d[key]
        }
    }
    return accessorFunction
  }
}

},{"./lodash":41,"q":5}],39:[function(require,module,exports){
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
  return typeof(d) === child()
}

// Array Expressions

function $in(d, child) {
  return d.indexOf(child()) > -1
}

function $nin(d, child) {
  return d.indexOf(child()) === -1
}

function $size(d, child) {
  return d.length === child()
}

},{}],40:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function(service) {
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
    return Promise.try(function() {
        if (!exists) {
          return service.column({
              key: column,
              temporary: true,
            })
            .then(function() {
              // It was able to be created, so retrieve and return it
              return service.column.find(column)
            })
        }
        // It exists, so just return what we found
        return exists
      })
      .then(function(column) {
        // Clone a copy of the new filters
        var newFilters = _.clone(service.filters, true)
          // Here we use the registered column key despite the filter key passed, just in case the filter key's ordering is ordered differently :)
        var filterKey = column.complex ? JSON.stringify(column.key) : column.key
          // Build the filter object
        newFilters[filterKey] = buildFilterObject(fil, isRange, replace)

        return applyFilters(newFilters)
      })
  }

  function filterAll() {
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
    var ds = _.map(newFilters, function(fil, i) {
      var existing = service.filters[i]
      // Filters are the same, so no change is needed on this column
      if (fil.replace && existing && _.isEqual(fil, existing)) {
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
        fil = toggleFilters(fil, existing)
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
        return Promise.resolve(column.dimension.filterFunction(function(d) {
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
      .then(function() {
        // Save the new filters satate
        service.filters = newFilters

        // Pluck and remove falsey filters from the mix
        var tryRemoval = []
        _.forEach(service.filters, function(val, key) {
          if (!val) {
            tryRemoval.push({
              key: key,
              val: val,
            })
            delete service.filters[key]
          }
        })

        // If any of those filters are the last dependency for the column, then remove the column
        return Promise.all(_.map(tryRemoval, function(v) {
          var column = service.column.find((v.key.charAt(0) === '[') ? JSON.parse(v.key) : v.key)
            if (column.temporary && !column.dynamicReference) {
              return service.clear(column.key)
            }
        }))
      })
      .then(function() {
        return service
      })
  }

  function toggleFilters(fil, existing) {
    // Exact from Inclusive
    if (fil.type === 'exact' && existing.type === 'inclusive') {
      fil.value = _.xor(fil.value, [existing.value])
    }
    // Inclusive from Exact
    else if (fil.type === 'inclusive' && existing.type === 'exact') {
      fil.value = _.xor(fil.value, [existing.value])
    }
    // Inclusive / Inclusive Merge
    else if (fil.type === 'inclusive' && existing.type === 'inclusive') {
      fil.value = _.xor(fil.value, existing.value)
    }
    // Exact / Exact
    else if (fil.type === 'exact' && existing.type === 'exact') {
      // If the values are the same, remove the filter entirely
      if (fil.value === existing.value) {
        return false
      }
      // They they are different, make an array
      fil.value = [fil.value, existing.value]
    }

    // Set the new type based on the merged values
    if (fil.value.length === 1) {
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
      _.forEach(obj, function(val, key) {
        // find the data references, if any
        var ref = findDataReferences(val, key)
        ref && columns.push(ref)
          // if it's a string
        if (_.isString(val)) {
          ref = findDataReferences(null, val)
          ref && columns.push(ref)
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
        var column = service.column.find(dataRef)
        var data = column.dimension.bottom(Infinity)
        return function(d) {
          return data
        }
      }
    }

    if (_.isString(obj) || _.isNumber(obj) || _.isBoolean(obj)) {
      return function(d) {
        if (typeof(d) === 'undefined') {
          return obj
        }
        return expressions.$eq(d, function() {
          return obj
        })
      }
    }

    // If an array, recurse into each item and return as a map
    if (_.isArray(obj)) {
      subGetters = _.map(obj, function(o) {
        return makeFunction(o, isAggregation)
      })
      return function(d) {
        return subGetters.map(function(s) {
          return s(d)
        })
      }
    }

    // If object, return a recursion function that itself, returns the results of all of the object keys
    if (_.isObject(obj)) {
      subGetters = _.map(obj, function(val, key) {

        // Get the child
        var getSub = makeFunction(val, isAggregation)

        // Detect raw $column references
        var dataRef = findDataReferences(val, key)
        if (dataRef) {
          var column = service.column.find(dataRef)
          var data = column.dimension.bottom(Infinity)
          return function(d) {
            return data
          }
        }

        // If expression, pass the parentValue and the subGetter
        if (expressions[key]) {
          return function(d) {
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
          return function(d) {
            return aggregatorObj.aggregator.apply(null, [getSub()].concat(aggregatorObj.params))
          }
        }

        // It must be a string then. Pluck that string key from parent, and pass it as the new value to the subGetter
        return function(d) {
          d = d[key]
          return getSub(d, getSub)
        }

      })

      // All object expressions are basically AND's
      // Return AND with a map of the subGetters
      if (isAggregation) {
        if (subGetters.length === 1) {
          return function(d) {
            return subGetters[0](d)
          }
        }
        return function(d) {
          return _.map(subGetters, function(getSub) {
            return getSub(d)
          })
        }
      }
      return function(d) {
        return expressions.$and(d, function(d) {
          return _.map(subGetters, function(getSub) {
            return getSub(d)
          })
        })
      }
    }

    console.log('no expression found for ', obj)
    return false
  }
}

},{"./aggregation":34,"./expressions":39,"./lodash":41,"q":5}],41:[function(require,module,exports){
'use strict'

var naturalSort = require('javascript-natural-sort');

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
  map: map,
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
}


function assign(out) {
  out = out || {}
  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;
    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key))
        out[key] = arguments[i][key]
    }
  }
  return out
}

function find(a, b) {
  return a.find(b);
}

function remove(a, b) {
  return a.filter(function(o, i) {
    var r = b(o)
    if (r) {
      a.splice(i, 1)
      return true
    }
  })
}

function isArray(a) {
  return Array.isArray(a)
}

function isObject(d) {
  return typeof(d) === 'object' && !isArray(d)
}

function isBoolean(d) {
  return typeof(d) === 'boolean'
}

function isString(d) {
  return typeof(d) === 'string'
}

function isNumber(d) {
  return typeof(d) === 'number'
}

function isFunction(a) {
  return typeof(a) === 'function'
}

function get(a, b) {
  return b.
  replace('[', '.').replace(']', '').
  split('.').
  reduce(
    function(obj, property) {
      return obj[property];
    }, a
  )
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
        m.push(a[key][b])
      }
    }
    return m
  }
  return a.map(function(aa, i) {
    return aa[b]
  })
}

function sortBy(a, b) {
  if (isFunction(b)) {
    return a.sort(function(aa, bb) {
      if (aa.value > bb.value) {
        return 1;
      }
      if (aa.value < bb.value) {
        return -1;
      }
      // a must be equal to b
      return 0;
    });
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
  return typeof(a) === 'undefined'
}

function pick(a, b) {
  var c = {}
  forEach(b, function(bb) {
    if (a[bb]) c[bb] = a[bb]
  })
  return c
}

function xor(a, b) {
  var diff = []
  forEach(a, function(aa) {
    if (b.indexOf(aa) < 0) {
      return diff.push(aa)
    }
  })
  return diff
}

function clone(a) {
  return JSON.parse(JSON.stringify(a, function replacer(key, value) {
    if (typeof value === "function") {
      return value.toString();
    }
    return value;
  }))
}

function isEqual(x, y) {
  if ((typeof x == "object" && x !== null) && (typeof y == "object" && y !== null)) {
    if (Object.keys(x).length != Object.keys(y).length)
      return false;

    for (var prop in x) {
      if (y.hasOwnProperty(prop)) {
        if (!isEqual(x[prop], y[prop]))
          return false;
      } else
        return false;
    }

    return true;
  } else if (x !== y)
    return false;
  else
    return true;
}

function replaceArray(a, b) {
  var al = a.length
  var bl = b.length
  if (al > bl) {
    a.splice(bl, al - bl)
  } else if (al < bl) {
    a.push.apply(a, new Array(bl - al))
  }
  forEach(a, function(val, key) {
    a[key] = b[key]
  })
  return a
}

function uniq(a) {
  var seen = {};
  return a.filter(function(item) {
    return seen.hasOwnProperty(item) ? false : (seen[item] = true);
  });
}

function flatten(array) {
  return array.reduce(function(a, b) {
    return a.concat(b);
  }, []);
}

function sort(a){
  return a.sort(naturalSort)
}

},{"javascript-natural-sort":4}],42:[function(require,module,exports){
'use strict'

var Promise = require('q');
var _ = require('./lodash')

module.exports = function(service) {
  var reductiofy = require('./reductiofy')(service)
  var filters = require('./filters')(service)

  return function find(query) {

    // Default query
    if (typeof(query) === 'undefined') {
      query = {}
    }

    // Default select
    if (typeof(query.select) === 'undefined') {
      query.select = {
        $count: true
      }
    }

    // Support groupAll
    query.groupBy = query.groupBy || true

    // Find Existing Column
    var column = service.column.find(query.groupBy)

    var group

    return Promise.try(function() {
        // Create Column if not found
        if (!column) {
          return service.column({
              key: query.groupBy,
              type: !_.isUndefined(query.type) ? query.type : null,
              array: !!query.array
            })
            .then(function(u) {
              return _.find(u.columns, function(c) {
                return c.key === query.groupBy
              })
            })
        }
        // If the column exists, let's at least make sure it's marked
        // as permanent. There is a slight chance it exists because
        // of a filter, and the user has now decided to query on it
        return column
      })
      .then(function(c) {
        column = c
          // Create the grouping on the columns dimension
          // Using Promise Resolve allows support for crossfilter async
        return Promise.resolve(column.dimension.group())
      })
      .then(function(g) {
        // Save the group while we create the reducer
        group = g
        return filters.scanForDynamicFilters(query)
      })
      .then(function(requiredColumns) {
        // We need to scan the group for any filters that would require
        // the group to be rebuilt when data is added or removed in any way.
        if (requiredColumns.length) {
          return Promise.all(_.map(requiredColumns, function(columnKey) {
              service.column({
                key: columnKey,
                dynamicReference: group
              })
            }))
            .then(function() {
              return true
            })
        }
        return false
      })
      .then(function(needsListener) {
        // Here, we create a listener to recreate and apply the reducer to
        // the group anytime data changes.

        var queryRes = {
          // The Universe for continuous promise chaining
          universe: service,
          // The bare metalqueryRes.data
          crossfilter: service.cf,
          dimension: column.dimension,
          group: group,
        }

        if (needsListener) {
          column.addListeners.push(function(isPost) {
            return applyReducer(queryRes, isPost)
          })
          column.removeListeners.push(function(isPost) {
            return applyReducer(queryRes, isPost)
          })
        }

        return applyReducer(queryRes)
          .then(function() {
            return queryRes
          })

        function applyReducer(queryRes, isPost) {
          // Create the reducer using reductio and the Universe Query Syntax
          return reductiofy(query)
            .then(function(reducer) {
              // Apply the reducer to the group
              reducer(queryRes.group)
              queryRes.data = queryRes.group.all()
              queryRes.dynamicData = isPost
            })
        }

      })
  }
}

},{"./filters":40,"./lodash":41,"./reductiofy":44,"q":5}],43:[function(require,module,exports){
'use strict'

var _ = require('./lodash')

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
  }
}

// Aggregators

function $count(reducer, value) {
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

// TODO histograms
// TODO exceptions

},{"./lodash":41}],44:[function(require,module,exports){
'use strict'

var reductio = require('reductio')

var _ = require('./lodash')
var rAggregators = require('./reductioAggregators')
var expressions = require('./expressions')
var aggregation = require('./aggregation')

module.exports = function(service) {
  var filters = require('./filters')(service)

  return function reductiofy(query) {
    var reducer = reductio()
    var groupBy = query.groupBy
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
        _.map(selects, function(val, key) {
          return {
            key: key,
            value: val
          }
        }),
        function(s) {
          if (rAggregators.aggregators[s.key]) {
            return 0
          }
          return 1
        })


      // dive into each key/value
      return _.forEach(sortedSelectKeyValue, function(s) {

        // Found a Reductio Aggregation
        if (rAggregators.aggregators[s.key]) {
          // Build the valueAccessorFunction
          var accessor = makeValueAccessor(s.value)
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

    function makeValueAccessor(obj) {
      // If the object is a string or a number here, it is referencing
      // a column property for a reductio aggregation, so just return it as a string
      if (typeof(obj) === 'string' || typeof(obj) === 'number') {
        return obj + ''
      }
      // If it's an object, we need to build a custom aggregation function
      if (_.isObject(obj)) {
        return aggregation.makeFunction(obj)
      }
    }
  }
}

},{"./aggregation":34,"./expressions":39,"./filters":40,"./lodash":41,"./reductioAggregators":43,"reductio":27}],45:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

module.exports = universe

function universe(data, options) {

  var service = {
    options: _.assign({}, options),
    columns: [],
    filters: {},
  }

  var cf = require('./crossfilter')(service)

  data = cf.generateColumns(data)

  return cf.build(data)
    .then(function(data) {
      service.cf = data
      return _.assign(service, {
        add: cf.add,
        remove: cf.remove,
        column: require('./column')(service),
        query: require('./query')(service),
        filter: require('./filters')(service).filter,
        clear: require('./clear')(service),
      })
    })
}

},{"./clear":35,"./column":36,"./crossfilter":37,"./filters":40,"./lodash":41,"./query":42,"q":5}]},{},[45])(45)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9jcm9zc2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvamF2YXNjcmlwdC1uYXR1cmFsLXNvcnQvbmF0dXJhbFNvcnQuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvY3Jvc3NmaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FjY2Vzc29ycy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYWxpYXMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FsaWFzUHJvcC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYXZnLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9idWlsZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvY2FwLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9jb3VudC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvZGF0YS1saXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9leGNlcHRpb24tY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2V4Y2VwdGlvbi1zdW0uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvaGlzdG9ncmFtLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9tYXguanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL21lZGlhbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbWluLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9uZXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wYXJhbWV0ZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wb3N0cHJvY2Vzcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcG9zdHByb2Nlc3NvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3JlZHVjdGlvLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zb3J0QnkuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N0ZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvc3VtLW9mLXNxdWFyZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N1bS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvdmFsdWUtY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3ZhbHVlLWxpc3QuanMiLCJzcmMvYWdncmVnYXRpb24uanMiLCJzcmMvY2xlYXIuanMiLCJzcmMvY29sdW1uLmpzIiwic3JjL2Nyb3NzZmlsdGVyLmpzIiwic3JjL2RpbWVuc2lvbi5qcyIsInNyYy9leHByZXNzaW9ucy5qcyIsInNyYy9maWx0ZXJzLmpzIiwic3JjL2xvZGFzaC5qcyIsInNyYy9xdWVyeS5qcyIsInNyYy9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzLmpzIiwic3JjL3JlZHVjdGlvZnkuanMiLCJzcmMvdW5pdmVyc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2g1REE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hnRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5aERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCIoZnVuY3Rpb24oZXhwb3J0cyl7XG5jcm9zc2ZpbHRlci52ZXJzaW9uID0gXCIyLjAuMC1hbHBoYS4wM1wiO1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaWRlbnRpdHkoZCkge1xuICByZXR1cm4gZDtcbn1cbmNyb3NzZmlsdGVyLnBlcm11dGUgPSBwZXJtdXRlO1xuXG5mdW5jdGlvbiBwZXJtdXRlKGFycmF5LCBpbmRleCwgZGVlcCkge1xuICBmb3IgKHZhciBpID0gMCwgbiA9IGluZGV4Lmxlbmd0aCwgY29weSA9IGRlZXAgPyBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGFycmF5KSkgOiBuZXcgQXJyYXkobik7IGkgPCBuOyArK2kpIHtcbiAgICBjb3B5W2ldID0gYXJyYXlbaW5kZXhbaV1dO1xuICB9XG4gIHJldHVybiBjb3B5O1xufVxudmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmJpc2VjdC5ieSA9IGJpc2VjdF9ieTtcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxudmFyIGhlYXAgPSBjcm9zc2ZpbHRlci5oZWFwID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXAuYnkgPSBoZWFwX2J5O1xuXG5mdW5jdGlvbiBoZWFwX2J5KGYpIHtcblxuICAvLyBCdWlsZHMgYSBiaW5hcnkgaGVhcCB3aXRoaW4gdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXS4gVGhlIGhlYXAgaGFzIHRoZVxuICAvLyBwcm9wZXJ0eSBzdWNoIHRoYXQgdGhlIHBhcmVudCBhW2xvK2ldIGlzIGFsd2F5cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gaXRzXG4gIC8vIHR3byBjaGlsZHJlbjogYVtsbysyKmkrMV0gYW5kIGFbbG8rMippKzJdLlxuICBmdW5jdGlvbiBoZWFwKGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgaSA9IChuID4+PiAxKSArIDE7XG4gICAgd2hpbGUgKC0taSA+IDApIHNpZnQoYSwgaSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU29ydHMgdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXSBpbiBkZXNjZW5kaW5nIG9yZGVyLCBhc3N1bWluZyBpdCBpc1xuICAvLyBhbHJlYWR5IGEgaGVhcC5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIHQ7XG4gICAgd2hpbGUgKC0tbiA+IDApIHQgPSBhW2xvXSwgYVtsb10gPSBhW2xvICsgbl0sIGFbbG8gKyBuXSA9IHQsIHNpZnQoYSwgMSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU2lmdHMgdGhlIGVsZW1lbnQgYVtsbytpLTFdIGRvd24gdGhlIGhlYXAsIHdoZXJlIHRoZSBoZWFwIGlzIHRoZSBjb250aWd1b3VzXG4gIC8vIHNsaWNlIG9mIGFycmF5IGFbbG86bG8rbl0uIFRoaXMgbWV0aG9kIGNhbiBhbHNvIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSBoZWFwXG4gIC8vIGluY3JlbWVudGFsbHksIHdpdGhvdXQgaW5jdXJyaW5nIHRoZSBmdWxsIGNvc3Qgb2YgcmVjb25zdHJ1Y3RpbmcgdGhlIGhlYXAuXG4gIGZ1bmN0aW9uIHNpZnQoYSwgaSwgbiwgbG8pIHtcbiAgICB2YXIgZCA9IGFbLS1sbyArIGldLFxuICAgICAgICB4ID0gZihkKSxcbiAgICAgICAgY2hpbGQ7XG4gICAgd2hpbGUgKChjaGlsZCA9IGkgPDwgMSkgPD0gbikge1xuICAgICAgaWYgKGNoaWxkIDwgbiAmJiBmKGFbbG8gKyBjaGlsZF0pID4gZihhW2xvICsgY2hpbGQgKyAxXSkpIGNoaWxkKys7XG4gICAgICBpZiAoeCA8PSBmKGFbbG8gKyBjaGlsZF0pKSBicmVhaztcbiAgICAgIGFbbG8gKyBpXSA9IGFbbG8gKyBjaGlsZF07XG4gICAgICBpID0gY2hpbGQ7XG4gICAgfVxuICAgIGFbbG8gKyBpXSA9IGQ7XG4gIH1cblxuICBoZWFwLnNvcnQgPSBzb3J0O1xuICByZXR1cm4gaGVhcDtcbn1cbnZhciBoZWFwc2VsZWN0ID0gY3Jvc3NmaWx0ZXIuaGVhcHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwc2VsZWN0LmJ5ID0gaGVhcHNlbGVjdF9ieTtcblxuZnVuY3Rpb24gaGVhcHNlbGVjdF9ieShmKSB7XG4gIHZhciBoZWFwID0gaGVhcF9ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICB4LFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoeCA9IGYoZCA9IGFbbG9dKSA+IG1pbikge1xuICAgICAgICAgIHF1ZXVlWzBdID0gZDtcbiAgICAgICAgICBtaW4gPSBmKGhlYXAocXVldWUsIDAsIGspWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoKytsbyA8IGhpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVldWU7XG4gIH1cblxuICByZXR1cm4gaGVhcHNlbGVjdDtcbn1cbnZhciBpbnNlcnRpb25zb3J0ID0gY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5pbnNlcnRpb25zb3J0LmJ5ID0gaW5zZXJ0aW9uc29ydF9ieTtcblxuZnVuY3Rpb24gaW5zZXJ0aW9uc29ydF9ieShmKSB7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0aW9uc29ydChhLCBsbywgaGkpIHtcbiAgICBmb3IgKHZhciBpID0gbG8gKyAxOyBpIDwgaGk7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IGksIHQgPSBhW2ldLCB4ID0gZih0KTsgaiA+IGxvICYmIGYoYVtqIC0gMV0pID4geDsgLS1qKSB7XG4gICAgICAgIGFbal0gPSBhW2ogLSAxXTtcbiAgICAgIH1cbiAgICAgIGFbal0gPSB0O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHJldHVybiBpbnNlcnRpb25zb3J0O1xufVxuLy8gQWxnb3JpdGhtIGRlc2lnbmVkIGJ5IFZsYWRpbWlyIFlhcm9zbGF2c2tpeS5cbi8vIEltcGxlbWVudGF0aW9uIGJhc2VkIG9uIHRoZSBEYXJ0IHByb2plY3Q7IHNlZSBsaWIvZGFydC9MSUNFTlNFIGZvciBkZXRhaWxzLlxuXG52YXIgcXVpY2tzb3J0ID0gY3Jvc3NmaWx0ZXIucXVpY2tzb3J0ID0gcXVpY2tzb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxucXVpY2tzb3J0LmJ5ID0gcXVpY2tzb3J0X2J5O1xuXG5mdW5jdGlvbiBxdWlja3NvcnRfYnkoZikge1xuICB2YXIgaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoZik7XG5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICByZXR1cm4gKGhpIC0gbG8gPCBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZFxuICAgICAgICA/IGluc2VydGlvbnNvcnRcbiAgICAgICAgOiBxdWlja3NvcnQpKGEsIGxvLCBoaSk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWlja3NvcnQoYSwgbG8sIGhpKSB7XG4gICAgLy8gQ29tcHV0ZSB0aGUgdHdvIHBpdm90cyBieSBsb29raW5nIGF0IDUgZWxlbWVudHMuXG4gICAgdmFyIHNpeHRoID0gKGhpIC0gbG8pIC8gNiB8IDAsXG4gICAgICAgIGkxID0gbG8gKyBzaXh0aCxcbiAgICAgICAgaTUgPSBoaSAtIDEgLSBzaXh0aCxcbiAgICAgICAgaTMgPSBsbyArIGhpIC0gMSA+PiAxLCAgLy8gVGhlIG1pZHBvaW50LlxuICAgICAgICBpMiA9IGkzIC0gc2l4dGgsXG4gICAgICAgIGk0ID0gaTMgKyBzaXh0aDtcblxuICAgIHZhciBlMSA9IGFbaTFdLCB4MSA9IGYoZTEpLFxuICAgICAgICBlMiA9IGFbaTJdLCB4MiA9IGYoZTIpLFxuICAgICAgICBlMyA9IGFbaTNdLCB4MyA9IGYoZTMpLFxuICAgICAgICBlNCA9IGFbaTRdLCB4NCA9IGYoZTQpLFxuICAgICAgICBlNSA9IGFbaTVdLCB4NSA9IGYoZTUpO1xuXG4gICAgdmFyIHQ7XG5cbiAgICAvLyBTb3J0IHRoZSBzZWxlY3RlZCA1IGVsZW1lbnRzIHVzaW5nIGEgc29ydGluZyBuZXR3b3JrLlxuICAgIGlmICh4MSA+IHgyKSB0ID0gZTEsIGUxID0gZTIsIGUyID0gdCwgdCA9IHgxLCB4MSA9IHgyLCB4MiA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDEgPiB4MykgdCA9IGUxLCBlMSA9IGUzLCBlMyA9IHQsIHQgPSB4MSwgeDEgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgxID4geDQpIHQgPSBlMSwgZTEgPSBlNCwgZTQgPSB0LCB0ID0geDEsIHgxID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDMgPiB4NCkgdCA9IGUzLCBlMyA9IGU0LCBlNCA9IHQsIHQgPSB4MywgeDMgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MiA+IHg1KSB0ID0gZTIsIGUyID0gZTUsIGU1ID0gdCwgdCA9IHgyLCB4MiA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuXG4gICAgdmFyIHBpdm90MSA9IGUyLCBwaXZvdFZhbHVlMSA9IHgyLFxuICAgICAgICBwaXZvdDIgPSBlNCwgcGl2b3RWYWx1ZTIgPSB4NDtcblxuICAgIC8vIGUyIGFuZCBlNCBoYXZlIGJlZW4gc2F2ZWQgaW4gdGhlIHBpdm90IHZhcmlhYmxlcy4gVGhleSB3aWxsIGJlIHdyaXR0ZW5cbiAgICAvLyBiYWNrLCBvbmNlIHRoZSBwYXJ0aXRpb25pbmcgaXMgZmluaXNoZWQuXG4gICAgYVtpMV0gPSBlMTtcbiAgICBhW2kyXSA9IGFbbG9dO1xuICAgIGFbaTNdID0gZTM7XG4gICAgYVtpNF0gPSBhW2hpIC0gMV07XG4gICAgYVtpNV0gPSBlNTtcblxuICAgIHZhciBsZXNzID0gbG8gKyAxLCAgIC8vIEZpcnN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG4gICAgICAgIGdyZWF0ID0gaGkgLSAyOyAgLy8gTGFzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuXG4gICAgLy8gTm90ZSB0aGF0IGZvciB2YWx1ZSBjb21wYXJpc29uLCA8LCA8PSwgPj0gYW5kID4gY29lcmNlIHRvIGEgcHJpbWl0aXZlIHZpYVxuICAgIC8vIE9iamVjdC5wcm90b3R5cGUudmFsdWVPZjsgPT0gYW5kID09PSBkbyBub3QsIHNvIGluIG9yZGVyIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAvLyB3aXRoIG5hdHVyYWwgb3JkZXIgKHN1Y2ggYXMgZm9yIERhdGUgb2JqZWN0cyksIHdlIG11c3QgZG8gdHdvIGNvbXBhcmVzLlxuICAgIHZhciBwaXZvdHNFcXVhbCA9IHBpdm90VmFsdWUxIDw9IHBpdm90VmFsdWUyICYmIHBpdm90VmFsdWUxID49IHBpdm90VmFsdWUyO1xuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuXG4gICAgICAvLyBEZWdlbmVyYXRlZCBjYXNlIHdoZXJlIHRoZSBwYXJ0aXRpb25pbmcgYmVjb21lcyBhIGR1dGNoIG5hdGlvbmFsIGZsYWdcbiAgICAgIC8vIHByb2JsZW0uXG4gICAgICAvL1xuICAgICAgLy8gWyB8ICA8IHBpdm90ICB8ID09IHBpdm90IHwgdW5wYXJ0aXRpb25lZCB8ID4gcGl2b3QgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICAgXiAgICAgICAgICBeICAgICAgICAgICAgIF4gICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgIGsgICAgICAgICAgIGdyZWF0ICAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEpIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdC5cbiAgICAgIC8vICAgMikgZm9yIHggaW4gW2xlc3MsIGtbIDogeCA9PSBwaXZvdC5cbiAgICAgIC8vICAgMykgZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QuXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgKytrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSBpZiAoeGsgPiBwaXZvdFZhbHVlMSkge1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgZWxlbWVudCA8PSBwaXZvdCBpbiB0aGUgcmFuZ2UgW2sgLSAxLCBncmVhdF0gYW5kXG4gICAgICAgICAgLy8gcHV0IFs6ZWs6XSB0aGVyZS4gV2Uga25vdyB0aGF0IHN1Y2ggYW4gZWxlbWVudCBtdXN0IGV4aXN0OlxuICAgICAgICAgIC8vIFdoZW4gayA9PSBsZXNzLCB0aGVuIGVsMyAod2hpY2ggaXMgZXF1YWwgdG8gcGl2b3QpIGxpZXMgaW4gdGhlXG4gICAgICAgICAgLy8gaW50ZXJ2YWwuIE90aGVyd2lzZSBhW2sgLSAxXSA9PSBwaXZvdCBhbmQgdGhlIHNlYXJjaCBzdG9wcyBhdCBrLTEuXG4gICAgICAgICAgLy8gTm90ZSB0aGF0IGluIHRoZSBsYXR0ZXIgY2FzZSBpbnZhcmlhbnQgMiB3aWxsIGJlIHZpb2xhdGVkIGZvciBhXG4gICAgICAgICAgLy8gc2hvcnQgYW1vdW50IG9mIHRpbWUuIFRoZSBpbnZhcmlhbnQgd2lsbCBiZSByZXN0b3JlZCB3aGVuIHRoZVxuICAgICAgICAgIC8vIHBpdm90cyBhcmUgcHV0IGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluIHRoZSB3aGlsZS1sb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IGlmIGdyZWF0IDwgayB0aGVuIHdlIHdpbGwgZXhpdCB0aGUgb3V0ZXIgbG9vcCBhbmQgZml4XG4gICAgICAgICAgICAgIC8vIGludmFyaWFudCAyICh3aGljaCB3ZSBqdXN0IHZpb2xhdGVkKS5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPCBwaXZvdDFcbiAgICAgIC8vICAyLiA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyXG4gICAgICAvLyAgMy4gPiBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgfCA8IHBpdm90MSB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID4gcGl2b3QyICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDw9IHggJiYgeCA8PSBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPD0gcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID49IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNb3ZlIHBpdm90cyBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAvLyBXZSBzaHJ1bmsgdGhlIGxpc3QgZnJvbSBib3RoIHNpZGVzIChhW2xlZnRdIGFuZCBhW3JpZ2h0XSBoYXZlXG4gICAgLy8gbWVhbmluZ2xlc3MgdmFsdWVzIGluIHRoZW0pIGFuZCBub3cgd2UgbW92ZSBlbGVtZW50cyBmcm9tIHRoZSBmaXJzdFxuICAgIC8vIGFuZCB0aGlyZCBwYXJ0aXRpb24gaW50byB0aGVzZSBsb2NhdGlvbnMgc28gdGhhdCB3ZSBjYW4gc3RvcmUgdGhlXG4gICAgLy8gcGl2b3RzLlxuICAgIGFbbG9dID0gYVtsZXNzIC0gMV07XG4gICAgYVtsZXNzIC0gMV0gPSBwaXZvdDE7XG4gICAgYVtoaSAtIDFdID0gYVtncmVhdCArIDFdO1xuICAgIGFbZ3JlYXQgKyAxXSA9IHBpdm90MjtcblxuICAgIC8vIFRoZSBsaXN0IGlzIG5vdyBwYXJ0aXRpb25lZCBpbnRvIHRocmVlIHBhcnRpdGlvbnM6XG4gICAgLy8gWyA8IHBpdm90MSAgIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgIHwgID4gcGl2b3QyICAgXVxuICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG5cbiAgICAvLyBSZWN1cnNpdmUgZGVzY2VudC4gKERvbid0IGluY2x1ZGUgdGhlIHBpdm90IHZhbHVlcy4pXG4gICAgc29ydChhLCBsbywgbGVzcyAtIDEpO1xuICAgIHNvcnQoYSwgZ3JlYXQgKyAyLCBoaSk7XG5cbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcbiAgICAgIC8vIEFsbCBlbGVtZW50cyBpbiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBhcmUgZXF1YWwgdG8gdGhlIHBpdm90LiBOb1xuICAgICAgLy8gbmVlZCB0byBzb3J0IHRoZW0uXG4gICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICAvLyBJbiB0aGVvcnkgaXQgc2hvdWxkIGJlIGVub3VnaCB0byBjYWxsIF9kb1NvcnQgcmVjdXJzaXZlbHkgb24gdGhlIHNlY29uZFxuICAgIC8vIHBhcnRpdGlvbi5cbiAgICAvLyBUaGUgQW5kcm9pZCBzb3VyY2UgaG93ZXZlciByZW1vdmVzIHRoZSBwaXZvdCBlbGVtZW50cyBmcm9tIHRoZSByZWN1cnNpdmVcbiAgICAvLyBjYWxsIGlmIHRoZSBzZWNvbmQgcGFydGl0aW9uIGlzIHRvbyBsYXJnZSAobW9yZSB0aGFuIDIvMyBvZiB0aGUgbGlzdCkuXG4gICAgaWYgKGxlc3MgPCBpMSAmJiBncmVhdCA+IGk1KSB7XG4gICAgICB2YXIgbGVzc1ZhbHVlLCBncmVhdFZhbHVlO1xuICAgICAgd2hpbGUgKChsZXNzVmFsdWUgPSBmKGFbbGVzc10pKSA8PSBwaXZvdFZhbHVlMSAmJiBsZXNzVmFsdWUgPj0gcGl2b3RWYWx1ZTEpICsrbGVzcztcbiAgICAgIHdoaWxlICgoZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pKSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSAtLWdyZWF0O1xuXG4gICAgICAvLyBDb3B5IHBhc3RlIG9mIHRoZSBwcmV2aW91cyAzLXdheSBwYXJ0aXRpb25pbmcgd2l0aCBhZGFwdGlvbnMuXG4gICAgICAvL1xuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPT0gcGl2b3QxXG4gICAgICAvLyAgMi4gPiBwaXZvdDEgJiYgPCBwaXZvdDJcbiAgICAgIC8vICAzLiA9PSBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgPT0gcGl2b3QxIHwgPiBwaXZvdDEgJiYgPCBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID09IHBpdm90MiBdXG4gICAgICAvLyAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeXG4gICAgICAvLyAgICAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdFxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIFsgKiwgbGVzc1sgOiB4ID09IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPCB4ICYmIHggPCBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCAqIF0gOiB4ID09IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTEgJiYgeGsgPj0gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTIgJiYgeGsgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPCBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPT0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGhhcyBub3cgYmVlbiBjbGVhcmVkIG9mIHBpdm90IGVsZW1lbnRzIGFuZCBsb29rc1xuICAgIC8vIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPiBwaXZvdDEgJiYgPCBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNvcnQgdGhlIHNlY29uZCBwYXJ0aXRpb24gdXNpbmcgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBsb29rcyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID49IHBpdm90MSAmJiA8PSBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTaW1wbHkgc29ydCBpdCBieSByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIHJldHVybiBzb3J0KGEsIGxlc3MsIGdyZWF0ICsgMSk7XG4gIH1cblxuICByZXR1cm4gc29ydDtcbn1cblxudmFyIHF1aWNrc29ydF9zaXplVGhyZXNob2xkID0gMzI7XG52YXIgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkO1xuXG5pZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cblxuLy8gQW4gYXJiaXRyYXJpbHktd2lkZSBhcnJheSBvZiBiaXRtYXNrc1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYml0YXJyYXkobikge1xuICB0aGlzLmxlbmd0aCA9IG47XG4gIHRoaXMuc3ViYXJyYXlzID0gMTtcbiAgdGhpcy53aWR0aCA9IDg7XG4gIHRoaXMubWFza3MgPSB7XG4gICAgMDogMFxuICB9XG5cbiAgdGhpc1swXSA9IGNyb3NzZmlsdGVyX2FycmF5OChuKTtcbn1cblxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmxlbmd0aGVuID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4odGhpc1tpXSwgbik7XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBuO1xufTtcblxuLy8gUmVzZXJ2ZSBhIG5ldyBiaXQgaW5kZXggaW4gdGhlIGFycmF5LCByZXR1cm5zIHtvZmZzZXQsIG9uZX1cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG0sIHcsIG9uZSwgaSwgbGVuO1xuXG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtID0gdGhpcy5tYXNrc1tpXTtcbiAgICB3ID0gdGhpcy53aWR0aCAtICgzMiAqIGkpO1xuICAgIG9uZSA9IH5tICYgLX5tO1xuXG4gICAgaWYgKHcgPj0gMzIgJiYgIW9uZSkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKHcgPCAzMiAmJiAob25lICYgKDEgPDwgdykpKSB7XG4gICAgICAvLyB3aWRlbiB0aGlzIHN1YmFycmF5XG4gICAgICB0aGlzW2ldID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbih0aGlzW2ldLCB3IDw8PSAxKTtcbiAgICAgIHRoaXMud2lkdGggPSAzMiAqIGkgKyB3O1xuICAgIH1cblxuICAgIHRoaXMubWFza3NbaV0gfD0gb25lO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIG9mZnNldDogaSxcbiAgICAgIG9uZTogb25lXG4gICAgfTtcbiAgfVxuXG4gIC8vIGFkZCBhIG5ldyBzdWJhcnJheVxuICB0aGlzW3RoaXMuc3ViYXJyYXlzXSA9IGNyb3NzZmlsdGVyX2FycmF5OCh0aGlzLmxlbmd0aCk7XG4gIHRoaXMubWFza3NbdGhpcy5zdWJhcnJheXNdID0gMTtcbiAgdGhpcy53aWR0aCArPSA4O1xuICByZXR1cm4ge1xuICAgIG9mZnNldDogdGhpcy5zdWJhcnJheXMrKyxcbiAgICBvbmU6IDFcbiAgfTtcbn07XG5cbi8vIENvcHkgcmVjb3JkIGZyb20gaW5kZXggc3JjIHRvIGluZGV4IGRlc3RcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oZGVzdCwgc3JjKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzW2ldW2Rlc3RdID0gdGhpc1tpXVtzcmNdO1xuICB9XG59O1xuXG4vLyBUcnVuY2F0ZSB0aGUgYXJyYXkgdG8gdGhlIGdpdmVuIGxlbmd0aFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnRydW5jYXRlID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgZm9yICh2YXIgaiA9IHRoaXMubGVuZ3RoIC0gMTsgaiA+PSBuOyBqLS0pIHtcbiAgICAgIHRoaXNbaV1bal0gPSAwO1xuICAgIH1cbiAgICB0aGlzW2ldLmxlbmd0aCA9IG47XG4gIH1cbiAgdGhpcy5sZW5ndGggPSBuO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgYWxsIGJpdHMgZm9yIHRoZSBnaXZlbiBpbmRleCBhcmUgMFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnplcm8gPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDAgZXhjZXB0IGZvciBwb3NzaWJseSBvbmVcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvRXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoaSA9PT0gb2Zmc2V0ID8gdGhpc1tpXVtuXSAmIHplcm8gOiB0aGlzW2ldW25dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLm9ubHkgPSBmdW5jdGlvbihuLCBvZmZzZXQsIG9uZSkge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0gIT0gKGkgPT09IG9mZnNldCA/IG9uZSA6IDApKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgb25seSB0aGUgc3BlY2lmaWVkIGJpdCBpcyBzZXQgZm9yIHRoZSBnaXZlbiBpbmRleCBleGNlcHQgZm9yIHBvc3NpYmx5IG9uZSBvdGhlclxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLm9ubHlFeGNlcHQgPSBmdW5jdGlvbihuLCBvZmZzZXQsIHplcm8sIG9ubHlPZmZzZXQsIG9ubHlPbmUpIHtcbiAgdmFyIG1hc2s7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBtYXNrID0gdGhpc1tpXVtuXTtcbiAgICBpZiAoaSA9PT0gb2Zmc2V0KVxuICAgICAgbWFzayAmPSB6ZXJvO1xuICAgIGlmIChtYXNrICE9IChpID09PSBvbmx5T2Zmc2V0ID8gb25seU9uZSA6IDApKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgdmFsdWUsIDAsIG4pLCBiaXNlY3QucmlnaHQodmFsdWVzLCB2YWx1ZSwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSB7XG4gIHZhciBtaW4gPSByYW5nZVswXSxcbiAgICAgIG1heCA9IHJhbmdlWzFdO1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCBtaW4sIDAsIG4pLCBiaXNlY3QubGVmdCh2YWx1ZXMsIG1heCwgMCwgbildO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwodmFsdWVzKSB7XG4gIHJldHVybiBbMCwgdmFsdWVzLmxlbmd0aF07XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9udWxsKCkge1xuICByZXR1cm4gbnVsbDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3plcm8oKSB7XG4gIHJldHVybiAwO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgKyAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQocCkge1xuICByZXR1cm4gcCAtIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUFkZChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgKyArZih2KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwIC0gZih2KTtcbiAgfTtcbn1cbmV4cG9ydHMuY3Jvc3NmaWx0ZXIgPSBjcm9zc2ZpbHRlcjtcblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXIoKSB7XG4gIHZhciBjcm9zc2ZpbHRlciA9IHtcbiAgICBhZGQ6IGFkZCxcbiAgICByZW1vdmU6IHJlbW92ZURhdGEsXG4gICAgZGltZW5zaW9uOiBkaW1lbnNpb24sXG4gICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgIHNpemU6IHNpemUsXG4gICAgYWxsOiBhbGwsXG4gICAgb25DaGFuZ2U6IG9uQ2hhbmdlLFxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgZmlsdGVycywgLy8gMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcbiAgICAgIGNhbGxiYWNrcyA9IFtdO1xuXG4gIGZpbHRlcnMgPSBuZXcgY3Jvc3NmaWx0ZXJfYml0YXJyYXkoMCk7XG5cbiAgLy8gQWRkcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIHRvIHRoaXMgY3Jvc3NmaWx0ZXIuXG4gIGZ1bmN0aW9uIGFkZChuZXdEYXRhKSB7XG4gICAgdmFyIG4wID0gbixcbiAgICAgICAgbjEgPSBuZXdEYXRhLmxlbmd0aDtcblxuICAgIC8vIElmIHRoZXJlJ3MgYWN0dWFsbHkgbmV3IGRhdGEgdG8gYWRk4oCmXG4gICAgLy8gTWVyZ2UgdGhlIG5ldyBkYXRhIGludG8gdGhlIGV4aXN0aW5nIGRhdGEuXG4gICAgLy8gTGVuZ3RoZW4gdGhlIGZpbHRlciBiaXRzZXQgdG8gaGFuZGxlIHRoZSBuZXcgcmVjb3Jkcy5cbiAgICAvLyBOb3RpZnkgbGlzdGVuZXJzIChkaW1lbnNpb25zIGFuZCBncm91cHMpIHRoYXQgbmV3IGRhdGEgaXMgYXZhaWxhYmxlLlxuICAgIGlmIChuMSkge1xuICAgICAgZGF0YSA9IGRhdGEuY29uY2F0KG5ld0RhdGEpO1xuICAgICAgZmlsdGVycy5sZW5ndGhlbihuICs9IG4xKTtcbiAgICAgIGRhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3RGF0YSwgbjAsIG4xKTsgfSk7XG4gICAgICB0cmlnZ2VyT25DaGFuZ2UoJ2RhdGFBZGRlZCcpO1xuICAgIH1cblxuICAgIHJldHVybiBjcm9zc2ZpbHRlcjtcbiAgfVxuXG4gIC8vIFJlbW92ZXMgYWxsIHJlY29yZHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgIHZhciBuZXdJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pLFxuICAgICAgICByZW1vdmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkgbmV3SW5kZXhbaV0gPSBqKys7XG4gICAgICBlbHNlIHJlbW92ZWQucHVzaChpKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYWxsIG1hdGNoaW5nIHJlY29yZHMgZnJvbSBncm91cHMuXG4gICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKC0xLCAtMSwgW10sIHJlbW92ZWQsIHRydWUpOyB9KTtcblxuICAgIC8vIFVwZGF0ZSBpbmRleGVzLlxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3SW5kZXgpOyB9KTtcblxuICAgIC8vIFJlbW92ZSBvbGQgZmlsdGVycyBhbmQgZGF0YSBieSBvdmVyd3JpdGluZy5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSBmaWx0ZXJzLmNvcHkoaiwgaSksIGRhdGFbal0gPSBkYXRhW2ldO1xuICAgICAgICArK2o7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5sZW5ndGggPSBuID0gajtcbiAgICBmaWx0ZXJzLnRydW5jYXRlKGopO1xuICAgIHRyaWdnZXJPbkNoYW5nZSgnZGF0YVJlbW92ZWQnKTtcbiAgfVxuXG4gIC8vIEFkZHMgYSBuZXcgZGltZW5zaW9uIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZSBhY2Nlc3NvciBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gZGltZW5zaW9uKHZhbHVlLCBpdGVyYWJsZSkge1xuICAgIHZhciBkaW1lbnNpb24gPSB7XG4gICAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICAgIGZpbHRlckV4YWN0OiBmaWx0ZXJFeGFjdCxcbiAgICAgIGZpbHRlclJhbmdlOiBmaWx0ZXJSYW5nZSxcbiAgICAgIGZpbHRlckZ1bmN0aW9uOiBmaWx0ZXJGdW5jdGlvbixcbiAgICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgICAgdG9wOiB0b3AsXG4gICAgICBib3R0b206IGJvdHRvbSxcbiAgICAgIGdyb3VwOiBncm91cCxcbiAgICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciBvbmUsIC8vIGxvd2VzdCB1bnNldCBiaXQgYXMgbWFzaywgZS5nLiwgMDAwMDEwMDBcbiAgICAgICAgemVybywgLy8gaW52ZXJ0ZWQgb25lLCBlLmcuLCAxMTExMDExMVxuICAgICAgICBvZmZzZXQsIC8vIG9mZnNldCBpbnRvIHRoZSBmaWx0ZXJzIGFycmF5c1xuICAgICAgICB2YWx1ZXMsIC8vIHNvcnRlZCwgY2FjaGVkIGFycmF5XG4gICAgICAgIGluZGV4LCAvLyB2YWx1ZSByYW5rIOKGpiBvYmplY3QgaWRcbiAgICAgICAgb2xkVmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBwcmV2aW91c2x5LWFkZGVkIHZhbHVlc1xuICAgICAgICBvbGRJbmRleCwgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgcHJldmlvdXNseS1hZGRlZCBpbmRleFxuICAgICAgICBuZXdWYWx1ZXMsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIHZhbHVlc1xuICAgICAgICBuZXdJbmRleCwgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgaW5kZXhcbiAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudCxcbiAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudCxcbiAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMsXG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzLFxuICAgICAgICBzb3J0ID0gcXVpY2tzb3J0X2J5KGZ1bmN0aW9uKGkpIHsgcmV0dXJuIG5ld1ZhbHVlc1tpXTsgfSksXG4gICAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsLCAvLyBmb3IgcmVjb21wdXRpbmcgZmlsdGVyXG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24sIC8vIHRoZSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uIGluIHVzZVxuICAgICAgICBpbmRleExpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgICAgZGltZW5zaW9uR3JvdXBzID0gW10sXG4gICAgICAgIGxvMCA9IDAsXG4gICAgICAgIGhpMCA9IDAsXG4gICAgICAgIHQgPSAwO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEFkZCBhIG5ldyBkaW1lbnNpb24gaW4gdGhlIGZpbHRlciBiaXRtYXAgYW5kIHN0b3JlIHRoZSBvZmZzZXQgYW5kIGJpdG1hc2suXG4gICAgdmFyIHRtcCA9IGZpbHRlcnMuYWRkKCk7XG4gICAgb2Zmc2V0ID0gdG1wLm9mZnNldDtcbiAgICBvbmUgPSB0bXAub25lO1xuICAgIHplcm8gPSB+b25lO1xuXG4gICAgcHJlQWRkKGRhdGEsIDAsIG4pO1xuICAgIHBvc3RBZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyBpbnRvIHRoaXMgZGltZW5zaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGZpbHRlcnMsIHZhbHVlcywgYW5kIGluZGV4LlxuICAgIGZ1bmN0aW9uIHByZUFkZChuZXdEYXRhLCBuMCwgbjEpIHtcblxuICAgICAgaWYgKGl0ZXJhYmxlKXtcbiAgICAgICAgLy8gQ291bnQgYWxsIHRoZSB2YWx1ZXNcbiAgICAgICAgdCA9IDA7XG4gICAgICAgIGogPSAwO1xuICAgICAgICBrID0gW107XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG5ld0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmb3IoaiA9IDAsIGsgPSB2YWx1ZShuZXdEYXRhW2ldKTsgaiA8IGsubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHQrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBuZXdWYWx1ZXMgPSBbXTtcbiAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudCA9IGNyb3NzZmlsdGVyX3JhbmdlKG5ld0RhdGEubGVuZ3RoKTtcbiAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBjcm9zc2ZpbHRlcl9pbmRleCh0LDEpO1xuICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3MgPSBbXTtcbiAgICAgICAgdmFyIHVuc29ydGVkSW5kZXggPSBjcm9zc2ZpbHRlcl9yYW5nZSh0KTtcblxuICAgICAgICBmb3IgKGwgPSAwLCBpID0gMDsgaSA8IG5ld0RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBrID0gdmFsdWUobmV3RGF0YVtpXSlcbiAgICAgICAgICAvL1xuICAgICAgICAgIGlmKCFrLmxlbmd0aCl7XG4gICAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2ldID0gMDtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cy5wdXNoKGkpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnRbaV0gPSBrLmxlbmd0aFxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBuZXdWYWx1ZXMucHVzaChrW2pdKTtcbiAgICAgICAgICAgIHVuc29ydGVkSW5kZXhbbF0gPSBpO1xuICAgICAgICAgICAgbCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgU29ydCBtYXAgdXNlZCB0byBzb3J0IGJvdGggdGhlIHZhbHVlcyBhbmQgdGhlIHZhbHVlVG9EYXRhIGluZGljZXNcbiAgICAgICAgdmFyIHNvcnRNYXAgPSBzb3J0KGNyb3NzZmlsdGVyX3JhbmdlKHQpLCAwLCB0KTtcblxuICAgICAgICAvLyBVc2UgdGhlIHNvcnRNYXAgdG8gc29ydCB0aGUgbmV3VmFsdWVzXG4gICAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBzb3J0TWFwKTtcblxuXG4gICAgICAgIC8vIFVzZSB0aGUgc29ydE1hcCB0byBzb3J0IHRoZSB1bnNvcnRlZEluZGV4IG1hcFxuICAgICAgICAvLyBuZXdJbmRleCBzaG91bGQgYmUgYSBtYXAgb2Ygc29ydGVkVmFsdWUgLT4gY3Jvc3NmaWx0ZXJEYXRhXG4gICAgICAgIG5ld0luZGV4ID0gcGVybXV0ZSh1bnNvcnRlZEluZGV4LCBzb3J0TWFwKVxuXG4gICAgICB9IGVsc2V7XG4gICAgICAgIC8vIFBlcm11dGUgbmV3IHZhbHVlcyBpbnRvIG5hdHVyYWwgb3JkZXIgdXNpbmcgYSBzdGFuZGFyZCBzb3J0ZWQgaW5kZXguXG4gICAgICAgIG5ld1ZhbHVlcyA9IG5ld0RhdGEubWFwKHZhbHVlKTtcbiAgICAgICAgbmV3SW5kZXggPSBzb3J0KGNyb3NzZmlsdGVyX3JhbmdlKG4xKSwgMCwgbjEpO1xuICAgICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgbmV3SW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICBuMSA9IHQ7XG4gICAgICB9XG5cbiAgICAgIC8vIEJpc2VjdCBuZXdWYWx1ZXMgdG8gZGV0ZXJtaW5lIHdoaWNoIG5ldyByZWNvcmRzIGFyZSBzZWxlY3RlZC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcihuZXdWYWx1ZXMpLCBsbzEgPSBib3VuZHNbMF0sIGhpMSA9IGJvdW5kc1sxXTtcbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpXSwgaSkpIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvMTsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSAxO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IGhpMTsgaSA8IG4xOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQgPSBuZXdJdGVyYWJsZXNJbmRleENvdW50O1xuICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG5cblxuICAgICAgb2xkVmFsdWVzID0gdmFsdWVzLFxuICAgICAgICBvbGRJbmRleCA9IGluZGV4LFxuICAgICAgICBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzXG4gICAgICAgIGkwID0gMCxcbiAgICAgICAgaTEgPSAwO1xuXG4gICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgIG9sZF9uMCA9IG4wXG4gICAgICAgIG4wID0gb2xkVmFsdWVzLmxlbmd0aDtcbiAgICAgICAgbjEgPSB0XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG5ldyBhcnJheXMgaW50byB3aGljaCB0byBtZXJnZSBuZXcgYW5kIG9sZC5cbiAgICAgIHZhbHVlcyA9IGl0ZXJhYmxlID8gbmV3IEFycmF5KG4wICsgbjEpIDogbmV3IEFycmF5KG4pO1xuICAgICAgaW5kZXggPSBpdGVyYWJsZSA/IG5ldyBBcnJheShuMCArIG4xKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgobjAgKyBuMSwgMSk7XG5cbiAgICAgIC8vIENvbmNhdGVuYXRlIHRoZSBuZXdJdGVyYWJsZXNJbmRleENvdW50IG9udG8gdGhlIG9sZCBvbmUuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICB2YXIgb2xkaWljbGVuZ3RoID0gaXRlcmFibGVzSW5kZXhDb3VudC5sZW5ndGg7XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQgPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGl0ZXJhYmxlc0luZGV4Q291bnQsIG4pO1xuICAgICAgICBmb3IodmFyIGo9MDsgaitvbGRpaWNsZW5ndGggPCBuOyBqKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W2orb2xkaWljbGVuZ3RoXSA9IG5ld0l0ZXJhYmxlc0luZGV4Q291bnRbal07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTWVyZ2UgdGhlIG9sZCBhbmQgbmV3IHNvcnRlZCB2YWx1ZXMsIGFuZCBvbGQgYW5kIG5ldyBpbmRleC5cbiAgICAgIGZvciAoaSA9IDA7IGkwIDwgbjAgJiYgaTEgPCBuMTsgKytpKSB7XG4gICAgICAgIGlmIChvbGRWYWx1ZXNbaTBdIDwgbmV3VmFsdWVzW2kxXSkge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTArK107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMSsrXSArIChpdGVyYWJsZSA/IG9sZF9uMCA6IG4wKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgdmFsdWVzLlxuICAgICAgZm9yICg7IGkwIDwgbjA7ICsraTAsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMF07XG4gICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICBpZihpdGVyYWJsZSkgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSBvbGRJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpMV07XG4gICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTFdICsgKGl0ZXJhYmxlID8gb2xkX24wIDogbjApO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKSwgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gV2hlbiBhbGwgZmlsdGVycyBoYXZlIHVwZGF0ZWQsIG5vdGlmeSBpbmRleCBsaXN0ZW5lcnMgb2YgdGhlIG5ldyB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gcG9zdEFkZChuZXdEYXRhLCBuMCwgbjEpIHtcbiAgICAgIGluZGV4TGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSk7IH0pO1xuICAgICAgbmV3VmFsdWVzID0gbmV3SW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGsgPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gaikgdmFsdWVzW2pdID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGluZGV4W2pdID0gcmVJbmRleFtrXTtcbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcblxuICAgICAgdmFyIGxvMSA9IGJvdW5kc1swXSxcbiAgICAgICAgICBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBudWxsO1xuICAgICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGxvMSA8PSBpICYmIGkgPCBoaTE7IH0sIGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IGluZGV4Lmxlbmd0aCk7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgICAgfVxuXG4gICAgICB2YXIgaSxcbiAgICAgICAgICBqLFxuICAgICAgICAgIGssXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQgPSBbXTtcblxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBsbyBpbmRleC5cbiAgICAgIGlmIChsbzEgPCBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8xLCBqID0gTWF0aC5taW4obG8wLCBoaTEpOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBoaSBpbmRleC5cbiAgICAgIGlmIChoaTEgPiBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8xLCBoaTApLCBqID0gaGkxOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgYWRkZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaGkxIDwgaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMCwgaGkxKSwgaiA9IGhpMDsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgLy8gRmxpcCBmaWx0ZXJzIG5vcm1hbGx5LlxuXG4gICAgICAgIGZvcihpPTA7IGk8YWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpPTA7IGk8cmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIGl0ZXJhYmxlcywgd2UgbmVlZCB0byBmaWd1cmUgb3V0IGlmIHRoZSByb3cgaGFzIGJlZW4gY29tcGxldGVseSByZW1vdmVkIHZzIHBhcnRpYWxseSBpbmNsdWRlZFxuICAgICAgICAvLyBPbmx5IGNvdW50IGEgcm93IGFzIGFkZGVkIGlmIGl0IGlzIG5vdCBhbHJlYWR5IGJlaW5nIGFnZ3JlZ2F0ZWQuIE9ubHkgY291bnQgYSByb3dcbiAgICAgICAgLy8gYXMgcmVtb3ZlZCBpZiB0aGUgbGFzdCBlbGVtZW50IGJlaW5nIGFnZ3JlZ2F0ZWQgaXMgcmVtb3ZlZC5cblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPSAwO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dID09PSAxKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld0FkZGVkLnB1c2goYWRkZWRbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9IDE7XG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFtyZW1vdmVkW2ldXSA9PT0gMCkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgIG5ld1JlbW92ZWQucHVzaChyZW1vdmVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRlZCA9IG5ld0FkZGVkO1xuICAgICAgICByZW1vdmVkID0gbmV3UmVtb3ZlZDtcblxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGJvdW5kc1swXSA9PT0gMCAmJiBib3VuZHNbMV0gPT09IGluZGV4Lmxlbmd0aCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbG8wID0gbG8xO1xuICAgICAgaGkwID0gaGkxO1xuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIHRoZSBzcGVjaWZpZWQgcmFuZ2UsIHZhbHVlLCBvciBudWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBudWxsLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyQWxsLlxuICAgIC8vIElmIHRoZSByYW5nZSBpcyBhbiBhcnJheSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlclJhbmdlLlxuICAgIC8vIE90aGVyd2lzZSwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckV4YWN0LlxuICAgIGZ1bmN0aW9uIGZpbHRlcihyYW5nZSkge1xuICAgICAgcmV0dXJuIHJhbmdlID09IG51bGxcbiAgICAgICAgICA/IGZpbHRlckFsbCgpIDogQXJyYXkuaXNBcnJheShyYW5nZSlcbiAgICAgICAgICA/IGZpbHRlclJhbmdlKHJhbmdlKSA6IHR5cGVvZiByYW5nZSA9PT0gXCJmdW5jdGlvblwiXG4gICAgICAgICAgPyBmaWx0ZXJGdW5jdGlvbihyYW5nZSlcbiAgICAgICAgICA6IGZpbHRlckV4YWN0KHJhbmdlKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgZXhhY3QgdmFsdWUuXG4gICAgZnVuY3Rpb24gZmlsdGVyRXhhY3QodmFsdWUpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIHNwZWNpZmllZCByYW5nZSBbbG8sIGhpXS5cbiAgICAvLyBUaGUgbG93ZXIgYm91bmQgaXMgaW5jbHVzaXZlLCBhbmQgdGhlIHVwcGVyIGJvdW5kIGlzIGV4Y2x1c2l2ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJSYW5nZShyYW5nZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBDbGVhcnMgYW55IGZpbHRlcnMgb24gdGhpcyBkaW1lbnNpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyQWxsKCkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyBhbiBhcmJpdHJhcnkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZmlsdGVyRnVuY3Rpb24oZikge1xuICAgICAgcmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGw7XG5cbiAgICAgIGZpbHRlckluZGV4RnVuY3Rpb24ocmVmaWx0ZXJGdW5jdGlvbiA9IGYsIGZhbHNlKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmLCBmaWx0ZXJBbGwpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgeCxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4QWRkZWQgPSBbXSxcbiAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIGluZGV4TGVuZ3RoID0gaW5kZXgubGVuZ3RoO1xuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZiAoIShmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSAmIG9uZSkgXiAhISh4ID0gZih2YWx1ZXNbaV0sIGkpKSkge1xuICAgICAgICAgICAgaWYgKHgpIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICBlbHNlIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaSA8IGluZGV4TGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBpZihmKHZhbHVlc1tpXSwgaSkpIHtcbiAgICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleEFkZGVkLnB1c2goaSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZWQucHVzaChpbmRleFtpXSk7XG4gICAgICAgICAgICB2YWx1ZUluZGV4UmVtb3ZlZC5wdXNoKGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZighaXRlcmFibGUpIHtcbiAgICAgICAgZm9yKGk9MDsgaTxhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJiBvbmUpIGZpbHRlcnNbb2Zmc2V0XVthZGRlZFtpXV0gJj0gemVybztcbiAgICAgICAgfVxuXG4gICAgICAgIGZvcihpPTA7IGk8cmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dICYgb25lKSkgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcblxuICAgICAgICB2YXIgbmV3QWRkZWQgPSBbXTtcbiAgICAgICAgdmFyIG5ld1JlbW92ZWQgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIGFkZGVkXG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0rK1xuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleEFkZGVkW2ldXSA9IDA7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3QWRkZWQucHVzaChhZGRlZFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCByZW1vdmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgLy8gRmlyc3QgY2hlY2sgdGhpcyBwYXJ0aWN1bGFyIHZhbHVlIG5lZWRzIHRvIGJlIHJlbW92ZWRcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0tLVxuICAgICAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID0gMTtcbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW3JlbW92ZWRbaV1dIF49IG9uZTtcbiAgICAgICAgICAgICAgbmV3UmVtb3ZlZC5wdXNoKHJlbW92ZWRbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGFkZGVkID0gbmV3QWRkZWQ7XG4gICAgICAgIHJlbW92ZWQgPSBuZXdSZW1vdmVkO1xuXG4gICAgICAgIC8vIE5vdyBoYW5kbGUgZW1wdHkgcm93cy5cbiAgICAgICAgaWYoZmlsdGVyQWxsKSB7XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZigoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgbm90IGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCBhZGRcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZmlsdGVyIGluIHBsYWNlIC0gcmVtb3ZlIGVtcHR5IHJvd3MgaWYgbmVjZXNzYXJ5XG4gICAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZighKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIGluIHRoZSBmaWx0ZXIsIHNvIHNldCB0aGUgZmlsdGVyIGFuZCByZW1vdmVcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2tdIF49IG9uZTtcbiAgICAgICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBvZmZzZXQsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICB0cmlnZ2VyT25DaGFuZ2UoJ2ZpbHRlcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGo7XG5cbiAgICAgIHdoaWxlICgtLWkgPj0gbG8wICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgZm9yKGkgPSAwOyBpIDwgaXRlcmFibGVzRW1wdHlSb3dzLmxlbmd0aCAmJiBrID4gMDsgaSsrKSB7XG4gICAgICAgICAgLy8gQWRkIGVtcHR5IHJvd3MgYXQgdGhlIGVuZFxuICAgICAgICAgIGlmKGZpbHRlcnMuemVybyhqID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldKSkge1xuICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgIC0taztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGJvdHRvbSBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiBib3R0b20oaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSxcbiAgICAgICAgICBqO1xuXG4gICAgICBpZihpdGVyYWJsZSkge1xuICAgICAgICAvLyBBZGQgZW1wdHkgcm93cyBhdCB0aGUgdG9wXG4gICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggJiYgayA+IDA7IGkrKykge1xuICAgICAgICAgIGlmKGZpbHRlcnMuemVybyhqID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldKSkge1xuICAgICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAgIC0taztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaSA9IGxvMDtcblxuICAgICAgd2hpbGUgKGkgPCBoaTAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gQWRkcyBhIG5ldyBncm91cCB0byB0aGlzIGRpbWVuc2lvbiwgdXNpbmcgdGhlIHNwZWNpZmllZCBrZXkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZ3JvdXAoa2V5KSB7XG4gICAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICAgIHRvcDogdG9wLFxuICAgICAgICBhbGw6IGFsbCxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICAgIG9yZGVyOiBvcmRlcixcbiAgICAgICAgb3JkZXJOYXR1cmFsOiBvcmRlck5hdHVyYWwsXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZ3JvdXAgd2lsbCBiZSByZW1vdmVkIHdoZW4gdGhlIGRpbWVuc2lvbiBpcyByZW1vdmVkLlxuICAgICAgZGltZW5zaW9uR3JvdXBzLnB1c2goZ3JvdXApO1xuXG4gICAgICB2YXIgZ3JvdXBzLCAvLyBhcnJheSBvZiB7a2V5LCB2YWx1ZX1cbiAgICAgICAgICBncm91cEluZGV4LCAvLyBvYmplY3QgaWQg4oamIGdyb3VwIGlkXG4gICAgICAgICAgZ3JvdXBXaWR0aCA9IDgsXG4gICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpLFxuICAgICAgICAgIGsgPSAwLCAvLyBjYXJkaW5hbGl0eVxuICAgICAgICAgIHNlbGVjdCxcbiAgICAgICAgICBoZWFwLFxuICAgICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldE5lZWRlZCA9IHRydWUsXG4gICAgICAgICAgZ3JvdXBBbGwgPSBrZXkgPT09IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkga2V5ID0gY3Jvc3NmaWx0ZXJfaWRlbnRpdHk7XG5cbiAgICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIGFzc29jaWF0ZWQgcmVkdWNlIHZhbHVlcy4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0b1xuICAgICAgLy8gdGhlIHBhcmVudCBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZCwgYW5kIGNvbXB1dGUgbmV3IGtleXMuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgICAgaW5kZXhMaXN0ZW5lcnMucHVzaChhZGQpO1xuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoZSBncm91cGluZy5cbiAgICAgIGFkZCh2YWx1ZXMsIGluZGV4LCAwLCBuKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBncm91cHMgYW5kIGdyb3VwSW5kZXguXG4gICAgICBmdW5jdGlvbiBhZGQobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKSB7XG5cbiAgICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgICBuMG9sZCA9IG4wXG4gICAgICAgICAgbjAgPSB2YWx1ZXMubGVuZ3RoIC0gbmV3VmFsdWVzLmxlbmd0aFxuICAgICAgICAgIG4xID0gbmV3VmFsdWVzLmxlbmd0aDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICByZUluZGV4ID0gaXRlcmFibGUgPyBbXSA6IGNyb3NzZmlsdGVyX2luZGV4KGssIGdyb3VwQ2FwYWNpdHkpLFxuICAgICAgICAgICAgYWRkID0gcmVkdWNlQWRkLFxuICAgICAgICAgICAgcmVtb3ZlID0gcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgICAgaW5pdGlhbCA9IHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgICBrMCA9IGssIC8vIG9sZCBjYXJkaW5hbGl0eVxuICAgICAgICAgICAgaTAgPSAwLCAvLyBpbmRleCBvZiBvbGQgZ3JvdXBcbiAgICAgICAgICAgIGkxID0gMCwgLy8gaW5kZXggb2YgbmV3IHJlY29yZFxuICAgICAgICAgICAgaiwgLy8gb2JqZWN0IGlkXG4gICAgICAgICAgICBnMCwgLy8gb2xkIGdyb3VwXG4gICAgICAgICAgICB4MCwgLy8gb2xkIGtleVxuICAgICAgICAgICAgeDEsIC8vIG5ldyBrZXlcbiAgICAgICAgICAgIGcsIC8vIGdyb3VwIHRvIGFkZFxuICAgICAgICAgICAgeDsgLy8ga2V5IG9mIGdyb3VwIHRvIGFkZFxuXG4gICAgICAgIC8vIElmIGEgcmVzZXQgaXMgbmVlZGVkLCB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlcy5cbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSBhZGQgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZW1vdmUgPSBpbml0aWFsID0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgICAvLyBSZXNldCB0aGUgbmV3IGdyb3VwcyAoayBpcyBhIGxvd2VyIGJvdW5kKS5cbiAgICAgICAgLy8gQWxzbywgbWFrZSBzdXJlIHRoYXQgZ3JvdXBJbmRleCBleGlzdHMgYW5kIGlzIGxvbmcgZW5vdWdoLlxuICAgICAgICBncm91cHMgPSBuZXcgQXJyYXkoayksIGsgPSAwO1xuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IGdyb3VwSW5kZXggOiBbXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNle1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGdyb3VwSW5kZXgsIG4pIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgZ3JvdXBDYXBhY2l0eSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEdldCB0aGUgZmlyc3Qgb2xkIGtleSAoeDAgb2YgZzApLCBpZiBpdCBleGlzdHMuXG4gICAgICAgIGlmIChrMCkgeDAgPSAoZzAgPSBvbGRHcm91cHNbMF0pLmtleTtcblxuICAgICAgICAvLyBGaW5kIHRoZSBmaXJzdCBuZXcga2V5ICh4MSksIHNraXBwaW5nIE5hTiBrZXlzLlxuICAgICAgICB3aGlsZSAoaTEgPCBuMSAmJiAhKCh4MSA9IGtleShuZXdWYWx1ZXNbaTFdKSkgPj0geDEpKSArK2kxO1xuXG4gICAgICAgIC8vIFdoaWxlIG5ldyBrZXlzIHJlbWFpbuKAplxuICAgICAgICB3aGlsZSAoaTEgPCBuMSkge1xuXG4gICAgICAgICAgLy8gRGV0ZXJtaW5lIHRoZSBsZXNzZXIgb2YgdGhlIHR3byBjdXJyZW50IGtleXM7IG5ldyBhbmQgb2xkLlxuICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBvbGQga2V5cyByZW1haW5pbmcsIHRoZW4gYWx3YXlzIGFkZCB0aGUgbmV3IGtleS5cbiAgICAgICAgICBpZiAoZzAgJiYgeDAgPD0geDEpIHtcbiAgICAgICAgICAgIGcgPSBnMCwgeCA9IHgwO1xuXG4gICAgICAgICAgICAvLyBSZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICAgICAgcmVJbmRleFtpMF0gPSBrO1xuXG4gICAgICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgbmV4dCBvbGQga2V5LlxuICAgICAgICAgICAgaWYgKGcwID0gb2xkR3JvdXBzWysraTBdKSB4MCA9IGcwLmtleTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZyA9IHtrZXk6IHgxLCB2YWx1ZTogaW5pdGlhbCgpfSwgeCA9IHgxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIEFkZCB0aGUgbGVzc2VyIGdyb3VwLlxuICAgICAgICAgIGdyb3Vwc1trXSA9IGc7XG5cbiAgICAgICAgICAvLyBBZGQgYW55IHNlbGVjdGVkIHJlY29yZHMgYmVsb25naW5nIHRvIHRoZSBhZGRlZCBncm91cCwgd2hpbGVcbiAgICAgICAgICAvLyBhZHZhbmNpbmcgdGhlIG5ldyBrZXkgYW5kIHBvcHVsYXRpbmcgdGhlIGFzc29jaWF0ZWQgZ3JvdXAgaW5kZXguXG5cbiAgICAgICAgICB3aGlsZSAoeDEgPD0geCkge1xuICAgICAgICAgICAgaiA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG4wb2xkIDogbjApXG5cblxuICAgICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgICBpZihncm91cEluZGV4W2pdKXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdLnB1c2goaylcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBba11cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXSA9IGs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFsd2F5cyBhZGQgbmV3IHZhbHVlcyB0byBncm91cHMuIE9ubHkgcmVtb3ZlIHdoZW4gbm90IGluIGZpbHRlci5cbiAgICAgICAgICAgIC8vIFRoaXMgZ2l2ZXMgZ3JvdXBzIGZ1bGwgaW5mb3JtYXRpb24gb24gZGF0YSBsaWZlLWN5Y2xlLlxuICAgICAgICAgICAgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdLCB0cnVlKTtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGosIG9mZnNldCwgemVybykpIGcudmFsdWUgPSByZW1vdmUoZy52YWx1ZSwgZGF0YVtqXSwgZmFsc2UpO1xuICAgICAgICAgICAgaWYgKCsraTEgPj0gbjEpIGJyZWFrO1xuICAgICAgICAgICAgeDEgPSBrZXkobmV3VmFsdWVzW2kxXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCBncm91cHMgdGhhdCB3ZXJlIGdyZWF0ZXIgdGgxYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEZpbGwgaW4gZ2FwcyB3aXRoIGVtcHR5IGFycmF5cyB3aGVyZSB0aGVyZSBtYXkgaGF2ZSBiZWVuIHJvd3Mgd2l0aCBlbXB0eSBpdGVyYWJsZXNcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBncm91cEluZGV4Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZighZ3JvdXBJbmRleFtpXSl7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbaV0gPSBbXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZihrID4gaTApe1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBwZXJtdXRlKGdyb3VwSW5kZXgsIHJlSW5kZXgsIHRydWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE1vZGlmeSB0aGUgdXBkYXRlIGFuZCByZXNldCBiZWhhdmlvciBiYXNlZCBvbiB0aGUgY2FyZGluYWxpdHkuXG4gICAgICAgIC8vIElmIHRoZSBjYXJkaW5hbGl0eSBpcyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gb25lLCB0aGVuIHRoZSBncm91cEluZGV4XG4gICAgICAgIC8vIGlzIG5vdCBuZWVkZWQuIElmIHRoZSBjYXJkaW5hbGl0eSBpcyB6ZXJvLCB0aGVuIHRoZXJlIGFyZSBubyByZWNvcmRzXG4gICAgICAgIC8vIGFuZCB0aGVyZWZvcmUgbm8gZ3JvdXBzIHRvIHVwZGF0ZSBvciByZXNldC4gTm90ZSB0aGF0IHdlIGFsc28gbXVzdFxuICAgICAgICAvLyBjaGFuZ2UgdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgdG8gcG9pbnQgdG8gdGhlIG5ldyBtZXRob2QuXG4gICAgICAgIGogPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVNYW55O1xuICAgICAgICAgIHJlc2V0ID0gcmVzZXRNYW55O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICghayAmJiBncm91cEFsbCkge1xuICAgICAgICAgICAgayA9IDE7XG4gICAgICAgICAgICBncm91cHMgPSBbe2tleTogbnVsbCwgdmFsdWU6IGluaXRpYWwoKX1dO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoayA9PT0gMSkge1xuICAgICAgICAgICAgdXBkYXRlID0gdXBkYXRlT25lO1xuICAgICAgICAgICAgcmVzZXQgPSByZXNldE9uZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2pdID0gdXBkYXRlO1xuXG4gICAgICAgIC8vIENvdW50IHRoZSBudW1iZXIgb2YgYWRkZWQgZ3JvdXBzLFxuICAgICAgICAvLyBhbmQgd2lkZW4gdGhlIGdyb3VwIGluZGV4IGFzIG5lZWRlZC5cbiAgICAgICAgZnVuY3Rpb24gZ3JvdXBJbmNyZW1lbnQoKSB7XG4gICAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgICAgaysrXG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCsrayA9PT0gZ3JvdXBDYXBhY2l0eSkge1xuICAgICAgICAgICAgcmVJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4ocmVJbmRleCwgZ3JvdXBXaWR0aCA8PD0gMSk7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihncm91cEluZGV4LCBncm91cFdpZHRoKTtcbiAgICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdmFyIG9sZEsgPSBrLFxuICAgICAgICAgICAgICBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICAgIHNlZW5Hcm91cHMgPSBjcm9zc2ZpbHRlcl9pbmRleChvbGRLLCBvbGRLKTtcblxuICAgICAgICAgIC8vIEZpbHRlciBvdXQgbm9uLW1hdGNoZXMgYnkgY29weWluZyBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzIHRvXG4gICAgICAgICAgLy8gdGhlIGJlZ2lubmluZyBvZiB0aGUgYXJyYXkuXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbal0gPSBncm91cEluZGV4W2ldXSA9IDE7XG4gICAgICAgICAgICAgICsrajtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBSZWFzc2VtYmxlIGdyb3VwcyBpbmNsdWRpbmcgb25seSB0aG9zZSBncm91cHMgdGhhdCB3ZXJlIHJlZmVycmVkXG4gICAgICAgICAgLy8gdG8gYnkgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcy4gIE5vdGUgdGhlIG5ldyBncm91cCBpbmRleCBpblxuICAgICAgICAgIC8vIHNlZW5Hcm91cHMuXG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBvbGRLOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChzZWVuR3JvdXBzW2ldKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbaV0gPSBrKys7XG4gICAgICAgICAgICAgIGdyb3Vwcy5wdXNoKG9sZEdyb3Vwc1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgICAvLyBSZWluZGV4IHRoZSBncm91cCBpbmRleCB1c2luZyBzZWVuR3JvdXBzIHRvIGZpbmQgdGhlIG5ldyBpbmRleC5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgajsgKytpKSBncm91cEluZGV4W2ldID0gc2Vlbkdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9IGsgPiAxXG4gICAgICAgICAgICAgID8gKHJlc2V0ID0gcmVzZXRNYW55LCB1cGRhdGUgPSB1cGRhdGVNYW55KVxuICAgICAgICAgICAgICA6IGsgPT09IDEgPyAocmVzZXQgPSByZXNldE9uZSwgdXBkYXRlID0gdXBkYXRlT25lKVxuICAgICAgICAgICAgICA6IHJlc2V0ID0gdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfSBlbHNlIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgaWYgKGdyb3VwQWxsKSByZXR1cm47XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIGlmICghZmlsdGVycy56ZXJvKGkpKSByZXR1cm47XG4gICAgICAgICAgZ3JvdXBzID0gW10sIGsgPSAwO1xuICAgICAgICAgIGZpbHRlckxpc3RlbmVyc1tmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpXSA9XG4gICAgICAgICAgdXBkYXRlID0gcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU1hbnkoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcblxuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZztcblxuICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhba10ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2tdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlciwgaik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU9uZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE1hbnkoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgaixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gUmVzZXQgYWxsIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkge1xuICAgICAgICAgIGdyb3Vwc1tpXS52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXVtqXV07XG4gICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSwgaik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IGdyb3VwSW5kZXhbaV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1bal1dO1xuICAgICAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRPbmUoKSB7XG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBSZXNldCB0aGUgc2luZ2xldG9uIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgICAvLyBXZSBhZGQgYWxsIHJlY29yZHMgYW5kIHRoZW4gcmVtb3ZlIGZpbHRlcmVkIHJlY29yZHMgc28gdGhhdCByZWR1Y2Vyc1xuICAgICAgICAvLyBjYW4gYnVpbGQgYW4gJ3VuZmlsdGVyZWQnIHZpZXcgZXZlbiBpZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzIGluXG4gICAgICAgIC8vIHBsYWNlIG9uIG90aGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGksIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBhcnJheSBvZiBncm91cCB2YWx1ZXMsIGluIHRoZSBkaW1lbnNpb24ncyBuYXR1cmFsIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gYWxsKCkge1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB0aGUgdG9wIEsgZ3JvdXAgdmFsdWVzLCBpbiByZWR1Y2Ugb3JkZXIuXG4gICAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgICB2YXIgdG9wID0gc2VsZWN0KGFsbCgpLCAwLCBncm91cHMubGVuZ3RoLCBrKTtcbiAgICAgICAgcmV0dXJuIGhlYXAuc29ydCh0b3AsIDAsIHRvcC5sZW5ndGgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZXMsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSByZWR1Y2Ugb3JkZXIsIHVzaW5nIHRoZSBzcGVjaWZpZWQgYWNjZXNzb3IuXG4gICAgICBmdW5jdGlvbiBvcmRlcih2YWx1ZSkge1xuICAgICAgICBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KHZhbHVlT2YpO1xuICAgICAgICBoZWFwID0gaGVhcF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgZnVuY3Rpb24gdmFsdWVPZihkKSB7IHJldHVybiB2YWx1ZShkLnZhbHVlKTsgfVxuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBuYXR1cmFsIG9yZGVyaW5nIGJ5IHJlZHVjZSB2YWx1ZS5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyTmF0dXJhbCgpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyKGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgY2FyZGluYWxpdHkgb2YgdGhpcyBncm91cCwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICAgICAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICAgICAgcmV0dXJuIGs7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSBpbmRleExpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICAgIGlmIChpID49IDApIGluZGV4TGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlZHVjZUNvdW50KCkub3JkZXJOYXR1cmFsKCk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBmdW5jdGlvbiBmb3IgZ2VuZXJhdGluZyBhIHNpbmdsZXRvbiBncm91cC5cbiAgICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICAgIHZhciBnID0gZ3JvdXAoY3Jvc3NmaWx0ZXJfbnVsbCksIGFsbCA9IGcuYWxsO1xuICAgICAgZGVsZXRlIGcuYWxsO1xuICAgICAgZGVsZXRlIGcudG9wO1xuICAgICAgZGVsZXRlIGcub3JkZXI7XG4gICAgICBkZWxldGUgZy5vcmRlck5hdHVyYWw7XG4gICAgICBkZWxldGUgZy5zaXplO1xuICAgICAgZy52YWx1ZSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gYWxsKClbMF0udmFsdWU7IH07XG4gICAgICByZXR1cm4gZztcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZGltZW5zaW9uIGFuZCBhc3NvY2lhdGVkIGdyb3VwcyBhbmQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICBkaW1lbnNpb25Hcm91cHMuZm9yRWFjaChmdW5jdGlvbihncm91cCkgeyBncm91cC5kaXNwb3NlKCk7IH0pO1xuICAgICAgdmFyIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocHJlQWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwb3N0QWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgaSA9IHJlbW92ZURhdGFMaXN0ZW5lcnMuaW5kZXhPZihyZW1vdmVEYXRhKTtcbiAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgZmlsdGVycy5tYXNrc1tvZmZzZXRdICY9IHplcm87XG4gICAgICByZXR1cm4gZmlsdGVyQWxsKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgfVxuXG4gIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciBncm91cEFsbCBvbiBhIGR1bW15IGRpbWVuc2lvbi5cbiAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBjYW4gYmUgb3B0aW1pemVkIHNpbmNlIGl0IGFsd2F5cyBoYXMgY2FyZGluYWxpdHkgMS5cbiAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgdmFyIGdyb3VwID0ge1xuICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgfTtcblxuICAgIHZhciByZWR1Y2VWYWx1ZSxcbiAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcblxuICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWUuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG8gdGhlIHBhcmVudFxuICAgIC8vIGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLlxuICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKGFkZCk7XG5cbiAgICAvLyBGb3IgY29uc2lzdGVuY3k7IGFjdHVhbGx5IGEgbm8tb3Agc2luY2UgcmVzZXROZWVkZWQgaXMgdHJ1ZS5cbiAgICBhZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICBmdW5jdGlvbiBhZGQobmV3RGF0YSwgbjApIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IG4wOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICBmdW5jdGlvbiB1cGRhdGUoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgIHZhciBpLFxuICAgICAgICAgIGssXG4gICAgICAgICAgbjtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGsgPSBhZGRlZFtpXSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLm9ubHkoayA9IHJlbW92ZWRbaV0sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlIGZyb20gc2NyYXRjaC5cbiAgICBmdW5jdGlvbiByZXNldCgpIHtcbiAgICAgIHZhciBpO1xuXG4gICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcblxuICAgICAgLy8gQ3ljbGUgdGhyb3VnaCBhbGwgdGhlIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGl0IGlzIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTZXRzIHRoZSByZWR1Y2UgYmVoYXZpb3IgZm9yIHRoaXMgZ3JvdXAgdG8gdXNlIHRoZSBzcGVjaWZpZWQgZnVuY3Rpb25zLlxuICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWUsIHdhaXRpbmcgdW50aWwgbmVlZGVkLlxuICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgcmVkdWNlUmVtb3ZlID0gcmVtb3ZlO1xuICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgIGZ1bmN0aW9uIHJlZHVjZUNvdW50KCkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IHN1bSh2YWx1ZSkuXG4gICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgY29tcHV0ZWQgcmVkdWNlIHZhbHVlLlxuICAgIGZ1bmN0aW9uIHZhbHVlKCkge1xuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHJlZHVjZVZhbHVlO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBncm91cCBhbmQgYXNzb2NpYXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgIGlmIChpID49IDApIGZpbHRlckxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKGFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVkdWNlQ291bnQoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIG51bWJlciBvZiByZWNvcmRzIGluIHRoaXMgY3Jvc3NmaWx0ZXIsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgZnVuY3Rpb24gc2l6ZSgpIHtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIHJhdyByb3cgZGF0YSBjb250YWluZWQgaW4gdGhpcyBjcm9zc2ZpbHRlclxuICBmdW5jdGlvbiBhbGwoKXtcbiAgICByZXR1cm4gZGF0YTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uQ2hhbmdlKGNiKXtcbiAgICBpZih0eXBlb2YgY2IgIT09ICdmdW5jdGlvbicpe1xuICAgICAgY29uc29sZS53YXJuKCdvbkNoYW5nZSBjYWxsYmFjayBwYXJhbWV0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIScpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjYWxsYmFja3MucHVzaChjYik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICBjYWxsYmFja3Muc3BsaWNlKGNhbGxiYWNrcy5pbmRleE9mKGNiKSwgMSk7XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRyaWdnZXJPbkNoYW5nZShldmVudE5hbWUpe1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjYWxsYmFja3NbaV0oZXZlbnROYW1lKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgPyBhZGQoYXJndW1lbnRzWzBdKVxuICAgICAgOiBjcm9zc2ZpbHRlcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhcnJheSBvZiBzaXplIG4sIGJpZyBlbm91Z2ggdG8gc3RvcmUgaWRzIHVwIHRvIG0uXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9pbmRleChuLCBtKSB7XG4gIHJldHVybiAobSA8IDB4MTAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5OCA6IG0gPCAweDEwMDAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5MTZcbiAgICAgIDogY3Jvc3NmaWx0ZXJfYXJyYXkzMikobik7XG59XG5cbi8vIENvbnN0cnVjdHMgYSBuZXcgYXJyYXkgb2Ygc2l6ZSBuLCB3aXRoIHNlcXVlbnRpYWwgdmFsdWVzIGZyb20gMCB0byBuIC0gMS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JhbmdlKG4pIHtcbiAgdmFyIHJhbmdlID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG4gIGZvciAodmFyIGkgPSAtMTsgKytpIDwgbjspIHJhbmdlW2ldID0gaTtcbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9jYXBhY2l0eSh3KSB7XG4gIHJldHVybiB3ID09PSA4XG4gICAgICA/IDB4MTAwIDogdyA9PT0gMTZcbiAgICAgID8gMHgxMDAwMFxuICAgICAgOiAweDEwMDAwMDAwMDtcbn1cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiBleHBvcnRzIHx8IHRoaXMpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9jcm9zc2ZpbHRlclwiKS5jcm9zc2ZpbHRlcjtcbiIsIi8qXHJcbiAqIE5hdHVyYWwgU29ydCBhbGdvcml0aG0gZm9yIEphdmFzY3JpcHQgLSBWZXJzaW9uIDAuNyAtIFJlbGVhc2VkIHVuZGVyIE1JVCBsaWNlbnNlXHJcbiAqIEF1dGhvcjogSmltIFBhbG1lciAoYmFzZWQgb24gY2h1bmtpbmcgaWRlYSBmcm9tIERhdmUgS29lbGxlKVxyXG4gKi9cclxuLypqc2hpbnQgdW51c2VkOmZhbHNlICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbmF0dXJhbFNvcnQgKGEsIGIpIHtcclxuXHRcInVzZSBzdHJpY3RcIjtcclxuXHR2YXIgcmUgPSAvKF4oWytcXC1dPyg/OjB8WzEtOV1cXGQqKSg/OlxcLlxcZCopPyg/OltlRV1bK1xcLV0/XFxkKyk/KT8kfF4weFswLTlhLWZdKyR8XFxkKykvZ2ksXHJcblx0XHRzcmUgPSAvKF5bIF0qfFsgXSokKS9nLFxyXG5cdFx0ZHJlID0gLyheKFtcXHcgXSssP1tcXHcgXSspP1tcXHcgXSssP1tcXHcgXStcXGQrOlxcZCsoOlxcZCspP1tcXHcgXT98XlxcZHsxLDR9W1xcL1xcLV1cXGR7MSw0fVtcXC9cXC1dXFxkezEsNH18XlxcdyssIFxcdysgXFxkKywgXFxkezR9KS8sXHJcblx0XHRocmUgPSAvXjB4WzAtOWEtZl0rJC9pLFxyXG5cdFx0b3JlID0gL14wLyxcclxuXHRcdGkgPSBmdW5jdGlvbihzKSB7IHJldHVybiBuYXR1cmFsU29ydC5pbnNlbnNpdGl2ZSAmJiAoJycgKyBzKS50b0xvd2VyQ2FzZSgpIHx8ICcnICsgczsgfSxcclxuXHRcdC8vIGNvbnZlcnQgYWxsIHRvIHN0cmluZ3Mgc3RyaXAgd2hpdGVzcGFjZVxyXG5cdFx0eCA9IGkoYSkucmVwbGFjZShzcmUsICcnKSB8fCAnJyxcclxuXHRcdHkgPSBpKGIpLnJlcGxhY2Uoc3JlLCAnJykgfHwgJycsXHJcblx0XHQvLyBjaHVuay90b2tlbml6ZVxyXG5cdFx0eE4gPSB4LnJlcGxhY2UocmUsICdcXDAkMVxcMCcpLnJlcGxhY2UoL1xcMCQvLCcnKS5yZXBsYWNlKC9eXFwwLywnJykuc3BsaXQoJ1xcMCcpLFxyXG5cdFx0eU4gPSB5LnJlcGxhY2UocmUsICdcXDAkMVxcMCcpLnJlcGxhY2UoL1xcMCQvLCcnKS5yZXBsYWNlKC9eXFwwLywnJykuc3BsaXQoJ1xcMCcpLFxyXG5cdFx0Ly8gbnVtZXJpYywgaGV4IG9yIGRhdGUgZGV0ZWN0aW9uXHJcblx0XHR4RCA9IHBhcnNlSW50KHgubWF0Y2goaHJlKSwgMTYpIHx8ICh4Ti5sZW5ndGggIT09IDEgJiYgeC5tYXRjaChkcmUpICYmIERhdGUucGFyc2UoeCkpLFxyXG5cdFx0eUQgPSBwYXJzZUludCh5Lm1hdGNoKGhyZSksIDE2KSB8fCB4RCAmJiB5Lm1hdGNoKGRyZSkgJiYgRGF0ZS5wYXJzZSh5KSB8fCBudWxsLFxyXG5cdFx0b0Z4TmNMLCBvRnlOY0w7XHJcblx0Ly8gZmlyc3QgdHJ5IGFuZCBzb3J0IEhleCBjb2RlcyBvciBEYXRlc1xyXG5cdGlmICh5RCkge1xyXG5cdFx0aWYgKCB4RCA8IHlEICkgeyByZXR1cm4gLTE7IH1cclxuXHRcdGVsc2UgaWYgKCB4RCA+IHlEICkgeyByZXR1cm4gMTsgfVxyXG5cdH1cclxuXHQvLyBuYXR1cmFsIHNvcnRpbmcgdGhyb3VnaCBzcGxpdCBudW1lcmljIHN0cmluZ3MgYW5kIGRlZmF1bHQgc3RyaW5nc1xyXG5cdGZvcih2YXIgY0xvYz0wLCBudW1TPU1hdGgubWF4KHhOLmxlbmd0aCwgeU4ubGVuZ3RoKTsgY0xvYyA8IG51bVM7IGNMb2MrKykge1xyXG5cdFx0Ly8gZmluZCBmbG9hdHMgbm90IHN0YXJ0aW5nIHdpdGggJzAnLCBzdHJpbmcgb3IgMCBpZiBub3QgZGVmaW5lZCAoQ2xpbnQgUHJpZXN0KVxyXG5cdFx0b0Z4TmNMID0gISh4TltjTG9jXSB8fCAnJykubWF0Y2gob3JlKSAmJiBwYXJzZUZsb2F0KHhOW2NMb2NdKSB8fCB4TltjTG9jXSB8fCAwO1xyXG5cdFx0b0Z5TmNMID0gISh5TltjTG9jXSB8fCAnJykubWF0Y2gob3JlKSAmJiBwYXJzZUZsb2F0KHlOW2NMb2NdKSB8fCB5TltjTG9jXSB8fCAwO1xyXG5cdFx0Ly8gaGFuZGxlIG51bWVyaWMgdnMgc3RyaW5nIGNvbXBhcmlzb24gLSBudW1iZXIgPCBzdHJpbmcgLSAoS3lsZSBBZGFtcylcclxuXHRcdGlmIChpc05hTihvRnhOY0wpICE9PSBpc05hTihvRnlOY0wpKSB7IHJldHVybiAoaXNOYU4ob0Z4TmNMKSkgPyAxIDogLTE7IH1cclxuXHRcdC8vIHJlbHkgb24gc3RyaW5nIGNvbXBhcmlzb24gaWYgZGlmZmVyZW50IHR5cGVzIC0gaS5lLiAnMDInIDwgMiAhPSAnMDInIDwgJzInXHJcblx0XHRlbHNlIGlmICh0eXBlb2Ygb0Z4TmNMICE9PSB0eXBlb2Ygb0Z5TmNMKSB7XHJcblx0XHRcdG9GeE5jTCArPSAnJztcclxuXHRcdFx0b0Z5TmNMICs9ICcnO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG9GeE5jTCA8IG9GeU5jTCkgeyByZXR1cm4gLTE7IH1cclxuXHRcdGlmIChvRnhOY0wgPiBvRnlOY0wpIHsgcmV0dXJuIDE7IH1cclxuXHR9XHJcblx0cmV0dXJuIDA7XHJcbn07XHJcbiIsIi8vIHZpbTp0cz00OnN0cz00OnN3PTQ6XG4vKiFcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEyIEtyaXMgS293YWwgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVRcbiAqIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvcmF3L21hc3Rlci9MSUNFTlNFXG4gKlxuICogV2l0aCBwYXJ0cyBieSBUeWxlciBDbG9zZVxuICogQ29weXJpZ2h0IDIwMDctMjAwOSBUeWxlciBDbG9zZSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBYIGxpY2Vuc2UgZm91bmRcbiAqIGF0IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbFxuICogRm9ya2VkIGF0IHJlZl9zZW5kLmpzIHZlcnNpb246IDIwMDktMDUtMTFcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IE1hcmsgTWlsbGVyXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUaGlzIGZpbGUgd2lsbCBmdW5jdGlvbiBwcm9wZXJseSBhcyBhIDxzY3JpcHQ+IHRhZywgb3IgYSBtb2R1bGVcbiAgICAvLyB1c2luZyBDb21tb25KUyBhbmQgTm9kZUpTIG9yIFJlcXVpcmVKUyBtb2R1bGUgZm9ybWF0cy4gIEluXG4gICAgLy8gQ29tbW9uL05vZGUvUmVxdWlyZUpTLCB0aGUgbW9kdWxlIGV4cG9ydHMgdGhlIFEgQVBJIGFuZCB3aGVuXG4gICAgLy8gZXhlY3V0ZWQgYXMgYSBzaW1wbGUgPHNjcmlwdD4sIGl0IGNyZWF0ZXMgYSBRIGdsb2JhbCBpbnN0ZWFkLlxuXG4gICAgLy8gTW9udGFnZSBSZXF1aXJlXG4gICAgaWYgKHR5cGVvZiBib290c3RyYXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBib290c3RyYXAoXCJwcm9taXNlXCIsIGRlZmluaXRpb24pO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIFByZWZlciB3aW5kb3cgb3ZlciBzZWxmIGZvciBhZGQtb24gc2NyaXB0cy4gVXNlIHNlbGYgZm9yXG4gICAgICAgIC8vIG5vbi13aW5kb3dlZCBjb250ZXh0cy5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBzZWxmO1xuXG4gICAgICAgIC8vIEdldCB0aGUgYHdpbmRvd2Agb2JqZWN0LCBzYXZlIHRoZSBwcmV2aW91cyBRIGdsb2JhbFxuICAgICAgICAvLyBhbmQgaW5pdGlhbGl6ZSBRIGFzIGEgZ2xvYmFsLlxuICAgICAgICB2YXIgcHJldmlvdXNRID0gZ2xvYmFsLlE7XG4gICAgICAgIGdsb2JhbC5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgICAgIC8vIEFkZCBhIG5vQ29uZmxpY3QgZnVuY3Rpb24gc28gUSBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAvLyBnbG9iYWwgbmFtZXNwYWNlLlxuICAgICAgICBnbG9iYWwuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ2xvYmFsLlEgPSBwcmV2aW91c1E7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcbiAgICAvLyBxdWV1ZSBmb3IgbGF0ZSB0YXNrcywgdXNlZCBieSB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nXG4gICAgdmFyIGxhdGVyUXVldWUgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cbiAgICAgICAgdmFyIHRhc2ssIGRvbWFpbjtcblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzaywgZG9tYWluKTtcblxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChsYXRlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFzayA9IGxhdGVyUXVldWUucG9wKCk7XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHNpbmdsZSBmdW5jdGlvbiBpbiB0aGUgYXN5bmMgcXVldWVcbiAgICBmdW5jdGlvbiBydW5TaW5nbGUodGFzaywgZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBwcm9jZXNzLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gRW5zdXJlIFEgaXMgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnQsIHdpdGggYSBgcHJvY2Vzcy5uZXh0VGlja2AuXG4gICAgICAgIC8vIFRvIHNlZSB0aHJvdWdoIGZha2UgTm9kZSBlbnZpcm9ubWVudHM6XG4gICAgICAgIC8vICogTW9jaGEgdGVzdCBydW5uZXIgLSBleHBvc2VzIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYFxuICAgICAgICAvLyAqIEJyb3dzZXJpZnkgLSBleHBvc2VzIGEgYHByb2Nlc3MubmV4VGlja2AgZnVuY3Rpb24gdGhhdCB1c2VzXG4gICAgICAgIC8vICAgYHNldFRpbWVvdXRgLiBJbiB0aGlzIGNhc2UgYHNldEltbWVkaWF0ZWAgaXMgcHJlZmVycmVkIGJlY2F1c2VcbiAgICAgICAgLy8gICAgaXQgaXMgZmFzdGVyLiBCcm93c2VyaWZ5J3MgYHByb2Nlc3MudG9TdHJpbmcoKWAgeWllbGRzXG4gICAgICAgIC8vICAgXCJbb2JqZWN0IE9iamVjdF1cIiwgd2hpbGUgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnRcbiAgICAgICAgLy8gICBgcHJvY2Vzcy5uZXh0VGljaygpYCB5aWVsZHMgXCJbb2JqZWN0IHByb2Nlc3NdXCIuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHRhc2sgYWZ0ZXIgYWxsIG90aGVyIHRhc2tzIGhhdmUgYmVlbiBydW5cbiAgICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZyB0aGF0IG5lZWRzIHRvIGhhcHBlblxuICAgIC8vIGFmdGVyIGFsbCBgdGhlbmBkIHRhc2tzIGhhdmUgYmVlbiBydW4uXG4gICAgbmV4dFRpY2sucnVuQWZ0ZXIgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBsYXRlclF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5RLnJlc29sdmUgPSBRO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzIGlmIFFfREVCVUcgaXMgc2V0XG5pZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5RX0RFQlVHKSB7XG4gICAgUS5sb25nU3RhY2tTdXBwb3J0ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShyZXNvbHZlZFByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWRcbiAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXIocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZS1zdHlsZSBjYWxsYmFjayB0aGF0IHdpbGwgcmVzb2x2ZSBvciByZWplY3QgdGhlIGRlZmVycmVkXG4gKiBwcm9taXNlLlxuICogQHJldHVybnMgYSBub2RlYmFja1xuICovXG5kZWZlci5wcm90b3R5cGUubWFrZU5vZGVSZXNvbHZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBzZWxmLnJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZShhcnJheV9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gcmVzb2x2ZXIge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBub3RoaW5nIGFuZCBhY2NlcHRzXG4gKiB0aGUgcmVzb2x2ZSwgcmVqZWN0LCBhbmQgbm90aWZ5IGZ1bmN0aW9ucyBmb3IgYSBkZWZlcnJlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IG1heSBiZSByZXNvbHZlZCB3aXRoIHRoZSBnaXZlbiByZXNvbHZlIGFuZCByZWplY3RcbiAqIGZ1bmN0aW9ucywgb3IgcmVqZWN0ZWQgYnkgYSB0aHJvd24gZXhjZXB0aW9uIGluIHJlc29sdmVyXG4gKi9cblEuUHJvbWlzZSA9IHByb21pc2U7IC8vIEVTNlxuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbnByb21pc2UucmFjZSA9IHJhY2U7IC8vIEVTNlxucHJvbWlzZS5hbGwgPSBhbGw7IC8vIEVTNlxucHJvbWlzZS5yZWplY3QgPSByZWplY3Q7IC8vIEVTNlxucHJvbWlzZS5yZXNvbHZlID0gUTsgLy8gRVM2XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBzZXR0bGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgc2V0dGxlZFxuICovXG5RLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShhbnN3ZXJQcykge1xuICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0UmVwb3J0ID0gYXJyYXlfaW5kZXhPZihyZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChhdFJlcG9ydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwicmVqZWN0aW9uSGFuZGxlZFwiLCB1bmhhbmRsZWRSZWFzb25zW2F0XSwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXRSZXBvcnQsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IGZhbHNlO1xufTtcblxucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG5cbi8vLy8gRU5EIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqIEBwYXJhbSByZWFzb24gdmFsdWUgZGVzY3JpYmluZyB0aGUgZmFpbHVyZVxuICovXG5RLnJlamVjdCA9IHJlamVjdDtcbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICB2YXIgcmVqZWN0aW9uID0gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgZXJyb3IgaGFzIGJlZW4gaGFuZGxlZFxuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja1JlamVjdGlvbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkKHJlYXNvbikgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcInJlamVjdGVkXCIsIHJlYXNvbjogcmVhc29uIH07XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHJlYXNvbiBoYXMgbm90IGJlZW4gaGFuZGxlZC5cbiAgICB0cmFja1JlamVjdGlvbihyZWplY3Rpb24sIHJlYXNvbik7XG5cbiAgICByZXR1cm4gcmVqZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBmdWxmaWxsZWQgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlXG4gKi9cblEuZnVsZmlsbCA9IGZ1bGZpbGw7XG5mdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbiAobmFtZSwgcmhzKSB7XG4gICAgICAgICAgICB2YWx1ZVtuYW1lXSA9IHJocztcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3N0XCI6IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBNYXJrIE1pbGxlciBwcm9wb3NlcyB0aGF0IHBvc3Qgd2l0aCBubyBuYW1lIHNob3VsZCBhcHBseSBhXG4gICAgICAgICAgICAvLyBwcm9taXNlZCBmdW5jdGlvbi5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV0uYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImFwcGx5XCI6IGZ1bmN0aW9uICh0aGlzcCwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXNwLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJrZXlzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB2b2lkIDAsIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcImZ1bGZpbGxlZFwiLCB2YWx1ZTogdmFsdWUgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGVuYWJsZXMgdG8gUSBwcm9taXNlcy5cbiAqIEBwYXJhbSBwcm9taXNlIHRoZW5hYmxlIHByb21pc2VcbiAqIEByZXR1cm5zIGEgUSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZShwcm9taXNlKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEoZXhjZXB0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGdldFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcHJvcGVydHkgdmFsdWVcbiAqL1xuUS5nZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciBvYmplY3Qgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gc2V0XG4gKiBAcGFyYW0gdmFsdWUgICAgIG5ldyB2YWx1ZSBvZiBwcm9wZXJ0eVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGRlbGV0ZVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSB2YWx1ZSAgICAgYSB2YWx1ZSB0byBwb3N0LCB0eXBpY2FsbHkgYW4gYXJyYXkgb2ZcbiAqICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbiBhcmd1bWVudHMgZm9yIHByb21pc2VzIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgYXJlIHVsdGltYXRlbHkgYmFja2VkIHdpdGggYHJlc29sdmVgIHZhbHVlcyxcbiAqICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aG9zZSBiYWNrZWQgd2l0aCBVUkxzXG4gKiAgICAgICAgICAgICAgICAgIHdoZXJlaW4gdGhlIHBvc3RlZCB2YWx1ZSBjYW4gYmUgYW55XG4gKiAgICAgICAgICAgICAgICAgIEpTT04gc2VyaWFsaXphYmxlIG9iamVjdC5cbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG4vLyBib3VuZCBsb2NhbGx5IGJlY2F1c2UgaXQgaXMgdXNlZCBieSBvdGhlciBtZXRob2RzXG5RLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGludm9jYXRpb24gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblEubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMildKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUHJvbWlzZS5wcm90b3R5cGUubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSBhcmdzICAgICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmFwcGx5ID0gZnVuY3Rpb24gKG9iamVjdCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblFbXCJ0cnlcIl0gPVxuUS5mY2FsbCA9IGZ1bmN0aW9uIChvYmplY3QgLyogLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMpXSk7XG59O1xuXG4vKipcbiAqIEJpbmRzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiwgdHJhbnNmb3JtaW5nIHJldHVybiB2YWx1ZXMgaW50byBhIGZ1bGZpbGxlZFxuICogcHJvbWlzZSBhbmQgdGhyb3duIGVycm9ycyBpbnRvIGEgcmVqZWN0ZWQgb25lLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYmluZCA9IGZ1bmN0aW9uIChvYmplY3QgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IFEob2JqZWN0KTtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5Qcm9taXNlLnByb3RvdHlwZS5mYmluZCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrcGVuZGluZ0NvdW50O1xuICAgICAgICAgICAgICAgIHdoZW4oXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1wZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7IGluZGV4OiBpbmRleCwgdmFsdWU6IHByb2dyZXNzIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlIG9mIGFuIGFycmF5LiBQcmlvciByZWplY3RlZCBwcm9taXNlcyBhcmVcbiAqIGlnbm9yZWQuICBSZWplY3RzIG9ubHkgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyBvciBwcm9taXNlcyBmb3IgdmFsdWVzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlLFxuICogb3IgYSByZWplY3RlZCBwcm9taXNlIGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKi9cblEuYW55ID0gYW55O1xuXG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBRLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUS5ub0NvbmZsaWN0IG9ubHkgd29ya3Mgd2hlbiBRIGlzIHVzZWQgYXMgYSBnbG9iYWxcIik7XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwiKGZ1bmN0aW9uKGV4cG9ydHMpe1xuY3Jvc3NmaWx0ZXIudmVyc2lvbiA9IFwiMi4wLjAtYWxwaGEuMDNcIjtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2lkZW50aXR5KGQpIHtcbiAgcmV0dXJuIGQ7XG59XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcblxuZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgpIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBuZXcgQXJyYXkobik7IGkgPCBuOyArK2kpIHtcbiAgICBjb3B5W2ldID0gYXJyYXlbaW5kZXhbaV1dO1xuICB9XG4gIHJldHVybiBjb3B5O1xufVxudmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdCA9IGJpc2VjdF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmJpc2VjdC5ieSA9IGJpc2VjdF9ieTtcblxuZnVuY3Rpb24gYmlzZWN0X2J5KGYpIHtcblxuICAvLyBMb2NhdGUgdGhlIGluc2VydGlvbiBwb2ludCBmb3IgeCBpbiBhIHRvIG1haW50YWluIHNvcnRlZCBvcmRlci4gVGhlXG4gIC8vIGFyZ3VtZW50cyBsbyBhbmQgaGkgbWF5IGJlIHVzZWQgdG8gc3BlY2lmeSBhIHN1YnNldCBvZiB0aGUgYXJyYXkgd2hpY2hcbiAgLy8gc2hvdWxkIGJlIGNvbnNpZGVyZWQ7IGJ5IGRlZmF1bHQgdGhlIGVudGlyZSBhcnJheSBpcyB1c2VkLiBJZiB4IGlzIGFscmVhZHlcbiAgLy8gcHJlc2VudCBpbiBhLCB0aGUgaW5zZXJ0aW9uIHBvaW50IHdpbGwgYmUgYmVmb3JlICh0byB0aGUgbGVmdCBvZikgYW55XG4gIC8vIGV4aXN0aW5nIGVudHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgaXMgc3VpdGFibGUgZm9yIHVzZSBhcyB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnQgdG8gYGFycmF5LnNwbGljZWAgYXNzdW1pbmcgdGhhdCBhIGlzIGFscmVhZHkgc29ydGVkLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgYSBpbnRvIHR3byBoYWx2ZXMgc29cbiAgLy8gdGhhdCBhbGwgdiA8IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPj0geCBmb3IgdiBpblxuICAvLyBhW2k6aGldIGZvciB0aGUgcmlnaHQgc2lkZS5cbiAgZnVuY3Rpb24gYmlzZWN0TGVmdChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoZihhW21pZF0pIDwgeCkgbG8gPSBtaWQgKyAxO1xuICAgICAgZWxzZSBoaSA9IG1pZDtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgLy8gU2ltaWxhciB0byBiaXNlY3RMZWZ0LCBidXQgcmV0dXJucyBhbiBpbnNlcnRpb24gcG9pbnQgd2hpY2ggY29tZXMgYWZ0ZXIgKHRvXG4gIC8vIHRoZSByaWdodCBvZikgYW55IGV4aXN0aW5nIGVudHJpZXMgb2YgeCBpbiBhLlxuICAvL1xuICAvLyBUaGUgcmV0dXJuZWQgaW5zZXJ0aW9uIHBvaW50IGkgcGFydGl0aW9ucyB0aGUgYXJyYXkgaW50byB0d28gaGFsdmVzIHNvIHRoYXRcbiAgLy8gYWxsIHYgPD0geCBmb3IgdiBpbiBhW2xvOmldIGZvciB0aGUgbGVmdCBzaWRlIGFuZCBhbGwgdiA+IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdFJpZ2h0KGEsIHgsIGxvLCBoaSkge1xuICAgIHdoaWxlIChsbyA8IGhpKSB7XG4gICAgICB2YXIgbWlkID0gbG8gKyBoaSA+Pj4gMTtcbiAgICAgIGlmICh4IDwgZihhW21pZF0pKSBoaSA9IG1pZDtcbiAgICAgIGVsc2UgbG8gPSBtaWQgKyAxO1xuICAgIH1cbiAgICByZXR1cm4gbG87XG4gIH1cblxuICBiaXNlY3RSaWdodC5yaWdodCA9IGJpc2VjdFJpZ2h0O1xuICBiaXNlY3RSaWdodC5sZWZ0ID0gYmlzZWN0TGVmdDtcbiAgcmV0dXJuIGJpc2VjdFJpZ2h0O1xufVxudmFyIGhlYXAgPSBjcm9zc2ZpbHRlci5oZWFwID0gaGVhcF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbmhlYXAuYnkgPSBoZWFwX2J5O1xuXG5mdW5jdGlvbiBoZWFwX2J5KGYpIHtcblxuICAvLyBCdWlsZHMgYSBiaW5hcnkgaGVhcCB3aXRoaW4gdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXS4gVGhlIGhlYXAgaGFzIHRoZVxuICAvLyBwcm9wZXJ0eSBzdWNoIHRoYXQgdGhlIHBhcmVudCBhW2xvK2ldIGlzIGFsd2F5cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gaXRzXG4gIC8vIHR3byBjaGlsZHJlbjogYVtsbysyKmkrMV0gYW5kIGFbbG8rMippKzJdLlxuICBmdW5jdGlvbiBoZWFwKGEsIGxvLCBoaSkge1xuICAgIHZhciBuID0gaGkgLSBsbyxcbiAgICAgICAgaSA9IChuID4+PiAxKSArIDE7XG4gICAgd2hpbGUgKC0taSA+IDApIHNpZnQoYSwgaSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU29ydHMgdGhlIHNwZWNpZmllZCBhcnJheSBhW2xvOmhpXSBpbiBkZXNjZW5kaW5nIG9yZGVyLCBhc3N1bWluZyBpdCBpc1xuICAvLyBhbHJlYWR5IGEgaGVhcC5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIHQ7XG4gICAgd2hpbGUgKC0tbiA+IDApIHQgPSBhW2xvXSwgYVtsb10gPSBhW2xvICsgbl0sIGFbbG8gKyBuXSA9IHQsIHNpZnQoYSwgMSwgbiwgbG8pO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLy8gU2lmdHMgdGhlIGVsZW1lbnQgYVtsbytpLTFdIGRvd24gdGhlIGhlYXAsIHdoZXJlIHRoZSBoZWFwIGlzIHRoZSBjb250aWd1b3VzXG4gIC8vIHNsaWNlIG9mIGFycmF5IGFbbG86bG8rbl0uIFRoaXMgbWV0aG9kIGNhbiBhbHNvIGJlIHVzZWQgdG8gdXBkYXRlIHRoZSBoZWFwXG4gIC8vIGluY3JlbWVudGFsbHksIHdpdGhvdXQgaW5jdXJyaW5nIHRoZSBmdWxsIGNvc3Qgb2YgcmVjb25zdHJ1Y3RpbmcgdGhlIGhlYXAuXG4gIGZ1bmN0aW9uIHNpZnQoYSwgaSwgbiwgbG8pIHtcbiAgICB2YXIgZCA9IGFbLS1sbyArIGldLFxuICAgICAgICB4ID0gZihkKSxcbiAgICAgICAgY2hpbGQ7XG4gICAgd2hpbGUgKChjaGlsZCA9IGkgPDwgMSkgPD0gbikge1xuICAgICAgaWYgKGNoaWxkIDwgbiAmJiBmKGFbbG8gKyBjaGlsZF0pID4gZihhW2xvICsgY2hpbGQgKyAxXSkpIGNoaWxkKys7XG4gICAgICBpZiAoeCA8PSBmKGFbbG8gKyBjaGlsZF0pKSBicmVhaztcbiAgICAgIGFbbG8gKyBpXSA9IGFbbG8gKyBjaGlsZF07XG4gICAgICBpID0gY2hpbGQ7XG4gICAgfVxuICAgIGFbbG8gKyBpXSA9IGQ7XG4gIH1cblxuICBoZWFwLnNvcnQgPSBzb3J0O1xuICByZXR1cm4gaGVhcDtcbn1cbnZhciBoZWFwc2VsZWN0ID0gY3Jvc3NmaWx0ZXIuaGVhcHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwc2VsZWN0LmJ5ID0gaGVhcHNlbGVjdF9ieTtcblxuZnVuY3Rpb24gaGVhcHNlbGVjdF9ieShmKSB7XG4gIHZhciBoZWFwID0gaGVhcF9ieShmKTtcblxuICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBrIGVsZW1lbnRzIGluIHRoZSBhcnJheSBhW2xvOmhpXS5cbiAgLy8gVGhlIHJldHVybmVkIGFycmF5IGlzIG5vdCBzb3J0ZWQsIGJ1dCBtYWludGFpbnMgdGhlIGhlYXAgcHJvcGVydHkuIElmIGsgaXNcbiAgLy8gZ3JlYXRlciB0aGFuIGhpIC0gbG8sIHRoZW4gZmV3ZXIgdGhhbiBrIGVsZW1lbnRzIHdpbGwgYmUgcmV0dXJuZWQuIFRoZVxuICAvLyBvcmRlciBvZiBlbGVtZW50cyBpbiBhIGlzIHVuY2hhbmdlZCBieSB0aGlzIG9wZXJhdGlvbi5cbiAgZnVuY3Rpb24gaGVhcHNlbGVjdChhLCBsbywgaGksIGspIHtcbiAgICB2YXIgcXVldWUgPSBuZXcgQXJyYXkoayA9IE1hdGgubWluKGhpIC0gbG8sIGspKSxcbiAgICAgICAgbWluLFxuICAgICAgICBpLFxuICAgICAgICB4LFxuICAgICAgICBkO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkgcXVldWVbaV0gPSBhW2xvKytdO1xuICAgIGhlYXAocXVldWUsIDAsIGspO1xuXG4gICAgaWYgKGxvIDwgaGkpIHtcbiAgICAgIG1pbiA9IGYocXVldWVbMF0pO1xuICAgICAgZG8ge1xuICAgICAgICBpZiAoeCA9IGYoZCA9IGFbbG9dKSA+IG1pbikge1xuICAgICAgICAgIHF1ZXVlWzBdID0gZDtcbiAgICAgICAgICBtaW4gPSBmKGhlYXAocXVldWUsIDAsIGspWzBdKTtcbiAgICAgICAgfVxuICAgICAgfSB3aGlsZSAoKytsbyA8IGhpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVldWU7XG4gIH1cblxuICByZXR1cm4gaGVhcHNlbGVjdDtcbn1cbnZhciBpbnNlcnRpb25zb3J0ID0gY3Jvc3NmaWx0ZXIuaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5pbnNlcnRpb25zb3J0LmJ5ID0gaW5zZXJ0aW9uc29ydF9ieTtcblxuZnVuY3Rpb24gaW5zZXJ0aW9uc29ydF9ieShmKSB7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0aW9uc29ydChhLCBsbywgaGkpIHtcbiAgICBmb3IgKHZhciBpID0gbG8gKyAxOyBpIDwgaGk7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IGksIHQgPSBhW2ldLCB4ID0gZih0KTsgaiA+IGxvICYmIGYoYVtqIC0gMV0pID4geDsgLS1qKSB7XG4gICAgICAgIGFbal0gPSBhW2ogLSAxXTtcbiAgICAgIH1cbiAgICAgIGFbal0gPSB0O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHJldHVybiBpbnNlcnRpb25zb3J0O1xufVxuLy8gQWxnb3JpdGhtIGRlc2lnbmVkIGJ5IFZsYWRpbWlyIFlhcm9zbGF2c2tpeS5cbi8vIEltcGxlbWVudGF0aW9uIGJhc2VkIG9uIHRoZSBEYXJ0IHByb2plY3Q7IHNlZSBsaWIvZGFydC9MSUNFTlNFIGZvciBkZXRhaWxzLlxuXG52YXIgcXVpY2tzb3J0ID0gY3Jvc3NmaWx0ZXIucXVpY2tzb3J0ID0gcXVpY2tzb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxucXVpY2tzb3J0LmJ5ID0gcXVpY2tzb3J0X2J5O1xuXG5mdW5jdGlvbiBxdWlja3NvcnRfYnkoZikge1xuICB2YXIgaW5zZXJ0aW9uc29ydCA9IGluc2VydGlvbnNvcnRfYnkoZik7XG5cbiAgZnVuY3Rpb24gc29ydChhLCBsbywgaGkpIHtcbiAgICByZXR1cm4gKGhpIC0gbG8gPCBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZFxuICAgICAgICA/IGluc2VydGlvbnNvcnRcbiAgICAgICAgOiBxdWlja3NvcnQpKGEsIGxvLCBoaSk7XG4gIH1cblxuICBmdW5jdGlvbiBxdWlja3NvcnQoYSwgbG8sIGhpKSB7XG4gICAgLy8gQ29tcHV0ZSB0aGUgdHdvIHBpdm90cyBieSBsb29raW5nIGF0IDUgZWxlbWVudHMuXG4gICAgdmFyIHNpeHRoID0gKGhpIC0gbG8pIC8gNiB8IDAsXG4gICAgICAgIGkxID0gbG8gKyBzaXh0aCxcbiAgICAgICAgaTUgPSBoaSAtIDEgLSBzaXh0aCxcbiAgICAgICAgaTMgPSBsbyArIGhpIC0gMSA+PiAxLCAgLy8gVGhlIG1pZHBvaW50LlxuICAgICAgICBpMiA9IGkzIC0gc2l4dGgsXG4gICAgICAgIGk0ID0gaTMgKyBzaXh0aDtcblxuICAgIHZhciBlMSA9IGFbaTFdLCB4MSA9IGYoZTEpLFxuICAgICAgICBlMiA9IGFbaTJdLCB4MiA9IGYoZTIpLFxuICAgICAgICBlMyA9IGFbaTNdLCB4MyA9IGYoZTMpLFxuICAgICAgICBlNCA9IGFbaTRdLCB4NCA9IGYoZTQpLFxuICAgICAgICBlNSA9IGFbaTVdLCB4NSA9IGYoZTUpO1xuXG4gICAgdmFyIHQ7XG5cbiAgICAvLyBTb3J0IHRoZSBzZWxlY3RlZCA1IGVsZW1lbnRzIHVzaW5nIGEgc29ydGluZyBuZXR3b3JrLlxuICAgIGlmICh4MSA+IHgyKSB0ID0gZTEsIGUxID0gZTIsIGUyID0gdCwgdCA9IHgxLCB4MSA9IHgyLCB4MiA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcbiAgICBpZiAoeDEgPiB4MykgdCA9IGUxLCBlMSA9IGUzLCBlMyA9IHQsIHQgPSB4MSwgeDEgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHgxID4geDQpIHQgPSBlMSwgZTEgPSBlNCwgZTQgPSB0LCB0ID0geDEsIHgxID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDMgPiB4NCkgdCA9IGUzLCBlMyA9IGU0LCBlNCA9IHQsIHQgPSB4MywgeDMgPSB4NCwgeDQgPSB0O1xuICAgIGlmICh4MiA+IHg1KSB0ID0gZTIsIGUyID0gZTUsIGU1ID0gdCwgdCA9IHgyLCB4MiA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgyID4geDMpIHQgPSBlMiwgZTIgPSBlMywgZTMgPSB0LCB0ID0geDIsIHgyID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDQgPiB4NSkgdCA9IGU0LCBlNCA9IGU1LCBlNSA9IHQsIHQgPSB4NCwgeDQgPSB4NSwgeDUgPSB0O1xuXG4gICAgdmFyIHBpdm90MSA9IGUyLCBwaXZvdFZhbHVlMSA9IHgyLFxuICAgICAgICBwaXZvdDIgPSBlNCwgcGl2b3RWYWx1ZTIgPSB4NDtcblxuICAgIC8vIGUyIGFuZCBlNCBoYXZlIGJlZW4gc2F2ZWQgaW4gdGhlIHBpdm90IHZhcmlhYmxlcy4gVGhleSB3aWxsIGJlIHdyaXR0ZW5cbiAgICAvLyBiYWNrLCBvbmNlIHRoZSBwYXJ0aXRpb25pbmcgaXMgZmluaXNoZWQuXG4gICAgYVtpMV0gPSBlMTtcbiAgICBhW2kyXSA9IGFbbG9dO1xuICAgIGFbaTNdID0gZTM7XG4gICAgYVtpNF0gPSBhW2hpIC0gMV07XG4gICAgYVtpNV0gPSBlNTtcblxuICAgIHZhciBsZXNzID0gbG8gKyAxLCAgIC8vIEZpcnN0IGVsZW1lbnQgaW4gdGhlIG1pZGRsZSBwYXJ0aXRpb24uXG4gICAgICAgIGdyZWF0ID0gaGkgLSAyOyAgLy8gTGFzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuXG4gICAgLy8gTm90ZSB0aGF0IGZvciB2YWx1ZSBjb21wYXJpc29uLCA8LCA8PSwgPj0gYW5kID4gY29lcmNlIHRvIGEgcHJpbWl0aXZlIHZpYVxuICAgIC8vIE9iamVjdC5wcm90b3R5cGUudmFsdWVPZjsgPT0gYW5kID09PSBkbyBub3QsIHNvIGluIG9yZGVyIHRvIGJlIGNvbnNpc3RlbnRcbiAgICAvLyB3aXRoIG5hdHVyYWwgb3JkZXIgKHN1Y2ggYXMgZm9yIERhdGUgb2JqZWN0cyksIHdlIG11c3QgZG8gdHdvIGNvbXBhcmVzLlxuICAgIHZhciBwaXZvdHNFcXVhbCA9IHBpdm90VmFsdWUxIDw9IHBpdm90VmFsdWUyICYmIHBpdm90VmFsdWUxID49IHBpdm90VmFsdWUyO1xuICAgIGlmIChwaXZvdHNFcXVhbCkge1xuXG4gICAgICAvLyBEZWdlbmVyYXRlZCBjYXNlIHdoZXJlIHRoZSBwYXJ0aXRpb25pbmcgYmVjb21lcyBhIGR1dGNoIG5hdGlvbmFsIGZsYWdcbiAgICAgIC8vIHByb2JsZW0uXG4gICAgICAvL1xuICAgICAgLy8gWyB8ICA8IHBpdm90ICB8ID09IHBpdm90IHwgdW5wYXJ0aXRpb25lZCB8ID4gcGl2b3QgIHwgXVxuICAgICAgLy8gIF4gICAgICAgICAgICAgXiAgICAgICAgICBeICAgICAgICAgICAgIF4gICAgICAgICAgICBeXG4gICAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgIGsgICAgICAgICAgIGdyZWF0ICAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEpIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdC5cbiAgICAgIC8vICAgMikgZm9yIHggaW4gW2xlc3MsIGtbIDogeCA9PSBwaXZvdC5cbiAgICAgIC8vICAgMykgZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QuXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgKytrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSBpZiAoeGsgPiBwaXZvdFZhbHVlMSkge1xuXG4gICAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgZWxlbWVudCA8PSBwaXZvdCBpbiB0aGUgcmFuZ2UgW2sgLSAxLCBncmVhdF0gYW5kXG4gICAgICAgICAgLy8gcHV0IFs6ZWs6XSB0aGVyZS4gV2Uga25vdyB0aGF0IHN1Y2ggYW4gZWxlbWVudCBtdXN0IGV4aXN0OlxuICAgICAgICAgIC8vIFdoZW4gayA9PSBsZXNzLCB0aGVuIGVsMyAod2hpY2ggaXMgZXF1YWwgdG8gcGl2b3QpIGxpZXMgaW4gdGhlXG4gICAgICAgICAgLy8gaW50ZXJ2YWwuIE90aGVyd2lzZSBhW2sgLSAxXSA9PSBwaXZvdCBhbmQgdGhlIHNlYXJjaCBzdG9wcyBhdCBrLTEuXG4gICAgICAgICAgLy8gTm90ZSB0aGF0IGluIHRoZSBsYXR0ZXIgY2FzZSBpbnZhcmlhbnQgMiB3aWxsIGJlIHZpb2xhdGVkIGZvciBhXG4gICAgICAgICAgLy8gc2hvcnQgYW1vdW50IG9mIHRpbWUuIFRoZSBpbnZhcmlhbnQgd2lsbCBiZSByZXN0b3JlZCB3aGVuIHRoZVxuICAgICAgICAgIC8vIHBpdm90cyBhcmUgcHV0IGludG8gdGhlaXIgZmluYWwgcG9zaXRpb25zLlxuICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPiBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluIHRoZSB3aGlsZS1sb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgIC8vIE5vdGU6IGlmIGdyZWF0IDwgayB0aGVuIHdlIHdpbGwgZXhpdCB0aGUgb3V0ZXIgbG9vcCBhbmQgZml4XG4gICAgICAgICAgICAgIC8vIGludmFyaWFudCAyICh3aGljaCB3ZSBqdXN0IHZpb2xhdGVkKS5cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcblxuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPCBwaXZvdDFcbiAgICAgIC8vICAyLiA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyXG4gICAgICAvLyAgMy4gPiBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgfCA8IHBpdm90MSB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID4gcGl2b3QyICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdCAgICAgICAgcmlnaHRcbiAgICAgIC8vXG4gICAgICAvLyBhW2xlZnRdIGFuZCBhW3JpZ2h0XSBhcmUgdW5kZWZpbmVkIGFuZCBhcmUgZmlsbGVkIGFmdGVyIHRoZVxuICAgICAgLy8gcGFydGl0aW9uaW5nLlxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIF1sZWZ0LCBsZXNzWyA6IHggPCBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDw9IHggJiYgeCA8PSBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCByaWdodFsgOiB4ID4gcGl2b3QyXG4gICAgICBmb3IgKHZhciBrID0gbGVzczsgayA8PSBncmVhdDsgaysrKSB7XG4gICAgICAgIHZhciBlayA9IGFba10sIHhrID0gZihlayk7XG4gICAgICAgIGlmICh4ayA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICArK2xlc3M7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPD0gcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID49IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBNb3ZlIHBpdm90cyBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAvLyBXZSBzaHJ1bmsgdGhlIGxpc3QgZnJvbSBib3RoIHNpZGVzIChhW2xlZnRdIGFuZCBhW3JpZ2h0XSBoYXZlXG4gICAgLy8gbWVhbmluZ2xlc3MgdmFsdWVzIGluIHRoZW0pIGFuZCBub3cgd2UgbW92ZSBlbGVtZW50cyBmcm9tIHRoZSBmaXJzdFxuICAgIC8vIGFuZCB0aGlyZCBwYXJ0aXRpb24gaW50byB0aGVzZSBsb2NhdGlvbnMgc28gdGhhdCB3ZSBjYW4gc3RvcmUgdGhlXG4gICAgLy8gcGl2b3RzLlxuICAgIGFbbG9dID0gYVtsZXNzIC0gMV07XG4gICAgYVtsZXNzIC0gMV0gPSBwaXZvdDE7XG4gICAgYVtoaSAtIDFdID0gYVtncmVhdCArIDFdO1xuICAgIGFbZ3JlYXQgKyAxXSA9IHBpdm90MjtcblxuICAgIC8vIFRoZSBsaXN0IGlzIG5vdyBwYXJ0aXRpb25lZCBpbnRvIHRocmVlIHBhcnRpdGlvbnM6XG4gICAgLy8gWyA8IHBpdm90MSAgIHwgPj0gcGl2b3QxICYmIDw9IHBpdm90MiAgIHwgID4gcGl2b3QyICAgXVxuICAgIC8vICBeICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICAgIF4gICAgICAgICAgICAgXlxuICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG5cbiAgICAvLyBSZWN1cnNpdmUgZGVzY2VudC4gKERvbid0IGluY2x1ZGUgdGhlIHBpdm90IHZhbHVlcy4pXG4gICAgc29ydChhLCBsbywgbGVzcyAtIDEpO1xuICAgIHNvcnQoYSwgZ3JlYXQgKyAyLCBoaSk7XG5cbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcbiAgICAgIC8vIEFsbCBlbGVtZW50cyBpbiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBhcmUgZXF1YWwgdG8gdGhlIHBpdm90LiBOb1xuICAgICAgLy8gbmVlZCB0byBzb3J0IHRoZW0uXG4gICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICAvLyBJbiB0aGVvcnkgaXQgc2hvdWxkIGJlIGVub3VnaCB0byBjYWxsIF9kb1NvcnQgcmVjdXJzaXZlbHkgb24gdGhlIHNlY29uZFxuICAgIC8vIHBhcnRpdGlvbi5cbiAgICAvLyBUaGUgQW5kcm9pZCBzb3VyY2UgaG93ZXZlciByZW1vdmVzIHRoZSBwaXZvdCBlbGVtZW50cyBmcm9tIHRoZSByZWN1cnNpdmVcbiAgICAvLyBjYWxsIGlmIHRoZSBzZWNvbmQgcGFydGl0aW9uIGlzIHRvbyBsYXJnZSAobW9yZSB0aGFuIDIvMyBvZiB0aGUgbGlzdCkuXG4gICAgaWYgKGxlc3MgPCBpMSAmJiBncmVhdCA+IGk1KSB7XG4gICAgICB2YXIgbGVzc1ZhbHVlLCBncmVhdFZhbHVlO1xuICAgICAgd2hpbGUgKChsZXNzVmFsdWUgPSBmKGFbbGVzc10pKSA8PSBwaXZvdFZhbHVlMSAmJiBsZXNzVmFsdWUgPj0gcGl2b3RWYWx1ZTEpICsrbGVzcztcbiAgICAgIHdoaWxlICgoZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pKSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSAtLWdyZWF0O1xuXG4gICAgICAvLyBDb3B5IHBhc3RlIG9mIHRoZSBwcmV2aW91cyAzLXdheSBwYXJ0aXRpb25pbmcgd2l0aCBhZGFwdGlvbnMuXG4gICAgICAvL1xuICAgICAgLy8gV2UgcGFydGl0aW9uIHRoZSBsaXN0IGludG8gdGhyZWUgcGFydHM6XG4gICAgICAvLyAgMS4gPT0gcGl2b3QxXG4gICAgICAvLyAgMi4gPiBwaXZvdDEgJiYgPCBwaXZvdDJcbiAgICAgIC8vICAzLiA9PSBwaXZvdDJcbiAgICAgIC8vXG4gICAgICAvLyBEdXJpbmcgdGhlIGxvb3Agd2UgaGF2ZTpcbiAgICAgIC8vIFsgPT0gcGl2b3QxIHwgPiBwaXZvdDEgJiYgPCBwaXZvdDIgfCB1bnBhcnRpdGlvbmVkICB8ID09IHBpdm90MiBdXG4gICAgICAvLyAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeXG4gICAgICAvLyAgICAgICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgICBrICAgICAgICAgICAgICBncmVhdFxuICAgICAgLy9cbiAgICAgIC8vIEludmFyaWFudHM6XG4gICAgICAvLyAgIDEuIGZvciB4IGluIFsgKiwgbGVzc1sgOiB4ID09IHBpdm90MVxuICAgICAgLy8gICAyLiBmb3IgeCBpbiBbbGVzcywga1sgOiBwaXZvdDEgPCB4ICYmIHggPCBwaXZvdDJcbiAgICAgIC8vICAgMy4gZm9yIHggaW4gXWdyZWF0LCAqIF0gOiB4ID09IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTEgJiYgeGsgPj0gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICBpZiAoayAhPT0gbGVzcykge1xuICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICBhW2xlc3NdID0gZWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxlc3MrKztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoeGsgPD0gcGl2b3RWYWx1ZTIgJiYgeGsgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgICAgIHZhciBncmVhdFZhbHVlID0gZihhW2dyZWF0XSk7XG4gICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDw9IHBpdm90VmFsdWUyICYmIGdyZWF0VmFsdWUgPj0gcGl2b3RWYWx1ZTIpIHtcbiAgICAgICAgICAgICAgICBncmVhdC0tO1xuICAgICAgICAgICAgICAgIGlmIChncmVhdCA8IGspIGJyZWFrO1xuICAgICAgICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIG9ubHkgbG9jYXRpb24gaW5zaWRlIHRoZSBsb29wIHdoZXJlIGEgbmV3XG4gICAgICAgICAgICAgICAgLy8gaXRlcmF0aW9uIGlzIHN0YXJ0ZWQuXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPCBwaXZvdDIuXG4gICAgICAgICAgICAgICAgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAgICAgLy8gVHJpcGxlIGV4Y2hhbmdlLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbbGVzc107XG4gICAgICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgLy8gYVtncmVhdF0gPT0gcGl2b3QxLlxuICAgICAgICAgICAgICAgICAgYVtrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRoZSBzZWNvbmQgcGFydGl0aW9uIGhhcyBub3cgYmVlbiBjbGVhcmVkIG9mIHBpdm90IGVsZW1lbnRzIGFuZCBsb29rc1xuICAgIC8vIGFzIGZvbGxvd3M6XG4gICAgLy8gWyAgKiAgfCAgPiBwaXZvdDEgJiYgPCBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICBncmVhdFxuICAgIC8vIFNvcnQgdGhlIHNlY29uZCBwYXJ0aXRpb24gdXNpbmcgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBsb29rcyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID49IHBpdm90MSAmJiA8PSBwaXZvdDIgIHwgKiBdXG4gICAgLy8gICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeXG4gICAgLy8gICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTaW1wbHkgc29ydCBpdCBieSByZWN1cnNpdmUgZGVzY2VudC5cblxuICAgIHJldHVybiBzb3J0KGEsIGxlc3MsIGdyZWF0ICsgMSk7XG4gIH1cblxuICByZXR1cm4gc29ydDtcbn1cblxudmFyIHF1aWNrc29ydF9zaXplVGhyZXNob2xkID0gMzI7XG52YXIgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXkzMiA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbiA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkO1xuXG5pZiAodHlwZW9mIFVpbnQ4QXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgY3Jvc3NmaWx0ZXJfYXJyYXk4ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQ4QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MTYgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDE2QXJyYXkobik7IH07XG4gIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBmdW5jdGlvbihuKSB7IHJldHVybiBuZXcgVWludDMyQXJyYXkobik7IH07XG5cbiAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGZ1bmN0aW9uKGFycmF5LCBsZW5ndGgpIHtcbiAgICBpZiAoYXJyYXkubGVuZ3RoID49IGxlbmd0aCkgcmV0dXJuIGFycmF5O1xuICAgIHZhciBjb3B5ID0gbmV3IGFycmF5LmNvbnN0cnVjdG9yKGxlbmd0aCk7XG4gICAgY29weS5zZXQoYXJyYXkpO1xuICAgIHJldHVybiBjb3B5O1xuICB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBmdW5jdGlvbihhcnJheSwgd2lkdGgpIHtcbiAgICB2YXIgY29weTtcbiAgICBzd2l0Y2ggKHdpZHRoKSB7XG4gICAgICBjYXNlIDE2OiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkxNihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGNhc2UgMzI6IGNvcHkgPSBjcm9zc2ZpbHRlcl9hcnJheTMyKGFycmF5Lmxlbmd0aCk7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gICAgfVxuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkKG4pIHtcbiAgdmFyIGFycmF5ID0gbmV3IEFycmF5KG4pLCBpID0gLTE7XG4gIHdoaWxlICgrK2kgPCBuKSBhcnJheVtpXSA9IDA7XG4gIHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlblVudHlwZWQoYXJyYXksIGxlbmd0aCkge1xuICB2YXIgbiA9IGFycmF5Lmxlbmd0aDtcbiAgd2hpbGUgKG4gPCBsZW5ndGgpIGFycmF5W24rK10gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5V2lkZW5VbnR5cGVkKGFycmF5LCB3aWR0aCkge1xuICBpZiAod2lkdGggPiAzMikgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBhcnJheSB3aWR0aCFcIik7XG4gIHJldHVybiBhcnJheTtcbn1cblxuLy8gQW4gYXJiaXRyYXJpbHktd2lkZSBhcnJheSBvZiBiaXRtYXNrc1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfYml0YXJyYXkobikge1xuICB0aGlzLmxlbmd0aCA9IG47XG4gIHRoaXMuc3ViYXJyYXlzID0gMTtcbiAgdGhpcy53aWR0aCA9IDg7XG4gIHRoaXMubWFza3MgPSB7XG4gICAgMDogMFxuICB9XG5cbiAgdGhpc1swXSA9IGNyb3NzZmlsdGVyX2FycmF5OChuKTtcbn07XG5cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5sZW5ndGhlbiA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKHRoaXNbaV0sIG4pO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIFJlc2VydmUgYSBuZXcgYml0IGluZGV4IGluIHRoZSBhcnJheSwgcmV0dXJucyB7b2Zmc2V0LCBvbmV9XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtLCB3LCBvbmUsIGksIGxlbjtcblxuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbSA9IHRoaXMubWFza3NbaV07XG4gICAgdyA9IHRoaXMud2lkdGggLSAoMzIgKiBpKTtcbiAgICBvbmUgPSB+bSAmIC1+bTtcblxuICAgIGlmICh3ID49IDMyICYmICFvbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICh3IDwgMzIgJiYgKG9uZSAmICgxIDw8IHcpKSkge1xuICAgICAgLy8gd2lkZW4gdGhpcyBzdWJhcnJheVxuICAgICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4odGhpc1tpXSwgdyA8PD0gMSk7XG4gICAgICB0aGlzLndpZHRoID0gMzIgKiBpICsgdztcbiAgICB9XG5cbiAgICB0aGlzLm1hc2tzW2ldIHw9IG9uZTtcblxuICAgIHJldHVybiB7XG4gICAgICBvZmZzZXQ6IGksXG4gICAgICBvbmU6IG9uZVxuICAgIH07XG4gIH1cblxuICAvLyBhZGQgYSBuZXcgc3ViYXJyYXlcbiAgdGhpc1t0aGlzLnN1YmFycmF5c10gPSBjcm9zc2ZpbHRlcl9hcnJheTgodGhpcy5sZW5ndGgpO1xuICB0aGlzLm1hc2tzW3RoaXMuc3ViYXJyYXlzXSA9IDE7XG4gIHRoaXMud2lkdGggKz0gODtcbiAgcmV0dXJuIHtcbiAgICBvZmZzZXQ6IHRoaXMuc3ViYXJyYXlzKyssXG4gICAgb25lOiAxXG4gIH07XG59O1xuXG4vLyBDb3B5IHJlY29yZCBmcm9tIGluZGV4IHNyYyB0byBpbmRleCBkZXN0XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGRlc3QsIHNyYykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXVtkZXN0XSA9IHRoaXNbaV1bc3JjXTtcbiAgfVxufTtcblxuLy8gVHJ1bmNhdGUgdGhlIGFycmF5IHRvIHRoZSBnaXZlbiBsZW5ndGhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS50cnVuY2F0ZSA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGZvciAodmFyIGogPSB0aGlzLmxlbmd0aCAtIDE7IGogPj0gbjsgai0tKSB7XG4gICAgICB0aGlzW2ldW2pdID0gMDtcbiAgICB9XG4gICAgdGhpc1tpXS5sZW5ndGggPSBuO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDBcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwIGV4Y2VwdCBmb3IgcG9zc2libHkgb25lXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPT09IG9mZnNldCA/IHRoaXNbaV1bbl0gJiB6ZXJvIDogdGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCBvbmUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICE9IChpID09PSBvZmZzZXQgPyBvbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXggZXhjZXB0IGZvciBwb3NzaWJseSBvbmUgb3RoZXJcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5RXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvLCBvbmx5T2Zmc2V0LCBvbmx5T25lKSB7XG4gIHZhciBtYXNrO1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbWFzayA9IHRoaXNbaV1bbl07XG4gICAgaWYgKGkgPT09IG9mZnNldClcbiAgICAgIG1hc2sgJj0gemVybztcbiAgICBpZiAobWFzayAhPSAoaSA9PT0gb25seU9mZnNldCA/IG9ubHlPbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKHZhbHVlcykge1xuICByZXR1cm4gWzAsIHZhbHVlcy5sZW5ndGhdO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfbnVsbCgpIHtcbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudChwKSB7XG4gIHJldHVybiBwICsgMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwICsgK2Yodik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCAtIGYodik7XG4gIH07XG59XG5leHBvcnRzLmNyb3NzZmlsdGVyID0gY3Jvc3NmaWx0ZXI7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyKCkge1xuICB2YXIgY3Jvc3NmaWx0ZXIgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmVEYXRhLFxuICAgIGRpbWVuc2lvbjogZGltZW5zaW9uLFxuICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICBzaXplOiBzaXplLFxuICAgIGFsbDogYWxsLFxuICB9O1xuXG4gIHZhciBkYXRhID0gW10sIC8vIHRoZSByZWNvcmRzXG4gICAgICBuID0gMCwgLy8gdGhlIG51bWJlciBvZiByZWNvcmRzOyBkYXRhLmxlbmd0aFxuICAgICAgZmlsdGVycywgLy8gMSBpcyBmaWx0ZXJlZCBvdXRcbiAgICAgIGZpbHRlckxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIHRoZSBmaWx0ZXJzIGNoYW5nZVxuICAgICAgZGF0YUxpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMgPSBbXTsgLy8gd2hlbiBkYXRhIGlzIHJlbW92ZWRcblxuICBmaWx0ZXJzID0gbmV3IGNyb3NzZmlsdGVyX2JpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjcm9zc2ZpbHRlcjtcbiAgfVxuXG4gIC8vIFJlbW92ZXMgYWxsIHJlY29yZHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBmaWx0ZXJzLlxuICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgIHZhciBuZXdJbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pLFxuICAgICAgICByZW1vdmVkID0gW107XG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkgbmV3SW5kZXhbaV0gPSBqKys7XG4gICAgICBlbHNlIHJlbW92ZWQucHVzaChpKTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmUgYWxsIG1hdGNoaW5nIHJlY29yZHMgZnJvbSBncm91cHMuXG4gICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKC0xLCAtMSwgW10sIHJlbW92ZWQsIHRydWUpOyB9KTtcblxuICAgIC8vIFVwZGF0ZSBpbmRleGVzLlxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3SW5kZXgpOyB9KTtcblxuICAgIC8vIFJlbW92ZSBvbGQgZmlsdGVycyBhbmQgZGF0YSBieSBvdmVyd3JpdGluZy5cbiAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgIGlmIChpICE9PSBqKSBmaWx0ZXJzLmNvcHkoaiwgaSksIGRhdGFbal0gPSBkYXRhW2ldO1xuICAgICAgICArK2o7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZGF0YS5sZW5ndGggPSBuID0gajtcbiAgICBmaWx0ZXJzLnRydW5jYXRlKGopO1xuICB9XG5cbiAgLy8gQWRkcyBhIG5ldyBkaW1lbnNpb24gd2l0aCB0aGUgc3BlY2lmaWVkIHZhbHVlIGFjY2Vzc29yIGZ1bmN0aW9uLlxuICBmdW5jdGlvbiBkaW1lbnNpb24odmFsdWUpIHtcbiAgICB2YXIgZGltZW5zaW9uID0ge1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICBmaWx0ZXJFeGFjdDogZmlsdGVyRXhhY3QsXG4gICAgICBmaWx0ZXJSYW5nZTogZmlsdGVyUmFuZ2UsXG4gICAgICBmaWx0ZXJGdW5jdGlvbjogZmlsdGVyRnVuY3Rpb24sXG4gICAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgb25lLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8sIC8vIGludmVydGVkIG9uZSwgZS5nLiwgMTExMTAxMTFcbiAgICAgICAgb2Zmc2V0LCAvLyBvZmZzZXQgaW50byB0aGUgZmlsdGVycyBhcnJheXNcbiAgICAgICAgdmFsdWVzLCAvLyBzb3J0ZWQsIGNhY2hlZCBhcnJheVxuICAgICAgICBpbmRleCwgLy8gdmFsdWUgcmFuayDihqYgb2JqZWN0IGlkXG4gICAgICAgIG5ld1ZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgdmFsdWVzXG4gICAgICAgIG5ld0luZGV4LCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCBpbmRleFxuICAgICAgICBzb3J0ID0gcXVpY2tzb3J0X2J5KGZ1bmN0aW9uKGkpIHsgcmV0dXJuIG5ld1ZhbHVlc1tpXTsgfSksXG4gICAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsLCAvLyBmb3IgcmVjb21wdXRpbmcgZmlsdGVyXG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24sIC8vIHRoZSBjdXN0b20gZmlsdGVyIGZ1bmN0aW9uIGluIHVzZVxuICAgICAgICBpbmRleExpc3RlbmVycyA9IFtdLCAvLyB3aGVuIGRhdGEgaXMgYWRkZWRcbiAgICAgICAgZGltZW5zaW9uR3JvdXBzID0gW10sXG4gICAgICAgIGxvMCA9IDAsXG4gICAgICAgIGhpMCA9IDA7XG5cbiAgICAvLyBVcGRhdGluZyBhIGRpbWVuc2lvbiBpcyBhIHR3by1zdGFnZSBwcm9jZXNzLiBGaXJzdCwgd2UgbXVzdCB1cGRhdGUgdGhlXG4gICAgLy8gYXNzb2NpYXRlZCBmaWx0ZXJzIGZvciB0aGUgbmV3bHktYWRkZWQgcmVjb3Jkcy4gT25jZSBhbGwgZGltZW5zaW9ucyBoYXZlXG4gICAgLy8gdXBkYXRlZCB0aGVpciBmaWx0ZXJzLCB0aGUgZ3JvdXBzIGFyZSBub3RpZmllZCB0byB1cGRhdGUuXG4gICAgZGF0YUxpc3RlbmVycy51bnNoaWZ0KHByZUFkZCk7XG4gICAgZGF0YUxpc3RlbmVycy5wdXNoKHBvc3RBZGQpO1xuXG4gICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgLy8gQWRkIGEgbmV3IGRpbWVuc2lvbiBpbiB0aGUgZmlsdGVyIGJpdG1hcCBhbmQgc3RvcmUgdGhlIG9mZnNldCBhbmQgYml0bWFzay5cbiAgICB2YXIgdG1wID0gZmlsdGVycy5hZGQoKTtcbiAgICBvZmZzZXQgPSB0bXAub2Zmc2V0O1xuICAgIG9uZSA9IHRtcC5vbmU7XG4gICAgemVybyA9IH5vbmU7XG5cbiAgICBwcmVBZGQoZGF0YSwgMCwgbik7XG4gICAgcG9zdEFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyByZWNvcmRzIGludG8gdGhpcyBkaW1lbnNpb24uXG4gICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZmlsdGVycywgdmFsdWVzLCBhbmQgaW5kZXguXG4gICAgZnVuY3Rpb24gcHJlQWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuXG4gICAgICAvLyBQZXJtdXRlIG5ldyB2YWx1ZXMgaW50byBuYXR1cmFsIG9yZGVyIHVzaW5nIGEgc29ydGVkIGluZGV4LlxuICAgICAgbmV3VmFsdWVzID0gbmV3RGF0YS5tYXAodmFsdWUpO1xuICAgICAgbmV3SW5kZXggPSBzb3J0KGNyb3NzZmlsdGVyX3JhbmdlKG4xKSwgMCwgbjEpO1xuICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIG5ld0luZGV4KTtcblxuICAgICAgLy8gQmlzZWN0IG5ld1ZhbHVlcyB0byBkZXRlcm1pbmUgd2hpY2ggbmV3IHJlY29yZHMgYXJlIHNlbGVjdGVkLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKG5ld1ZhbHVlcyksIGxvMSA9IGJvdW5kc1swXSwgaGkxID0gYm91bmRzWzFdLCBpO1xuICAgICAgaWYgKHJlZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4xOyArK2kpIHtcbiAgICAgICAgICBpZiAoIXJlZmlsdGVyRnVuY3Rpb24obmV3VmFsdWVzW2ldLCBpKSkgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvMTsgKytpKSBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICBmb3IgKGkgPSBoaTE7IGkgPCBuMTsgKytpKSBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGlzIGRpbWVuc2lvbiBwcmV2aW91c2x5IGhhZCBubyBkYXRhLCB0aGVuIHdlIGRvbid0IG5lZWQgdG8gZG8gdGhlXG4gICAgICAvLyBtb3JlIGV4cGVuc2l2ZSBtZXJnZSBvcGVyYXRpb247IHVzZSB0aGUgbmV3IHZhbHVlcyBhbmQgaW5kZXggYXMtaXMuXG4gICAgICBpZiAoIW4wKSB7XG4gICAgICAgIHZhbHVlcyA9IG5ld1ZhbHVlcztcbiAgICAgICAgaW5kZXggPSBuZXdJbmRleDtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIG9sZFZhbHVlcyA9IHZhbHVlcyxcbiAgICAgICAgICBvbGRJbmRleCA9IGluZGV4LFxuICAgICAgICAgIGkwID0gMCxcbiAgICAgICAgICBpMSA9IDA7XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG5ldyBhcnJheXMgaW50byB3aGljaCB0byBtZXJnZSBuZXcgYW5kIG9sZC5cbiAgICAgIHZhbHVlcyA9IG5ldyBBcnJheShuKTtcbiAgICAgIGluZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG5cbiAgICAgIC8vIE1lcmdlIHRoZSBvbGQgYW5kIG5ldyBzb3J0ZWQgdmFsdWVzLCBhbmQgb2xkIGFuZCBuZXcgaW5kZXguXG4gICAgICBmb3IgKGkgPSAwOyBpMCA8IG4wICYmIGkxIDwgbjE7ICsraSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTArK107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxKytdICsgbjA7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgaW5kZXhbaV0gPSBvbGRJbmRleFtpMF07XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG5ldyB2YWx1ZXMuXG4gICAgICBmb3IgKDsgaTEgPCBuMTsgKytpMSwgKytpKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTFdICsgbjA7XG4gICAgICB9XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpLCBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBXaGVuIGFsbCBmaWx0ZXJzIGhhdmUgdXBkYXRlZCwgbm90aWZ5IGluZGV4IGxpc3RlbmVycyBvZiB0aGUgbmV3IHZhbHVlcy5cbiAgICBmdW5jdGlvbiBwb3N0QWRkKG5ld0RhdGEsIG4wLCBuMSkge1xuICAgICAgaW5kZXhMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKTsgfSk7XG4gICAgICBuZXdWYWx1ZXMgPSBuZXdJbmRleCA9IG51bGw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVtb3ZlRGF0YShyZUluZGV4KSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIGs7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oayA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGlmIChpICE9PSBqKSB2YWx1ZXNbal0gPSB2YWx1ZXNbaV07XG4gICAgICAgICAgaW5kZXhbal0gPSByZUluZGV4W2tdO1xuICAgICAgICAgICsrajtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFsdWVzLmxlbmd0aCA9IGo7XG4gICAgICB3aGlsZSAoaiA8IG4pIGluZGV4W2orK10gPSAwO1xuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgdmFyIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyk7XG4gICAgICBsbzAgPSBib3VuZHNbMF0sIGhpMCA9IGJvdW5kc1sxXTtcbiAgICB9XG5cbiAgICAvLyBVcGRhdGVzIHRoZSBzZWxlY3RlZCB2YWx1ZXMgYmFzZWQgb24gdGhlIHNwZWNpZmllZCBib3VuZHMgW2xvLCBoaV0uXG4gICAgLy8gVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyB1c2VkIGJ5IGFsbCB0aGUgcHVibGljIGZpbHRlciBtZXRob2RzLlxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4Qm91bmRzKGJvdW5kcykge1xuICAgICAgdmFyIGxvMSA9IGJvdW5kc1swXSxcbiAgICAgICAgICBoaTEgPSBib3VuZHNbMV07XG5cbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZmlsdGVyRnVuY3Rpb24gPSBudWxsO1xuICAgICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKGZ1bmN0aW9uKGQsIGkpIHsgcmV0dXJuIGxvMSA8PSBpICYmIGkgPCBoaTE7IH0pO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdO1xuXG4gICAgICAvLyBGYXN0IGluY3JlbWVudGFsIHVwZGF0ZSBiYXNlZCBvbiBwcmV2aW91cyBsbyBpbmRleC5cbiAgICAgIGlmIChsbzEgPCBsbzApIHtcbiAgICAgICAgZm9yIChpID0gbG8xLCBqID0gTWF0aC5taW4obG8wLCBoaTEpOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAobG8xID4gbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMCwgaiA9IE1hdGgubWluKGxvMSwgaGkwKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhpMSA8IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzAsIGhpMSksIGogPSBoaTA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBzcGVjaWZpZWQgcmFuZ2UgW2xvLCBoaV0uXG4gICAgLy8gVGhlIGxvd2VyIGJvdW5kIGlzIGluY2x1c2l2ZSwgYW5kIHRoZSB1cHBlciBib3VuZCBpcyBleGNsdXNpdmUuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmFuZ2UocmFuZ2UpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXJzIGFueSBmaWx0ZXJzIG9uIHRoaXMgZGltZW5zaW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckZ1bmN0aW9uKGYpIHtcbiAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKHJlZmlsdGVyRnVuY3Rpb24gPSBmKTtcblxuICAgICAgbG8wID0gMDtcbiAgICAgIGhpMCA9IG47XG5cbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhGdW5jdGlvbihmKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW107XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpbmRleFtpXV0gJiBvbmUpIF4gISEoeCA9IGYodmFsdWVzW2ldLCBpKSkpIHtcbiAgICAgICAgICBpZiAoeCkgZmlsdGVyc1tvZmZzZXRdW2tdICY9IHplcm8sIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgZWxzZSBmaWx0ZXJzW29mZnNldF1ba10gfD0gb25lLCByZW1vdmVkLnB1c2goayk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSB0b3AgSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBoaTAsXG4gICAgICAgICAgajtcblxuICAgICAgd2hpbGUgKC0taSA+PSBsbzAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGJvdHRvbSBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiBib3R0b20oaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGxvMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoaSA8IGhpMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGogPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgICBpKys7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBBZGRzIGEgbmV3IGdyb3VwIHRvIHRoaXMgZGltZW5zaW9uLCB1c2luZyB0aGUgc3BlY2lmaWVkIGtleSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBncm91cChrZXkpIHtcbiAgICAgIHZhciBncm91cCA9IHtcbiAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIGFsbDogYWxsLFxuICAgICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgICByZWR1Y2VTdW06IHJlZHVjZVN1bSxcbiAgICAgICAgb3JkZXI6IG9yZGVyLFxuICAgICAgICBvcmRlck5hdHVyYWw6IG9yZGVyTmF0dXJhbCxcbiAgICAgICAgc2l6ZTogc2l6ZSxcbiAgICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgfTtcblxuICAgICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBncm91cCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgZGltZW5zaW9uIGlzIHJlbW92ZWQuXG4gICAgICBkaW1lbnNpb25Hcm91cHMucHVzaChncm91cCk7XG5cbiAgICAgIHZhciBncm91cHMsIC8vIGFycmF5IG9mIHtrZXksIHZhbHVlfVxuICAgICAgICAgIGdyb3VwSW5kZXgsIC8vIG9iamVjdCBpZCDihqYgZ3JvdXAgaWRcbiAgICAgICAgICBncm91cFdpZHRoID0gOCxcbiAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCksXG4gICAgICAgICAgayA9IDAsIC8vIGNhcmRpbmFsaXR5XG4gICAgICAgICAgc2VsZWN0LFxuICAgICAgICAgIGhlYXAsXG4gICAgICAgICAgcmVkdWNlQWRkLFxuICAgICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZSxcbiAgICAgICAgICBncm91cEFsbCA9IGtleSA9PT0gY3Jvc3NmaWx0ZXJfbnVsbDtcblxuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxKSBrZXkgPSBjcm9zc2ZpbHRlcl9pZGVudGl0eTtcblxuICAgICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgYXNzb2NpYXRlZCByZWR1Y2UgdmFsdWVzLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvXG4gICAgICAvLyB0aGUgcGFyZW50IGRpbWVuc2lvbiBmb3Igd2hlbiBkYXRhIGlzIGFkZGVkLCBhbmQgY29tcHV0ZSBuZXcga2V5cy5cbiAgICAgIGZpbHRlckxpc3RlbmVycy5wdXNoKHVwZGF0ZSk7XG4gICAgICBpbmRleExpc3RlbmVycy5wdXNoKGFkZCk7XG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlIGFueSBleGlzdGluZyBkYXRhIGludG8gdGhlIGdyb3VwaW5nLlxuICAgICAgYWRkKHZhbHVlcywgaW5kZXgsIDAsIG4pO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgdmFsdWVzIGludG8gdGhpcyBncm91cC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGdyb3VwcyBhbmQgZ3JvdXBJbmRleC5cbiAgICAgIGZ1bmN0aW9uIGFkZChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpIHtcbiAgICAgICAgdmFyIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIHJlbW92ZSA9IHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVtb3ZlID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgZ3JvdXBJbmRleCA9IGswID4gMSA/IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4oZ3JvdXBJbmRleCwgbikgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBncm91cENhcGFjaXR5KTtcblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuICAgICAgICAgIHdoaWxlICghKHgxID4geCkpIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXhbaiA9IG5ld0luZGV4W2kxXSArIG4wXSA9IGs7XG5cbiAgICAgICAgICAgIC8vIEFsd2F5cyBhZGQgbmV3IHZhbHVlcyB0byBncm91cHMuIE9ubHkgcmVtb3ZlIHdoZW4gbm90IGluIGZpbHRlci5cbiAgICAgICAgICAgIC8vIFRoaXMgZ2l2ZXMgZ3JvdXBzIGZ1bGwgaW5mb3JtYXRpb24gb24gZGF0YSBsaWZlLWN5Y2xlLlxuICAgICAgICAgICAgZy52YWx1ZSA9IGFkZChnLnZhbHVlLCBkYXRhW2pdLCB0cnVlKTtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvRXhjZXB0KGosIG9mZnNldCwgemVybykpIGcudmFsdWUgPSByZW1vdmUoZy52YWx1ZSwgZGF0YVtqXSwgZmFsc2UpO1xuICAgICAgICAgICAgaWYgKCsraTEgPj0gbjEpIGJyZWFrO1xuICAgICAgICAgICAgeDEgPSBrZXkobmV3VmFsdWVzW2kxXSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCBncm91cHMgdGhhdCB3ZXJlIGdyZWF0ZXIgdGhhbiBhbGwgbmV3IGtleXMuXG4gICAgICAgIC8vIE5vIGluY3JlbWVudGFsIHJlZHVjZSBpcyBuZWVkZWQ7IHRoZXNlIGdyb3VwcyBoYXZlIG5vIG5ldyByZWNvcmRzLlxuICAgICAgICAvLyBBbHNvIHJlY29yZCB0aGUgbmV3IGluZGV4IG9mIHRoZSBvbGQgZ3JvdXAuXG4gICAgICAgIHdoaWxlIChpMCA8IGswKSB7XG4gICAgICAgICAgZ3JvdXBzW3JlSW5kZXhbaTBdID0ga10gPSBvbGRHcm91cHNbaTArK107XG4gICAgICAgICAgZ3JvdXBJbmNyZW1lbnQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHdlIGFkZGVkIGFueSBuZXcgZ3JvdXBzIGJlZm9yZSBhbnkgb2xkIGdyb3VwcyxcbiAgICAgICAgLy8gdXBkYXRlIHRoZSBncm91cCBpbmRleCBvZiBhbGwgdGhlIG9sZCByZWNvcmRzLlxuICAgICAgICBpZiAoayA+IGkwKSBmb3IgKGkwID0gMDsgaTAgPCBuMDsgKytpMCkge1xuICAgICAgICAgIGdyb3VwSW5kZXhbaTBdID0gcmVJbmRleFtncm91cEluZGV4W2kwXV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb2RpZnkgdGhlIHVwZGF0ZSBhbmQgcmVzZXQgYmVoYXZpb3IgYmFzZWQgb24gdGhlIGNhcmRpbmFsaXR5LlxuICAgICAgICAvLyBJZiB0aGUgY2FyZGluYWxpdHkgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIG9uZSwgdGhlbiB0aGUgZ3JvdXBJbmRleFxuICAgICAgICAvLyBpcyBub3QgbmVlZGVkLiBJZiB0aGUgY2FyZGluYWxpdHkgaXMgemVybywgdGhlbiB0aGVyZSBhcmUgbm8gcmVjb3Jkc1xuICAgICAgICAvLyBhbmQgdGhlcmVmb3JlIG5vIGdyb3VwcyB0byB1cGRhdGUgb3IgcmVzZXQuIE5vdGUgdGhhdCB3ZSBhbHNvIG11c3RcbiAgICAgICAgLy8gY2hhbmdlIHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyIHRvIHBvaW50IHRvIHRoZSBuZXcgbWV0aG9kLlxuICAgICAgICBqID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdXBkYXRlID0gdXBkYXRlTWFueTtcbiAgICAgICAgICByZXNldCA9IHJlc2V0TWFueTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIWsgJiYgZ3JvdXBBbGwpIHtcbiAgICAgICAgICAgIGsgPSAxO1xuICAgICAgICAgICAgZ3JvdXBzID0gW3trZXk6IG51bGwsIHZhbHVlOiBpbml0aWFsKCl9XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU9uZTtcbiAgICAgICAgICAgIHJlc2V0ID0gcmVzZXRPbmU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZpbHRlckxpc3RlbmVyc1tqXSA9IHVwZGF0ZTtcblxuICAgICAgICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGFkZGVkIGdyb3VwcyxcbiAgICAgICAgLy8gYW5kIHdpZGVuIHRoZSBncm91cCBpbmRleCBhcyBuZWVkZWQuXG4gICAgICAgIGZ1bmN0aW9uIGdyb3VwSW5jcmVtZW50KCkge1xuICAgICAgICAgIGlmICgrK2sgPT09IGdyb3VwQ2FwYWNpdHkpIHtcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKHJlSW5kZXgsIGdyb3VwV2lkdGggPDw9IDEpO1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4oZ3JvdXBJbmRleCwgZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHZhciBvbGRLID0gayxcbiAgICAgICAgICAgICAgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgICBzZWVuR3JvdXBzID0gY3Jvc3NmaWx0ZXJfaW5kZXgob2xkSywgb2xkSyk7XG5cbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IG5vbi1tYXRjaGVzIGJ5IGNvcHlpbmcgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcyB0b1xuICAgICAgICAgIC8vIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tncm91cEluZGV4W2pdID0gZ3JvdXBJbmRleFtpXV0gPSAxO1xuICAgICAgICAgICAgICArK2o7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVhc3NlbWJsZSBncm91cHMgaW5jbHVkaW5nIG9ubHkgdGhvc2UgZ3JvdXBzIHRoYXQgd2VyZSByZWZlcnJlZFxuICAgICAgICAgIC8vIHRvIGJ5IG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMuICBOb3RlIHRoZSBuZXcgZ3JvdXAgaW5kZXggaW5cbiAgICAgICAgICAvLyBzZWVuR3JvdXBzLlxuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb2xkSzsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc2Vlbkdyb3Vwc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2ldID0gaysrO1xuICAgICAgICAgICAgICBncm91cHMucHVzaChvbGRHcm91cHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgICAgLy8gUmVpbmRleCB0aGUgZ3JvdXAgaW5kZXggdXNpbmcgc2Vlbkdyb3VwcyB0byBmaW5kIHRoZSBuZXcgaW5kZXguXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGo7ICsraSkgZ3JvdXBJbmRleFtpXSA9IHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPSBrID4gMVxuICAgICAgICAgICAgICA/IChyZXNldCA9IHJlc2V0TWFueSwgdXBkYXRlID0gdXBkYXRlTWFueSlcbiAgICAgICAgICAgICAgOiBrID09PSAxID8gKHJlc2V0ID0gcmVzZXRPbmUsIHVwZGF0ZSA9IHVwZGF0ZU9uZSlcbiAgICAgICAgICAgICAgOiByZXNldCA9IHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gMSkge1xuICAgICAgICAgIGlmIChncm91cEFsbCkgcmV0dXJuO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBpZiAoIWZpbHRlcnMuemVybyhpKSkgcmV0dXJuO1xuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPVxuICAgICAgICAgIHVwZGF0ZSA9IHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICAvLyBub3RGaWx0ZXIgaW5kaWNhdGVzIGEgY3Jvc3NmaWx0ZXIuYWRkL3JlbW92ZSBvcGVyYXRpb24uXG4gICAgICBmdW5jdGlvbiB1cGRhdGVNYW55KGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlT25lKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICAgIGlmICgoZmlsdGVyT25lID09PSBvbmUgJiYgZmlsdGVyT2Zmc2V0ID09PSBvZmZzZXQpIHx8IHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy56ZXJvRXhjZXB0KGsgPSBhZGRlZFtpXSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2tdKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRNYW55KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgLy8gUmVzZXQgYWxsIGdyb3VwIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGs7ICsraSkge1xuICAgICAgICAgIGdyb3Vwc1tpXS52YWx1ZSA9IHJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0T25lKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHNpbmdsZXRvbiBncm91cCB2YWx1ZXMuXG4gICAgICAgIGcudmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgYXJyYXkgb2YgZ3JvdXAgdmFsdWVzLCBpbiB0aGUgZGltZW5zaW9uJ3MgbmF0dXJhbCBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBLIGdyb3VwIHZhbHVlcywgaW4gcmVkdWNlIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgICAgdmFyIHRvcCA9IHNlbGVjdChhbGwoKSwgMCwgZ3JvdXBzLmxlbmd0aCwgayk7XG4gICAgICAgIHJldHVybiBoZWFwLnNvcnQodG9wLCAwLCB0b3AubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWVzLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0gaGVhcHNlbGVjdF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgaGVhcCA9IGhlYXBfYnkodmFsdWVPZik7XG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlT2YoZCkgeyByZXR1cm4gdmFsdWUoZC52YWx1ZSk7IH1cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgbmF0dXJhbCBvcmRlcmluZyBieSByZWR1Y2UgdmFsdWUuXG4gICAgICBmdW5jdGlvbiBvcmRlck5hdHVyYWwoKSB7XG4gICAgICAgIHJldHVybiBvcmRlcihjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGNhcmRpbmFsaXR5IG9mIHRoaXMgZ3JvdXAsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgICAgIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBrO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gaW5kZXhMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgICBpZiAoaSA+PSAwKSBpbmRleExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWR1Y2VDb3VudCgpLm9yZGVyTmF0dXJhbCgpO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGdlbmVyYXRpbmcgYSBzaW5nbGV0b24gZ3JvdXAuXG4gICAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgICB2YXIgZyA9IGdyb3VwKGNyb3NzZmlsdGVyX251bGwpLCBhbGwgPSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLnRvcDtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyO1xuICAgICAgZGVsZXRlIGcub3JkZXJOYXR1cmFsO1xuICAgICAgZGVsZXRlIGcuc2l6ZTtcbiAgICAgIGcudmFsdWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbCgpWzBdLnZhbHVlOyB9O1xuICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGRpbWVuc2lvbiBhbmQgYXNzb2NpYXRlZCBncm91cHMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgZGltZW5zaW9uR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgZ3JvdXAuZGlzcG9zZSgpOyB9KTtcbiAgICAgIHZhciBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHByZUFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocG9zdEFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGZpbHRlcnMubWFza3Nbb2Zmc2V0XSAmPSB6ZXJvO1xuICAgICAgcmV0dXJuIGZpbHRlckFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkaW1lbnNpb247XG4gIH1cblxuICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ3JvdXBBbGwgb24gYSBkdW1teSBkaW1lbnNpb24uXG4gIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIG9wdGltaXplZCBzaW5jZSBpdCBhbHdheXMgaGFzIGNhcmRpbmFsaXR5IDEuXG4gIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgIHZhciBncm91cCA9IHtcbiAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgcmVkdWNlVmFsdWUsXG4gICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG5cbiAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvIHRoZSBwYXJlbnRcbiAgICAvLyBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZC5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChhZGQpO1xuXG4gICAgLy8gRm9yIGNvbnNpc3RlbmN5OyBhY3R1YWxseSBhIG5vLW9wIHNpbmNlIHJlc2V0TmVlZGVkIGlzIHRydWUuXG4gICAgYWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIG4wKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSBuMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgZnVuY3Rpb24gdXBkYXRlKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIG47XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhrID0gYWRkZWRbaV0pKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy5vbmx5KGsgPSByZW1vdmVkW2ldLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZSBmcm9tIHNjcmF0Y2guXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBpdCBpcyBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGNvbXB1dGVkIHJlZHVjZSB2YWx1ZS5cbiAgICBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiByZWR1Y2VWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZHVjZUNvdW50KCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgcmVjb3JkcyBpbiB0aGlzIGNyb3NzZmlsdGVyLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSByYXcgcm93IGRhdGEgY29udGFpbmVkIGluIHRoaXMgY3Jvc3NmaWx0ZXJcbiAgZnVuY3Rpb24gYWxsKCl7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aFxuICAgICAgPyBhZGQoYXJndW1lbnRzWzBdKVxuICAgICAgOiBjcm9zc2ZpbHRlcjtcbn1cblxuLy8gUmV0dXJucyBhbiBhcnJheSBvZiBzaXplIG4sIGJpZyBlbm91Z2ggdG8gc3RvcmUgaWRzIHVwIHRvIG0uXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9pbmRleChuLCBtKSB7XG4gIHJldHVybiAobSA8IDB4MTAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5OCA6IG0gPCAweDEwMDAxXG4gICAgICA/IGNyb3NzZmlsdGVyX2FycmF5MTZcbiAgICAgIDogY3Jvc3NmaWx0ZXJfYXJyYXkzMikobik7XG59XG5cbi8vIENvbnN0cnVjdHMgYSBuZXcgYXJyYXkgb2Ygc2l6ZSBuLCB3aXRoIHNlcXVlbnRpYWwgdmFsdWVzIGZyb20gMCB0byBuIC0gMS5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JhbmdlKG4pIHtcbiAgdmFyIHJhbmdlID0gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbik7XG4gIGZvciAodmFyIGkgPSAtMTsgKytpIDwgbjspIHJhbmdlW2ldID0gaTtcbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9jYXBhY2l0eSh3KSB7XG4gIHJldHVybiB3ID09PSA4XG4gICAgICA/IDB4MTAwIDogdyA9PT0gMTZcbiAgICAgID8gMHgxMDAwMFxuICAgICAgOiAweDEwMDAwMDAwMDtcbn1cbn0pKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJyAmJiBleHBvcnRzIHx8IHRoaXMpO1xuIiwidmFyIHJlZHVjdGlvX3BhcmFtZXRlcnMgPSByZXF1aXJlKCcuL3BhcmFtZXRlcnMuanMnKTtcblxuZnVuY3Rpb24gYWNjZXNzb3JfYnVpbGQob2JqLCBwKSB7XG5cdC8vIG9iai5vcmRlciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdC8vIFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5vcmRlcjtcblx0Ly8gXHRwLm9yZGVyID0gdmFsdWU7XG5cdC8vIFx0cmV0dXJuIG9iajtcblx0Ly8gfTtcblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeSh2KSB7XG5cdFx0aWYoIHR5cGVvZiB2ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdC8vIFJld3JpdGUgdG8gYSBmdW5jdGlvblxuXHRcdFx0dmFyIHRlbXBWYWx1ZSA9IHY7XG5cdFx0XHR2YXIgZnVuYyA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkW3RlbXBWYWx1ZV07IH1cblx0XHRcdHJldHVybiBmdW5jO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdjtcblx0XHR9XG5cdH1cblxuXHQvLyBDb252ZXJ0cyBhIHN0cmluZyB0byBhbiBhY2Nlc3NvciBmdW5jdGlvblxuXHRmdW5jdGlvbiBhY2Nlc3NvcmlmeU51bWVyaWModikge1xuXHRcdGlmKCB0eXBlb2YgdiA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHQvLyBSZXdyaXRlIHRvIGEgZnVuY3Rpb25cblx0XHRcdHZhciB0ZW1wVmFsdWUgPSB2O1xuXHRcdFx0dmFyIGZ1bmMgPSBmdW5jdGlvbiAoZCkgeyByZXR1cm4gK2RbdGVtcFZhbHVlXTsgfVxuXHRcdFx0cmV0dXJuIGZ1bmM7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB2O1xuXHRcdH1cblx0fVxuXG5cdG9iai5jb3VudCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5jb3VudDtcblx0XHRwLmNvdW50ID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouc3VtID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN1bTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuc3VtID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYXZnID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmF2ZztcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdC8vIFdlIGNhbiB0YWtlIGFuIGFjY2Vzc29yIGZ1bmN0aW9uLCBhIGJvb2xlYW4sIG9yIGEgc3RyaW5nXG5cdFx0aWYoIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyApIHtcblx0XHRcdGlmKHAuc3VtKSBjb25zb2xlLndhcm4oJ1NVTSBhZ2dyZWdhdGlvbiBpcyBiZWluZyBvdmVyd3JpdHRlbiBieSBBVkcgYWdncmVnYXRpb24nKTtcblx0XHRcdHAuc3VtID0gdmFsdWU7XG5cdFx0XHRwLmF2ZyA9IHRydWU7XG5cdFx0XHRwLmNvdW50ID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cC5hdmcgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvbkFjY2Vzc29yO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeSh2YWx1ZSk7XG5cblx0XHRwLmV4Y2VwdGlvbkFjY2Vzc29yID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZmlsdGVyID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmZpbHRlcjtcblx0XHRwLmZpbHRlciA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnZhbHVlTGlzdCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC52YWx1ZUxpc3Q7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdHAudmFsdWVMaXN0ID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoubWVkaWFuID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm1lZGlhbjtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdGlmKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYocC52YWx1ZUxpc3QpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1lZGlhbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5tZWRpYW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5taW4gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWluO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCkgY29uc29sZS53YXJuKCdWQUxVRUxJU1QgYWNjZXNzb3IgaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgbWVkaWFuIGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLnZhbHVlTGlzdCA9IHZhbHVlO1xuXHRcdH1cblx0XHRwLm1pbiA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLm1heCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5tYXg7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGlmKHAudmFsdWVMaXN0KSBjb25zb2xlLndhcm4oJ1ZBTFVFTElTVCBhY2Nlc3NvciBpcyBiZWluZyBvdmVyd3JpdHRlbiBieSBtZWRpYW4gYWdncmVnYXRpb24nKTtcblx0XHRcdHAudmFsdWVMaXN0ID0gdmFsdWU7XG5cdFx0fVxuXHRcdHAubWF4ID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uQ291bnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uQ291bnQ7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5KHZhbHVlKTtcblxuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZihwLnN1bSkgY29uc29sZS53YXJuKCdFWENFUFRJT04gYWNjZXNzb3IgaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgZXhjZXB0aW9uIGNvdW50IGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLmV4Y2VwdGlvbkFjY2Vzc29yID0gdmFsdWU7XG5cdFx0XHRwLmV4Y2VwdGlvbkNvdW50ID0gdHJ1ZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cC5leGNlcHRpb25Db3VudCA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5leGNlcHRpb25TdW0gPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZXhjZXB0aW9uU3VtO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0cC5leGNlcHRpb25TdW0gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5oaXN0b2dyYW1WYWx1ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5oaXN0b2dyYW1WYWx1ZTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuaGlzdG9ncmFtVmFsdWUgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5oaXN0b2dyYW1CaW5zID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmhpc3RvZ3JhbVRocmVzaG9sZHM7XG5cdFx0cC5oaXN0b2dyYW1UaHJlc2hvbGRzID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouc3RkID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN0ZDtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdGlmKHR5cGVvZih2YWx1ZSkgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdHAuc3VtT2ZTcXVhcmVzID0gdmFsdWU7XG5cdFx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdFx0cC5jb3VudCA9IHRydWU7XG5cdFx0XHRwLnN0ZCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuc3RkID0gdmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN1bU9mU3EgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuc3VtT2ZTcXVhcmVzO1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0cC5zdW1PZlNxdWFyZXMgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai52YWx1ZSA9IGZ1bmN0aW9uKHZhbHVlLCBhY2Nlc3Nvcikge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCB8fCB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIid2YWx1ZScgcmVxdWlyZXMgYSBzdHJpbmcgYXJndW1lbnQuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZighcC52YWx1ZXMpIHAudmFsdWVzID0ge307XG5cdFx0XHRwLnZhbHVlc1t2YWx1ZV0gPSB7fTtcblx0XHRcdHAudmFsdWVzW3ZhbHVlXS5wYXJhbWV0ZXJzID0gcmVkdWN0aW9fcGFyYW1ldGVycygpO1xuXHRcdFx0YWNjZXNzb3JfYnVpbGQocC52YWx1ZXNbdmFsdWVdLCBwLnZhbHVlc1t2YWx1ZV0ucGFyYW1ldGVycyk7XG5cdFx0XHRpZihhY2Nlc3NvcikgcC52YWx1ZXNbdmFsdWVdLmFjY2Vzc29yID0gYWNjZXNzb3I7XG5cdFx0XHRyZXR1cm4gcC52YWx1ZXNbdmFsdWVdO1xuXHRcdH1cblx0fTtcblxuXHRvYmoubmVzdCA9IGZ1bmN0aW9uKGtleUFjY2Vzc29yQXJyYXkpIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubmVzdEtleXM7XG5cblx0XHRrZXlBY2Nlc3NvckFycmF5Lm1hcChhY2Nlc3NvcmlmeSk7XG5cblx0XHRwLm5lc3RLZXlzID0ga2V5QWNjZXNzb3JBcnJheTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5hbGlhcyA9IGZ1bmN0aW9uKHByb3BBY2Nlc3Nvck9iaikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hbGlhc0tleXM7XG5cdFx0cC5hbGlhc0tleXMgPSBwcm9wQWNjZXNzb3JPYmo7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYWxpYXNQcm9wID0gZnVuY3Rpb24ocHJvcEFjY2Vzc29yT2JqKSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmFsaWFzUHJvcEtleXM7XG5cdFx0cC5hbGlhc1Byb3BLZXlzID0gcHJvcEFjY2Vzc29yT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmdyb3VwQWxsID0gZnVuY3Rpb24oZ3JvdXBUZXN0KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmdyb3VwQWxsO1xuXHRcdHAuZ3JvdXBBbGwgPSBncm91cFRlc3Q7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZGF0YUxpc3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuZGF0YUxpc3Q7XG5cdFx0cC5kYXRhTGlzdCA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cbn1cblxudmFyIHJlZHVjdGlvX2FjY2Vzc29ycyA9IHtcblx0YnVpbGQ6IGFjY2Vzc29yX2J1aWxkXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FjY2Vzc29ycztcbiIsInZhciByZWR1Y3Rpb19hbGlhcyA9IHtcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgsIG9iaikge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdGZvcih2YXIgcHJvcCBpbiBvYmopIHtcblx0XHRcdFx0cGF0aChwKVtwcm9wXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gb2JqW3Byb3BdKHBhdGgocCkpOyB9O1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hbGlhczsiLCJ2YXIgcmVkdWN0aW9fYWxpYXNfcHJvcCA9IHtcblx0YWRkOiBmdW5jdGlvbiAob2JqLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRmb3IodmFyIHByb3AgaW4gb2JqKSB7XG5cdFx0XHRcdHBhdGgocClbcHJvcF0gPSBvYmpbcHJvcF0ocGF0aChwKSx2KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYWxpYXNfcHJvcDsiLCJ2YXIgcmVkdWN0aW9fYXZnID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpZihwYXRoKHApLmNvdW50ID4gMCkge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IHBhdGgocCkuc3VtIC8gcGF0aChwKS5jb3VudDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGlmKHBhdGgocCkuY291bnQgPiAwKSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gcGF0aChwKS5zdW0gLyBwYXRoKHApLmNvdW50O1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmF2ZyA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2F2ZzsiLCJ2YXIgcmVkdWN0aW9fZmlsdGVyID0gcmVxdWlyZSgnLi9maWx0ZXIuanMnKTtcbnZhciByZWR1Y3Rpb19jb3VudCA9IHJlcXVpcmUoJy4vY291bnQuanMnKTtcbnZhciByZWR1Y3Rpb19zdW0gPSByZXF1aXJlKCcuL3N1bS5qcycpO1xudmFyIHJlZHVjdGlvX2F2ZyA9IHJlcXVpcmUoJy4vYXZnLmpzJyk7XG52YXIgcmVkdWN0aW9fbWVkaWFuID0gcmVxdWlyZSgnLi9tZWRpYW4uanMnKTtcbnZhciByZWR1Y3Rpb19taW4gPSByZXF1aXJlKCcuL21pbi5qcycpO1xudmFyIHJlZHVjdGlvX21heCA9IHJlcXVpcmUoJy4vbWF4LmpzJyk7XG52YXIgcmVkdWN0aW9fdmFsdWVfY291bnQgPSByZXF1aXJlKCcuL3ZhbHVlLWNvdW50LmpzJyk7XG52YXIgcmVkdWN0aW9fdmFsdWVfbGlzdCA9IHJlcXVpcmUoJy4vdmFsdWUtbGlzdC5qcycpO1xudmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudCA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uLWNvdW50LmpzJyk7XG52YXIgcmVkdWN0aW9fZXhjZXB0aW9uX3N1bSA9IHJlcXVpcmUoJy4vZXhjZXB0aW9uLXN1bS5qcycpO1xudmFyIHJlZHVjdGlvX2hpc3RvZ3JhbSA9IHJlcXVpcmUoJy4vaGlzdG9ncmFtLmpzJyk7XG52YXIgcmVkdWN0aW9fc3VtX29mX3NxID0gcmVxdWlyZSgnLi9zdW0tb2Ytc3F1YXJlcy5qcycpO1xudmFyIHJlZHVjdGlvX3N0ZCA9IHJlcXVpcmUoJy4vc3RkLmpzJyk7XG52YXIgcmVkdWN0aW9fbmVzdCA9IHJlcXVpcmUoJy4vbmVzdC5qcycpO1xudmFyIHJlZHVjdGlvX2FsaWFzID0gcmVxdWlyZSgnLi9hbGlhcy5qcycpO1xudmFyIHJlZHVjdGlvX2FsaWFzX3Byb3AgPSByZXF1aXJlKCcuL2FsaWFzUHJvcC5qcycpO1xudmFyIHJlZHVjdGlvX2RhdGFfbGlzdCA9IHJlcXVpcmUoJy4vZGF0YS1saXN0LmpzJyk7XG5cbmZ1bmN0aW9uIGJ1aWxkX2Z1bmN0aW9uKHAsIGYsIHBhdGgpIHtcblx0Ly8gV2UgaGF2ZSB0byBidWlsZCB0aGVzZSBmdW5jdGlvbnMgaW4gb3JkZXIuIEV2ZW50dWFsbHkgd2UgY2FuIGluY2x1ZGUgZGVwZW5kZW5jeVxuXHQvLyBpbmZvcm1hdGlvbiBhbmQgY3JlYXRlIGEgZGVwZW5kZW5jeSBncmFwaCBpZiB0aGUgcHJvY2VzcyBiZWNvbWVzIGNvbXBsZXggZW5vdWdoLlxuXG5cdGlmKCFwYXRoKSBwYXRoID0gZnVuY3Rpb24gKGQpIHsgcmV0dXJuIGQ7IH07XG5cblx0Ly8gS2VlcCB0cmFjayBvZiB0aGUgb3JpZ2luYWwgcmVkdWNlcnMgc28gdGhhdCBmaWx0ZXJpbmcgY2FuIHNraXAgYmFjayB0b1xuXHQvLyB0aGVtIGlmIHRoaXMgcGFydGljdWxhciB2YWx1ZSBpcyBmaWx0ZXJlZCBvdXQuXG5cdHZhciBvcmlnRiA9IHtcblx0XHRyZWR1Y2VBZGQ6IGYucmVkdWNlQWRkLFxuXHRcdHJlZHVjZVJlbW92ZTogZi5yZWR1Y2VSZW1vdmUsXG5cdFx0cmVkdWNlSW5pdGlhbDogZi5yZWR1Y2VJbml0aWFsXG5cdH07XG5cblx0aWYocC5jb3VudCB8fCBwLnN0ZCkge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fY291bnQuYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2NvdW50LnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fY291bnQuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5zdW0pIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N1bS5hZGQocC5zdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N1bS5yZW1vdmUocC5zdW0sIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19zdW0uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5hdmcpIHtcblx0XHRpZighcC5jb3VudCB8fCAhcC5zdW0pIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBzZXQgLmNvdW50KHRydWUpIGFuZCBkZWZpbmUgYSAuc3VtKGFjY2Vzc29yKSB0byB1c2UgLmF2Zyh0cnVlKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fYXZnLmFkZChwLnN1bSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19hdmcucmVtb3ZlKHAuc3VtLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19hdmcuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIFRoZSB1bmlxdWUtb25seSByZWR1Y2VycyBjb21lIGJlZm9yZSB0aGUgdmFsdWVfY291bnQgcmVkdWNlcnMuIFRoZXkgbmVlZCB0byBjaGVjayBpZlxuXHQvLyB0aGUgdmFsdWUgaXMgYWxyZWFkeSBpbiB0aGUgdmFsdWVzIGFycmF5IG9uIHRoZSBncm91cC4gVGhleSBzaG91bGQgb25seSBpbmNyZW1lbnQvZGVjcmVtZW50XG5cdC8vIGNvdW50cyBpZiB0aGUgdmFsdWUgbm90IGluIHRoZSBhcnJheSBvciB0aGUgY291bnQgb24gdGhlIHZhbHVlIGlzIDAuXG5cdGlmKHAuZXhjZXB0aW9uQ291bnQpIHtcblx0XHRpZighcC5leGNlcHRpb25BY2Nlc3Nvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIllvdSBtdXN0IGRlZmluZSBhbiAuZXhjZXB0aW9uKGFjY2Vzc29yKSB0byB1c2UgLmV4Y2VwdGlvbkNvdW50KHRydWUpLlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQuYWRkKHAuZXhjZXB0aW9uQWNjZXNzb3IsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LnJlbW92ZShwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdGlmKHAuZXhjZXB0aW9uU3VtKSB7XG5cdFx0aWYoIXAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBkZWZpbmUgYW4gLmV4Y2VwdGlvbihhY2Nlc3NvcikgdG8gdXNlIC5leGNlcHRpb25TdW0oYWNjZXNzb3IpLlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19leGNlcHRpb25fc3VtLmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBwLmV4Y2VwdGlvblN1bSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19leGNlcHRpb25fc3VtLnJlbW92ZShwLmV4Y2VwdGlvbkFjY2Vzc29yLCBwLmV4Y2VwdGlvblN1bSwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTWFpbnRhaW4gdGhlIHZhbHVlcyBhcnJheS5cblx0aWYocC52YWx1ZUxpc3QgfHwgcC5tZWRpYW4gfHwgcC5taW4gfHwgcC5tYXgpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3ZhbHVlX2xpc3QuYWRkKHAudmFsdWVMaXN0LCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb192YWx1ZV9saXN0LnJlbW92ZShwLnZhbHVlTGlzdCwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3ZhbHVlX2xpc3QuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gTWFpbnRhaW4gdGhlIGRhdGEgYXJyYXkuXG5cdGlmKHAuZGF0YUxpc3QpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2RhdGFfbGlzdC5hZGQocC5kYXRhTGlzdCwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZGF0YV9saXN0LnJlbW92ZShwLmRhdGFMaXN0LCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZGF0YV9saXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAubWVkaWFuKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19tZWRpYW4uYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX21lZGlhbi5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX21lZGlhbi5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHRpZihwLm1pbikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbWluLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19taW4ucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19taW4uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5tYXgpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX21heC5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbWF4LnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbWF4LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSB2YWx1ZXMgY291bnQgYXJyYXkuXG5cdGlmKHAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3ZhbHVlX2NvdW50LmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3ZhbHVlX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIEhpc3RvZ3JhbVxuXHRpZihwLmhpc3RvZ3JhbVZhbHVlICYmIHAuaGlzdG9ncmFtVGhyZXNob2xkcykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9faGlzdG9ncmFtLmFkZChwLmhpc3RvZ3JhbVZhbHVlLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19oaXN0b2dyYW0ucmVtb3ZlKHAuaGlzdG9ncmFtVmFsdWUsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19oaXN0b2dyYW0uaW5pdGlhbChwLmhpc3RvZ3JhbVRocmVzaG9sZHMgLGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBTdW0gb2YgU3F1YXJlc1xuXHRpZihwLnN1bU9mU3F1YXJlcykge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fc3VtX29mX3NxLmFkZChwLnN1bU9mU3F1YXJlcywgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fc3VtX29mX3NxLnJlbW92ZShwLnN1bU9mU3F1YXJlcywgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3N1bV9vZl9zcS5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBTdGFuZGFyZCBkZXZpYXRpb25cblx0aWYocC5zdGQpIHtcblx0XHRpZighcC5zdW1PZlNxdWFyZXMgfHwgIXAuc3VtKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3Qgc2V0IC5zdW1PZlNxKGFjY2Vzc29yKSBhbmQgZGVmaW5lIGEgLnN1bShhY2Nlc3NvcikgdG8gdXNlIC5zdGQodHJ1ZSkuIE9yIHVzZSAuc3RkKGFjY2Vzc29yKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fc3RkLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N0ZC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fc3RkLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBOZXN0aW5nXG5cdGlmKHAubmVzdEtleXMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX25lc3QuYWRkKHAubmVzdEtleXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX25lc3QucmVtb3ZlKHAubmVzdEtleXMsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19uZXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIEFsaWFzIGZ1bmN0aW9uc1xuXHRpZihwLmFsaWFzS2V5cykge1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2FsaWFzLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoLCBwLmFsaWFzS2V5cyk7XG5cdH1cblxuXHQvLyBBbGlhcyBwcm9wZXJ0aWVzIC0gdGhpcyBpcyBsZXNzIGVmZmljaWVudCB0aGFuIGFsaWFzIGZ1bmN0aW9uc1xuXHRpZihwLmFsaWFzUHJvcEtleXMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2FsaWFzX3Byb3AuYWRkKHAuYWxpYXNQcm9wS2V5cywgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdC8vIFRoaXMgaXNuJ3QgYSB0eXBvLiBUaGUgZnVuY3Rpb24gaXMgdGhlIHNhbWUgZm9yIGFkZC9yZW1vdmUuXG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19hbGlhc19wcm9wLmFkZChwLmFsaWFzUHJvcEtleXMsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0fVxuXG5cdC8vIEZpbHRlcnMgZGV0ZXJtaW5lIGlmIG91ciBidWlsdC11cCBwcmlvcnMgc2hvdWxkIHJ1biwgb3IgaWYgaXQgc2hvdWxkIHNraXBcblx0Ly8gYmFjayB0byB0aGUgZmlsdGVycyBnaXZlbiBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoaXMgYnVpbGQgZnVuY3Rpb24uXG5cdGlmIChwLmZpbHRlcikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZmlsdGVyLmFkZChwLmZpbHRlciwgZi5yZWR1Y2VBZGQsIG9yaWdGLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19maWx0ZXIucmVtb3ZlKHAuZmlsdGVyLCBmLnJlZHVjZVJlbW92ZSwgb3JpZ0YucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0fVxuXG5cdC8vIFZhbHVlcyBnbyBsYXN0LlxuXHRpZihwLnZhbHVlcykge1xuXHRcdE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHAudmFsdWVzKS5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcblx0XHRcdC8vIFNldCB1cCB0aGUgcGF0aCBvbiBlYWNoIGdyb3VwLlxuXHRcdFx0dmFyIHNldHVwUGF0aCA9IGZ1bmN0aW9uKHByaW9yKSB7XG5cdFx0XHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdFx0XHRwYXRoKHApW25dID0ge307XG5cdFx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHRcdH07XG5cdFx0XHR9O1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gc2V0dXBQYXRoKGYucmVkdWNlSW5pdGlhbCk7XG5cdFx0XHRidWlsZF9mdW5jdGlvbihwLnZhbHVlc1tuXS5wYXJhbWV0ZXJzLCBmLCBmdW5jdGlvbiAocCkgeyByZXR1cm4gcFtuXTsgfSk7XG5cdFx0fSk7XG5cdH1cbn1cblxudmFyIHJlZHVjdGlvX2J1aWxkID0ge1xuXHRidWlsZDogYnVpbGRfZnVuY3Rpb25cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYnVpbGQ7XG4iLCJ2YXIgcGx1Y2sgPSBmdW5jdGlvbihuKXtcbiAgICByZXR1cm4gZnVuY3Rpb24oZCl7XG4gICAgICAgIHJldHVybiBkW25dO1xuICAgIH07XG59O1xuXG4vLyBzdXBwb3J0ZWQgb3BlcmF0b3JzIGFyZSBzdW0sIGF2ZywgYW5kIGNvdW50XG5fZ3JvdXBlciA9IGZ1bmN0aW9uKHBhdGgsIHByaW9yKXtcbiAgICBpZighcGF0aCkgcGF0aCA9IGZ1bmN0aW9uKGQpe3JldHVybiBkO307XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpe1xuICAgICAgICBpZihwcmlvcikgcHJpb3IocCwgdik7XG4gICAgICAgIHZhciB4ID0gcGF0aChwKSwgeSA9IHBhdGgodik7XG4gICAgICAgIGlmKHR5cGVvZiB5LmNvdW50ICE9PSAndW5kZWZpbmVkJykgeC5jb3VudCArPSB5LmNvdW50O1xuICAgICAgICBpZih0eXBlb2YgeS5zdW0gIT09ICd1bmRlZmluZWQnKSB4LnN1bSArPSB5LnN1bTtcbiAgICAgICAgaWYodHlwZW9mIHkuYXZnICE9PSAndW5kZWZpbmVkJykgeC5hdmcgPSB4LnN1bS94LmNvdW50O1xuICAgICAgICByZXR1cm4gcDtcbiAgICB9O1xufTtcblxucmVkdWN0aW9fY2FwID0gZnVuY3Rpb24gKHByaW9yLCBmLCBwKSB7XG4gICAgdmFyIG9iaiA9IGYucmVkdWNlSW5pdGlhbCgpO1xuICAgIC8vIHdlIHdhbnQgdG8gc3VwcG9ydCB2YWx1ZXMgc28gd2UnbGwgbmVlZCB0byBrbm93IHdoYXQgdGhvc2UgYXJlXG4gICAgdmFyIHZhbHVlcyA9IHAudmFsdWVzID8gT2JqZWN0LmtleXMocC52YWx1ZXMpIDogW107XG4gICAgdmFyIF9vdGhlcnNHcm91cGVyID0gX2dyb3VwZXIoKTtcbiAgICBpZiAodmFsdWVzLmxlbmd0aCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgX290aGVyc0dyb3VwZXIgPSBfZ3JvdXBlcihwbHVjayh2YWx1ZXNbaV0pLCBfb3RoZXJzR3JvdXBlcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjYXAsIG90aGVyc05hbWUpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcHJpb3IoKTtcbiAgICAgICAgaWYoIGNhcCA9PT0gSW5maW5pdHkgfHwgIWNhcCApIHJldHVybiBwcmlvcigpO1xuICAgICAgICB2YXIgYWxsID0gcHJpb3IoKTtcbiAgICAgICAgdmFyIHNsaWNlX2lkeCA9IGNhcC0xO1xuICAgICAgICBpZihhbGwubGVuZ3RoIDw9IGNhcCkgcmV0dXJuIGFsbDtcbiAgICAgICAgdmFyIGRhdGEgPSBhbGwuc2xpY2UoMCwgc2xpY2VfaWR4KTtcbiAgICAgICAgdmFyIG90aGVycyA9IHtrZXk6IG90aGVyc05hbWUgfHwgJ090aGVycyd9O1xuICAgICAgICBvdGhlcnMudmFsdWUgPSBmLnJlZHVjZUluaXRpYWwoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNsaWNlX2lkeDsgaSA8IGFsbC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgX290aGVyc0dyb3VwZXIob3RoZXJzLnZhbHVlLCBhbGxbaV0udmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEucHVzaChvdGhlcnMpO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19jYXA7XG4iLCJ2YXIgcmVkdWN0aW9fY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5jb3VudCsrO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLmNvdW50LS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbihwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0aWYocHJpb3IpIHAgPSBwcmlvcihwKTtcblx0XHRcdC8vIGlmKHAgPT09IHVuZGVmaW5lZCkgcCA9IHt9O1xuXHRcdFx0cGF0aChwKS5jb3VudCA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2NvdW50OyIsInZhciByZWR1Y3Rpb19kYXRhX2xpc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24oYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5kYXRhTGlzdC5wdXNoKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbihhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0LnNwbGljZShwYXRoKHApLmRhdGFMaXN0LmluZGV4T2YodiksIDEpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmRhdGFMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2RhdGFfbGlzdDtcbiIsInZhciByZWR1Y3Rpb19leGNlcHRpb25fY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgY291bnQrKyBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgZG9lc24ndCBjb250YWluIGEodikgb3IgaWYgaXQncyAwLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoKCFjdXJyIHx8IGN1cnJbMF0gIT09IGEodikpIHx8IGN1cnJbMV0gPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25Db3VudCsrO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBjb3VudC0tIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvbkNvdW50LS07XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuZXhjZXB0aW9uQ291bnQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19leGNlcHRpb25fY291bnQ7IiwidmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHN1bSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaSwgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gT25seSBzdW0gaWYgdGhlIHAudmFsdWVzIGFycmF5IGRvZXNuJ3QgY29udGFpbiBhKHYpIG9yIGlmIGl0J3MgMC5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKCghY3VyciB8fCBjdXJyWzBdICE9PSBhKHYpKSB8fCBjdXJyWzFdID09PSAwKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uU3VtID0gcGF0aChwKS5leGNlcHRpb25TdW0gKyBzdW0odik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBzdW0sIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgc3VtIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBjb250YWlucyBhKHYpIHZhbHVlIG9mIDEuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZihjdXJyICYmIGN1cnJbMF0gPT09IGEodikgJiYgY3VyclsxXSA9PT0gMSkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IHBhdGgocCkuZXhjZXB0aW9uU3VtIC0gc3VtKHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW07IiwidmFyIHJlZHVjdGlvX2ZpbHRlciA9IHtcblx0Ly8gVGhlIGJpZyBpZGVhIGhlcmUgaXMgdGhhdCB5b3UgZ2l2ZSB1cyBhIGZpbHRlciBmdW5jdGlvbiB0byBydW4gb24gdmFsdWVzLFxuXHQvLyBhICdwcmlvcicgcmVkdWNlciB0byBydW4gKGp1c3QgbGlrZSB0aGUgcmVzdCBvZiB0aGUgc3RhbmRhcmQgcmVkdWNlcnMpLFxuXHQvLyBhbmQgYSByZWZlcmVuY2UgdG8gdGhlIGxhc3QgcmVkdWNlciAoY2FsbGVkICdza2lwJyBiZWxvdykgZGVmaW5lZCBiZWZvcmVcblx0Ly8gdGhlIG1vc3QgcmVjZW50IGNoYWluIG9mIHJlZHVjZXJzLiAgVGhpcyBzdXBwb3J0cyBpbmRpdmlkdWFsIGZpbHRlcnMgZm9yXG5cdC8vIGVhY2ggLnZhbHVlKCcuLi4nKSBjaGFpbiB0aGF0IHlvdSBhZGQgdG8geW91ciByZWR1Y2VyLlxuXHRhZGQ6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChmaWx0ZXIsIHByaW9yLCBza2lwKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYgKGZpbHRlcih2LCBuZikpIHtcblx0XHRcdFx0aWYgKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoc2tpcCkgc2tpcChwLCB2LCBuZik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2ZpbHRlcjtcbiIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyJyk7XG5cbnZhciByZWR1Y3Rpb19oaXN0b2dyYW0gPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KS5sZWZ0O1xuXHRcdHZhciBiaXNlY3RIaXN0byA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkLng7IH0pLnJpZ2h0O1xuXHRcdHZhciBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRjdXJyID0gcGF0aChwKS5oaXN0b2dyYW1bYmlzZWN0SGlzdG8ocGF0aChwKS5oaXN0b2dyYW0sIGEodiksIDAsIHBhdGgocCkuaGlzdG9ncmFtLmxlbmd0aCkgLSAxXTtcblx0XHRcdGN1cnIueSsrO1xuXHRcdFx0Y3Vyci5zcGxpY2UoYmlzZWN0KGN1cnIsIGEodiksIDAsIGN1cnIubGVuZ3RoKSwgMCwgYSh2KSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHR2YXIgYmlzZWN0SGlzdG8gPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KS5yaWdodDtcblx0XHR2YXIgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkuaGlzdG9ncmFtW2Jpc2VjdEhpc3RvKHBhdGgocCkuaGlzdG9ncmFtLCBhKHYpLCAwLCBwYXRoKHApLmhpc3RvZ3JhbS5sZW5ndGgpIC0gMV07XG5cdFx0XHRjdXJyLnktLTtcblx0XHRcdGN1cnIuc3BsaWNlKGJpc2VjdChjdXJyLCBhKHYpLCAwLCBjdXJyLmxlbmd0aCksIDEpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHRocmVzaG9sZHMsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmhpc3RvZ3JhbSA9IFtdO1xuXHRcdFx0dmFyIGFyciA9IFtdO1xuXHRcdFx0Zm9yKHZhciBpID0gMTsgaSA8IHRocmVzaG9sZHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0YXJyID0gW107XG5cdFx0XHRcdGFyci54ID0gdGhyZXNob2xkc1tpIC0gMV07XG5cdFx0XHRcdGFyci5keCA9ICh0aHJlc2hvbGRzW2ldIC0gdGhyZXNob2xkc1tpIC0gMV0pO1xuXHRcdFx0XHRhcnIueSA9IDA7XG5cdFx0XHRcdHBhdGgocCkuaGlzdG9ncmFtLnB1c2goYXJyKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9faGlzdG9ncmFtOyIsInZhciByZWR1Y3Rpb19tYXggPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcbiBcblx0XHRcdHBhdGgocCkubWF4ID0gcGF0aChwKS52YWx1ZUxpc3RbcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoIC0gMV07XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1heCA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRwYXRoKHApLm1heCA9IHBhdGgocCkudmFsdWVMaXN0W3BhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkubWF4ID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19tYXg7IiwidmFyIHJlZHVjdGlvX21lZGlhbiA9IHtcblx0YWRkOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaGFsZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRoYWxmID0gTWF0aC5mbG9vcihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgvMik7XG4gXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggJSAyKSB7XG5cdFx0XHRcdHBhdGgocCkubWVkaWFuID0gcGF0aChwKS52YWx1ZUxpc3RbaGFsZl07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IChwYXRoKHApLnZhbHVlTGlzdFtoYWxmLTFdICsgcGF0aChwKS52YWx1ZUxpc3RbaGFsZl0pIC8gMi4wO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHZhciBoYWxmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGhhbGYgPSBNYXRoLmZsb29yKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aC8yKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDEgfHwgcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoICUgMikge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHBhdGgocCkudmFsdWVMaXN0W2hhbGZdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSAocGF0aChwKS52YWx1ZUxpc3RbaGFsZi0xXSArIHBhdGgocCkudmFsdWVMaXN0W2hhbGZdKSAvIDIuMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1lZGlhbiA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWVkaWFuOyIsInZhciByZWR1Y3Rpb19taW4gPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcbiBcblx0XHRcdHBhdGgocCkubWluID0gcGF0aChwKS52YWx1ZUxpc3RbMF07XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0Ly8gQ2hlY2sgZm9yIHVuZGVmaW5lZC5cblx0XHRcdGlmKHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLm1pbiA9IHVuZGVmaW5lZDtcblx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHR9XG4gXG5cdFx0XHRwYXRoKHApLm1pbiA9IHBhdGgocCkudmFsdWVMaXN0WzBdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkubWluID0gdW5kZWZpbmVkO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19taW47IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXInKTtcblxudmFyIHJlZHVjdGlvX25lc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGtleUFjY2Vzc29ycywgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaTsgLy8gQ3VycmVudCBrZXkgYWNjZXNzb3Jcblx0XHR2YXIgYXJyUmVmO1xuXHRcdHZhciBuZXdSZWY7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0YXJyUmVmID0gcGF0aChwKS5uZXN0O1xuXHRcdFx0a2V5QWNjZXNzb3JzLmZvckVhY2goZnVuY3Rpb24oYSkge1xuXHRcdFx0XHRuZXdSZWYgPSBhcnJSZWYuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5ID09PSBhKHYpOyB9KVswXTtcblx0XHRcdFx0aWYobmV3UmVmKSB7XG5cdFx0XHRcdFx0Ly8gVGhlcmUgaXMgYW5vdGhlciBsZXZlbC5cblx0XHRcdFx0XHRhcnJSZWYgPSBuZXdSZWYudmFsdWVzO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIE5leHQgbGV2ZWwgZG9lc24ndCB5ZXQgZXhpc3Qgc28gd2UgY3JlYXRlIGl0LlxuXHRcdFx0XHRcdG5ld1JlZiA9IFtdO1xuXHRcdFx0XHRcdGFyclJlZi5wdXNoKHsga2V5OiBhKHYpLCB2YWx1ZXM6IG5ld1JlZiB9KTtcblx0XHRcdFx0XHRhcnJSZWYgPSBuZXdSZWY7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRhcnJSZWYucHVzaCh2KTtcblx0XHRcdFxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoa2V5QWNjZXNzb3JzLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBhcnJSZWY7XG5cdFx0dmFyIG5leHRSZWY7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0YXJyUmVmID0gcGF0aChwKS5uZXN0O1xuXHRcdFx0a2V5QWNjZXNzb3JzLmZvckVhY2goZnVuY3Rpb24oYSkge1xuXHRcdFx0XHRhcnJSZWYgPSBhcnJSZWYuZmlsdGVyKGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5ID09PSBhKHYpOyB9KVswXS52YWx1ZXM7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gQXJyYXkgY29udGFpbnMgYW4gYWN0dWFsIHJlZmVyZW5jZSB0byB0aGUgcm93LCBzbyBqdXN0IHNwbGljZSBpdCBvdXQuXG5cdFx0XHRhcnJSZWYuc3BsaWNlKGFyclJlZi5pbmRleE9mKHYpLCAxKTtcblxuXHRcdFx0Ly8gSWYgdGhlIGxlYWYgbm93IGhhcyBsZW5ndGggMCBhbmQgaXQncyBub3QgdGhlIGJhc2UgYXJyYXkgcmVtb3ZlIGl0LlxuXHRcdFx0Ly8gVE9ET1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkubmVzdCA9IFtdO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19uZXN0OyIsInZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB7XG5cdFx0b3JkZXI6IGZhbHNlLFxuXHRcdGF2ZzogZmFsc2UsXG5cdFx0Y291bnQ6IGZhbHNlLFxuXHRcdHN1bTogZmFsc2UsXG5cdFx0ZXhjZXB0aW9uQWNjZXNzb3I6IGZhbHNlLFxuXHRcdGV4Y2VwdGlvbkNvdW50OiBmYWxzZSxcblx0XHRleGNlcHRpb25TdW06IGZhbHNlLFxuXHRcdGZpbHRlcjogZmFsc2UsXG5cdFx0dmFsdWVMaXN0OiBmYWxzZSxcblx0XHRtZWRpYW46IGZhbHNlLFxuXHRcdGhpc3RvZ3JhbVZhbHVlOiBmYWxzZSxcblx0XHRtaW46IGZhbHNlLFxuXHRcdG1heDogZmFsc2UsXG5cdFx0aGlzdG9ncmFtVGhyZXNob2xkczogZmFsc2UsXG5cdFx0c3RkOiBmYWxzZSxcblx0XHRzdW1PZlNxdWFyZXM6IGZhbHNlLFxuXHRcdHZhbHVlczogZmFsc2UsXG5cdFx0bmVzdEtleXM6IGZhbHNlLFxuXHRcdGFsaWFzS2V5czogZmFsc2UsXG5cdFx0YWxpYXNQcm9wS2V5czogZmFsc2UsXG5cdFx0Z3JvdXBBbGw6IGZhbHNlLFxuXHRcdGRhdGFMaXN0OiBmYWxzZVxuXHR9O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19wYXJhbWV0ZXJzO1xuIiwiZnVuY3Rpb24gcG9zdFByb2Nlc3MocmVkdWN0aW8pIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGdyb3VwLCBwLCBmKSB7XG4gICAgICAgIGdyb3VwLnBvc3QgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgdmFyIHBvc3Rwcm9jZXNzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2Vzcy5hbGwoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBwb3N0cHJvY2Vzcy5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwLmFsbCgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHZhciBwb3N0cHJvY2Vzc29ycyA9IHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzO1xuICAgICAgICAgICAgT2JqZWN0LmtleXMocG9zdHByb2Nlc3NvcnMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICBwb3N0cHJvY2Vzc1tuYW1lXSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIF9hbGwgPSBwb3N0cHJvY2Vzcy5hbGw7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0cHJvY2Vzcy5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3NvcnNbbmFtZV0oX2FsbCwgZiwgcCkuYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwb3N0cHJvY2VzcztcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3M7XG4gICAgICAgIH07XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwb3N0UHJvY2VzcztcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24ocmVkdWN0aW8pe1xuICAgIHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzID0ge307XG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yID0gZnVuY3Rpb24obmFtZSwgZnVuYyl7XG4gICAgICAgIHJlZHVjdGlvLnBvc3Rwcm9jZXNzb3JzW25hbWVdID0gZnVuYztcbiAgICB9O1xuXG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yKCdjYXAnLCByZXF1aXJlKCcuL2NhcCcpKTtcbiAgICByZWR1Y3Rpby5yZWdpc3RlclBvc3RQcm9jZXNzb3IoJ3NvcnRCeScsIHJlcXVpcmUoJy4vc29ydEJ5JykpO1xufTtcbiIsInZhciByZWR1Y3Rpb19idWlsZCA9IHJlcXVpcmUoJy4vYnVpbGQuanMnKTtcbnZhciByZWR1Y3Rpb19hY2Nlc3NvcnMgPSByZXF1aXJlKCcuL2FjY2Vzc29ycy5qcycpO1xudmFyIHJlZHVjdGlvX3BhcmFtZXRlcnMgPSByZXF1aXJlKCcuL3BhcmFtZXRlcnMuanMnKTtcbnZhciByZWR1Y3Rpb19wb3N0cHJvY2VzcyA9IHJlcXVpcmUoJy4vcG9zdHByb2Nlc3MnKTtcbnZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyJyk7XG5cbmZ1bmN0aW9uIHJlZHVjdGlvKCkge1xuXHR2YXIgcGFyYW1ldGVycyA9IHJlZHVjdGlvX3BhcmFtZXRlcnMoKTtcblxuXHR2YXIgZnVuY3MgPSB7fTtcblxuXHRmdW5jdGlvbiBteShncm91cCkge1xuXHRcdC8vIFN0YXJ0IGZyZXNoIGVhY2ggdGltZS5cblx0XHRmdW5jcyA9IHtcblx0XHRcdHJlZHVjZUFkZDogZnVuY3Rpb24ocCkgeyByZXR1cm4gcDsgfSxcblx0XHRcdHJlZHVjZVJlbW92ZTogZnVuY3Rpb24ocCkgeyByZXR1cm4gcDsgfSxcblx0XHRcdHJlZHVjZUluaXRpYWw6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHt9OyB9LFxuXHRcdH07XG5cblx0XHRyZWR1Y3Rpb19idWlsZC5idWlsZChwYXJhbWV0ZXJzLCBmdW5jcyk7XG5cblx0XHQvLyBJZiB3ZSdyZSBkb2luZyBncm91cEFsbFxuXHRcdGlmKHBhcmFtZXRlcnMuZ3JvdXBBbGwpIHtcblx0XHRcdGlmKGdyb3VwLnRvcCkge1xuXHRcdFx0XHRjb25zb2xlLndhcm4oXCInZ3JvdXBBbGwnIGlzIGRlZmluZWQgYnV0IGF0dGVtcHRpbmcgdG8gcnVuIG9uIGEgc3RhbmRhcmQgZGltZW5zaW9uLmdyb3VwKCkuIE11c3QgcnVuIG9uIGRpbWVuc2lvbi5ncm91cEFsbCgpLlwiKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC5rZXk7IH0pLmxlZnQ7XG5cdFx0XHRcdHZhciBpLCBqO1xuXHRcdFx0XHR2YXIga2V5cztcbiAgICAgICAgdmFyIGtleXNMZW5ndGg7XG4gICAgICAgIHZhciBrOyAvLyBLZXlcblx0XHRcdFx0Z3JvdXAucmVkdWNlKFxuXHRcdFx0XHRcdGZ1bmN0aW9uKHAsIHYsIG5mKSB7XG5cdFx0XHRcdFx0XHRrZXlzID0gcGFyYW1ldGVycy5ncm91cEFsbCh2KTtcbiAgICAgICAgICAgIGtleXNMZW5ndGggPSBrZXlzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvcihqPTA7ajxrZXlzTGVuZ3RoO2orKykge1xuICAgICAgICAgICAgICBrID0ga2V5c1tqXTtcbiAgICAgICAgICAgICAgaSA9IGJpc2VjdChwLCBrLCAwLCBwLmxlbmd0aCk7XG5cdFx0XHRcdFx0XHRcdGlmKCFwW2ldIHx8IHBbaV0ua2V5ICE9PSBrKSB7XG5cdFx0XHRcdFx0XHRcdFx0Ly8gSWYgdGhlIGdyb3VwIGRvZXNuJ3QgeWV0IGV4aXN0LCBjcmVhdGUgaXQgZmlyc3QuXG5cdFx0XHRcdFx0XHRcdFx0cC5zcGxpY2UoaSwgMCwgeyBrZXk6IGssIHZhbHVlOiBmdW5jcy5yZWR1Y2VJbml0aWFsKCkgfSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHQvLyBUaGVuIHBhc3MgdGhlIHJlY29yZCBhbmQgdGhlIGdyb3VwIHZhbHVlIHRvIHRoZSByZWR1Y2Vyc1xuXHRcdFx0XHRcdFx0XHRmdW5jcy5yZWR1Y2VBZGQocFtpXS52YWx1ZSwgdiwgbmYpO1xuICAgICAgICAgICAgfVxuXHRcdFx0XHRcdFx0cmV0dXJuIHA7XG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0XHRmdW5jdGlvbihwLCB2LCBuZikge1xuXHRcdFx0XHRcdFx0a2V5cyA9IHBhcmFtZXRlcnMuZ3JvdXBBbGwodik7XG4gICAgICAgICAgICBrZXlzTGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICBmb3Ioaj0wO2o8a2V5c0xlbmd0aDtqKyspIHtcbiAgICAgICAgICAgICAgaSA9IGJpc2VjdChwLCBrZXlzW2pdLCAwLCBwLmxlbmd0aCk7XG5cdFx0XHRcdFx0XHRcdC8vIFRoZSBncm91cCBzaG91bGQgZXhpc3Qgb3Igd2UncmUgaW4gdHJvdWJsZSFcblx0XHRcdFx0XHRcdFx0Ly8gVGhlbiBwYXNzIHRoZSByZWNvcmQgYW5kIHRoZSBncm91cCB2YWx1ZSB0byB0aGUgcmVkdWNlcnNcblx0XHRcdFx0XHRcdFx0ZnVuY3MucmVkdWNlUmVtb3ZlKHBbaV0udmFsdWUsIHYsIG5mKTtcbiAgICAgICAgICAgIH1cblx0XHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZnVuY3Rpb24oKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gW107XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHQpO1xuXHRcdFx0XHRpZighZ3JvdXAuYWxsKSB7XG5cdFx0XHRcdFx0Ly8gQWRkIGFuICdhbGwnIG1ldGhvZCBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIHN0YW5kYXJkIENyb3NzZmlsdGVyIGdyb3Vwcy5cblx0XHRcdFx0XHRncm91cC5hbGwgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMudmFsdWUoKTsgfTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRncm91cC5yZWR1Y2UoZnVuY3MucmVkdWNlQWRkLCBmdW5jcy5yZWR1Y2VSZW1vdmUsIGZ1bmNzLnJlZHVjZUluaXRpYWwpO1xuXHRcdH1cblxuXHRcdHJlZHVjdGlvX3Bvc3Rwcm9jZXNzKGdyb3VwLCBwYXJhbWV0ZXJzLCBmdW5jcyk7XG5cblx0XHRyZXR1cm4gZ3JvdXA7XG5cdH1cblxuXHRyZWR1Y3Rpb19hY2Nlc3NvcnMuYnVpbGQobXksIHBhcmFtZXRlcnMpO1xuXG5cdHJldHVybiBteTtcbn1cblxucmVxdWlyZSgnLi9wb3N0cHJvY2Vzc29ycycpKHJlZHVjdGlvKTtcbnJlZHVjdGlvX3Bvc3Rwcm9jZXNzID0gcmVkdWN0aW9fcG9zdHByb2Nlc3MocmVkdWN0aW8pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvO1xuIiwidmFyIHBsdWNrX24gPSBmdW5jdGlvbiAobikge1xuICAgIGlmICh0eXBlb2YgbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gbjtcbiAgICB9XG4gICAgaWYgKH5uLmluZGV4T2YoJy4nKSkge1xuICAgICAgICB2YXIgc3BsaXQgPSBuLnNwbGl0KCcuJyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICAgICAgcmV0dXJuIHNwbGl0LnJlZHVjZShmdW5jdGlvbiAocCwgdikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwW3ZdO1xuICAgICAgICAgICAgfSwgZCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gZFtuXTtcbiAgICB9O1xufTtcblxuZnVuY3Rpb24gYXNjZW5kaW5nKGEsIGIpIHtcbiAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IGEgPj0gYiA/IDAgOiBOYU47XG59XG5cbnZhciBjb21wYXJlciA9IGZ1bmN0aW9uIChhY2Nlc3Nvciwgb3JkZXJpbmcpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIG9yZGVyaW5nKGFjY2Vzc29yKGEpLCBhY2Nlc3NvcihiKSk7XG4gICAgfTtcbn07XG5cbnZhciB0eXBlID0ge30udG9TdHJpbmc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHByaW9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgb3JkZXIpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIG9yZGVyID0gYXNjZW5kaW5nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcmlvcigpLnNvcnQoY29tcGFyZXIocGx1Y2tfbih2YWx1ZSksIG9yZGVyKSk7XG4gICAgfTtcbn07XG4iLCJ2YXIgcmVkdWN0aW9fc3RkID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpZihwYXRoKHApLmNvdW50ID4gMCkge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDAuMDtcblx0XHRcdFx0dmFyIG4gPSBwYXRoKHApLnN1bU9mU3EgLSBwYXRoKHApLnN1bSpwYXRoKHApLnN1bS9wYXRoKHApLmNvdW50O1xuXHRcdFx0XHRpZiAobj4wLjApIHBhdGgocCkuc3RkID0gTWF0aC5zcXJ0KG4vKHBhdGgocCkuY291bnQtMSkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwLjA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpZihwYXRoKHApLmNvdW50ID4gMCkge1xuXHRcdFx0XHRwYXRoKHApLnN0ZCA9IDAuMDtcblx0XHRcdFx0dmFyIG4gPSBwYXRoKHApLnN1bU9mU3EgLSBwYXRoKHApLnN1bSpwYXRoKHApLnN1bS9wYXRoKHApLmNvdW50O1xuXHRcdFx0XHRpZiAobj4wLjApIHBhdGgocCkuc3RkID0gTWF0aC5zcXJ0KG4vKHBhdGgocCkuY291bnQtMSkpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLnN0ZCA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3N0ZDsiLCJ2YXIgcmVkdWN0aW9fc3VtX29mX3NxID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLnN1bU9mU3EgPSBwYXRoKHApLnN1bU9mU3EgKyBhKHYpKmEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLnN1bU9mU3EgPSBwYXRoKHApLnN1bU9mU3EgLSBhKHYpKmEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkuc3VtT2ZTcSA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3N1bV9vZl9zcTsiLCJ2YXIgcmVkdWN0aW9fc3VtID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLnN1bSA9IHBhdGgocCkuc3VtICsgYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuc3VtID0gcGF0aChwKS5zdW0gLSBhKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLnN1bSA9IDA7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3N1bTsiLCJ2YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcicpO1xuXG52YXIgcmVkdWN0aW9fdmFsdWVfY291bnQgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE5vdCBzdXJlIGlmIHRoaXMgaXMgbW9yZSBlZmZpY2llbnQgdGhhbiBzb3J0aW5nLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoY3VyciAmJiBjdXJyWzBdID09PSBhKHYpKSB7XG5cdFx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIGluIHRoZSBhcnJheSAtIGluY3JlbWVudCBpdFxuXHRcdFx0XHRjdXJyWzFdKys7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBWYWx1ZSBkb2Vzbid0IGV4aXN0IC0gYWRkIGl0IGluIGZvcm0gW3ZhbHVlLCAxXVxuXHRcdFx0XHRwYXRoKHApLnZhbHVlcy5zcGxpY2UoaSwgMCwgW2EodiksIDFdKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIG9yIHNvbWV0aGluZyBoYXMgZ29uZSB0ZXJyaWJseSB3cm9uZy5cblx0XHRcdHBhdGgocCkudmFsdWVzW2ldWzFdLS07XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdC8vIEFycmF5W0FycmF5W3ZhbHVlLCBjb3VudF1dXG5cdFx0XHRwYXRoKHApLnZhbHVlcyA9IFtdO1xuXHRcdFx0cGF0aChwKS5iaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZFswXTsgfSkubGVmdDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fdmFsdWVfY291bnQ7IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXInKTtcblxudmFyIHJlZHVjdGlvX3ZhbHVlX2xpc3QgPSB7XG5cdGFkZDogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7XG5cdFx0dmFyIGJpc2VjdCA9IGNyb3NzZmlsdGVyLmJpc2VjdC5ieShmdW5jdGlvbihkKSB7IHJldHVybiBkOyB9KS5sZWZ0O1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBOb3Qgc3VyZSBpZiB0aGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gc29ydGluZy5cblx0XHRcdGkgPSBiaXNlY3QocGF0aChwKS52YWx1ZUxpc3QsIGEodiksIDAsIHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCk7XG5cdFx0XHRwYXRoKHApLnZhbHVlTGlzdC5zcGxpY2UoaSwgMCwgYSh2KSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aSA9IGJpc2VjdChwYXRoKHApLnZhbHVlTGlzdCwgYSh2KSwgMCwgcGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoKTtcblx0XHRcdC8vIFZhbHVlIGFscmVhZHkgZXhpc3RzIG9yIHNvbWV0aGluZyBoYXMgZ29uZSB0ZXJyaWJseSB3cm9uZy5cblx0XHRcdHBhdGgocCkudmFsdWVMaXN0LnNwbGljZShpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS52YWx1ZUxpc3QgPSBbXTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fdmFsdWVfbGlzdDsiLCIndXNlIHN0cmljdCdcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG52YXIgbmF0dXJhbFNvcnQgPSByZXF1aXJlKCdqYXZhc2NyaXB0LW5hdHVyYWwtc29ydCcpO1xuXG52YXIgYWdncmVnYXRvcnMgPSB7XG4gIC8vIENvbGxlY3Rpb25zXG4gICRzdW06ICRzdW0sXG4gICRhdmc6ICRhdmcsXG4gICRtYXg6ICRtYXgsXG4gICRtaW46ICRtaW4sXG5cbiAgLy8gUGlja2Vyc1xuICAkY291bnQ6ICRjb3VudCxcbiAgJGZpcnN0OiAkZmlyc3QsXG4gICRsYXN0OiAkbGFzdCxcbiAgJGdldDogJGdldCxcbiAgJG50aDogJGdldCwgLy8gbnRoIGlzIHNhbWUgYXMgdXNpbmcgYSBnZXRcbiAgJG50aExhc3Q6ICRudGhMYXN0LFxuICAkbnRoUGN0OiAkbnRoUGN0LFxuICAkbWFwOiAkbWFwLFxuICAkc29ydDogJHNvcnQsXG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgbWFrZUZ1bmN0aW9uOiBtYWtlRnVuY3Rpb24sXG4gICAgYWdncmVnYXRvcnM6IGFnZ3JlZ2F0b3JzLFxuICAgIHBhcnNlQWdncmVnYXRvclBhcmFtczogcGFyc2VBZ2dyZWdhdG9yUGFyYW1zLFxuICB9XG4gIC8vIFRoaXMgaXMgdXNlZCB0byBidWlsZCBhZ2dyZWdhdGlvbiBzdGFja3MgZm9yIHN1Yi1yZWR1Y3Rpb1xuICAvLyBhZ2dyZWdhdGlvbnMsIG9yIHBsdWNraW5nIHZhbHVlcyBmb3IgdXNlIGluIGZpbHRlcnMgZnJvbSB0aGUgZGF0YVxuZnVuY3Rpb24gbWFrZUZ1bmN0aW9uKG9iaikge1xuICB2YXIgc3RhY2sgPSBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihvYmopLnJldmVyc2UoKVxuXG4gIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgcmV0dXJuIHN0YWNrLnJlZHVjZShmdW5jdGlvbihwcmV2aW91cywgY3VycmVudCkge1xuICAgICAgcmV0dXJuIGN1cnJlbnQocHJldmlvdXMpXG4gICAgfSwgZClcbiAgfVxufVxuXG4vLyBBIHJlY3Vyc2l2ZSBmdW5jdGlvbiB0aGF0IHdhbGtzIHRoZSBhZ2dyZWdhdGlvbiBzdGFjayBhbmQgcmV0dXJuc1xuLy8gYSBmdW5jdGlvbi4gVGhlIHJldHVybmVkIGZ1bmN0aW9uLCB3aGVuIGNhbGxlZCwgd2lsbCByZWN1cnNpdmVseSBpbnZva2Vcbi8vIHdpdGggdGhlIHByb3BlcnRpZXMgZnJvbSB0aGUgcHJldmlvdXMgc3RhY2sgaW4gcmV2ZXJzZSBvcmRlclxuZnVuY3Rpb24gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24ob2JqKSB7XG5cbiAgdmFyIGtleVZhbCA9IF8uaXNPYmplY3Qob2JqKSA/IGV4dHJhY3RLZXlWYWwob2JqKSA6IG9ialxuXG4gIC8vIERldGVjdCBzdHJpbmdzLCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gIGlmIChfLmlzU3RyaW5nKG9iaikpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIGRbb2JqXVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFuIGFycmF5LCByZWN1cnNlIGludG8gZWFjaCBpdGVtIGFuZCByZXR1cm4gYXMgYSBtYXBcbiAgaWYgKF8uaXNBcnJheShvYmopKSB7XG4gICAgdmFyIHN1YlN0YWNrID0gXy5tYXAob2JqLCBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbilcbiAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgcmV0dXJuIHN1YlN0YWNrLm1hcChmdW5jdGlvbihzKSB7XG4gICAgICAgIHJldHVybiBzKGQpXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIG9iamVjdCwgZmluZCB0aGUgYWdncmVnYXRpb24sIGFuZCByZWN1cnNlIGludG8gdGhlIHZhbHVlXG4gIGlmIChrZXlWYWwua2V5KSB7XG4gICAgaWYgKGFnZ3JlZ2F0b3JzW2tleVZhbC5rZXldKSB7XG4gICAgICByZXR1cm4gW2FnZ3JlZ2F0b3JzW2tleVZhbC5rZXldLCBtYWtlU3ViQWdncmVnYXRpb25GdW5jdGlvbihrZXlWYWwudmFsdWUpXVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdDb3VsZCBub3QgZmluZCBhZ2dyZWdyYXRpb24gbWV0aG9kJywga2V5VmFsKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBbXVxufVxuXG5mdW5jdGlvbiBleHRyYWN0S2V5VmFsKG9iaikge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgdmFsdWU6IG9ialtrZXldXG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVyblxufVxuXG5mdW5jdGlvbiBwYXJzZUFnZ3JlZ2F0b3JQYXJhbXMoa2V5U3RyaW5nKSB7XG4gIHZhciBwYXJhbXMgPSBbXVxuICB2YXIgcDEgPSBrZXlTdHJpbmcuaW5kZXhPZignKCcpXG4gIHZhciBwMiA9IGtleVN0cmluZy5pbmRleE9mKCcpJylcbiAgdmFyIGtleSA9IHAxID4gLTEgPyBrZXlTdHJpbmcuc3Vic3RyaW5nKDAsIHAxKSA6IGtleVN0cmluZ1xuICBpZiAoIWFnZ3JlZ2F0b3JzW2tleV0pIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxuICBpZiAocDEgPiAtMSAmJiBwMiA+IC0xICYmIHAyID4gcDEpIHtcbiAgICBwYXJhbXMgPSBrZXlTdHJpbmcuc3Vic3RyaW5nKHAxICsgMSwgcDIpLnNwbGl0KCcsJylcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgYWdncmVnYXRvcjogYWdncmVnYXRvcnNba2V5XSxcbiAgICBwYXJhbXM6IHBhcmFtc1xuICB9XG59XG5cblxuXG5cbi8vIENvbGxlY3Rpb24gQWdncmVnYXRvcnNcblxuZnVuY3Rpb24gJHN1bShjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW4ucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSArIGJcbiAgfSlcbn1cblxuZnVuY3Rpb24gJGF2ZyhjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW4ucmVkdWNlKGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSArIGJcbiAgfSkgLyBjaGlsZHJlbi5sZW5ndGhcbn1cblxuZnVuY3Rpb24gJG1heChjaGlsZHJlbikge1xuICByZXR1cm4gTWF0aC5tYXguYXBwbHkobnVsbCwgY2hpbGRyZW4pXG59XG5cbmZ1bmN0aW9uICRtaW4oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIE1hdGgubWluLmFwcGx5KG51bGwsIGNoaWxkcmVuKVxufVxuXG5mdW5jdGlvbiAkY291bnQoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLmxlbmd0aFxufVxuXG5mdW5jdGlvbiAkbWVkKGNoaWxkcmVuKSB7XG4gIGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhIC0gYlxuICB9KVxuICB2YXIgaGFsZiA9IE1hdGguZmxvb3IoY2hpbGRyZW4ubGVuZ3RoIC8gMilcbiAgaWYgKGNoaWxkcmVuLmxlbmd0aCAlIDIpXG4gICAgcmV0dXJuIGNoaWxkcmVuW2hhbGZdXG4gIGVsc2VcbiAgICByZXR1cm4gKGNoaWxkcmVuW2hhbGYgLSAxXSArIGNoaWxkcmVuW2hhbGZdKSAvIDIuMFxufVxuXG5mdW5jdGlvbiAkZmlyc3QoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuWzBdXG59XG5cbmZ1bmN0aW9uICRsYXN0KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXVxufVxuXG5mdW5jdGlvbiAkZ2V0KGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbltuXVxufVxuXG5mdW5jdGlvbiAkbnRoTGFzdChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gbl1cbn1cblxuZnVuY3Rpb24gJG50aFBjdChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bTWF0aC5yb3VuZChjaGlsZHJlbi5sZW5ndGggKiAobiAvIDEwMCkpXVxufVxuXG5mdW5jdGlvbiAkbWFwKGNoaWxkcmVuLCBuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5tYXAoZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBkW25dXG4gIH0pXG59XG5cbmZ1bmN0aW9uICRzb3J0KGNoaWxkcmVuLCBuKSB7XG4gIC8vIEFscGhhbnVtZXJpYyBieSBwcm9wZXJ0eVxuICBpZiAoXy5pc1N0cmluZyhuKSkge1xuICAgIGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24gc29ydEJ5S2V5KGEsIGIpIHtcbiAgICAgIGlmIChhW25dIDwgYltuXSlcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgZWxzZSBpZiAoYVtuXSA+IGJbbl0pXG4gICAgICAgIHJldHVybiAxO1xuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gMDtcbiAgICB9KTtcbiAgfVxuICAvLyBOdW1lcmljIGJ5IHByb3BlcnR5XG4gIGlmIChfLmlzTnVtYmVyKG4pKSB7XG4gICAgY2hpbGRyZW4uc29ydChmdW5jdGlvbiBzb3J0QnlLZXkoYSwgYikge1xuICAgICAgcmV0dXJuIGFbbl0gLSBiW25dXG4gICAgfSk7XG4gIH1cbiAgLy8gRmxhdCwgbmF0dXJhbCBzb3J0aW5nXG4gIC8vIEJlIHN1cmUgdG8gY29weSB0aGUgYXJyYXkgYXMgdG8gbm90IG11dGF0ZSB0aGUgb3JpZ2luYWxcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGNoaWxkcmVuKS5zb3J0KG5hdHVyYWxTb3J0KVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuICByZXR1cm4gZnVuY3Rpb24gY2xlYXIoZGVmKSB7XG5cbiAgICAvLyBDbGVhciBhIHNpbmdsZSBvciBtdWx0aXBsZSBjb2x1bW4gZGVmaW5pdGlvbnNcbiAgICBpZiAoZGVmKSB7XG4gICAgICBkZWYgPSBfLmlzQXJyYXkoZGVmKSA/IGRlZiA6IFtkZWZdXG4gICAgfVxuXG4gICAgaWYgKCFkZWYpIHtcbiAgICAgIC8vIENsZWFyIGFsbCBvZiB0aGUgY29sdW1uIGRlZmVuaXRpb25zXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoc2VydmljZS5jb2x1bW5zLCBkaXNwb3NlQ29sdW1uKSlcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2VydmljZS5jb2x1bW5zID0gW11cbiAgICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgICB9KVxuXG4gICAgfVxuXG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoZGVmLCBmdW5jdGlvbihkKSB7XG4gICAgICAgIGlmIChfLmlzT2JqZWN0KGQpKSB7XG4gICAgICAgICAgZCA9IGQua2V5XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2xlYXIgdGhlIGNvbHVtblxuICAgICAgICB2YXIgY29sdW1uID0gXy5yZW1vdmUoc2VydmljZS5jb2x1bW5zLCBmdW5jdGlvbihjKSB7XG4gICAgICAgICAgaWYgKF8uaXNBcnJheShkKSkge1xuICAgICAgICAgICAgcmV0dXJuICFfLnhvcihjLmtleSwgZCkubGVuZ3RoXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChjLmtleSA9PT0gZCkge1xuICAgICAgICAgICAgaWYgKGMuZHluYW1pY1JlZmVyZW5jZSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9KVswXVxuXG4gICAgICAgIGlmICghY29sdW1uKSB7XG4gICAgICAgICAgLy8gY29uc29sZS5pbmZvKCdBdHRlbXB0ZWQgdG8gY2xlYXIgYSBjb2x1bW4gdGhhdCBpcyByZXF1aXJlZCBmb3IgYW5vdGhlciBxdWVyeSEnLCBjKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgZGlzcG9zZUNvbHVtbihjb2x1bW4pXG4gICAgICB9KSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcblxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VDb2x1bW4oY29sdW1uKSB7XG4gICAgICAvLyBEaXNwb3NlIHRoZSBkaW1lbnNpb25cbiAgICAgIHZhciBkaXNwb3NhbEFjdGlvbnMgPSBfLm1hcChjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLCBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGxpc3RlbmVyKCkpXG4gICAgICB9KVxuICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2ZpbHRlcktleV1cbiAgICAgIGRpc3Bvc2FsQWN0aW9ucy5wdXNoKFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmRpc3Bvc2UoKSkpXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZGlzcG9zYWxBY3Rpb25zKVxuICAgIH1cblxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKFwicVwiKTtcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcblxuICB2YXIgZGltZW5zaW9uID0gcmVxdWlyZSgnLi9kaW1lbnNpb24nKShzZXJ2aWNlKVxuXG4gIHZhciBjb2x1bW5GdW5jID0gY29sdW1uXG4gIGNvbHVtbkZ1bmMuZmluZCA9IGZpbmRDb2x1bW5cblxuICByZXR1cm4gY29sdW1uRnVuY1xuXG4gIGZ1bmN0aW9uIGNvbHVtbihkZWYpIHtcblxuICAgIC8vIFN1cHBvcnQgZ3JvdXBBbGwgZGltZW5zaW9uXG4gICAgaWYgKGRlZiA9PT0gdHJ1ZSB8fCBfLmlzVW5kZWZpbmVkKGRlZikpIHtcbiAgICAgIGRlZiA9IHtcbiAgICAgICAga2V5OiB0cnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gQWx3YXlzIGRlYWwgaW4gYnVsay4gIExpa2UgQ29zdGNvIVxuICAgIGlmICghXy5pc0FycmF5KGRlZikpIHtcbiAgICAgIGRlZiA9IFtkZWZdXG4gICAgfVxuXG4gICAgLy8gTWFwcCBhbGwgY29sdW1uIGNyZWF0aW9uLCB3YWl0IGZvciBhbGwgdG8gc2V0dGxlLCB0aGVuIHJldHVybiB0aGUgaW5zdGFuY2VcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAoZGVmLCBtYWtlQ29sdW1uKSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmRDb2x1bW4oZCl7XG4gICAgcmV0dXJuIF8uZmluZChzZXJ2aWNlLmNvbHVtbnMsIGZ1bmN0aW9uKGMpe1xuICAgICAgaWYoXy5pc0FycmF5KGQpKXtcbiAgICAgICAgcmV0dXJuICFfLnhvcihjLmtleSwgZCkubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gYy5rZXkgPT09IGRcbiAgICB9KVxuICB9XG5cblxuICBmdW5jdGlvbiBnZXRUeXBlKGQpIHtcbiAgICBpZiAoXy5pc051bWJlcihkKSkge1xuICAgICAgcmV0dXJuICdudW1iZXInXG4gICAgfVxuICAgIGlmIChfLmlzQm9vbGVhbihkKSkge1xuICAgICAgcmV0dXJuICdib29sJ1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICByZXR1cm4gJ2FycmF5J1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChkKSkge1xuICAgICAgcmV0dXJuICdvYmplY3QnXG4gICAgfVxuICAgIHJldHVybiAnc3RyaW5nJ1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUNvbHVtbihkKSB7XG5cbiAgICB2YXIgY29sdW1uID0gXy5pc09iamVjdChkKSA/IGQgOiB7XG4gICAgICBrZXk6IGQsXG4gICAgfVxuXG4gICAgLy8gR2V0IGEgc2FtcGxlIG9mIHRoZSBjb2x1bW5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5hbGwoKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihhbGwpIHtcblxuICAgICAgICB2YXIgc2FtcGxlXG5cbiAgICAgICAgLy8gQ29tcGxleCBjb2x1bW4gS2V5c1xuICAgICAgICBpZiAoXy5pc0FycmF5KGNvbHVtbi5rZXkpKSB7XG4gICAgICAgICAgY29sdW1uLmNvbXBsZXggPSB0cnVlXG4gICAgICAgICAgc2FtcGxlID0gXy5tYXAoXy5waWNrKGFsbFswXSwgY29sdW1uLmtleSkpXG4gICAgICAgICAgaWYgKHNhbXBsZS5sZW5ndGggIT09IGNvbHVtbi5rZXkubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NvbHVtbiBrZXkgZG9lcyBub3QgZXhpc3QgaW4gZGF0YSEnLCBjb2x1bW4ua2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzYW1wbGUgPSBhbGxbMF1bY29sdW1uLmtleV1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEluZGV4IENvbHVtblxuICAgICAgICBpZiAoIWNvbHVtbi5jb21wbGV4ICYmIGNvbHVtbi5rZXkgIT09IHRydWUgJiYgdHlwZW9mKHNhbXBsZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb2x1bW4ga2V5IGRvZXMgbm90IGV4aXN0IGluIGRhdGEhJywgY29sdW1uLmtleSlcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBleGlzdGluZyA9IGZpbmRDb2x1bW4oY29sdW1uLmtleSlcblxuICAgICAgICAvLyBJZiB0aGUgY29sdW1uIGV4aXN0cywgbGV0J3MgYXQgbGVhc3QgbWFrZSBzdXJlIGl0J3MgbWFya2VkXG4gICAgICAgIC8vIGFzIHBlcm1hbmVudC4gVGhlcmUgaXMgYSBzbGlnaHQgY2hhbmNlIGl0IGV4aXN0cyBiZWNhdXNlXG4gICAgICAgIC8vIG9mIGEgZmlsdGVyLCBhbmQgdGhlIHVzZXIgZGVjaWRlcyB0byBtYWtlIGl0IHBlcm1hbmVudFxuICAgICAgICBpZiAoZXhpc3RpbmcgJiYgIWNvbHVtbi50ZW1wb3JhcnkpIHtcbiAgICAgICAgICBleGlzdGluZy50ZW1wb3JhcnkgPSBmYWxzZVxuICAgICAgICAgIGlmKGNvbHVtbi5keW5hbWljUmVmZXJlbmNlKXtcbiAgICAgICAgICAgIGV4aXN0aW5nLmR5bmFtaWNSZWZlcmVuY2UgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbygnQ29sdW1uIGhhcyBhbHJlYWR5IGJlZW4gZGVmaW5lZCcsIGFyZ3VtZW50cylcbiAgICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgICB9XG5cbiAgICAgICAgY29sdW1uLnR5cGUgPVxuICAgICAgICAgIGNvbHVtbi5rZXkgPT09IHRydWUgPyAnYWxsJyA6XG4gICAgICAgICAgY29sdW1uLmNvbXBsZXggPyAnY29tcGxleCcgOlxuICAgICAgICAgIGNvbHVtbi5hcnJheSA/ICdhcnJheScgOlxuICAgICAgICAgIGdldFR5cGUoc2FtcGxlKVxuXG4gICAgICAgIHJldHVybiBkaW1lbnNpb24ubWFrZShjb2x1bW4ua2V5LCBjb2x1bW4udHlwZSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihkaW0pIHtcbiAgICAgICAgY29sdW1uLmRpbWVuc2lvbiA9IGRpbVxuICAgICAgICBjb2x1bW4uZmlsdGVyQ291bnQgPSBjb2x1bW4uZmlsdGVyQ291bnQgfHwgMFxuICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzID0gW2J1aWxkQ29sdW1uS2V5c11cbiAgICAgICAgY29sdW1uLmFkZExpc3RlbmVycyA9IFtidWlsZENvbHVtbktleXNdXG5cbiAgICAgICAgc2VydmljZS5jb2x1bW5zLnB1c2goY29sdW1uKVxuXG4gICAgICAgIHJldHVybiBidWlsZENvbHVtbktleXMoKVxuXG4gICAgICAgIC8vIEJ1aWxkIHRoZSBjb2x1bW5LZXlzXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkQ29sdW1uS2V5cygpe1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmJvdHRvbShJbmZpbml0eSkpXG4gICAgICAgICAgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihyb3dzKXtcbiAgICAgICAgICAgIHZhciBhY2Nlc3NvciA9IGRpbWVuc2lvbi5tYWtlQWNjZXNzb3IoY29sdW1uLmtleSlcbiAgICAgICAgICAgIGNvbHVtbi52YWx1ZXMgPSBfLnNvcnQoXy51bmlxKF8uZmxhdHRlbihfLm1hcChyb3dzLCBhY2Nlc3NvcikpKSlcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpO1xudmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXIyJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuXG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IGJ1aWxkLFxuICAgIGdlbmVyYXRlQ29sdW1uczogZ2VuZXJhdGVDb2x1bW5zLFxuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlLFxuICB9XG5cbiAgZnVuY3Rpb24gYnVpbGQoYykge1xuICAgIGlmIChfLmlzQXJyYXkoYykpIHtcbiAgICAgIC8vIFRoaXMgYWxsb3dzIHN1cHBvcnQgZm9yIGNyb3NzZmlsdGVyIGFzeW5jXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNyb3NzZmlsdGVyKGMpKVxuICAgIH1cbiAgICBpZiAoIWMgfHwgdHlwZW9mKGMuZGltZW5zaW9uKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignTm8gQ3Jvc3NmaWx0ZXIgZGF0YSBvciBpbnN0YW5jZSBmb3VuZCEnKSlcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGVDb2x1bW5zKGRhdGEpe1xuICAgIGlmKCFzZXJ2aWNlLm9wdGlvbnMuZ2VuZXJhdGVkQ29sdW1ucyl7XG4gICAgICByZXR1cm4gZGF0YVxuICAgIH1cbiAgICByZXR1cm4gXy5tYXAoZGF0YSwgZnVuY3Rpb24oZCwgaSl7XG4gICAgICBfLmZvckVhY2goc2VydmljZS5vcHRpb25zLmdlbmVyYXRlZENvbHVtbnMsIGZ1bmN0aW9uKHZhbCwga2V5KXtcbiAgICAgICAgZFtrZXldID0gdmFsKGQpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIGRcbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkKGRhdGEpIHtcbiAgICBkYXRhID0gZ2VuZXJhdGVDb2x1bW5zKGRhdGEpXG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YuYWRkKGRhdGEpKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZHMgPSBbXVxuICAgICAgICBfLmZvckVhY2goc2VydmljZS5jb2x1bW5zLCBmdW5jdGlvbihjb2x1bW4pIHtcbiAgICAgICAgICBfLmZvckVhY2goY29sdW1uLmFkZExpc3RlbmVycywgZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGRzLnB1c2gobGlzdGVuZXIoKSlcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoZHMpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlKCkge1xuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzZXJ2aWNlLmNmLnJlbW92ZSgpKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuXG4gIHJldHVybiB7XG4gICAgbWFrZTogbWFrZSxcbiAgICBtYWtlQWNjZXNzb3I6IG1ha2VBY2Nlc3NvcixcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2Uoa2V5LCB0eXBlKSB7XG4gICAgdmFyIGFjY2Vzc29yID0gbWFrZUFjY2Vzc29yKGtleSlcbiAgICAvLyBQcm9taXNlLnJlc29sdmUgd2lsbCBoYW5kbGUgcHJvbWlzZXMgb3Igbm9uIHByb21pc2VzLCBzb1xuICAgIC8vIHRoaXMgY3Jvc3NmaWx0ZXIgYXN5bmMgaXMgc3VwcG9ydGVkIGlmIHByZXNlbnRcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNlcnZpY2UuY2YuZGltZW5zaW9uKGFjY2Vzc29yLCB0eXBlID09ICdhcnJheScpKVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUFjY2Vzc29yKGtleSl7XG4gICAgdmFyIGFjY2Vzc29yRnVuY3Rpb25cblxuICAgIC8vIE11bHRpLWtleSBkaW1lbnNpb25cbiAgICBpZiAoXy5pc0FycmF5KGtleSkpIHtcbiAgICAgIHZhciBhcnJheVN0cmluZyA9IF8ubWFwKGtleSwgZnVuY3Rpb24oaykge1xuICAgICAgICByZXR1cm4gXCJkWydcIiArIGsgKyBcIiddXCJcbiAgICAgIH0pXG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID0gbmV3IEZ1bmN0aW9uKCdkJywgJ3JldHVybiAnICsgSlNPTi5zdHJpbmdpZnkoYXJyYXlTdHJpbmcpLnJlcGxhY2UoL1xcXCIvZywgJycpICsgJycpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFjY2Vzc29yRnVuY3Rpb24gPVxuICAgICAgICAvLyBJbmRleCBEaW1lbnNpb25cbiAgICAgICAga2V5ID09PSB0cnVlID8gZnVuY3Rpb24gYWNjZXNzb3IoZCwgaSkge1xuICAgICAgICAgIHJldHVybiBpXG4gICAgICAgIH0gOlxuICAgICAgICAvLyBWYWx1ZSBBY2Nlc3NvciBEaW1lbnNpb25cbiAgICAgICAgZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkW2tleV1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYWNjZXNzb3JGdW5jdGlvblxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxuLy8gdmFyIG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAvLyBHZXR0ZXJzXG4gICRmaWVsZDogJGZpZWxkLFxuICAvLyBCb29sZWFuc1xuICAkYW5kOiAkYW5kLFxuICAkb3I6ICRvcixcbiAgJG5vdDogJG5vdCxcblxuICAvLyBFeHByZXNzaW9uc1xuICAkZXE6ICRlcSxcbiAgJGd0OiAkZ3QsXG4gICRndGU6ICRndGUsXG4gICRsdDogJGx0LFxuICAkbHRlOiAkbHRlLFxuICAkbmU6ICRuZSxcbiAgJHR5cGU6ICR0eXBlLFxuXG4gIC8vIEFycmF5IEV4cHJlc3Npb25zXG4gICRpbjogJGluLFxuICAkbmluOiAkbmluLFxuICAkc2l6ZTogJHNpemUsXG59XG5cbi8vIEdldHRlcnNcbmZ1bmN0aW9uICRmaWVsZChkLCBjaGlsZCkge1xuICByZXR1cm4gZFtjaGlsZF1cbn1cblxuLy8gT3BlcmF0b3JzXG5cbmZ1bmN0aW9uICRhbmQoZCwgY2hpbGQpIHtcbiAgY2hpbGQgPSBjaGlsZChkKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFjaGlsZFtpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cbmZ1bmN0aW9uICRvcihkLCBjaGlsZCkge1xuICBjaGlsZCA9IGNoaWxkKGQpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiAkbm90KGQsIGNoaWxkKSB7XG4gIGNoaWxkID0gY2hpbGQoZClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChjaGlsZFtpXSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlXG59XG5cblxuLy8gRXhwcmVzc2lvbnNcblxuZnVuY3Rpb24gJGVxKGQsIGNoaWxkKSB7XG4gIHJldHVybiBkID09PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRndChkLCBjaGlsZCkge1xuICByZXR1cm4gZCA+IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGd0ZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCA+PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRsdChkLCBjaGlsZCkge1xuICByZXR1cm4gZCA8IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJGx0ZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCA8PSBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRuZShkLCBjaGlsZCkge1xuICByZXR1cm4gZCAhPT0gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkdHlwZShkLCBjaGlsZCkge1xuICByZXR1cm4gdHlwZW9mKGQpID09PSBjaGlsZCgpXG59XG5cbi8vIEFycmF5IEV4cHJlc3Npb25zXG5cbmZ1bmN0aW9uICRpbihkLCBjaGlsZCkge1xuICByZXR1cm4gZC5pbmRleE9mKGNoaWxkKCkpID4gLTFcbn1cblxuZnVuY3Rpb24gJG5pbihkLCBjaGlsZCkge1xuICByZXR1cm4gZC5pbmRleE9mKGNoaWxkKCkpID09PSAtMVxufVxuXG5mdW5jdGlvbiAkc2l6ZShkLCBjaGlsZCkge1xuICByZXR1cm4gZC5sZW5ndGggPT09IGNoaWxkKClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbnZhciBleHByZXNzaW9ucyA9IHJlcXVpcmUoJy4vZXhwcmVzc2lvbnMnKVxudmFyIGFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuICByZXR1cm4ge1xuICAgIGZpbHRlcjogZmlsdGVyLFxuICAgIGZpbHRlckFsbDogZmlsdGVyQWxsLFxuICAgIGFwcGx5RmlsdGVyczogYXBwbHlGaWx0ZXJzLFxuICAgIG1ha2VGdW5jdGlvbjogbWFrZUZ1bmN0aW9uLFxuICAgIHNjYW5Gb3JEeW5hbWljRmlsdGVyczogc2NhbkZvckR5bmFtaWNGaWx0ZXJzXG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXIoY29sdW1uLCBmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpIHtcbiAgICB2YXIgZXhpc3RzID0gc2VydmljZS5jb2x1bW4uZmluZChjb2x1bW4pXG5cbiAgICAvLyBJZiB0aGUgZmlsdGVycyBkaW1lbnNpb24gZG9lc24ndCBleGlzdCB5ZXQsIHRyeSBhbmQgY3JlYXRlIGl0XG4gICAgcmV0dXJuIFByb21pc2UudHJ5KGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoIWV4aXN0cykge1xuICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAgICAgIGtleTogY29sdW1uLFxuICAgICAgICAgICAgICB0ZW1wb3Jhcnk6IHRydWUsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIC8vIEl0IHdhcyBhYmxlIHRvIGJlIGNyZWF0ZWQsIHNvIHJldHJpZXZlIGFuZCByZXR1cm4gaXRcbiAgICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uLmZpbmQoY29sdW1uKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICAvLyBJdCBleGlzdHMsIHNvIGp1c3QgcmV0dXJuIHdoYXQgd2UgZm91bmRcbiAgICAgICAgcmV0dXJuIGV4aXN0c1xuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGNvbHVtbikge1xuICAgICAgICAvLyBDbG9uZSBhIGNvcHkgb2YgdGhlIG5ldyBmaWx0ZXJzXG4gICAgICAgIHZhciBuZXdGaWx0ZXJzID0gXy5jbG9uZShzZXJ2aWNlLmZpbHRlcnMsIHRydWUpXG4gICAgICAgICAgLy8gSGVyZSB3ZSB1c2UgdGhlIHJlZ2lzdGVyZWQgY29sdW1uIGtleSBkZXNwaXRlIHRoZSBmaWx0ZXIga2V5IHBhc3NlZCwganVzdCBpbiBjYXNlIHRoZSBmaWx0ZXIga2V5J3Mgb3JkZXJpbmcgaXMgb3JkZXJlZCBkaWZmZXJlbnRseSA6KVxuICAgICAgICB2YXIgZmlsdGVyS2V5ID0gY29sdW1uLmNvbXBsZXggPyBKU09OLnN0cmluZ2lmeShjb2x1bW4ua2V5KSA6IGNvbHVtbi5rZXlcbiAgICAgICAgICAvLyBCdWlsZCB0aGUgZmlsdGVyIG9iamVjdFxuICAgICAgICBuZXdGaWx0ZXJzW2ZpbHRlcktleV0gPSBidWlsZEZpbHRlck9iamVjdChmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpXG5cbiAgICAgICAgcmV0dXJuIGFwcGx5RmlsdGVycyhuZXdGaWx0ZXJzKVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICByZXR1cm4gYXBwbHlGaWx0ZXJzKHt9KVxuICB9XG5cblxuICBmdW5jdGlvbiBidWlsZEZpbHRlck9iamVjdChmaWwsIGlzUmFuZ2UsIHJlcGxhY2UpIHtcbiAgICBpZiAoXy5pc1VuZGVmaW5lZChmaWwpKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gICAgaWYgKF8uaXNGdW5jdGlvbihmaWwpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogZmlsLFxuICAgICAgICBmdW5jdGlvbjogZmlsLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nLFxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChmaWwpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogZmlsLFxuICAgICAgICBmdW5jdGlvbjogbWFrZUZ1bmN0aW9uKGZpbCksXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHR5cGU6ICdmdW5jdGlvbidcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShmaWwpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB2YWx1ZTogZmlsLFxuICAgICAgICByZXBsYWNlOiBpc1JhbmdlIHx8IHJlcGxhY2UsXG4gICAgICAgIHR5cGU6IGlzUmFuZ2UgPyAncmFuZ2UnIDogJ2luY2x1c2l2ZScsXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB2YWx1ZTogZmlsLFxuICAgICAgcmVwbGFjZTogcmVwbGFjZSxcbiAgICAgIHR5cGU6ICdleGFjdCcsXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYXBwbHlGaWx0ZXJzKG5ld0ZpbHRlcnMpIHtcbiAgICB2YXIgZHMgPSBfLm1hcChuZXdGaWx0ZXJzLCBmdW5jdGlvbihmaWwsIGkpIHtcbiAgICAgIHZhciBleGlzdGluZyA9IHNlcnZpY2UuZmlsdGVyc1tpXVxuICAgICAgLy8gRmlsdGVycyBhcmUgdGhlIHNhbWUsIHNvIG5vIGNoYW5nZSBpcyBuZWVkZWQgb24gdGhpcyBjb2x1bW5cbiAgICAgIGlmIChmaWwucmVwbGFjZSAmJiBleGlzdGluZyAmJiBfLmlzRXF1YWwoZmlsLCBleGlzdGluZykpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICB9XG4gICAgICB2YXIgY29sdW1uXG4gICAgICAgIC8vIFJldHJpZXZlIGNvbXBsZXggY29sdW1ucyBieSBkZWNvZGluZyB0aGUgY29sdW1uIGtleSBhcyBqc29uXG4gICAgICBpZiAoaS5jaGFyQXQoMCkgPT09ICdbJykge1xuICAgICAgICBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKEpTT04ucGFyc2UoaSkpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBSZXRyaWV2ZSB0aGUgY29sdW1uIG5vcm1hbGx5XG4gICAgICAgIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoaSlcbiAgICAgIH1cblxuXG4gICAgICAvLyBUb2dnbGluZyBhIGZpbHRlciB2YWx1ZSBpcyBhIGJpdCBkaWZmZXJlbnQgZnJvbSByZXBsYWNpbmcgdGhlbVxuICAgICAgaWYgKGZpbCAmJiBleGlzdGluZyAmJiAhZmlsLnJlcGxhY2UpIHtcbiAgICAgICAgZmlsID0gdG9nZ2xlRmlsdGVycyhmaWwsIGV4aXN0aW5nKVxuICAgICAgfVxuXG5cblxuICAgICAgLy8gSWYgbm8gZmlsdGVyLCByZW1vdmUgZXZlcnl0aGluZyBmcm9tIHRoZSBkaW1lbnNpb25cbiAgICAgIGlmICghZmlsKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJBbGwoKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0Jykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRXhhY3QoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ3JhbmdlJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyUmFuZ2UoZmlsLnZhbHVlKSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2luY2x1c2l2ZScpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckZ1bmN0aW9uKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZmlsLnZhbHVlLmluZGV4T2YoZCkgPiAtMVxuICAgICAgICB9KSlcbiAgICAgIH1cbiAgICAgIGlmIChmaWwudHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRnVuY3Rpb24oZmlsLmZ1bmN0aW9uKSlcbiAgICAgIH1cbiAgICAgIC8vIEJ5IGRlZmF1bHQgaWYgc29tZXRoaW5nIGNyYXBzIHVwLCBqdXN0IHJlbW92ZSBhbGwgZmlsdGVyc1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckFsbCgpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoZHMpXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gU2F2ZSB0aGUgbmV3IGZpbHRlcnMgc2F0YXRlXG4gICAgICAgIHNlcnZpY2UuZmlsdGVycyA9IG5ld0ZpbHRlcnNcblxuICAgICAgICAvLyBQbHVjayBhbmQgcmVtb3ZlIGZhbHNleSBmaWx0ZXJzIGZyb20gdGhlIG1peFxuICAgICAgICB2YXIgdHJ5UmVtb3ZhbCA9IFtdXG4gICAgICAgIF8uZm9yRWFjaChzZXJ2aWNlLmZpbHRlcnMsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICAgICAgaWYgKCF2YWwpIHtcbiAgICAgICAgICAgIHRyeVJlbW92YWwucHVzaCh7XG4gICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICB2YWw6IHZhbCxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICBkZWxldGUgc2VydmljZS5maWx0ZXJzW2tleV1cbiAgICAgICAgICB9XG4gICAgICAgIH0pXG5cbiAgICAgICAgLy8gSWYgYW55IG9mIHRob3NlIGZpbHRlcnMgYXJlIHRoZSBsYXN0IGRlcGVuZGVuY3kgZm9yIHRoZSBjb2x1bW4sIHRoZW4gcmVtb3ZlIHRoZSBjb2x1bW5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHRyeVJlbW92YWwsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICB2YXIgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZCgodi5rZXkuY2hhckF0KDApID09PSAnWycpID8gSlNPTi5wYXJzZSh2LmtleSkgOiB2LmtleSlcbiAgICAgICAgICAgIGlmIChjb2x1bW4udGVtcG9yYXJ5ICYmICFjb2x1bW4uZHluYW1pY1JlZmVyZW5jZSkge1xuICAgICAgICAgICAgICByZXR1cm4gc2VydmljZS5jbGVhcihjb2x1bW4ua2V5KVxuICAgICAgICAgICAgfVxuICAgICAgICB9KSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGVGaWx0ZXJzKGZpbCwgZXhpc3RpbmcpIHtcbiAgICAvLyBFeGFjdCBmcm9tIEluY2x1c2l2ZVxuICAgIGlmIChmaWwudHlwZSA9PT0gJ2V4YWN0JyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgZmlsLnZhbHVlID0gXy54b3IoZmlsLnZhbHVlLCBbZXhpc3RpbmcudmFsdWVdKVxuICAgIH1cbiAgICAvLyBJbmNsdXNpdmUgZnJvbSBFeGFjdFxuICAgIGVsc2UgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJyAmJiBleGlzdGluZy50eXBlID09PSAnZXhhY3QnKSB7XG4gICAgICBmaWwudmFsdWUgPSBfLnhvcihmaWwudmFsdWUsIFtleGlzdGluZy52YWx1ZV0pXG4gICAgfVxuICAgIC8vIEluY2x1c2l2ZSAvIEluY2x1c2l2ZSBNZXJnZVxuICAgIGVsc2UgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJyAmJiBleGlzdGluZy50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgZmlsLnZhbHVlID0gXy54b3IoZmlsLnZhbHVlLCBleGlzdGluZy52YWx1ZSlcbiAgICB9XG4gICAgLy8gRXhhY3QgLyBFeGFjdFxuICAgIGVsc2UgaWYgKGZpbC50eXBlID09PSAnZXhhY3QnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdleGFjdCcpIHtcbiAgICAgIC8vIElmIHRoZSB2YWx1ZXMgYXJlIHRoZSBzYW1lLCByZW1vdmUgdGhlIGZpbHRlciBlbnRpcmVseVxuICAgICAgaWYgKGZpbC52YWx1ZSA9PT0gZXhpc3RpbmcudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgICAvLyBUaGV5IHRoZXkgYXJlIGRpZmZlcmVudCwgbWFrZSBhbiBhcnJheVxuICAgICAgZmlsLnZhbHVlID0gW2ZpbC52YWx1ZSwgZXhpc3RpbmcudmFsdWVdXG4gICAgfVxuXG4gICAgLy8gU2V0IHRoZSBuZXcgdHlwZSBiYXNlZCBvbiB0aGUgbWVyZ2VkIHZhbHVlc1xuICAgIGlmIChmaWwudmFsdWUubGVuZ3RoID09PSAxKSB7XG4gICAgICBmaWwudHlwZSA9ICdleGFjdCdcbiAgICAgIGZpbC52YWx1ZSA9IGZpbC52YWx1ZVswXVxuICAgIH0gZWxzZSB7XG4gICAgICBmaWwudHlwZSA9ICdpbmNsdXNpdmUnXG4gICAgfVxuXG4gICAgcmV0dXJuIGZpbFxuICB9XG5cbiAgZnVuY3Rpb24gc2NhbkZvckR5bmFtaWNGaWx0ZXJzKHF1ZXJ5KSB7XG4gICAgLy8gSGVyZSB3ZSBjaGVjayB0byBzZWUgaWYgdGhlcmUgYXJlIGFueSByZWxhdGl2ZSByZWZlcmVuY2VzIHRvIHRoZSByYXcgZGF0YVxuICAgIC8vIGJlaW5nIHVzZWQgaW4gdGhlIGZpbHRlci4gSWYgc28sIHdlIG5lZWQgdG8gYnVpbGQgdGhvc2UgZGltZW5zaW9ucyBhbmQga2VlcFxuICAgIC8vIHRoZW0gdXBkYXRlZCBzbyB0aGUgZmlsdGVycyBjYW4gYmUgcmVidWlsdCBpZiBuZWVkZWRcbiAgICAvLyBUaGUgc3VwcG9ydGVkIGtleXMgcmlnaHQgbm93IGFyZTogJGNvbHVtbiwgJGRhdGFcbiAgICB2YXIgY29sdW1ucyA9IFtdXG4gICAgd2FsayhxdWVyeS5maWx0ZXIpXG4gICAgcmV0dXJuIGNvbHVtbnNcblxuICAgIGZ1bmN0aW9uIHdhbGsob2JqKSB7XG4gICAgICBfLmZvckVhY2gob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuICAgICAgICAvLyBmaW5kIHRoZSBkYXRhIHJlZmVyZW5jZXMsIGlmIGFueVxuICAgICAgICB2YXIgcmVmID0gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KVxuICAgICAgICByZWYgJiYgY29sdW1ucy5wdXNoKHJlZilcbiAgICAgICAgICAvLyBpZiBpdCdzIGEgc3RyaW5nXG4gICAgICAgIGlmIChfLmlzU3RyaW5nKHZhbCkpIHtcbiAgICAgICAgICByZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXMobnVsbCwgdmFsKVxuICAgICAgICAgIHJlZiAmJiBjb2x1bW5zLnB1c2gocmVmKVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGl0J3MgYW5vdGhlciBvYmplY3QsIGtlZXAgbG9va2luZ1xuICAgICAgICBpZiAoXy5pc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgd2Fsayh2YWwpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KSB7XG4gICAgLy8gbG9vayBmb3IgdGhlICRkYXRhIHN0cmluZyBhcyBhIHZhbHVlXG4gICAgaWYgKGtleSA9PT0gJyRkYXRhJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciB0aGUgJGNvbHVtbiBrZXkgYW5kIGl0J3MgdmFsdWUgYXMgYSBzdHJpbmdcbiAgICBpZiAoa2V5ICYmIGtleSA9PT0gJyRjb2x1bW4nKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgIHJldHVybiB2YWxcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybignVGhlIHZhbHVlIGZvciBmaWx0ZXIgXCIkY29sdW1uXCIgbXVzdCBiZSBhIHZhbGlkIGNvbHVtbiBrZXknLCB2YWwpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlRnVuY3Rpb24ob2JqLCBpc0FnZ3JlZ2F0aW9uKSB7XG5cbiAgICB2YXIgc3ViR2V0dGVyc1xuXG4gICAgLy8gRGV0ZWN0IHJhdyAkZGF0YSByZWZlcmVuY2VcbiAgICBpZiAoXy5pc1N0cmluZyhvYmopKSB7XG4gICAgICB2YXIgZGF0YVJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCBvYmopXG4gICAgICBpZiAoZGF0YVJlZikge1xuICAgICAgICB2YXIgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChkYXRhUmVmKVxuICAgICAgICB2YXIgZGF0YSA9IGNvbHVtbi5kaW1lbnNpb24uYm90dG9tKEluZmluaXR5KVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoXy5pc1N0cmluZyhvYmopIHx8IF8uaXNOdW1iZXIob2JqKSB8fCBfLmlzQm9vbGVhbihvYmopKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAodHlwZW9mKGQpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbnMuJGVxKGQsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBvYmpcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBJZiBhbiBhcnJheSwgcmVjdXJzZSBpbnRvIGVhY2ggaXRlbSBhbmQgcmV0dXJuIGFzIGEgbWFwXG4gICAgaWYgKF8uaXNBcnJheShvYmopKSB7XG4gICAgICBzdWJHZXR0ZXJzID0gXy5tYXAob2JqLCBmdW5jdGlvbihvKSB7XG4gICAgICAgIHJldHVybiBtYWtlRnVuY3Rpb24obywgaXNBZ2dyZWdhdGlvbilcbiAgICAgIH0pXG4gICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gc3ViR2V0dGVycy5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICAgIHJldHVybiBzKGQpXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgb2JqZWN0LCByZXR1cm4gYSByZWN1cnNpb24gZnVuY3Rpb24gdGhhdCBpdHNlbGYsIHJldHVybnMgdGhlIHJlc3VsdHMgb2YgYWxsIG9mIHRoZSBvYmplY3Qga2V5c1xuICAgIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgIHN1YkdldHRlcnMgPSBfLm1hcChvYmosIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBjaGlsZFxuICAgICAgICB2YXIgZ2V0U3ViID0gbWFrZUZ1bmN0aW9uKHZhbCwgaXNBZ2dyZWdhdGlvbilcblxuICAgICAgICAvLyBEZXRlY3QgcmF3ICRjb2x1bW4gcmVmZXJlbmNlc1xuICAgICAgICB2YXIgZGF0YVJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyh2YWwsIGtleSlcbiAgICAgICAgaWYgKGRhdGFSZWYpIHtcbiAgICAgICAgICB2YXIgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChkYXRhUmVmKVxuICAgICAgICAgIHZhciBkYXRhID0gY29sdW1uLmRpbWVuc2lvbi5ib3R0b20oSW5maW5pdHkpXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgZXhwcmVzc2lvbiwgcGFzcyB0aGUgcGFyZW50VmFsdWUgYW5kIHRoZSBzdWJHZXR0ZXJcbiAgICAgICAgaWYgKGV4cHJlc3Npb25zW2tleV0pIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zW2tleV0oZCwgZ2V0U3ViKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhZ2dyZWdhdG9yT2JqID0gYWdncmVnYXRpb24ucGFyc2VBZ2dyZWdhdG9yUGFyYW1zKGtleSlcbiAgICAgICAgaWYgKGFnZ3JlZ2F0b3JPYmopIHtcbiAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhhdCBhbnkgZnVydGhlciBvcGVyYXRpb25zIGFyZSBmb3IgYWdncmVnYXRpb25zXG4gICAgICAgICAgLy8gYW5kIG5vdCBmaWx0ZXJzXG4gICAgICAgICAgaXNBZ2dyZWdhdGlvbiA9IHRydWVcbiAgICAgICAgICAgIC8vIGhlcmUgd2UgcGFzcyB0cnVlIHRvIG1ha2VGdW5jdGlvbiB3aGljaCBkZW5vdGVzIHRoYXRcbiAgICAgICAgICAgIC8vIGFuIGFnZ3JlZ2F0aW5vIGNoYWluIGhhcyBzdGFydGVkIGFuZCB0byBzdG9wIHVzaW5nICRBTkRcbiAgICAgICAgICBnZXRTdWIgPSBtYWtlRnVuY3Rpb24odmFsLCBpc0FnZ3JlZ2F0aW9uKVxuICAgICAgICAgICAgLy8gSWYgaXQncyBhbiBhZ2dyZWdhdGlvbiBvYmplY3QsIGJlIHN1cmUgdG8gcGFzcyBpbiB0aGUgY2hpbGRyZW4sIGFuZCB0aGVuIGFueSBhZGRpdGlvbmFsIHBhcmFtcyBwYXNzZWQgaW50byB0aGUgYWdncmVnYXRpb24gc3RyaW5nXG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBhZ2dyZWdhdG9yT2JqLmFnZ3JlZ2F0b3IuYXBwbHkobnVsbCwgW2dldFN1YigpXS5jb25jYXQoYWdncmVnYXRvck9iai5wYXJhbXMpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0IG11c3QgYmUgYSBzdHJpbmcgdGhlbi4gUGx1Y2sgdGhhdCBzdHJpbmcga2V5IGZyb20gcGFyZW50LCBhbmQgcGFzcyBpdCBhcyB0aGUgbmV3IHZhbHVlIHRvIHRoZSBzdWJHZXR0ZXJcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICBkID0gZFtrZXldXG4gICAgICAgICAgcmV0dXJuIGdldFN1YihkLCBnZXRTdWIpXG4gICAgICAgIH1cblxuICAgICAgfSlcblxuICAgICAgLy8gQWxsIG9iamVjdCBleHByZXNzaW9ucyBhcmUgYmFzaWNhbGx5IEFORCdzXG4gICAgICAvLyBSZXR1cm4gQU5EIHdpdGggYSBtYXAgb2YgdGhlIHN1YkdldHRlcnNcbiAgICAgIGlmIChpc0FnZ3JlZ2F0aW9uKSB7XG4gICAgICAgIGlmIChzdWJHZXR0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gc3ViR2V0dGVyc1swXShkKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBfLm1hcChzdWJHZXR0ZXJzLCBmdW5jdGlvbihnZXRTdWIpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRTdWIoZClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICByZXR1cm4gZXhwcmVzc2lvbnMuJGFuZChkLCBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIF8ubWFwKHN1YkdldHRlcnMsIGZ1bmN0aW9uKGdldFN1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YihkKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ25vIGV4cHJlc3Npb24gZm91bmQgZm9yICcsIG9iailcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBuYXR1cmFsU29ydCA9IHJlcXVpcmUoJ2phdmFzY3JpcHQtbmF0dXJhbC1zb3J0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3NpZ246IGFzc2lnbixcbiAgZmluZDogZmluZCxcbiAgcmVtb3ZlOiByZW1vdmUsXG4gIGlzQXJyYXk6IGlzQXJyYXksXG4gIGlzT2JqZWN0OiBpc09iamVjdCxcbiAgaXNCb29sZWFuOiBpc0Jvb2xlYW4sXG4gIGlzU3RyaW5nOiBpc1N0cmluZyxcbiAgaXNOdW1iZXI6IGlzTnVtYmVyLFxuICBpc0Z1bmN0aW9uOiBpc0Z1bmN0aW9uLFxuICBnZXQ6IGdldCxcbiAgbWFwOiBtYXAsXG4gIHNvcnRCeTogc29ydEJ5LFxuICBmb3JFYWNoOiBmb3JFYWNoLFxuICBpc1VuZGVmaW5lZDogaXNVbmRlZmluZWQsXG4gIHBpY2s6IHBpY2ssXG4gIHhvcjogeG9yLFxuICBjbG9uZTogY2xvbmUsXG4gIGlzRXF1YWw6IGlzRXF1YWwsXG4gIHJlcGxhY2VBcnJheTogcmVwbGFjZUFycmF5LFxuICB1bmlxOiB1bmlxLFxuICBmbGF0dGVuOiBmbGF0dGVuLFxuICBzb3J0OiBzb3J0LFxufVxuXG5cbmZ1bmN0aW9uIGFzc2lnbihvdXQpIHtcbiAgb3V0ID0gb3V0IHx8IHt9XG4gIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCFhcmd1bWVudHNbaV0pXG4gICAgICBjb250aW51ZTtcbiAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG4gICAgICBpZiAoYXJndW1lbnRzW2ldLmhhc093blByb3BlcnR5KGtleSkpXG4gICAgICAgIG91dFtrZXldID0gYXJndW1lbnRzW2ldW2tleV1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiBmaW5kKGEsIGIpIHtcbiAgcmV0dXJuIGEuZmluZChiKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlKGEsIGIpIHtcbiAgcmV0dXJuIGEuZmlsdGVyKGZ1bmN0aW9uKG8sIGkpIHtcbiAgICB2YXIgciA9IGIobylcbiAgICBpZiAocikge1xuICAgICAgYS5zcGxpY2UoaSwgMSlcbiAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuICB9KVxufVxuXG5mdW5jdGlvbiBpc0FycmF5KGEpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYSlcbn1cblxuZnVuY3Rpb24gaXNPYmplY3QoZCkge1xuICByZXR1cm4gdHlwZW9mKGQpID09PSAnb2JqZWN0JyAmJiAhaXNBcnJheShkKVxufVxuXG5mdW5jdGlvbiBpc0Jvb2xlYW4oZCkge1xuICByZXR1cm4gdHlwZW9mKGQpID09PSAnYm9vbGVhbidcbn1cblxuZnVuY3Rpb24gaXNTdHJpbmcoZCkge1xuICByZXR1cm4gdHlwZW9mKGQpID09PSAnc3RyaW5nJ1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihkKSB7XG4gIHJldHVybiB0eXBlb2YoZCkgPT09ICdudW1iZXInXG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYSkge1xuICByZXR1cm4gdHlwZW9mKGEpID09PSAnZnVuY3Rpb24nXG59XG5cbmZ1bmN0aW9uIGdldChhLCBiKSB7XG4gIHJldHVybiBiLlxuICByZXBsYWNlKCdbJywgJy4nKS5yZXBsYWNlKCddJywgJycpLlxuICBzcGxpdCgnLicpLlxuICByZWR1Y2UoXG4gICAgZnVuY3Rpb24ob2JqLCBwcm9wZXJ0eSkge1xuICAgICAgcmV0dXJuIG9ialtwcm9wZXJ0eV07XG4gICAgfSwgYVxuICApXG59XG5cbmZ1bmN0aW9uIG1hcChhLCBiKSB7XG4gIHZhciBtXG4gIHZhciBrZXlcbiAgaWYgKGlzRnVuY3Rpb24oYikpIHtcbiAgICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICAgIG0gPSBbXVxuICAgICAgZm9yIChrZXkgaW4gYSkge1xuICAgICAgICBpZiAoYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgbS5wdXNoKGIoYVtrZXldLCBrZXksIGEpKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbVxuICAgIH1cbiAgICByZXR1cm4gYS5tYXAoYilcbiAgfVxuICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICBtID0gW11cbiAgICBmb3IgKGtleSBpbiBhKSB7XG4gICAgICBpZiAoYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIG0ucHVzaChhW2tleV1bYl0pXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtXG4gIH1cbiAgcmV0dXJuIGEubWFwKGZ1bmN0aW9uKGFhLCBpKSB7XG4gICAgcmV0dXJuIGFhW2JdXG4gIH0pXG59XG5cbmZ1bmN0aW9uIHNvcnRCeShhLCBiKSB7XG4gIGlmIChpc0Z1bmN0aW9uKGIpKSB7XG4gICAgcmV0dXJuIGEuc29ydChmdW5jdGlvbihhYSwgYmIpIHtcbiAgICAgIGlmIChhYS52YWx1ZSA+IGJiLnZhbHVlKSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgICAgfVxuICAgICAgaWYgKGFhLnZhbHVlIDwgYmIudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgfVxuICAgICAgLy8gYSBtdXN0IGJlIGVxdWFsIHRvIGJcbiAgICAgIHJldHVybiAwO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvckVhY2goYSwgYikge1xuICBpZiAoaXNPYmplY3QoYSkpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gYSkge1xuICAgICAgaWYgKGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICBiKGFba2V5XSwga2V5LCBhKVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuICBpZiAoaXNBcnJheShhKSkge1xuICAgIHJldHVybiBhLmZvckVhY2goYilcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhKSB7XG4gIHJldHVybiB0eXBlb2YoYSkgPT09ICd1bmRlZmluZWQnXG59XG5cbmZ1bmN0aW9uIHBpY2soYSwgYikge1xuICB2YXIgYyA9IHt9XG4gIGZvckVhY2goYiwgZnVuY3Rpb24oYmIpIHtcbiAgICBpZiAoYVtiYl0pIGNbYmJdID0gYVtiYl1cbiAgfSlcbiAgcmV0dXJuIGNcbn1cblxuZnVuY3Rpb24geG9yKGEsIGIpIHtcbiAgdmFyIGRpZmYgPSBbXVxuICBmb3JFYWNoKGEsIGZ1bmN0aW9uKGFhKSB7XG4gICAgaWYgKGIuaW5kZXhPZihhYSkgPCAwKSB7XG4gICAgICByZXR1cm4gZGlmZi5wdXNoKGFhKVxuICAgIH1cbiAgfSlcbiAgcmV0dXJuIGRpZmZcbn1cblxuZnVuY3Rpb24gY2xvbmUoYSkge1xuICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhLCBmdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9KSlcbn1cblxuZnVuY3Rpb24gaXNFcXVhbCh4LCB5KSB7XG4gIGlmICgodHlwZW9mIHggPT0gXCJvYmplY3RcIiAmJiB4ICE9PSBudWxsKSAmJiAodHlwZW9mIHkgPT0gXCJvYmplY3RcIiAmJiB5ICE9PSBudWxsKSkge1xuICAgIGlmIChPYmplY3Qua2V5cyh4KS5sZW5ndGggIT0gT2JqZWN0LmtleXMoeSkubGVuZ3RoKVxuICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgcHJvcCBpbiB4KSB7XG4gICAgICBpZiAoeS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICBpZiAoIWlzRXF1YWwoeFtwcm9wXSwgeVtwcm9wXSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmICh4ICE9PSB5KVxuICAgIHJldHVybiBmYWxzZTtcbiAgZWxzZVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZXBsYWNlQXJyYXkoYSwgYikge1xuICB2YXIgYWwgPSBhLmxlbmd0aFxuICB2YXIgYmwgPSBiLmxlbmd0aFxuICBpZiAoYWwgPiBibCkge1xuICAgIGEuc3BsaWNlKGJsLCBhbCAtIGJsKVxuICB9IGVsc2UgaWYgKGFsIDwgYmwpIHtcbiAgICBhLnB1c2guYXBwbHkoYSwgbmV3IEFycmF5KGJsIC0gYWwpKVxuICB9XG4gIGZvckVhY2goYSwgZnVuY3Rpb24odmFsLCBrZXkpIHtcbiAgICBhW2tleV0gPSBiW2tleV1cbiAgfSlcbiAgcmV0dXJuIGFcbn1cblxuZnVuY3Rpb24gdW5pcShhKSB7XG4gIHZhciBzZWVuID0ge307XG4gIHJldHVybiBhLmZpbHRlcihmdW5jdGlvbihpdGVtKSB7XG4gICAgcmV0dXJuIHNlZW4uaGFzT3duUHJvcGVydHkoaXRlbSkgPyBmYWxzZSA6IChzZWVuW2l0ZW1dID0gdHJ1ZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuKGFycmF5KSB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoZnVuY3Rpb24oYSwgYikge1xuICAgIHJldHVybiBhLmNvbmNhdChiKTtcbiAgfSwgW10pO1xufVxuXG5mdW5jdGlvbiBzb3J0KGEpe1xuICByZXR1cm4gYS5zb3J0KG5hdHVyYWxTb3J0KVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgncScpO1xudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuICB2YXIgcmVkdWN0aW9meSA9IHJlcXVpcmUoJy4vcmVkdWN0aW9meScpKHNlcnZpY2UpXG4gIHZhciBmaWx0ZXJzID0gcmVxdWlyZSgnLi9maWx0ZXJzJykoc2VydmljZSlcblxuICByZXR1cm4gZnVuY3Rpb24gZmluZChxdWVyeSkge1xuXG4gICAgLy8gRGVmYXVsdCBxdWVyeVxuICAgIGlmICh0eXBlb2YocXVlcnkpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcXVlcnkgPSB7fVxuICAgIH1cblxuICAgIC8vIERlZmF1bHQgc2VsZWN0XG4gICAgaWYgKHR5cGVvZihxdWVyeS5zZWxlY3QpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcXVlcnkuc2VsZWN0ID0ge1xuICAgICAgICAkY291bnQ6IHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBTdXBwb3J0IGdyb3VwQWxsXG4gICAgcXVlcnkuZ3JvdXBCeSA9IHF1ZXJ5Lmdyb3VwQnkgfHwgdHJ1ZVxuXG4gICAgLy8gRmluZCBFeGlzdGluZyBDb2x1bW5cbiAgICB2YXIgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChxdWVyeS5ncm91cEJ5KVxuXG4gICAgdmFyIGdyb3VwXG5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIENyZWF0ZSBDb2x1bW4gaWYgbm90IGZvdW5kXG4gICAgICAgIGlmICghY29sdW1uKSB7XG4gICAgICAgICAgcmV0dXJuIHNlcnZpY2UuY29sdW1uKHtcbiAgICAgICAgICAgICAga2V5OiBxdWVyeS5ncm91cEJ5LFxuICAgICAgICAgICAgICB0eXBlOiAhXy5pc1VuZGVmaW5lZChxdWVyeS50eXBlKSA/IHF1ZXJ5LnR5cGUgOiBudWxsLFxuICAgICAgICAgICAgICBhcnJheTogISFxdWVyeS5hcnJheVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIF8uZmluZCh1LmNvbHVtbnMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYy5rZXkgPT09IHF1ZXJ5Lmdyb3VwQnlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgdGhlIGNvbHVtbiBleGlzdHMsIGxldCdzIGF0IGxlYXN0IG1ha2Ugc3VyZSBpdCdzIG1hcmtlZFxuICAgICAgICAvLyBhcyBwZXJtYW5lbnQuIFRoZXJlIGlzIGEgc2xpZ2h0IGNoYW5jZSBpdCBleGlzdHMgYmVjYXVzZVxuICAgICAgICAvLyBvZiBhIGZpbHRlciwgYW5kIHRoZSB1c2VyIGhhcyBub3cgZGVjaWRlZCB0byBxdWVyeSBvbiBpdFxuICAgICAgICByZXR1cm4gY29sdW1uXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oYykge1xuICAgICAgICBjb2x1bW4gPSBjXG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSBncm91cGluZyBvbiB0aGUgY29sdW1ucyBkaW1lbnNpb25cbiAgICAgICAgICAvLyBVc2luZyBQcm9taXNlIFJlc29sdmUgYWxsb3dzIHN1cHBvcnQgZm9yIGNyb3NzZmlsdGVyIGFzeW5jXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5ncm91cCgpKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGcpIHtcbiAgICAgICAgLy8gU2F2ZSB0aGUgZ3JvdXAgd2hpbGUgd2UgY3JlYXRlIHRoZSByZWR1Y2VyXG4gICAgICAgIGdyb3VwID0gZ1xuICAgICAgICByZXR1cm4gZmlsdGVycy5zY2FuRm9yRHluYW1pY0ZpbHRlcnMocXVlcnkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVxdWlyZWRDb2x1bW5zKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc2NhbiB0aGUgZ3JvdXAgZm9yIGFueSBmaWx0ZXJzIHRoYXQgd291bGQgcmVxdWlyZVxuICAgICAgICAvLyB0aGUgZ3JvdXAgdG8gYmUgcmVidWlsdCB3aGVuIGRhdGEgaXMgYWRkZWQgb3IgcmVtb3ZlZCBpbiBhbnkgd2F5LlxuICAgICAgICBpZiAocmVxdWlyZWRDb2x1bW5zLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChyZXF1aXJlZENvbHVtbnMsIGZ1bmN0aW9uKGNvbHVtbktleSkge1xuICAgICAgICAgICAgICBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAgICAgICAga2V5OiBjb2x1bW5LZXksXG4gICAgICAgICAgICAgICAgZHluYW1pY1JlZmVyZW5jZTogZ3JvdXBcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5lZWRzTGlzdGVuZXIpIHtcbiAgICAgICAgLy8gSGVyZSwgd2UgY3JlYXRlIGEgbGlzdGVuZXIgdG8gcmVjcmVhdGUgYW5kIGFwcGx5IHRoZSByZWR1Y2VyIHRvXG4gICAgICAgIC8vIHRoZSBncm91cCBhbnl0aW1lIGRhdGEgY2hhbmdlcy5cblxuICAgICAgICB2YXIgcXVlcnlSZXMgPSB7XG4gICAgICAgICAgLy8gVGhlIFVuaXZlcnNlIGZvciBjb250aW51b3VzIHByb21pc2UgY2hhaW5pbmdcbiAgICAgICAgICB1bml2ZXJzZTogc2VydmljZSxcbiAgICAgICAgICAvLyBUaGUgYmFyZSBtZXRhbHF1ZXJ5UmVzLmRhdGFcbiAgICAgICAgICBjcm9zc2ZpbHRlcjogc2VydmljZS5jZixcbiAgICAgICAgICBkaW1lbnNpb246IGNvbHVtbi5kaW1lbnNpb24sXG4gICAgICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG5lZWRzTGlzdGVuZXIpIHtcbiAgICAgICAgICBjb2x1bW4uYWRkTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24oaXNQb3N0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwbHlSZWR1Y2VyKHF1ZXJ5UmVzLCBpc1Bvc3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLnB1c2goZnVuY3Rpb24oaXNQb3N0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwbHlSZWR1Y2VyKHF1ZXJ5UmVzLCBpc1Bvc3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcHBseVJlZHVjZXIocXVlcnlSZXMpXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcXVlcnlSZXNcbiAgICAgICAgICB9KVxuXG4gICAgICAgIGZ1bmN0aW9uIGFwcGx5UmVkdWNlcihxdWVyeVJlcywgaXNQb3N0KSB7XG4gICAgICAgICAgLy8gQ3JlYXRlIHRoZSByZWR1Y2VyIHVzaW5nIHJlZHVjdGlvIGFuZCB0aGUgVW5pdmVyc2UgUXVlcnkgU3ludGF4XG4gICAgICAgICAgcmV0dXJuIHJlZHVjdGlvZnkocXVlcnkpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZWR1Y2VyKSB7XG4gICAgICAgICAgICAgIC8vIEFwcGx5IHRoZSByZWR1Y2VyIHRvIHRoZSBncm91cFxuICAgICAgICAgICAgICByZWR1Y2VyKHF1ZXJ5UmVzLmdyb3VwKVxuICAgICAgICAgICAgICBxdWVyeVJlcy5kYXRhID0gcXVlcnlSZXMuZ3JvdXAuYWxsKClcbiAgICAgICAgICAgICAgcXVlcnlSZXMuZHluYW1pY0RhdGEgPSBpc1Bvc3RcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgfSlcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc2hvcnRoYW5kTGFiZWxzOiB7XG4gICAgJGNvdW50OiAnY291bnQnLFxuICAgICRzdW06ICdzdW0nLFxuICAgICRhdmc6ICdhdmcnLFxuICAgICRtaW46ICdtaW4nLFxuICAgICRtYXg6ICdtYXgnLFxuICAgICRtZWQ6ICdtZWQnLFxuICAgICRzdW1TcTogJ3N1bVNxJyxcbiAgICAkc3RkOiAnc3RkJyxcbiAgfSxcbiAgYWdncmVnYXRvcnM6IHtcbiAgICAkY291bnQ6ICRjb3VudCxcbiAgICAkc3VtOiAkc3VtLFxuICAgICRhdmc6ICRhdmcsXG4gICAgJG1pbjogJG1pbixcbiAgICAkbWF4OiAkbWF4LFxuICAgICRtZWQ6ICRtZWQsXG4gICAgJHN1bVNxOiAkc3VtU3EsXG4gICAgJHN0ZDogJHN0ZCxcbiAgfVxufVxuXG4vLyBBZ2dyZWdhdG9yc1xuXG5mdW5jdGlvbiAkY291bnQocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuY291bnQodHJ1ZSlcbn1cblxuZnVuY3Rpb24gJHN1bShyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdW0odmFsdWUpXG59XG5cbmZ1bmN0aW9uICRhdmcocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuYXZnKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkbWluKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLm1pbih2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJG1heChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5tYXgodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRtZWQocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIubWVkaWFuKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkc3VtU3EocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuc3VtT2ZTcSh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJHN0ZChyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5zdGQodmFsdWUpXG59XG5cbi8vIFRPRE8gaGlzdG9ncmFtc1xuLy8gVE9ETyBleGNlcHRpb25zXG4iLCIndXNlIHN0cmljdCdcblxudmFyIHJlZHVjdGlvID0gcmVxdWlyZSgncmVkdWN0aW8nKVxuXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcbnZhciByQWdncmVnYXRvcnMgPSByZXF1aXJlKCcuL3JlZHVjdGlvQWdncmVnYXRvcnMnKVxudmFyIGV4cHJlc3Npb25zID0gcmVxdWlyZSgnLi9leHByZXNzaW9ucycpXG52YXIgYWdncmVnYXRpb24gPSByZXF1aXJlKCcuL2FnZ3JlZ2F0aW9uJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZXJ2aWNlKSB7XG4gIHZhciBmaWx0ZXJzID0gcmVxdWlyZSgnLi9maWx0ZXJzJykoc2VydmljZSlcblxuICByZXR1cm4gZnVuY3Rpb24gcmVkdWN0aW9meShxdWVyeSkge1xuICAgIHZhciByZWR1Y2VyID0gcmVkdWN0aW8oKVxuICAgIHZhciBncm91cEJ5ID0gcXVlcnkuZ3JvdXBCeVxuICAgIGFnZ3JlZ2F0ZU9yTmVzdChyZWR1Y2VyLCBxdWVyeS5zZWxlY3QpXG5cbiAgICBpZiAocXVlcnkuZmlsdGVyKSB7XG4gICAgICB2YXIgZmlsdGVyRnVuY3Rpb24gPSBmaWx0ZXJzLm1ha2VGdW5jdGlvbihxdWVyeS5maWx0ZXIpXG4gICAgICBpZiAoZmlsdGVyRnVuY3Rpb24pIHtcbiAgICAgICAgcmVkdWNlci5maWx0ZXIoZmlsdGVyRnVuY3Rpb24pXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWR1Y2VyKVxuXG5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIHJlY3Vyc2l2ZWx5IGZpbmQgdGhlIGZpcnN0IGxldmVsIG9mIHJlZHVjdGlvIG1ldGhvZHMgaW5cbiAgICAvLyBlYWNoIG9iamVjdCBhbmQgYWRkcyB0aGF0IHJlZHVjdGlvbiBtZXRob2QgdG8gcmVkdWN0aW9cbiAgICBmdW5jdGlvbiBhZ2dyZWdhdGVPck5lc3QocmVkdWNlciwgc2VsZWN0cykge1xuXG4gICAgICAvLyBTb3J0IHNvIG5lc3RlZCB2YWx1ZXMgYXJlIGNhbGN1bGF0ZWQgbGFzdCBieSByZWR1Y3RpbydzIC52YWx1ZSBtZXRob2RcbiAgICAgIHZhciBzb3J0ZWRTZWxlY3RLZXlWYWx1ZSA9IF8uc29ydEJ5KFxuICAgICAgICBfLm1hcChzZWxlY3RzLCBmdW5jdGlvbih2YWwsIGtleSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgICAgIHZhbHVlOiB2YWxcbiAgICAgICAgICB9XG4gICAgICAgIH0pLFxuICAgICAgICBmdW5jdGlvbihzKSB7XG4gICAgICAgICAgaWYgKHJBZ2dyZWdhdG9ycy5hZ2dyZWdhdG9yc1tzLmtleV0pIHtcbiAgICAgICAgICAgIHJldHVybiAwXG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAxXG4gICAgICAgIH0pXG5cblxuICAgICAgLy8gZGl2ZSBpbnRvIGVhY2gga2V5L3ZhbHVlXG4gICAgICByZXR1cm4gXy5mb3JFYWNoKHNvcnRlZFNlbGVjdEtleVZhbHVlLCBmdW5jdGlvbihzKSB7XG5cbiAgICAgICAgLy8gRm91bmQgYSBSZWR1Y3RpbyBBZ2dyZWdhdGlvblxuICAgICAgICBpZiAockFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XSkge1xuICAgICAgICAgIC8vIEJ1aWxkIHRoZSB2YWx1ZUFjY2Vzc29yRnVuY3Rpb25cbiAgICAgICAgICB2YXIgYWNjZXNzb3IgPSBtYWtlVmFsdWVBY2Nlc3NvcihzLnZhbHVlKVxuICAgICAgICAgICAgLy8gQWRkIHRoZSByZWR1Y2VyIHdpdGggdGhlIFZhbHVlQWNjZXNzb3JGdW5jdGlvbiB0byB0aGUgcmVkdWNlclxuICAgICAgICAgIHJlZHVjZXIgPSByQWdncmVnYXRvcnMuYWdncmVnYXRvcnNbcy5rZXldKHJlZHVjZXIsIGFjY2Vzc29yKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRm91bmQgYSB0b3AgbGV2ZWwga2V5IHZhbHVlIHRoYXQgaXMgbm90IGFuIGFnZ3JlZ2F0aW9uIG9yIGFcbiAgICAgICAgLy8gbmVzdGVkIG9iamVjdC4gVGhpcyBpcyB1bmFjY2VwdGFibGUuXG4gICAgICAgIGlmICghXy5pc09iamVjdChzLnZhbHVlKSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05lc3RlZCBzZWxlY3RzIG11c3QgYmUgYW4gb2JqZWN0Jywgcy5rZXkpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdCdzIGFub3RoZXIgbmVzdGVkIG9iamVjdCwgc28ganVzdCByZXBlYXQgdGhpcyBwcm9jZXNzIG9uIGl0XG4gICAgICAgIHJlZHVjZXIgPSBhZ2dyZWdhdGVPck5lc3QocmVkdWNlci52YWx1ZShzLmtleSksIHMudmFsdWUpXG5cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZVZhbHVlQWNjZXNzb3Iob2JqKSB7XG4gICAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGEgc3RyaW5nIG9yIGEgbnVtYmVyIGhlcmUsIGl0IGlzIHJlZmVyZW5jaW5nXG4gICAgICAvLyBhIGNvbHVtbiBwcm9wZXJ0eSBmb3IgYSByZWR1Y3RpbyBhZ2dyZWdhdGlvbiwgc28ganVzdCByZXR1cm4gaXQgYXMgYSBzdHJpbmdcbiAgICAgIGlmICh0eXBlb2Yob2JqKSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mKG9iaikgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBvYmogKyAnJ1xuICAgICAgfVxuICAgICAgLy8gSWYgaXQncyBhbiBvYmplY3QsIHdlIG5lZWQgdG8gYnVpbGQgYSBjdXN0b20gYWdncmVnYXRpb24gZnVuY3Rpb25cbiAgICAgIGlmIChfLmlzT2JqZWN0KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0aW9uLm1ha2VGdW5jdGlvbihvYmopXG4gICAgICB9XG4gICAgfVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHVuaXZlcnNlXG5cbmZ1bmN0aW9uIHVuaXZlcnNlKGRhdGEsIG9wdGlvbnMpIHtcblxuICB2YXIgc2VydmljZSA9IHtcbiAgICBvcHRpb25zOiBfLmFzc2lnbih7fSwgb3B0aW9ucyksXG4gICAgY29sdW1uczogW10sXG4gICAgZmlsdGVyczoge30sXG4gIH1cblxuICB2YXIgY2YgPSByZXF1aXJlKCcuL2Nyb3NzZmlsdGVyJykoc2VydmljZSlcblxuICBkYXRhID0gY2YuZ2VuZXJhdGVDb2x1bW5zKGRhdGEpXG5cbiAgcmV0dXJuIGNmLmJ1aWxkKGRhdGEpXG4gICAgLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgc2VydmljZS5jZiA9IGRhdGFcbiAgICAgIHJldHVybiBfLmFzc2lnbihzZXJ2aWNlLCB7XG4gICAgICAgIGFkZDogY2YuYWRkLFxuICAgICAgICByZW1vdmU6IGNmLnJlbW92ZSxcbiAgICAgICAgY29sdW1uOiByZXF1aXJlKCcuL2NvbHVtbicpKHNlcnZpY2UpLFxuICAgICAgICBxdWVyeTogcmVxdWlyZSgnLi9xdWVyeScpKHNlcnZpY2UpLFxuICAgICAgICBmaWx0ZXI6IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpLmZpbHRlcixcbiAgICAgICAgY2xlYXI6IHJlcXVpcmUoJy4vY2xlYXInKShzZXJ2aWNlKSxcbiAgICAgIH0pXG4gICAgfSlcbn1cbiJdfQ==
