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
    if (_.isUndefined(def)) {
      def = true
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

  function findColumn(d) {
    return _.find(service.columns, function(c) {
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

    // Get a sample of the column
    return Promise.try(function() {
        return Promise.resolve(service.cf.all())
      })
      .then(function(all) {

        var sample

        // Complex column Keys
        if (_.isArray(column.key)) {
          column.complex = true
          sample = _.keys(_.pick(all[0], column.key))
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
          if (column.dynamicReference) {
            existing.dynamicReference = true
          }
          // console.info('Column has already been defined', arguments)
          return false
        }

        column.type =
          column.key === true ? 'all' :
          column.complex ? 'complex' :
          column.array ? 'array' :
          getType(sample)

        return dimension.make(column.key, column.type)
      })
      .then(function(dim) {
        if (!dim) {
          return Promise.resolve()
        }
        column.dimension = dim
        column.filterCount = column.filterCount || 0
        var stopListeningForData = service.onDataChange(buildColumnKeys)
        column.removeListeners = [stopListeningForData]

        service.columns.push(column)

        return buildColumnKeys()

        // Build the columnKeys
        function buildColumnKeys(onAdd) {
          if (column.key === true) {
            return Promise.resolve()
          }
          return Promise.resolve(column.dimension.bottom(Infinity))
            .then(function(rows) {
              var accessor = dimension.makeAccessor(column.key)
              if(column.type === 'array'){
                column.values = _.uniq(_.flatten(_.map(rows, accessor)))
              }
              else{
                column.values = _.uniq(_.map(rows, accessor))
              }
            })
        }
      })
      .then(function() {
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

  function generateColumns(data) {
    if (!service.options.generatedColumns) {
      return data
    }
    return _.map(data, function(d, i) {
      _.forEach(service.options.generatedColumns, function(val, key) {
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
        return Promise.serial(_.map(service.dataListeners, function(listener) {
          return function() {
            return listener(true)
          }
        }))
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
      fil.value = _.xor([fil.value], existing.value)
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
      _.forEach(obj, function(val, key) {
        // find the data references, if any
        var ref = findDataReferences(val, key)
        if(ref) columns.push(ref)
          // if it's a string
        if (_.isString(val)) {
          ref = findDataReferences(null, val)
          if(ref) columns.push(ref)
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
          var data = column.values
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
  keys: keys,
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
    if (typeof(a[bb]) !== 'undefined') c[bb] = a[bb]
  })
  return c
}

function xor(a, b) {

  var unique = []
  forEach(a, function(aa) {
    if (b.indexOf(aa) === -1) {
      return unique.push(aa)
    }
  })
  forEach(b, function(bb) {
    if (a.indexOf(bb) === -1) {
      return unique.push(bb)
    }
  })
  return unique
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
  var seen = new Set();
  return a.filter(function(item) {
    var allow = false;
    if (!seen.has(item)) {
      seen.add(item);
      allow = true;
    }
    return allow;
  });
}

function flatten(aa) {
  var flattened = [];
  for (var i = 0; i < aa.length; ++i) {
    var current = aa[i];
    for (var j = 0; j < current.length; ++j)
      flattened.push(current[j]);
  }
  return flattened
}

function sort(arr) {
  for (var i = 1; i < arr.length; i++) {
    var tmp = arr[i],
      j = i;
    while (arr[j - 1] > tmp) {
      arr[j] = arr[j - 1];
      --j;
    }
    arr[j] = tmp;
  }

  return arr;
}

function keys(aa) {
  var keys = []
  for (var key in aa) {
    if (aa.hasOwnProperty(key)) {
      keys.push(aa[key])
    }
  }
  return keys
}

},{"javascript-natural-sort":4}],42:[function(require,module,exports){
'use strict'

var Promise = require('q')
var _ = require('./lodash')

Promise.serial = serial

var isPromiseLike = function(obj) {
  return obj && _.isFunction(obj.then);
}

function serial(tasks) {
  //Fake a "previous task" for our initial iteration
  var prevPromise;
  var error = new Error();
  _.forEach(tasks, function(task, key) {
    var success = task.success || task;
    var fail = task.fail;
    var notify = task.notify;
    var nextPromise;

    //First task
    if (!prevPromise) {
      nextPromise = success();
      if (!isPromiseLike(nextPromise)) {
        error.message = "Task " + key + " did not return a promise.";
        throw error;
      }
    } else {
      //Wait until the previous promise has resolved or rejected to execute the next task
      nextPromise = prevPromise.then(
        /*success*/
        function(data) {
          if (!success) {
            return data;
          }
          var ret = success(data);
          if (!isPromiseLike(ret)) {
            error.message = "Task " + key + " did not return a promise.";
            throw error;
          }
          return ret;
        },
        /*failure*/
        function(reason) {
          if (!fail) {
            return Promise.reject(reason);
          }
          var ret = fail(reason);
          if (!isPromiseLike(ret)) {
            error.message = "Fail for task " + key + " did not return a promise.";
            throw error;
          }
          return ret;
        },
        notify);
    }
    prevPromise = nextPromise;
  });

  return prevPromise || Promise.when();
}

},{"./lodash":41,"q":5}],43:[function(require,module,exports){
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
              return service.column({
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
        // Here, we create a listener to recreate and apply the reducer
        // (with updated reference data) to
        // the group anytime data changes.

        var queryRes = {
          // The Universe for continuous promise chaining
          universe: service,
          // The bare metalqueryRes.data
          crossfilter: service.cf,
          dimension: column.dimension,
          group: group,
          // Reductio reducer instance
          reducer: null,
        }

        var stopListeningForData
        if (needsListener) {
          stopListeningForData = service.onDataChange(function applyReducerOnDataChange(isPost) {
            return applyReducer(queryRes, isPost)
          })
          column.removeListeners.push(stopListeningForData)
        }

        return applyReducer(queryRes)
          .then(function() {
            return queryRes
          })

        function applyReducer(queryRes, isPost) {
          // Create the reducer using reductio and the Universe Query Syntax
          return reductiofy(query)
            .then(function(reducer) {
              queryRes.reducer = reducer
              // Apply the reducer to the group
              queryRes.reducer(queryRes.group)
              return Promise.resolve(queryRes.group.all())
            })
            .then(function(all){
              queryRes.data = all
            })
        }

      })
  }
}

},{"./filters":40,"./lodash":41,"./reductiofy":45,"q":5}],44:[function(require,module,exports){
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

},{"./lodash":41}],45:[function(require,module,exports){
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

},{"./aggregation":34,"./expressions":39,"./filters":40,"./lodash":41,"./reductioAggregators":44,"reductio":27}],46:[function(require,module,exports){
'use strict'

require('./q.serial')

var Promise = require('q')
var _ = require('./lodash')

module.exports = universe

function universe(data, options) {

  var service = {
    options: _.assign({}, options),
    columns: [],
    filters: {},
    dataListeners: [],
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
        onDataChange: onDataChange
      })
    })

  function onDataChange(cb){
    service.dataListeners.push(cb)
    return function(){
      service.dataListeners.splice(service.dataListeners.indexOf(cb), 1)
    }
  }
}

},{"./clear":35,"./column":36,"./crossfilter":37,"./filters":40,"./lodash":41,"./q.serial":42,"./query":43,"q":5}]},{},[46])(46)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL2Nyb3NzZmlsdGVyMi9jcm9zc2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvamF2YXNjcmlwdC1uYXR1cmFsLXNvcnQvbmF0dXJhbFNvcnQuanMiLCJub2RlX21vZHVsZXMvcS9xLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL25vZGVfbW9kdWxlcy9jcm9zc2ZpbHRlcjIvY3Jvc3NmaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FjY2Vzc29ycy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYWxpYXMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2FsaWFzUHJvcC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvYXZnLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9idWlsZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvY2FwLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9jb3VudC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvZGF0YS1saXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9leGNlcHRpb24tY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2V4Y2VwdGlvbi1zdW0uanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvaGlzdG9ncmFtLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9tYXguanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL21lZGlhbi5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvbWluLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9uZXN0LmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wYXJhbWV0ZXJzLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9wb3N0cHJvY2Vzcy5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvcG9zdHByb2Nlc3NvcnMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3JlZHVjdGlvLmpzIiwibm9kZV9tb2R1bGVzL3JlZHVjdGlvL3NyYy9zb3J0QnkuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N0ZC5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvc3VtLW9mLXNxdWFyZXMuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3N1bS5qcyIsIm5vZGVfbW9kdWxlcy9yZWR1Y3Rpby9zcmMvdmFsdWUtY291bnQuanMiLCJub2RlX21vZHVsZXMvcmVkdWN0aW8vc3JjL3ZhbHVlLWxpc3QuanMiLCJzcmMvYWdncmVnYXRpb24uanMiLCJzcmMvY2xlYXIuanMiLCJzcmMvY29sdW1uLmpzIiwic3JjL2Nyb3NzZmlsdGVyLmpzIiwic3JjL2RpbWVuc2lvbi5qcyIsInNyYy9leHByZXNzaW9ucy5qcyIsInNyYy9maWx0ZXJzLmpzIiwic3JjL2xvZGFzaC5qcyIsInNyYy9xLnNlcmlhbC5qcyIsInNyYy9xdWVyeS5qcyIsInNyYy9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzLmpzIiwic3JjL3JlZHVjdGlvZnkuanMiLCJzcmMvdW5pdmVyc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2g1REE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hnRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5aERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25KQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiKGZ1bmN0aW9uKGV4cG9ydHMpe1xuY3Jvc3NmaWx0ZXIudmVyc2lvbiA9IFwiMi4wLjAtYWxwaGEuMDNcIjtcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2lkZW50aXR5KGQpIHtcbiAgcmV0dXJuIGQ7XG59XG5jcm9zc2ZpbHRlci5wZXJtdXRlID0gcGVybXV0ZTtcblxuZnVuY3Rpb24gcGVybXV0ZShhcnJheSwgaW5kZXgsIGRlZXApIHtcbiAgZm9yICh2YXIgaSA9IDAsIG4gPSBpbmRleC5sZW5ndGgsIGNvcHkgPSBkZWVwID8gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShhcnJheSkpIDogbmV3IEFycmF5KG4pOyBpIDwgbjsgKytpKSB7XG4gICAgY29weVtpXSA9IGFycmF5W2luZGV4W2ldXTtcbiAgfVxuICByZXR1cm4gY29weTtcbn1cbnZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5iaXNlY3QuYnkgPSBiaXNlY3RfYnk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cbnZhciBoZWFwID0gY3Jvc3NmaWx0ZXIuaGVhcCA9IGhlYXBfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwLmJ5ID0gaGVhcF9ieTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG52YXIgaGVhcHNlbGVjdCA9IGNyb3NzZmlsdGVyLmhlYXBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcHNlbGVjdC5ieSA9IGhlYXBzZWxlY3RfYnk7XG5cbmZ1bmN0aW9uIGhlYXBzZWxlY3RfYnkoZikge1xuICB2YXIgaGVhcCA9IGhlYXBfYnkoZik7XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgayBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYVtsbzpoaV0uXG4gIC8vIFRoZSByZXR1cm5lZCBhcnJheSBpcyBub3Qgc29ydGVkLCBidXQgbWFpbnRhaW5zIHRoZSBoZWFwIHByb3BlcnR5LiBJZiBrIGlzXG4gIC8vIGdyZWF0ZXIgdGhhbiBoaSAtIGxvLCB0aGVuIGZld2VyIHRoYW4gayBlbGVtZW50cyB3aWxsIGJlIHJldHVybmVkLiBUaGVcbiAgLy8gb3JkZXIgb2YgZWxlbWVudHMgaW4gYSBpcyB1bmNoYW5nZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gIGZ1bmN0aW9uIGhlYXBzZWxlY3QoYSwgbG8sIGhpLCBrKSB7XG4gICAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KGsgPSBNYXRoLm1pbihoaSAtIGxvLCBrKSksXG4gICAgICAgIG1pbixcbiAgICAgICAgaSxcbiAgICAgICAgeCxcbiAgICAgICAgZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHF1ZXVlW2ldID0gYVtsbysrXTtcbiAgICBoZWFwKHF1ZXVlLCAwLCBrKTtcblxuICAgIGlmIChsbyA8IGhpKSB7XG4gICAgICBtaW4gPSBmKHF1ZXVlWzBdKTtcbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHggPSBmKGQgPSBhW2xvXSkgPiBtaW4pIHtcbiAgICAgICAgICBxdWV1ZVswXSA9IGQ7XG4gICAgICAgICAgbWluID0gZihoZWFwKHF1ZXVlLCAwLCBrKVswXSk7XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKCsrbG8gPCBoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXVlO1xuICB9XG5cbiAgcmV0dXJuIGhlYXBzZWxlY3Q7XG59XG52YXIgaW5zZXJ0aW9uc29ydCA9IGNyb3NzZmlsdGVyLmluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaW5zZXJ0aW9uc29ydC5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG5cbmZ1bmN0aW9uIGluc2VydGlvbnNvcnRfYnkoZikge1xuXG4gIGZ1bmN0aW9uIGluc2VydGlvbnNvcnQoYSwgbG8sIGhpKSB7XG4gICAgZm9yICh2YXIgaSA9IGxvICsgMTsgaSA8IGhpOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSBpLCB0ID0gYVtpXSwgeCA9IGYodCk7IGogPiBsbyAmJiBmKGFbaiAtIDFdKSA+IHg7IC0taikge1xuICAgICAgICBhW2pdID0gYVtqIC0gMV07XG4gICAgICB9XG4gICAgICBhW2pdID0gdDtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICByZXR1cm4gaW5zZXJ0aW9uc29ydDtcbn1cbi8vIEFsZ29yaXRobSBkZXNpZ25lZCBieSBWbGFkaW1pciBZYXJvc2xhdnNraXkuXG4vLyBJbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiB0aGUgRGFydCBwcm9qZWN0OyBzZWUgbGliL2RhcnQvTElDRU5TRSBmb3IgZGV0YWlscy5cblxudmFyIHF1aWNrc29ydCA9IGNyb3NzZmlsdGVyLnF1aWNrc29ydCA9IHF1aWNrc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbnF1aWNrc29ydC5ieSA9IHF1aWNrc29ydF9ieTtcblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGYpO1xuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgcmV0dXJuIChoaSAtIGxvIDwgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGRcbiAgICAgICAgPyBpbnNlcnRpb25zb3J0XG4gICAgICAgIDogcXVpY2tzb3J0KShhLCBsbywgaGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVpY2tzb3J0KGEsIGxvLCBoaSkge1xuICAgIC8vIENvbXB1dGUgdGhlIHR3byBwaXZvdHMgYnkgbG9va2luZyBhdCA1IGVsZW1lbnRzLlxuICAgIHZhciBzaXh0aCA9IChoaSAtIGxvKSAvIDYgfCAwLFxuICAgICAgICBpMSA9IGxvICsgc2l4dGgsXG4gICAgICAgIGk1ID0gaGkgLSAxIC0gc2l4dGgsXG4gICAgICAgIGkzID0gbG8gKyBoaSAtIDEgPj4gMSwgIC8vIFRoZSBtaWRwb2ludC5cbiAgICAgICAgaTIgPSBpMyAtIHNpeHRoLFxuICAgICAgICBpNCA9IGkzICsgc2l4dGg7XG5cbiAgICB2YXIgZTEgPSBhW2kxXSwgeDEgPSBmKGUxKSxcbiAgICAgICAgZTIgPSBhW2kyXSwgeDIgPSBmKGUyKSxcbiAgICAgICAgZTMgPSBhW2kzXSwgeDMgPSBmKGUzKSxcbiAgICAgICAgZTQgPSBhW2k0XSwgeDQgPSBmKGU0KSxcbiAgICAgICAgZTUgPSBhW2k1XSwgeDUgPSBmKGU1KTtcblxuICAgIHZhciB0O1xuXG4gICAgLy8gU29ydCB0aGUgc2VsZWN0ZWQgNSBlbGVtZW50cyB1c2luZyBhIHNvcnRpbmcgbmV0d29yay5cbiAgICBpZiAoeDEgPiB4MikgdCA9IGUxLCBlMSA9IGUyLCBlMiA9IHQsIHQgPSB4MSwgeDEgPSB4MiwgeDIgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgxID4geDMpIHQgPSBlMSwgZTEgPSBlMywgZTMgPSB0LCB0ID0geDEsIHgxID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MSA+IHg0KSB0ID0gZTEsIGUxID0gZTQsIGU0ID0gdCwgdCA9IHgxLCB4MSA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgzID4geDQpIHQgPSBlMywgZTMgPSBlNCwgZTQgPSB0LCB0ID0geDMsIHgzID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDIgPiB4NSkgdCA9IGUyLCBlMiA9IGU1LCBlNSA9IHQsIHQgPSB4MiwgeDIgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcblxuICAgIHZhciBwaXZvdDEgPSBlMiwgcGl2b3RWYWx1ZTEgPSB4MixcbiAgICAgICAgcGl2b3QyID0gZTQsIHBpdm90VmFsdWUyID0geDQ7XG5cbiAgICAvLyBlMiBhbmQgZTQgaGF2ZSBiZWVuIHNhdmVkIGluIHRoZSBwaXZvdCB2YXJpYWJsZXMuIFRoZXkgd2lsbCBiZSB3cml0dGVuXG4gICAgLy8gYmFjaywgb25jZSB0aGUgcGFydGl0aW9uaW5nIGlzIGZpbmlzaGVkLlxuICAgIGFbaTFdID0gZTE7XG4gICAgYVtpMl0gPSBhW2xvXTtcbiAgICBhW2kzXSA9IGUzO1xuICAgIGFbaTRdID0gYVtoaSAtIDFdO1xuICAgIGFbaTVdID0gZTU7XG5cbiAgICB2YXIgbGVzcyA9IGxvICsgMSwgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuICAgICAgICBncmVhdCA9IGhpIC0gMjsgIC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cblxuICAgIC8vIE5vdGUgdGhhdCBmb3IgdmFsdWUgY29tcGFyaXNvbiwgPCwgPD0sID49IGFuZCA+IGNvZXJjZSB0byBhIHByaW1pdGl2ZSB2aWFcbiAgICAvLyBPYmplY3QucHJvdG90eXBlLnZhbHVlT2Y7ID09IGFuZCA9PT0gZG8gbm90LCBzbyBpbiBvcmRlciB0byBiZSBjb25zaXN0ZW50XG4gICAgLy8gd2l0aCBuYXR1cmFsIG9yZGVyIChzdWNoIGFzIGZvciBEYXRlIG9iamVjdHMpLCB3ZSBtdXN0IGRvIHR3byBjb21wYXJlcy5cbiAgICB2YXIgcGl2b3RzRXF1YWwgPSBwaXZvdFZhbHVlMSA8PSBwaXZvdFZhbHVlMiAmJiBwaXZvdFZhbHVlMSA+PSBwaXZvdFZhbHVlMjtcbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcblxuICAgICAgLy8gRGVnZW5lcmF0ZWQgY2FzZSB3aGVyZSB0aGUgcGFydGl0aW9uaW5nIGJlY29tZXMgYSBkdXRjaCBuYXRpb25hbCBmbGFnXG4gICAgICAvLyBwcm9ibGVtLlxuICAgICAgLy9cbiAgICAgIC8vIFsgfCAgPCBwaXZvdCAgfCA9PSBwaXZvdCB8IHVucGFydGl0aW9uZWQgfCA+IHBpdm90ICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgIF4gICAgICAgICAgXiAgICAgICAgICAgICBeICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICBrICAgICAgICAgICBncmVhdCAgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxKSBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QuXG4gICAgICAvLyAgIDIpIGZvciB4IGluIFtsZXNzLCBrWyA6IHggPT0gcGl2b3QuXG4gICAgICAvLyAgIDMpIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90LlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7ICsraykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2UgaWYgKHhrID4gcGl2b3RWYWx1ZTEpIHtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgPD0gcGl2b3QgaW4gdGhlIHJhbmdlIFtrIC0gMSwgZ3JlYXRdIGFuZFxuICAgICAgICAgIC8vIHB1dCBbOmVrOl0gdGhlcmUuIFdlIGtub3cgdGhhdCBzdWNoIGFuIGVsZW1lbnQgbXVzdCBleGlzdDpcbiAgICAgICAgICAvLyBXaGVuIGsgPT0gbGVzcywgdGhlbiBlbDMgKHdoaWNoIGlzIGVxdWFsIHRvIHBpdm90KSBsaWVzIGluIHRoZVxuICAgICAgICAgIC8vIGludGVydmFsLiBPdGhlcndpc2UgYVtrIC0gMV0gPT0gcGl2b3QgYW5kIHRoZSBzZWFyY2ggc3RvcHMgYXQgay0xLlxuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpbiB0aGUgbGF0dGVyIGNhc2UgaW52YXJpYW50IDIgd2lsbCBiZSB2aW9sYXRlZCBmb3IgYVxuICAgICAgICAgIC8vIHNob3J0IGFtb3VudCBvZiB0aW1lLiBUaGUgaW52YXJpYW50IHdpbGwgYmUgcmVzdG9yZWQgd2hlbiB0aGVcbiAgICAgICAgICAvLyBwaXZvdHMgYXJlIHB1dCBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbiB0aGUgd2hpbGUtbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAvLyBOb3RlOiBpZiBncmVhdCA8IGsgdGhlbiB3ZSB3aWxsIGV4aXQgdGhlIG91dGVyIGxvb3AgYW5kIGZpeFxuICAgICAgICAgICAgICAvLyBpbnZhcmlhbnQgMiAod2hpY2ggd2UganVzdCB2aW9sYXRlZCkuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuIDwgcGl2b3QxXG4gICAgICAvLyAgMi4gPj0gcGl2b3QxICYmIDw9IHBpdm90MlxuICAgICAgLy8gIDMuID4gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbIHwgPCBwaXZvdDEgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA+IHBpdm90MiAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8PSB4ICYmIHggPD0gcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDw9IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA+PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTW92ZSBwaXZvdHMgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgLy8gV2Ugc2hydW5rIHRoZSBsaXN0IGZyb20gYm90aCBzaWRlcyAoYVtsZWZ0XSBhbmQgYVtyaWdodF0gaGF2ZVxuICAgIC8vIG1lYW5pbmdsZXNzIHZhbHVlcyBpbiB0aGVtKSBhbmQgbm93IHdlIG1vdmUgZWxlbWVudHMgZnJvbSB0aGUgZmlyc3RcbiAgICAvLyBhbmQgdGhpcmQgcGFydGl0aW9uIGludG8gdGhlc2UgbG9jYXRpb25zIHNvIHRoYXQgd2UgY2FuIHN0b3JlIHRoZVxuICAgIC8vIHBpdm90cy5cbiAgICBhW2xvXSA9IGFbbGVzcyAtIDFdO1xuICAgIGFbbGVzcyAtIDFdID0gcGl2b3QxO1xuICAgIGFbaGkgLSAxXSA9IGFbZ3JlYXQgKyAxXTtcbiAgICBhW2dyZWF0ICsgMV0gPSBwaXZvdDI7XG5cbiAgICAvLyBUaGUgbGlzdCBpcyBub3cgcGFydGl0aW9uZWQgaW50byB0aHJlZSBwYXJ0aXRpb25zOlxuICAgIC8vIFsgPCBwaXZvdDEgICB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgICB8ICA+IHBpdm90MiAgIF1cbiAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuXG4gICAgLy8gUmVjdXJzaXZlIGRlc2NlbnQuIChEb24ndCBpbmNsdWRlIHRoZSBwaXZvdCB2YWx1ZXMuKVxuICAgIHNvcnQoYSwgbG8sIGxlc3MgLSAxKTtcbiAgICBzb3J0KGEsIGdyZWF0ICsgMiwgaGkpO1xuXG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG4gICAgICAvLyBBbGwgZWxlbWVudHMgaW4gdGhlIHNlY29uZCBwYXJ0aXRpb24gYXJlIGVxdWFsIHRvIHRoZSBwaXZvdC4gTm9cbiAgICAgIC8vIG5lZWQgdG8gc29ydCB0aGVtLlxuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlb3J5IGl0IHNob3VsZCBiZSBlbm91Z2ggdG8gY2FsbCBfZG9Tb3J0IHJlY3Vyc2l2ZWx5IG9uIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJ0aXRpb24uXG4gICAgLy8gVGhlIEFuZHJvaWQgc291cmNlIGhvd2V2ZXIgcmVtb3ZlcyB0aGUgcGl2b3QgZWxlbWVudHMgZnJvbSB0aGUgcmVjdXJzaXZlXG4gICAgLy8gY2FsbCBpZiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBpcyB0b28gbGFyZ2UgKG1vcmUgdGhhbiAyLzMgb2YgdGhlIGxpc3QpLlxuICAgIGlmIChsZXNzIDwgaTEgJiYgZ3JlYXQgPiBpNSkge1xuICAgICAgdmFyIGxlc3NWYWx1ZSwgZ3JlYXRWYWx1ZTtcbiAgICAgIHdoaWxlICgobGVzc1ZhbHVlID0gZihhW2xlc3NdKSkgPD0gcGl2b3RWYWx1ZTEgJiYgbGVzc1ZhbHVlID49IHBpdm90VmFsdWUxKSArK2xlc3M7XG4gICAgICB3aGlsZSAoKGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKSkgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikgLS1ncmVhdDtcblxuICAgICAgLy8gQ29weSBwYXN0ZSBvZiB0aGUgcHJldmlvdXMgMy13YXkgcGFydGl0aW9uaW5nIHdpdGggYWRhcHRpb25zLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuID09IHBpdm90MVxuICAgICAgLy8gIDIuID4gcGl2b3QxICYmIDwgcGl2b3QyXG4gICAgICAvLyAgMy4gPT0gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbID09IHBpdm90MSB8ID4gcGl2b3QxICYmIDwgcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA9PSBwaXZvdDIgXVxuICAgICAgLy8gICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXlxuICAgICAgLy8gICAgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXRcbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBbICosIGxlc3NbIDogeCA9PSBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDwgeCAmJiB4IDwgcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgKiBdIDogeCA9PSBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUxICYmIHhrID49IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXNzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUyICYmIHhrID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBoYXMgbm93IGJlZW4gY2xlYXJlZCBvZiBwaXZvdCBlbGVtZW50cyBhbmQgbG9va3NcbiAgICAvLyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID4gcGl2b3QxICYmIDwgcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTb3J0IHRoZSBzZWNvbmQgcGFydGl0aW9uIHVzaW5nIHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gbG9va3MgYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU2ltcGx5IHNvcnQgaXQgYnkgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICByZXR1cm4gc29ydChhLCBsZXNzLCBncmVhdCArIDEpO1xuICB9XG5cbiAgcmV0dXJuIHNvcnQ7XG59XG5cbnZhciBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZCA9IDMyO1xudmFyIGNyb3NzZmlsdGVyX2FycmF5OCA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZDtcblxuaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG4pOyB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gZnVuY3Rpb24oYXJyYXksIHdpZHRoKSB7XG4gICAgdmFyIGNvcHk7XG4gICAgc3dpdGNoICh3aWR0aCkge1xuICAgICAgY2FzZSAxNjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MTYoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkzMihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICAgIH1cbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZChuKSB7XG4gIHZhciBhcnJheSA9IG5ldyBBcnJheShuKSwgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbikgYXJyYXlbaV0gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkKGFycmF5LCBsZW5ndGgpIHtcbiAgdmFyIG4gPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChuIDwgbGVuZ3RoKSBhcnJheVtuKytdID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZChhcnJheSwgd2lkdGgpIHtcbiAgaWYgKHdpZHRoID4gMzIpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIEFuIGFyYml0cmFyaWx5LXdpZGUgYXJyYXkgb2YgYml0bWFza3NcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2JpdGFycmF5KG4pIHtcbiAgdGhpcy5sZW5ndGggPSBuO1xuICB0aGlzLnN1YmFycmF5cyA9IDE7XG4gIHRoaXMud2lkdGggPSA4O1xuICB0aGlzLm1hc2tzID0ge1xuICAgIDA6IDBcbiAgfVxuXG4gIHRoaXNbMF0gPSBjcm9zc2ZpbHRlcl9hcnJheTgobik7XG59XG5cbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5sZW5ndGhlbiA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKHRoaXNbaV0sIG4pO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIFJlc2VydmUgYSBuZXcgYml0IGluZGV4IGluIHRoZSBhcnJheSwgcmV0dXJucyB7b2Zmc2V0LCBvbmV9XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtLCB3LCBvbmUsIGksIGxlbjtcblxuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbSA9IHRoaXMubWFza3NbaV07XG4gICAgdyA9IHRoaXMud2lkdGggLSAoMzIgKiBpKTtcbiAgICBvbmUgPSB+bSAmIC1+bTtcblxuICAgIGlmICh3ID49IDMyICYmICFvbmUpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIGlmICh3IDwgMzIgJiYgKG9uZSAmICgxIDw8IHcpKSkge1xuICAgICAgLy8gd2lkZW4gdGhpcyBzdWJhcnJheVxuICAgICAgdGhpc1tpXSA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4odGhpc1tpXSwgdyA8PD0gMSk7XG4gICAgICB0aGlzLndpZHRoID0gMzIgKiBpICsgdztcbiAgICB9XG5cbiAgICB0aGlzLm1hc2tzW2ldIHw9IG9uZTtcblxuICAgIHJldHVybiB7XG4gICAgICBvZmZzZXQ6IGksXG4gICAgICBvbmU6IG9uZVxuICAgIH07XG4gIH1cblxuICAvLyBhZGQgYSBuZXcgc3ViYXJyYXlcbiAgdGhpc1t0aGlzLnN1YmFycmF5c10gPSBjcm9zc2ZpbHRlcl9hcnJheTgodGhpcy5sZW5ndGgpO1xuICB0aGlzLm1hc2tzW3RoaXMuc3ViYXJyYXlzXSA9IDE7XG4gIHRoaXMud2lkdGggKz0gODtcbiAgcmV0dXJuIHtcbiAgICBvZmZzZXQ6IHRoaXMuc3ViYXJyYXlzKyssXG4gICAgb25lOiAxXG4gIH07XG59O1xuXG4vLyBDb3B5IHJlY29yZCBmcm9tIGluZGV4IHNyYyB0byBpbmRleCBkZXN0XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGRlc3QsIHNyYykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgdGhpc1tpXVtkZXN0XSA9IHRoaXNbaV1bc3JjXTtcbiAgfVxufTtcblxuLy8gVHJ1bmNhdGUgdGhlIGFycmF5IHRvIHRoZSBnaXZlbiBsZW5ndGhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS50cnVuY2F0ZSA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGZvciAodmFyIGogPSB0aGlzLmxlbmd0aCAtIDE7IGogPj0gbjsgai0tKSB7XG4gICAgICB0aGlzW2ldW2pdID0gMDtcbiAgICB9XG4gICAgdGhpc1tpXS5sZW5ndGggPSBuO1xuICB9XG4gIHRoaXMubGVuZ3RoID0gbjtcbn07XG5cbi8vIENoZWNrcyB0aGF0IGFsbCBiaXRzIGZvciB0aGUgZ2l2ZW4gaW5kZXggYXJlIDBcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS56ZXJvID0gZnVuY3Rpb24obikge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwIGV4Y2VwdCBmb3IgcG9zc2libHkgb25lXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVyb0V4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybykge1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGkgPT09IG9mZnNldCA/IHRoaXNbaV1bbl0gJiB6ZXJvIDogdGhpc1tpXVtuXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXhcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCBvbmUpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dICE9IChpID09PSBvZmZzZXQgPyBvbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIENoZWNrcyB0aGF0IG9ubHkgdGhlIHNwZWNpZmllZCBiaXQgaXMgc2V0IGZvciB0aGUgZ2l2ZW4gaW5kZXggZXhjZXB0IGZvciBwb3NzaWJseSBvbmUgb3RoZXJcbmNyb3NzZmlsdGVyX2JpdGFycmF5LnByb3RvdHlwZS5vbmx5RXhjZXB0ID0gZnVuY3Rpb24obiwgb2Zmc2V0LCB6ZXJvLCBvbmx5T2Zmc2V0LCBvbmx5T25lKSB7XG4gIHZhciBtYXNrO1xuICB2YXIgaSwgbGVuO1xuICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnN1YmFycmF5czsgaSA8IGxlbjsgKytpKSB7XG4gICAgbWFzayA9IHRoaXNbaV1bbl07XG4gICAgaWYgKGkgPT09IG9mZnNldClcbiAgICAgIG1hc2sgJj0gemVybztcbiAgICBpZiAobWFzayAhPSAoaSA9PT0gb25seU9mZnNldCA/IG9ubHlPbmUgOiAwKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9maWx0ZXJFeGFjdChiaXNlY3QsIHZhbHVlKSB7XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIHZhbHVlLCAwLCBuKSwgYmlzZWN0LnJpZ2h0KHZhbHVlcywgdmFsdWUsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkge1xuICB2YXIgbWluID0gcmFuZ2VbMF0sXG4gICAgICBtYXggPSByYW5nZVsxXTtcbiAgcmV0dXJuIGZ1bmN0aW9uKHZhbHVlcykge1xuICAgIHZhciBuID0gdmFsdWVzLmxlbmd0aDtcbiAgICByZXR1cm4gW2Jpc2VjdC5sZWZ0KHZhbHVlcywgbWluLCAwLCBuKSwgYmlzZWN0LmxlZnQodmFsdWVzLCBtYXgsIDAsIG4pXTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKHZhbHVlcykge1xuICByZXR1cm4gWzAsIHZhbHVlcy5sZW5ndGhdO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfbnVsbCgpIHtcbiAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl96ZXJvKCkge1xuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudChwKSB7XG4gIHJldHVybiBwICsgMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50KHApIHtcbiAgcmV0dXJuIHAgLSAxO1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQoZikge1xuICByZXR1cm4gZnVuY3Rpb24ocCwgdikge1xuICAgIHJldHVybiBwICsgK2Yodik7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCAtIGYodik7XG4gIH07XG59XG5leHBvcnRzLmNyb3NzZmlsdGVyID0gY3Jvc3NmaWx0ZXI7XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyKCkge1xuICB2YXIgY3Jvc3NmaWx0ZXIgPSB7XG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmVEYXRhLFxuICAgIGRpbWVuc2lvbjogZGltZW5zaW9uLFxuICAgIGdyb3VwQWxsOiBncm91cEFsbCxcbiAgICBzaXplOiBzaXplLFxuICAgIGFsbDogYWxsLFxuICAgIG9uQ2hhbmdlOiBvbkNoYW5nZSxcbiAgfTtcblxuICB2YXIgZGF0YSA9IFtdLCAvLyB0aGUgcmVjb3Jkc1xuICAgICAgbiA9IDAsIC8vIHRoZSBudW1iZXIgb2YgcmVjb3JkczsgZGF0YS5sZW5ndGhcbiAgICAgIGZpbHRlcnMsIC8vIDEgaXMgZmlsdGVyZWQgb3V0XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiB0aGUgZmlsdGVycyBjaGFuZ2VcbiAgICAgIGRhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzID0gW10sIC8vIHdoZW4gZGF0YSBpcyByZW1vdmVkXG4gICAgICBjYWxsYmFja3MgPSBbXTtcblxuICBmaWx0ZXJzID0gbmV3IGNyb3NzZmlsdGVyX2JpdGFycmF5KDApO1xuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyB0byB0aGlzIGNyb3NzZmlsdGVyLlxuICBmdW5jdGlvbiBhZGQobmV3RGF0YSkge1xuICAgIHZhciBuMCA9IG4sXG4gICAgICAgIG4xID0gbmV3RGF0YS5sZW5ndGg7XG5cbiAgICAvLyBJZiB0aGVyZSdzIGFjdHVhbGx5IG5ldyBkYXRhIHRvIGFkZOKAplxuICAgIC8vIE1lcmdlIHRoZSBuZXcgZGF0YSBpbnRvIHRoZSBleGlzdGluZyBkYXRhLlxuICAgIC8vIExlbmd0aGVuIHRoZSBmaWx0ZXIgYml0c2V0IHRvIGhhbmRsZSB0aGUgbmV3IHJlY29yZHMuXG4gICAgLy8gTm90aWZ5IGxpc3RlbmVycyAoZGltZW5zaW9ucyBhbmQgZ3JvdXBzKSB0aGF0IG5ldyBkYXRhIGlzIGF2YWlsYWJsZS5cbiAgICBpZiAobjEpIHtcbiAgICAgIGRhdGEgPSBkYXRhLmNvbmNhdChuZXdEYXRhKTtcbiAgICAgIGZpbHRlcnMubGVuZ3RoZW4obiArPSBuMSk7XG4gICAgICBkYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0RhdGEsIG4wLCBuMSk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdkYXRhQWRkZWQnKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgtMSwgLTEsIFtdLCByZW1vdmVkLCB0cnVlKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVycy5jb3B5KGosIGkpLCBkYXRhW2pdID0gZGF0YVtpXTtcbiAgICAgICAgKytqO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEubGVuZ3RoID0gbiA9IGo7XG4gICAgZmlsdGVycy50cnVuY2F0ZShqKTtcbiAgICB0cmlnZ2VyT25DaGFuZ2UoJ2RhdGFSZW1vdmVkJyk7XG4gIH1cblxuICAvLyBBZGRzIGEgbmV3IGRpbWVuc2lvbiB3aXRoIHRoZSBzcGVjaWZpZWQgdmFsdWUgYWNjZXNzb3IgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIGRpbWVuc2lvbih2YWx1ZSwgaXRlcmFibGUpIHtcbiAgICB2YXIgZGltZW5zaW9uID0ge1xuICAgICAgZmlsdGVyOiBmaWx0ZXIsXG4gICAgICBmaWx0ZXJFeGFjdDogZmlsdGVyRXhhY3QsXG4gICAgICBmaWx0ZXJSYW5nZTogZmlsdGVyUmFuZ2UsXG4gICAgICBmaWx0ZXJGdW5jdGlvbjogZmlsdGVyRnVuY3Rpb24sXG4gICAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICAgIHRvcDogdG9wLFxuICAgICAgYm90dG9tOiBib3R0b20sXG4gICAgICBncm91cDogZ3JvdXAsXG4gICAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgb25lLCAvLyBsb3dlc3QgdW5zZXQgYml0IGFzIG1hc2ssIGUuZy4sIDAwMDAxMDAwXG4gICAgICAgIHplcm8sIC8vIGludmVydGVkIG9uZSwgZS5nLiwgMTExMTAxMTFcbiAgICAgICAgb2Zmc2V0LCAvLyBvZmZzZXQgaW50byB0aGUgZmlsdGVycyBhcnJheXNcbiAgICAgICAgdmFsdWVzLCAvLyBzb3J0ZWQsIGNhY2hlZCBhcnJheVxuICAgICAgICBpbmRleCwgLy8gdmFsdWUgcmFuayDihqYgb2JqZWN0IGlkXG4gICAgICAgIG9sZFZhbHVlcywgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgcHJldmlvdXNseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgb2xkSW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIHByZXZpb3VzbHktYWRkZWQgaW5kZXhcbiAgICAgICAgbmV3VmFsdWVzLCAvLyB0ZW1wb3JhcnkgYXJyYXkgc3RvcmluZyBuZXdseS1hZGRlZCB2YWx1ZXNcbiAgICAgICAgbmV3SW5kZXgsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIGluZGV4XG4gICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQsXG4gICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzLFxuICAgICAgICBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMsXG4gICAgICAgIGl0ZXJhYmxlc0VtcHR5Um93cyxcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydF9ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwLFxuICAgICAgICB0ID0gMDtcblxuICAgIC8vIFVwZGF0aW5nIGEgZGltZW5zaW9uIGlzIGEgdHdvLXN0YWdlIHByb2Nlc3MuIEZpcnN0LCB3ZSBtdXN0IHVwZGF0ZSB0aGVcbiAgICAvLyBhc3NvY2lhdGVkIGZpbHRlcnMgZm9yIHRoZSBuZXdseS1hZGRlZCByZWNvcmRzLiBPbmNlIGFsbCBkaW1lbnNpb25zIGhhdmVcbiAgICAvLyB1cGRhdGVkIHRoZWlyIGZpbHRlcnMsIHRoZSBncm91cHMgYXJlIG5vdGlmaWVkIHRvIHVwZGF0ZS5cbiAgICBkYXRhTGlzdGVuZXJzLnVuc2hpZnQocHJlQWRkKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2gocG9zdEFkZCk7XG5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLnB1c2gocmVtb3ZlRGF0YSk7XG5cbiAgICAvLyBBZGQgYSBuZXcgZGltZW5zaW9uIGluIHRoZSBmaWx0ZXIgYml0bWFwIGFuZCBzdG9yZSB0aGUgb2Zmc2V0IGFuZCBiaXRtYXNrLlxuICAgIHZhciB0bXAgPSBmaWx0ZXJzLmFkZCgpO1xuICAgIG9mZnNldCA9IHRtcC5vZmZzZXQ7XG4gICAgb25lID0gdG1wLm9uZTtcbiAgICB6ZXJvID0gfm9uZTtcblxuICAgIHByZUFkZChkYXRhLCAwLCBuKTtcbiAgICBwb3N0QWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgaW50byB0aGlzIGRpbWVuc2lvbi5cbiAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBmaWx0ZXJzLCB2YWx1ZXMsIGFuZCBpbmRleC5cbiAgICBmdW5jdGlvbiBwcmVBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG5cbiAgICAgIGlmIChpdGVyYWJsZSl7XG4gICAgICAgIC8vIENvdW50IGFsbCB0aGUgdmFsdWVzXG4gICAgICAgIHQgPSAwO1xuICAgICAgICBqID0gMDtcbiAgICAgICAgayA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZm9yKGogPSAwLCBrID0gdmFsdWUobmV3RGF0YVtpXSk7IGogPCBrLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0Kys7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbmV3VmFsdWVzID0gW107XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4Q291bnQgPSBjcm9zc2ZpbHRlcl9yYW5nZShuZXdEYXRhLmxlbmd0aCk7XG4gICAgICAgIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzID0gY3Jvc3NmaWx0ZXJfaW5kZXgodCwxKTtcbiAgICAgICAgaXRlcmFibGVzRW1wdHlSb3dzID0gW107XG4gICAgICAgIHZhciB1bnNvcnRlZEluZGV4ID0gY3Jvc3NmaWx0ZXJfcmFuZ2UodCk7XG5cbiAgICAgICAgZm9yIChsID0gMCwgaSA9IDA7IGkgPCBuZXdEYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgayA9IHZhbHVlKG5ld0RhdGFbaV0pXG4gICAgICAgICAgLy9cbiAgICAgICAgICBpZighay5sZW5ndGgpe1xuICAgICAgICAgICAgbmV3SXRlcmFibGVzSW5kZXhDb3VudFtpXSA9IDA7XG4gICAgICAgICAgICBpdGVyYWJsZXNFbXB0eVJvd3MucHVzaChpKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBuZXdJdGVyYWJsZXNJbmRleENvdW50W2ldID0gay5sZW5ndGhcbiAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgay5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgbmV3VmFsdWVzLnB1c2goa1tqXSk7XG4gICAgICAgICAgICB1bnNvcnRlZEluZGV4W2xdID0gaTtcbiAgICAgICAgICAgIGwrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDcmVhdGUgdGhlIFNvcnQgbWFwIHVzZWQgdG8gc29ydCBib3RoIHRoZSB2YWx1ZXMgYW5kIHRoZSB2YWx1ZVRvRGF0YSBpbmRpY2VzXG4gICAgICAgIHZhciBzb3J0TWFwID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZSh0KSwgMCwgdCk7XG5cbiAgICAgICAgLy8gVXNlIHRoZSBzb3J0TWFwIHRvIHNvcnQgdGhlIG5ld1ZhbHVlc1xuICAgICAgICBuZXdWYWx1ZXMgPSBwZXJtdXRlKG5ld1ZhbHVlcywgc29ydE1hcCk7XG5cblxuICAgICAgICAvLyBVc2UgdGhlIHNvcnRNYXAgdG8gc29ydCB0aGUgdW5zb3J0ZWRJbmRleCBtYXBcbiAgICAgICAgLy8gbmV3SW5kZXggc2hvdWxkIGJlIGEgbWFwIG9mIHNvcnRlZFZhbHVlIC0+IGNyb3NzZmlsdGVyRGF0YVxuICAgICAgICBuZXdJbmRleCA9IHBlcm11dGUodW5zb3J0ZWRJbmRleCwgc29ydE1hcClcblxuICAgICAgfSBlbHNle1xuICAgICAgICAvLyBQZXJtdXRlIG5ldyB2YWx1ZXMgaW50byBuYXR1cmFsIG9yZGVyIHVzaW5nIGEgc3RhbmRhcmQgc29ydGVkIGluZGV4LlxuICAgICAgICBuZXdWYWx1ZXMgPSBuZXdEYXRhLm1hcCh2YWx1ZSk7XG4gICAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgICAgbmV3VmFsdWVzID0gcGVybXV0ZShuZXdWYWx1ZXMsIG5ld0luZGV4KTtcbiAgICAgIH1cblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgbjEgPSB0O1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgbmV3VmFsdWVzIHRvIGRldGVybWluZSB3aGljaCBuZXcgcmVjb3JkcyBhcmUgc2VsZWN0ZWQuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIobmV3VmFsdWVzKSwgbG8xID0gYm91bmRzWzBdLCBoaTEgPSBib3VuZHNbMV07XG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjE7ICsraSkge1xuICAgICAgICAgIGlmICghcmVmaWx0ZXJGdW5jdGlvbihuZXdWYWx1ZXNbaV0sIGkpKSB7XG4gICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bbmV3SW5kZXhbaV0gKyBuMF0gfD0gb25lO1xuICAgICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsbzE7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgICAgaWYoaXRlcmFibGUpIG5ld0l0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gMTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSBoaTE7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgICBpZihpdGVyYWJsZSkgbmV3SXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaV0gPSAxO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoaXMgZGltZW5zaW9uIHByZXZpb3VzbHkgaGFkIG5vIGRhdGEsIHRoZW4gd2UgZG9uJ3QgbmVlZCB0byBkbyB0aGVcbiAgICAgIC8vIG1vcmUgZXhwZW5zaXZlIG1lcmdlIG9wZXJhdGlvbjsgdXNlIHRoZSBuZXcgdmFsdWVzIGFuZCBpbmRleCBhcy1pcy5cbiAgICAgIGlmICghbjApIHtcbiAgICAgICAgdmFsdWVzID0gbmV3VmFsdWVzO1xuICAgICAgICBpbmRleCA9IG5ld0luZGV4O1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0gbmV3SXRlcmFibGVzSW5kZXhDb3VudDtcbiAgICAgICAgaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBuZXdJdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cztcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuXG5cbiAgICAgIG9sZFZhbHVlcyA9IHZhbHVlcyxcbiAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXMgPSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1xuICAgICAgICBpMCA9IDAsXG4gICAgICAgIGkxID0gMDtcblxuICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICBvbGRfbjAgPSBuMFxuICAgICAgICBuMCA9IG9sZFZhbHVlcy5sZW5ndGg7XG4gICAgICAgIG4xID0gdFxuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBpdGVyYWJsZSA/IG5ldyBBcnJheShuMCArIG4xKSA6IG5ldyBBcnJheShuKTtcbiAgICAgIGluZGV4ID0gaXRlcmFibGUgPyBuZXcgQXJyYXkobjAgKyBuMSkgOiBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKTtcbiAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1cyA9IGNyb3NzZmlsdGVyX2luZGV4KG4wICsgbjEsIDEpO1xuXG4gICAgICAvLyBDb25jYXRlbmF0ZSB0aGUgbmV3SXRlcmFibGVzSW5kZXhDb3VudCBvbnRvIHRoZSBvbGQgb25lLlxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgdmFyIG9sZGlpY2xlbmd0aCA9IGl0ZXJhYmxlc0luZGV4Q291bnQubGVuZ3RoO1xuICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50ID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihpdGVyYWJsZXNJbmRleENvdW50LCBuKTtcbiAgICAgICAgZm9yKHZhciBqPTA7IGorb2xkaWljbGVuZ3RoIDwgbjsgaisrKSB7XG4gICAgICAgICAgaXRlcmFibGVzSW5kZXhDb3VudFtqK29sZGlpY2xlbmd0aF0gPSBuZXdJdGVyYWJsZXNJbmRleENvdW50W2pdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1lcmdlIHRoZSBvbGQgYW5kIG5ldyBzb3J0ZWQgdmFsdWVzLCBhbmQgb2xkIGFuZCBuZXcgaW5kZXguXG4gICAgICBmb3IgKGkgPSAwOyBpMCA8IG4wICYmIGkxIDwgbjE7ICsraSkge1xuICAgICAgICBpZiAob2xkVmFsdWVzW2kwXSA8IG5ld1ZhbHVlc1tpMV0pIHtcbiAgICAgICAgICB2YWx1ZXNbaV0gPSBvbGRWYWx1ZXNbaTBdO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKSBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1tpXSA9IG9sZEl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICAgIGluZGV4W2ldID0gbmV3SW5kZXhbaTErK10gKyAoaXRlcmFibGUgPyBvbGRfbjAgOiBuMCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgb2xkIHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMCA8IG4wOyArK2kwLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTBdO1xuICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwXTtcbiAgICAgIH1cblxuICAgICAgLy8gQWRkIGFueSByZW1haW5pbmcgbmV3IHZhbHVlcy5cbiAgICAgIGZvciAoOyBpMSA8IG4xOyArK2kxLCArK2kpIHtcbiAgICAgICAgdmFsdWVzW2ldID0gbmV3VmFsdWVzW2kxXTtcbiAgICAgICAgaWYoaXRlcmFibGUpIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW2ldID0gb2xkSXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIChpdGVyYWJsZSA/IG9sZF9uMCA6IG4wKTtcbiAgICAgIH1cblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIGJvdW5kcyA9IHJlZmlsdGVyKHZhbHVlcyksIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFdoZW4gYWxsIGZpbHRlcnMgaGF2ZSB1cGRhdGVkLCBub3RpZnkgaW5kZXggbGlzdGVuZXJzIG9mIHRoZSBuZXcgdmFsdWVzLlxuICAgIGZ1bmN0aW9uIHBvc3RBZGQobmV3RGF0YSwgbjAsIG4xKSB7XG4gICAgICBpbmRleExpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdWYWx1ZXMsIG5ld0luZGV4LCBuMCwgbjEpOyB9KTtcbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0luZGV4ID0gbnVsbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVEYXRhKHJlSW5kZXgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgazsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhrID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgaWYgKGkgIT09IGopIHZhbHVlc1tqXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgICBpbmRleFtqXSA9IHJlSW5kZXhba107XG4gICAgICAgICAgKytqO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YWx1ZXMubGVuZ3RoID0gajtcbiAgICAgIHdoaWxlIChqIDwgbikgaW5kZXhbaisrXSA9IDA7XG5cbiAgICAgIC8vIEJpc2VjdCBhZ2FpbiB0byByZWNvbXB1dGUgbG8wIGFuZCBoaTAuXG4gICAgICB2YXIgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKTtcbiAgICAgIGxvMCA9IGJvdW5kc1swXSwgaGkwID0gYm91bmRzWzFdO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZXMgdGhlIHNlbGVjdGVkIHZhbHVlcyBiYXNlZCBvbiB0aGUgc3BlY2lmaWVkIGJvdW5kcyBbbG8sIGhpXS5cbiAgICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGlzIHVzZWQgYnkgYWxsIHRoZSBwdWJsaWMgZmlsdGVyIG1ldGhvZHMuXG4gICAgZnVuY3Rpb24gZmlsdGVySW5kZXhCb3VuZHMoYm91bmRzKSB7XG5cbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9LCBib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSBpbmRleC5sZW5ndGgpO1xuICAgICAgICBsbzAgPSBsbzE7XG4gICAgICAgIGhpMCA9IGhpMTtcbiAgICAgICAgcmV0dXJuIGRpbWVuc2lvbjtcbiAgICAgIH1cblxuICAgICAgdmFyIGksXG4gICAgICAgICAgaixcbiAgICAgICAgICBrLFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZCA9IFtdLFxuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkID0gW107XG5cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvMSA+IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzAsIGogPSBNYXRoLm1pbihsbzEsIGhpMCk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgaGkgaW5kZXguXG4gICAgICBpZiAoaGkxID4gaGkwKSB7XG4gICAgICAgIGZvciAoaSA9IE1hdGgubWF4KGxvMSwgaGkwKSwgaiA9IGhpMTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGFkZGVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGhpMSA8IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzAsIGhpMSksIGogPSBoaTA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgIHZhbHVlSW5kZXhSZW1vdmVkLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIC8vIEZsaXAgZmlsdGVycyBub3JtYWxseS5cblxuICAgICAgICBmb3IoaT0wOyBpPGFkZGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bcmVtb3ZlZFtpXV0gXj0gb25lO1xuICAgICAgICB9XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEZvciBpdGVyYWJsZXMsIHdlIG5lZWQgdG8gZmlndXJlIG91dCBpZiB0aGUgcm93IGhhcyBiZWVuIGNvbXBsZXRlbHkgcmVtb3ZlZCB2cyBwYXJ0aWFsbHkgaW5jbHVkZWRcbiAgICAgICAgLy8gT25seSBjb3VudCBhIHJvdyBhcyBhZGRlZCBpZiBpdCBpcyBub3QgYWxyZWFkeSBiZWluZyBhZ2dyZWdhdGVkLiBPbmx5IGNvdW50IGEgcm93XG4gICAgICAgIC8vIGFzIHJlbW92ZWQgaWYgdGhlIGxhc3QgZWxlbWVudCBiZWluZyBhZ2dyZWdhdGVkIGlzIHJlbW92ZWQuXG5cbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dKytcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4QWRkZWRbaV1dID0gMDtcbiAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W2FkZGVkW2ldXSA9PT0gMSkge1xuICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdBZGRlZC5wdXNoKGFkZGVkW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dLS1cbiAgICAgICAgICBpdGVyYWJsZXNJbmRleEZpbHRlclN0YXR1c1t2YWx1ZUluZGV4UmVtb3ZlZFtpXV0gPSAxO1xuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4Q291bnRbcmVtb3ZlZFtpXV0gPT09IDApIHtcbiAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICBuZXdSZW1vdmVkLnB1c2gocmVtb3ZlZFtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYWRkZWQgPSBuZXdBZGRlZDtcbiAgICAgICAgcmVtb3ZlZCA9IG5ld1JlbW92ZWQ7XG5cbiAgICAgICAgLy8gTm93IGhhbmRsZSBlbXB0eSByb3dzLlxuICAgICAgICBpZihib3VuZHNbMF0gPT09IDAgJiYgYm91bmRzWzFdID09PSBpbmRleC5sZW5ndGgpIHtcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKChmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBub3QgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIGFkZFxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBmaWx0ZXIgaW4gcGxhY2UgLSByZW1vdmUgZW1wdHkgcm93cyBpZiBuZWNlc3NhcnlcbiAgICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpdGVyYWJsZXNFbXB0eVJvd3NbaV1dICYgb25lKSkge1xuICAgICAgICAgICAgICAvLyBXYXMgaW4gdGhlIGZpbHRlciwgc28gc2V0IHRoZSBmaWx0ZXIgYW5kIHJlbW92ZVxuICAgICAgICAgICAgICBmaWx0ZXJzW29mZnNldF1ba10gXj0gb25lO1xuICAgICAgICAgICAgICByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxvMCA9IGxvMTtcbiAgICAgIGhpMCA9IGhpMTtcbiAgICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChvbmUsIG9mZnNldCwgYWRkZWQsIHJlbW92ZWQpOyB9KTtcbiAgICAgIHRyaWdnZXJPbkNoYW5nZSgnZmlsdGVyZWQnKTtcbiAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB1c2luZyB0aGUgc3BlY2lmaWVkIHJhbmdlLCB2YWx1ZSwgb3IgbnVsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgbnVsbCwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIGZpbHRlckFsbC5cbiAgICAvLyBJZiB0aGUgcmFuZ2UgaXMgYW4gYXJyYXksIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJSYW5nZS5cbiAgICAvLyBPdGhlcndpc2UsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJFeGFjdC5cbiAgICBmdW5jdGlvbiBmaWx0ZXIocmFuZ2UpIHtcbiAgICAgIHJldHVybiByYW5nZSA9PSBudWxsXG4gICAgICAgICAgPyBmaWx0ZXJBbGwoKSA6IEFycmF5LmlzQXJyYXkocmFuZ2UpXG4gICAgICAgICAgPyBmaWx0ZXJSYW5nZShyYW5nZSkgOiB0eXBlb2YgcmFuZ2UgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICAgID8gZmlsdGVyRnVuY3Rpb24ocmFuZ2UpXG4gICAgICAgICAgOiBmaWx0ZXJFeGFjdChyYW5nZSk7XG4gICAgfVxuXG4gICAgLy8gRmlsdGVycyB0aGlzIGRpbWVuc2lvbiB0byBzZWxlY3QgdGhlIGV4YWN0IHZhbHVlLlxuICAgIGZ1bmN0aW9uIGZpbHRlckV4YWN0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBzcGVjaWZpZWQgcmFuZ2UgW2xvLCBoaV0uXG4gICAgLy8gVGhlIGxvd2VyIGJvdW5kIGlzIGluY2x1c2l2ZSwgYW5kIHRoZSB1cHBlciBib3VuZCBpcyBleGNsdXNpdmUuXG4gICAgZnVuY3Rpb24gZmlsdGVyUmFuZ2UocmFuZ2UpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJSYW5nZShiaXNlY3QsIHJhbmdlKSkodmFsdWVzKSk7XG4gICAgfVxuXG4gICAgLy8gQ2xlYXJzIGFueSBmaWx0ZXJzIG9uIHRoaXMgZGltZW5zaW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckFsbCgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXJJbmRleEJvdW5kcygocmVmaWx0ZXIgPSBjcm9zc2ZpbHRlcl9maWx0ZXJBbGwpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgYW4gYXJiaXRyYXJ5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGZpbHRlckZ1bmN0aW9uKGYpIHtcbiAgICAgIHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsO1xuXG4gICAgICBmaWx0ZXJJbmRleEZ1bmN0aW9uKHJlZmlsdGVyRnVuY3Rpb24gPSBmLCBmYWxzZSk7XG5cbiAgICAgIGxvMCA9IDA7XG4gICAgICBoaTAgPSBuO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZiwgZmlsdGVyQWxsKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIHgsXG4gICAgICAgICAgYWRkZWQgPSBbXSxcbiAgICAgICAgICByZW1vdmVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleEFkZGVkID0gW10sXG4gICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQgPSBbXSxcbiAgICAgICAgICBpbmRleExlbmd0aCA9IGluZGV4Lmxlbmd0aDtcblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbmRleExlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYgKCEoZmlsdGVyc1tvZmZzZXRdW2sgPSBpbmRleFtpXV0gJiBvbmUpIF4gISEoeCA9IGYodmFsdWVzW2ldLCBpKSkpIHtcbiAgICAgICAgICAgIGlmICh4KSBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgICAgZWxzZSByZW1vdmVkLnB1c2goayk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgIGZvcihpPTA7IGkgPCBpbmRleExlbmd0aDsgKytpKSB7XG4gICAgICAgICAgaWYoZih2YWx1ZXNbaV0sIGkpKSB7XG4gICAgICAgICAgICBhZGRlZC5wdXNoKGluZGV4W2ldKTtcbiAgICAgICAgICAgIHZhbHVlSW5kZXhBZGRlZC5wdXNoKGkpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW1vdmVkLnB1c2goaW5kZXhbaV0pO1xuICAgICAgICAgICAgdmFsdWVJbmRleFJlbW92ZWQucHVzaChpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoIWl0ZXJhYmxlKSB7XG4gICAgICAgIGZvcihpPTA7IGk8YWRkZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZihmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dICYgb25lKSBmaWx0ZXJzW29mZnNldF1bYWRkZWRbaV1dICY9IHplcm87XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaT0wOyBpPHJlbW92ZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZighKGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSAmIG9uZSkpIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSB8PSBvbmU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgdmFyIG5ld0FkZGVkID0gW107XG4gICAgICAgIHZhciBuZXdSZW1vdmVkID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhZGRlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIHRoaXMgcGFydGljdWxhciB2YWx1ZSBuZWVkcyB0byBiZSBhZGRlZFxuICAgICAgICAgIGlmKGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPT09IDEpIHtcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4Q291bnRbYWRkZWRbaV1dKytcbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhBZGRlZFtpXV0gPSAwO1xuICAgICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhDb3VudFthZGRlZFtpXV0gPT09IDEpIHtcbiAgICAgICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2FkZGVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICAgIG5ld0FkZGVkLnB1c2goYWRkZWRbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcmVtb3ZlZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIC8vIEZpcnN0IGNoZWNrIHRoaXMgcGFydGljdWxhciB2YWx1ZSBuZWVkcyB0byBiZSByZW1vdmVkXG4gICAgICAgICAgaWYoaXRlcmFibGVzSW5kZXhGaWx0ZXJTdGF0dXNbdmFsdWVJbmRleFJlbW92ZWRbaV1dID09PSAwKSB7XG4gICAgICAgICAgICBpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dLS1cbiAgICAgICAgICAgIGl0ZXJhYmxlc0luZGV4RmlsdGVyU3RhdHVzW3ZhbHVlSW5kZXhSZW1vdmVkW2ldXSA9IDE7XG4gICAgICAgICAgICBpZihpdGVyYWJsZXNJbmRleENvdW50W3JlbW92ZWRbaV1dID09PSAwKSB7XG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtyZW1vdmVkW2ldXSBePSBvbmU7XG4gICAgICAgICAgICAgIG5ld1JlbW92ZWQucHVzaChyZW1vdmVkW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBhZGRlZCA9IG5ld0FkZGVkO1xuICAgICAgICByZW1vdmVkID0gbmV3UmVtb3ZlZDtcblxuICAgICAgICAvLyBOb3cgaGFuZGxlIGVtcHR5IHJvd3MuXG4gICAgICAgIGlmKGZpbHRlckFsbCkge1xuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoKGZpbHRlcnNbb2Zmc2V0XVtrID0gaXRlcmFibGVzRW1wdHlSb3dzW2ldXSAmIG9uZSkpIHtcbiAgICAgICAgICAgICAgLy8gV2FzIG5vdCBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgYWRkXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIGFkZGVkLnB1c2goayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGZpbHRlciBpbiBwbGFjZSAtIHJlbW92ZSBlbXB0eSByb3dzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIShmaWx0ZXJzW29mZnNldF1bayA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXV0gJiBvbmUpKSB7XG4gICAgICAgICAgICAgIC8vIFdhcyBpbiB0aGUgZmlsdGVyLCBzbyBzZXQgdGhlIGZpbHRlciBhbmQgcmVtb3ZlXG4gICAgICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrXSBePSBvbmU7XG4gICAgICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZmlsdGVyTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG9uZSwgb2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCk7IH0pO1xuICAgICAgdHJpZ2dlck9uQ2hhbmdlKCdmaWx0ZXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIHRvcCBLIHNlbGVjdGVkIHJlY29yZHMgYmFzZWQgb24gdGhpcyBkaW1lbnNpb24ncyBvcmRlci5cbiAgICAvLyBOb3RlOiBvYnNlcnZlcyB0aGlzIGRpbWVuc2lvbidzIGZpbHRlciwgdW5saWtlIGdyb3VwIGFuZCBncm91cEFsbC5cbiAgICBmdW5jdGlvbiB0b3Aoaykge1xuICAgICAgdmFyIGFycmF5ID0gW10sXG4gICAgICAgICAgaSA9IGhpMCxcbiAgICAgICAgICBqO1xuXG4gICAgICB3aGlsZSAoLS1pID49IGxvMCAmJiBrID4gMCkge1xuICAgICAgICBpZiAoZmlsdGVycy56ZXJvKGogPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBhcnJheS5wdXNoKGRhdGFbal0pO1xuICAgICAgICAgIC0taztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgIGZvcihpID0gMDsgaSA8IGl0ZXJhYmxlc0VtcHR5Um93cy5sZW5ndGggJiYgayA+IDA7IGkrKykge1xuICAgICAgICAgIC8vIEFkZCBlbXB0eSByb3dzIGF0IHRoZSBlbmRcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGksXG4gICAgICAgICAgajtcblxuICAgICAgaWYoaXRlcmFibGUpIHtcbiAgICAgICAgLy8gQWRkIGVtcHR5IHJvd3MgYXQgdGhlIHRvcFxuICAgICAgICBmb3IoaSA9IDA7IGkgPCBpdGVyYWJsZXNFbXB0eVJvd3MubGVuZ3RoICYmIGsgPiAwOyBpKyspIHtcbiAgICAgICAgICBpZihmaWx0ZXJzLnplcm8oaiA9IGl0ZXJhYmxlc0VtcHR5Um93c1tpXSkpIHtcbiAgICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgICAtLWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGkgPSBsbzA7XG5cbiAgICAgIHdoaWxlIChpIDwgaGkwICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICAgIGkrKztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuICAgIC8vIEFkZHMgYSBuZXcgZ3JvdXAgdG8gdGhpcyBkaW1lbnNpb24sIHVzaW5nIHRoZSBzcGVjaWZpZWQga2V5IGZ1bmN0aW9uLlxuICAgIGZ1bmN0aW9uIGdyb3VwKGtleSkge1xuICAgICAgdmFyIGdyb3VwID0ge1xuICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgYWxsOiBhbGwsXG4gICAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgICByZWR1Y2VDb3VudDogcmVkdWNlQ291bnQsXG4gICAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgICBvcmRlcjogb3JkZXIsXG4gICAgICAgIG9yZGVyTmF0dXJhbDogb3JkZXJOYXR1cmFsLFxuICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgICByZW1vdmU6IGRpc3Bvc2UgLy8gZm9yIGJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICB9O1xuXG4gICAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGdyb3VwIHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBkaW1lbnNpb24gaXMgcmVtb3ZlZC5cbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5wdXNoKGdyb3VwKTtcblxuICAgICAgdmFyIGdyb3VwcywgLy8gYXJyYXkgb2Yge2tleSwgdmFsdWV9XG4gICAgICAgICAgZ3JvdXBJbmRleCwgLy8gb2JqZWN0IGlkIOKGpiBncm91cCBpZFxuICAgICAgICAgIGdyb3VwV2lkdGggPSA4LFxuICAgICAgICAgIGdyb3VwQ2FwYWNpdHkgPSBjcm9zc2ZpbHRlcl9jYXBhY2l0eShncm91cFdpZHRoKSxcbiAgICAgICAgICBrID0gMCwgLy8gY2FyZGluYWxpdHlcbiAgICAgICAgICBzZWxlY3QsXG4gICAgICAgICAgaGVhcCxcbiAgICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICAgIHJlZHVjZUluaXRpYWwsXG4gICAgICAgICAgdXBkYXRlID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGwsXG4gICAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlLFxuICAgICAgICAgIGdyb3VwQWxsID0ga2V5ID09PSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEpIGtleSA9IGNyb3NzZmlsdGVyX2lkZW50aXR5O1xuXG4gICAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgICAgLy8gdGhhdCBpdCBjYW4gdXBkYXRlIHRoZSBhc3NvY2lhdGVkIHJlZHVjZSB2YWx1ZXMuIEl0IG11c3QgYWxzbyBsaXN0ZW4gdG9cbiAgICAgIC8vIHRoZSBwYXJlbnQgZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQsIGFuZCBjb21wdXRlIG5ldyBrZXlzLlxuICAgICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICAgIGluZGV4TGlzdGVuZXJzLnB1c2goYWRkKTtcbiAgICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGUgYW55IGV4aXN0aW5nIGRhdGEgaW50byB0aGUgZ3JvdXBpbmcuXG4gICAgICBhZGQodmFsdWVzLCBpbmRleCwgMCwgbik7XG5cbiAgICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyByZXNwb25zaWJsZSBmb3IgdXBkYXRpbmcgZ3JvdXBzIGFuZCBncm91cEluZGV4LlxuICAgICAgZnVuY3Rpb24gYWRkKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSkge1xuXG4gICAgICAgIGlmKGl0ZXJhYmxlKSB7XG4gICAgICAgICAgbjBvbGQgPSBuMFxuICAgICAgICAgIG4wID0gdmFsdWVzLmxlbmd0aCAtIG5ld1ZhbHVlcy5sZW5ndGhcbiAgICAgICAgICBuMSA9IG5ld1ZhbHVlcy5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgcmVJbmRleCA9IGl0ZXJhYmxlID8gW10gOiBjcm9zc2ZpbHRlcl9pbmRleChrLCBncm91cENhcGFjaXR5KSxcbiAgICAgICAgICAgIGFkZCA9IHJlZHVjZUFkZCxcbiAgICAgICAgICAgIHJlbW92ZSA9IHJlZHVjZVJlbW92ZSxcbiAgICAgICAgICAgIGluaXRpYWwgPSByZWR1Y2VJbml0aWFsLFxuICAgICAgICAgICAgazAgPSBrLCAvLyBvbGQgY2FyZGluYWxpdHlcbiAgICAgICAgICAgIGkwID0gMCwgLy8gaW5kZXggb2Ygb2xkIGdyb3VwXG4gICAgICAgICAgICBpMSA9IDAsIC8vIGluZGV4IG9mIG5ldyByZWNvcmRcbiAgICAgICAgICAgIGosIC8vIG9iamVjdCBpZFxuICAgICAgICAgICAgZzAsIC8vIG9sZCBncm91cFxuICAgICAgICAgICAgeDAsIC8vIG9sZCBrZXlcbiAgICAgICAgICAgIHgxLCAvLyBuZXcga2V5XG4gICAgICAgICAgICBnLCAvLyBncm91cCB0byBhZGRcbiAgICAgICAgICAgIHg7IC8vIGtleSBvZiBncm91cCB0byBhZGRcblxuICAgICAgICAvLyBJZiBhIHJlc2V0IGlzIG5lZWRlZCwgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZXMuXG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgYWRkID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVtb3ZlID0gaW5pdGlhbCA9IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIG5ldyBncm91cHMgKGsgaXMgYSBsb3dlciBib3VuZCkuXG4gICAgICAgIC8vIEFsc28sIG1ha2Ugc3VyZSB0aGF0IGdyb3VwSW5kZXggZXhpc3RzIGFuZCBpcyBsb25nIGVub3VnaC5cbiAgICAgICAgZ3JvdXBzID0gbmV3IEFycmF5KGspLCBrID0gMDtcbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyBncm91cEluZGV4IDogW107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZXtcbiAgICAgICAgICBncm91cEluZGV4ID0gazAgPiAxID8gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbihncm91cEluZGV4LCBuKSA6IGNyb3NzZmlsdGVyX2luZGV4KG4sIGdyb3VwQ2FwYWNpdHkpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBHZXQgdGhlIGZpcnN0IG9sZCBrZXkgKHgwIG9mIGcwKSwgaWYgaXQgZXhpc3RzLlxuICAgICAgICBpZiAoazApIHgwID0gKGcwID0gb2xkR3JvdXBzWzBdKS5rZXk7XG5cbiAgICAgICAgLy8gRmluZCB0aGUgZmlyc3QgbmV3IGtleSAoeDEpLCBza2lwcGluZyBOYU4ga2V5cy5cbiAgICAgICAgd2hpbGUgKGkxIDwgbjEgJiYgISgoeDEgPSBrZXkobmV3VmFsdWVzW2kxXSkpID49IHgxKSkgKytpMTtcblxuICAgICAgICAvLyBXaGlsZSBuZXcga2V5cyByZW1haW7igKZcbiAgICAgICAgd2hpbGUgKGkxIDwgbjEpIHtcblxuICAgICAgICAgIC8vIERldGVybWluZSB0aGUgbGVzc2VyIG9mIHRoZSB0d28gY3VycmVudCBrZXlzOyBuZXcgYW5kIG9sZC5cbiAgICAgICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gb2xkIGtleXMgcmVtYWluaW5nLCB0aGVuIGFsd2F5cyBhZGQgdGhlIG5ldyBrZXkuXG4gICAgICAgICAgaWYgKGcwICYmIHgwIDw9IHgxKSB7XG4gICAgICAgICAgICBnID0gZzAsIHggPSB4MDtcblxuICAgICAgICAgICAgLy8gUmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgICAgIHJlSW5kZXhbaTBdID0gaztcblxuICAgICAgICAgICAgLy8gUmV0cmlldmUgdGhlIG5leHQgb2xkIGtleS5cbiAgICAgICAgICAgIGlmIChnMCA9IG9sZEdyb3Vwc1srK2kwXSkgeDAgPSBnMC5rZXk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGcgPSB7a2V5OiB4MSwgdmFsdWU6IGluaXRpYWwoKX0sIHggPSB4MTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBBZGQgdGhlIGxlc3NlciBncm91cC5cbiAgICAgICAgICBncm91cHNba10gPSBnO1xuXG4gICAgICAgICAgLy8gQWRkIGFueSBzZWxlY3RlZCByZWNvcmRzIGJlbG9uZ2luZyB0byB0aGUgYWRkZWQgZ3JvdXAsIHdoaWxlXG4gICAgICAgICAgLy8gYWR2YW5jaW5nIHRoZSBuZXcga2V5IGFuZCBwb3B1bGF0aW5nIHRoZSBhc3NvY2lhdGVkIGdyb3VwIGluZGV4LlxuXG4gICAgICAgICAgd2hpbGUgKHgxIDw9IHgpIHtcbiAgICAgICAgICAgIGogPSBuZXdJbmRleFtpMV0gKyAoaXRlcmFibGUgPyBuMG9sZCA6IG4wKVxuXG5cbiAgICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgICAgaWYoZ3JvdXBJbmRleFtqXSl7XG4gICAgICAgICAgICAgICAgZ3JvdXBJbmRleFtqXS5wdXNoKGspXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBncm91cEluZGV4W2pdID0gW2tdXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgIGdyb3VwSW5kZXhbal0gPSBrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHdheXMgYWRkIG5ldyB2YWx1ZXMgdG8gZ3JvdXBzLiBPbmx5IHJlbW92ZSB3aGVuIG5vdCBpbiBmaWx0ZXIuXG4gICAgICAgICAgICAvLyBUaGlzIGdpdmVzIGdyb3VwcyBmdWxsIGluZm9ybWF0aW9uIG9uIGRhdGEgbGlmZS1jeWNsZS5cbiAgICAgICAgICAgIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChqLCBvZmZzZXQsIHplcm8pKSBnLnZhbHVlID0gcmVtb3ZlKGcudmFsdWUsIGRhdGFbal0sIGZhbHNlKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoMWFuIGFsbCBuZXcga2V5cy5cbiAgICAgICAgLy8gTm8gaW5jcmVtZW50YWwgcmVkdWNlIGlzIG5lZWRlZDsgdGhlc2UgZ3JvdXBzIGhhdmUgbm8gbmV3IHJlY29yZHMuXG4gICAgICAgIC8vIEFsc28gcmVjb3JkIHRoZSBuZXcgaW5kZXggb2YgdGhlIG9sZCBncm91cC5cbiAgICAgICAgd2hpbGUgKGkwIDwgazApIHtcbiAgICAgICAgICBncm91cHNbcmVJbmRleFtpMF0gPSBrXSA9IG9sZEdyb3Vwc1tpMCsrXTtcbiAgICAgICAgICBncm91cEluY3JlbWVudCgpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBGaWxsIGluIGdhcHMgd2l0aCBlbXB0eSBhcnJheXMgd2hlcmUgdGhlcmUgbWF5IGhhdmUgYmVlbiByb3dzIHdpdGggZW1wdHkgaXRlcmFibGVzXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZ3JvdXBJbmRleC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIWdyb3VwSW5kZXhbaV0pe1xuICAgICAgICAgICAgICBncm91cEluZGV4W2ldID0gW11cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSBhZGRlZCBhbnkgbmV3IGdyb3VwcyBiZWZvcmUgYW55IG9sZCBncm91cHMsXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZ3JvdXAgaW5kZXggb2YgYWxsIHRoZSBvbGQgcmVjb3Jkcy5cbiAgICAgICAgaWYoayA+IGkwKXtcbiAgICAgICAgICBpZihpdGVyYWJsZSl7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gcGVybXV0ZShncm91cEluZGV4LCByZUluZGV4LCB0cnVlKVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNle1xuICAgICAgICAgICAgZm9yIChpMCA9IDA7IGkwIDwgbjA7ICsraTApIHtcbiAgICAgICAgICAgICAgZ3JvdXBJbmRleFtpMF0gPSByZUluZGV4W2dyb3VwSW5kZXhbaTBdXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBNb2RpZnkgdGhlIHVwZGF0ZSBhbmQgcmVzZXQgYmVoYXZpb3IgYmFzZWQgb24gdGhlIGNhcmRpbmFsaXR5LlxuICAgICAgICAvLyBJZiB0aGUgY2FyZGluYWxpdHkgaXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIG9uZSwgdGhlbiB0aGUgZ3JvdXBJbmRleFxuICAgICAgICAvLyBpcyBub3QgbmVlZGVkLiBJZiB0aGUgY2FyZGluYWxpdHkgaXMgemVybywgdGhlbiB0aGVyZSBhcmUgbm8gcmVjb3Jkc1xuICAgICAgICAvLyBhbmQgdGhlcmVmb3JlIG5vIGdyb3VwcyB0byB1cGRhdGUgb3IgcmVzZXQuIE5vdGUgdGhhdCB3ZSBhbHNvIG11c3RcbiAgICAgICAgLy8gY2hhbmdlIHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyIHRvIHBvaW50IHRvIHRoZSBuZXcgbWV0aG9kLlxuICAgICAgICBqID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGsgPiAxKSB7XG4gICAgICAgICAgdXBkYXRlID0gdXBkYXRlTWFueTtcbiAgICAgICAgICByZXNldCA9IHJlc2V0TWFueTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoIWsgJiYgZ3JvdXBBbGwpIHtcbiAgICAgICAgICAgIGsgPSAxO1xuICAgICAgICAgICAgZ3JvdXBzID0gW3trZXk6IG51bGwsIHZhbHVlOiBpbml0aWFsKCl9XTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU9uZTtcbiAgICAgICAgICAgIHJlc2V0ID0gcmVzZXRPbmU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgICByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZpbHRlckxpc3RlbmVyc1tqXSA9IHVwZGF0ZTtcblxuICAgICAgICAvLyBDb3VudCB0aGUgbnVtYmVyIG9mIGFkZGVkIGdyb3VwcyxcbiAgICAgICAgLy8gYW5kIHdpZGVuIHRoZSBncm91cCBpbmRleCBhcyBuZWVkZWQuXG4gICAgICAgIGZ1bmN0aW9uIGdyb3VwSW5jcmVtZW50KCkge1xuICAgICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICAgIGsrK1xuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgrK2sgPT09IGdyb3VwQ2FwYWNpdHkpIHtcbiAgICAgICAgICAgIHJlSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKHJlSW5kZXgsIGdyb3VwV2lkdGggPDw9IDEpO1xuICAgICAgICAgICAgZ3JvdXBJbmRleCA9IGNyb3NzZmlsdGVyX2FycmF5V2lkZW4oZ3JvdXBJbmRleCwgZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgICBncm91cENhcGFjaXR5ID0gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkoZ3JvdXBXaWR0aCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEoKSB7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHZhciBvbGRLID0gayxcbiAgICAgICAgICAgICAgb2xkR3JvdXBzID0gZ3JvdXBzLFxuICAgICAgICAgICAgICBzZWVuR3JvdXBzID0gY3Jvc3NmaWx0ZXJfaW5kZXgob2xkSywgb2xkSyk7XG5cbiAgICAgICAgICAvLyBGaWx0ZXIgb3V0IG5vbi1tYXRjaGVzIGJ5IGNvcHlpbmcgbWF0Y2hpbmcgZ3JvdXAgaW5kZXggZW50cmllcyB0b1xuICAgICAgICAgIC8vIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5LlxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tncm91cEluZGV4W2pdID0gZ3JvdXBJbmRleFtpXV0gPSAxO1xuICAgICAgICAgICAgICArK2o7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUmVhc3NlbWJsZSBncm91cHMgaW5jbHVkaW5nIG9ubHkgdGhvc2UgZ3JvdXBzIHRoYXQgd2VyZSByZWZlcnJlZFxuICAgICAgICAgIC8vIHRvIGJ5IG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMuICBOb3RlIHRoZSBuZXcgZ3JvdXAgaW5kZXggaW5cbiAgICAgICAgICAvLyBzZWVuR3JvdXBzLlxuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb2xkSzsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc2Vlbkdyb3Vwc1tpXSkge1xuICAgICAgICAgICAgICBzZWVuR3JvdXBzW2ldID0gaysrO1xuICAgICAgICAgICAgICBncm91cHMucHVzaChvbGRHcm91cHNbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgICAgLy8gUmVpbmRleCB0aGUgZ3JvdXAgaW5kZXggdXNpbmcgc2Vlbkdyb3VwcyB0byBmaW5kIHRoZSBuZXcgaW5kZXguXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGo7ICsraSkgZ3JvdXBJbmRleFtpXSA9IHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtpXV07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPSBrID4gMVxuICAgICAgICAgICAgICA/IChyZXNldCA9IHJlc2V0TWFueSwgdXBkYXRlID0gdXBkYXRlTWFueSlcbiAgICAgICAgICAgICAgOiBrID09PSAxID8gKHJlc2V0ID0gcmVzZXRPbmUsIHVwZGF0ZSA9IHVwZGF0ZU9uZSlcbiAgICAgICAgICAgICAgOiByZXNldCA9IHVwZGF0ZSA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH0gZWxzZSBpZiAoayA9PT0gMSkge1xuICAgICAgICAgIGlmIChncm91cEFsbCkgcmV0dXJuO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSBpZiAoIWZpbHRlcnMuemVybyhpKSkgcmV0dXJuO1xuICAgICAgICAgIGdyb3VwcyA9IFtdLCBrID0gMDtcbiAgICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKV0gPVxuICAgICAgICAgIHVwZGF0ZSA9IHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgZ3JlYXRlciB0aGFuIDEuXG4gICAgICAvLyBub3RGaWx0ZXIgaW5kaWNhdGVzIGEgY3Jvc3NmaWx0ZXIuYWRkL3JlbW92ZSBvcGVyYXRpb24uXG4gICAgICBmdW5jdGlvbiB1cGRhdGVNYW55KGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG5cbiAgICAgICAgaWYgKChmaWx0ZXJPbmUgPT09IG9uZSAmJiBmaWx0ZXJPZmZzZXQgPT09IG9mZnNldCkgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBrLFxuICAgICAgICAgICAgbixcbiAgICAgICAgICAgIGc7XG5cbiAgICAgICAgaWYoaXRlcmFibGUpe1xuICAgICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2tdLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtrXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXVtqXV07XG4gICAgICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIsIGopO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2tdXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICAvLyBub3RGaWx0ZXIgaW5kaWNhdGVzIGEgY3Jvc3NmaWx0ZXIuYWRkL3JlbW92ZSBvcGVyYXRpb24uXG4gICAgICBmdW5jdGlvbiB1cGRhdGVPbmUoZmlsdGVyT25lLCBmaWx0ZXJPZmZzZXQsIGFkZGVkLCByZW1vdmVkLCBub3RGaWx0ZXIpIHtcbiAgICAgICAgaWYgKChmaWx0ZXJPbmUgPT09IG9uZSAmJiBmaWx0ZXJPZmZzZXQgPT09IG9mZnNldCkgfHwgcmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGssXG4gICAgICAgICAgICBuLFxuICAgICAgICAgICAgZyA9IGdyb3Vwc1swXTtcblxuICAgICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLnplcm9FeGNlcHQoayA9IGFkZGVkW2ldLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHJlbW92ZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoZmlsdGVycy5vbmx5RXhjZXB0KGsgPSByZW1vdmVkW2ldLCBvZmZzZXQsIHplcm8sIGZpbHRlck9mZnNldCwgZmlsdGVyT25lKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgZnVuY3Rpb24gcmVzZXRNYW55KCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGosXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIFJlc2V0IGFsbCBncm91cCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHtcbiAgICAgICAgICBncm91cHNbaV0udmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhZGQgYWxsIHJlY29yZHMgYW5kIHRoZW4gcmVtb3ZlIGZpbHRlcmVkIHJlY29yZHMgc28gdGhhdCByZWR1Y2Vyc1xuICAgICAgICAvLyBjYW4gYnVpbGQgYW4gJ3VuZmlsdGVyZWQnIHZpZXcgZXZlbiBpZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzIGluXG4gICAgICAgIC8vIHBsYWNlIG9uIG90aGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIGlmKGl0ZXJhYmxlKXtcbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgZ3JvdXBJbmRleFtpXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1bal1dO1xuICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUsIGopO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBncm91cEluZGV4W2ldLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldW2pdXTtcbiAgICAgICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlLCBqKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZXMgZnJvbSBzY3JhdGNoLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0T25lKCkge1xuICAgICAgICB2YXIgaSxcbiAgICAgICAgICAgIGcgPSBncm91cHNbMF07XG5cbiAgICAgICAgLy8gUmVzZXQgdGhlIHNpbmdsZXRvbiBncm91cCB2YWx1ZXMuXG4gICAgICAgIGcudmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgICAgLy8gV2UgYWRkIGFsbCByZWNvcmRzIGFuZCB0aGVuIHJlbW92ZSBmaWx0ZXJlZCByZWNvcmRzIHNvIHRoYXQgcmVkdWNlcnNcbiAgICAgICAgLy8gY2FuIGJ1aWxkIGFuICd1bmZpbHRlcmVkJyB2aWV3IGV2ZW4gaWYgdGhlcmUgYXJlIGFscmVhZHkgZmlsdGVycyBpblxuICAgICAgICAvLyBwbGFjZSBvbiBvdGhlciBkaW1lbnNpb25zLlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZUFkZChnLnZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChpLCBvZmZzZXQsIHplcm8pKSB7XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlUmVtb3ZlKGcudmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyB0aGUgYXJyYXkgb2YgZ3JvdXAgdmFsdWVzLCBpbiB0aGUgZGltZW5zaW9uJ3MgbmF0dXJhbCBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXNldCgpLCByZXNldE5lZWRlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdGhlIHRvcCBLIGdyb3VwIHZhbHVlcywgaW4gcmVkdWNlIG9yZGVyLlxuICAgICAgZnVuY3Rpb24gdG9wKGspIHtcbiAgICAgICAgdmFyIHRvcCA9IHNlbGVjdChhbGwoKSwgMCwgZ3JvdXBzLmxlbmd0aCwgayk7XG4gICAgICAgIHJldHVybiBoZWFwLnNvcnQodG9wLCAwLCB0b3AubGVuZ3RoKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAgIC8vIFRoaXMgbWV0aG9kIGxhemlseSByZWNvbXB1dGVzIHRoZSByZWR1Y2UgdmFsdWVzLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZShhZGQsIHJlbW92ZSwgaW5pdGlhbCkge1xuICAgICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgICAgcmVkdWNlSW5pdGlhbCA9IGluaXRpYWw7XG4gICAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQsIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudCwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgICAgZnVuY3Rpb24gcmVkdWNlU3VtKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0cyB0aGUgcmVkdWNlIG9yZGVyLCB1c2luZyB0aGUgc3BlY2lmaWVkIGFjY2Vzc29yLlxuICAgICAgZnVuY3Rpb24gb3JkZXIodmFsdWUpIHtcbiAgICAgICAgc2VsZWN0ID0gaGVhcHNlbGVjdF9ieSh2YWx1ZU9mKTtcbiAgICAgICAgaGVhcCA9IGhlYXBfYnkodmFsdWVPZik7XG4gICAgICAgIGZ1bmN0aW9uIHZhbHVlT2YoZCkgeyByZXR1cm4gdmFsdWUoZC52YWx1ZSk7IH1cbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgbmF0dXJhbCBvcmRlcmluZyBieSByZWR1Y2UgdmFsdWUuXG4gICAgICBmdW5jdGlvbiBvcmRlck5hdHVyYWwoKSB7XG4gICAgICAgIHJldHVybiBvcmRlcihjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGNhcmRpbmFsaXR5IG9mIHRoaXMgZ3JvdXAsIGlycmVzcGVjdGl2ZSBvZiBhbnkgZmlsdGVycy5cbiAgICAgIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgICAgIHJldHVybiBrO1xuICAgICAgfVxuXG4gICAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gaW5kZXhMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgICBpZiAoaSA+PSAwKSBpbmRleExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICAgIGlmIChpID49IDApIHJlbW92ZURhdGFMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZWR1Y2VDb3VudCgpLm9yZGVyTmF0dXJhbCgpO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgZnVuY3Rpb24gZm9yIGdlbmVyYXRpbmcgYSBzaW5nbGV0b24gZ3JvdXAuXG4gICAgZnVuY3Rpb24gZ3JvdXBBbGwoKSB7XG4gICAgICB2YXIgZyA9IGdyb3VwKGNyb3NzZmlsdGVyX251bGwpLCBhbGwgPSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLmFsbDtcbiAgICAgIGRlbGV0ZSBnLnRvcDtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyO1xuICAgICAgZGVsZXRlIGcub3JkZXJOYXR1cmFsO1xuICAgICAgZGVsZXRlIGcuc2l6ZTtcbiAgICAgIGcudmFsdWUgPSBmdW5jdGlvbigpIHsgcmV0dXJuIGFsbCgpWzBdLnZhbHVlOyB9O1xuICAgICAgcmV0dXJuIGc7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGRpbWVuc2lvbiBhbmQgYXNzb2NpYXRlZCBncm91cHMgYW5kIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgZGltZW5zaW9uR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oZ3JvdXApIHsgZ3JvdXAuZGlzcG9zZSgpOyB9KTtcbiAgICAgIHZhciBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHByZUFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YocG9zdEFkZCk7XG4gICAgICBpZiAoaSA+PSAwKSBkYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGkgPSByZW1vdmVEYXRhTGlzdGVuZXJzLmluZGV4T2YocmVtb3ZlRGF0YSk7XG4gICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgIGZpbHRlcnMubWFza3Nbb2Zmc2V0XSAmPSB6ZXJvO1xuICAgICAgcmV0dXJuIGZpbHRlckFsbCgpO1xuICAgIH1cblxuICAgIHJldHVybiBkaW1lbnNpb247XG4gIH1cblxuICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgZ3JvdXBBbGwgb24gYSBkdW1teSBkaW1lbnNpb24uXG4gIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIG9wdGltaXplZCBzaW5jZSBpdCBhbHdheXMgaGFzIGNhcmRpbmFsaXR5IDEuXG4gIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgIHZhciBncm91cCA9IHtcbiAgICAgIHJlZHVjZTogcmVkdWNlLFxuICAgICAgcmVkdWNlQ291bnQ6IHJlZHVjZUNvdW50LFxuICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBkaXNwb3NlOiBkaXNwb3NlLFxuICAgICAgcmVtb3ZlOiBkaXNwb3NlIC8vIGZvciBiYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgIH07XG5cbiAgICB2YXIgcmVkdWNlVmFsdWUsXG4gICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgcmVkdWNlUmVtb3ZlLFxuICAgICAgICByZWR1Y2VJbml0aWFsLFxuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG5cbiAgICAvLyBUaGUgZ3JvdXAgbGlzdGVucyB0byB0aGUgY3Jvc3NmaWx0ZXIgZm9yIHdoZW4gYW55IGRpbWVuc2lvbiBjaGFuZ2VzLCBzb1xuICAgIC8vIHRoYXQgaXQgY2FuIHVwZGF0ZSB0aGUgcmVkdWNlIHZhbHVlLiBJdCBtdXN0IGFsc28gbGlzdGVuIHRvIHRoZSBwYXJlbnRcbiAgICAvLyBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZC5cbiAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChhZGQpO1xuXG4gICAgLy8gRm9yIGNvbnNpc3RlbmN5OyBhY3R1YWxseSBhIG5vLW9wIHNpbmNlIHJlc2V0TmVlZGVkIGlzIHRydWUuXG4gICAgYWRkKGRhdGEsIDAsIG4pO1xuXG4gICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgZnVuY3Rpb24gYWRkKG5ld0RhdGEsIG4wKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgaWYgKHJlc2V0TmVlZGVkKSByZXR1cm47XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSBuMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlZHVjZXMgdGhlIHNwZWNpZmllZCBzZWxlY3RlZCBvciBkZXNlbGVjdGVkIHJlY29yZHMuXG4gICAgZnVuY3Rpb24gdXBkYXRlKGZpbHRlck9uZSwgZmlsdGVyT2Zmc2V0LCBhZGRlZCwgcmVtb3ZlZCwgbm90RmlsdGVyKSB7XG4gICAgICB2YXIgaSxcbiAgICAgICAgICBrLFxuICAgICAgICAgIG47XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBBZGQgdGhlIGFkZGVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhrID0gYWRkZWRbaV0pKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICBpZiAoZmlsdGVycy5vbmx5KGsgPSByZW1vdmVkW2ldLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFJlY29tcHV0ZXMgdGhlIGdyb3VwIHJlZHVjZSB2YWx1ZSBmcm9tIHNjcmF0Y2guXG4gICAgZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICB2YXIgaTtcblxuICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG5cbiAgICAgIC8vIEN5Y2xlIHRocm91Z2ggYWxsIHRoZSB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG5cbiAgICAgICAgLy8gQWRkIGFsbCB2YWx1ZXMgYWxsIHRoZSB0aW1lLlxuICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZUFkZChyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSB2YWx1ZSBpZiBpdCBpcyBmaWx0ZXJlZC5cbiAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHtcbiAgICAgICAgICByZWR1Y2VWYWx1ZSA9IHJlZHVjZVJlbW92ZShyZWR1Y2VWYWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU2V0cyB0aGUgcmVkdWNlIGJlaGF2aW9yIGZvciB0aGlzIGdyb3VwIHRvIHVzZSB0aGUgc3BlY2lmaWVkIGZ1bmN0aW9ucy5cbiAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlLCB3YWl0aW5nIHVudGlsIG5lZWRlZC5cbiAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgIHJlZHVjZUFkZCA9IGFkZDtcbiAgICAgIHJlZHVjZVJlbW92ZSA9IHJlbW92ZTtcbiAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBjb3VudC5cbiAgICBmdW5jdGlvbiByZWR1Y2VDb3VudCgpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIEEgY29udmVuaWVuY2UgbWV0aG9kIGZvciByZWR1Y2luZyBieSBzdW0odmFsdWUpLlxuICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHJlZHVjZShjcm9zc2ZpbHRlcl9yZWR1Y2VBZGQodmFsdWUpLCBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdCh2YWx1ZSksIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgIH1cblxuICAgIC8vIFJldHVybnMgdGhlIGNvbXB1dGVkIHJlZHVjZSB2YWx1ZS5cbiAgICBmdW5jdGlvbiB2YWx1ZSgpIHtcbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiByZWR1Y2VWYWx1ZTtcbiAgICB9XG5cbiAgICAvLyBSZW1vdmVzIHRoaXMgZ3JvdXAgYW5kIGFzc29jaWF0ZWQgZXZlbnQgbGlzdGVuZXJzLlxuICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICB2YXIgaSA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICBpZiAoaSA+PSAwKSBmaWx0ZXJMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihhZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSk7XG4gICAgICByZXR1cm4gZ3JvdXA7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlZHVjZUNvdW50KCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgcmVjb3JkcyBpbiB0aGlzIGNyb3NzZmlsdGVyLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gIGZ1bmN0aW9uIHNpemUoKSB7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSByYXcgcm93IGRhdGEgY29udGFpbmVkIGluIHRoaXMgY3Jvc3NmaWx0ZXJcbiAgZnVuY3Rpb24gYWxsKCl7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cblxuICBmdW5jdGlvbiBvbkNoYW5nZShjYil7XG4gICAgaWYodHlwZW9mIGNiICE9PSAnZnVuY3Rpb24nKXtcbiAgICAgIGNvbnNvbGUud2Fybignb25DaGFuZ2UgY2FsbGJhY2sgcGFyYW1ldGVyIG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2FsbGJhY2tzLnB1c2goY2IpO1xuICAgIHJldHVybiBmdW5jdGlvbigpe1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShjYWxsYmFja3MuaW5kZXhPZihjYiksIDEpO1xuICAgIH07XG4gIH1cblxuICBmdW5jdGlvbiB0cmlnZ2VyT25DaGFuZ2UoZXZlbnROYW1lKXtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgY2FsbGJhY2tzW2ldKGV2ZW50TmFtZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTggOiBtIDwgMHgxMDAwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTE2XG4gICAgICA6IGNyb3NzZmlsdGVyX2FycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0cyB8fCB0aGlzKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vY3Jvc3NmaWx0ZXJcIikuY3Jvc3NmaWx0ZXI7XG4iLCIvKlxyXG4gKiBOYXR1cmFsIFNvcnQgYWxnb3JpdGhtIGZvciBKYXZhc2NyaXB0IC0gVmVyc2lvbiAwLjcgLSBSZWxlYXNlZCB1bmRlciBNSVQgbGljZW5zZVxyXG4gKiBBdXRob3I6IEppbSBQYWxtZXIgKGJhc2VkIG9uIGNodW5raW5nIGlkZWEgZnJvbSBEYXZlIEtvZWxsZSlcclxuICovXHJcbi8qanNoaW50IHVudXNlZDpmYWxzZSAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG5hdHVyYWxTb3J0IChhLCBiKSB7XHJcblx0XCJ1c2Ugc3RyaWN0XCI7XHJcblx0dmFyIHJlID0gLyheKFsrXFwtXT8oPzowfFsxLTldXFxkKikoPzpcXC5cXGQqKT8oPzpbZUVdWytcXC1dP1xcZCspPyk/JHxeMHhbMC05YS1mXSskfFxcZCspL2dpLFxyXG5cdFx0c3JlID0gLyheWyBdKnxbIF0qJCkvZyxcclxuXHRcdGRyZSA9IC8oXihbXFx3IF0rLD9bXFx3IF0rKT9bXFx3IF0rLD9bXFx3IF0rXFxkKzpcXGQrKDpcXGQrKT9bXFx3IF0/fF5cXGR7MSw0fVtcXC9cXC1dXFxkezEsNH1bXFwvXFwtXVxcZHsxLDR9fF5cXHcrLCBcXHcrIFxcZCssIFxcZHs0fSkvLFxyXG5cdFx0aHJlID0gL14weFswLTlhLWZdKyQvaSxcclxuXHRcdG9yZSA9IC9eMC8sXHJcblx0XHRpID0gZnVuY3Rpb24ocykgeyByZXR1cm4gbmF0dXJhbFNvcnQuaW5zZW5zaXRpdmUgJiYgKCcnICsgcykudG9Mb3dlckNhc2UoKSB8fCAnJyArIHM7IH0sXHJcblx0XHQvLyBjb252ZXJ0IGFsbCB0byBzdHJpbmdzIHN0cmlwIHdoaXRlc3BhY2VcclxuXHRcdHggPSBpKGEpLnJlcGxhY2Uoc3JlLCAnJykgfHwgJycsXHJcblx0XHR5ID0gaShiKS5yZXBsYWNlKHNyZSwgJycpIHx8ICcnLFxyXG5cdFx0Ly8gY2h1bmsvdG9rZW5pemVcclxuXHRcdHhOID0geC5yZXBsYWNlKHJlLCAnXFwwJDFcXDAnKS5yZXBsYWNlKC9cXDAkLywnJykucmVwbGFjZSgvXlxcMC8sJycpLnNwbGl0KCdcXDAnKSxcclxuXHRcdHlOID0geS5yZXBsYWNlKHJlLCAnXFwwJDFcXDAnKS5yZXBsYWNlKC9cXDAkLywnJykucmVwbGFjZSgvXlxcMC8sJycpLnNwbGl0KCdcXDAnKSxcclxuXHRcdC8vIG51bWVyaWMsIGhleCBvciBkYXRlIGRldGVjdGlvblxyXG5cdFx0eEQgPSBwYXJzZUludCh4Lm1hdGNoKGhyZSksIDE2KSB8fCAoeE4ubGVuZ3RoICE9PSAxICYmIHgubWF0Y2goZHJlKSAmJiBEYXRlLnBhcnNlKHgpKSxcclxuXHRcdHlEID0gcGFyc2VJbnQoeS5tYXRjaChocmUpLCAxNikgfHwgeEQgJiYgeS5tYXRjaChkcmUpICYmIERhdGUucGFyc2UoeSkgfHwgbnVsbCxcclxuXHRcdG9GeE5jTCwgb0Z5TmNMO1xyXG5cdC8vIGZpcnN0IHRyeSBhbmQgc29ydCBIZXggY29kZXMgb3IgRGF0ZXNcclxuXHRpZiAoeUQpIHtcclxuXHRcdGlmICggeEQgPCB5RCApIHsgcmV0dXJuIC0xOyB9XHJcblx0XHRlbHNlIGlmICggeEQgPiB5RCApIHsgcmV0dXJuIDE7IH1cclxuXHR9XHJcblx0Ly8gbmF0dXJhbCBzb3J0aW5nIHRocm91Z2ggc3BsaXQgbnVtZXJpYyBzdHJpbmdzIGFuZCBkZWZhdWx0IHN0cmluZ3NcclxuXHRmb3IodmFyIGNMb2M9MCwgbnVtUz1NYXRoLm1heCh4Ti5sZW5ndGgsIHlOLmxlbmd0aCk7IGNMb2MgPCBudW1TOyBjTG9jKyspIHtcclxuXHRcdC8vIGZpbmQgZmxvYXRzIG5vdCBzdGFydGluZyB3aXRoICcwJywgc3RyaW5nIG9yIDAgaWYgbm90IGRlZmluZWQgKENsaW50IFByaWVzdClcclxuXHRcdG9GeE5jTCA9ICEoeE5bY0xvY10gfHwgJycpLm1hdGNoKG9yZSkgJiYgcGFyc2VGbG9hdCh4TltjTG9jXSkgfHwgeE5bY0xvY10gfHwgMDtcclxuXHRcdG9GeU5jTCA9ICEoeU5bY0xvY10gfHwgJycpLm1hdGNoKG9yZSkgJiYgcGFyc2VGbG9hdCh5TltjTG9jXSkgfHwgeU5bY0xvY10gfHwgMDtcclxuXHRcdC8vIGhhbmRsZSBudW1lcmljIHZzIHN0cmluZyBjb21wYXJpc29uIC0gbnVtYmVyIDwgc3RyaW5nIC0gKEt5bGUgQWRhbXMpXHJcblx0XHRpZiAoaXNOYU4ob0Z4TmNMKSAhPT0gaXNOYU4ob0Z5TmNMKSkgeyByZXR1cm4gKGlzTmFOKG9GeE5jTCkpID8gMSA6IC0xOyB9XHJcblx0XHQvLyByZWx5IG9uIHN0cmluZyBjb21wYXJpc29uIGlmIGRpZmZlcmVudCB0eXBlcyAtIGkuZS4gJzAyJyA8IDIgIT0gJzAyJyA8ICcyJ1xyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIG9GeE5jTCAhPT0gdHlwZW9mIG9GeU5jTCkge1xyXG5cdFx0XHRvRnhOY0wgKz0gJyc7XHJcblx0XHRcdG9GeU5jTCArPSAnJztcclxuXHRcdH1cclxuXHRcdGlmIChvRnhOY0wgPCBvRnlOY0wpIHsgcmV0dXJuIC0xOyB9XHJcblx0XHRpZiAob0Z4TmNMID4gb0Z5TmNMKSB7IHJldHVybiAxOyB9XHJcblx0fVxyXG5cdHJldHVybiAwO1xyXG59O1xyXG4iLCIvLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuXG4gICAgLy8gUmVxdWlyZUpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG5cbiAgICAvLyBTRVMgKFNlY3VyZSBFY21hU2NyaXB0KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIXNlcy5vaygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXMubWFrZVEgPSBkZWZpbml0aW9uO1xuICAgICAgICB9XG5cbiAgICAvLyA8c2NyaXB0PlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBQcmVmZXIgd2luZG93IG92ZXIgc2VsZiBmb3IgYWRkLW9uIHNjcmlwdHMuIFVzZSBzZWxmIGZvclxuICAgICAgICAvLyBub24td2luZG93ZWQgY29udGV4dHMuXG4gICAgICAgIHZhciBnbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogc2VsZjtcblxuICAgICAgICAvLyBHZXQgdGhlIGB3aW5kb3dgIG9iamVjdCwgc2F2ZSB0aGUgcHJldmlvdXMgUSBnbG9iYWxcbiAgICAgICAgLy8gYW5kIGluaXRpYWxpemUgUSBhcyBhIGdsb2JhbC5cbiAgICAgICAgdmFyIHByZXZpb3VzUSA9IGdsb2JhbC5RO1xuICAgICAgICBnbG9iYWwuUSA9IGRlZmluaXRpb24oKTtcblxuICAgICAgICAvLyBBZGQgYSBub0NvbmZsaWN0IGZ1bmN0aW9uIHNvIFEgY2FuIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgLy8gZ2xvYmFsIG5hbWVzcGFjZS5cbiAgICAgICAgZ2xvYmFsLlEubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdsb2JhbC5RID0gcHJldmlvdXNRO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGVudmlyb25tZW50IHdhcyBub3QgYW50aWNpcGF0ZWQgYnkgUS4gUGxlYXNlIGZpbGUgYSBidWcuXCIpO1xuICAgIH1cblxufSkoZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNTdGFja3MgPSBmYWxzZTtcbnRyeSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzU3RhY2tzID0gISFlLnN0YWNrO1xufVxuXG4vLyBBbGwgY29kZSBhZnRlciB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMgcmVwb3J0ZWRcbi8vIGJ5IFEuXG52YXIgcVN0YXJ0aW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG52YXIgcUZpbGVOYW1lO1xuXG4vLyBzaGltc1xuXG4vLyB1c2VkIGZvciBmYWxsYmFjayBpbiBcImFsbFJlc29sdmVkXCJcbnZhciBub29wID0gZnVuY3Rpb24gKCkge307XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cbnZhciBuZXh0VGljayA9KGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbiAgICB2YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xuICAgIHZhciB0YWlsID0gaGVhZDtcbiAgICB2YXIgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB2YXIgcmVxdWVzdFRpY2sgPSB2b2lkIDA7XG4gICAgdmFyIGlzTm9kZUpTID0gZmFsc2U7XG4gICAgLy8gcXVldWUgZm9yIGxhdGUgdGFza3MsIHVzZWQgYnkgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZ1xuICAgIHZhciBsYXRlclF1ZXVlID0gW107XG5cbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG4gICAgICAgIHZhciB0YXNrLCBkb21haW47XG5cbiAgICAgICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgICAgIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2ssIGRvbWFpbik7XG5cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobGF0ZXJRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhc2sgPSBsYXRlclF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2spO1xuICAgICAgICB9XG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIC8vIHJ1bnMgYSBzaW5nbGUgZnVuY3Rpb24gaW4gdGhlIGFzeW5jIHF1ZXVlXG4gICAgZnVuY3Rpb24gcnVuU2luZ2xlKHRhc2ssIGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgcHJvY2Vzcy50b1N0cmluZygpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgICAgIC8vIEVuc3VyZSBRIGlzIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50LCB3aXRoIGEgYHByb2Nlc3MubmV4dFRpY2tgLlxuICAgICAgICAvLyBUbyBzZWUgdGhyb3VnaCBmYWtlIE5vZGUgZW52aXJvbm1lbnRzOlxuICAgICAgICAvLyAqIE1vY2hhIHRlc3QgcnVubmVyIC0gZXhwb3NlcyBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2BcbiAgICAgICAgLy8gKiBCcm93c2VyaWZ5IC0gZXhwb3NlcyBhIGBwcm9jZXNzLm5leFRpY2tgIGZ1bmN0aW9uIHRoYXQgdXNlc1xuICAgICAgICAvLyAgIGBzZXRUaW1lb3V0YC4gSW4gdGhpcyBjYXNlIGBzZXRJbW1lZGlhdGVgIGlzIHByZWZlcnJlZCBiZWNhdXNlXG4gICAgICAgIC8vICAgIGl0IGlzIGZhc3Rlci4gQnJvd3NlcmlmeSdzIGBwcm9jZXNzLnRvU3RyaW5nKClgIHlpZWxkc1xuICAgICAgICAvLyAgIFwiW29iamVjdCBPYmplY3RdXCIsIHdoaWxlIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50XG4gICAgICAgIC8vICAgYHByb2Nlc3MubmV4dFRpY2soKWAgeWllbGRzIFwiW29iamVjdCBwcm9jZXNzXVwiLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIHJ1bnMgYSB0YXNrIGFmdGVyIGFsbCBvdGhlciB0YXNrcyBoYXZlIGJlZW4gcnVuXG4gICAgLy8gdGhpcyBpcyB1c2VmdWwgZm9yIHVuaGFuZGxlZCByZWplY3Rpb24gdHJhY2tpbmcgdGhhdCBuZWVkcyB0byBoYXBwZW5cbiAgICAvLyBhZnRlciBhbGwgYHRoZW5gZCB0YXNrcyBoYXZlIGJlZW4gcnVuLlxuICAgIG5leHRUaWNrLnJ1bkFmdGVyID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgbGF0ZXJRdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgKiptaWdodCoqIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemUgb2Zcbi8vIHRoZSBtaW5pZmllZCBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KClcbi8vIFNlZSBNYXJrIE1pbGxlcuKAmXMgZXhwbGFuYXRpb24gb2Ygd2hhdCB0aGlzIGRvZXMuXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbnZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbmZ1bmN0aW9uIHVuY3VycnlUaGlzKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIGxvbmcgc3RhY2sgdHJhY2VzXG5cbnZhciBTVEFDS19KVU1QX1NFUEFSQVRPUiA9IFwiRnJvbSBwcmV2aW91cyBldmVudDpcIjtcblxuZnVuY3Rpb24gbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKSB7XG4gICAgLy8gSWYgcG9zc2libGUsIHRyYW5zZm9ybSB0aGUgZXJyb3Igc3RhY2sgdHJhY2UgYnkgcmVtb3ZpbmcgTm9kZSBhbmQgUVxuICAgIC8vIGNydWZ0LCB0aGVuIGNvbmNhdGVuYXRpbmcgd2l0aCB0aGUgc3RhY2sgdHJhY2Ugb2YgYHByb21pc2VgLiBTZWUgIzU3LlxuICAgIGlmIChoYXNTdGFja3MgJiZcbiAgICAgICAgcHJvbWlzZS5zdGFjayAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2sgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2suaW5kZXhPZihTVEFDS19KVU1QX1NFUEFSQVRPUikgPT09IC0xXG4gICAgKSB7XG4gICAgICAgIHZhciBzdGFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcCA9IHByb21pc2U7ICEhcDsgcCA9IHAuc291cmNlKSB7XG4gICAgICAgICAgICBpZiAocC5zdGFjaykge1xuICAgICAgICAgICAgICAgIHN0YWNrcy51bnNoaWZ0KHAuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrcy51bnNoaWZ0KGVycm9yLnN0YWNrKTtcblxuICAgICAgICB2YXIgY29uY2F0ZWRTdGFja3MgPSBzdGFja3Muam9pbihcIlxcblwiICsgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgKyBcIlxcblwiKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBmaWx0ZXJTdGFja1N0cmluZyhjb25jYXRlZFN0YWNrcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJTdGFja1N0cmluZyhzdGFja1N0cmluZykge1xuICAgIHZhciBsaW5lcyA9IHN0YWNrU3RyaW5nLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBkZXNpcmVkTGluZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgICAgaWYgKCFpc0ludGVybmFsRnJhbWUobGluZSkgJiYgIWlzTm9kZUZyYW1lKGxpbmUpICYmIGxpbmUpIHtcbiAgICAgICAgICAgIGRlc2lyZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXNpcmVkTGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gaXNOb2RlRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgcmV0dXJuIHN0YWNrTGluZS5pbmRleE9mKFwiKG1vZHVsZS5qczpcIikgIT09IC0xIHx8XG4gICAgICAgICAgIHN0YWNrTGluZS5pbmRleE9mKFwiKG5vZGUuanM6XCIpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSkge1xuICAgIC8vIE5hbWVkIGZ1bmN0aW9uczogXCJhdCBmdW5jdGlvbk5hbWUgKGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyKVwiXG4gICAgLy8gSW4gSUUxMCBmdW5jdGlvbiBuYW1lIGNhbiBoYXZlIHNwYWNlcyAoXCJBbm9ueW1vdXMgZnVuY3Rpb25cIikgT19vXG4gICAgdmFyIGF0dGVtcHQxID0gL2F0IC4rIFxcKCguKyk6KFxcZCspOig/OlxcZCspXFwpJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0MSkge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQxWzFdLCBOdW1iZXIoYXR0ZW1wdDFbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb25zOiBcImF0IGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDIgPSAvYXQgKFteIF0rKTooXFxkKyk6KD86XFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQyKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDJbMV0sIE51bWJlcihhdHRlbXB0MlsyXSldO1xuICAgIH1cblxuICAgIC8vIEZpcmVmb3ggc3R5bGU6IFwiZnVuY3Rpb25AZmlsZW5hbWU6bGluZU51bWJlciBvciBAZmlsZW5hbWU6bGluZU51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQzID0gLy4qQCguKyk6KFxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mykge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQzWzFdLCBOdW1iZXIoYXR0ZW1wdDNbMl0pXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxGcmFtZShzdGFja0xpbmUpIHtcbiAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSk7XG5cbiAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgIHZhciBsaW5lTnVtYmVyID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuXG4gICAgcmV0dXJuIGZpbGVOYW1lID09PSBxRmlsZU5hbWUgJiZcbiAgICAgICAgbGluZU51bWJlciA+PSBxU3RhcnRpbmdMaW5lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPD0gcUVuZGluZ0xpbmU7XG59XG5cbi8vIGRpc2NvdmVyIG93biBmaWxlIG5hbWUgYW5kIGxpbmUgbnVtYmVyIHJhbmdlIGZvciBmaWx0ZXJpbmcgc3RhY2tcbi8vIHRyYWNlc1xuZnVuY3Rpb24gY2FwdHVyZUxpbmUoKSB7XG4gICAgaWYgKCFoYXNTdGFja3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdmFyIGZpcnN0TGluZSA9IGxpbmVzWzBdLmluZGV4T2YoXCJAXCIpID4gMCA/IGxpbmVzWzFdIDogbGluZXNbMl07XG4gICAgICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoZmlyc3RMaW5lKTtcbiAgICAgICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHFGaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShjYWxsYmFjaywgbmFtZSwgYWx0ZXJuYXRpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLCB1c2UgXCIgKyBhbHRlcm5hdGl2ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgXCIgaW5zdGVhZC5cIiwgbmV3IEVycm9yKFwiXCIpLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLy8gZW5kIG9mIHNoaW1zXG4vLyBiZWdpbm5pbmcgb2YgcmVhbCB3b3JrXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbHJlYWR5IGEgUHJvbWlzZSwgcmV0dXJuIGl0IGRpcmVjdGx5LiAgVGhpcyBlbmFibGVzXG4gICAgLy8gdGhlIHJlc29sdmUgZnVuY3Rpb24gdG8gYm90aCBiZSB1c2VkIHRvIGNyZWF0ZWQgcmVmZXJlbmNlcyBmcm9tIG9iamVjdHMsXG4gICAgLy8gYnV0IHRvIHRvbGVyYWJseSBjb2VyY2Ugbm9uLXByb21pc2VzIHRvIHByb21pc2VzLlxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8vIGVuYWJsZSBsb25nIHN0YWNrcyBpZiBRX0RFQlVHIGlzIHNldFxuaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUV9ERUJVRykge1xuICAgIFEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZWFyZXJWYWx1ZSA9IG5lYXJlcihyZXNvbHZlZFByb21pc2UpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKG5lYXJlclZhbHVlKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmVhcmVyVmFsdWU7IC8vIHNob3J0ZW4gY2hhaW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVyVmFsdWU7XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXRlOiBcInBlbmRpbmdcIiB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICBpZiAoUS5sb25nU3RhY2tTdXBwb3J0ICYmIGhhc1N0YWNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IHRyeSB0byB1c2UgYEVycm9yLmNhcHR1cmVTdGFja1RyYWNlYCBvciB0cmFuc2ZlciB0aGVcbiAgICAgICAgICAgIC8vIGFjY2Vzc29yIGFyb3VuZDsgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtzIGFzIHBlciBHSC0xMTEuIEp1c3RcbiAgICAgICAgICAgIC8vIHJlaWZ5IHRoZSBzdGFjayB0cmFjZSBhcyBhIHN0cmluZyBBU0FQLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEF0IHRoZSBzYW1lIHRpbWUsIGN1dCBvZmYgdGhlIGZpcnN0IGxpbmU7IGl0J3MgYWx3YXlzIGp1c3RcbiAgICAgICAgICAgIC8vIFwiW29iamVjdCBQcm9taXNlXVxcblwiLCBhcyBwZXIgdGhlIGB0b1N0cmluZ2AuXG4gICAgICAgICAgICBwcm9taXNlLnN0YWNrID0gZS5zdGFjay5zdWJzdHJpbmcoZS5zdGFjay5pbmRleE9mKFwiXFxuXCIpICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiB3ZSBkbyB0aGUgY2hlY2tzIGZvciBgcmVzb2x2ZWRQcm9taXNlYCBpbiBlYWNoIG1ldGhvZCwgaW5zdGVhZCBvZlxuICAgIC8vIGNvbnNvbGlkYXRpbmcgdGhlbSBpbnRvIGBiZWNvbWVgLCBzaW5jZSBvdGhlcndpc2Ugd2UnZCBjcmVhdGUgbmV3XG4gICAgLy8gcHJvbWlzZXMgd2l0aCB0aGUgbGluZXMgYGJlY29tZSh3aGF0ZXZlcih2YWx1ZSkpYC4gU2VlIGUuZy4gR0gtMjUyLlxuXG4gICAgZnVuY3Rpb24gYmVjb21lKG5ld1Byb21pc2UpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmV3UHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5zb3VyY2UgPSBuZXdQcm9taXNlO1xuXG4gICAgICAgIGFycmF5X3JlZHVjZShtZXNzYWdlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgc2V0dGxlZC5cbiAqIEBwYXJhbSBhbnN3ZXJzIHtBcnJheVtBbnkqXX0gcHJvbWlzZXMgdG8gcmFjZVxuICogQHJldHVybnMge0FueSp9IHRoZSBmaXJzdCBwcm9taXNlIHRvIGJlIHNldHRsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyUCkge1xuICAgICAgICAvLyAgICAgUShhbnN3ZXJQKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBVc2UgdGhpcyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFuc3dlclBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBRKGFuc3dlclBzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKFEucmFjZSk7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBQcm9taXNlIHdpdGggYSBwcm9taXNlIGRlc2NyaXB0b3Igb2JqZWN0IGFuZCBvcHRpb25hbCBmYWxsYmFja1xuICogZnVuY3Rpb24uICBUaGUgZGVzY3JpcHRvciBjb250YWlucyBtZXRob2RzIGxpa2Ugd2hlbihyZWplY3RlZCksIGdldChuYW1lKSxcbiAqIHNldChuYW1lLCB2YWx1ZSksIHBvc3QobmFtZSwgYXJncyksIGFuZCBkZWxldGUobmFtZSksIHdoaWNoIGFsbFxuICogcmV0dXJuIGVpdGhlciBhIHZhbHVlLCBhIHByb21pc2UgZm9yIGEgdmFsdWUsIG9yIGEgcmVqZWN0aW9uLiAgVGhlIGZhbGxiYWNrXG4gKiBhY2NlcHRzIHRoZSBvcGVyYXRpb24gbmFtZSwgYSByZXNvbHZlciwgYW5kIGFueSBmdXJ0aGVyIGFyZ3VtZW50cyB0aGF0IHdvdWxkXG4gKiBoYXZlIGJlZW4gZm9yd2FyZGVkIHRvIHRoZSBhcHByb3ByaWF0ZSBtZXRob2QgYWJvdmUgaGFkIGEgbWV0aG9kIGJlZW5cbiAqIHByb3ZpZGVkIHdpdGggdGhlIHByb3BlciBuYW1lLiAgVGhlIEFQSSBtYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IHRoZSBuYXR1cmVcbiAqIG9mIHRoZSByZXR1cm5lZCBvYmplY3QsIGFwYXJ0IGZyb20gdGhhdCBpdCBpcyB1c2FibGUgd2hlcmVldmVyIHByb21pc2VzIGFyZVxuICogYm91Z2h0IGFuZCBzb2xkLlxuICovXG5RLm1ha2VQcm9taXNlID0gUHJvbWlzZTtcbmZ1bmN0aW9uIFByb21pc2UoZGVzY3JpcHRvciwgZmFsbGJhY2ssIGluc3BlY3QpIHtcbiAgICBpZiAoZmFsbGJhY2sgPT09IHZvaWQgMCkge1xuICAgICAgICBmYWxsYmFjayA9IGZ1bmN0aW9uIChvcCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJQcm9taXNlIGRvZXMgbm90IHN1cHBvcnQgb3BlcmF0aW9uOiBcIiArIG9wXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGluc3BlY3QgPT09IHZvaWQgMCkge1xuICAgICAgICBpbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtzdGF0ZTogXCJ1bmtub3duXCJ9O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgYXJncykge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3Jbb3BdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZGVzY3JpcHRvcltvcF0uYXBwbHkocHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrLmNhbGwocHJvbWlzZSwgb3AsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gaW5zcGVjdDtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkIGB2YWx1ZU9mYCBhbmQgYGV4Y2VwdGlvbmAgc3VwcG9ydFxuICAgIGlmIChpbnNwZWN0KSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgcHJvbWlzZS5leGNlcHRpb24gPSBpbnNwZWN0ZWQucmVhc29uO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicGVuZGluZ1wiIHx8XG4gICAgICAgICAgICAgICAgaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZV1cIjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBkb25lID0gZmFsc2U7ICAgLy8gZW5zdXJlIHRoZSB1bnRydXN0ZWQgcHJvbWlzZSBtYWtlcyBhdCBtb3N0IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBjYWxsIHRvIG9uZSBvZiB0aGUgY2FsbGJhY2tzXG5cbiAgICBmdW5jdGlvbiBfZnVsZmlsbGVkKHZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiID8gZnVsZmlsbGVkKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWplY3RlZChleGNlcHRpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXhjZXB0aW9uLCBzZWxmKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkKGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChuZXdFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ld0V4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wcm9ncmVzc2VkKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvZ3Jlc3NlZCA9PT0gXCJmdW5jdGlvblwiID8gcHJvZ3Jlc3NlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9mdWxmaWxsZWQodmFsdWUpKTtcbiAgICAgICAgfSwgXCJ3aGVuXCIsIFtmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9yZWplY3RlZChleGNlcHRpb24pKTtcbiAgICAgICAgfV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUHJvZ3Jlc3MgcHJvcGFnYXRvciBuZWVkIHRvIGJlIGF0dGFjaGVkIGluIHRoZSBjdXJyZW50IHRpY2suXG4gICAgc2VsZi5wcm9taXNlRGlzcGF0Y2godm9pZCAwLCBcIndoZW5cIiwgW3ZvaWQgMCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZTtcbiAgICAgICAgdmFyIHRocmV3ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXdWYWx1ZSA9IF9wcm9ncmVzc2VkKHZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyZXcgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhyZXcpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeShuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblEudGFwID0gZnVuY3Rpb24gKHByb21pc2UsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGFwKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogV29ya3MgYWxtb3N0IGxpa2UgXCJmaW5hbGx5XCIsIGJ1dCBub3QgY2FsbGVkIGZvciByZWplY3Rpb25zLlxuICogT3JpZ2luYWwgcmVzb2x1dGlvbiB2YWx1ZSBpcyBwYXNzZWQgdGhyb3VnaCBjYWxsYmFjayB1bmFmZmVjdGVkLlxuICogQ2FsbGJhY2sgbWF5IHJldHVybiBhIHByb21pc2UgdGhhdCB3aWxsIGJlIGF3YWl0ZWQgZm9yLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtRLlByb21pc2V9XG4gKiBAZXhhbXBsZVxuICogZG9Tb21ldGhpbmcoKVxuICogICAudGhlbiguLi4pXG4gKiAgIC50YXAoY29uc29sZS5sb2cpXG4gKiAgIC50aGVuKC4uLik7XG4gKi9cblByb21pc2UucHJvdG90eXBlLnRhcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwodmFsdWUpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIG9ic2VydmVyIG9uIGEgcHJvbWlzZS5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICpcbiAqIDEuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gKiAyLiB0aGF0IGVpdGhlciB0aGUgZnVsZmlsbGVkIGNhbGxiYWNrIG9yIHRoZSByZWplY3RlZCBjYWxsYmFjayB3aWxsIGJlXG4gKiAgICBjYWxsZWQsIGJ1dCBub3QgYm90aC5cbiAqIDMuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIG5vdCBiZSBjYWxsZWQgaW4gdGhpcyB0dXJuLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSAgICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSB0byBvYnNlcnZlXG4gKiBAcGFyYW0gZnVsZmlsbGVkICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiBAcGFyYW0gcmVqZWN0ZWQgICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgcmVqZWN0aW9uIGV4Y2VwdGlvblxuICogQHBhcmFtIHByb2dyZXNzZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgaW52b2tlZCBjYWxsYmFja1xuICovXG5RLndoZW4gPSB3aGVuO1xuZnVuY3Rpb24gd2hlbih2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsdWU7IH0pO1xufTtcblxuUS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uIChwcm9taXNlLCB2YWx1ZSkge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IHJlYXNvbjsgfSk7XG59O1xuXG5RLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlamVjdChyZWFzb24pO1xufTtcblxuLyoqXG4gKiBJZiBhbiBvYmplY3QgaXMgbm90IGEgcHJvbWlzZSwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUuXG4gKiBJZiBhIHByb21pc2UgaXMgcmVqZWN0ZWQsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlIHRvby5cbiAqIElmIGl04oCZcyBhIGZ1bGZpbGxlZCBwcm9taXNlLCB0aGUgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmVhcmVyLlxuICogSWYgaXTigJlzIGEgZGVmZXJyZWQgcHJvbWlzZSBhbmQgdGhlIGRlZmVycmVkIGhhcyBiZWVuIHJlc29sdmVkLCB0aGVcbiAqIHJlc29sdXRpb24gaXMgXCJuZWFyZXJcIi5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIG1vc3QgcmVzb2x2ZWQgKG5lYXJlc3QpIGZvcm0gb2YgdGhlIG9iamVjdFxuICovXG5cbi8vIFhYWCBzaG91bGQgd2UgcmUtZG8gdGhpcz9cblEubmVhcmVyID0gbmVhcmVyO1xuZnVuY3Rpb24gbmVhcmVyKHZhbHVlKSB7XG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IHZhbHVlLmluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcHJvbWlzZS5cbiAqIE90aGVyd2lzZSBpdCBpcyBhIGZ1bGZpbGxlZCB2YWx1ZS5cbiAqL1xuUS5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFByb21pc2U7XG59XG5cblEuaXNQcm9taXNlQWxpa2UgPSBpc1Byb21pc2VBbGlrZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZUFsaWtlKG9iamVjdCkge1xuICAgIHJldHVybiBpc09iamVjdChvYmplY3QpICYmIHR5cGVvZiBvYmplY3QudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHBlbmRpbmcgcHJvbWlzZSwgbWVhbmluZyBub3RcbiAqIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cbiAqL1xuUS5pc1BlbmRpbmcgPSBpc1BlbmRpbmc7XG5mdW5jdGlvbiBpc1BlbmRpbmcob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgdmFsdWUgb3IgZnVsZmlsbGVkXG4gKiBwcm9taXNlLlxuICovXG5RLmlzRnVsZmlsbGVkID0gaXNGdWxmaWxsZWQ7XG5mdW5jdGlvbiBpc0Z1bGZpbGxlZChvYmplY3QpIHtcbiAgICByZXR1cm4gIWlzUHJvbWlzZShvYmplY3QpIHx8IG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqL1xuUS5pc1JlamVjdGVkID0gaXNSZWplY3RlZDtcbmZ1bmN0aW9uIGlzUmVqZWN0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn07XG5cbi8vLy8gQkVHSU4gVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vLyBUaGlzIHByb21pc2UgbGlicmFyeSBjb25zdW1lcyBleGNlcHRpb25zIHRocm93biBpbiBoYW5kbGVycyBzbyB0aGV5IGNhbiBiZVxuLy8gaGFuZGxlZCBieSBhIHN1YnNlcXVlbnQgcHJvbWlzZS4gIFRoZSBleGNlcHRpb25zIGdldCBhZGRlZCB0byB0aGlzIGFycmF5IHdoZW5cbi8vIHRoZXkgYXJlIGNyZWF0ZWQsIGFuZCByZW1vdmVkIHdoZW4gdGhleSBhcmUgaGFuZGxlZC4gIE5vdGUgdGhhdCBpbiBFUzYgb3Jcbi8vIHNoaW1tZWQgZW52aXJvbm1lbnRzLCB0aGlzIHdvdWxkIG5hdHVyYWxseSBiZSBhIGBTZXRgLlxudmFyIHVuaGFuZGxlZFJlYXNvbnMgPSBbXTtcbnZhciB1bmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcblxuZnVuY3Rpb24gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCkge1xuICAgIHVuaGFuZGxlZFJlYXNvbnMubGVuZ3RoID0gMDtcbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLmxlbmd0aCA9IDA7XG5cbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJhY2tSZWplY3Rpb24ocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICBpZiAocmVhc29uICYmIHR5cGVvZiByZWFzb24uc3RhY2sgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKHJlYXNvbi5zdGFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKFwiKG5vIHN0YWNrKSBcIiArIHJlYXNvbik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bnRyYWNrUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGF0ID0gYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICBpZiAoYXQgIT09IC0xKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhdFJlcG9ydCA9IGFycmF5X2luZGV4T2YocmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICBpZiAoYXRSZXBvcnQgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW1pdChcInJlamVjdGlvbkhhbmRsZWRcIiwgdW5oYW5kbGVkUmVhc29uc1thdF0sIHByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0UmVwb3J0LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc3AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzcCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFuIG9iamVjdCBzdWNoIHRoYXQgaXQgd2lsbCBuZXZlciBiZVxuICogdHJhbnNmZXJyZWQgYXdheSBmcm9tIHRoaXMgcHJvY2VzcyBvdmVyIGFueSBwcm9taXNlXG4gKiBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBwcm9taXNlIGEgd3JhcHBpbmcgb2YgdGhhdCBvYmplY3QgdGhhdFxuICogYWRkaXRpb25hbGx5IHJlc3BvbmRzIHRvIHRoZSBcImlzRGVmXCIgbWVzc2FnZVxuICogd2l0aG91dCBhIHJlamVjdGlvbi5cbiAqL1xuUS5tYXN0ZXIgPSBtYXN0ZXI7XG5mdW5jdGlvbiBtYXN0ZXIob2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcImlzRGVmXCI6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2sob3AsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFEob2JqZWN0KS5pbnNwZWN0KCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogU3ByZWFkcyB0aGUgdmFsdWVzIG9mIGEgcHJvbWlzZWQgYXJyYXkgb2YgYXJndW1lbnRzIGludG8gdGhlXG4gKiBmdWxmaWxsbWVudCBjYWxsYmFjay5cbiAqIEBwYXJhbSBmdWxmaWxsZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB2YXJpYWRpYyBhcmd1bWVudHMgZnJvbSB0aGVcbiAqIHByb21pc2VkIGFycmF5XG4gKiBAcGFyYW0gcmVqZWN0ZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB0aGUgZXhjZXB0aW9uIGlmIHRoZSBwcm9taXNlXG4gKiBpcyByZWplY3RlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvciB0aHJvd24gZXhjZXB0aW9uIG9mXG4gKiBlaXRoZXIgY2FsbGJhY2suXG4gKi9cblEuc3ByZWFkID0gc3ByZWFkO1xuZnVuY3Rpb24gc3ByZWFkKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnNwcmVhZChmdWxmaWxsZWQsIHJlamVjdGVkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS50aGVuKGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgYXJyYXkpO1xuICAgIH0sIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogVGhlIGFzeW5jIGZ1bmN0aW9uIGlzIGEgZGVjb3JhdG9yIGZvciBnZW5lcmF0b3IgZnVuY3Rpb25zLCB0dXJuaW5nXG4gKiB0aGVtIGludG8gYXN5bmNocm9ub3VzIGdlbmVyYXRvcnMuICBBbHRob3VnaCBnZW5lcmF0b3JzIGFyZSBvbmx5IHBhcnRcbiAqIG9mIHRoZSBuZXdlc3QgRUNNQVNjcmlwdCA2IGRyYWZ0cywgdGhpcyBjb2RlIGRvZXMgbm90IGNhdXNlIHN5bnRheFxuICogZXJyb3JzIGluIG9sZGVyIGVuZ2luZXMuICBUaGlzIGNvZGUgc2hvdWxkIGNvbnRpbnVlIHRvIHdvcmsgYW5kIHdpbGxcbiAqIGluIGZhY3QgaW1wcm92ZSBvdmVyIHRpbWUgYXMgdGhlIGxhbmd1YWdlIGltcHJvdmVzLlxuICpcbiAqIEVTNiBnZW5lcmF0b3JzIGFyZSBjdXJyZW50bHkgcGFydCBvZiBWOCB2ZXJzaW9uIDMuMTkgd2l0aCB0aGVcbiAqIC0taGFybW9ueS1nZW5lcmF0b3JzIHJ1bnRpbWUgZmxhZyBlbmFibGVkLiAgU3BpZGVyTW9ua2V5IGhhcyBoYWQgdGhlbVxuICogZm9yIGxvbmdlciwgYnV0IHVuZGVyIGFuIG9sZGVyIFB5dGhvbi1pbnNwaXJlZCBmb3JtLiAgVGhpcyBmdW5jdGlvblxuICogd29ya3Mgb24gYm90aCBraW5kcyBvZiBnZW5lcmF0b3JzLlxuICpcbiAqIERlY29yYXRlcyBhIGdlbmVyYXRvciBmdW5jdGlvbiBzdWNoIHRoYXQ6XG4gKiAgLSBpdCBtYXkgeWllbGQgcHJvbWlzZXNcbiAqICAtIGV4ZWN1dGlvbiB3aWxsIGNvbnRpbnVlIHdoZW4gdGhhdCBwcm9taXNlIGlzIGZ1bGZpbGxlZFxuICogIC0gdGhlIHZhbHVlIG9mIHRoZSB5aWVsZCBleHByZXNzaW9uIHdpbGwgYmUgdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogIC0gaXQgcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgKHdoZW4gdGhlIGdlbmVyYXRvclxuICogICAgc3RvcHMgaXRlcmF0aW5nKVxuICogIC0gdGhlIGRlY29yYXRlZCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICogICAgb2YgdGhlIGdlbmVyYXRvciBvciB0aGUgZmlyc3QgcmVqZWN0ZWQgcHJvbWlzZSBhbW9uZyB0aG9zZVxuICogICAgeWllbGRlZC5cbiAqICAtIGlmIGFuIGVycm9yIGlzIHRocm93biBpbiB0aGUgZ2VuZXJhdG9yLCBpdCBwcm9wYWdhdGVzIHRocm91Z2hcbiAqICAgIGV2ZXJ5IGZvbGxvd2luZyB5aWVsZCB1bnRpbCBpdCBpcyBjYXVnaHQsIG9yIHVudGlsIGl0IGVzY2FwZXNcbiAqICAgIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gYWx0b2dldGhlciwgYW5kIGlzIHRyYW5zbGF0ZWQgaW50byBhXG4gKiAgICByZWplY3Rpb24gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IHRoZSBkZWNvcmF0ZWQgZ2VuZXJhdG9yLlxuICovXG5RLmFzeW5jID0gYXN5bmM7XG5mdW5jdGlvbiBhc3luYyhtYWtlR2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwic2VuZFwiLCBhcmcgaXMgYSB2YWx1ZVxuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJ0aHJvd1wiLCBhcmcgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlcih2ZXJiLCBhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgICAgIC8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4gICAgICAgICAgICAvLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuICAgICAgICAgICAgLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbiAgICAgICAgICAgIC8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbiAgICAgICAgICAgIC8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuICAgICAgICAgICAgLy8gdGhpcyBibG9jay5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBTdG9wSXRlcmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gRVM2IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNwaWRlck1vbmtleSBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIGNhc2Ugd2hlbiBTTSBkb2VzIEVTNiBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBRKGV4Y2VwdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IG1ha2VHZW5lcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcIm5leHRcIik7XG4gICAgICAgIHZhciBlcnJiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcInRocm93XCIpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFRoZSBzcGF3biBmdW5jdGlvbiBpcyBhIHNtYWxsIHdyYXBwZXIgYXJvdW5kIGFzeW5jIHRoYXQgaW1tZWRpYXRlbHlcbiAqIGNhbGxzIHRoZSBnZW5lcmF0b3IgYW5kIGFsc28gZW5kcyB0aGUgcHJvbWlzZSBjaGFpbiwgc28gdGhhdCBhbnlcbiAqIHVuaGFuZGxlZCBlcnJvcnMgYXJlIHRocm93biBpbnN0ZWFkIG9mIGZvcndhcmRlZCB0byB0aGUgZXJyb3JcbiAqIGhhbmRsZXIuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2UgaXQncyBleHRyZW1lbHkgY29tbW9uIHRvIHJ1blxuICogZ2VuZXJhdG9ycyBhdCB0aGUgdG9wLWxldmVsIHRvIHdvcmsgd2l0aCBsaWJyYXJpZXMuXG4gKi9cblEuc3Bhd24gPSBzcGF3bjtcbmZ1bmN0aW9uIHNwYXduKG1ha2VHZW5lcmF0b3IpIHtcbiAgICBRLmRvbmUoUS5hc3luYyhtYWtlR2VuZXJhdG9yKSgpKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGludGVyZmFjZSBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG4vKipcbiAqIFRocm93cyBhIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB0byBzdG9wIGFuIGFzeW5jaHJvbm91cyBnZW5lcmF0b3IuXG4gKlxuICogVGhpcyBpbnRlcmZhY2UgaXMgYSBzdG9wLWdhcCBtZWFzdXJlIHRvIHN1cHBvcnQgZ2VuZXJhdG9yIHJldHVyblxuICogdmFsdWVzIGluIG9sZGVyIEZpcmVmb3gvU3BpZGVyTW9ua2V5LiAgSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEVTNlxuICogZ2VuZXJhdG9ycyBsaWtlIENocm9taXVtIDI5LCBqdXN0IHVzZSBcInJldHVyblwiIGluIHlvdXIgZ2VuZXJhdG9yXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSByZXR1cm4gdmFsdWUgZm9yIHRoZSBzdXJyb3VuZGluZyBnZW5lcmF0b3JcbiAqIEB0aHJvd3MgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHdpdGggdGhlIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqIC8vIEVTNiBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiogKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICByZXR1cm4gZm9vICsgYmFyO1xuICogfSlcbiAqIC8vIE9sZGVyIFNwaWRlck1vbmtleSBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIFEucmV0dXJuKGZvbyArIGJhcik7XG4gKiB9KVxuICovXG5RW1wicmV0dXJuXCJdID0gX3JldHVybjtcbmZ1bmN0aW9uIF9yZXR1cm4odmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgUVJldHVyblZhbHVlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJvbWlzZWQgZnVuY3Rpb24gZGVjb3JhdG9yIGVuc3VyZXMgdGhhdCBhbnkgcHJvbWlzZSBhcmd1bWVudHNcbiAqIGFyZSBzZXR0bGVkIGFuZCBwYXNzZWQgYXMgdmFsdWVzIChgdGhpc2AgaXMgYWxzbyBzZXR0bGVkIGFuZCBwYXNzZWRcbiAqIGFzIGEgdmFsdWUpLiAgSXQgd2lsbCBhbHNvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgYSBmdW5jdGlvbiBpc1xuICogYWx3YXlzIGEgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFkZCA9IFEucHJvbWlzZWQoZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICByZXR1cm4gYSArIGI7XG4gKiB9KTtcbiAqIGFkZChRKGEpLCBRKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChvcCwgYXJncyk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKG9wLCBhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK3BlbmRpbmdDb3VudDtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSBvZiBhbiBhcnJheS4gUHJpb3IgcmVqZWN0ZWQgcHJvbWlzZXMgYXJlXG4gKiBpZ25vcmVkLiAgUmVqZWN0cyBvbmx5IGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgb3IgcHJvbWlzZXMgZm9yIHZhbHVlc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSxcbiAqIG9yIGEgcmVqZWN0ZWQgcHJvbWlzZSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICovXG5RLmFueSA9IGFueTtcblxuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZXNbaW5kZXhdO1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIHdoZW4ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZChyZXN1bHQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblJlamVjdGVkKCkge1xuICAgICAgICAgICAgcGVuZGluZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDYW4ndCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgZnJvbSBhbnkgcHJvbWlzZSwgYWxsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9taXNlcyB3ZXJlIHJlamVjdGVkLlwiXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHtcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbnkodGhpcyk7XG59O1xuXG4vKipcbiAqIFdhaXRzIGZvciBhbGwgcHJvbWlzZXMgdG8gYmUgc2V0dGxlZCwgZWl0aGVyIGZ1bGZpbGxlZCBvclxuICogcmVqZWN0ZWQuICBUaGlzIGlzIGRpc3RpbmN0IGZyb20gYGFsbGAgc2luY2UgdGhhdCB3b3VsZCBzdG9wXG4gKiB3YWl0aW5nIGF0IHRoZSBmaXJzdCByZWplY3Rpb24uICBUaGUgcHJvbWlzZSByZXR1cm5lZCBieVxuICogYGFsbFJlc29sdmVkYCB3aWxsIG5ldmVyIGJlIHJlamVjdGVkLlxuICogQHBhcmFtIHByb21pc2VzIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgKG9yIGFuIGFycmF5KSBvZiBwcm9taXNlc1xuICogKG9yIHZhbHVlcylcbiAqIEByZXR1cm4gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiBwcm9taXNlc1xuICovXG5RLmFsbFJlc29sdmVkID0gZGVwcmVjYXRlKGFsbFJlc29sdmVkLCBcImFsbFJlc29sdmVkXCIsIFwiYWxsU2V0dGxlZFwiKTtcbmZ1bmN0aW9uIGFsbFJlc29sdmVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICBwcm9taXNlcyA9IGFycmF5X21hcChwcm9taXNlcywgUSk7XG4gICAgICAgIHJldHVybiB3aGVuKGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2hlbihwcm9taXNlLCBub29wLCBub29wKTtcbiAgICAgICAgfSkpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZXM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsUmVzb2x2ZWQodGhpcyk7XG59O1xuXG4vKipcbiAqIEBzZWUgUHJvbWlzZSNhbGxTZXR0bGVkXG4gKi9cblEuYWxsU2V0dGxlZCA9IGFsbFNldHRsZWQ7XG5mdW5jdGlvbiBhbGxTZXR0bGVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZXMpLmFsbFNldHRsZWQoKTtcbn1cblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlaXIgc3RhdGVzIChhc1xuICogcmV0dXJuZWQgYnkgYGluc3BlY3RgKSB3aGVuIHRoZXkgaGF2ZSBhbGwgc2V0dGxlZC5cbiAqIEBwYXJhbSB7QXJyYXlbQW55Kl19IHZhbHVlcyBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyB7QXJyYXlbU3RhdGVdfSBhbiBhcnJheSBvZiBzdGF0ZXMgZm9yIHRoZSByZXNwZWN0aXZlIHZhbHVlcy5cbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUuYWxsU2V0dGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICByZXR1cm4gYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBRKHByb21pc2UpO1xuICAgICAgICAgICAgZnVuY3Rpb24gcmVnYXJkbGVzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKHJlZ2FyZGxlc3MsIHJlZ2FyZGxlc3MpO1xuICAgICAgICB9KSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhcHR1cmVzIHRoZSBmYWlsdXJlIG9mIGEgcHJvbWlzZSwgZ2l2aW5nIGFuIG9wb3J0dW5pdHkgdG8gcmVjb3ZlclxuICogd2l0aCBhIGNhbGxiYWNrLiAgSWYgdGhlIGdpdmVuIHByb21pc2UgaXMgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAqIHByb21pc2UgaXMgZnVsZmlsbGVkLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGZ1bGZpbGwgdGhlIHJldHVybmVkIHByb21pc2UgaWYgdGhlXG4gKiBnaXZlbiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGNhbGxiYWNrXG4gKi9cblEuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBdHRhY2hlcyBhIGxpc3RlbmVyIHRoYXQgY2FuIHJlc3BvbmQgdG8gcHJvZ3Jlc3Mgbm90aWZpY2F0aW9ucyBmcm9tIGFcbiAqIHByb21pc2UncyBvcmlnaW5hdGluZyBkZWZlcnJlZC4gVGhpcyBsaXN0ZW5lciByZWNlaXZlcyB0aGUgZXhhY3QgYXJndW1lbnRzXG4gKiBwYXNzZWQgdG8gYGBkZWZlcnJlZC5ub3RpZnlgYC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byByZWNlaXZlIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJucyB0aGUgZ2l2ZW4gcHJvbWlzZSwgdW5jaGFuZ2VkXG4gKi9cblEucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbmZ1bmN0aW9uIHByb2dyZXNzKG9iamVjdCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gb2JzZXJ2ZSB0aGUgc2V0dGxpbmcgb2YgYSBwcm9taXNlLFxuICogcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBwcm9taXNlIGlzIGZ1bGZpbGxlZCBvciByZWplY3RlZC4gIEZvcndhcmRzXG4gKiB0aGUgcmVzb2x1dGlvbiB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aGVuIHRoZSBjYWxsYmFjayBpcyBkb25lLlxuICogVGhlIGNhbGxiYWNrIGNhbiByZXR1cm4gYSBwcm9taXNlIHRvIGRlZmVyIGNvbXBsZXRpb24uXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIG9ic2VydmUgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuXG4gKiBwcm9taXNlLCB0YWtlcyBubyBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIHdoZW5cbiAqIGBgZmluYGAgaXMgZG9uZS5cbiAqL1xuUS5maW4gPSAvLyBYWFggbGVnYWN5XG5RW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KVtcImZpbmFsbHlcIl0oY2FsbGJhY2spO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmluID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUT0RPIGF0dGVtcHQgdG8gcmVjeWNsZSB0aGUgcmVqZWN0aW9uIHdpdGggXCJ0aGlzXCIuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogVGVybWluYXRlcyBhIGNoYWluIG9mIHByb21pc2VzLCBmb3JjaW5nIHJlamVjdGlvbnMgdG8gYmVcbiAqIHRocm93biBhcyBleGNlcHRpb25zLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGF0IHRoZSBlbmQgb2YgYSBjaGFpbiBvZiBwcm9taXNlc1xuICogQHJldHVybnMgbm90aGluZ1xuICovXG5RLmRvbmUgPSBmdW5jdGlvbiAob2JqZWN0LCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZG9uZShmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgdmFyIG9uVW5oYW5kbGVkRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgLy8gZm9yd2FyZCB0byBhIGZ1dHVyZSB0dXJuIHNvIHRoYXQgYGB3aGVuYGBcbiAgICAgICAgLy8gZG9lcyBub3QgY2F0Y2ggaXQgYW5kIHR1cm4gaXQgaW50byBhIHJlamVjdGlvbi5cbiAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtBbnkqfSBjdXN0b20gZXJyb3IgbWVzc2FnZSBvciBFcnJvciBvYmplY3QgKG9wdGlvbmFsKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpZiBpdCBpc1xuICogZnVsZmlsbGVkIGJlZm9yZSB0aGUgdGltZW91dCwgb3RoZXJ3aXNlIHJlamVjdGVkLlxuICovXG5RLnRpbWVvdXQgPSBmdW5jdGlvbiAob2JqZWN0LCBtcywgZXJyb3IpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIGVycm9yKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIGVycm9yKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghZXJyb3IgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvciB8fCBcIlRpbWVkIG91dCBhZnRlciBcIiArIG1zICsgXCIgbXNcIik7XG4gICAgICAgICAgICBlcnJvci5jb2RlID0gXCJFVElNRURPVVRcIjtcbiAgICAgICAgfVxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgIH0sIG1zKTtcblxuICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgIH0sIGRlZmVycmVkLm5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBnaXZlbiB2YWx1ZSAob3IgcHJvbWlzZWQgdmFsdWUpLCBzb21lXG4gKiBtaWxsaXNlY29uZHMgYWZ0ZXIgaXQgcmVzb2x2ZWQuIFBhc3NlcyByZWplY3Rpb25zIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGFmdGVyIG1pbGxpc2Vjb25kc1xuICogdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZS5cbiAqIElmIHRoZSBnaXZlbiBwcm9taXNlIHJlamVjdHMsIHRoYXQgaXMgcGFzc2VkIGltbWVkaWF0ZWx5LlxuICovXG5RLmRlbGF5ID0gZnVuY3Rpb24gKG9iamVjdCwgdGltZW91dCkge1xuICAgIGlmICh0aW1lb3V0ID09PSB2b2lkIDApIHtcbiAgICAgICAgdGltZW91dCA9IG9iamVjdDtcbiAgICAgICAgb2JqZWN0ID0gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4gUShvYmplY3QpLmRlbGF5KHRpbWVvdXQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgYXMgYW4gYXJyYXksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZhcHBseShGUy5yZWFkRmlsZSwgW19fZmlsZW5hbWVdKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmFwcGx5ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBpbmRpdmlkdWFsbHksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mY2FsbChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSlcbiAqIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiB9KVxuICpcbiAqL1xuUS5uZmNhbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFdyYXBzIGEgTm9kZUpTIGNvbnRpbnVhdGlvbiBwYXNzaW5nIGZ1bmN0aW9uIGFuZCByZXR1cm5zIGFuIGVxdWl2YWxlbnRcbiAqIHZlcnNpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mYmluZChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSkoXCJ1dGYtOFwiKVxuICogLnRoZW4oY29uc29sZS5sb2cpXG4gKiAuZG9uZSgpXG4gKi9cblEubmZiaW5kID1cblEuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgUShjYWxsYmFjaykuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmJpbmQgPVxuUHJvbWlzZS5wcm90b3R5cGUuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5kZW5vZGVpZnkuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cblEubmJpbmQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpc3AsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgUShib3VuZCkuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uYmluZCA9IGZ1bmN0aW9uICgvKnRoaXNwLCAuLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMCk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLm5iaW5kLmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2sgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEubnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ucG9zdChuYW1lLCBhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUubnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MgfHwgW10pO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjaywgZm9yd2FyZGluZyB0aGUgZ2l2ZW4gdmFyaWFkaWMgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWRcbiAqIGNhbGxiYWNrIGFyZ3VtZW50LlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIC4uLmFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrIHdpbGxcbiAqIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5RLm5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblByb21pc2UucHJvdG90eXBlLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblByb21pc2UucHJvdG90eXBlLm5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBJZiBhIGZ1bmN0aW9uIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBib3RoIE5vZGUgY29udGludWF0aW9uLXBhc3Npbmctc3R5bGUgYW5kXG4gKiBwcm9taXNlLXJldHVybmluZy1zdHlsZSwgaXQgY2FuIGVuZCBpdHMgaW50ZXJuYWwgcHJvbWlzZSBjaGFpbiB3aXRoXG4gKiBgbm9kZWlmeShub2RlYmFjaylgLCBmb3J3YXJkaW5nIHRoZSBvcHRpb25hbCBub2RlYmFjayBhcmd1bWVudC4gIElmIHRoZSB1c2VyXG4gKiBlbGVjdHMgdG8gdXNlIGEgbm9kZWJhY2ssIHRoZSByZXN1bHQgd2lsbCBiZSBzZW50IHRoZXJlLiAgSWYgdGhleSBkbyBub3RcbiAqIHBhc3MgYSBub2RlYmFjaywgdGhleSB3aWxsIHJlY2VpdmUgdGhlIHJlc3VsdCBwcm9taXNlLlxuICogQHBhcmFtIG9iamVjdCBhIHJlc3VsdCAob3IgYSBwcm9taXNlIGZvciBhIHJlc3VsdClcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5vZGViYWNrIGEgTm9kZS5qcy1zdHlsZSBjYWxsYmFja1xuICogQHJldHVybnMgZWl0aGVyIHRoZSBwcm9taXNlIG9yIG5vdGhpbmdcbiAqL1xuUS5ub2RlaWZ5ID0gbm9kZWlmeTtcbmZ1bmN0aW9uIG5vZGVpZnkob2JqZWN0LCBub2RlYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdCkubm9kZWlmeShub2RlYmFjayk7XG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAobm9kZWJhY2spIHtcbiAgICBpZiAobm9kZWJhY2spIHtcbiAgICAgICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cblEubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlEubm9Db25mbGljdCBvbmx5IHdvcmtzIHdoZW4gUSBpcyB1c2VkIGFzIGEgZ2xvYmFsXCIpO1xufTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG5cbnJldHVybiBRO1xuXG59KTtcbiIsIihmdW5jdGlvbihleHBvcnRzKXtcbmNyb3NzZmlsdGVyLnZlcnNpb24gPSBcIjIuMC4wLWFscGhhLjAzXCI7XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9pZGVudGl0eShkKSB7XG4gIHJldHVybiBkO1xufVxuY3Jvc3NmaWx0ZXIucGVybXV0ZSA9IHBlcm11dGU7XG5cbmZ1bmN0aW9uIHBlcm11dGUoYXJyYXksIGluZGV4KSB7XG4gIGZvciAodmFyIGkgPSAwLCBuID0gaW5kZXgubGVuZ3RoLCBjb3B5ID0gbmV3IEFycmF5KG4pOyBpIDwgbjsgKytpKSB7XG4gICAgY29weVtpXSA9IGFycmF5W2luZGV4W2ldXTtcbiAgfVxuICByZXR1cm4gY29weTtcbn1cbnZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QgPSBiaXNlY3RfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5iaXNlY3QuYnkgPSBiaXNlY3RfYnk7XG5cbmZ1bmN0aW9uIGJpc2VjdF9ieShmKSB7XG5cbiAgLy8gTG9jYXRlIHRoZSBpbnNlcnRpb24gcG9pbnQgZm9yIHggaW4gYSB0byBtYWludGFpbiBzb3J0ZWQgb3JkZXIuIFRoZVxuICAvLyBhcmd1bWVudHMgbG8gYW5kIGhpIG1heSBiZSB1c2VkIHRvIHNwZWNpZnkgYSBzdWJzZXQgb2YgdGhlIGFycmF5IHdoaWNoXG4gIC8vIHNob3VsZCBiZSBjb25zaWRlcmVkOyBieSBkZWZhdWx0IHRoZSBlbnRpcmUgYXJyYXkgaXMgdXNlZC4gSWYgeCBpcyBhbHJlYWR5XG4gIC8vIHByZXNlbnQgaW4gYSwgdGhlIGluc2VydGlvbiBwb2ludCB3aWxsIGJlIGJlZm9yZSAodG8gdGhlIGxlZnQgb2YpIGFueVxuICAvLyBleGlzdGluZyBlbnRyaWVzLiBUaGUgcmV0dXJuIHZhbHVlIGlzIHN1aXRhYmxlIGZvciB1c2UgYXMgdGhlIGZpcnN0XG4gIC8vIGFyZ3VtZW50IHRvIGBhcnJheS5zcGxpY2VgIGFzc3VtaW5nIHRoYXQgYSBpcyBhbHJlYWR5IHNvcnRlZC5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGEgaW50byB0d28gaGFsdmVzIHNvXG4gIC8vIHRoYXQgYWxsIHYgPCB4IGZvciB2IGluIGFbbG86aV0gZm9yIHRoZSBsZWZ0IHNpZGUgYW5kIGFsbCB2ID49IHggZm9yIHYgaW5cbiAgLy8gYVtpOmhpXSBmb3IgdGhlIHJpZ2h0IHNpZGUuXG4gIGZ1bmN0aW9uIGJpc2VjdExlZnQoYSwgeCwgbG8sIGhpKSB7XG4gICAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICAgIHZhciBtaWQgPSBsbyArIGhpID4+PiAxO1xuICAgICAgaWYgKGYoYVttaWRdKSA8IHgpIGxvID0gbWlkICsgMTtcbiAgICAgIGVsc2UgaGkgPSBtaWQ7XG4gICAgfVxuICAgIHJldHVybiBsbztcbiAgfVxuXG4gIC8vIFNpbWlsYXIgdG8gYmlzZWN0TGVmdCwgYnV0IHJldHVybnMgYW4gaW5zZXJ0aW9uIHBvaW50IHdoaWNoIGNvbWVzIGFmdGVyICh0b1xuICAvLyB0aGUgcmlnaHQgb2YpIGFueSBleGlzdGluZyBlbnRyaWVzIG9mIHggaW4gYS5cbiAgLy9cbiAgLy8gVGhlIHJldHVybmVkIGluc2VydGlvbiBwb2ludCBpIHBhcnRpdGlvbnMgdGhlIGFycmF5IGludG8gdHdvIGhhbHZlcyBzbyB0aGF0XG4gIC8vIGFsbCB2IDw9IHggZm9yIHYgaW4gYVtsbzppXSBmb3IgdGhlIGxlZnQgc2lkZSBhbmQgYWxsIHYgPiB4IGZvciB2IGluXG4gIC8vIGFbaTpoaV0gZm9yIHRoZSByaWdodCBzaWRlLlxuICBmdW5jdGlvbiBiaXNlY3RSaWdodChhLCB4LCBsbywgaGkpIHtcbiAgICB3aGlsZSAobG8gPCBoaSkge1xuICAgICAgdmFyIG1pZCA9IGxvICsgaGkgPj4+IDE7XG4gICAgICBpZiAoeCA8IGYoYVttaWRdKSkgaGkgPSBtaWQ7XG4gICAgICBlbHNlIGxvID0gbWlkICsgMTtcbiAgICB9XG4gICAgcmV0dXJuIGxvO1xuICB9XG5cbiAgYmlzZWN0UmlnaHQucmlnaHQgPSBiaXNlY3RSaWdodDtcbiAgYmlzZWN0UmlnaHQubGVmdCA9IGJpc2VjdExlZnQ7XG4gIHJldHVybiBiaXNlY3RSaWdodDtcbn1cbnZhciBoZWFwID0gY3Jvc3NmaWx0ZXIuaGVhcCA9IGhlYXBfYnkoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuXG5oZWFwLmJ5ID0gaGVhcF9ieTtcblxuZnVuY3Rpb24gaGVhcF9ieShmKSB7XG5cbiAgLy8gQnVpbGRzIGEgYmluYXJ5IGhlYXAgd2l0aGluIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0uIFRoZSBoZWFwIGhhcyB0aGVcbiAgLy8gcHJvcGVydHkgc3VjaCB0aGF0IHRoZSBwYXJlbnQgYVtsbytpXSBpcyBhbHdheXMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGl0c1xuICAvLyB0d28gY2hpbGRyZW46IGFbbG8rMippKzFdIGFuZCBhW2xvKzIqaSsyXS5cbiAgZnVuY3Rpb24gaGVhcChhLCBsbywgaGkpIHtcbiAgICB2YXIgbiA9IGhpIC0gbG8sXG4gICAgICAgIGkgPSAobiA+Pj4gMSkgKyAxO1xuICAgIHdoaWxlICgtLWkgPiAwKSBzaWZ0KGEsIGksIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNvcnRzIHRoZSBzcGVjaWZpZWQgYXJyYXkgYVtsbzpoaV0gaW4gZGVzY2VuZGluZyBvcmRlciwgYXNzdW1pbmcgaXQgaXNcbiAgLy8gYWxyZWFkeSBhIGhlYXAuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgdmFyIG4gPSBoaSAtIGxvLFxuICAgICAgICB0O1xuICAgIHdoaWxlICgtLW4gPiAwKSB0ID0gYVtsb10sIGFbbG9dID0gYVtsbyArIG5dLCBhW2xvICsgbl0gPSB0LCBzaWZ0KGEsIDEsIG4sIGxvKTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8vIFNpZnRzIHRoZSBlbGVtZW50IGFbbG8raS0xXSBkb3duIHRoZSBoZWFwLCB3aGVyZSB0aGUgaGVhcCBpcyB0aGUgY29udGlndW91c1xuICAvLyBzbGljZSBvZiBhcnJheSBhW2xvOmxvK25dLiBUaGlzIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIHRvIHVwZGF0ZSB0aGUgaGVhcFxuICAvLyBpbmNyZW1lbnRhbGx5LCB3aXRob3V0IGluY3VycmluZyB0aGUgZnVsbCBjb3N0IG9mIHJlY29uc3RydWN0aW5nIHRoZSBoZWFwLlxuICBmdW5jdGlvbiBzaWZ0KGEsIGksIG4sIGxvKSB7XG4gICAgdmFyIGQgPSBhWy0tbG8gKyBpXSxcbiAgICAgICAgeCA9IGYoZCksXG4gICAgICAgIGNoaWxkO1xuICAgIHdoaWxlICgoY2hpbGQgPSBpIDw8IDEpIDw9IG4pIHtcbiAgICAgIGlmIChjaGlsZCA8IG4gJiYgZihhW2xvICsgY2hpbGRdKSA+IGYoYVtsbyArIGNoaWxkICsgMV0pKSBjaGlsZCsrO1xuICAgICAgaWYgKHggPD0gZihhW2xvICsgY2hpbGRdKSkgYnJlYWs7XG4gICAgICBhW2xvICsgaV0gPSBhW2xvICsgY2hpbGRdO1xuICAgICAgaSA9IGNoaWxkO1xuICAgIH1cbiAgICBhW2xvICsgaV0gPSBkO1xuICB9XG5cbiAgaGVhcC5zb3J0ID0gc29ydDtcbiAgcmV0dXJuIGhlYXA7XG59XG52YXIgaGVhcHNlbGVjdCA9IGNyb3NzZmlsdGVyLmhlYXBzZWxlY3QgPSBoZWFwc2VsZWN0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaGVhcHNlbGVjdC5ieSA9IGhlYXBzZWxlY3RfYnk7XG5cbmZ1bmN0aW9uIGhlYXBzZWxlY3RfYnkoZikge1xuICB2YXIgaGVhcCA9IGhlYXBfYnkoZik7XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgayBlbGVtZW50cyBpbiB0aGUgYXJyYXkgYVtsbzpoaV0uXG4gIC8vIFRoZSByZXR1cm5lZCBhcnJheSBpcyBub3Qgc29ydGVkLCBidXQgbWFpbnRhaW5zIHRoZSBoZWFwIHByb3BlcnR5LiBJZiBrIGlzXG4gIC8vIGdyZWF0ZXIgdGhhbiBoaSAtIGxvLCB0aGVuIGZld2VyIHRoYW4gayBlbGVtZW50cyB3aWxsIGJlIHJldHVybmVkLiBUaGVcbiAgLy8gb3JkZXIgb2YgZWxlbWVudHMgaW4gYSBpcyB1bmNoYW5nZWQgYnkgdGhpcyBvcGVyYXRpb24uXG4gIGZ1bmN0aW9uIGhlYXBzZWxlY3QoYSwgbG8sIGhpLCBrKSB7XG4gICAgdmFyIHF1ZXVlID0gbmV3IEFycmF5KGsgPSBNYXRoLm1pbihoaSAtIGxvLCBrKSksXG4gICAgICAgIG1pbixcbiAgICAgICAgaSxcbiAgICAgICAgeCxcbiAgICAgICAgZDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHF1ZXVlW2ldID0gYVtsbysrXTtcbiAgICBoZWFwKHF1ZXVlLCAwLCBrKTtcblxuICAgIGlmIChsbyA8IGhpKSB7XG4gICAgICBtaW4gPSBmKHF1ZXVlWzBdKTtcbiAgICAgIGRvIHtcbiAgICAgICAgaWYgKHggPSBmKGQgPSBhW2xvXSkgPiBtaW4pIHtcbiAgICAgICAgICBxdWV1ZVswXSA9IGQ7XG4gICAgICAgICAgbWluID0gZihoZWFwKHF1ZXVlLCAwLCBrKVswXSk7XG4gICAgICAgIH1cbiAgICAgIH0gd2hpbGUgKCsrbG8gPCBoaSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXVlO1xuICB9XG5cbiAgcmV0dXJuIGhlYXBzZWxlY3Q7XG59XG52YXIgaW5zZXJ0aW9uc29ydCA9IGNyb3NzZmlsdGVyLmluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGNyb3NzZmlsdGVyX2lkZW50aXR5KTtcblxuaW5zZXJ0aW9uc29ydC5ieSA9IGluc2VydGlvbnNvcnRfYnk7XG5cbmZ1bmN0aW9uIGluc2VydGlvbnNvcnRfYnkoZikge1xuXG4gIGZ1bmN0aW9uIGluc2VydGlvbnNvcnQoYSwgbG8sIGhpKSB7XG4gICAgZm9yICh2YXIgaSA9IGxvICsgMTsgaSA8IGhpOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSBpLCB0ID0gYVtpXSwgeCA9IGYodCk7IGogPiBsbyAmJiBmKGFbaiAtIDFdKSA+IHg7IC0taikge1xuICAgICAgICBhW2pdID0gYVtqIC0gMV07XG4gICAgICB9XG4gICAgICBhW2pdID0gdDtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICByZXR1cm4gaW5zZXJ0aW9uc29ydDtcbn1cbi8vIEFsZ29yaXRobSBkZXNpZ25lZCBieSBWbGFkaW1pciBZYXJvc2xhdnNraXkuXG4vLyBJbXBsZW1lbnRhdGlvbiBiYXNlZCBvbiB0aGUgRGFydCBwcm9qZWN0OyBzZWUgbGliL2RhcnQvTElDRU5TRSBmb3IgZGV0YWlscy5cblxudmFyIHF1aWNrc29ydCA9IGNyb3NzZmlsdGVyLnF1aWNrc29ydCA9IHF1aWNrc29ydF9ieShjcm9zc2ZpbHRlcl9pZGVudGl0eSk7XG5cbnF1aWNrc29ydC5ieSA9IHF1aWNrc29ydF9ieTtcblxuZnVuY3Rpb24gcXVpY2tzb3J0X2J5KGYpIHtcbiAgdmFyIGluc2VydGlvbnNvcnQgPSBpbnNlcnRpb25zb3J0X2J5KGYpO1xuXG4gIGZ1bmN0aW9uIHNvcnQoYSwgbG8sIGhpKSB7XG4gICAgcmV0dXJuIChoaSAtIGxvIDwgcXVpY2tzb3J0X3NpemVUaHJlc2hvbGRcbiAgICAgICAgPyBpbnNlcnRpb25zb3J0XG4gICAgICAgIDogcXVpY2tzb3J0KShhLCBsbywgaGkpO1xuICB9XG5cbiAgZnVuY3Rpb24gcXVpY2tzb3J0KGEsIGxvLCBoaSkge1xuICAgIC8vIENvbXB1dGUgdGhlIHR3byBwaXZvdHMgYnkgbG9va2luZyBhdCA1IGVsZW1lbnRzLlxuICAgIHZhciBzaXh0aCA9IChoaSAtIGxvKSAvIDYgfCAwLFxuICAgICAgICBpMSA9IGxvICsgc2l4dGgsXG4gICAgICAgIGk1ID0gaGkgLSAxIC0gc2l4dGgsXG4gICAgICAgIGkzID0gbG8gKyBoaSAtIDEgPj4gMSwgIC8vIFRoZSBtaWRwb2ludC5cbiAgICAgICAgaTIgPSBpMyAtIHNpeHRoLFxuICAgICAgICBpNCA9IGkzICsgc2l4dGg7XG5cbiAgICB2YXIgZTEgPSBhW2kxXSwgeDEgPSBmKGUxKSxcbiAgICAgICAgZTIgPSBhW2kyXSwgeDIgPSBmKGUyKSxcbiAgICAgICAgZTMgPSBhW2kzXSwgeDMgPSBmKGUzKSxcbiAgICAgICAgZTQgPSBhW2k0XSwgeDQgPSBmKGU0KSxcbiAgICAgICAgZTUgPSBhW2k1XSwgeDUgPSBmKGU1KTtcblxuICAgIHZhciB0O1xuXG4gICAgLy8gU29ydCB0aGUgc2VsZWN0ZWQgNSBlbGVtZW50cyB1c2luZyBhIHNvcnRpbmcgbmV0d29yay5cbiAgICBpZiAoeDEgPiB4MikgdCA9IGUxLCBlMSA9IGUyLCBlMiA9IHQsIHQgPSB4MSwgeDEgPSB4MiwgeDIgPSB0O1xuICAgIGlmICh4NCA+IHg1KSB0ID0gZTQsIGU0ID0gZTUsIGU1ID0gdCwgdCA9IHg0LCB4NCA9IHg1LCB4NSA9IHQ7XG4gICAgaWYgKHgxID4geDMpIHQgPSBlMSwgZTEgPSBlMywgZTMgPSB0LCB0ID0geDEsIHgxID0geDMsIHgzID0gdDtcbiAgICBpZiAoeDIgPiB4MykgdCA9IGUyLCBlMiA9IGUzLCBlMyA9IHQsIHQgPSB4MiwgeDIgPSB4MywgeDMgPSB0O1xuICAgIGlmICh4MSA+IHg0KSB0ID0gZTEsIGUxID0gZTQsIGU0ID0gdCwgdCA9IHgxLCB4MSA9IHg0LCB4NCA9IHQ7XG4gICAgaWYgKHgzID4geDQpIHQgPSBlMywgZTMgPSBlNCwgZTQgPSB0LCB0ID0geDMsIHgzID0geDQsIHg0ID0gdDtcbiAgICBpZiAoeDIgPiB4NSkgdCA9IGUyLCBlMiA9IGU1LCBlNSA9IHQsIHQgPSB4MiwgeDIgPSB4NSwgeDUgPSB0O1xuICAgIGlmICh4MiA+IHgzKSB0ID0gZTIsIGUyID0gZTMsIGUzID0gdCwgdCA9IHgyLCB4MiA9IHgzLCB4MyA9IHQ7XG4gICAgaWYgKHg0ID4geDUpIHQgPSBlNCwgZTQgPSBlNSwgZTUgPSB0LCB0ID0geDQsIHg0ID0geDUsIHg1ID0gdDtcblxuICAgIHZhciBwaXZvdDEgPSBlMiwgcGl2b3RWYWx1ZTEgPSB4MixcbiAgICAgICAgcGl2b3QyID0gZTQsIHBpdm90VmFsdWUyID0geDQ7XG5cbiAgICAvLyBlMiBhbmQgZTQgaGF2ZSBiZWVuIHNhdmVkIGluIHRoZSBwaXZvdCB2YXJpYWJsZXMuIFRoZXkgd2lsbCBiZSB3cml0dGVuXG4gICAgLy8gYmFjaywgb25jZSB0aGUgcGFydGl0aW9uaW5nIGlzIGZpbmlzaGVkLlxuICAgIGFbaTFdID0gZTE7XG4gICAgYVtpMl0gPSBhW2xvXTtcbiAgICBhW2kzXSA9IGUzO1xuICAgIGFbaTRdID0gYVtoaSAtIDFdO1xuICAgIGFbaTVdID0gZTU7XG5cbiAgICB2YXIgbGVzcyA9IGxvICsgMSwgICAvLyBGaXJzdCBlbGVtZW50IGluIHRoZSBtaWRkbGUgcGFydGl0aW9uLlxuICAgICAgICBncmVhdCA9IGhpIC0gMjsgIC8vIExhc3QgZWxlbWVudCBpbiB0aGUgbWlkZGxlIHBhcnRpdGlvbi5cblxuICAgIC8vIE5vdGUgdGhhdCBmb3IgdmFsdWUgY29tcGFyaXNvbiwgPCwgPD0sID49IGFuZCA+IGNvZXJjZSB0byBhIHByaW1pdGl2ZSB2aWFcbiAgICAvLyBPYmplY3QucHJvdG90eXBlLnZhbHVlT2Y7ID09IGFuZCA9PT0gZG8gbm90LCBzbyBpbiBvcmRlciB0byBiZSBjb25zaXN0ZW50XG4gICAgLy8gd2l0aCBuYXR1cmFsIG9yZGVyIChzdWNoIGFzIGZvciBEYXRlIG9iamVjdHMpLCB3ZSBtdXN0IGRvIHR3byBjb21wYXJlcy5cbiAgICB2YXIgcGl2b3RzRXF1YWwgPSBwaXZvdFZhbHVlMSA8PSBwaXZvdFZhbHVlMiAmJiBwaXZvdFZhbHVlMSA+PSBwaXZvdFZhbHVlMjtcbiAgICBpZiAocGl2b3RzRXF1YWwpIHtcblxuICAgICAgLy8gRGVnZW5lcmF0ZWQgY2FzZSB3aGVyZSB0aGUgcGFydGl0aW9uaW5nIGJlY29tZXMgYSBkdXRjaCBuYXRpb25hbCBmbGFnXG4gICAgICAvLyBwcm9ibGVtLlxuICAgICAgLy9cbiAgICAgIC8vIFsgfCAgPCBwaXZvdCAgfCA9PSBwaXZvdCB8IHVucGFydGl0aW9uZWQgfCA+IHBpdm90ICB8IF1cbiAgICAgIC8vICBeICAgICAgICAgICAgIF4gICAgICAgICAgXiAgICAgICAgICAgICBeICAgICAgICAgICAgXlxuICAgICAgLy8gbGVmdCAgICAgICAgIGxlc3MgICAgICAgICBrICAgICAgICAgICBncmVhdCAgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxKSBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QuXG4gICAgICAvLyAgIDIpIGZvciB4IGluIFtsZXNzLCBrWyA6IHggPT0gcGl2b3QuXG4gICAgICAvLyAgIDMpIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90LlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7ICsraykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2UgaWYgKHhrID4gcGl2b3RWYWx1ZTEpIHtcblxuICAgICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IGVsZW1lbnQgPD0gcGl2b3QgaW4gdGhlIHJhbmdlIFtrIC0gMSwgZ3JlYXRdIGFuZFxuICAgICAgICAgIC8vIHB1dCBbOmVrOl0gdGhlcmUuIFdlIGtub3cgdGhhdCBzdWNoIGFuIGVsZW1lbnQgbXVzdCBleGlzdDpcbiAgICAgICAgICAvLyBXaGVuIGsgPT0gbGVzcywgdGhlbiBlbDMgKHdoaWNoIGlzIGVxdWFsIHRvIHBpdm90KSBsaWVzIGluIHRoZVxuICAgICAgICAgIC8vIGludGVydmFsLiBPdGhlcndpc2UgYVtrIC0gMV0gPT0gcGl2b3QgYW5kIHRoZSBzZWFyY2ggc3RvcHMgYXQgay0xLlxuICAgICAgICAgIC8vIE5vdGUgdGhhdCBpbiB0aGUgbGF0dGVyIGNhc2UgaW52YXJpYW50IDIgd2lsbCBiZSB2aW9sYXRlZCBmb3IgYVxuICAgICAgICAgIC8vIHNob3J0IGFtb3VudCBvZiB0aW1lLiBUaGUgaW52YXJpYW50IHdpbGwgYmUgcmVzdG9yZWQgd2hlbiB0aGVcbiAgICAgICAgICAvLyBwaXZvdHMgYXJlIHB1dCBpbnRvIHRoZWlyIGZpbmFsIHBvc2l0aW9ucy5cbiAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgdmFyIGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKTtcbiAgICAgICAgICAgIGlmIChncmVhdFZhbHVlID4gcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgb25seSBsb2NhdGlvbiBpbiB0aGUgd2hpbGUtbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAvLyBpdGVyYXRpb24gaXMgc3RhcnRlZC5cbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGdyZWF0VmFsdWUgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICBhW2xlc3MrK10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAvLyBOb3RlOiBpZiBncmVhdCA8IGsgdGhlbiB3ZSB3aWxsIGV4aXQgdGhlIG91dGVyIGxvb3AgYW5kIGZpeFxuICAgICAgICAgICAgICAvLyBpbnZhcmlhbnQgMiAod2hpY2ggd2UganVzdCB2aW9sYXRlZCkuXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuIDwgcGl2b3QxXG4gICAgICAvLyAgMi4gPj0gcGl2b3QxICYmIDw9IHBpdm90MlxuICAgICAgLy8gIDMuID4gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbIHwgPCBwaXZvdDEgfCA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA+IHBpdm90MiAgfCBdXG4gICAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAgIC8vIGxlZnQgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXQgICAgICAgIHJpZ2h0XG4gICAgICAvL1xuICAgICAgLy8gYVtsZWZ0XSBhbmQgYVtyaWdodF0gYXJlIHVuZGVmaW5lZCBhbmQgYXJlIGZpbGxlZCBhZnRlciB0aGVcbiAgICAgIC8vIHBhcnRpdGlvbmluZy5cbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBdbGVmdCwgbGVzc1sgOiB4IDwgcGl2b3QxXG4gICAgICAvLyAgIDIuIGZvciB4IGluIFtsZXNzLCBrWyA6IHBpdm90MSA8PSB4ICYmIHggPD0gcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgcmlnaHRbIDogeCA+IHBpdm90MlxuICAgICAgZm9yICh2YXIgayA9IGxlc3M7IGsgPD0gZ3JlYXQ7IGsrKykge1xuICAgICAgICB2YXIgZWsgPSBhW2tdLCB4ayA9IGYoZWspO1xuICAgICAgICBpZiAoeGsgPCBwaXZvdFZhbHVlMSkge1xuICAgICAgICAgIGlmIChrICE9PSBsZXNzKSB7XG4gICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgIGFbbGVzc10gPSBlaztcbiAgICAgICAgICB9XG4gICAgICAgICAgKytsZXNzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmICh4ayA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA+IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDw9IHBpdm90Mi5cbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgICAgICAgICAvLyBUcmlwbGUgZXhjaGFuZ2UuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtsZXNzXTtcbiAgICAgICAgICAgICAgICAgIGFbbGVzcysrXSA9IGFbZ3JlYXRdO1xuICAgICAgICAgICAgICAgICAgYVtncmVhdC0tXSA9IGVrO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAvLyBhW2dyZWF0XSA+PSBwaXZvdDEuXG4gICAgICAgICAgICAgICAgICBhW2tdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTW92ZSBwaXZvdHMgaW50byB0aGVpciBmaW5hbCBwb3NpdGlvbnMuXG4gICAgLy8gV2Ugc2hydW5rIHRoZSBsaXN0IGZyb20gYm90aCBzaWRlcyAoYVtsZWZ0XSBhbmQgYVtyaWdodF0gaGF2ZVxuICAgIC8vIG1lYW5pbmdsZXNzIHZhbHVlcyBpbiB0aGVtKSBhbmQgbm93IHdlIG1vdmUgZWxlbWVudHMgZnJvbSB0aGUgZmlyc3RcbiAgICAvLyBhbmQgdGhpcmQgcGFydGl0aW9uIGludG8gdGhlc2UgbG9jYXRpb25zIHNvIHRoYXQgd2UgY2FuIHN0b3JlIHRoZVxuICAgIC8vIHBpdm90cy5cbiAgICBhW2xvXSA9IGFbbGVzcyAtIDFdO1xuICAgIGFbbGVzcyAtIDFdID0gcGl2b3QxO1xuICAgIGFbaGkgLSAxXSA9IGFbZ3JlYXQgKyAxXTtcbiAgICBhW2dyZWF0ICsgMV0gPSBwaXZvdDI7XG5cbiAgICAvLyBUaGUgbGlzdCBpcyBub3cgcGFydGl0aW9uZWQgaW50byB0aHJlZSBwYXJ0aXRpb25zOlxuICAgIC8vIFsgPCBwaXZvdDEgICB8ID49IHBpdm90MSAmJiA8PSBwaXZvdDIgICB8ICA+IHBpdm90MiAgIF1cbiAgICAvLyAgXiAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgICBeICAgICAgICAgICAgIF5cbiAgICAvLyBsZWZ0ICAgICAgICAgbGVzcyAgICAgICAgICAgICAgICAgICAgIGdyZWF0ICAgICAgICByaWdodFxuXG4gICAgLy8gUmVjdXJzaXZlIGRlc2NlbnQuIChEb24ndCBpbmNsdWRlIHRoZSBwaXZvdCB2YWx1ZXMuKVxuICAgIHNvcnQoYSwgbG8sIGxlc3MgLSAxKTtcbiAgICBzb3J0KGEsIGdyZWF0ICsgMiwgaGkpO1xuXG4gICAgaWYgKHBpdm90c0VxdWFsKSB7XG4gICAgICAvLyBBbGwgZWxlbWVudHMgaW4gdGhlIHNlY29uZCBwYXJ0aXRpb24gYXJlIGVxdWFsIHRvIHRoZSBwaXZvdC4gTm9cbiAgICAgIC8vIG5lZWQgdG8gc29ydCB0aGVtLlxuICAgICAgcmV0dXJuIGE7XG4gICAgfVxuXG4gICAgLy8gSW4gdGhlb3J5IGl0IHNob3VsZCBiZSBlbm91Z2ggdG8gY2FsbCBfZG9Tb3J0IHJlY3Vyc2l2ZWx5IG9uIHRoZSBzZWNvbmRcbiAgICAvLyBwYXJ0aXRpb24uXG4gICAgLy8gVGhlIEFuZHJvaWQgc291cmNlIGhvd2V2ZXIgcmVtb3ZlcyB0aGUgcGl2b3QgZWxlbWVudHMgZnJvbSB0aGUgcmVjdXJzaXZlXG4gICAgLy8gY2FsbCBpZiB0aGUgc2Vjb25kIHBhcnRpdGlvbiBpcyB0b28gbGFyZ2UgKG1vcmUgdGhhbiAyLzMgb2YgdGhlIGxpc3QpLlxuICAgIGlmIChsZXNzIDwgaTEgJiYgZ3JlYXQgPiBpNSkge1xuICAgICAgdmFyIGxlc3NWYWx1ZSwgZ3JlYXRWYWx1ZTtcbiAgICAgIHdoaWxlICgobGVzc1ZhbHVlID0gZihhW2xlc3NdKSkgPD0gcGl2b3RWYWx1ZTEgJiYgbGVzc1ZhbHVlID49IHBpdm90VmFsdWUxKSArK2xlc3M7XG4gICAgICB3aGlsZSAoKGdyZWF0VmFsdWUgPSBmKGFbZ3JlYXRdKSkgPD0gcGl2b3RWYWx1ZTIgJiYgZ3JlYXRWYWx1ZSA+PSBwaXZvdFZhbHVlMikgLS1ncmVhdDtcblxuICAgICAgLy8gQ29weSBwYXN0ZSBvZiB0aGUgcHJldmlvdXMgMy13YXkgcGFydGl0aW9uaW5nIHdpdGggYWRhcHRpb25zLlxuICAgICAgLy9cbiAgICAgIC8vIFdlIHBhcnRpdGlvbiB0aGUgbGlzdCBpbnRvIHRocmVlIHBhcnRzOlxuICAgICAgLy8gIDEuID09IHBpdm90MVxuICAgICAgLy8gIDIuID4gcGl2b3QxICYmIDwgcGl2b3QyXG4gICAgICAvLyAgMy4gPT0gcGl2b3QyXG4gICAgICAvL1xuICAgICAgLy8gRHVyaW5nIHRoZSBsb29wIHdlIGhhdmU6XG4gICAgICAvLyBbID09IHBpdm90MSB8ID4gcGl2b3QxICYmIDwgcGl2b3QyIHwgdW5wYXJ0aXRpb25lZCAgfCA9PSBwaXZvdDIgXVxuICAgICAgLy8gICAgICAgICAgICAgIF4gICAgICAgICAgICAgICAgICAgICAgXiAgICAgICAgICAgICAgXlxuICAgICAgLy8gICAgICAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgICAgayAgICAgICAgICAgICAgZ3JlYXRcbiAgICAgIC8vXG4gICAgICAvLyBJbnZhcmlhbnRzOlxuICAgICAgLy8gICAxLiBmb3IgeCBpbiBbICosIGxlc3NbIDogeCA9PSBwaXZvdDFcbiAgICAgIC8vICAgMi4gZm9yIHggaW4gW2xlc3MsIGtbIDogcGl2b3QxIDwgeCAmJiB4IDwgcGl2b3QyXG4gICAgICAvLyAgIDMuIGZvciB4IGluIF1ncmVhdCwgKiBdIDogeCA9PSBwaXZvdDJcbiAgICAgIGZvciAodmFyIGsgPSBsZXNzOyBrIDw9IGdyZWF0OyBrKyspIHtcbiAgICAgICAgdmFyIGVrID0gYVtrXSwgeGsgPSBmKGVrKTtcbiAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUxICYmIHhrID49IHBpdm90VmFsdWUxKSB7XG4gICAgICAgICAgaWYgKGsgIT09IGxlc3MpIHtcbiAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgYVtsZXNzXSA9IGVrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXNzKys7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHhrIDw9IHBpdm90VmFsdWUyICYmIHhrID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgICB2YXIgZ3JlYXRWYWx1ZSA9IGYoYVtncmVhdF0pO1xuICAgICAgICAgICAgICBpZiAoZ3JlYXRWYWx1ZSA8PSBwaXZvdFZhbHVlMiAmJiBncmVhdFZhbHVlID49IHBpdm90VmFsdWUyKSB7XG4gICAgICAgICAgICAgICAgZ3JlYXQtLTtcbiAgICAgICAgICAgICAgICBpZiAoZ3JlYXQgPCBrKSBicmVhaztcbiAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRoZSBvbmx5IGxvY2F0aW9uIGluc2lkZSB0aGUgbG9vcCB3aGVyZSBhIG5ld1xuICAgICAgICAgICAgICAgIC8vIGl0ZXJhdGlvbiBpcyBzdGFydGVkLlxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdIDwgcGl2b3QyLlxuICAgICAgICAgICAgICAgIGlmIChncmVhdFZhbHVlIDwgcGl2b3RWYWx1ZTEpIHtcbiAgICAgICAgICAgICAgICAgIC8vIFRyaXBsZSBleGNoYW5nZS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2xlc3NdO1xuICAgICAgICAgICAgICAgICAgYVtsZXNzKytdID0gYVtncmVhdF07XG4gICAgICAgICAgICAgICAgICBhW2dyZWF0LS1dID0gZWs7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIC8vIGFbZ3JlYXRdID09IHBpdm90MS5cbiAgICAgICAgICAgICAgICAgIGFba10gPSBhW2dyZWF0XTtcbiAgICAgICAgICAgICAgICAgIGFbZ3JlYXQtLV0gPSBlaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUaGUgc2Vjb25kIHBhcnRpdGlvbiBoYXMgbm93IGJlZW4gY2xlYXJlZCBvZiBwaXZvdCBlbGVtZW50cyBhbmQgbG9va3NcbiAgICAvLyBhcyBmb2xsb3dzOlxuICAgIC8vIFsgICogIHwgID4gcGl2b3QxICYmIDwgcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgIF5cbiAgICAvLyAgICAgICBsZXNzICAgICAgICAgICAgICAgICAgZ3JlYXRcbiAgICAvLyBTb3J0IHRoZSBzZWNvbmQgcGFydGl0aW9uIHVzaW5nIHJlY3Vyc2l2ZSBkZXNjZW50LlxuXG4gICAgLy8gVGhlIHNlY29uZCBwYXJ0aXRpb24gbG9va3MgYXMgZm9sbG93czpcbiAgICAvLyBbICAqICB8ICA+PSBwaXZvdDEgJiYgPD0gcGl2b3QyICB8ICogXVxuICAgIC8vICAgICAgICBeICAgICAgICAgICAgICAgICAgICAgICAgXlxuICAgIC8vICAgICAgIGxlc3MgICAgICAgICAgICAgICAgICAgIGdyZWF0XG4gICAgLy8gU2ltcGx5IHNvcnQgaXQgYnkgcmVjdXJzaXZlIGRlc2NlbnQuXG5cbiAgICByZXR1cm4gc29ydChhLCBsZXNzLCBncmVhdCArIDEpO1xuICB9XG5cbiAgcmV0dXJuIHNvcnQ7XG59XG5cbnZhciBxdWlja3NvcnRfc2l6ZVRocmVzaG9sZCA9IDMyO1xudmFyIGNyb3NzZmlsdGVyX2FycmF5OCA9IGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZCxcbiAgICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gY3Jvc3NmaWx0ZXJfYXJyYXlVbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5MzIgPSBjcm9zc2ZpbHRlcl9hcnJheVVudHlwZWQsXG4gICAgY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbiA9IGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkLFxuICAgIGNyb3NzZmlsdGVyX2FycmF5V2lkZW4gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZDtcblxuaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gIGNyb3NzZmlsdGVyX2FycmF5OCA9IGZ1bmN0aW9uKG4pIHsgcmV0dXJuIG5ldyBVaW50OEFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTE2ID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQxNkFycmF5KG4pOyB9O1xuICBjcm9zc2ZpbHRlcl9hcnJheTMyID0gZnVuY3Rpb24obikgeyByZXR1cm4gbmV3IFVpbnQzMkFycmF5KG4pOyB9O1xuXG4gIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW4gPSBmdW5jdGlvbihhcnJheSwgbGVuZ3RoKSB7XG4gICAgaWYgKGFycmF5Lmxlbmd0aCA+PSBsZW5ndGgpIHJldHVybiBhcnJheTtcbiAgICB2YXIgY29weSA9IG5ldyBhcnJheS5jb25zdHJ1Y3RvcihsZW5ndGgpO1xuICAgIGNvcHkuc2V0KGFycmF5KTtcbiAgICByZXR1cm4gY29weTtcbiAgfTtcblxuICBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuID0gZnVuY3Rpb24oYXJyYXksIHdpZHRoKSB7XG4gICAgdmFyIGNvcHk7XG4gICAgc3dpdGNoICh3aWR0aCkge1xuICAgICAgY2FzZSAxNjogY29weSA9IGNyb3NzZmlsdGVyX2FycmF5MTYoYXJyYXkubGVuZ3RoKTsgYnJlYWs7XG4gICAgICBjYXNlIDMyOiBjb3B5ID0gY3Jvc3NmaWx0ZXJfYXJyYXkzMihhcnJheS5sZW5ndGgpOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICAgIH1cbiAgICBjb3B5LnNldChhcnJheSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5VW50eXBlZChuKSB7XG4gIHZhciBhcnJheSA9IG5ldyBBcnJheShuKSwgaSA9IC0xO1xuICB3aGlsZSAoKytpIDwgbikgYXJyYXlbaV0gPSAwO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2FycmF5TGVuZ3RoZW5VbnR5cGVkKGFycmF5LCBsZW5ndGgpIHtcbiAgdmFyIG4gPSBhcnJheS5sZW5ndGg7XG4gIHdoaWxlIChuIDwgbGVuZ3RoKSBhcnJheVtuKytdID0gMDtcbiAgcmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuVW50eXBlZChhcnJheSwgd2lkdGgpIHtcbiAgaWYgKHdpZHRoID4gMzIpIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgYXJyYXkgd2lkdGghXCIpO1xuICByZXR1cm4gYXJyYXk7XG59XG5cbi8vIEFuIGFyYml0cmFyaWx5LXdpZGUgYXJyYXkgb2YgYml0bWFza3NcbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2JpdGFycmF5KG4pIHtcbiAgdGhpcy5sZW5ndGggPSBuO1xuICB0aGlzLnN1YmFycmF5cyA9IDE7XG4gIHRoaXMud2lkdGggPSA4O1xuICB0aGlzLm1hc2tzID0ge1xuICAgIDA6IDBcbiAgfVxuXG4gIHRoaXNbMF0gPSBjcm9zc2ZpbHRlcl9hcnJheTgobik7XG59O1xuXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUubGVuZ3RoZW4gPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICB0aGlzW2ldID0gY3Jvc3NmaWx0ZXJfYXJyYXlMZW5ndGhlbih0aGlzW2ldLCBuKTtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IG47XG59O1xuXG4vLyBSZXNlcnZlIGEgbmV3IGJpdCBpbmRleCBpbiB0aGUgYXJyYXksIHJldHVybnMge29mZnNldCwgb25lfVxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbSwgdywgb25lLCBpLCBsZW47XG5cbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIG0gPSB0aGlzLm1hc2tzW2ldO1xuICAgIHcgPSB0aGlzLndpZHRoIC0gKDMyICogaSk7XG4gICAgb25lID0gfm0gJiAtfm07XG5cbiAgICBpZiAodyA+PSAzMiAmJiAhb25lKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAodyA8IDMyICYmIChvbmUgJiAoMSA8PCB3KSkpIHtcbiAgICAgIC8vIHdpZGVuIHRoaXMgc3ViYXJyYXlcbiAgICAgIHRoaXNbaV0gPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKHRoaXNbaV0sIHcgPDw9IDEpO1xuICAgICAgdGhpcy53aWR0aCA9IDMyICogaSArIHc7XG4gICAgfVxuXG4gICAgdGhpcy5tYXNrc1tpXSB8PSBvbmU7XG5cbiAgICByZXR1cm4ge1xuICAgICAgb2Zmc2V0OiBpLFxuICAgICAgb25lOiBvbmVcbiAgICB9O1xuICB9XG5cbiAgLy8gYWRkIGEgbmV3IHN1YmFycmF5XG4gIHRoaXNbdGhpcy5zdWJhcnJheXNdID0gY3Jvc3NmaWx0ZXJfYXJyYXk4KHRoaXMubGVuZ3RoKTtcbiAgdGhpcy5tYXNrc1t0aGlzLnN1YmFycmF5c10gPSAxO1xuICB0aGlzLndpZHRoICs9IDg7XG4gIHJldHVybiB7XG4gICAgb2Zmc2V0OiB0aGlzLnN1YmFycmF5cysrLFxuICAgIG9uZTogMVxuICB9O1xufTtcblxuLy8gQ29weSByZWNvcmQgZnJvbSBpbmRleCBzcmMgdG8gaW5kZXggZGVzdFxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihkZXN0LCBzcmMpIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIHRoaXNbaV1bZGVzdF0gPSB0aGlzW2ldW3NyY107XG4gIH1cbn07XG5cbi8vIFRydW5jYXRlIHRoZSBhcnJheSB0byB0aGUgZ2l2ZW4gbGVuZ3RoXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUudHJ1bmNhdGUgPSBmdW5jdGlvbihuKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBmb3IgKHZhciBqID0gdGhpcy5sZW5ndGggLSAxOyBqID49IG47IGotLSkge1xuICAgICAgdGhpc1tpXVtqXSA9IDA7XG4gICAgfVxuICAgIHRoaXNbaV0ubGVuZ3RoID0gbjtcbiAgfVxuICB0aGlzLmxlbmd0aCA9IG47XG59O1xuXG4vLyBDaGVja3MgdGhhdCBhbGwgYml0cyBmb3IgdGhlIGdpdmVuIGluZGV4IGFyZSAwXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUuemVybyA9IGZ1bmN0aW9uKG4pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzW2ldW25dKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxuLy8gQ2hlY2tzIHRoYXQgYWxsIGJpdHMgZm9yIHRoZSBnaXZlbiBpbmRleCBhcmUgMCBleGNlcHQgZm9yIHBvc3NpYmx5IG9uZVxuY3Jvc3NmaWx0ZXJfYml0YXJyYXkucHJvdG90eXBlLnplcm9FeGNlcHQgPSBmdW5jdGlvbihuLCBvZmZzZXQsIHplcm8pIHtcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChpID09PSBvZmZzZXQgPyB0aGlzW2ldW25dICYgemVybyA6IHRoaXNbaV1bbl0pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBvbmx5IHRoZSBzcGVjaWZpZWQgYml0IGlzIHNldCBmb3IgdGhlIGdpdmVuIGluZGV4XG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUub25seSA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgb25lKSB7XG4gIHZhciBpLCBsZW47XG4gIGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuc3ViYXJyYXlzOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc1tpXVtuXSAhPSAoaSA9PT0gb2Zmc2V0ID8gb25lIDogMCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG4vLyBDaGVja3MgdGhhdCBvbmx5IHRoZSBzcGVjaWZpZWQgYml0IGlzIHNldCBmb3IgdGhlIGdpdmVuIGluZGV4IGV4Y2VwdCBmb3IgcG9zc2libHkgb25lIG90aGVyXG5jcm9zc2ZpbHRlcl9iaXRhcnJheS5wcm90b3R5cGUub25seUV4Y2VwdCA9IGZ1bmN0aW9uKG4sIG9mZnNldCwgemVybywgb25seU9mZnNldCwgb25seU9uZSkge1xuICB2YXIgbWFzaztcbiAgdmFyIGksIGxlbjtcbiAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5zdWJhcnJheXM7IGkgPCBsZW47ICsraSkge1xuICAgIG1hc2sgPSB0aGlzW2ldW25dO1xuICAgIGlmIChpID09PSBvZmZzZXQpXG4gICAgICBtYXNrICY9IHplcm87XG4gICAgaWYgKG1hc2sgIT0gKGkgPT09IG9ubHlPZmZzZXQgPyBvbmx5T25lIDogMCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfZmlsdGVyRXhhY3QoYmlzZWN0LCB2YWx1ZSkge1xuICByZXR1cm4gZnVuY3Rpb24odmFsdWVzKSB7XG4gICAgdmFyIG4gPSB2YWx1ZXMubGVuZ3RoO1xuICAgIHJldHVybiBbYmlzZWN0LmxlZnQodmFsdWVzLCB2YWx1ZSwgMCwgbiksIGJpc2VjdC5yaWdodCh2YWx1ZXMsIHZhbHVlLCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlclJhbmdlKGJpc2VjdCwgcmFuZ2UpIHtcbiAgdmFyIG1pbiA9IHJhbmdlWzBdLFxuICAgICAgbWF4ID0gcmFuZ2VbMV07XG4gIHJldHVybiBmdW5jdGlvbih2YWx1ZXMpIHtcbiAgICB2YXIgbiA9IHZhbHVlcy5sZW5ndGg7XG4gICAgcmV0dXJuIFtiaXNlY3QubGVmdCh2YWx1ZXMsIG1pbiwgMCwgbiksIGJpc2VjdC5sZWZ0KHZhbHVlcywgbWF4LCAwLCBuKV07XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX2ZpbHRlckFsbCh2YWx1ZXMpIHtcbiAgcmV0dXJuIFswLCB2YWx1ZXMubGVuZ3RoXTtcbn1cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX251bGwoKSB7XG4gIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfemVybygpIHtcbiAgcmV0dXJuIDA7XG59XG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VJbmNyZW1lbnQocCkge1xuICByZXR1cm4gcCArIDE7XG59XG5cbmZ1bmN0aW9uIGNyb3NzZmlsdGVyX3JlZHVjZURlY3JlbWVudChwKSB7XG4gIHJldHVybiBwIC0gMTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKGYpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKHAsIHYpIHtcbiAgICByZXR1cm4gcCArICtmKHYpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yZWR1Y2VTdWJ0cmFjdChmKSB7XG4gIHJldHVybiBmdW5jdGlvbihwLCB2KSB7XG4gICAgcmV0dXJuIHAgLSBmKHYpO1xuICB9O1xufVxuZXhwb3J0cy5jcm9zc2ZpbHRlciA9IGNyb3NzZmlsdGVyO1xuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcigpIHtcbiAgdmFyIGNyb3NzZmlsdGVyID0ge1xuICAgIGFkZDogYWRkLFxuICAgIHJlbW92ZTogcmVtb3ZlRGF0YSxcbiAgICBkaW1lbnNpb246IGRpbWVuc2lvbixcbiAgICBncm91cEFsbDogZ3JvdXBBbGwsXG4gICAgc2l6ZTogc2l6ZSxcbiAgICBhbGw6IGFsbCxcbiAgfTtcblxuICB2YXIgZGF0YSA9IFtdLCAvLyB0aGUgcmVjb3Jkc1xuICAgICAgbiA9IDAsIC8vIHRoZSBudW1iZXIgb2YgcmVjb3JkczsgZGF0YS5sZW5ndGhcbiAgICAgIGZpbHRlcnMsIC8vIDEgaXMgZmlsdGVyZWQgb3V0XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiB0aGUgZmlsdGVycyBjaGFuZ2VcbiAgICAgIGRhdGFMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICByZW1vdmVEYXRhTGlzdGVuZXJzID0gW107IC8vIHdoZW4gZGF0YSBpcyByZW1vdmVkXG5cbiAgZmlsdGVycyA9IG5ldyBjcm9zc2ZpbHRlcl9iaXRhcnJheSgwKTtcblxuICAvLyBBZGRzIHRoZSBzcGVjaWZpZWQgbmV3IHJlY29yZHMgdG8gdGhpcyBjcm9zc2ZpbHRlci5cbiAgZnVuY3Rpb24gYWRkKG5ld0RhdGEpIHtcbiAgICB2YXIgbjAgPSBuLFxuICAgICAgICBuMSA9IG5ld0RhdGEubGVuZ3RoO1xuXG4gICAgLy8gSWYgdGhlcmUncyBhY3R1YWxseSBuZXcgZGF0YSB0byBhZGTigKZcbiAgICAvLyBNZXJnZSB0aGUgbmV3IGRhdGEgaW50byB0aGUgZXhpc3RpbmcgZGF0YS5cbiAgICAvLyBMZW5ndGhlbiB0aGUgZmlsdGVyIGJpdHNldCB0byBoYW5kbGUgdGhlIG5ldyByZWNvcmRzLlxuICAgIC8vIE5vdGlmeSBsaXN0ZW5lcnMgKGRpbWVuc2lvbnMgYW5kIGdyb3VwcykgdGhhdCBuZXcgZGF0YSBpcyBhdmFpbGFibGUuXG4gICAgaWYgKG4xKSB7XG4gICAgICBkYXRhID0gZGF0YS5jb25jYXQobmV3RGF0YSk7XG4gICAgICBmaWx0ZXJzLmxlbmd0aGVuKG4gKz0gbjEpO1xuICAgICAgZGF0YUxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbChuZXdEYXRhLCBuMCwgbjEpOyB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3Jvc3NmaWx0ZXI7XG4gIH1cblxuICAvLyBSZW1vdmVzIGFsbCByZWNvcmRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgZmlsdGVycy5cbiAgZnVuY3Rpb24gcmVtb3ZlRGF0YSgpIHtcbiAgICB2YXIgbmV3SW5kZXggPSBjcm9zc2ZpbHRlcl9pbmRleChuLCBuKSxcbiAgICAgICAgcmVtb3ZlZCA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwLCBqID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIG5ld0luZGV4W2ldID0gaisrO1xuICAgICAgZWxzZSByZW1vdmVkLnB1c2goaSk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGFsbCBtYXRjaGluZyByZWNvcmRzIGZyb20gZ3JvdXBzLlxuICAgIGZpbHRlckxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKGwpIHsgbCgtMSwgLTEsIFtdLCByZW1vdmVkLCB0cnVlKTsgfSk7XG5cbiAgICAvLyBVcGRhdGUgaW5kZXhlcy5cbiAgICByZW1vdmVEYXRhTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld0luZGV4KTsgfSk7XG5cbiAgICAvLyBSZW1vdmUgb2xkIGZpbHRlcnMgYW5kIGRhdGEgYnkgb3ZlcndyaXRpbmcuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICBpZiAoaSAhPT0gaikgZmlsdGVycy5jb3B5KGosIGkpLCBkYXRhW2pdID0gZGF0YVtpXTtcbiAgICAgICAgKytqO1xuICAgICAgfVxuICAgIH1cblxuICAgIGRhdGEubGVuZ3RoID0gbiA9IGo7XG4gICAgZmlsdGVycy50cnVuY2F0ZShqKTtcbiAgfVxuXG4gIC8vIEFkZHMgYSBuZXcgZGltZW5zaW9uIHdpdGggdGhlIHNwZWNpZmllZCB2YWx1ZSBhY2Nlc3NvciBmdW5jdGlvbi5cbiAgZnVuY3Rpb24gZGltZW5zaW9uKHZhbHVlKSB7XG4gICAgdmFyIGRpbWVuc2lvbiA9IHtcbiAgICAgIGZpbHRlcjogZmlsdGVyLFxuICAgICAgZmlsdGVyRXhhY3Q6IGZpbHRlckV4YWN0LFxuICAgICAgZmlsdGVyUmFuZ2U6IGZpbHRlclJhbmdlLFxuICAgICAgZmlsdGVyRnVuY3Rpb246IGZpbHRlckZ1bmN0aW9uLFxuICAgICAgZmlsdGVyQWxsOiBmaWx0ZXJBbGwsXG4gICAgICB0b3A6IHRvcCxcbiAgICAgIGJvdHRvbTogYm90dG9tLFxuICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgZ3JvdXBBbGw6IGdyb3VwQWxsLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIG9uZSwgLy8gbG93ZXN0IHVuc2V0IGJpdCBhcyBtYXNrLCBlLmcuLCAwMDAwMTAwMFxuICAgICAgICB6ZXJvLCAvLyBpbnZlcnRlZCBvbmUsIGUuZy4sIDExMTEwMTExXG4gICAgICAgIG9mZnNldCwgLy8gb2Zmc2V0IGludG8gdGhlIGZpbHRlcnMgYXJyYXlzXG4gICAgICAgIHZhbHVlcywgLy8gc29ydGVkLCBjYWNoZWQgYXJyYXlcbiAgICAgICAgaW5kZXgsIC8vIHZhbHVlIHJhbmsg4oamIG9iamVjdCBpZFxuICAgICAgICBuZXdWYWx1ZXMsIC8vIHRlbXBvcmFyeSBhcnJheSBzdG9yaW5nIG5ld2x5LWFkZGVkIHZhbHVlc1xuICAgICAgICBuZXdJbmRleCwgLy8gdGVtcG9yYXJ5IGFycmF5IHN0b3JpbmcgbmV3bHktYWRkZWQgaW5kZXhcbiAgICAgICAgc29ydCA9IHF1aWNrc29ydF9ieShmdW5jdGlvbihpKSB7IHJldHVybiBuZXdWYWx1ZXNbaV07IH0pLFxuICAgICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbCwgLy8gZm9yIHJlY29tcHV0aW5nIGZpbHRlclxuICAgICAgICByZWZpbHRlckZ1bmN0aW9uLCAvLyB0aGUgY3VzdG9tIGZpbHRlciBmdW5jdGlvbiBpbiB1c2VcbiAgICAgICAgaW5kZXhMaXN0ZW5lcnMgPSBbXSwgLy8gd2hlbiBkYXRhIGlzIGFkZGVkXG4gICAgICAgIGRpbWVuc2lvbkdyb3VwcyA9IFtdLFxuICAgICAgICBsbzAgPSAwLFxuICAgICAgICBoaTAgPSAwO1xuXG4gICAgLy8gVXBkYXRpbmcgYSBkaW1lbnNpb24gaXMgYSB0d28tc3RhZ2UgcHJvY2Vzcy4gRmlyc3QsIHdlIG11c3QgdXBkYXRlIHRoZVxuICAgIC8vIGFzc29jaWF0ZWQgZmlsdGVycyBmb3IgdGhlIG5ld2x5LWFkZGVkIHJlY29yZHMuIE9uY2UgYWxsIGRpbWVuc2lvbnMgaGF2ZVxuICAgIC8vIHVwZGF0ZWQgdGhlaXIgZmlsdGVycywgdGhlIGdyb3VwcyBhcmUgbm90aWZpZWQgdG8gdXBkYXRlLlxuICAgIGRhdGFMaXN0ZW5lcnMudW5zaGlmdChwcmVBZGQpO1xuICAgIGRhdGFMaXN0ZW5lcnMucHVzaChwb3N0QWRkKTtcblxuICAgIHJlbW92ZURhdGFMaXN0ZW5lcnMucHVzaChyZW1vdmVEYXRhKTtcblxuICAgIC8vIEFkZCBhIG5ldyBkaW1lbnNpb24gaW4gdGhlIGZpbHRlciBiaXRtYXAgYW5kIHN0b3JlIHRoZSBvZmZzZXQgYW5kIGJpdG1hc2suXG4gICAgdmFyIHRtcCA9IGZpbHRlcnMuYWRkKCk7XG4gICAgb2Zmc2V0ID0gdG1wLm9mZnNldDtcbiAgICBvbmUgPSB0bXAub25lO1xuICAgIHplcm8gPSB+b25lO1xuXG4gICAgcHJlQWRkKGRhdGEsIDAsIG4pO1xuICAgIHBvc3RBZGQoZGF0YSwgMCwgbik7XG5cbiAgICAvLyBJbmNvcnBvcmF0ZXMgdGhlIHNwZWNpZmllZCBuZXcgcmVjb3JkcyBpbnRvIHRoaXMgZGltZW5zaW9uLlxuICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgcmVzcG9uc2libGUgZm9yIHVwZGF0aW5nIGZpbHRlcnMsIHZhbHVlcywgYW5kIGluZGV4LlxuICAgIGZ1bmN0aW9uIHByZUFkZChuZXdEYXRhLCBuMCwgbjEpIHtcblxuICAgICAgLy8gUGVybXV0ZSBuZXcgdmFsdWVzIGludG8gbmF0dXJhbCBvcmRlciB1c2luZyBhIHNvcnRlZCBpbmRleC5cbiAgICAgIG5ld1ZhbHVlcyA9IG5ld0RhdGEubWFwKHZhbHVlKTtcbiAgICAgIG5ld0luZGV4ID0gc29ydChjcm9zc2ZpbHRlcl9yYW5nZShuMSksIDAsIG4xKTtcbiAgICAgIG5ld1ZhbHVlcyA9IHBlcm11dGUobmV3VmFsdWVzLCBuZXdJbmRleCk7XG5cbiAgICAgIC8vIEJpc2VjdCBuZXdWYWx1ZXMgdG8gZGV0ZXJtaW5lIHdoaWNoIG5ldyByZWNvcmRzIGFyZSBzZWxlY3RlZC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcihuZXdWYWx1ZXMpLCBsbzEgPSBib3VuZHNbMF0sIGhpMSA9IGJvdW5kc1sxXSwgaTtcbiAgICAgIGlmIChyZWZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuMTsgKytpKSB7XG4gICAgICAgICAgaWYgKCFyZWZpbHRlckZ1bmN0aW9uKG5ld1ZhbHVlc1tpXSwgaSkpIGZpbHRlcnNbb2Zmc2V0XVtuZXdJbmRleFtpXSArIG4wXSB8PSBvbmU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsbzE7ICsraSkgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgICAgZm9yIChpID0gaGkxOyBpIDwgbjE7ICsraSkgZmlsdGVyc1tvZmZzZXRdW25ld0luZGV4W2ldICsgbjBdIHw9IG9uZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhpcyBkaW1lbnNpb24gcHJldmlvdXNseSBoYWQgbm8gZGF0YSwgdGhlbiB3ZSBkb24ndCBuZWVkIHRvIGRvIHRoZVxuICAgICAgLy8gbW9yZSBleHBlbnNpdmUgbWVyZ2Ugb3BlcmF0aW9uOyB1c2UgdGhlIG5ldyB2YWx1ZXMgYW5kIGluZGV4IGFzLWlzLlxuICAgICAgaWYgKCFuMCkge1xuICAgICAgICB2YWx1ZXMgPSBuZXdWYWx1ZXM7XG4gICAgICAgIGluZGV4ID0gbmV3SW5kZXg7XG4gICAgICAgIGxvMCA9IGxvMTtcbiAgICAgICAgaGkwID0gaGkxO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHZhciBvbGRWYWx1ZXMgPSB2YWx1ZXMsXG4gICAgICAgICAgb2xkSW5kZXggPSBpbmRleCxcbiAgICAgICAgICBpMCA9IDAsXG4gICAgICAgICAgaTEgPSAwO1xuXG4gICAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBuZXcgYXJyYXlzIGludG8gd2hpY2ggdG8gbWVyZ2UgbmV3IGFuZCBvbGQuXG4gICAgICB2YWx1ZXMgPSBuZXcgQXJyYXkobik7XG4gICAgICBpbmRleCA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuXG4gICAgICAvLyBNZXJnZSB0aGUgb2xkIGFuZCBuZXcgc29ydGVkIHZhbHVlcywgYW5kIG9sZCBhbmQgbmV3IGluZGV4LlxuICAgICAgZm9yIChpID0gMDsgaTAgPCBuMCAmJiBpMSA8IG4xOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZFZhbHVlc1tpMF0gPCBuZXdWYWx1ZXNbaTFdKSB7XG4gICAgICAgICAgdmFsdWVzW2ldID0gb2xkVmFsdWVzW2kwXTtcbiAgICAgICAgICBpbmRleFtpXSA9IG9sZEluZGV4W2kwKytdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlc1tpMV07XG4gICAgICAgICAgaW5kZXhbaV0gPSBuZXdJbmRleFtpMSsrXSArIG4wO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFkZCBhbnkgcmVtYWluaW5nIG9sZCB2YWx1ZXMuXG4gICAgICBmb3IgKDsgaTAgPCBuMDsgKytpMCwgKytpKSB7XG4gICAgICAgIHZhbHVlc1tpXSA9IG9sZFZhbHVlc1tpMF07XG4gICAgICAgIGluZGV4W2ldID0gb2xkSW5kZXhbaTBdO1xuICAgICAgfVxuXG4gICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBuZXcgdmFsdWVzLlxuICAgICAgZm9yICg7IGkxIDwgbjE7ICsraTEsICsraSkge1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZXNbaTFdO1xuICAgICAgICBpbmRleFtpXSA9IG5ld0luZGV4W2kxXSArIG4wO1xuICAgICAgfVxuXG4gICAgICAvLyBCaXNlY3QgYWdhaW4gdG8gcmVjb21wdXRlIGxvMCBhbmQgaGkwLlxuICAgICAgYm91bmRzID0gcmVmaWx0ZXIodmFsdWVzKSwgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gV2hlbiBhbGwgZmlsdGVycyBoYXZlIHVwZGF0ZWQsIG5vdGlmeSBpbmRleCBsaXN0ZW5lcnMgb2YgdGhlIG5ldyB2YWx1ZXMuXG4gICAgZnVuY3Rpb24gcG9zdEFkZChuZXdEYXRhLCBuMCwgbjEpIHtcbiAgICAgIGluZGV4TGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24obCkgeyBsKG5ld1ZhbHVlcywgbmV3SW5kZXgsIG4wLCBuMSk7IH0pO1xuICAgICAgbmV3VmFsdWVzID0gbmV3SW5kZXggPSBudWxsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbW92ZURhdGEocmVJbmRleCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBrOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGsgPSBpbmRleFtpXSkpIHtcbiAgICAgICAgICBpZiAoaSAhPT0gaikgdmFsdWVzW2pdID0gdmFsdWVzW2ldO1xuICAgICAgICAgIGluZGV4W2pdID0gcmVJbmRleFtrXTtcbiAgICAgICAgICArK2o7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhbHVlcy5sZW5ndGggPSBqO1xuICAgICAgd2hpbGUgKGogPCBuKSBpbmRleFtqKytdID0gMDtcblxuICAgICAgLy8gQmlzZWN0IGFnYWluIHRvIHJlY29tcHV0ZSBsbzAgYW5kIGhpMC5cbiAgICAgIHZhciBib3VuZHMgPSByZWZpbHRlcih2YWx1ZXMpO1xuICAgICAgbG8wID0gYm91bmRzWzBdLCBoaTAgPSBib3VuZHNbMV07XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlcyB0aGUgc2VsZWN0ZWQgdmFsdWVzIGJhc2VkIG9uIHRoZSBzcGVjaWZpZWQgYm91bmRzIFtsbywgaGldLlxuICAgIC8vIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgdXNlZCBieSBhbGwgdGhlIHB1YmxpYyBmaWx0ZXIgbWV0aG9kcy5cbiAgICBmdW5jdGlvbiBmaWx0ZXJJbmRleEJvdW5kcyhib3VuZHMpIHtcbiAgICAgIHZhciBsbzEgPSBib3VuZHNbMF0sXG4gICAgICAgICAgaGkxID0gYm91bmRzWzFdO1xuXG4gICAgICBpZiAocmVmaWx0ZXJGdW5jdGlvbikge1xuICAgICAgICByZWZpbHRlckZ1bmN0aW9uID0gbnVsbDtcbiAgICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihmdW5jdGlvbihkLCBpKSB7IHJldHVybiBsbzEgPD0gaSAmJiBpIDwgaGkxOyB9KTtcbiAgICAgICAgbG8wID0gbG8xO1xuICAgICAgICBoaTAgPSBoaTE7XG4gICAgICAgIHJldHVybiBkaW1lbnNpb247XG4gICAgICB9XG5cbiAgICAgIHZhciBpLFxuICAgICAgICAgIGosXG4gICAgICAgICAgayxcbiAgICAgICAgICBhZGRlZCA9IFtdLFxuICAgICAgICAgIHJlbW92ZWQgPSBbXTtcblxuICAgICAgLy8gRmFzdCBpbmNyZW1lbnRhbCB1cGRhdGUgYmFzZWQgb24gcHJldmlvdXMgbG8gaW5kZXguXG4gICAgICBpZiAobG8xIDwgbG8wKSB7XG4gICAgICAgIGZvciAoaSA9IGxvMSwgaiA9IE1hdGgubWluKGxvMCwgaGkxKTsgaSA8IGo7ICsraSkge1xuICAgICAgICAgIGZpbHRlcnNbb2Zmc2V0XVtrID0gaW5kZXhbaV1dIF49IG9uZTtcbiAgICAgICAgICBhZGRlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGxvMSA+IGxvMCkge1xuICAgICAgICBmb3IgKGkgPSBsbzAsIGogPSBNYXRoLm1pbihsbzEsIGhpMCk7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEZhc3QgaW5jcmVtZW50YWwgdXBkYXRlIGJhc2VkIG9uIHByZXZpb3VzIGhpIGluZGV4LlxuICAgICAgaWYgKGhpMSA+IGhpMCkge1xuICAgICAgICBmb3IgKGkgPSBNYXRoLm1heChsbzEsIGhpMCksIGogPSBoaTE7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgICBmaWx0ZXJzW29mZnNldF1bayA9IGluZGV4W2ldXSBePSBvbmU7XG4gICAgICAgICAgYWRkZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChoaTEgPCBoaTApIHtcbiAgICAgICAgZm9yIChpID0gTWF0aC5tYXgobG8wLCBoaTEpLCBqID0gaGkwOyBpIDwgajsgKytpKSB7XG4gICAgICAgICAgZmlsdGVyc1tvZmZzZXRdW2sgPSBpbmRleFtpXV0gXj0gb25lO1xuICAgICAgICAgIHJlbW92ZWQucHVzaChrKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBsbzAgPSBsbzE7XG4gICAgICBoaTAgPSBoaTE7XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBvZmZzZXQsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdXNpbmcgdGhlIHNwZWNpZmllZCByYW5nZSwgdmFsdWUsIG9yIG51bGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIG51bGwsIHRoaXMgaXMgZXF1aXZhbGVudCB0byBmaWx0ZXJBbGwuXG4gICAgLy8gSWYgdGhlIHJhbmdlIGlzIGFuIGFycmF5LCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyUmFuZ2UuXG4gICAgLy8gT3RoZXJ3aXNlLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gZmlsdGVyRXhhY3QuXG4gICAgZnVuY3Rpb24gZmlsdGVyKHJhbmdlKSB7XG4gICAgICByZXR1cm4gcmFuZ2UgPT0gbnVsbFxuICAgICAgICAgID8gZmlsdGVyQWxsKCkgOiBBcnJheS5pc0FycmF5KHJhbmdlKVxuICAgICAgICAgID8gZmlsdGVyUmFuZ2UocmFuZ2UpIDogdHlwZW9mIHJhbmdlID09PSBcImZ1bmN0aW9uXCJcbiAgICAgICAgICA/IGZpbHRlckZ1bmN0aW9uKHJhbmdlKVxuICAgICAgICAgIDogZmlsdGVyRXhhY3QocmFuZ2UpO1xuICAgIH1cblxuICAgIC8vIEZpbHRlcnMgdGhpcyBkaW1lbnNpb24gdG8gc2VsZWN0IHRoZSBleGFjdCB2YWx1ZS5cbiAgICBmdW5jdGlvbiBmaWx0ZXJFeGFjdCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGZpbHRlckluZGV4Qm91bmRzKChyZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckV4YWN0KGJpc2VjdCwgdmFsdWUpKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHRvIHNlbGVjdCB0aGUgc3BlY2lmaWVkIHJhbmdlIFtsbywgaGldLlxuICAgIC8vIFRoZSBsb3dlciBib3VuZCBpcyBpbmNsdXNpdmUsIGFuZCB0aGUgdXBwZXIgYm91bmQgaXMgZXhjbHVzaXZlLlxuICAgIGZ1bmN0aW9uIGZpbHRlclJhbmdlKHJhbmdlKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyUmFuZ2UoYmlzZWN0LCByYW5nZSkpKHZhbHVlcykpO1xuICAgIH1cblxuICAgIC8vIENsZWFycyBhbnkgZmlsdGVycyBvbiB0aGlzIGRpbWVuc2lvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgICByZXR1cm4gZmlsdGVySW5kZXhCb3VuZHMoKHJlZmlsdGVyID0gY3Jvc3NmaWx0ZXJfZmlsdGVyQWxsKSh2YWx1ZXMpKTtcbiAgICB9XG5cbiAgICAvLyBGaWx0ZXJzIHRoaXMgZGltZW5zaW9uIHVzaW5nIGFuIGFyYml0cmFyeSBmdW5jdGlvbi5cbiAgICBmdW5jdGlvbiBmaWx0ZXJGdW5jdGlvbihmKSB7XG4gICAgICByZWZpbHRlciA9IGNyb3NzZmlsdGVyX2ZpbHRlckFsbDtcblxuICAgICAgZmlsdGVySW5kZXhGdW5jdGlvbihyZWZpbHRlckZ1bmN0aW9uID0gZik7XG5cbiAgICAgIGxvMCA9IDA7XG4gICAgICBoaTAgPSBuO1xuXG4gICAgICByZXR1cm4gZGltZW5zaW9uO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZpbHRlckluZGV4RnVuY3Rpb24oZikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICB4LFxuICAgICAgICAgIGFkZGVkID0gW10sXG4gICAgICAgICAgcmVtb3ZlZCA9IFtdO1xuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmICghKGZpbHRlcnNbb2Zmc2V0XVtrID0gaW5kZXhbaV1dICYgb25lKSBeICEhKHggPSBmKHZhbHVlc1tpXSwgaSkpKSB7XG4gICAgICAgICAgaWYgKHgpIGZpbHRlcnNbb2Zmc2V0XVtrXSAmPSB6ZXJvLCBhZGRlZC5wdXNoKGspO1xuICAgICAgICAgIGVsc2UgZmlsdGVyc1tvZmZzZXRdW2tdIHw9IG9uZSwgcmVtb3ZlZC5wdXNoKGspO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbihsKSB7IGwob25lLCBvZmZzZXQsIGFkZGVkLCByZW1vdmVkKTsgfSk7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJucyB0aGUgdG9wIEsgc2VsZWN0ZWQgcmVjb3JkcyBiYXNlZCBvbiB0aGlzIGRpbWVuc2lvbidzIG9yZGVyLlxuICAgIC8vIE5vdGU6IG9ic2VydmVzIHRoaXMgZGltZW5zaW9uJ3MgZmlsdGVyLCB1bmxpa2UgZ3JvdXAgYW5kIGdyb3VwQWxsLlxuICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICB2YXIgYXJyYXkgPSBbXSxcbiAgICAgICAgICBpID0gaGkwLFxuICAgICAgICAgIGo7XG5cbiAgICAgIHdoaWxlICgtLWkgPj0gbG8wICYmIGsgPiAwKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oaiA9IGluZGV4W2ldKSkge1xuICAgICAgICAgIGFycmF5LnB1c2goZGF0YVtqXSk7XG4gICAgICAgICAgLS1rO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBib3R0b20gSyBzZWxlY3RlZCByZWNvcmRzIGJhc2VkIG9uIHRoaXMgZGltZW5zaW9uJ3Mgb3JkZXIuXG4gICAgLy8gTm90ZTogb2JzZXJ2ZXMgdGhpcyBkaW1lbnNpb24ncyBmaWx0ZXIsIHVubGlrZSBncm91cCBhbmQgZ3JvdXBBbGwuXG4gICAgZnVuY3Rpb24gYm90dG9tKGspIHtcbiAgICAgIHZhciBhcnJheSA9IFtdLFxuICAgICAgICAgIGkgPSBsbzAsXG4gICAgICAgICAgajtcblxuICAgICAgd2hpbGUgKGkgPCBoaTAgJiYgayA+IDApIHtcbiAgICAgICAgaWYgKGZpbHRlcnMuemVybyhqID0gaW5kZXhbaV0pKSB7XG4gICAgICAgICAgYXJyYXkucHVzaChkYXRhW2pdKTtcbiAgICAgICAgICAtLWs7XG4gICAgICAgIH1cbiAgICAgICAgaSsrO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuXG4gICAgLy8gQWRkcyBhIG5ldyBncm91cCB0byB0aGlzIGRpbWVuc2lvbiwgdXNpbmcgdGhlIHNwZWNpZmllZCBrZXkgZnVuY3Rpb24uXG4gICAgZnVuY3Rpb24gZ3JvdXAoa2V5KSB7XG4gICAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICAgIHRvcDogdG9wLFxuICAgICAgICBhbGw6IGFsbCxcbiAgICAgICAgcmVkdWNlOiByZWR1Y2UsXG4gICAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgICAgcmVkdWNlU3VtOiByZWR1Y2VTdW0sXG4gICAgICAgIG9yZGVyOiBvcmRlcixcbiAgICAgICAgb3JkZXJOYXR1cmFsOiBvcmRlck5hdHVyYWwsXG4gICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgIGRpc3Bvc2U6IGRpc3Bvc2UsXG4gICAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICAgIH07XG5cbiAgICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZ3JvdXAgd2lsbCBiZSByZW1vdmVkIHdoZW4gdGhlIGRpbWVuc2lvbiBpcyByZW1vdmVkLlxuICAgICAgZGltZW5zaW9uR3JvdXBzLnB1c2goZ3JvdXApO1xuXG4gICAgICB2YXIgZ3JvdXBzLCAvLyBhcnJheSBvZiB7a2V5LCB2YWx1ZX1cbiAgICAgICAgICBncm91cEluZGV4LCAvLyBvYmplY3QgaWQg4oamIGdyb3VwIGlkXG4gICAgICAgICAgZ3JvdXBXaWR0aCA9IDgsXG4gICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpLFxuICAgICAgICAgIGsgPSAwLCAvLyBjYXJkaW5hbGl0eVxuICAgICAgICAgIHNlbGVjdCxcbiAgICAgICAgICBoZWFwLFxuICAgICAgICAgIHJlZHVjZUFkZCxcbiAgICAgICAgICByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsLFxuICAgICAgICAgIHJlc2V0ID0gY3Jvc3NmaWx0ZXJfbnVsbCxcbiAgICAgICAgICByZXNldE5lZWRlZCA9IHRydWUsXG4gICAgICAgICAgZ3JvdXBBbGwgPSBrZXkgPT09IGNyb3NzZmlsdGVyX251bGw7XG5cbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMSkga2V5ID0gY3Jvc3NmaWx0ZXJfaWRlbnRpdHk7XG5cbiAgICAgIC8vIFRoZSBncm91cCBsaXN0ZW5zIHRvIHRoZSBjcm9zc2ZpbHRlciBmb3Igd2hlbiBhbnkgZGltZW5zaW9uIGNoYW5nZXMsIHNvXG4gICAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIGFzc29jaWF0ZWQgcmVkdWNlIHZhbHVlcy4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0b1xuICAgICAgLy8gdGhlIHBhcmVudCBkaW1lbnNpb24gZm9yIHdoZW4gZGF0YSBpcyBhZGRlZCwgYW5kIGNvbXB1dGUgbmV3IGtleXMuXG4gICAgICBmaWx0ZXJMaXN0ZW5lcnMucHVzaCh1cGRhdGUpO1xuICAgICAgaW5kZXhMaXN0ZW5lcnMucHVzaChhZGQpO1xuICAgICAgcmVtb3ZlRGF0YUxpc3RlbmVycy5wdXNoKHJlbW92ZURhdGEpO1xuXG4gICAgICAvLyBJbmNvcnBvcmF0ZSBhbnkgZXhpc3RpbmcgZGF0YSBpbnRvIHRoZSBncm91cGluZy5cbiAgICAgIGFkZCh2YWx1ZXMsIGluZGV4LCAwLCBuKTtcblxuICAgICAgLy8gSW5jb3Jwb3JhdGVzIHRoZSBzcGVjaWZpZWQgbmV3IHZhbHVlcyBpbnRvIHRoaXMgZ3JvdXAuXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHJlc3BvbnNpYmxlIGZvciB1cGRhdGluZyBncm91cHMgYW5kIGdyb3VwSW5kZXguXG4gICAgICBmdW5jdGlvbiBhZGQobmV3VmFsdWVzLCBuZXdJbmRleCwgbjAsIG4xKSB7XG4gICAgICAgIHZhciBvbGRHcm91cHMgPSBncm91cHMsXG4gICAgICAgICAgICByZUluZGV4ID0gY3Jvc3NmaWx0ZXJfaW5kZXgoaywgZ3JvdXBDYXBhY2l0eSksXG4gICAgICAgICAgICBhZGQgPSByZWR1Y2VBZGQsXG4gICAgICAgICAgICByZW1vdmUgPSByZWR1Y2VSZW1vdmUsXG4gICAgICAgICAgICBpbml0aWFsID0gcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgICAgIGswID0gaywgLy8gb2xkIGNhcmRpbmFsaXR5XG4gICAgICAgICAgICBpMCA9IDAsIC8vIGluZGV4IG9mIG9sZCBncm91cFxuICAgICAgICAgICAgaTEgPSAwLCAvLyBpbmRleCBvZiBuZXcgcmVjb3JkXG4gICAgICAgICAgICBqLCAvLyBvYmplY3QgaWRcbiAgICAgICAgICAgIGcwLCAvLyBvbGQgZ3JvdXBcbiAgICAgICAgICAgIHgwLCAvLyBvbGQga2V5XG4gICAgICAgICAgICB4MSwgLy8gbmV3IGtleVxuICAgICAgICAgICAgZywgLy8gZ3JvdXAgdG8gYWRkXG4gICAgICAgICAgICB4OyAvLyBrZXkgb2YgZ3JvdXAgdG8gYWRkXG5cbiAgICAgICAgLy8gSWYgYSByZXNldCBpcyBuZWVkZWQsIHdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIHRoZSByZWR1Y2UgdmFsdWVzLlxuICAgICAgICBpZiAocmVzZXROZWVkZWQpIGFkZCA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICBpZiAocmVzZXROZWVkZWQpIHJlbW92ZSA9IGluaXRpYWwgPSBjcm9zc2ZpbHRlcl9udWxsO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBuZXcgZ3JvdXBzIChrIGlzIGEgbG93ZXIgYm91bmQpLlxuICAgICAgICAvLyBBbHNvLCBtYWtlIHN1cmUgdGhhdCBncm91cEluZGV4IGV4aXN0cyBhbmQgaXMgbG9uZyBlbm91Z2guXG4gICAgICAgIGdyb3VwcyA9IG5ldyBBcnJheShrKSwgayA9IDA7XG4gICAgICAgIGdyb3VwSW5kZXggPSBrMCA+IDEgPyBjcm9zc2ZpbHRlcl9hcnJheUxlbmd0aGVuKGdyb3VwSW5kZXgsIG4pIDogY3Jvc3NmaWx0ZXJfaW5kZXgobiwgZ3JvdXBDYXBhY2l0eSk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBmaXJzdCBvbGQga2V5ICh4MCBvZiBnMCksIGlmIGl0IGV4aXN0cy5cbiAgICAgICAgaWYgKGswKSB4MCA9IChnMCA9IG9sZEdyb3Vwc1swXSkua2V5O1xuXG4gICAgICAgIC8vIEZpbmQgdGhlIGZpcnN0IG5ldyBrZXkgKHgxKSwgc2tpcHBpbmcgTmFOIGtleXMuXG4gICAgICAgIHdoaWxlIChpMSA8IG4xICYmICEoKHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pKSA+PSB4MSkpICsraTE7XG5cbiAgICAgICAgLy8gV2hpbGUgbmV3IGtleXMgcmVtYWlu4oCmXG4gICAgICAgIHdoaWxlIChpMSA8IG4xKSB7XG5cbiAgICAgICAgICAvLyBEZXRlcm1pbmUgdGhlIGxlc3NlciBvZiB0aGUgdHdvIGN1cnJlbnQga2V5czsgbmV3IGFuZCBvbGQuXG4gICAgICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG9sZCBrZXlzIHJlbWFpbmluZywgdGhlbiBhbHdheXMgYWRkIHRoZSBuZXcga2V5LlxuICAgICAgICAgIGlmIChnMCAmJiB4MCA8PSB4MSkge1xuICAgICAgICAgICAgZyA9IGcwLCB4ID0geDA7XG5cbiAgICAgICAgICAgIC8vIFJlY29yZCB0aGUgbmV3IGluZGV4IG9mIHRoZSBvbGQgZ3JvdXAuXG4gICAgICAgICAgICByZUluZGV4W2kwXSA9IGs7XG5cbiAgICAgICAgICAgIC8vIFJldHJpZXZlIHRoZSBuZXh0IG9sZCBrZXkuXG4gICAgICAgICAgICBpZiAoZzAgPSBvbGRHcm91cHNbKytpMF0pIHgwID0gZzAua2V5O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnID0ge2tleTogeDEsIHZhbHVlOiBpbml0aWFsKCl9LCB4ID0geDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gQWRkIHRoZSBsZXNzZXIgZ3JvdXAuXG4gICAgICAgICAgZ3JvdXBzW2tdID0gZztcblxuICAgICAgICAgIC8vIEFkZCBhbnkgc2VsZWN0ZWQgcmVjb3JkcyBiZWxvbmdpbmcgdG8gdGhlIGFkZGVkIGdyb3VwLCB3aGlsZVxuICAgICAgICAgIC8vIGFkdmFuY2luZyB0aGUgbmV3IGtleSBhbmQgcG9wdWxhdGluZyB0aGUgYXNzb2NpYXRlZCBncm91cCBpbmRleC5cbiAgICAgICAgICB3aGlsZSAoISh4MSA+IHgpKSB7XG4gICAgICAgICAgICBncm91cEluZGV4W2ogPSBuZXdJbmRleFtpMV0gKyBuMF0gPSBrO1xuXG4gICAgICAgICAgICAvLyBBbHdheXMgYWRkIG5ldyB2YWx1ZXMgdG8gZ3JvdXBzLiBPbmx5IHJlbW92ZSB3aGVuIG5vdCBpbiBmaWx0ZXIuXG4gICAgICAgICAgICAvLyBUaGlzIGdpdmVzIGdyb3VwcyBmdWxsIGluZm9ybWF0aW9uIG9uIGRhdGEgbGlmZS1jeWNsZS5cbiAgICAgICAgICAgIGcudmFsdWUgPSBhZGQoZy52YWx1ZSwgZGF0YVtqXSwgdHJ1ZSk7XG4gICAgICAgICAgICBpZiAoIWZpbHRlcnMuemVyb0V4Y2VwdChqLCBvZmZzZXQsIHplcm8pKSBnLnZhbHVlID0gcmVtb3ZlKGcudmFsdWUsIGRhdGFbal0sIGZhbHNlKTtcbiAgICAgICAgICAgIGlmICgrK2kxID49IG4xKSBicmVhaztcbiAgICAgICAgICAgIHgxID0ga2V5KG5ld1ZhbHVlc1tpMV0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgYW55IHJlbWFpbmluZyBvbGQgZ3JvdXBzIHRoYXQgd2VyZSBncmVhdGVyIHRoYW4gYWxsIG5ldyBrZXlzLlxuICAgICAgICAvLyBObyBpbmNyZW1lbnRhbCByZWR1Y2UgaXMgbmVlZGVkOyB0aGVzZSBncm91cHMgaGF2ZSBubyBuZXcgcmVjb3Jkcy5cbiAgICAgICAgLy8gQWxzbyByZWNvcmQgdGhlIG5ldyBpbmRleCBvZiB0aGUgb2xkIGdyb3VwLlxuICAgICAgICB3aGlsZSAoaTAgPCBrMCkge1xuICAgICAgICAgIGdyb3Vwc1tyZUluZGV4W2kwXSA9IGtdID0gb2xkR3JvdXBzW2kwKytdO1xuICAgICAgICAgIGdyb3VwSW5jcmVtZW50KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB3ZSBhZGRlZCBhbnkgbmV3IGdyb3VwcyBiZWZvcmUgYW55IG9sZCBncm91cHMsXG4gICAgICAgIC8vIHVwZGF0ZSB0aGUgZ3JvdXAgaW5kZXggb2YgYWxsIHRoZSBvbGQgcmVjb3Jkcy5cbiAgICAgICAgaWYgKGsgPiBpMCkgZm9yIChpMCA9IDA7IGkwIDwgbjA7ICsraTApIHtcbiAgICAgICAgICBncm91cEluZGV4W2kwXSA9IHJlSW5kZXhbZ3JvdXBJbmRleFtpMF1dO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTW9kaWZ5IHRoZSB1cGRhdGUgYW5kIHJlc2V0IGJlaGF2aW9yIGJhc2VkIG9uIHRoZSBjYXJkaW5hbGl0eS5cbiAgICAgICAgLy8gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBvbmUsIHRoZW4gdGhlIGdyb3VwSW5kZXhcbiAgICAgICAgLy8gaXMgbm90IG5lZWRlZC4gSWYgdGhlIGNhcmRpbmFsaXR5IGlzIHplcm8sIHRoZW4gdGhlcmUgYXJlIG5vIHJlY29yZHNcbiAgICAgICAgLy8gYW5kIHRoZXJlZm9yZSBubyBncm91cHMgdG8gdXBkYXRlIG9yIHJlc2V0LiBOb3RlIHRoYXQgd2UgYWxzbyBtdXN0XG4gICAgICAgIC8vIGNoYW5nZSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciB0byBwb2ludCB0byB0aGUgbmV3IG1ldGhvZC5cbiAgICAgICAgaiA9IGZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSk7XG4gICAgICAgIGlmIChrID4gMSkge1xuICAgICAgICAgIHVwZGF0ZSA9IHVwZGF0ZU1hbnk7XG4gICAgICAgICAgcmVzZXQgPSByZXNldE1hbnk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFrICYmIGdyb3VwQWxsKSB7XG4gICAgICAgICAgICBrID0gMTtcbiAgICAgICAgICAgIGdyb3VwcyA9IFt7a2V5OiBudWxsLCB2YWx1ZTogaW5pdGlhbCgpfV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChrID09PSAxKSB7XG4gICAgICAgICAgICB1cGRhdGUgPSB1cGRhdGVPbmU7XG4gICAgICAgICAgICByZXNldCA9IHJlc2V0T25lO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgICAgcmVzZXQgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJMaXN0ZW5lcnNbal0gPSB1cGRhdGU7XG5cbiAgICAgICAgLy8gQ291bnQgdGhlIG51bWJlciBvZiBhZGRlZCBncm91cHMsXG4gICAgICAgIC8vIGFuZCB3aWRlbiB0aGUgZ3JvdXAgaW5kZXggYXMgbmVlZGVkLlxuICAgICAgICBmdW5jdGlvbiBncm91cEluY3JlbWVudCgpIHtcbiAgICAgICAgICBpZiAoKytrID09PSBncm91cENhcGFjaXR5KSB7XG4gICAgICAgICAgICByZUluZGV4ID0gY3Jvc3NmaWx0ZXJfYXJyYXlXaWRlbihyZUluZGV4LCBncm91cFdpZHRoIDw8PSAxKTtcbiAgICAgICAgICAgIGdyb3VwSW5kZXggPSBjcm9zc2ZpbHRlcl9hcnJheVdpZGVuKGdyb3VwSW5kZXgsIGdyb3VwV2lkdGgpO1xuICAgICAgICAgICAgZ3JvdXBDYXBhY2l0eSA9IGNyb3NzZmlsdGVyX2NhcGFjaXR5KGdyb3VwV2lkdGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZW1vdmVEYXRhKCkge1xuICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICB2YXIgb2xkSyA9IGssXG4gICAgICAgICAgICAgIG9sZEdyb3VwcyA9IGdyb3VwcyxcbiAgICAgICAgICAgICAgc2Vlbkdyb3VwcyA9IGNyb3NzZmlsdGVyX2luZGV4KG9sZEssIG9sZEspO1xuXG4gICAgICAgICAgLy8gRmlsdGVyIG91dCBub24tbWF0Y2hlcyBieSBjb3B5aW5nIG1hdGNoaW5nIGdyb3VwIGluZGV4IGVudHJpZXMgdG9cbiAgICAgICAgICAvLyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhcnJheS5cbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgICAgIHNlZW5Hcm91cHNbZ3JvdXBJbmRleFtqXSA9IGdyb3VwSW5kZXhbaV1dID0gMTtcbiAgICAgICAgICAgICAgKytqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFJlYXNzZW1ibGUgZ3JvdXBzIGluY2x1ZGluZyBvbmx5IHRob3NlIGdyb3VwcyB0aGF0IHdlcmUgcmVmZXJyZWRcbiAgICAgICAgICAvLyB0byBieSBtYXRjaGluZyBncm91cCBpbmRleCBlbnRyaWVzLiAgTm90ZSB0aGUgbmV3IGdyb3VwIGluZGV4IGluXG4gICAgICAgICAgLy8gc2Vlbkdyb3Vwcy5cbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZm9yIChpID0gMDsgaSA8IG9sZEs7ICsraSkge1xuICAgICAgICAgICAgaWYgKHNlZW5Hcm91cHNbaV0pIHtcbiAgICAgICAgICAgICAgc2Vlbkdyb3Vwc1tpXSA9IGsrKztcbiAgICAgICAgICAgICAgZ3JvdXBzLnB1c2gob2xkR3JvdXBzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoayA+IDEpIHtcbiAgICAgICAgICAgIC8vIFJlaW5kZXggdGhlIGdyb3VwIGluZGV4IHVzaW5nIHNlZW5Hcm91cHMgdG8gZmluZCB0aGUgbmV3IGluZGV4LlxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBqOyArK2kpIGdyb3VwSW5kZXhbaV0gPSBzZWVuR3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBncm91cEluZGV4ID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID0gayA+IDFcbiAgICAgICAgICAgICAgPyAocmVzZXQgPSByZXNldE1hbnksIHVwZGF0ZSA9IHVwZGF0ZU1hbnkpXG4gICAgICAgICAgICAgIDogayA9PT0gMSA/IChyZXNldCA9IHJlc2V0T25lLCB1cGRhdGUgPSB1cGRhdGVPbmUpXG4gICAgICAgICAgICAgIDogcmVzZXQgPSB1cGRhdGUgPSBjcm9zc2ZpbHRlcl9udWxsO1xuICAgICAgICB9IGVsc2UgaWYgKGsgPT09IDEpIHtcbiAgICAgICAgICBpZiAoZ3JvdXBBbGwpIHJldHVybjtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkgaWYgKCFmaWx0ZXJzLnplcm8oaSkpIHJldHVybjtcbiAgICAgICAgICBncm91cHMgPSBbXSwgayA9IDA7XG4gICAgICAgICAgZmlsdGVyTGlzdGVuZXJzW2ZpbHRlckxpc3RlbmVycy5pbmRleE9mKHVwZGF0ZSldID1cbiAgICAgICAgICB1cGRhdGUgPSByZXNldCA9IGNyb3NzZmlsdGVyX251bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVkdWNlcyB0aGUgc3BlY2lmaWVkIHNlbGVjdGVkIG9yIGRlc2VsZWN0ZWQgcmVjb3Jkcy5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIGdyZWF0ZXIgdGhhbiAxLlxuICAgICAgLy8gbm90RmlsdGVyIGluZGljYXRlcyBhIGNyb3NzZmlsdGVyLmFkZC9yZW1vdmUgb3BlcmF0aW9uLlxuICAgICAgZnVuY3Rpb24gdXBkYXRlTWFueShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcgPSBncm91cHNbZ3JvdXBJbmRleFtrXV07XG4gICAgICAgICAgICBnLnZhbHVlID0gcmVkdWNlQWRkKGcudmFsdWUsIGRhdGFba10pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGlmIChmaWx0ZXJzLm9ubHlFeGNlcHQoayA9IHJlbW92ZWRbaV0sIG9mZnNldCwgemVybywgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhba11dO1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgICAgLy8gVGhpcyBmdW5jdGlvbiBpcyBvbmx5IHVzZWQgd2hlbiB0aGUgY2FyZGluYWxpdHkgaXMgMS5cbiAgICAgIC8vIG5vdEZpbHRlciBpbmRpY2F0ZXMgYSBjcm9zc2ZpbHRlci5hZGQvcmVtb3ZlIG9wZXJhdGlvbi5cbiAgICAgIGZ1bmN0aW9uIHVwZGF0ZU9uZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgICBpZiAoKGZpbHRlck9uZSA9PT0gb25lICYmIGZpbHRlck9mZnNldCA9PT0gb2Zmc2V0KSB8fCByZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpLFxuICAgICAgICAgICAgayxcbiAgICAgICAgICAgIG4sXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIEFkZCB0aGUgYWRkZWQgdmFsdWVzLlxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMuemVyb0V4Y2VwdChrID0gYWRkZWRbaV0sIG9mZnNldCwgemVybykpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtrXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSByZW1vdmVkIHZhbHVlcy5cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKGZpbHRlcnMub25seUV4Y2VwdChrID0gcmVtb3ZlZFtpXSwgb2Zmc2V0LCB6ZXJvLCBmaWx0ZXJPZmZzZXQsIGZpbHRlck9uZSkpIHtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtrXSwgbm90RmlsdGVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUmVjb21wdXRlcyB0aGUgZ3JvdXAgcmVkdWNlIHZhbHVlcyBmcm9tIHNjcmF0Y2guXG4gICAgICAvLyBUaGlzIGZ1bmN0aW9uIGlzIG9ubHkgdXNlZCB3aGVuIHRoZSBjYXJkaW5hbGl0eSBpcyBncmVhdGVyIHRoYW4gMS5cbiAgICAgIGZ1bmN0aW9uIHJlc2V0TWFueSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnO1xuXG4gICAgICAgIC8vIFJlc2V0IGFsbCBncm91cCB2YWx1ZXMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBrOyArK2kpIHtcbiAgICAgICAgICBncm91cHNbaV0udmFsdWUgPSByZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBXZSBhZGQgYWxsIHJlY29yZHMgYW5kIHRoZW4gcmVtb3ZlIGZpbHRlcmVkIHJlY29yZHMgc28gdGhhdCByZWR1Y2Vyc1xuICAgICAgICAvLyBjYW4gYnVpbGQgYW4gJ3VuZmlsdGVyZWQnIHZpZXcgZXZlbiBpZiB0aGVyZSBhcmUgYWxyZWFkeSBmaWx0ZXJzIGluXG4gICAgICAgIC8vIHBsYWNlIG9uIG90aGVyIGRpbWVuc2lvbnMuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICBnID0gZ3JvdXBzW2dyb3VwSW5kZXhbaV1dO1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZyA9IGdyb3Vwc1tncm91cEluZGV4W2ldXTtcbiAgICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VSZW1vdmUoZy52YWx1ZSwgZGF0YVtpXSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWVzIGZyb20gc2NyYXRjaC5cbiAgICAgIC8vIFRoaXMgZnVuY3Rpb24gaXMgb25seSB1c2VkIHdoZW4gdGhlIGNhcmRpbmFsaXR5IGlzIDEuXG4gICAgICBmdW5jdGlvbiByZXNldE9uZSgpIHtcbiAgICAgICAgdmFyIGksXG4gICAgICAgICAgICBnID0gZ3JvdXBzWzBdO1xuXG4gICAgICAgIC8vIFJlc2V0IHRoZSBzaW5nbGV0b24gZ3JvdXAgdmFsdWVzLlxuICAgICAgICBnLnZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAgIC8vIFdlIGFkZCBhbGwgcmVjb3JkcyBhbmQgdGhlbiByZW1vdmUgZmlsdGVyZWQgcmVjb3JkcyBzbyB0aGF0IHJlZHVjZXJzXG4gICAgICAgIC8vIGNhbiBidWlsZCBhbiAndW5maWx0ZXJlZCcgdmlldyBldmVuIGlmIHRoZXJlIGFyZSBhbHJlYWR5IGZpbHRlcnMgaW5cbiAgICAgICAgLy8gcGxhY2Ugb24gb3RoZXIgZGltZW5zaW9ucy5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgIGcudmFsdWUgPSByZWR1Y2VBZGQoZy52YWx1ZSwgZGF0YVtpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgaWYgKCFmaWx0ZXJzLnplcm9FeGNlcHQoaSwgb2Zmc2V0LCB6ZXJvKSkge1xuICAgICAgICAgICAgZy52YWx1ZSA9IHJlZHVjZVJlbW92ZShnLnZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJldHVybnMgdGhlIGFycmF5IG9mIGdyb3VwIHZhbHVlcywgaW4gdGhlIGRpbWVuc2lvbidzIG5hdHVyYWwgb3JkZXIuXG4gICAgICBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGlmIChyZXNldE5lZWRlZCkgcmVzZXQoKSwgcmVzZXROZWVkZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH1cblxuICAgICAgLy8gUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHRoZSB0b3AgSyBncm91cCB2YWx1ZXMsIGluIHJlZHVjZSBvcmRlci5cbiAgICAgIGZ1bmN0aW9uIHRvcChrKSB7XG4gICAgICAgIHZhciB0b3AgPSBzZWxlY3QoYWxsKCksIDAsIGdyb3Vwcy5sZW5ndGgsIGspO1xuICAgICAgICByZXR1cm4gaGVhcC5zb3J0KHRvcCwgMCwgdG9wLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgICAvLyBUaGlzIG1ldGhvZCBsYXppbHkgcmVjb21wdXRlcyB0aGUgcmVkdWNlIHZhbHVlcywgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgICBmdW5jdGlvbiByZWR1Y2UoYWRkLCByZW1vdmUsIGluaXRpYWwpIHtcbiAgICAgICAgcmVkdWNlQWRkID0gYWRkO1xuICAgICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICAgIHJlZHVjZUluaXRpYWwgPSBpbml0aWFsO1xuICAgICAgICByZXNldE5lZWRlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIHJlZHVjaW5nIGJ5IGNvdW50LlxuICAgICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlSW5jcmVtZW50LCBjcm9zc2ZpbHRlcl9yZWR1Y2VEZWNyZW1lbnQsIGNyb3NzZmlsdGVyX3plcm8pO1xuICAgICAgfVxuXG4gICAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICAgIGZ1bmN0aW9uIHJlZHVjZVN1bSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUFkZCh2YWx1ZSksIGNyb3NzZmlsdGVyX3JlZHVjZVN1YnRyYWN0KHZhbHVlKSwgY3Jvc3NmaWx0ZXJfemVybyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHJlZHVjZSBvcmRlciwgdXNpbmcgdGhlIHNwZWNpZmllZCBhY2Nlc3Nvci5cbiAgICAgIGZ1bmN0aW9uIG9yZGVyKHZhbHVlKSB7XG4gICAgICAgIHNlbGVjdCA9IGhlYXBzZWxlY3RfYnkodmFsdWVPZik7XG4gICAgICAgIGhlYXAgPSBoZWFwX2J5KHZhbHVlT2YpO1xuICAgICAgICBmdW5jdGlvbiB2YWx1ZU9mKGQpIHsgcmV0dXJuIHZhbHVlKGQudmFsdWUpOyB9XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cblxuICAgICAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIG5hdHVyYWwgb3JkZXJpbmcgYnkgcmVkdWNlIHZhbHVlLlxuICAgICAgZnVuY3Rpb24gb3JkZXJOYXR1cmFsKCkge1xuICAgICAgICByZXR1cm4gb3JkZXIoY3Jvc3NmaWx0ZXJfaWRlbnRpdHkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXR1cm5zIHRoZSBjYXJkaW5hbGl0eSBvZiB0aGlzIGdyb3VwLCBpcnJlc3BlY3RpdmUgb2YgYW55IGZpbHRlcnMuXG4gICAgICBmdW5jdGlvbiBzaXplKCkge1xuICAgICAgICByZXR1cm4gaztcbiAgICAgIH1cblxuICAgICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgIHZhciBpID0gZmlsdGVyTGlzdGVuZXJzLmluZGV4T2YodXBkYXRlKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgaSA9IGluZGV4TGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgICAgaWYgKGkgPj0gMCkgaW5kZXhMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgICBpZiAoaSA+PSAwKSByZW1vdmVEYXRhTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVkdWNlQ291bnQoKS5vcmRlck5hdHVyYWwoKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIGZ1bmN0aW9uIGZvciBnZW5lcmF0aW5nIGEgc2luZ2xldG9uIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGdyb3VwQWxsKCkge1xuICAgICAgdmFyIGcgPSBncm91cChjcm9zc2ZpbHRlcl9udWxsKSwgYWxsID0gZy5hbGw7XG4gICAgICBkZWxldGUgZy5hbGw7XG4gICAgICBkZWxldGUgZy50b3A7XG4gICAgICBkZWxldGUgZy5vcmRlcjtcbiAgICAgIGRlbGV0ZSBnLm9yZGVyTmF0dXJhbDtcbiAgICAgIGRlbGV0ZSBnLnNpemU7XG4gICAgICBnLnZhbHVlID0gZnVuY3Rpb24oKSB7IHJldHVybiBhbGwoKVswXS52YWx1ZTsgfTtcbiAgICAgIHJldHVybiBnO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZXMgdGhpcyBkaW1lbnNpb24gYW5kIGFzc29jaWF0ZWQgZ3JvdXBzIGFuZCBldmVudCBsaXN0ZW5lcnMuXG4gICAgZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgIGRpbWVuc2lvbkdyb3Vwcy5mb3JFYWNoKGZ1bmN0aW9uKGdyb3VwKSB7IGdyb3VwLmRpc3Bvc2UoKTsgfSk7XG4gICAgICB2YXIgaSA9IGRhdGFMaXN0ZW5lcnMuaW5kZXhPZihwcmVBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gZGF0YUxpc3RlbmVycy5pbmRleE9mKHBvc3RBZGQpO1xuICAgICAgaWYgKGkgPj0gMCkgZGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBpID0gcmVtb3ZlRGF0YUxpc3RlbmVycy5pbmRleE9mKHJlbW92ZURhdGEpO1xuICAgICAgaWYgKGkgPj0gMCkgcmVtb3ZlRGF0YUxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICBmaWx0ZXJzLm1hc2tzW29mZnNldF0gJj0gemVybztcbiAgICAgIHJldHVybiBmaWx0ZXJBbGwoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGltZW5zaW9uO1xuICB9XG5cbiAgLy8gQSBjb252ZW5pZW5jZSBtZXRob2QgZm9yIGdyb3VwQWxsIG9uIGEgZHVtbXkgZGltZW5zaW9uLlxuICAvLyBUaGlzIGltcGxlbWVudGF0aW9uIGNhbiBiZSBvcHRpbWl6ZWQgc2luY2UgaXQgYWx3YXlzIGhhcyBjYXJkaW5hbGl0eSAxLlxuICBmdW5jdGlvbiBncm91cEFsbCgpIHtcbiAgICB2YXIgZ3JvdXAgPSB7XG4gICAgICByZWR1Y2U6IHJlZHVjZSxcbiAgICAgIHJlZHVjZUNvdW50OiByZWR1Y2VDb3VudCxcbiAgICAgIHJlZHVjZVN1bTogcmVkdWNlU3VtLFxuICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgZGlzcG9zZTogZGlzcG9zZSxcbiAgICAgIHJlbW92ZTogZGlzcG9zZSAvLyBmb3IgYmFja3dhcmRzLWNvbXBhdGliaWxpdHlcbiAgICB9O1xuXG4gICAgdmFyIHJlZHVjZVZhbHVlLFxuICAgICAgICByZWR1Y2VBZGQsXG4gICAgICAgIHJlZHVjZVJlbW92ZSxcbiAgICAgICAgcmVkdWNlSW5pdGlhbCxcbiAgICAgICAgcmVzZXROZWVkZWQgPSB0cnVlO1xuXG4gICAgLy8gVGhlIGdyb3VwIGxpc3RlbnMgdG8gdGhlIGNyb3NzZmlsdGVyIGZvciB3aGVuIGFueSBkaW1lbnNpb24gY2hhbmdlcywgc29cbiAgICAvLyB0aGF0IGl0IGNhbiB1cGRhdGUgdGhlIHJlZHVjZSB2YWx1ZS4gSXQgbXVzdCBhbHNvIGxpc3RlbiB0byB0aGUgcGFyZW50XG4gICAgLy8gZGltZW5zaW9uIGZvciB3aGVuIGRhdGEgaXMgYWRkZWQuXG4gICAgZmlsdGVyTGlzdGVuZXJzLnB1c2godXBkYXRlKTtcbiAgICBkYXRhTGlzdGVuZXJzLnB1c2goYWRkKTtcblxuICAgIC8vIEZvciBjb25zaXN0ZW5jeTsgYWN0dWFsbHkgYSBuby1vcCBzaW5jZSByZXNldE5lZWRlZCBpcyB0cnVlLlxuICAgIGFkZChkYXRhLCAwLCBuKTtcblxuICAgIC8vIEluY29ycG9yYXRlcyB0aGUgc3BlY2lmaWVkIG5ldyB2YWx1ZXMgaW50byB0aGlzIGdyb3VwLlxuICAgIGZ1bmN0aW9uIGFkZChuZXdEYXRhLCBuMCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIGlmIChyZXNldE5lZWRlZCkgcmV0dXJuO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gbjA7IGkgPCBuOyArK2kpIHtcblxuICAgICAgICAvLyBBZGQgYWxsIHZhbHVlcyBhbGwgdGhlIHRpbWUuXG4gICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCB0cnVlKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIHZhbHVlIGlmIGZpbHRlcmVkLlxuICAgICAgICBpZiAoIWZpbHRlcnMuemVybyhpKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlUmVtb3ZlKHJlZHVjZVZhbHVlLCBkYXRhW2ldLCBmYWxzZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWR1Y2VzIHRoZSBzcGVjaWZpZWQgc2VsZWN0ZWQgb3IgZGVzZWxlY3RlZCByZWNvcmRzLlxuICAgIGZ1bmN0aW9uIHVwZGF0ZShmaWx0ZXJPbmUsIGZpbHRlck9mZnNldCwgYWRkZWQsIHJlbW92ZWQsIG5vdEZpbHRlcikge1xuICAgICAgdmFyIGksXG4gICAgICAgICAgayxcbiAgICAgICAgICBuO1xuXG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJldHVybjtcblxuICAgICAgLy8gQWRkIHRoZSBhZGRlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWQubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgIGlmIChmaWx0ZXJzLnplcm8oayA9IGFkZGVkW2ldKSkge1xuICAgICAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlQWRkKHJlZHVjZVZhbHVlLCBkYXRhW2tdLCBub3RGaWx0ZXIpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFJlbW92ZSB0aGUgcmVtb3ZlZCB2YWx1ZXMuXG4gICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZC5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgaWYgKGZpbHRlcnMub25seShrID0gcmVtb3ZlZFtpXSwgZmlsdGVyT2Zmc2V0LCBmaWx0ZXJPbmUpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFba10sIG5vdEZpbHRlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBSZWNvbXB1dGVzIHRoZSBncm91cCByZWR1Y2UgdmFsdWUgZnJvbSBzY3JhdGNoLlxuICAgIGZ1bmN0aW9uIHJlc2V0KCkge1xuICAgICAgdmFyIGk7XG5cbiAgICAgIHJlZHVjZVZhbHVlID0gcmVkdWNlSW5pdGlhbCgpO1xuXG4gICAgICAvLyBDeWNsZSB0aHJvdWdoIGFsbCB0aGUgdmFsdWVzLlxuICAgICAgZm9yIChpID0gMDsgaSA8IG47ICsraSkge1xuXG4gICAgICAgIC8vIEFkZCBhbGwgdmFsdWVzIGFsbCB0aGUgdGltZS5cbiAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VBZGQocmVkdWNlVmFsdWUsIGRhdGFbaV0sIHRydWUpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgdmFsdWUgaWYgaXQgaXMgZmlsdGVyZWQuXG4gICAgICAgIGlmICghZmlsdGVycy56ZXJvKGkpKSB7XG4gICAgICAgICAgcmVkdWNlVmFsdWUgPSByZWR1Y2VSZW1vdmUocmVkdWNlVmFsdWUsIGRhdGFbaV0sIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFNldHMgdGhlIHJlZHVjZSBiZWhhdmlvciBmb3IgdGhpcyBncm91cCB0byB1c2UgdGhlIHNwZWNpZmllZCBmdW5jdGlvbnMuXG4gICAgLy8gVGhpcyBtZXRob2QgbGF6aWx5IHJlY29tcHV0ZXMgdGhlIHJlZHVjZSB2YWx1ZSwgd2FpdGluZyB1bnRpbCBuZWVkZWQuXG4gICAgZnVuY3Rpb24gcmVkdWNlKGFkZCwgcmVtb3ZlLCBpbml0aWFsKSB7XG4gICAgICByZWR1Y2VBZGQgPSBhZGQ7XG4gICAgICByZWR1Y2VSZW1vdmUgPSByZW1vdmU7XG4gICAgICByZWR1Y2VJbml0aWFsID0gaW5pdGlhbDtcbiAgICAgIHJlc2V0TmVlZGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgY291bnQuXG4gICAgZnVuY3Rpb24gcmVkdWNlQ291bnQoKSB7XG4gICAgICByZXR1cm4gcmVkdWNlKGNyb3NzZmlsdGVyX3JlZHVjZUluY3JlbWVudCwgY3Jvc3NmaWx0ZXJfcmVkdWNlRGVjcmVtZW50LCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBBIGNvbnZlbmllbmNlIG1ldGhvZCBmb3IgcmVkdWNpbmcgYnkgc3VtKHZhbHVlKS5cbiAgICBmdW5jdGlvbiByZWR1Y2VTdW0odmFsdWUpIHtcbiAgICAgIHJldHVybiByZWR1Y2UoY3Jvc3NmaWx0ZXJfcmVkdWNlQWRkKHZhbHVlKSwgY3Jvc3NmaWx0ZXJfcmVkdWNlU3VidHJhY3QodmFsdWUpLCBjcm9zc2ZpbHRlcl96ZXJvKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm5zIHRoZSBjb21wdXRlZCByZWR1Y2UgdmFsdWUuXG4gICAgZnVuY3Rpb24gdmFsdWUoKSB7XG4gICAgICBpZiAocmVzZXROZWVkZWQpIHJlc2V0KCksIHJlc2V0TmVlZGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gcmVkdWNlVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlcyB0aGlzIGdyb3VwIGFuZCBhc3NvY2lhdGVkIGV2ZW50IGxpc3RlbmVycy5cbiAgICBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgdmFyIGkgPSBmaWx0ZXJMaXN0ZW5lcnMuaW5kZXhPZih1cGRhdGUpO1xuICAgICAgaWYgKGkgPj0gMCkgZmlsdGVyTGlzdGVuZXJzLnNwbGljZShpKTtcbiAgICAgIGkgPSBkYXRhTGlzdGVuZXJzLmluZGV4T2YoYWRkKTtcbiAgICAgIGlmIChpID49IDApIGRhdGFMaXN0ZW5lcnMuc3BsaWNlKGkpO1xuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cblxuICAgIHJldHVybiByZWR1Y2VDb3VudCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgbnVtYmVyIG9mIHJlY29yZHMgaW4gdGhpcyBjcm9zc2ZpbHRlciwgaXJyZXNwZWN0aXZlIG9mIGFueSBmaWx0ZXJzLlxuICBmdW5jdGlvbiBzaXplKCkge1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gUmV0dXJucyB0aGUgcmF3IHJvdyBkYXRhIGNvbnRhaW5lZCBpbiB0aGlzIGNyb3NzZmlsdGVyXG4gIGZ1bmN0aW9uIGFsbCgpe1xuICAgIHJldHVybiBkYXRhO1xuICB9XG5cbiAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGhcbiAgICAgID8gYWRkKGFyZ3VtZW50c1swXSlcbiAgICAgIDogY3Jvc3NmaWx0ZXI7XG59XG5cbi8vIFJldHVybnMgYW4gYXJyYXkgb2Ygc2l6ZSBuLCBiaWcgZW5vdWdoIHRvIHN0b3JlIGlkcyB1cCB0byBtLlxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfaW5kZXgobiwgbSkge1xuICByZXR1cm4gKG0gPCAweDEwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTggOiBtIDwgMHgxMDAwMVxuICAgICAgPyBjcm9zc2ZpbHRlcl9hcnJheTE2XG4gICAgICA6IGNyb3NzZmlsdGVyX2FycmF5MzIpKG4pO1xufVxuXG4vLyBDb25zdHJ1Y3RzIGEgbmV3IGFycmF5IG9mIHNpemUgbiwgd2l0aCBzZXF1ZW50aWFsIHZhbHVlcyBmcm9tIDAgdG8gbiAtIDEuXG5mdW5jdGlvbiBjcm9zc2ZpbHRlcl9yYW5nZShuKSB7XG4gIHZhciByYW5nZSA9IGNyb3NzZmlsdGVyX2luZGV4KG4sIG4pO1xuICBmb3IgKHZhciBpID0gLTE7ICsraSA8IG47KSByYW5nZVtpXSA9IGk7XG4gIHJldHVybiByYW5nZTtcbn1cblxuZnVuY3Rpb24gY3Jvc3NmaWx0ZXJfY2FwYWNpdHkodykge1xuICByZXR1cm4gdyA9PT0gOFxuICAgICAgPyAweDEwMCA6IHcgPT09IDE2XG4gICAgICA/IDB4MTAwMDBcbiAgICAgIDogMHgxMDAwMDAwMDA7XG59XG59KSh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcgJiYgZXhwb3J0cyB8fCB0aGlzKTtcbiIsInZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gcmVxdWlyZSgnLi9wYXJhbWV0ZXJzLmpzJyk7XG5cbmZ1bmN0aW9uIGFjY2Vzc29yX2J1aWxkKG9iaiwgcCkge1xuXHQvLyBvYmoub3JkZXIgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHQvLyBcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAub3JkZXI7XG5cdC8vIFx0cC5vcmRlciA9IHZhbHVlO1xuXHQvLyBcdHJldHVybiBvYmo7XG5cdC8vIH07XG5cblx0Ly8gQ29udmVydHMgYSBzdHJpbmcgdG8gYW4gYWNjZXNzb3IgZnVuY3Rpb25cblx0ZnVuY3Rpb24gYWNjZXNzb3JpZnkodikge1xuXHRcdGlmKCB0eXBlb2YgdiA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHQvLyBSZXdyaXRlIHRvIGEgZnVuY3Rpb25cblx0XHRcdHZhciB0ZW1wVmFsdWUgPSB2O1xuXHRcdFx0dmFyIGZ1bmMgPSBmdW5jdGlvbiAoZCkgeyByZXR1cm4gZFt0ZW1wVmFsdWVdOyB9XG5cdFx0XHRyZXR1cm4gZnVuYztcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHY7XG5cdFx0fVxuXHR9XG5cblx0Ly8gQ29udmVydHMgYSBzdHJpbmcgdG8gYW4gYWNjZXNzb3IgZnVuY3Rpb25cblx0ZnVuY3Rpb24gYWNjZXNzb3JpZnlOdW1lcmljKHYpIHtcblx0XHRpZiggdHlwZW9mIHYgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0Ly8gUmV3cml0ZSB0byBhIGZ1bmN0aW9uXG5cdFx0XHR2YXIgdGVtcFZhbHVlID0gdjtcblx0XHRcdHZhciBmdW5jID0gZnVuY3Rpb24gKGQpIHsgcmV0dXJuICtkW3RlbXBWYWx1ZV07IH1cblx0XHRcdHJldHVybiBmdW5jO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdjtcblx0XHR9XG5cdH1cblxuXHRvYmouY291bnQgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuY291bnQ7XG5cdFx0cC5jb3VudCA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN1bSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdW07XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmF2ZyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hdmc7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHQvLyBXZSBjYW4gdGFrZSBhbiBhY2Nlc3NvciBmdW5jdGlvbiwgYSBib29sZWFuLCBvciBhIHN0cmluZ1xuXHRcdGlmKCB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgKSB7XG5cdFx0XHRpZihwLnN1bSkgY29uc29sZS53YXJuKCdTVU0gYWdncmVnYXRpb24gaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgQVZHIGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLnN1bSA9IHZhbHVlO1xuXHRcdFx0cC5hdmcgPSB0cnVlO1xuXHRcdFx0cC5jb3VudCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuYXZnID0gdmFsdWU7XG5cdFx0fVxuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmV4Y2VwdGlvbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5leGNlcHRpb25BY2Nlc3NvcjtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnkodmFsdWUpO1xuXG5cdFx0cC5leGNlcHRpb25BY2Nlc3NvciA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmZpbHRlciA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5maWx0ZXI7XG5cdFx0cC5maWx0ZXIgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai52YWx1ZUxpc3QgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAudmFsdWVMaXN0O1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeSh2YWx1ZSk7XG5cblx0XHRwLnZhbHVlTGlzdCA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLm1lZGlhbiA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5tZWRpYW47XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGlmKHAudmFsdWVMaXN0KSBjb25zb2xlLndhcm4oJ1ZBTFVFTElTVCBhY2Nlc3NvciBpcyBiZWluZyBvdmVyd3JpdHRlbiBieSBtZWRpYW4gYWdncmVnYXRpb24nKTtcblx0XHRcdHAudmFsdWVMaXN0ID0gdmFsdWU7XG5cdFx0fVxuXHRcdHAubWVkaWFuID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoubWluID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm1pbjtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdGlmKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0aWYocC52YWx1ZUxpc3QpIGNvbnNvbGUud2FybignVkFMVUVMSVNUIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IG1lZGlhbiBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC52YWx1ZUxpc3QgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cC5taW4gPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5tYXggPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAubWF4O1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeU51bWVyaWModmFsdWUpO1xuXG5cdFx0aWYodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZihwLnZhbHVlTGlzdCkgY29uc29sZS53YXJuKCdWQUxVRUxJU1QgYWNjZXNzb3IgaXMgYmVpbmcgb3ZlcndyaXR0ZW4gYnkgbWVkaWFuIGFnZ3JlZ2F0aW9uJyk7XG5cdFx0XHRwLnZhbHVlTGlzdCA9IHZhbHVlO1xuXHRcdH1cblx0XHRwLm1heCA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmV4Y2VwdGlvbkNvdW50ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvbkNvdW50O1xuXG5cdFx0dmFsdWUgPSBhY2Nlc3NvcmlmeSh2YWx1ZSk7XG5cblx0XHRpZiggdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICkge1xuXHRcdFx0aWYocC5zdW0pIGNvbnNvbGUud2FybignRVhDRVBUSU9OIGFjY2Vzc29yIGlzIGJlaW5nIG92ZXJ3cml0dGVuIGJ5IGV4Y2VwdGlvbiBjb3VudCBhZ2dyZWdhdGlvbicpO1xuXHRcdFx0cC5leGNlcHRpb25BY2Nlc3NvciA9IHZhbHVlO1xuXHRcdFx0cC5leGNlcHRpb25Db3VudCA9IHRydWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHAuZXhjZXB0aW9uQ291bnQgPSB2YWx1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouZXhjZXB0aW9uU3VtID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmV4Y2VwdGlvblN1bTtcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuZXhjZXB0aW9uU3VtID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRcdGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuaGlzdG9ncmFtVmFsdWU7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRwLmhpc3RvZ3JhbVZhbHVlID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouaGlzdG9ncmFtQmlucyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5oaXN0b2dyYW1UaHJlc2hvbGRzO1xuXHRcdHAuaGlzdG9ncmFtVGhyZXNob2xkcyA9IHZhbHVlO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLnN0ZCA9IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0aWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5zdGQ7XG5cblx0XHR2YWx1ZSA9IGFjY2Vzc29yaWZ5TnVtZXJpYyh2YWx1ZSk7XG5cblx0XHRpZih0eXBlb2YodmFsdWUpID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRwLnN1bU9mU3F1YXJlcyA9IHZhbHVlO1xuXHRcdFx0cC5zdW0gPSB2YWx1ZTtcblx0XHRcdHAuY291bnQgPSB0cnVlO1xuXHRcdFx0cC5zdGQgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRwLnN0ZCA9IHZhbHVlO1xuXHRcdH1cblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5zdW1PZlNxID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLnN1bU9mU3F1YXJlcztcblxuXHRcdHZhbHVlID0gYWNjZXNzb3JpZnlOdW1lcmljKHZhbHVlKTtcblxuXHRcdHAuc3VtT2ZTcXVhcmVzID0gdmFsdWU7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmoudmFsdWUgPSBmdW5jdGlvbih2YWx1ZSwgYWNjZXNzb3IpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGggfHwgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyApIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCIndmFsdWUnIHJlcXVpcmVzIGEgc3RyaW5nIGFyZ3VtZW50LlwiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYoIXAudmFsdWVzKSBwLnZhbHVlcyA9IHt9O1xuXHRcdFx0cC52YWx1ZXNbdmFsdWVdID0ge307XG5cdFx0XHRwLnZhbHVlc1t2YWx1ZV0ucGFyYW1ldGVycyA9IHJlZHVjdGlvX3BhcmFtZXRlcnMoKTtcblx0XHRcdGFjY2Vzc29yX2J1aWxkKHAudmFsdWVzW3ZhbHVlXSwgcC52YWx1ZXNbdmFsdWVdLnBhcmFtZXRlcnMpO1xuXHRcdFx0aWYoYWNjZXNzb3IpIHAudmFsdWVzW3ZhbHVlXS5hY2Nlc3NvciA9IGFjY2Vzc29yO1xuXHRcdFx0cmV0dXJuIHAudmFsdWVzW3ZhbHVlXTtcblx0XHR9XG5cdH07XG5cblx0b2JqLm5lc3QgPSBmdW5jdGlvbihrZXlBY2Nlc3NvckFycmF5KSB7XG5cdFx0aWYoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLm5lc3RLZXlzO1xuXG5cdFx0a2V5QWNjZXNzb3JBcnJheS5tYXAoYWNjZXNzb3JpZnkpO1xuXG5cdFx0cC5uZXN0S2V5cyA9IGtleUFjY2Vzc29yQXJyYXk7XG5cdFx0cmV0dXJuIG9iajtcblx0fTtcblxuXHRvYmouYWxpYXMgPSBmdW5jdGlvbihwcm9wQWNjZXNzb3JPYmopIHtcblx0XHRpZighYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHAuYWxpYXNLZXlzO1xuXHRcdHAuYWxpYXNLZXlzID0gcHJvcEFjY2Vzc29yT2JqO1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmFsaWFzUHJvcCA9IGZ1bmN0aW9uKHByb3BBY2Nlc3Nvck9iaikge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5hbGlhc1Byb3BLZXlzO1xuXHRcdHAuYWxpYXNQcm9wS2V5cyA9IHByb3BBY2Nlc3Nvck9iajtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG5cdG9iai5ncm91cEFsbCA9IGZ1bmN0aW9uKGdyb3VwVGVzdCkge1xuXHRcdGlmKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gcC5ncm91cEFsbDtcblx0XHRwLmdyb3VwQWxsID0gZ3JvdXBUZXN0O1xuXHRcdHJldHVybiBvYmo7XG5cdH07XG5cblx0b2JqLmRhdGFMaXN0ID0gZnVuY3Rpb24odmFsdWUpIHtcblx0XHRpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBwLmRhdGFMaXN0O1xuXHRcdHAuZGF0YUxpc3QgPSB2YWx1ZTtcblx0XHRyZXR1cm4gb2JqO1xuXHR9O1xuXG59XG5cbnZhciByZWR1Y3Rpb19hY2Nlc3NvcnMgPSB7XG5cdGJ1aWxkOiBhY2Nlc3Nvcl9idWlsZFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hY2Nlc3NvcnM7XG4iLCJ2YXIgcmVkdWN0aW9fYWxpYXMgPSB7XG5cdGluaXRpYWw6IGZ1bmN0aW9uKHByaW9yLCBwYXRoLCBvYmopIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHRmb3IodmFyIHByb3AgaW4gb2JqKSB7XG5cdFx0XHRcdHBhdGgocClbcHJvcF0gPSBmdW5jdGlvbigpIHsgcmV0dXJuIG9ialtwcm9wXShwYXRoKHApKTsgfTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fYWxpYXM7IiwidmFyIHJlZHVjdGlvX2FsaWFzX3Byb3AgPSB7XG5cdGFkZDogZnVuY3Rpb24gKG9iaiwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Zm9yKHZhciBwcm9wIGluIG9iaikge1xuXHRcdFx0XHRwYXRoKHApW3Byb3BdID0gb2JqW3Byb3BdKHBhdGgocCksdik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2FsaWFzX3Byb3A7IiwidmFyIHJlZHVjdGlvX2F2ZyA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5hdmcgPSBwYXRoKHApLnN1bSAvIHBhdGgocCkuY291bnQ7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpZihwYXRoKHApLmNvdW50ID4gMCkge1xuXHRcdFx0XHRwYXRoKHApLmF2ZyA9IHBhdGgocCkuc3VtIC8gcGF0aChwKS5jb3VudDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuYXZnID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5hdmcgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19hdmc7IiwidmFyIHJlZHVjdGlvX2ZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyLmpzJyk7XG52YXIgcmVkdWN0aW9fY291bnQgPSByZXF1aXJlKCcuL2NvdW50LmpzJyk7XG52YXIgcmVkdWN0aW9fc3VtID0gcmVxdWlyZSgnLi9zdW0uanMnKTtcbnZhciByZWR1Y3Rpb19hdmcgPSByZXF1aXJlKCcuL2F2Zy5qcycpO1xudmFyIHJlZHVjdGlvX21lZGlhbiA9IHJlcXVpcmUoJy4vbWVkaWFuLmpzJyk7XG52YXIgcmVkdWN0aW9fbWluID0gcmVxdWlyZSgnLi9taW4uanMnKTtcbnZhciByZWR1Y3Rpb19tYXggPSByZXF1aXJlKCcuL21heC5qcycpO1xudmFyIHJlZHVjdGlvX3ZhbHVlX2NvdW50ID0gcmVxdWlyZSgnLi92YWx1ZS1jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX3ZhbHVlX2xpc3QgPSByZXF1aXJlKCcuL3ZhbHVlLWxpc3QuanMnKTtcbnZhciByZWR1Y3Rpb19leGNlcHRpb25fY291bnQgPSByZXF1aXJlKCcuL2V4Y2VwdGlvbi1jb3VudC5qcycpO1xudmFyIHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0gPSByZXF1aXJlKCcuL2V4Y2VwdGlvbi1zdW0uanMnKTtcbnZhciByZWR1Y3Rpb19oaXN0b2dyYW0gPSByZXF1aXJlKCcuL2hpc3RvZ3JhbS5qcycpO1xudmFyIHJlZHVjdGlvX3N1bV9vZl9zcSA9IHJlcXVpcmUoJy4vc3VtLW9mLXNxdWFyZXMuanMnKTtcbnZhciByZWR1Y3Rpb19zdGQgPSByZXF1aXJlKCcuL3N0ZC5qcycpO1xudmFyIHJlZHVjdGlvX25lc3QgPSByZXF1aXJlKCcuL25lc3QuanMnKTtcbnZhciByZWR1Y3Rpb19hbGlhcyA9IHJlcXVpcmUoJy4vYWxpYXMuanMnKTtcbnZhciByZWR1Y3Rpb19hbGlhc19wcm9wID0gcmVxdWlyZSgnLi9hbGlhc1Byb3AuanMnKTtcbnZhciByZWR1Y3Rpb19kYXRhX2xpc3QgPSByZXF1aXJlKCcuL2RhdGEtbGlzdC5qcycpO1xuXG5mdW5jdGlvbiBidWlsZF9mdW5jdGlvbihwLCBmLCBwYXRoKSB7XG5cdC8vIFdlIGhhdmUgdG8gYnVpbGQgdGhlc2UgZnVuY3Rpb25zIGluIG9yZGVyLiBFdmVudHVhbGx5IHdlIGNhbiBpbmNsdWRlIGRlcGVuZGVuY3lcblx0Ly8gaW5mb3JtYXRpb24gYW5kIGNyZWF0ZSBhIGRlcGVuZGVuY3kgZ3JhcGggaWYgdGhlIHByb2Nlc3MgYmVjb21lcyBjb21wbGV4IGVub3VnaC5cblxuXHRpZighcGF0aCkgcGF0aCA9IGZ1bmN0aW9uIChkKSB7IHJldHVybiBkOyB9O1xuXG5cdC8vIEtlZXAgdHJhY2sgb2YgdGhlIG9yaWdpbmFsIHJlZHVjZXJzIHNvIHRoYXQgZmlsdGVyaW5nIGNhbiBza2lwIGJhY2sgdG9cblx0Ly8gdGhlbSBpZiB0aGlzIHBhcnRpY3VsYXIgdmFsdWUgaXMgZmlsdGVyZWQgb3V0LlxuXHR2YXIgb3JpZ0YgPSB7XG5cdFx0cmVkdWNlQWRkOiBmLnJlZHVjZUFkZCxcblx0XHRyZWR1Y2VSZW1vdmU6IGYucmVkdWNlUmVtb3ZlLFxuXHRcdHJlZHVjZUluaXRpYWw6IGYucmVkdWNlSW5pdGlhbFxuXHR9O1xuXG5cdGlmKHAuY291bnQgfHwgcC5zdGQpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2NvdW50LmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19jb3VudC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAuc3VtKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19zdW0uYWRkKHAuc3VtLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdW0ucmVtb3ZlKHAuc3VtLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fc3VtLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAuYXZnKSB7XG5cdFx0aWYoIXAuY291bnQgfHwgIXAuc3VtKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3Qgc2V0IC5jb3VudCh0cnVlKSBhbmQgZGVmaW5lIGEgLnN1bShhY2Nlc3NvcikgdG8gdXNlIC5hdmcodHJ1ZSkuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2F2Zy5hZGQocC5zdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fYXZnLnJlbW92ZShwLnN1bSwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fYXZnLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBUaGUgdW5pcXVlLW9ubHkgcmVkdWNlcnMgY29tZSBiZWZvcmUgdGhlIHZhbHVlX2NvdW50IHJlZHVjZXJzLiBUaGV5IG5lZWQgdG8gY2hlY2sgaWZcblx0Ly8gdGhlIHZhbHVlIGlzIGFscmVhZHkgaW4gdGhlIHZhbHVlcyBhcnJheSBvbiB0aGUgZ3JvdXAuIFRoZXkgc2hvdWxkIG9ubHkgaW5jcmVtZW50L2RlY3JlbWVudFxuXHQvLyBjb3VudHMgaWYgdGhlIHZhbHVlIG5vdCBpbiB0aGUgYXJyYXkgb3IgdGhlIGNvdW50IG9uIHRoZSB2YWx1ZSBpcyAwLlxuXHRpZihwLmV4Y2VwdGlvbkNvdW50KSB7XG5cdFx0aWYoIXAuZXhjZXB0aW9uQWNjZXNzb3IpIHtcblx0XHRcdGNvbnNvbGUuZXJyb3IoXCJZb3UgbXVzdCBkZWZpbmUgYW4gLmV4Y2VwdGlvbihhY2Nlc3NvcikgdG8gdXNlIC5leGNlcHRpb25Db3VudCh0cnVlKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmFkZChwLmV4Y2VwdGlvbkFjY2Vzc29yLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9jb3VudC5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0XHR9XG5cdH1cblxuXHRpZihwLmV4Y2VwdGlvblN1bSkge1xuXHRcdGlmKCFwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0XHRjb25zb2xlLmVycm9yKFwiWW91IG11c3QgZGVmaW5lIGFuIC5leGNlcHRpb24oYWNjZXNzb3IpIHRvIHVzZSAuZXhjZXB0aW9uU3VtKGFjY2Vzc29yKS5cIik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZXhjZXB0aW9uX3N1bS5yZW1vdmUocC5leGNlcHRpb25BY2Nlc3NvciwgcC5leGNlcHRpb25TdW0sIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2V4Y2VwdGlvbl9zdW0uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHRcdH1cblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSB2YWx1ZXMgYXJyYXkuXG5cdGlmKHAudmFsdWVMaXN0IHx8IHAubWVkaWFuIHx8IHAubWluIHx8IHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmFkZChwLnZhbHVlTGlzdCwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfbGlzdC5yZW1vdmUocC52YWx1ZUxpc3QsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9saXN0LmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdC8vIE1haW50YWluIHRoZSBkYXRhIGFycmF5LlxuXHRpZihwLmRhdGFMaXN0KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19kYXRhX2xpc3QuYWRkKHAuZGF0YUxpc3QsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX2RhdGFfbGlzdC5yZW1vdmUocC5kYXRhTGlzdCwgZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX2RhdGFfbGlzdC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHRpZihwLm1lZGlhbikge1xuXHRcdGYucmVkdWNlQWRkID0gcmVkdWN0aW9fbWVkaWFuLmFkZChmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19tZWRpYW4ucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19tZWRpYW4uaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0aWYocC5taW4pIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX21pbi5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fbWluLnJlbW92ZShmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbWluLmluaXRpYWwoZi5yZWR1Y2VJbml0aWFsLCBwYXRoKTtcblx0fVxuXG5cdGlmKHAubWF4KSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19tYXguYWRkKGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX21heC5yZW1vdmUoZi5yZWR1Y2VSZW1vdmUsIHBhdGgpO1xuXHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX21heC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBNYWludGFpbiB0aGUgdmFsdWVzIGNvdW50IGFycmF5LlxuXHRpZihwLmV4Y2VwdGlvbkFjY2Vzc29yKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5hZGQocC5leGNlcHRpb25BY2Nlc3NvciwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fdmFsdWVfY291bnQucmVtb3ZlKHAuZXhjZXB0aW9uQWNjZXNzb3IsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb192YWx1ZV9jb3VudC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBIaXN0b2dyYW1cblx0aWYocC5oaXN0b2dyYW1WYWx1ZSAmJiBwLmhpc3RvZ3JhbVRocmVzaG9sZHMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2hpc3RvZ3JhbS5hZGQocC5oaXN0b2dyYW1WYWx1ZSwgZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9faGlzdG9ncmFtLnJlbW92ZShwLmhpc3RvZ3JhbVZhbHVlLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9faGlzdG9ncmFtLmluaXRpYWwocC5oaXN0b2dyYW1UaHJlc2hvbGRzICxmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3VtIG9mIFNxdWFyZXNcblx0aWYocC5zdW1PZlNxdWFyZXMpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N1bV9vZl9zcS5hZGQocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHRmLnJlZHVjZVJlbW92ZSA9IHJlZHVjdGlvX3N1bV9vZl9zcS5yZW1vdmUocC5zdW1PZlNxdWFyZXMsIGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19zdW1fb2Zfc3EuaW5pdGlhbChmLnJlZHVjZUluaXRpYWwsIHBhdGgpO1xuXHR9XG5cblx0Ly8gU3RhbmRhcmQgZGV2aWF0aW9uXG5cdGlmKHAuc3RkKSB7XG5cdFx0aWYoIXAuc3VtT2ZTcXVhcmVzIHx8ICFwLnN1bSkge1xuXHRcdFx0Y29uc29sZS5lcnJvcihcIllvdSBtdXN0IHNldCAuc3VtT2ZTcShhY2Nlc3NvcikgYW5kIGRlZmluZSBhIC5zdW0oYWNjZXNzb3IpIHRvIHVzZSAuc3RkKHRydWUpLiBPciB1c2UgLnN0ZChhY2Nlc3NvcikuXCIpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX3N0ZC5hZGQoZi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19zdGQucmVtb3ZlKGYucmVkdWNlUmVtb3ZlLCBwYXRoKTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHJlZHVjdGlvX3N0ZC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdFx0fVxuXHR9XG5cblx0Ly8gTmVzdGluZ1xuXHRpZihwLm5lc3RLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19uZXN0LmFkZChwLm5lc3RLZXlzLCBmLnJlZHVjZUFkZCwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VSZW1vdmUgPSByZWR1Y3Rpb19uZXN0LnJlbW92ZShwLm5lc3RLZXlzLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdFx0Zi5yZWR1Y2VJbml0aWFsID0gcmVkdWN0aW9fbmVzdC5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCk7XG5cdH1cblxuXHQvLyBBbGlhcyBmdW5jdGlvbnNcblx0aWYocC5hbGlhc0tleXMpIHtcblx0XHRmLnJlZHVjZUluaXRpYWwgPSByZWR1Y3Rpb19hbGlhcy5pbml0aWFsKGYucmVkdWNlSW5pdGlhbCwgcGF0aCwgcC5hbGlhc0tleXMpO1xuXHR9XG5cblx0Ly8gQWxpYXMgcHJvcGVydGllcyAtIHRoaXMgaXMgbGVzcyBlZmZpY2llbnQgdGhhbiBhbGlhcyBmdW5jdGlvbnNcblx0aWYocC5hbGlhc1Byb3BLZXlzKSB7XG5cdFx0Zi5yZWR1Y2VBZGQgPSByZWR1Y3Rpb19hbGlhc19wcm9wLmFkZChwLmFsaWFzUHJvcEtleXMsIGYucmVkdWNlQWRkLCBwYXRoKTtcblx0XHQvLyBUaGlzIGlzbid0IGEgdHlwby4gVGhlIGZ1bmN0aW9uIGlzIHRoZSBzYW1lIGZvciBhZGQvcmVtb3ZlLlxuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fYWxpYXNfcHJvcC5hZGQocC5hbGlhc1Byb3BLZXlzLCBmLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdH1cblxuXHQvLyBGaWx0ZXJzIGRldGVybWluZSBpZiBvdXIgYnVpbHQtdXAgcHJpb3JzIHNob3VsZCBydW4sIG9yIGlmIGl0IHNob3VsZCBza2lwXG5cdC8vIGJhY2sgdG8gdGhlIGZpbHRlcnMgZ2l2ZW4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGlzIGJ1aWxkIGZ1bmN0aW9uLlxuXHRpZiAocC5maWx0ZXIpIHtcblx0XHRmLnJlZHVjZUFkZCA9IHJlZHVjdGlvX2ZpbHRlci5hZGQocC5maWx0ZXIsIGYucmVkdWNlQWRkLCBvcmlnRi5yZWR1Y2VBZGQsIHBhdGgpO1xuXHRcdGYucmVkdWNlUmVtb3ZlID0gcmVkdWN0aW9fZmlsdGVyLnJlbW92ZShwLmZpbHRlciwgZi5yZWR1Y2VSZW1vdmUsIG9yaWdGLnJlZHVjZVJlbW92ZSwgcGF0aCk7XG5cdH1cblxuXHQvLyBWYWx1ZXMgZ28gbGFzdC5cblx0aWYocC52YWx1ZXMpIHtcblx0XHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwLnZhbHVlcykuZm9yRWFjaChmdW5jdGlvbihuKSB7XG5cdFx0XHQvLyBTZXQgdXAgdGhlIHBhdGggb24gZWFjaCBncm91cC5cblx0XHRcdHZhciBzZXR1cFBhdGggPSBmdW5jdGlvbihwcmlvcikge1xuXHRcdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRcdFx0cGF0aChwKVtuXSA9IHt9O1xuXHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHR9O1xuXHRcdFx0fTtcblx0XHRcdGYucmVkdWNlSW5pdGlhbCA9IHNldHVwUGF0aChmLnJlZHVjZUluaXRpYWwpO1xuXHRcdFx0YnVpbGRfZnVuY3Rpb24ocC52YWx1ZXNbbl0ucGFyYW1ldGVycywgZiwgZnVuY3Rpb24gKHApIHsgcmV0dXJuIHBbbl07IH0pO1xuXHRcdH0pO1xuXHR9XG59XG5cbnZhciByZWR1Y3Rpb19idWlsZCA9IHtcblx0YnVpbGQ6IGJ1aWxkX2Z1bmN0aW9uXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2J1aWxkO1xuIiwidmFyIHBsdWNrID0gZnVuY3Rpb24obil7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQpe1xuICAgICAgICByZXR1cm4gZFtuXTtcbiAgICB9O1xufTtcblxuLy8gc3VwcG9ydGVkIG9wZXJhdG9ycyBhcmUgc3VtLCBhdmcsIGFuZCBjb3VudFxuX2dyb3VwZXIgPSBmdW5jdGlvbihwYXRoLCBwcmlvcil7XG4gICAgaWYoIXBhdGgpIHBhdGggPSBmdW5jdGlvbihkKXtyZXR1cm4gZDt9O1xuICAgIHJldHVybiBmdW5jdGlvbihwLCB2KXtcbiAgICAgICAgaWYocHJpb3IpIHByaW9yKHAsIHYpO1xuICAgICAgICB2YXIgeCA9IHBhdGgocCksIHkgPSBwYXRoKHYpO1xuICAgICAgICBpZih0eXBlb2YgeS5jb3VudCAhPT0gJ3VuZGVmaW5lZCcpIHguY291bnQgKz0geS5jb3VudDtcbiAgICAgICAgaWYodHlwZW9mIHkuc3VtICE9PSAndW5kZWZpbmVkJykgeC5zdW0gKz0geS5zdW07XG4gICAgICAgIGlmKHR5cGVvZiB5LmF2ZyAhPT0gJ3VuZGVmaW5lZCcpIHguYXZnID0geC5zdW0veC5jb3VudDtcbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfTtcbn07XG5cbnJlZHVjdGlvX2NhcCA9IGZ1bmN0aW9uIChwcmlvciwgZiwgcCkge1xuICAgIHZhciBvYmogPSBmLnJlZHVjZUluaXRpYWwoKTtcbiAgICAvLyB3ZSB3YW50IHRvIHN1cHBvcnQgdmFsdWVzIHNvIHdlJ2xsIG5lZWQgdG8ga25vdyB3aGF0IHRob3NlIGFyZVxuICAgIHZhciB2YWx1ZXMgPSBwLnZhbHVlcyA/IE9iamVjdC5rZXlzKHAudmFsdWVzKSA6IFtdO1xuICAgIHZhciBfb3RoZXJzR3JvdXBlciA9IF9ncm91cGVyKCk7XG4gICAgaWYgKHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIF9vdGhlcnNHcm91cGVyID0gX2dyb3VwZXIocGx1Y2sodmFsdWVzW2ldKSwgX290aGVyc0dyb3VwZXIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoY2FwLCBvdGhlcnNOYW1lKSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHByaW9yKCk7XG4gICAgICAgIGlmKCBjYXAgPT09IEluZmluaXR5IHx8ICFjYXAgKSByZXR1cm4gcHJpb3IoKTtcbiAgICAgICAgdmFyIGFsbCA9IHByaW9yKCk7XG4gICAgICAgIHZhciBzbGljZV9pZHggPSBjYXAtMTtcbiAgICAgICAgaWYoYWxsLmxlbmd0aCA8PSBjYXApIHJldHVybiBhbGw7XG4gICAgICAgIHZhciBkYXRhID0gYWxsLnNsaWNlKDAsIHNsaWNlX2lkeCk7XG4gICAgICAgIHZhciBvdGhlcnMgPSB7a2V5OiBvdGhlcnNOYW1lIHx8ICdPdGhlcnMnfTtcbiAgICAgICAgb3RoZXJzLnZhbHVlID0gZi5yZWR1Y2VJbml0aWFsKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSBzbGljZV9pZHg7IGkgPCBhbGwubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIF9vdGhlcnNHcm91cGVyKG90aGVycy52YWx1ZSwgYWxsW2ldLnZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhLnB1c2gob3RoZXJzKTtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fY2FwO1xuIiwidmFyIHJlZHVjdGlvX2NvdW50ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuY291bnQrKztcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5jb3VudC0tO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24ocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdGlmKHByaW9yKSBwID0gcHJpb3IocCk7XG5cdFx0XHQvLyBpZihwID09PSB1bmRlZmluZWQpIHAgPSB7fTtcblx0XHRcdHBhdGgocCkuY291bnQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19jb3VudDsiLCJ2YXIgcmVkdWN0aW9fZGF0YV9saXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdHBhdGgocCkuZGF0YUxpc3QucHVzaCh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24oYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5kYXRhTGlzdC5zcGxpY2UocGF0aChwKS5kYXRhTGlzdC5pbmRleE9mKHYpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRpZihwcmlvcikgcCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5kYXRhTGlzdCA9IFtdO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19kYXRhX2xpc3Q7XG4iLCJ2YXIgcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpLCBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBPbmx5IGNvdW50KysgaWYgdGhlIHAudmFsdWVzIGFycmF5IGRvZXNuJ3QgY29udGFpbiBhKHYpIG9yIGlmIGl0J3MgMC5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKCghY3VyciB8fCBjdXJyWzBdICE9PSBhKHYpKSB8fCBjdXJyWzFdID09PSAwKSB7XG5cdFx0XHRcdHBhdGgocCkuZXhjZXB0aW9uQ291bnQrKztcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGEsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgY291bnQtLSBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgY29udGFpbnMgYSh2KSB2YWx1ZSBvZiAxLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoY3VyciAmJiBjdXJyWzBdID09PSBhKHYpICYmIGN1cnJbMV0gPT09IDEpIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25Db3VudC0tO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLmV4Y2VwdGlvbkNvdW50ID0gMDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fZXhjZXB0aW9uX2NvdW50OyIsInZhciByZWR1Y3Rpb19leGNlcHRpb25fc3VtID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBzdW0sIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGksIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdC8vIE9ubHkgc3VtIGlmIHRoZSBwLnZhbHVlcyBhcnJheSBkb2Vzbid0IGNvbnRhaW4gYSh2KSBvciBpZiBpdCdzIDAuXG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHRjdXJyID0gcGF0aChwKS52YWx1ZXNbaV07XG5cdFx0XHRpZigoIWN1cnIgfHwgY3VyclswXSAhPT0gYSh2KSkgfHwgY3VyclsxXSA9PT0gMCkge1xuXHRcdFx0XHRwYXRoKHApLmV4Y2VwdGlvblN1bSA9IHBhdGgocCkuZXhjZXB0aW9uU3VtICsgc3VtKHYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgc3VtLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpLCBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBPbmx5IHN1bSBpZiB0aGUgcC52YWx1ZXMgYXJyYXkgY29udGFpbnMgYSh2KSB2YWx1ZSBvZiAxLlxuXHRcdFx0aSA9IHBhdGgocCkuYmlzZWN0KHBhdGgocCkudmFsdWVzLCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlcy5sZW5ndGgpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkudmFsdWVzW2ldO1xuXHRcdFx0aWYoY3VyciAmJiBjdXJyWzBdID09PSBhKHYpICYmIGN1cnJbMV0gPT09IDEpIHtcblx0XHRcdFx0cGF0aChwKS5leGNlcHRpb25TdW0gPSBwYXRoKHApLmV4Y2VwdGlvblN1bSAtIHN1bSh2KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5leGNlcHRpb25TdW0gPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19leGNlcHRpb25fc3VtOyIsInZhciByZWR1Y3Rpb19maWx0ZXIgPSB7XG5cdC8vIFRoZSBiaWcgaWRlYSBoZXJlIGlzIHRoYXQgeW91IGdpdmUgdXMgYSBmaWx0ZXIgZnVuY3Rpb24gdG8gcnVuIG9uIHZhbHVlcyxcblx0Ly8gYSAncHJpb3InIHJlZHVjZXIgdG8gcnVuIChqdXN0IGxpa2UgdGhlIHJlc3Qgb2YgdGhlIHN0YW5kYXJkIHJlZHVjZXJzKSxcblx0Ly8gYW5kIGEgcmVmZXJlbmNlIHRvIHRoZSBsYXN0IHJlZHVjZXIgKGNhbGxlZCAnc2tpcCcgYmVsb3cpIGRlZmluZWQgYmVmb3JlXG5cdC8vIHRoZSBtb3N0IHJlY2VudCBjaGFpbiBvZiByZWR1Y2Vycy4gIFRoaXMgc3VwcG9ydHMgaW5kaXZpZHVhbCBmaWx0ZXJzIGZvclxuXHQvLyBlYWNoIC52YWx1ZSgnLi4uJykgY2hhaW4gdGhhdCB5b3UgYWRkIHRvIHlvdXIgcmVkdWNlci5cblx0YWRkOiBmdW5jdGlvbiAoZmlsdGVyLCBwcmlvciwgc2tpcCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmIChmaWx0ZXIodiwgbmYpKSB7XG5cdFx0XHRcdGlmIChwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHNraXApIHNraXAocCwgdiwgbmYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoZmlsdGVyLCBwcmlvciwgc2tpcCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmIChmaWx0ZXIodiwgbmYpKSB7XG5cdFx0XHRcdGlmIChwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKHNraXApIHNraXAocCwgdiwgbmYpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19maWx0ZXI7XG4iLCJ2YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcicpO1xuXG52YXIgcmVkdWN0aW9faGlzdG9ncmFtID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHR2YXIgYmlzZWN0SGlzdG8gPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZC54OyB9KS5yaWdodDtcblx0XHR2YXIgY3Vycjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Y3VyciA9IHBhdGgocCkuaGlzdG9ncmFtW2Jpc2VjdEhpc3RvKHBhdGgocCkuaGlzdG9ncmFtLCBhKHYpLCAwLCBwYXRoKHApLmhpc3RvZ3JhbS5sZW5ndGgpIC0gMV07XG5cdFx0XHRjdXJyLnkrKztcblx0XHRcdGN1cnIuc3BsaWNlKGJpc2VjdChjdXJyLCBhKHYpLCAwLCBjdXJyLmxlbmd0aCksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0dmFyIGJpc2VjdEhpc3RvID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQueDsgfSkucmlnaHQ7XG5cdFx0dmFyIGN1cnI7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLmhpc3RvZ3JhbVtiaXNlY3RIaXN0byhwYXRoKHApLmhpc3RvZ3JhbSwgYSh2KSwgMCwgcGF0aChwKS5oaXN0b2dyYW0ubGVuZ3RoKSAtIDFdO1xuXHRcdFx0Y3Vyci55LS07XG5cdFx0XHRjdXJyLnNwbGljZShiaXNlY3QoY3VyciwgYSh2KSwgMCwgY3Vyci5sZW5ndGgpLCAxKTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uICh0aHJlc2hvbGRzLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5oaXN0b2dyYW0gPSBbXTtcblx0XHRcdHZhciBhcnIgPSBbXTtcblx0XHRcdGZvcih2YXIgaSA9IDE7IGkgPCB0aHJlc2hvbGRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGFyciA9IFtdO1xuXHRcdFx0XHRhcnIueCA9IHRocmVzaG9sZHNbaSAtIDFdO1xuXHRcdFx0XHRhcnIuZHggPSAodGhyZXNob2xkc1tpXSAtIHRocmVzaG9sZHNbaSAtIDFdKTtcblx0XHRcdFx0YXJyLnkgPSAwO1xuXHRcdFx0XHRwYXRoKHApLmhpc3RvZ3JhbS5wdXNoKGFycik7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX2hpc3RvZ3JhbTsiLCJ2YXIgcmVkdWN0aW9fbWF4ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1heCA9IHBhdGgocCkudmFsdWVMaXN0W3BhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAtIDFdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tYXggPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5tYXggPSBwYXRoKHApLnZhbHVlTGlzdFtwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggLSAxXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1heCA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWF4OyIsInZhciByZWR1Y3Rpb19tZWRpYW4gPSB7XG5cdGFkZDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGhhbGY7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblxuXHRcdFx0aGFsZiA9IE1hdGguZmxvb3IocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoLzIpO1xuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoICUgMikge1xuXHRcdFx0XHRwYXRoKHApLm1lZGlhbiA9IHBhdGgocCkudmFsdWVMaXN0W2hhbGZdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSAocGF0aChwKS52YWx1ZUxpc3RbaGFsZi0xXSArIHBhdGgocCkudmFsdWVMaXN0W2hhbGZdKSAvIDIuMDtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaGFsZjtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXG5cdFx0XHRoYWxmID0gTWF0aC5mbG9vcihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgvMik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0aWYocGF0aChwKS52YWx1ZUxpc3QubGVuZ3RoID09PSAxIHx8IHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCAlIDIpIHtcblx0XHRcdFx0cGF0aChwKS5tZWRpYW4gPSBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkubWVkaWFuID0gKHBhdGgocCkudmFsdWVMaXN0W2hhbGYtMV0gKyBwYXRoKHApLnZhbHVlTGlzdFtoYWxmXSkgLyAyLjA7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5tZWRpYW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX21lZGlhbjsiLCJ2YXIgcmVkdWN0aW9fbWluID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG4gXG5cdFx0XHRwYXRoKHApLm1pbiA9IHBhdGgocCkudmFsdWVMaXN0WzBdO1xuXG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdC8vIENoZWNrIGZvciB1bmRlZmluZWQuXG5cdFx0XHRpZihwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0cGF0aChwKS5taW4gPSB1bmRlZmluZWQ7XG5cdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0fVxuIFxuXHRcdFx0cGF0aChwKS5taW4gPSBwYXRoKHApLnZhbHVlTGlzdFswXTtcblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm1pbiA9IHVuZGVmaW5lZDtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbWluOyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyJyk7XG5cbnZhciByZWR1Y3Rpb19uZXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChrZXlBY2Nlc3NvcnMsIHByaW9yLCBwYXRoKSB7XG5cdFx0dmFyIGk7IC8vIEN1cnJlbnQga2V5IGFjY2Vzc29yXG5cdFx0dmFyIGFyclJlZjtcblx0XHR2YXIgbmV3UmVmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGFyclJlZiA9IHBhdGgocCkubmVzdDtcblx0XHRcdGtleUFjY2Vzc29ycy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcblx0XHRcdFx0bmV3UmVmID0gYXJyUmVmLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleSA9PT0gYSh2KTsgfSlbMF07XG5cdFx0XHRcdGlmKG5ld1JlZikge1xuXHRcdFx0XHRcdC8vIFRoZXJlIGlzIGFub3RoZXIgbGV2ZWwuXG5cdFx0XHRcdFx0YXJyUmVmID0gbmV3UmVmLnZhbHVlcztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBOZXh0IGxldmVsIGRvZXNuJ3QgeWV0IGV4aXN0IHNvIHdlIGNyZWF0ZSBpdC5cblx0XHRcdFx0XHRuZXdSZWYgPSBbXTtcblx0XHRcdFx0XHRhcnJSZWYucHVzaCh7IGtleTogYSh2KSwgdmFsdWVzOiBuZXdSZWYgfSk7XG5cdFx0XHRcdFx0YXJyUmVmID0gbmV3UmVmO1xuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0YXJyUmVmLnB1c2godik7XG5cdFx0XHRcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdHJlbW92ZTogZnVuY3Rpb24gKGtleUFjY2Vzc29ycywgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgYXJyUmVmO1xuXHRcdHZhciBuZXh0UmVmO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cblx0XHRcdGFyclJlZiA9IHBhdGgocCkubmVzdDtcblx0XHRcdGtleUFjY2Vzc29ycy5mb3JFYWNoKGZ1bmN0aW9uKGEpIHtcblx0XHRcdFx0YXJyUmVmID0gYXJyUmVmLmZpbHRlcihmdW5jdGlvbihkKSB7IHJldHVybiBkLmtleSA9PT0gYSh2KTsgfSlbMF0udmFsdWVzO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIEFycmF5IGNvbnRhaW5zIGFuIGFjdHVhbCByZWZlcmVuY2UgdG8gdGhlIHJvdywgc28ganVzdCBzcGxpY2UgaXQgb3V0LlxuXHRcdFx0YXJyUmVmLnNwbGljZShhcnJSZWYuaW5kZXhPZih2KSwgMSk7XG5cblx0XHRcdC8vIElmIHRoZSBsZWFmIG5vdyBoYXMgbGVuZ3RoIDAgYW5kIGl0J3Mgbm90IHRoZSBiYXNlIGFycmF5IHJlbW92ZSBpdC5cblx0XHRcdC8vIFRPRE9cblxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLm5lc3QgPSBbXTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fbmVzdDsiLCJ2YXIgcmVkdWN0aW9fcGFyYW1ldGVycyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4ge1xuXHRcdG9yZGVyOiBmYWxzZSxcblx0XHRhdmc6IGZhbHNlLFxuXHRcdGNvdW50OiBmYWxzZSxcblx0XHRzdW06IGZhbHNlLFxuXHRcdGV4Y2VwdGlvbkFjY2Vzc29yOiBmYWxzZSxcblx0XHRleGNlcHRpb25Db3VudDogZmFsc2UsXG5cdFx0ZXhjZXB0aW9uU3VtOiBmYWxzZSxcblx0XHRmaWx0ZXI6IGZhbHNlLFxuXHRcdHZhbHVlTGlzdDogZmFsc2UsXG5cdFx0bWVkaWFuOiBmYWxzZSxcblx0XHRoaXN0b2dyYW1WYWx1ZTogZmFsc2UsXG5cdFx0bWluOiBmYWxzZSxcblx0XHRtYXg6IGZhbHNlLFxuXHRcdGhpc3RvZ3JhbVRocmVzaG9sZHM6IGZhbHNlLFxuXHRcdHN0ZDogZmFsc2UsXG5cdFx0c3VtT2ZTcXVhcmVzOiBmYWxzZSxcblx0XHR2YWx1ZXM6IGZhbHNlLFxuXHRcdG5lc3RLZXlzOiBmYWxzZSxcblx0XHRhbGlhc0tleXM6IGZhbHNlLFxuXHRcdGFsaWFzUHJvcEtleXM6IGZhbHNlLFxuXHRcdGdyb3VwQWxsOiBmYWxzZSxcblx0XHRkYXRhTGlzdDogZmFsc2Vcblx0fTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gcmVkdWN0aW9fcGFyYW1ldGVycztcbiIsImZ1bmN0aW9uIHBvc3RQcm9jZXNzKHJlZHVjdGlvKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChncm91cCwgcCwgZikge1xuICAgICAgICBncm91cC5wb3N0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciBwb3N0cHJvY2VzcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3MuYWxsKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBncm91cC5hbGwoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB2YXIgcG9zdHByb2Nlc3NvcnMgPSByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycztcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHBvc3Rwcm9jZXNzb3JzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgcG9zdHByb2Nlc3NbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBfYWxsID0gcG9zdHByb2Nlc3MuYWxsO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdHByb2Nlc3MuYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzb3JzW25hbWVdKF9hbGwsIGYsIHApLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9zdHByb2Nlc3M7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHBvc3Rwcm9jZXNzO1xuICAgICAgICB9O1xuICAgIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcG9zdFByb2Nlc3M7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHJlZHVjdGlvKXtcbiAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29ycyA9IHt9O1xuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvciA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpe1xuICAgICAgICByZWR1Y3Rpby5wb3N0cHJvY2Vzc29yc1tuYW1lXSA9IGZ1bmM7XG4gICAgfTtcblxuICAgIHJlZHVjdGlvLnJlZ2lzdGVyUG9zdFByb2Nlc3NvcignY2FwJywgcmVxdWlyZSgnLi9jYXAnKSk7XG4gICAgcmVkdWN0aW8ucmVnaXN0ZXJQb3N0UHJvY2Vzc29yKCdzb3J0QnknLCByZXF1aXJlKCcuL3NvcnRCeScpKTtcbn07XG4iLCJ2YXIgcmVkdWN0aW9fYnVpbGQgPSByZXF1aXJlKCcuL2J1aWxkLmpzJyk7XG52YXIgcmVkdWN0aW9fYWNjZXNzb3JzID0gcmVxdWlyZSgnLi9hY2Nlc3NvcnMuanMnKTtcbnZhciByZWR1Y3Rpb19wYXJhbWV0ZXJzID0gcmVxdWlyZSgnLi9wYXJhbWV0ZXJzLmpzJyk7XG52YXIgcmVkdWN0aW9fcG9zdHByb2Nlc3MgPSByZXF1aXJlKCcuL3Bvc3Rwcm9jZXNzJyk7XG52YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcicpO1xuXG5mdW5jdGlvbiByZWR1Y3RpbygpIHtcblx0dmFyIHBhcmFtZXRlcnMgPSByZWR1Y3Rpb19wYXJhbWV0ZXJzKCk7XG5cblx0dmFyIGZ1bmNzID0ge307XG5cblx0ZnVuY3Rpb24gbXkoZ3JvdXApIHtcblx0XHQvLyBTdGFydCBmcmVzaCBlYWNoIHRpbWUuXG5cdFx0ZnVuY3MgPSB7XG5cdFx0XHRyZWR1Y2VBZGQ6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG5cdFx0XHRyZWR1Y2VSZW1vdmU6IGZ1bmN0aW9uKHApIHsgcmV0dXJuIHA7IH0sXG5cdFx0XHRyZWR1Y2VJbml0aWFsOiBmdW5jdGlvbiAoKSB7IHJldHVybiB7fTsgfSxcblx0XHR9O1xuXG5cdFx0cmVkdWN0aW9fYnVpbGQuYnVpbGQocGFyYW1ldGVycywgZnVuY3MpO1xuXG5cdFx0Ly8gSWYgd2UncmUgZG9pbmcgZ3JvdXBBbGxcblx0XHRpZihwYXJhbWV0ZXJzLmdyb3VwQWxsKSB7XG5cdFx0XHRpZihncm91cC50b3ApIHtcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiJ2dyb3VwQWxsJyBpcyBkZWZpbmVkIGJ1dCBhdHRlbXB0aW5nIHRvIHJ1biBvbiBhIHN0YW5kYXJkIGRpbWVuc2lvbi5ncm91cCgpLiBNdXN0IHJ1biBvbiBkaW1lbnNpb24uZ3JvdXBBbGwoKS5cIik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQua2V5OyB9KS5sZWZ0O1xuXHRcdFx0XHR2YXIgaSwgajtcblx0XHRcdFx0dmFyIGtleXM7XG4gICAgICAgIHZhciBrZXlzTGVuZ3RoO1xuICAgICAgICB2YXIgazsgLy8gS2V5XG5cdFx0XHRcdGdyb3VwLnJlZHVjZShcblx0XHRcdFx0XHRmdW5jdGlvbihwLCB2LCBuZikge1xuXHRcdFx0XHRcdFx0a2V5cyA9IHBhcmFtZXRlcnMuZ3JvdXBBbGwodik7XG4gICAgICAgICAgICBrZXlzTGVuZ3RoID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgICBmb3Ioaj0wO2o8a2V5c0xlbmd0aDtqKyspIHtcbiAgICAgICAgICAgICAgayA9IGtleXNbal07XG4gICAgICAgICAgICAgIGkgPSBiaXNlY3QocCwgaywgMCwgcC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHRpZighcFtpXSB8fCBwW2ldLmtleSAhPT0gaykge1xuXHRcdFx0XHRcdFx0XHRcdC8vIElmIHRoZSBncm91cCBkb2Vzbid0IHlldCBleGlzdCwgY3JlYXRlIGl0IGZpcnN0LlxuXHRcdFx0XHRcdFx0XHRcdHAuc3BsaWNlKGksIDAsIHsga2V5OiBrLCB2YWx1ZTogZnVuY3MucmVkdWNlSW5pdGlhbCgpIH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0Ly8gVGhlbiBwYXNzIHRoZSByZWNvcmQgYW5kIHRoZSBncm91cCB2YWx1ZSB0byB0aGUgcmVkdWNlcnNcblx0XHRcdFx0XHRcdFx0ZnVuY3MucmVkdWNlQWRkKHBbaV0udmFsdWUsIHYsIG5mKTtcbiAgICAgICAgICAgIH1cblx0XHRcdFx0XHRcdHJldHVybiBwO1xuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0ZnVuY3Rpb24ocCwgdiwgbmYpIHtcblx0XHRcdFx0XHRcdGtleXMgPSBwYXJhbWV0ZXJzLmdyb3VwQWxsKHYpO1xuICAgICAgICAgICAga2V5c0xlbmd0aCA9IGtleXMubGVuZ3RoO1xuICAgICAgICAgICAgZm9yKGo9MDtqPGtleXNMZW5ndGg7aisrKSB7XG4gICAgICAgICAgICAgIGkgPSBiaXNlY3QocCwga2V5c1tqXSwgMCwgcC5sZW5ndGgpO1xuXHRcdFx0XHRcdFx0XHQvLyBUaGUgZ3JvdXAgc2hvdWxkIGV4aXN0IG9yIHdlJ3JlIGluIHRyb3VibGUhXG5cdFx0XHRcdFx0XHRcdC8vIFRoZW4gcGFzcyB0aGUgcmVjb3JkIGFuZCB0aGUgZ3JvdXAgdmFsdWUgdG8gdGhlIHJlZHVjZXJzXG5cdFx0XHRcdFx0XHRcdGZ1bmNzLnJlZHVjZVJlbW92ZShwW2ldLnZhbHVlLCB2LCBuZik7XG4gICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHRyZXR1cm4gcDtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIFtdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0KTtcblx0XHRcdFx0aWYoIWdyb3VwLmFsbCkge1xuXHRcdFx0XHRcdC8vIEFkZCBhbiAnYWxsJyBtZXRob2QgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBzdGFuZGFyZCBDcm9zc2ZpbHRlciBncm91cHMuXG5cdFx0XHRcdFx0Z3JvdXAuYWxsID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLnZhbHVlKCk7IH07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Z3JvdXAucmVkdWNlKGZ1bmNzLnJlZHVjZUFkZCwgZnVuY3MucmVkdWNlUmVtb3ZlLCBmdW5jcy5yZWR1Y2VJbml0aWFsKTtcblx0XHR9XG5cblx0XHRyZWR1Y3Rpb19wb3N0cHJvY2Vzcyhncm91cCwgcGFyYW1ldGVycywgZnVuY3MpO1xuXG5cdFx0cmV0dXJuIGdyb3VwO1xuXHR9XG5cblx0cmVkdWN0aW9fYWNjZXNzb3JzLmJ1aWxkKG15LCBwYXJhbWV0ZXJzKTtcblxuXHRyZXR1cm4gbXk7XG59XG5cbnJlcXVpcmUoJy4vcG9zdHByb2Nlc3NvcnMnKShyZWR1Y3Rpbyk7XG5yZWR1Y3Rpb19wb3N0cHJvY2VzcyA9IHJlZHVjdGlvX3Bvc3Rwcm9jZXNzKHJlZHVjdGlvKTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3RpbztcbiIsInZhciBwbHVja19uID0gZnVuY3Rpb24gKG4pIHtcbiAgICBpZiAodHlwZW9mIG4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgfVxuICAgIGlmICh+bi5pbmRleE9mKCcuJykpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gbi5zcGxpdCgnLicpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBzcGxpdC5yZWR1Y2UoZnVuY3Rpb24gKHAsIHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcFt2XTtcbiAgICAgICAgICAgIH0sIGQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGQpIHtcbiAgICAgICAgcmV0dXJuIGRbbl07XG4gICAgfTtcbn07XG5cbmZ1bmN0aW9uIGFzY2VuZGluZyhhLCBiKSB7XG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiBhID49IGIgPyAwIDogTmFOO1xufVxuXG52YXIgY29tcGFyZXIgPSBmdW5jdGlvbiAoYWNjZXNzb3IsIG9yZGVyaW5nKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBvcmRlcmluZyhhY2Nlc3NvcihhKSwgYWNjZXNzb3IoYikpO1xuICAgIH07XG59O1xuXG52YXIgdHlwZSA9IHt9LnRvU3RyaW5nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChwcmlvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIG9yZGVyKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICBvcmRlciA9IGFzY2VuZGluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcHJpb3IoKS5zb3J0KGNvbXBhcmVyKHBsdWNrX24odmFsdWUpLCBvcmRlcikpO1xuICAgIH07XG59O1xuIiwidmFyIHJlZHVjdGlvX3N0ZCA9IHtcblx0YWRkOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwLjA7XG5cdFx0XHRcdHZhciBuID0gcGF0aChwKS5zdW1PZlNxIC0gcGF0aChwKS5zdW0qcGF0aChwKS5zdW0vcGF0aChwKS5jb3VudDtcblx0XHRcdFx0aWYgKG4+MC4wKSBwYXRoKHApLnN0ZCA9IE1hdGguc3FydChuLyhwYXRoKHApLmNvdW50LTEpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMC4wO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0aWYocGF0aChwKS5jb3VudCA+IDApIHtcblx0XHRcdFx0cGF0aChwKS5zdGQgPSAwLjA7XG5cdFx0XHRcdHZhciBuID0gcGF0aChwKS5zdW1PZlNxIC0gcGF0aChwKS5zdW0qcGF0aChwKS5zdW0vcGF0aChwKS5jb3VudDtcblx0XHRcdFx0aWYgKG4+MC4wKSBwYXRoKHApLnN0ZCA9IE1hdGguc3FydChuLyhwYXRoKHApLmNvdW50LTEpKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhdGgocCkuc3RkID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdGQgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdGQ7IiwidmFyIHJlZHVjdGlvX3N1bV9vZl9zcSA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gcGF0aChwKS5zdW1PZlNxICsgYSh2KSphKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW1PZlNxID0gcGF0aChwKS5zdW1PZlNxIC0gYSh2KSphKHYpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHRwYXRoKHApLnN1bU9mU3EgPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdW1fb2Zfc3E7IiwidmFyIHJlZHVjdGlvX3N1bSA9IHtcblx0YWRkOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0cGF0aChwKS5zdW0gPSBwYXRoKHApLnN1bSArIGEodik7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRwYXRoKHApLnN1bSA9IHBhdGgocCkuc3VtIC0gYSh2KTtcblx0XHRcdHJldHVybiBwO1xuXHRcdH07XG5cdH0sXG5cdGluaXRpYWw6IGZ1bmN0aW9uIChwcmlvciwgcGF0aCkge1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCkge1xuXHRcdFx0cCA9IHByaW9yKHApO1xuXHRcdFx0cGF0aChwKS5zdW0gPSAwO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSByZWR1Y3Rpb19zdW07IiwidmFyIGNyb3NzZmlsdGVyID0gcmVxdWlyZSgnY3Jvc3NmaWx0ZXInKTtcblxudmFyIHJlZHVjdGlvX3ZhbHVlX2NvdW50ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpLCBjdXJyO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHQvLyBOb3Qgc3VyZSBpZiB0aGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gc29ydGluZy5cblx0XHRcdGkgPSBwYXRoKHApLmJpc2VjdChwYXRoKHApLnZhbHVlcywgYSh2KSwgMCwgcGF0aChwKS52YWx1ZXMubGVuZ3RoKTtcblx0XHRcdGN1cnIgPSBwYXRoKHApLnZhbHVlc1tpXTtcblx0XHRcdGlmKGN1cnIgJiYgY3VyclswXSA9PT0gYSh2KSkge1xuXHRcdFx0XHQvLyBWYWx1ZSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgYXJyYXkgLSBpbmNyZW1lbnQgaXRcblx0XHRcdFx0Y3VyclsxXSsrO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gVmFsdWUgZG9lc24ndCBleGlzdCAtIGFkZCBpdCBpbiBmb3JtIFt2YWx1ZSwgMV1cblx0XHRcdFx0cGF0aChwKS52YWx1ZXMuc3BsaWNlKGksIDAsIFthKHYpLCAxXSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRyZW1vdmU6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHJldHVybiBmdW5jdGlvbiAocCwgdiwgbmYpIHtcblx0XHRcdGlmKHByaW9yKSBwcmlvcihwLCB2LCBuZik7XG5cdFx0XHRpID0gcGF0aChwKS5iaXNlY3QocGF0aChwKS52YWx1ZXMsIGEodiksIDAsIHBhdGgocCkudmFsdWVzLmxlbmd0aCk7XG5cdFx0XHQvLyBWYWx1ZSBhbHJlYWR5IGV4aXN0cyBvciBzb21ldGhpbmcgaGFzIGdvbmUgdGVycmlibHkgd3JvbmcuXG5cdFx0XHRwYXRoKHApLnZhbHVlc1tpXVsxXS0tO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0aW5pdGlhbDogZnVuY3Rpb24gKHByaW9yLCBwYXRoKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwKSB7XG5cdFx0XHRwID0gcHJpb3IocCk7XG5cdFx0XHQvLyBBcnJheVtBcnJheVt2YWx1ZSwgY291bnRdXVxuXHRcdFx0cGF0aChwKS52YWx1ZXMgPSBbXTtcblx0XHRcdHBhdGgocCkuYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGRbMF07IH0pLmxlZnQ7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3ZhbHVlX2NvdW50OyIsInZhciBjcm9zc2ZpbHRlciA9IHJlcXVpcmUoJ2Nyb3NzZmlsdGVyJyk7XG5cbnZhciByZWR1Y3Rpb192YWx1ZV9saXN0ID0ge1xuXHRhZGQ6IGZ1bmN0aW9uIChhLCBwcmlvciwgcGF0aCkge1xuXHRcdHZhciBpO1xuXHRcdHZhciBiaXNlY3QgPSBjcm9zc2ZpbHRlci5iaXNlY3QuYnkoZnVuY3Rpb24oZCkgeyByZXR1cm4gZDsgfSkubGVmdDtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHAsIHYsIG5mKSB7XG5cdFx0XHRpZihwcmlvcikgcHJpb3IocCwgdiwgbmYpO1xuXHRcdFx0Ly8gTm90IHN1cmUgaWYgdGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIHNvcnRpbmcuXG5cdFx0XHRpID0gYmlzZWN0KHBhdGgocCkudmFsdWVMaXN0LCBhKHYpLCAwLCBwYXRoKHApLnZhbHVlTGlzdC5sZW5ndGgpO1xuXHRcdFx0cGF0aChwKS52YWx1ZUxpc3Quc3BsaWNlKGksIDAsIGEodikpO1xuXHRcdFx0cmV0dXJuIHA7XG5cdFx0fTtcblx0fSxcblx0cmVtb3ZlOiBmdW5jdGlvbiAoYSwgcHJpb3IsIHBhdGgpIHtcblx0XHR2YXIgaTtcblx0XHR2YXIgYmlzZWN0ID0gY3Jvc3NmaWx0ZXIuYmlzZWN0LmJ5KGZ1bmN0aW9uKGQpIHsgcmV0dXJuIGQ7IH0pLmxlZnQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uIChwLCB2LCBuZikge1xuXHRcdFx0aWYocHJpb3IpIHByaW9yKHAsIHYsIG5mKTtcblx0XHRcdGkgPSBiaXNlY3QocGF0aChwKS52YWx1ZUxpc3QsIGEodiksIDAsIHBhdGgocCkudmFsdWVMaXN0Lmxlbmd0aCk7XG5cdFx0XHQvLyBWYWx1ZSBhbHJlYWR5IGV4aXN0cyBvciBzb21ldGhpbmcgaGFzIGdvbmUgdGVycmlibHkgd3JvbmcuXG5cdFx0XHRwYXRoKHApLnZhbHVlTGlzdC5zcGxpY2UoaSwgMSk7XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9LFxuXHRpbml0aWFsOiBmdW5jdGlvbiAocHJpb3IsIHBhdGgpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24gKHApIHtcblx0XHRcdHAgPSBwcmlvcihwKTtcblx0XHRcdHBhdGgocCkudmFsdWVMaXN0ID0gW107XG5cdFx0XHRyZXR1cm4gcDtcblx0XHR9O1xuXHR9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlZHVjdGlvX3ZhbHVlX2xpc3Q7IiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxudmFyIG5hdHVyYWxTb3J0ID0gcmVxdWlyZSgnamF2YXNjcmlwdC1uYXR1cmFsLXNvcnQnKTtcblxudmFyIGFnZ3JlZ2F0b3JzID0ge1xuICAvLyBDb2xsZWN0aW9uc1xuICAkc3VtOiAkc3VtLFxuICAkYXZnOiAkYXZnLFxuICAkbWF4OiAkbWF4LFxuICAkbWluOiAkbWluLFxuXG4gIC8vIFBpY2tlcnNcbiAgJGNvdW50OiAkY291bnQsXG4gICRmaXJzdDogJGZpcnN0LFxuICAkbGFzdDogJGxhc3QsXG4gICRnZXQ6ICRnZXQsXG4gICRudGg6ICRnZXQsIC8vIG50aCBpcyBzYW1lIGFzIHVzaW5nIGEgZ2V0XG4gICRudGhMYXN0OiAkbnRoTGFzdCxcbiAgJG50aFBjdDogJG50aFBjdCxcbiAgJG1hcDogJG1hcCxcbiAgJHNvcnQ6ICRzb3J0LFxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIG1ha2VGdW5jdGlvbjogbWFrZUZ1bmN0aW9uLFxuICAgIGFnZ3JlZ2F0b3JzOiBhZ2dyZWdhdG9ycyxcbiAgICBwYXJzZUFnZ3JlZ2F0b3JQYXJhbXM6IHBhcnNlQWdncmVnYXRvclBhcmFtcyxcbiAgfVxuICAvLyBUaGlzIGlzIHVzZWQgdG8gYnVpbGQgYWdncmVnYXRpb24gc3RhY2tzIGZvciBzdWItcmVkdWN0aW9cbiAgLy8gYWdncmVnYXRpb25zLCBvciBwbHVja2luZyB2YWx1ZXMgZm9yIHVzZSBpbiBmaWx0ZXJzIGZyb20gdGhlIGRhdGFcbmZ1bmN0aW9uIG1ha2VGdW5jdGlvbihvYmopIHtcbiAgdmFyIHN0YWNrID0gbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24ob2JqKS5yZXZlcnNlKClcblxuICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgIHJldHVybiBzdGFjay5yZWR1Y2UoZnVuY3Rpb24ocHJldmlvdXMsIGN1cnJlbnQpIHtcbiAgICAgIHJldHVybiBjdXJyZW50KHByZXZpb3VzKVxuICAgIH0sIGQpXG4gIH1cbn1cblxuLy8gQSByZWN1cnNpdmUgZnVuY3Rpb24gdGhhdCB3YWxrcyB0aGUgYWdncmVnYXRpb24gc3RhY2sgYW5kIHJldHVybnNcbi8vIGEgZnVuY3Rpb24uIFRoZSByZXR1cm5lZCBmdW5jdGlvbiwgd2hlbiBjYWxsZWQsIHdpbGwgcmVjdXJzaXZlbHkgaW52b2tlXG4vLyB3aXRoIHRoZSBwcm9wZXJ0aWVzIGZyb20gdGhlIHByZXZpb3VzIHN0YWNrIGluIHJldmVyc2Ugb3JkZXJcbmZ1bmN0aW9uIG1ha2VTdWJBZ2dyZWdhdGlvbkZ1bmN0aW9uKG9iaikge1xuXG4gIHZhciBrZXlWYWwgPSBfLmlzT2JqZWN0KG9iaikgPyBleHRyYWN0S2V5VmFsKG9iaikgOiBvYmpcblxuICAvLyBEZXRlY3Qgc3RyaW5ncywgdGhlIGVuZCBvZiB0aGUgbGluZVxuICBpZiAoXy5pc1N0cmluZyhvYmopKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBkW29ial1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbiBhcnJheSwgcmVjdXJzZSBpbnRvIGVhY2ggaXRlbSBhbmQgcmV0dXJuIGFzIGEgbWFwXG4gIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgIHZhciBzdWJTdGFjayA9IF8ubWFwKG9iaiwgbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24pXG4gICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgIHJldHVybiBzdWJTdGFjay5tYXAoZnVuY3Rpb24ocykge1xuICAgICAgICByZXR1cm4gcyhkKVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyBJZiBvYmplY3QsIGZpbmQgdGhlIGFnZ3JlZ2F0aW9uLCBhbmQgcmVjdXJzZSBpbnRvIHRoZSB2YWx1ZVxuICBpZiAoa2V5VmFsLmtleSkge1xuICAgIGlmIChhZ2dyZWdhdG9yc1trZXlWYWwua2V5XSkge1xuICAgICAgcmV0dXJuIFthZ2dyZWdhdG9yc1trZXlWYWwua2V5XSwgbWFrZVN1YkFnZ3JlZ2F0aW9uRnVuY3Rpb24oa2V5VmFsLnZhbHVlKV1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5lcnJvcignQ291bGQgbm90IGZpbmQgYWdncmVncmF0aW9uIG1ldGhvZCcsIGtleVZhbClcbiAgICB9XG4gIH1cblxuICByZXR1cm4gW11cbn1cblxuZnVuY3Rpb24gZXh0cmFjdEtleVZhbChvYmopIHtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIHZhbHVlOiBvYmpba2V5XVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm5cbn1cblxuZnVuY3Rpb24gcGFyc2VBZ2dyZWdhdG9yUGFyYW1zKGtleVN0cmluZykge1xuICB2YXIgcGFyYW1zID0gW11cbiAgdmFyIHAxID0ga2V5U3RyaW5nLmluZGV4T2YoJygnKVxuICB2YXIgcDIgPSBrZXlTdHJpbmcuaW5kZXhPZignKScpXG4gIHZhciBrZXkgPSBwMSA+IC0xID8ga2V5U3RyaW5nLnN1YnN0cmluZygwLCBwMSkgOiBrZXlTdHJpbmdcbiAgaWYgKCFhZ2dyZWdhdG9yc1trZXldKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbiAgaWYgKHAxID4gLTEgJiYgcDIgPiAtMSAmJiBwMiA+IHAxKSB7XG4gICAgcGFyYW1zID0ga2V5U3RyaW5nLnN1YnN0cmluZyhwMSArIDEsIHAyKS5zcGxpdCgnLCcpXG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFnZ3JlZ2F0b3I6IGFnZ3JlZ2F0b3JzW2tleV0sXG4gICAgcGFyYW1zOiBwYXJhbXNcbiAgfVxufVxuXG5cblxuXG4vLyBDb2xsZWN0aW9uIEFnZ3JlZ2F0b3JzXG5cbmZ1bmN0aW9uICRzdW0oY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGEgKyBiXG4gIH0pXG59XG5cbmZ1bmN0aW9uICRhdmcoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuLnJlZHVjZShmdW5jdGlvbihhLCBiKSB7XG4gICAgcmV0dXJuIGEgKyBiXG4gIH0pIC8gY2hpbGRyZW4ubGVuZ3RoXG59XG5cbmZ1bmN0aW9uICRtYXgoY2hpbGRyZW4pIHtcbiAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGNoaWxkcmVuKVxufVxuXG5mdW5jdGlvbiAkbWluKGNoaWxkcmVuKSB7XG4gIHJldHVybiBNYXRoLm1pbi5hcHBseShudWxsLCBjaGlsZHJlbilcbn1cblxuZnVuY3Rpb24gJGNvdW50KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlbi5sZW5ndGhcbn1cblxuZnVuY3Rpb24gJG1lZChjaGlsZHJlbikge1xuICBjaGlsZHJlbi5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYSAtIGJcbiAgfSlcbiAgdmFyIGhhbGYgPSBNYXRoLmZsb29yKGNoaWxkcmVuLmxlbmd0aCAvIDIpXG4gIGlmIChjaGlsZHJlbi5sZW5ndGggJSAyKVxuICAgIHJldHVybiBjaGlsZHJlbltoYWxmXVxuICBlbHNlXG4gICAgcmV0dXJuIChjaGlsZHJlbltoYWxmIC0gMV0gKyBjaGlsZHJlbltoYWxmXSkgLyAyLjBcbn1cblxuZnVuY3Rpb24gJGZpcnN0KGNoaWxkcmVuKSB7XG4gIHJldHVybiBjaGlsZHJlblswXVxufVxuXG5mdW5jdGlvbiAkbGFzdChjaGlsZHJlbikge1xuICByZXR1cm4gY2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV1cbn1cblxuZnVuY3Rpb24gJGdldChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW5bbl1cbn1cblxuZnVuY3Rpb24gJG50aExhc3QoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIG5dXG59XG5cbmZ1bmN0aW9uICRudGhQY3QoY2hpbGRyZW4sIG4pIHtcbiAgcmV0dXJuIGNoaWxkcmVuW01hdGgucm91bmQoY2hpbGRyZW4ubGVuZ3RoICogKG4gLyAxMDApKV1cbn1cblxuZnVuY3Rpb24gJG1hcChjaGlsZHJlbiwgbikge1xuICByZXR1cm4gY2hpbGRyZW4ubWFwKGZ1bmN0aW9uKGQpIHtcbiAgICByZXR1cm4gZFtuXVxuICB9KVxufVxuXG5mdW5jdGlvbiAkc29ydChjaGlsZHJlbiwgbikge1xuICAvLyBBbHBoYW51bWVyaWMgYnkgcHJvcGVydHlcbiAgaWYgKF8uaXNTdHJpbmcobikpIHtcbiAgICBjaGlsZHJlbi5zb3J0KGZ1bmN0aW9uIHNvcnRCeUtleShhLCBiKSB7XG4gICAgICBpZiAoYVtuXSA8IGJbbl0pXG4gICAgICAgIHJldHVybiAtMTtcbiAgICAgIGVsc2UgaWYgKGFbbl0gPiBiW25dKVxuICAgICAgICByZXR1cm4gMTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG4gIH1cbiAgLy8gTnVtZXJpYyBieSBwcm9wZXJ0eVxuICBpZiAoXy5pc051bWJlcihuKSkge1xuICAgIGNoaWxkcmVuLnNvcnQoZnVuY3Rpb24gc29ydEJ5S2V5KGEsIGIpIHtcbiAgICAgIHJldHVybiBhW25dIC0gYltuXVxuICAgIH0pO1xuICB9XG4gIC8vIEZsYXQsIG5hdHVyYWwgc29ydGluZ1xuICAvLyBCZSBzdXJlIHRvIGNvcHkgdGhlIGFycmF5IGFzIHRvIG5vdCBtdXRhdGUgdGhlIG9yaWdpbmFsXG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChjaGlsZHJlbikuc29ydChuYXR1cmFsU29ydClcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKTtcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGNsZWFyKGRlZikge1xuXG4gICAgLy8gQ2xlYXIgYSBzaW5nbGUgb3IgbXVsdGlwbGUgY29sdW1uIGRlZmluaXRpb25zXG4gICAgaWYgKGRlZikge1xuICAgICAgZGVmID0gXy5pc0FycmF5KGRlZikgPyBkZWYgOiBbZGVmXVxuICAgIH1cblxuICAgIGlmICghZGVmKSB7XG4gICAgICAvLyBDbGVhciBhbGwgb2YgdGhlIGNvbHVtbiBkZWZlbml0aW9uc1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHNlcnZpY2UuY29sdW1ucywgZGlzcG9zZUNvbHVtbikpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNlcnZpY2UuY29sdW1ucyA9IFtdXG4gICAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgICAgfSlcblxuICAgIH1cblxuXG4gICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKGRlZiwgZnVuY3Rpb24oZCkge1xuICAgICAgICBpZiAoXy5pc09iamVjdChkKSkge1xuICAgICAgICAgIGQgPSBkLmtleVxuICAgICAgICB9XG4gICAgICAgIC8vIENsZWFyIHRoZSBjb2x1bW5cbiAgICAgICAgdmFyIGNvbHVtbiA9IF8ucmVtb3ZlKHNlcnZpY2UuY29sdW1ucywgZnVuY3Rpb24oYykge1xuICAgICAgICAgIGlmIChfLmlzQXJyYXkoZCkpIHtcbiAgICAgICAgICAgIHJldHVybiAhXy54b3IoYy5rZXksIGQpLmxlbmd0aFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoYy5rZXkgPT09IGQpIHtcbiAgICAgICAgICAgIGlmIChjLmR5bmFtaWNSZWZlcmVuY2UpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSlbMF1cblxuICAgICAgICBpZiAoIWNvbHVtbikge1xuICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbygnQXR0ZW1wdGVkIHRvIGNsZWFyIGEgY29sdW1uIHRoYXQgaXMgcmVxdWlyZWQgZm9yIGFub3RoZXIgcXVlcnkhJywgYylcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGRpc3Bvc2VDb2x1bW4oY29sdW1uKVxuICAgICAgfSkpXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG5cbiAgICBmdW5jdGlvbiBkaXNwb3NlQ29sdW1uKGNvbHVtbikge1xuICAgICAgLy8gRGlzcG9zZSB0aGUgZGltZW5zaW9uXG4gICAgICB2YXIgZGlzcG9zYWxBY3Rpb25zID0gXy5tYXAoY29sdW1uLnJlbW92ZUxpc3RlbmVycywgZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShsaXN0ZW5lcigpKVxuICAgICAgfSlcbiAgICAgIHZhciBmaWx0ZXJLZXkgPSBjb2x1bW4uY29tcGxleCA/IEpTT04uc3RyaW5naWZ5KGNvbHVtbi5rZXkpIDogY29sdW1uLmtleVxuICAgICAgZGVsZXRlIHNlcnZpY2UuZmlsdGVyc1tmaWx0ZXJLZXldXG4gICAgICBkaXNwb3NhbEFjdGlvbnMucHVzaChQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5kaXNwb3NlKCkpKVxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGRpc3Bvc2FsQWN0aW9ucylcbiAgICB9XG5cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZShcInFcIik7XG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZXJ2aWNlKSB7XG5cbiAgdmFyIGRpbWVuc2lvbiA9IHJlcXVpcmUoJy4vZGltZW5zaW9uJykoc2VydmljZSlcblxuICB2YXIgY29sdW1uRnVuYyA9IGNvbHVtblxuICBjb2x1bW5GdW5jLmZpbmQgPSBmaW5kQ29sdW1uXG5cbiAgcmV0dXJuIGNvbHVtbkZ1bmNcblxuICBmdW5jdGlvbiBjb2x1bW4oZGVmKSB7XG5cbiAgICAvLyBTdXBwb3J0IGdyb3VwQWxsIGRpbWVuc2lvblxuICAgIGlmIChfLmlzVW5kZWZpbmVkKGRlZikpIHtcbiAgICAgIGRlZiA9IHRydWVcbiAgICB9XG5cbiAgICAvLyBBbHdheXMgZGVhbCBpbiBidWxrLiAgTGlrZSBDb3N0Y28hXG4gICAgaWYgKCFfLmlzQXJyYXkoZGVmKSkge1xuICAgICAgZGVmID0gW2RlZl1cbiAgICB9XG5cbiAgICAvLyBNYXBwIGFsbCBjb2x1bW4gY3JlYXRpb24sIHdhaXQgZm9yIGFsbCB0byBzZXR0bGUsIHRoZW4gcmV0dXJuIHRoZSBpbnN0YW5jZVxuICAgIHJldHVybiBQcm9taXNlLmFsbChfLm1hcChkZWYsIG1ha2VDb2x1bW4pKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlXG4gICAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZENvbHVtbihkKSB7XG4gICAgcmV0dXJuIF8uZmluZChzZXJ2aWNlLmNvbHVtbnMsIGZ1bmN0aW9uKGMpIHtcbiAgICAgIGlmIChfLmlzQXJyYXkoZCkpIHtcbiAgICAgICAgcmV0dXJuICFfLnhvcihjLmtleSwgZCkubGVuZ3RoXG4gICAgICB9XG4gICAgICByZXR1cm4gYy5rZXkgPT09IGRcbiAgICB9KVxuICB9XG5cblxuICBmdW5jdGlvbiBnZXRUeXBlKGQpIHtcbiAgICBpZiAoXy5pc051bWJlcihkKSkge1xuICAgICAgcmV0dXJuICdudW1iZXInXG4gICAgfVxuICAgIGlmIChfLmlzQm9vbGVhbihkKSkge1xuICAgICAgcmV0dXJuICdib29sJ1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGQpKSB7XG4gICAgICByZXR1cm4gJ2FycmF5J1xuICAgIH1cbiAgICBpZiAoXy5pc09iamVjdChkKSkge1xuICAgICAgcmV0dXJuICdvYmplY3QnXG4gICAgfVxuICAgIHJldHVybiAnc3RyaW5nJ1xuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUNvbHVtbihkKSB7XG5cbiAgICB2YXIgY29sdW1uID0gXy5pc09iamVjdChkKSA/IGQgOiB7XG4gICAgICBrZXk6IGQsXG4gICAgfVxuXG4gICAgLy8gR2V0IGEgc2FtcGxlIG9mIHRoZSBjb2x1bW5cbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5hbGwoKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihhbGwpIHtcblxuICAgICAgICB2YXIgc2FtcGxlXG5cbiAgICAgICAgLy8gQ29tcGxleCBjb2x1bW4gS2V5c1xuICAgICAgICBpZiAoXy5pc0FycmF5KGNvbHVtbi5rZXkpKSB7XG4gICAgICAgICAgY29sdW1uLmNvbXBsZXggPSB0cnVlXG4gICAgICAgICAgc2FtcGxlID0gXy5rZXlzKF8ucGljayhhbGxbMF0sIGNvbHVtbi5rZXkpKVxuICAgICAgICAgIGlmIChzYW1wbGUubGVuZ3RoICE9PSBjb2x1bW4ua2V5Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb2x1bW4ga2V5IGRvZXMgbm90IGV4aXN0IGluIGRhdGEhJywgY29sdW1uLmtleSlcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2FtcGxlID0gYWxsWzBdW2NvbHVtbi5rZXldXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbmRleCBDb2x1bW5cbiAgICAgICAgaWYgKCFjb2x1bW4uY29tcGxleCAmJiBjb2x1bW4ua2V5ICE9PSB0cnVlICYmIHR5cGVvZihzYW1wbGUpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ29sdW1uIGtleSBkb2VzIG5vdCBleGlzdCBpbiBkYXRhIScsIGNvbHVtbi5rZXkpXG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZXhpc3RpbmcgPSBmaW5kQ29sdW1uKGNvbHVtbi5rZXkpXG5cbiAgICAgICAgLy8gSWYgdGhlIGNvbHVtbiBleGlzdHMsIGxldCdzIGF0IGxlYXN0IG1ha2Ugc3VyZSBpdCdzIG1hcmtlZFxuICAgICAgICAvLyBhcyBwZXJtYW5lbnQuIFRoZXJlIGlzIGEgc2xpZ2h0IGNoYW5jZSBpdCBleGlzdHMgYmVjYXVzZVxuICAgICAgICAvLyBvZiBhIGZpbHRlciwgYW5kIHRoZSB1c2VyIGRlY2lkZXMgdG8gbWFrZSBpdCBwZXJtYW5lbnRcbiAgICAgICAgaWYgKGV4aXN0aW5nICYmICFjb2x1bW4udGVtcG9yYXJ5KSB7XG4gICAgICAgICAgZXhpc3RpbmcudGVtcG9yYXJ5ID0gZmFsc2VcbiAgICAgICAgICBpZiAoY29sdW1uLmR5bmFtaWNSZWZlcmVuY2UpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nLmR5bmFtaWNSZWZlcmVuY2UgPSB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbygnQ29sdW1uIGhhcyBhbHJlYWR5IGJlZW4gZGVmaW5lZCcsIGFyZ3VtZW50cylcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbHVtbi50eXBlID1cbiAgICAgICAgICBjb2x1bW4ua2V5ID09PSB0cnVlID8gJ2FsbCcgOlxuICAgICAgICAgIGNvbHVtbi5jb21wbGV4ID8gJ2NvbXBsZXgnIDpcbiAgICAgICAgICBjb2x1bW4uYXJyYXkgPyAnYXJyYXknIDpcbiAgICAgICAgICBnZXRUeXBlKHNhbXBsZSlcblxuICAgICAgICByZXR1cm4gZGltZW5zaW9uLm1ha2UoY29sdW1uLmtleSwgY29sdW1uLnR5cGUpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oZGltKSB7XG4gICAgICAgIGlmICghZGltKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG4gICAgICAgIH1cbiAgICAgICAgY29sdW1uLmRpbWVuc2lvbiA9IGRpbVxuICAgICAgICBjb2x1bW4uZmlsdGVyQ291bnQgPSBjb2x1bW4uZmlsdGVyQ291bnQgfHwgMFxuICAgICAgICB2YXIgc3RvcExpc3RlbmluZ0ZvckRhdGEgPSBzZXJ2aWNlLm9uRGF0YUNoYW5nZShidWlsZENvbHVtbktleXMpXG4gICAgICAgIGNvbHVtbi5yZW1vdmVMaXN0ZW5lcnMgPSBbc3RvcExpc3RlbmluZ0ZvckRhdGFdXG5cbiAgICAgICAgc2VydmljZS5jb2x1bW5zLnB1c2goY29sdW1uKVxuXG4gICAgICAgIHJldHVybiBidWlsZENvbHVtbktleXMoKVxuXG4gICAgICAgIC8vIEJ1aWxkIHRoZSBjb2x1bW5LZXlzXG4gICAgICAgIGZ1bmN0aW9uIGJ1aWxkQ29sdW1uS2V5cyhvbkFkZCkge1xuICAgICAgICAgIGlmIChjb2x1bW4ua2V5ID09PSB0cnVlKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmJvdHRvbShJbmZpbml0eSkpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyb3dzKSB7XG4gICAgICAgICAgICAgIHZhciBhY2Nlc3NvciA9IGRpbWVuc2lvbi5tYWtlQWNjZXNzb3IoY29sdW1uLmtleSlcbiAgICAgICAgICAgICAgaWYoY29sdW1uLnR5cGUgPT09ICdhcnJheScpe1xuICAgICAgICAgICAgICAgIGNvbHVtbi52YWx1ZXMgPSBfLnVuaXEoXy5mbGF0dGVuKF8ubWFwKHJvd3MsIGFjY2Vzc29yKSkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZWxzZXtcbiAgICAgICAgICAgICAgICBjb2x1bW4udmFsdWVzID0gXy51bmlxKF8ubWFwKHJvd3MsIGFjY2Vzc29yKSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJyk7XG52YXIgY3Jvc3NmaWx0ZXIgPSByZXF1aXJlKCdjcm9zc2ZpbHRlcjInKVxuXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZXJ2aWNlKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBidWlsZDogYnVpbGQsXG4gICAgZ2VuZXJhdGVDb2x1bW5zOiBnZW5lcmF0ZUNvbHVtbnMsXG4gICAgYWRkOiBhZGQsXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gIH1cblxuICBmdW5jdGlvbiBidWlsZChjKSB7XG4gICAgaWYgKF8uaXNBcnJheShjKSkge1xuICAgICAgLy8gVGhpcyBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3Jvc3NmaWx0ZXIoYykpXG4gICAgfVxuICAgIGlmICghYyB8fCB0eXBlb2YoYy5kaW1lbnNpb24pICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IEVycm9yKCdObyBDcm9zc2ZpbHRlciBkYXRhIG9yIGluc3RhbmNlIGZvdW5kIScpKVxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGMpXG4gIH1cblxuICBmdW5jdGlvbiBnZW5lcmF0ZUNvbHVtbnMoZGF0YSkge1xuICAgIGlmICghc2VydmljZS5vcHRpb25zLmdlbmVyYXRlZENvbHVtbnMpIHtcbiAgICAgIHJldHVybiBkYXRhXG4gICAgfVxuICAgIHJldHVybiBfLm1hcChkYXRhLCBmdW5jdGlvbihkLCBpKSB7XG4gICAgICBfLmZvckVhY2goc2VydmljZS5vcHRpb25zLmdlbmVyYXRlZENvbHVtbnMsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICAgIGRba2V5XSA9IHZhbChkKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBkXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZChkYXRhKSB7XG4gICAgZGF0YSA9IGdlbmVyYXRlQ29sdW1ucyhkYXRhKVxuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzZXJ2aWNlLmNmLmFkZChkYXRhKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2Uuc2VyaWFsKF8ubWFwKHNlcnZpY2UuZGF0YUxpc3RlbmVycywgZnVuY3Rpb24obGlzdGVuZXIpIHtcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbGlzdGVuZXIodHJ1ZSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS50cnkoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2VydmljZS5jZi5yZW1vdmUoKSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHNlcnZpY2VcbiAgICAgIH0pXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKTtcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcblxuICByZXR1cm4ge1xuICAgIG1ha2U6IG1ha2UsXG4gICAgbWFrZUFjY2Vzc29yOiBtYWtlQWNjZXNzb3IsXG4gIH1cblxuICBmdW5jdGlvbiBtYWtlKGtleSwgdHlwZSkge1xuICAgIHZhciBhY2Nlc3NvciA9IG1ha2VBY2Nlc3NvcihrZXkpXG4gICAgLy8gUHJvbWlzZS5yZXNvbHZlIHdpbGwgaGFuZGxlIHByb21pc2VzIG9yIG5vbiBwcm9taXNlcywgc29cbiAgICAvLyB0aGlzIGNyb3NzZmlsdGVyIGFzeW5jIGlzIHN1cHBvcnRlZCBpZiBwcmVzZW50XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzZXJ2aWNlLmNmLmRpbWVuc2lvbihhY2Nlc3NvciwgdHlwZSA9PSAnYXJyYXknKSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VBY2Nlc3NvcihrZXkpe1xuICAgIHZhciBhY2Nlc3NvckZ1bmN0aW9uXG5cbiAgICAvLyBNdWx0aS1rZXkgZGltZW5zaW9uXG4gICAgaWYgKF8uaXNBcnJheShrZXkpKSB7XG4gICAgICB2YXIgYXJyYXlTdHJpbmcgPSBfLm1hcChrZXksIGZ1bmN0aW9uKGspIHtcbiAgICAgICAgcmV0dXJuIFwiZFsnXCIgKyBrICsgXCInXVwiXG4gICAgICB9KVxuICAgICAgYWNjZXNzb3JGdW5jdGlvbiA9IG5ldyBGdW5jdGlvbignZCcsICdyZXR1cm4gJyArIEpTT04uc3RyaW5naWZ5KGFycmF5U3RyaW5nKS5yZXBsYWNlKC9cXFwiL2csICcnKSArICcnKVxuICAgIH0gZWxzZSB7XG4gICAgICBhY2Nlc3NvckZ1bmN0aW9uID1cbiAgICAgICAgLy8gSW5kZXggRGltZW5zaW9uXG4gICAgICAgIGtleSA9PT0gdHJ1ZSA/IGZ1bmN0aW9uIGFjY2Vzc29yKGQsIGkpIHtcbiAgICAgICAgICByZXR1cm4gaVxuICAgICAgICB9IDpcbiAgICAgICAgLy8gVmFsdWUgQWNjZXNzb3IgRGltZW5zaW9uXG4gICAgICAgIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZFtrZXldXG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFjY2Vzc29yRnVuY3Rpb25cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbi8vIHZhciBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLy8gR2V0dGVyc1xuICAkZmllbGQ6ICRmaWVsZCxcbiAgLy8gQm9vbGVhbnNcbiAgJGFuZDogJGFuZCxcbiAgJG9yOiAkb3IsXG4gICRub3Q6ICRub3QsXG5cbiAgLy8gRXhwcmVzc2lvbnNcbiAgJGVxOiAkZXEsXG4gICRndDogJGd0LFxuICAkZ3RlOiAkZ3RlLFxuICAkbHQ6ICRsdCxcbiAgJGx0ZTogJGx0ZSxcbiAgJG5lOiAkbmUsXG4gICR0eXBlOiAkdHlwZSxcblxuICAvLyBBcnJheSBFeHByZXNzaW9uc1xuICAkaW46ICRpbixcbiAgJG5pbjogJG5pbixcbiAgJHNpemU6ICRzaXplLFxufVxuXG4vLyBHZXR0ZXJzXG5mdW5jdGlvbiAkZmllbGQoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGRbY2hpbGRdXG59XG5cbi8vIE9wZXJhdG9yc1xuXG5mdW5jdGlvbiAkYW5kKGQsIGNoaWxkKSB7XG4gIGNoaWxkID0gY2hpbGQoZClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5mdW5jdGlvbiAkb3IoZCwgY2hpbGQpIHtcbiAgY2hpbGQgPSBjaGlsZChkKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoaWxkW2ldKSB7XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gJG5vdChkLCBjaGlsZCkge1xuICBjaGlsZCA9IGNoaWxkKGQpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY2hpbGRbaV0pIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZVxufVxuXG5cbi8vIEV4cHJlc3Npb25zXG5cbmZ1bmN0aW9uICRlcShkLCBjaGlsZCkge1xuICByZXR1cm4gZCA9PT0gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkZ3QoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPiBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRndGUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPj0gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkbHQoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPCBjaGlsZCgpXG59XG5cbmZ1bmN0aW9uICRsdGUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgPD0gY2hpbGQoKVxufVxuXG5mdW5jdGlvbiAkbmUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQgIT09IGNoaWxkKClcbn1cblxuZnVuY3Rpb24gJHR5cGUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIHR5cGVvZihkKSA9PT0gY2hpbGQoKVxufVxuXG4vLyBBcnJheSBFeHByZXNzaW9uc1xuXG5mdW5jdGlvbiAkaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA+IC0xXG59XG5cbmZ1bmN0aW9uICRuaW4oZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQuaW5kZXhPZihjaGlsZCgpKSA9PT0gLTFcbn1cblxuZnVuY3Rpb24gJHNpemUoZCwgY2hpbGQpIHtcbiAgcmV0dXJuIGQubGVuZ3RoID09PSBjaGlsZCgpXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG52YXIgZXhwcmVzc2lvbnMgPSByZXF1aXJlKCcuL2V4cHJlc3Npb25zJylcbnZhciBhZ2dyZWdhdGlvbiA9IHJlcXVpcmUoJy4vYWdncmVnYXRpb24nKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNlcnZpY2UpIHtcbiAgcmV0dXJuIHtcbiAgICBmaWx0ZXI6IGZpbHRlcixcbiAgICBmaWx0ZXJBbGw6IGZpbHRlckFsbCxcbiAgICBhcHBseUZpbHRlcnM6IGFwcGx5RmlsdGVycyxcbiAgICBtYWtlRnVuY3Rpb246IG1ha2VGdW5jdGlvbixcbiAgICBzY2FuRm9yRHluYW1pY0ZpbHRlcnM6IHNjYW5Gb3JEeW5hbWljRmlsdGVyc1xuICB9XG5cbiAgZnVuY3Rpb24gZmlsdGVyKGNvbHVtbiwgZmlsLCBpc1JhbmdlLCByZXBsYWNlKSB7XG4gICAgdmFyIGV4aXN0cyA9IHNlcnZpY2UuY29sdW1uLmZpbmQoY29sdW1uKVxuXG4gICAgLy8gSWYgdGhlIGZpbHRlcnMgZGltZW5zaW9uIGRvZXNuJ3QgZXhpc3QgeWV0LCB0cnkgYW5kIGNyZWF0ZSBpdFxuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFleGlzdHMpIHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZS5jb2x1bW4oe1xuICAgICAgICAgICAgICBrZXk6IGNvbHVtbixcbiAgICAgICAgICAgICAgdGVtcG9yYXJ5OiB0cnVlLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyBJdCB3YXMgYWJsZSB0byBiZSBjcmVhdGVkLCBzbyByZXRyaWV2ZSBhbmQgcmV0dXJuIGl0XG4gICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbi5maW5kKGNvbHVtbilcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgICAgLy8gSXQgZXhpc3RzLCBzbyBqdXN0IHJldHVybiB3aGF0IHdlIGZvdW5kXG4gICAgICAgIHJldHVybiBleGlzdHNcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihjb2x1bW4pIHtcbiAgICAgICAgLy8gQ2xvbmUgYSBjb3B5IG9mIHRoZSBuZXcgZmlsdGVyc1xuICAgICAgICB2YXIgbmV3RmlsdGVycyA9IF8uY2xvbmUoc2VydmljZS5maWx0ZXJzLCB0cnVlKVxuICAgICAgICAgIC8vIEhlcmUgd2UgdXNlIHRoZSByZWdpc3RlcmVkIGNvbHVtbiBrZXkgZGVzcGl0ZSB0aGUgZmlsdGVyIGtleSBwYXNzZWQsIGp1c3QgaW4gY2FzZSB0aGUgZmlsdGVyIGtleSdzIG9yZGVyaW5nIGlzIG9yZGVyZWQgZGlmZmVyZW50bHkgOilcbiAgICAgICAgdmFyIGZpbHRlcktleSA9IGNvbHVtbi5jb21wbGV4ID8gSlNPTi5zdHJpbmdpZnkoY29sdW1uLmtleSkgOiBjb2x1bW4ua2V5XG4gICAgICAgICAgLy8gQnVpbGQgdGhlIGZpbHRlciBvYmplY3RcbiAgICAgICAgbmV3RmlsdGVyc1tmaWx0ZXJLZXldID0gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKVxuXG4gICAgICAgIHJldHVybiBhcHBseUZpbHRlcnMobmV3RmlsdGVycylcbiAgICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBmaWx0ZXJBbGwoKSB7XG4gICAgcmV0dXJuIGFwcGx5RmlsdGVycyh7fSlcbiAgfVxuXG5cbiAgZnVuY3Rpb24gYnVpbGRGaWx0ZXJPYmplY3QoZmlsLCBpc1JhbmdlLCByZXBsYWNlKSB7XG4gICAgaWYgKF8uaXNVbmRlZmluZWQoZmlsKSkge1xuICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IGZpbCxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdHlwZTogJ2Z1bmN0aW9uJyxcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKF8uaXNPYmplY3QoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgZnVuY3Rpb246IG1ha2VGdW5jdGlvbihmaWwpLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0eXBlOiAnZnVuY3Rpb24nXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkoZmlsKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsdWU6IGZpbCxcbiAgICAgICAgcmVwbGFjZTogaXNSYW5nZSB8fCByZXBsYWNlLFxuICAgICAgICB0eXBlOiBpc1JhbmdlID8gJ3JhbmdlJyA6ICdpbmNsdXNpdmUnLFxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgdmFsdWU6IGZpbCxcbiAgICAgIHJlcGxhY2U6IHJlcGxhY2UsXG4gICAgICB0eXBlOiAnZXhhY3QnLFxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFwcGx5RmlsdGVycyhuZXdGaWx0ZXJzKSB7XG4gICAgdmFyIGRzID0gXy5tYXAobmV3RmlsdGVycywgZnVuY3Rpb24oZmlsLCBpKSB7XG4gICAgICB2YXIgZXhpc3RpbmcgPSBzZXJ2aWNlLmZpbHRlcnNbaV1cbiAgICAgIC8vIEZpbHRlcnMgYXJlIHRoZSBzYW1lLCBzbyBubyBjaGFuZ2UgaXMgbmVlZGVkIG9uIHRoaXMgY29sdW1uXG4gICAgICBpZiAoZmlsLnJlcGxhY2UgJiYgZXhpc3RpbmcgJiYgXy5pc0VxdWFsKGZpbCwgZXhpc3RpbmcpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKVxuICAgICAgfVxuICAgICAgdmFyIGNvbHVtblxuICAgICAgICAvLyBSZXRyaWV2ZSBjb21wbGV4IGNvbHVtbnMgYnkgZGVjb2RpbmcgdGhlIGNvbHVtbiBrZXkgYXMganNvblxuICAgICAgaWYgKGkuY2hhckF0KDApID09PSAnWycpIHtcbiAgICAgICAgY29sdW1uID0gc2VydmljZS5jb2x1bW4uZmluZChKU09OLnBhcnNlKGkpKVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUmV0cmlldmUgdGhlIGNvbHVtbiBub3JtYWxseVxuICAgICAgICBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKGkpXG4gICAgICB9XG5cblxuICAgICAgLy8gVG9nZ2xpbmcgYSBmaWx0ZXIgdmFsdWUgaXMgYSBiaXQgZGlmZmVyZW50IGZyb20gcmVwbGFjaW5nIHRoZW1cbiAgICAgIGlmIChmaWwgJiYgZXhpc3RpbmcgJiYgIWZpbC5yZXBsYWNlKSB7XG4gICAgICAgIG5ld0ZpbHRlcnNbaV0gPSBmaWwgPSB0b2dnbGVGaWx0ZXJzKGZpbCwgZXhpc3RpbmcpXG4gICAgICB9XG5cblxuXG4gICAgICAvLyBJZiBubyBmaWx0ZXIsIHJlbW92ZSBldmVyeXRoaW5nIGZyb20gdGhlIGRpbWVuc2lvblxuICAgICAgaWYgKCFmaWwpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmZpbHRlckFsbCgpKVxuICAgICAgfVxuICAgICAgaWYgKGZpbC50eXBlID09PSAnZXhhY3QnKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJFeGFjdChmaWwudmFsdWUpKVxuICAgICAgfVxuICAgICAgaWYgKGZpbC50eXBlID09PSAncmFuZ2UnKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJSYW5nZShmaWwudmFsdWUpKVxuICAgICAgfVxuICAgICAgaWYgKGZpbC50eXBlID09PSAnaW5jbHVzaXZlJykge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyRnVuY3Rpb24oZnVuY3Rpb24oZCkge1xuICAgICAgICAgIHJldHVybiBmaWwudmFsdWUuaW5kZXhPZihkKSA+IC0xXG4gICAgICAgIH0pKVxuICAgICAgfVxuICAgICAgaWYgKGZpbC50eXBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY29sdW1uLmRpbWVuc2lvbi5maWx0ZXJGdW5jdGlvbihmaWwuZnVuY3Rpb24pKVxuICAgICAgfVxuICAgICAgLy8gQnkgZGVmYXVsdCBpZiBzb21ldGhpbmcgY3JhcHMgdXAsIGp1c3QgcmVtb3ZlIGFsbCBmaWx0ZXJzXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNvbHVtbi5kaW1lbnNpb24uZmlsdGVyQWxsKCkpXG4gICAgfSlcblxuICAgIHJldHVybiBQcm9taXNlLmFsbChkcylcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBTYXZlIHRoZSBuZXcgZmlsdGVycyBzYXRhdGVcbiAgICAgICAgc2VydmljZS5maWx0ZXJzID0gbmV3RmlsdGVyc1xuXG4gICAgICAgIC8vIFBsdWNrIGFuZCByZW1vdmUgZmFsc2V5IGZpbHRlcnMgZnJvbSB0aGUgbWl4XG4gICAgICAgIHZhciB0cnlSZW1vdmFsID0gW11cbiAgICAgICAgXy5mb3JFYWNoKHNlcnZpY2UuZmlsdGVycywgZnVuY3Rpb24odmFsLCBrZXkpIHtcbiAgICAgICAgICBpZiAoIXZhbCkge1xuICAgICAgICAgICAgdHJ5UmVtb3ZhbC5wdXNoKHtcbiAgICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICAgIHZhbDogdmFsLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGRlbGV0ZSBzZXJ2aWNlLmZpbHRlcnNba2V5XVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcblxuICAgICAgICAvLyBJZiBhbnkgb2YgdGhvc2UgZmlsdGVycyBhcmUgdGhlIGxhc3QgZGVwZW5kZW5jeSBmb3IgdGhlIGNvbHVtbiwgdGhlbiByZW1vdmUgdGhlIGNvbHVtblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoXy5tYXAodHJ5UmVtb3ZhbCwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKCh2LmtleS5jaGFyQXQoMCkgPT09ICdbJykgPyBKU09OLnBhcnNlKHYua2V5KSA6IHYua2V5KVxuICAgICAgICAgICAgaWYgKGNvbHVtbi50ZW1wb3JhcnkgJiYgIWNvbHVtbi5keW5hbWljUmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNsZWFyKGNvbHVtbi5rZXkpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gc2VydmljZVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvZ2dsZUZpbHRlcnMoZmlsLCBleGlzdGluZykge1xuICAgIC8vIEV4YWN0IGZyb20gSW5jbHVzaXZlXG4gICAgaWYgKGZpbC50eXBlID09PSAnZXhhY3QnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdpbmNsdXNpdmUnKSB7XG4gICAgICBmaWwudmFsdWUgPSBfLnhvcihbZmlsLnZhbHVlXSwgZXhpc3RpbmcudmFsdWUpXG4gICAgfVxuICAgIC8vIEluY2x1c2l2ZSBmcm9tIEV4YWN0XG4gICAgZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdpbmNsdXNpdmUnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdleGFjdCcpIHtcbiAgICAgIGZpbC52YWx1ZSA9IF8ueG9yKGZpbC52YWx1ZSwgW2V4aXN0aW5nLnZhbHVlXSlcbiAgICB9XG4gICAgLy8gSW5jbHVzaXZlIC8gSW5jbHVzaXZlIE1lcmdlXG4gICAgZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdpbmNsdXNpdmUnICYmIGV4aXN0aW5nLnR5cGUgPT09ICdpbmNsdXNpdmUnKSB7XG4gICAgICBmaWwudmFsdWUgPSBfLnhvcihmaWwudmFsdWUsIGV4aXN0aW5nLnZhbHVlKVxuICAgIH1cbiAgICAvLyBFeGFjdCAvIEV4YWN0XG4gICAgZWxzZSBpZiAoZmlsLnR5cGUgPT09ICdleGFjdCcgJiYgZXhpc3RpbmcudHlwZSA9PT0gJ2V4YWN0Jykge1xuICAgICAgLy8gSWYgdGhlIHZhbHVlcyBhcmUgdGhlIHNhbWUsIHJlbW92ZSB0aGUgZmlsdGVyIGVudGlyZWx5XG4gICAgICBpZiAoZmlsLnZhbHVlID09PSBleGlzdGluZy52YWx1ZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICAgIC8vIFRoZXkgdGhleSBhcmUgZGlmZmVyZW50LCBtYWtlIGFuIGFycmF5XG4gICAgICBmaWwudmFsdWUgPSBbZmlsLnZhbHVlLCBleGlzdGluZy52YWx1ZV1cbiAgICB9XG5cbiAgICAvLyBTZXQgdGhlIG5ldyB0eXBlIGJhc2VkIG9uIHRoZSBtZXJnZWQgdmFsdWVzXG4gICAgaWYgKCFmaWwudmFsdWUubGVuZ3RoKSB7XG4gICAgICBmaWwgPSBmYWxzZVxuICAgIH0gZWxzZSBpZiAoZmlsLnZhbHVlLmxlbmd0aCA9PT0gMSkge1xuICAgICAgZmlsLnR5cGUgPSAnZXhhY3QnXG4gICAgICBmaWwudmFsdWUgPSBmaWwudmFsdWVbMF1cbiAgICB9IGVsc2Uge1xuICAgICAgZmlsLnR5cGUgPSAnaW5jbHVzaXZlJ1xuICAgIH1cblxuICAgIHJldHVybiBmaWxcbiAgfVxuXG4gIGZ1bmN0aW9uIHNjYW5Gb3JEeW5hbWljRmlsdGVycyhxdWVyeSkge1xuICAgIC8vIEhlcmUgd2UgY2hlY2sgdG8gc2VlIGlmIHRoZXJlIGFyZSBhbnkgcmVsYXRpdmUgcmVmZXJlbmNlcyB0byB0aGUgcmF3IGRhdGFcbiAgICAvLyBiZWluZyB1c2VkIGluIHRoZSBmaWx0ZXIuIElmIHNvLCB3ZSBuZWVkIHRvIGJ1aWxkIHRob3NlIGRpbWVuc2lvbnMgYW5kIGtlZXBcbiAgICAvLyB0aGVtIHVwZGF0ZWQgc28gdGhlIGZpbHRlcnMgY2FuIGJlIHJlYnVpbHQgaWYgbmVlZGVkXG4gICAgLy8gVGhlIHN1cHBvcnRlZCBrZXlzIHJpZ2h0IG5vdyBhcmU6ICRjb2x1bW4sICRkYXRhXG4gICAgdmFyIGNvbHVtbnMgPSBbXVxuICAgIHdhbGsocXVlcnkuZmlsdGVyKVxuICAgIHJldHVybiBjb2x1bW5zXG5cbiAgICBmdW5jdGlvbiB3YWxrKG9iaikge1xuICAgICAgXy5mb3JFYWNoKG9iaiwgZnVuY3Rpb24odmFsLCBrZXkpIHtcbiAgICAgICAgLy8gZmluZCB0aGUgZGF0YSByZWZlcmVuY2VzLCBpZiBhbnlcbiAgICAgICAgdmFyIHJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyh2YWwsIGtleSlcbiAgICAgICAgaWYocmVmKSBjb2x1bW5zLnB1c2gocmVmKVxuICAgICAgICAgIC8vIGlmIGl0J3MgYSBzdHJpbmdcbiAgICAgICAgaWYgKF8uaXNTdHJpbmcodmFsKSkge1xuICAgICAgICAgIHJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCB2YWwpXG4gICAgICAgICAgaWYocmVmKSBjb2x1bW5zLnB1c2gocmVmKVxuICAgICAgICB9XG4gICAgICAgIC8vIElmIGl0J3MgYW5vdGhlciBvYmplY3QsIGtlZXAgbG9va2luZ1xuICAgICAgICBpZiAoXy5pc09iamVjdCh2YWwpKSB7XG4gICAgICAgICAgd2Fsayh2YWwpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZmluZERhdGFSZWZlcmVuY2VzKHZhbCwga2V5KSB7XG4gICAgLy8gbG9vayBmb3IgdGhlICRkYXRhIHN0cmluZyBhcyBhIHZhbHVlXG4gICAgaWYgKGtleSA9PT0gJyRkYXRhJykge1xuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBsb29rIGZvciB0aGUgJGNvbHVtbiBrZXkgYW5kIGl0J3MgdmFsdWUgYXMgYSBzdHJpbmdcbiAgICBpZiAoa2V5ICYmIGtleSA9PT0gJyRjb2x1bW4nKSB7XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWwpKSB7XG4gICAgICAgIHJldHVybiB2YWxcbiAgICAgIH1cbiAgICAgIGNvbnNvbGUud2FybignVGhlIHZhbHVlIGZvciBmaWx0ZXIgXCIkY29sdW1uXCIgbXVzdCBiZSBhIHZhbGlkIGNvbHVtbiBrZXknLCB2YWwpXG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlRnVuY3Rpb24ob2JqLCBpc0FnZ3JlZ2F0aW9uKSB7XG5cbiAgICB2YXIgc3ViR2V0dGVyc1xuXG4gICAgLy8gRGV0ZWN0IHJhdyAkZGF0YSByZWZlcmVuY2VcbiAgICBpZiAoXy5pc1N0cmluZyhvYmopKSB7XG4gICAgICB2YXIgZGF0YVJlZiA9IGZpbmREYXRhUmVmZXJlbmNlcyhudWxsLCBvYmopXG4gICAgICBpZiAoZGF0YVJlZikge1xuICAgICAgICB2YXIgZGF0YSA9IHNlcnZpY2UuY2YuYWxsKClcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKF8uaXNTdHJpbmcob2JqKSB8fCBfLmlzTnVtYmVyKG9iaikgfHwgXy5pc0Jvb2xlYW4ob2JqKSkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgaWYgKHR5cGVvZihkKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGV4cHJlc3Npb25zLiRlcShkLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gb2JqXG4gICAgICAgIH0pXG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gSWYgYW4gYXJyYXksIHJlY3Vyc2UgaW50byBlYWNoIGl0ZW0gYW5kIHJldHVybiBhcyBhIG1hcFxuICAgIGlmIChfLmlzQXJyYXkob2JqKSkge1xuICAgICAgc3ViR2V0dGVycyA9IF8ubWFwKG9iaiwgZnVuY3Rpb24obykge1xuICAgICAgICByZXR1cm4gbWFrZUZ1bmN0aW9uKG8sIGlzQWdncmVnYXRpb24pXG4gICAgICB9KVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgcmV0dXJuIHN1YkdldHRlcnMubWFwKGZ1bmN0aW9uKHMpIHtcbiAgICAgICAgICByZXR1cm4gcyhkKVxuICAgICAgICB9KVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIElmIG9iamVjdCwgcmV0dXJuIGEgcmVjdXJzaW9uIGZ1bmN0aW9uIHRoYXQgaXRzZWxmLCByZXR1cm5zIHRoZSByZXN1bHRzIG9mIGFsbCBvZiB0aGUgb2JqZWN0IGtleXNcbiAgICBpZiAoXy5pc09iamVjdChvYmopKSB7XG4gICAgICBzdWJHZXR0ZXJzID0gXy5tYXAob2JqLCBmdW5jdGlvbih2YWwsIGtleSkge1xuXG4gICAgICAgIC8vIEdldCB0aGUgY2hpbGRcbiAgICAgICAgdmFyIGdldFN1YiA9IG1ha2VGdW5jdGlvbih2YWwsIGlzQWdncmVnYXRpb24pXG5cbiAgICAgICAgLy8gRGV0ZWN0IHJhdyAkY29sdW1uIHJlZmVyZW5jZXNcbiAgICAgICAgdmFyIGRhdGFSZWYgPSBmaW5kRGF0YVJlZmVyZW5jZXModmFsLCBrZXkpXG4gICAgICAgIGlmIChkYXRhUmVmKSB7XG4gICAgICAgICAgdmFyIGNvbHVtbiA9IHNlcnZpY2UuY29sdW1uLmZpbmQoZGF0YVJlZilcbiAgICAgICAgICB2YXIgZGF0YSA9IGNvbHVtbi52YWx1ZXNcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGFcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiBleHByZXNzaW9uLCBwYXNzIHRoZSBwYXJlbnRWYWx1ZSBhbmQgdGhlIHN1YkdldHRlclxuICAgICAgICBpZiAoZXhwcmVzc2lvbnNba2V5XSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICByZXR1cm4gZXhwcmVzc2lvbnNba2V5XShkLCBnZXRTdWIpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFnZ3JlZ2F0b3JPYmogPSBhZ2dyZWdhdGlvbi5wYXJzZUFnZ3JlZ2F0b3JQYXJhbXMoa2V5KVxuICAgICAgICBpZiAoYWdncmVnYXRvck9iaikge1xuICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGFueSBmdXJ0aGVyIG9wZXJhdGlvbnMgYXJlIGZvciBhZ2dyZWdhdGlvbnNcbiAgICAgICAgICAvLyBhbmQgbm90IGZpbHRlcnNcbiAgICAgICAgICBpc0FnZ3JlZ2F0aW9uID0gdHJ1ZVxuICAgICAgICAgICAgLy8gaGVyZSB3ZSBwYXNzIHRydWUgdG8gbWFrZUZ1bmN0aW9uIHdoaWNoIGRlbm90ZXMgdGhhdFxuICAgICAgICAgICAgLy8gYW4gYWdncmVnYXRpbm8gY2hhaW4gaGFzIHN0YXJ0ZWQgYW5kIHRvIHN0b3AgdXNpbmcgJEFORFxuICAgICAgICAgIGdldFN1YiA9IG1ha2VGdW5jdGlvbih2YWwsIGlzQWdncmVnYXRpb24pXG4gICAgICAgICAgICAvLyBJZiBpdCdzIGFuIGFnZ3JlZ2F0aW9uIG9iamVjdCwgYmUgc3VyZSB0byBwYXNzIGluIHRoZSBjaGlsZHJlbiwgYW5kIHRoZW4gYW55IGFkZGl0aW9uYWwgcGFyYW1zIHBhc3NlZCBpbnRvIHRoZSBhZ2dyZWdhdGlvbiBzdHJpbmdcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgICAgcmV0dXJuIGFnZ3JlZ2F0b3JPYmouYWdncmVnYXRvci5hcHBseShudWxsLCBbZ2V0U3ViKCldLmNvbmNhdChhZ2dyZWdhdG9yT2JqLnBhcmFtcykpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQgbXVzdCBiZSBhIHN0cmluZyB0aGVuLiBQbHVjayB0aGF0IHN0cmluZyBrZXkgZnJvbSBwYXJlbnQsIGFuZCBwYXNzIGl0IGFzIHRoZSBuZXcgdmFsdWUgdG8gdGhlIHN1YkdldHRlclxuICAgICAgICByZXR1cm4gZnVuY3Rpb24oZCkge1xuICAgICAgICAgIGQgPSBkW2tleV1cbiAgICAgICAgICByZXR1cm4gZ2V0U3ViKGQsIGdldFN1YilcbiAgICAgICAgfVxuXG4gICAgICB9KVxuXG4gICAgICAvLyBBbGwgb2JqZWN0IGV4cHJlc3Npb25zIGFyZSBiYXNpY2FsbHkgQU5EJ3NcbiAgICAgIC8vIFJldHVybiBBTkQgd2l0aCBhIG1hcCBvZiB0aGUgc3ViR2V0dGVyc1xuICAgICAgaWYgKGlzQWdncmVnYXRpb24pIHtcbiAgICAgICAgaWYgKHN1YkdldHRlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgIHJldHVybiBzdWJHZXR0ZXJzWzBdKGQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIF8ubWFwKHN1YkdldHRlcnMsIGZ1bmN0aW9uKGdldFN1Yikge1xuICAgICAgICAgICAgcmV0dXJuIGdldFN1YihkKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgICAgIHJldHVybiBleHByZXNzaW9ucy4kYW5kKGQsIGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXR1cm4gXy5tYXAoc3ViR2V0dGVycywgZnVuY3Rpb24oZ2V0U3ViKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3ViKGQpXG4gICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZygnbm8gZXhwcmVzc2lvbiBmb3VuZCBmb3IgJywgb2JqKVxuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIG5hdHVyYWxTb3J0ID0gcmVxdWlyZSgnamF2YXNjcmlwdC1uYXR1cmFsLXNvcnQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGFzc2lnbjogYXNzaWduLFxuICBmaW5kOiBmaW5kLFxuICByZW1vdmU6IHJlbW92ZSxcbiAgaXNBcnJheTogaXNBcnJheSxcbiAgaXNPYmplY3Q6IGlzT2JqZWN0LFxuICBpc0Jvb2xlYW46IGlzQm9vbGVhbixcbiAgaXNTdHJpbmc6IGlzU3RyaW5nLFxuICBpc051bWJlcjogaXNOdW1iZXIsXG4gIGlzRnVuY3Rpb246IGlzRnVuY3Rpb24sXG4gIGdldDogZ2V0LFxuICBtYXA6IG1hcCxcbiAgc29ydEJ5OiBzb3J0QnksXG4gIGZvckVhY2g6IGZvckVhY2gsXG4gIGlzVW5kZWZpbmVkOiBpc1VuZGVmaW5lZCxcbiAgcGljazogcGljayxcbiAgeG9yOiB4b3IsXG4gIGNsb25lOiBjbG9uZSxcbiAgaXNFcXVhbDogaXNFcXVhbCxcbiAgcmVwbGFjZUFycmF5OiByZXBsYWNlQXJyYXksXG4gIHVuaXE6IHVuaXEsXG4gIGZsYXR0ZW46IGZsYXR0ZW4sXG4gIHNvcnQ6IHNvcnQsXG4gIGtleXM6IGtleXMsXG59XG5cblxuZnVuY3Rpb24gYXNzaWduKG91dCkge1xuICBvdXQgPSBvdXQgfHwge31cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoIWFyZ3VtZW50c1tpXSlcbiAgICAgIGNvbnRpbnVlO1xuICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcbiAgICAgIGlmIChhcmd1bWVudHNbaV0uaGFzT3duUHJvcGVydHkoa2V5KSlcbiAgICAgICAgb3V0W2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XVxuICAgIH1cbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIGZpbmQoYSwgYikge1xuICByZXR1cm4gYS5maW5kKGIpO1xufVxuXG5mdW5jdGlvbiByZW1vdmUoYSwgYikge1xuICByZXR1cm4gYS5maWx0ZXIoZnVuY3Rpb24obywgaSkge1xuICAgIHZhciByID0gYihvKVxuICAgIGlmIChyKSB7XG4gICAgICBhLnNwbGljZShpLCAxKVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG4gIH0pXG59XG5cbmZ1bmN0aW9uIGlzQXJyYXkoYSkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShhKVxufVxuXG5mdW5jdGlvbiBpc09iamVjdChkKSB7XG4gIHJldHVybiB0eXBlb2YoZCkgPT09ICdvYmplY3QnICYmICFpc0FycmF5KGQpXG59XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihkKSB7XG4gIHJldHVybiB0eXBlb2YoZCkgPT09ICdib29sZWFuJ1xufVxuXG5mdW5jdGlvbiBpc1N0cmluZyhkKSB7XG4gIHJldHVybiB0eXBlb2YoZCkgPT09ICdzdHJpbmcnXG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGQpIHtcbiAgcmV0dXJuIHR5cGVvZihkKSA9PT0gJ251bWJlcidcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhKSB7XG4gIHJldHVybiB0eXBlb2YoYSkgPT09ICdmdW5jdGlvbidcbn1cblxuZnVuY3Rpb24gZ2V0KGEsIGIpIHtcbiAgcmV0dXJuIGIuXG4gIHJlcGxhY2UoJ1snLCAnLicpLnJlcGxhY2UoJ10nLCAnJykuXG4gIHNwbGl0KCcuJykuXG4gIHJlZHVjZShcbiAgICBmdW5jdGlvbihvYmosIHByb3BlcnR5KSB7XG4gICAgICByZXR1cm4gb2JqW3Byb3BlcnR5XTtcbiAgICB9LCBhXG4gIClcbn1cblxuZnVuY3Rpb24gbWFwKGEsIGIpIHtcbiAgdmFyIG1cbiAgdmFyIGtleVxuICBpZiAoaXNGdW5jdGlvbihiKSkge1xuICAgIGlmIChpc09iamVjdChhKSkge1xuICAgICAgbSA9IFtdXG4gICAgICBmb3IgKGtleSBpbiBhKSB7XG4gICAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICBtLnB1c2goYihhW2tleV0sIGtleSwgYSkpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBtXG4gICAgfVxuICAgIHJldHVybiBhLm1hcChiKVxuICB9XG4gIGlmIChpc09iamVjdChhKSkge1xuICAgIG0gPSBbXVxuICAgIGZvciAoa2V5IGluIGEpIHtcbiAgICAgIGlmIChhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbS5wdXNoKGFba2V5XVtiXSlcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1cbiAgfVxuICByZXR1cm4gYS5tYXAoZnVuY3Rpb24oYWEsIGkpIHtcbiAgICByZXR1cm4gYWFbYl1cbiAgfSlcbn1cblxuZnVuY3Rpb24gc29ydEJ5KGEsIGIpIHtcbiAgaWYgKGlzRnVuY3Rpb24oYikpIHtcbiAgICByZXR1cm4gYS5zb3J0KGZ1bmN0aW9uKGFhLCBiYikge1xuICAgICAgaWYgKGFhLnZhbHVlID4gYmIudmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIDE7XG4gICAgICB9XG4gICAgICBpZiAoYWEudmFsdWUgPCBiYi52YWx1ZSkge1xuICAgICAgICByZXR1cm4gLTE7XG4gICAgICB9XG4gICAgICAvLyBhIG11c3QgYmUgZXF1YWwgdG8gYlxuICAgICAgcmV0dXJuIDA7XG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9yRWFjaChhLCBiKSB7XG4gIGlmIChpc09iamVjdChhKSkge1xuICAgIGZvciAodmFyIGtleSBpbiBhKSB7XG4gICAgICBpZiAoYS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGIoYVtrZXldLCBrZXksIGEpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVyblxuICB9XG4gIGlmIChpc0FycmF5KGEpKSB7XG4gICAgcmV0dXJuIGEuZm9yRWFjaChiKVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzVW5kZWZpbmVkKGEpIHtcbiAgcmV0dXJuIHR5cGVvZihhKSA9PT0gJ3VuZGVmaW5lZCdcbn1cblxuZnVuY3Rpb24gcGljayhhLCBiKSB7XG4gIHZhciBjID0ge31cbiAgZm9yRWFjaChiLCBmdW5jdGlvbihiYikge1xuICAgIGlmICh0eXBlb2YoYVtiYl0pICE9PSAndW5kZWZpbmVkJykgY1tiYl0gPSBhW2JiXVxuICB9KVxuICByZXR1cm4gY1xufVxuXG5mdW5jdGlvbiB4b3IoYSwgYikge1xuXG4gIHZhciB1bmlxdWUgPSBbXVxuICBmb3JFYWNoKGEsIGZ1bmN0aW9uKGFhKSB7XG4gICAgaWYgKGIuaW5kZXhPZihhYSkgPT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5pcXVlLnB1c2goYWEpXG4gICAgfVxuICB9KVxuICBmb3JFYWNoKGIsIGZ1bmN0aW9uKGJiKSB7XG4gICAgaWYgKGEuaW5kZXhPZihiYikgPT09IC0xKSB7XG4gICAgICByZXR1cm4gdW5pcXVlLnB1c2goYmIpXG4gICAgfVxuICB9KVxuICByZXR1cm4gdW5pcXVlXG59XG5cbmZ1bmN0aW9uIGNsb25lKGEpIHtcbiAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkoYSwgZnVuY3Rpb24gcmVwbGFjZXIoa2V5LCB2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSkpXG59XG5cbmZ1bmN0aW9uIGlzRXF1YWwoeCwgeSkge1xuICBpZiAoKHR5cGVvZiB4ID09IFwib2JqZWN0XCIgJiYgeCAhPT0gbnVsbCkgJiYgKHR5cGVvZiB5ID09IFwib2JqZWN0XCIgJiYgeSAhPT0gbnVsbCkpIHtcbiAgICBpZiAoT2JqZWN0LmtleXMoeCkubGVuZ3RoICE9IE9iamVjdC5rZXlzKHkpLmxlbmd0aClcbiAgICAgIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIHByb3AgaW4geCkge1xuICAgICAgaWYgKHkuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgaWYgKCFpc0VxdWFsKHhbcHJvcF0sIHlbcHJvcF0pKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoeCAhPT0geSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGVsc2VcbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUFycmF5KGEsIGIpIHtcbiAgdmFyIGFsID0gYS5sZW5ndGhcbiAgdmFyIGJsID0gYi5sZW5ndGhcbiAgaWYgKGFsID4gYmwpIHtcbiAgICBhLnNwbGljZShibCwgYWwgLSBibClcbiAgfSBlbHNlIGlmIChhbCA8IGJsKSB7XG4gICAgYS5wdXNoLmFwcGx5KGEsIG5ldyBBcnJheShibCAtIGFsKSlcbiAgfVxuICBmb3JFYWNoKGEsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgYVtrZXldID0gYltrZXldXG4gIH0pXG4gIHJldHVybiBhXG59XG5cbmZ1bmN0aW9uIHVuaXEoYSkge1xuICB2YXIgc2VlbiA9IG5ldyBTZXQoKTtcbiAgcmV0dXJuIGEuZmlsdGVyKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICB2YXIgYWxsb3cgPSBmYWxzZTtcbiAgICBpZiAoIXNlZW4uaGFzKGl0ZW0pKSB7XG4gICAgICBzZWVuLmFkZChpdGVtKTtcbiAgICAgIGFsbG93ID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGFsbG93O1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbihhYSkge1xuICB2YXIgZmxhdHRlbmVkID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYWEubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgY3VycmVudCA9IGFhW2ldO1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgY3VycmVudC5sZW5ndGg7ICsrailcbiAgICAgIGZsYXR0ZW5lZC5wdXNoKGN1cnJlbnRbal0pO1xuICB9XG4gIHJldHVybiBmbGF0dGVuZWRcbn1cblxuZnVuY3Rpb24gc29ydChhcnIpIHtcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG1wID0gYXJyW2ldLFxuICAgICAgaiA9IGk7XG4gICAgd2hpbGUgKGFycltqIC0gMV0gPiB0bXApIHtcbiAgICAgIGFycltqXSA9IGFycltqIC0gMV07XG4gICAgICAtLWo7XG4gICAgfVxuICAgIGFycltqXSA9IHRtcDtcbiAgfVxuXG4gIHJldHVybiBhcnI7XG59XG5cbmZ1bmN0aW9uIGtleXMoYWEpIHtcbiAgdmFyIGtleXMgPSBbXVxuICBmb3IgKHZhciBrZXkgaW4gYWEpIHtcbiAgICBpZiAoYWEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAga2V5cy5wdXNoKGFhW2tleV0pXG4gICAgfVxuICB9XG4gIHJldHVybiBrZXlzXG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJylcbnZhciBfID0gcmVxdWlyZSgnLi9sb2Rhc2gnKVxuXG5Qcm9taXNlLnNlcmlhbCA9IHNlcmlhbFxuXG52YXIgaXNQcm9taXNlTGlrZSA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gb2JqICYmIF8uaXNGdW5jdGlvbihvYmoudGhlbik7XG59XG5cbmZ1bmN0aW9uIHNlcmlhbCh0YXNrcykge1xuICAvL0Zha2UgYSBcInByZXZpb3VzIHRhc2tcIiBmb3Igb3VyIGluaXRpYWwgaXRlcmF0aW9uXG4gIHZhciBwcmV2UHJvbWlzZTtcbiAgdmFyIGVycm9yID0gbmV3IEVycm9yKCk7XG4gIF8uZm9yRWFjaCh0YXNrcywgZnVuY3Rpb24odGFzaywga2V5KSB7XG4gICAgdmFyIHN1Y2Nlc3MgPSB0YXNrLnN1Y2Nlc3MgfHwgdGFzaztcbiAgICB2YXIgZmFpbCA9IHRhc2suZmFpbDtcbiAgICB2YXIgbm90aWZ5ID0gdGFzay5ub3RpZnk7XG4gICAgdmFyIG5leHRQcm9taXNlO1xuXG4gICAgLy9GaXJzdCB0YXNrXG4gICAgaWYgKCFwcmV2UHJvbWlzZSkge1xuICAgICAgbmV4dFByb21pc2UgPSBzdWNjZXNzKCk7XG4gICAgICBpZiAoIWlzUHJvbWlzZUxpa2UobmV4dFByb21pc2UpKSB7XG4gICAgICAgIGVycm9yLm1lc3NhZ2UgPSBcIlRhc2sgXCIgKyBrZXkgKyBcIiBkaWQgbm90IHJldHVybiBhIHByb21pc2UuXCI7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvL1dhaXQgdW50aWwgdGhlIHByZXZpb3VzIHByb21pc2UgaGFzIHJlc29sdmVkIG9yIHJlamVjdGVkIHRvIGV4ZWN1dGUgdGhlIG5leHQgdGFza1xuICAgICAgbmV4dFByb21pc2UgPSBwcmV2UHJvbWlzZS50aGVuKFxuICAgICAgICAvKnN1Y2Nlc3MqL1xuICAgICAgICBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKCFzdWNjZXNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJldCA9IHN1Y2Nlc3MoZGF0YSk7XG4gICAgICAgICAgaWYgKCFpc1Byb21pc2VMaWtlKHJldCkpIHtcbiAgICAgICAgICAgIGVycm9yLm1lc3NhZ2UgPSBcIlRhc2sgXCIgKyBrZXkgKyBcIiBkaWQgbm90IHJldHVybiBhIHByb21pc2UuXCI7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfSxcbiAgICAgICAgLypmYWlsdXJlKi9cbiAgICAgICAgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgICAgaWYgKCFmYWlsKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QocmVhc29uKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHJldCA9IGZhaWwocmVhc29uKTtcbiAgICAgICAgICBpZiAoIWlzUHJvbWlzZUxpa2UocmV0KSkge1xuICAgICAgICAgICAgZXJyb3IubWVzc2FnZSA9IFwiRmFpbCBmb3IgdGFzayBcIiArIGtleSArIFwiIGRpZCBub3QgcmV0dXJuIGEgcHJvbWlzZS5cIjtcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9LFxuICAgICAgICBub3RpZnkpO1xuICAgIH1cbiAgICBwcmV2UHJvbWlzZSA9IG5leHRQcm9taXNlO1xuICB9KTtcblxuICByZXR1cm4gcHJldlByb21pc2UgfHwgUHJvbWlzZS53aGVuKCk7XG59XG4iLCIndXNlIHN0cmljdCdcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCdxJyk7XG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihzZXJ2aWNlKSB7XG4gIHZhciByZWR1Y3Rpb2Z5ID0gcmVxdWlyZSgnLi9yZWR1Y3Rpb2Z5Jykoc2VydmljZSlcbiAgdmFyIGZpbHRlcnMgPSByZXF1aXJlKCcuL2ZpbHRlcnMnKShzZXJ2aWNlKVxuXG4gIHJldHVybiBmdW5jdGlvbiBmaW5kKHF1ZXJ5KSB7XG5cbiAgICAvLyBEZWZhdWx0IHF1ZXJ5XG4gICAgaWYgKHR5cGVvZihxdWVyeSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBxdWVyeSA9IHt9XG4gICAgfVxuXG4gICAgLy8gRGVmYXVsdCBzZWxlY3RcbiAgICBpZiAodHlwZW9mKHF1ZXJ5LnNlbGVjdCkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBxdWVyeS5zZWxlY3QgPSB7XG4gICAgICAgICRjb3VudDogdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFN1cHBvcnQgZ3JvdXBBbGxcbiAgICBxdWVyeS5ncm91cEJ5ID0gcXVlcnkuZ3JvdXBCeSB8fCB0cnVlXG5cbiAgICAvLyBGaW5kIEV4aXN0aW5nIENvbHVtblxuICAgIHZhciBjb2x1bW4gPSBzZXJ2aWNlLmNvbHVtbi5maW5kKHF1ZXJ5Lmdyb3VwQnkpXG5cbiAgICB2YXIgZ3JvdXBcblxuICAgIHJldHVybiBQcm9taXNlLnRyeShmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gQ3JlYXRlIENvbHVtbiBpZiBub3QgZm91bmRcbiAgICAgICAgaWYgKCFjb2x1bW4pIHtcbiAgICAgICAgICByZXR1cm4gc2VydmljZS5jb2x1bW4oe1xuICAgICAgICAgICAgICBrZXk6IHF1ZXJ5Lmdyb3VwQnksXG4gICAgICAgICAgICAgIHR5cGU6ICFfLmlzVW5kZWZpbmVkKHF1ZXJ5LnR5cGUpID8gcXVlcnkudHlwZSA6IG51bGwsXG4gICAgICAgICAgICAgIGFycmF5OiAhIXF1ZXJ5LmFycmF5XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24odSkge1xuICAgICAgICAgICAgICByZXR1cm4gXy5maW5kKHUuY29sdW1ucywgZnVuY3Rpb24oYykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjLmtleSA9PT0gcXVlcnkuZ3JvdXBCeVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiB0aGUgY29sdW1uIGV4aXN0cywgbGV0J3MgYXQgbGVhc3QgbWFrZSBzdXJlIGl0J3MgbWFya2VkXG4gICAgICAgIC8vIGFzIHBlcm1hbmVudC4gVGhlcmUgaXMgYSBzbGlnaHQgY2hhbmNlIGl0IGV4aXN0cyBiZWNhdXNlXG4gICAgICAgIC8vIG9mIGEgZmlsdGVyLCBhbmQgdGhlIHVzZXIgaGFzIG5vdyBkZWNpZGVkIHRvIHF1ZXJ5IG9uIGl0XG4gICAgICAgIHJldHVybiBjb2x1bW5cbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihjKSB7XG4gICAgICAgIGNvbHVtbiA9IGNcbiAgICAgICAgICAvLyBDcmVhdGUgdGhlIGdyb3VwaW5nIG9uIHRoZSBjb2x1bW5zIGRpbWVuc2lvblxuICAgICAgICAgIC8vIFVzaW5nIFByb21pc2UgUmVzb2x2ZSBhbGxvd3Mgc3VwcG9ydCBmb3IgY3Jvc3NmaWx0ZXIgYXN5bmNcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjb2x1bW4uZGltZW5zaW9uLmdyb3VwKCkpXG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24oZykge1xuICAgICAgICAvLyBTYXZlIHRoZSBncm91cCB3aGlsZSB3ZSBjcmVhdGUgdGhlIHJlZHVjZXJcbiAgICAgICAgZ3JvdXAgPSBnXG4gICAgICAgIHJldHVybiBmaWx0ZXJzLnNjYW5Gb3JEeW5hbWljRmlsdGVycyhxdWVyeSlcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihyZXF1aXJlZENvbHVtbnMpIHtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzY2FuIHRoZSBncm91cCBmb3IgYW55IGZpbHRlcnMgdGhhdCB3b3VsZCByZXF1aXJlXG4gICAgICAgIC8vIHRoZSBncm91cCB0byBiZSByZWJ1aWx0IHdoZW4gZGF0YSBpcyBhZGRlZCBvciByZW1vdmVkIGluIGFueSB3YXkuXG4gICAgICAgIGlmIChyZXF1aXJlZENvbHVtbnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKF8ubWFwKHJlcXVpcmVkQ29sdW1ucywgZnVuY3Rpb24oY29sdW1uS2V5KSB7XG4gICAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlLmNvbHVtbih7XG4gICAgICAgICAgICAgICAga2V5OiBjb2x1bW5LZXksXG4gICAgICAgICAgICAgICAgZHluYW1pY1JlZmVyZW5jZTogZ3JvdXBcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKG5lZWRzTGlzdGVuZXIpIHtcbiAgICAgICAgLy8gSGVyZSwgd2UgY3JlYXRlIGEgbGlzdGVuZXIgdG8gcmVjcmVhdGUgYW5kIGFwcGx5IHRoZSByZWR1Y2VyXG4gICAgICAgIC8vICh3aXRoIHVwZGF0ZWQgcmVmZXJlbmNlIGRhdGEpIHRvXG4gICAgICAgIC8vIHRoZSBncm91cCBhbnl0aW1lIGRhdGEgY2hhbmdlcy5cblxuICAgICAgICB2YXIgcXVlcnlSZXMgPSB7XG4gICAgICAgICAgLy8gVGhlIFVuaXZlcnNlIGZvciBjb250aW51b3VzIHByb21pc2UgY2hhaW5pbmdcbiAgICAgICAgICB1bml2ZXJzZTogc2VydmljZSxcbiAgICAgICAgICAvLyBUaGUgYmFyZSBtZXRhbHF1ZXJ5UmVzLmRhdGFcbiAgICAgICAgICBjcm9zc2ZpbHRlcjogc2VydmljZS5jZixcbiAgICAgICAgICBkaW1lbnNpb246IGNvbHVtbi5kaW1lbnNpb24sXG4gICAgICAgICAgZ3JvdXA6IGdyb3VwLFxuICAgICAgICAgIC8vIFJlZHVjdGlvIHJlZHVjZXIgaW5zdGFuY2VcbiAgICAgICAgICByZWR1Y2VyOiBudWxsLFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN0b3BMaXN0ZW5pbmdGb3JEYXRhXG4gICAgICAgIGlmIChuZWVkc0xpc3RlbmVyKSB7XG4gICAgICAgICAgc3RvcExpc3RlbmluZ0ZvckRhdGEgPSBzZXJ2aWNlLm9uRGF0YUNoYW5nZShmdW5jdGlvbiBhcHBseVJlZHVjZXJPbkRhdGFDaGFuZ2UoaXNQb3N0KSB7XG4gICAgICAgICAgICByZXR1cm4gYXBwbHlSZWR1Y2VyKHF1ZXJ5UmVzLCBpc1Bvc3QpXG4gICAgICAgICAgfSlcbiAgICAgICAgICBjb2x1bW4ucmVtb3ZlTGlzdGVuZXJzLnB1c2goc3RvcExpc3RlbmluZ0ZvckRhdGEpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXBwbHlSZWR1Y2VyKHF1ZXJ5UmVzKVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHF1ZXJ5UmVzXG4gICAgICAgICAgfSlcblxuICAgICAgICBmdW5jdGlvbiBhcHBseVJlZHVjZXIocXVlcnlSZXMsIGlzUG9zdCkge1xuICAgICAgICAgIC8vIENyZWF0ZSB0aGUgcmVkdWNlciB1c2luZyByZWR1Y3RpbyBhbmQgdGhlIFVuaXZlcnNlIFF1ZXJ5IFN5bnRheFxuICAgICAgICAgIHJldHVybiByZWR1Y3Rpb2Z5KHF1ZXJ5KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVkdWNlcikge1xuICAgICAgICAgICAgICBxdWVyeVJlcy5yZWR1Y2VyID0gcmVkdWNlclxuICAgICAgICAgICAgICAvLyBBcHBseSB0aGUgcmVkdWNlciB0byB0aGUgZ3JvdXBcbiAgICAgICAgICAgICAgcXVlcnlSZXMucmVkdWNlcihxdWVyeVJlcy5ncm91cClcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShxdWVyeVJlcy5ncm91cC5hbGwoKSlcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihhbGwpe1xuICAgICAgICAgICAgICBxdWVyeVJlcy5kYXRhID0gYWxsXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgIH0pXG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG52YXIgXyA9IHJlcXVpcmUoJy4vbG9kYXNoJylcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIHNob3J0aGFuZExhYmVsczoge1xuICAgICRjb3VudDogJ2NvdW50JyxcbiAgICAkc3VtOiAnc3VtJyxcbiAgICAkYXZnOiAnYXZnJyxcbiAgICAkbWluOiAnbWluJyxcbiAgICAkbWF4OiAnbWF4JyxcbiAgICAkbWVkOiAnbWVkJyxcbiAgICAkc3VtU3E6ICdzdW1TcScsXG4gICAgJHN0ZDogJ3N0ZCcsXG4gIH0sXG4gIGFnZ3JlZ2F0b3JzOiB7XG4gICAgJGNvdW50OiAkY291bnQsXG4gICAgJHN1bTogJHN1bSxcbiAgICAkYXZnOiAkYXZnLFxuICAgICRtaW46ICRtaW4sXG4gICAgJG1heDogJG1heCxcbiAgICAkbWVkOiAkbWVkLFxuICAgICRzdW1TcTogJHN1bVNxLFxuICAgICRzdGQ6ICRzdGQsXG4gIH1cbn1cblxuLy8gQWdncmVnYXRvcnNcblxuZnVuY3Rpb24gJGNvdW50KHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLmNvdW50KHRydWUpXG59XG5cbmZ1bmN0aW9uICRzdW0ocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuc3VtKHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkYXZnKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLmF2Zyh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJG1pbihyZWR1Y2VyLCB2YWx1ZSkge1xuICByZXR1cm4gcmVkdWNlci5taW4odmFsdWUpXG59XG5cbmZ1bmN0aW9uICRtYXgocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIubWF4KHZhbHVlKVxufVxuXG5mdW5jdGlvbiAkbWVkKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLm1lZGlhbih2YWx1ZSlcbn1cblxuZnVuY3Rpb24gJHN1bVNxKHJlZHVjZXIsIHZhbHVlKSB7XG4gIHJldHVybiByZWR1Y2VyLnN1bU9mU3EodmFsdWUpXG59XG5cbmZ1bmN0aW9uICRzdGQocmVkdWNlciwgdmFsdWUpIHtcbiAgcmV0dXJuIHJlZHVjZXIuc3RkKHZhbHVlKVxufVxuXG4vLyBUT0RPIGhpc3RvZ3JhbXNcbi8vIFRPRE8gZXhjZXB0aW9uc1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciByZWR1Y3RpbyA9IHJlcXVpcmUoJ3JlZHVjdGlvJylcblxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG52YXIgckFnZ3JlZ2F0b3JzID0gcmVxdWlyZSgnLi9yZWR1Y3Rpb0FnZ3JlZ2F0b3JzJylcbnZhciBleHByZXNzaW9ucyA9IHJlcXVpcmUoJy4vZXhwcmVzc2lvbnMnKVxudmFyIGFnZ3JlZ2F0aW9uID0gcmVxdWlyZSgnLi9hZ2dyZWdhdGlvbicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2VydmljZSkge1xuICB2YXIgZmlsdGVycyA9IHJlcXVpcmUoJy4vZmlsdGVycycpKHNlcnZpY2UpXG5cbiAgcmV0dXJuIGZ1bmN0aW9uIHJlZHVjdGlvZnkocXVlcnkpIHtcbiAgICB2YXIgcmVkdWNlciA9IHJlZHVjdGlvKClcbiAgICB2YXIgZ3JvdXBCeSA9IHF1ZXJ5Lmdyb3VwQnlcbiAgICBhZ2dyZWdhdGVPck5lc3QocmVkdWNlciwgcXVlcnkuc2VsZWN0KVxuXG4gICAgaWYgKHF1ZXJ5LmZpbHRlcikge1xuICAgICAgdmFyIGZpbHRlckZ1bmN0aW9uID0gZmlsdGVycy5tYWtlRnVuY3Rpb24ocXVlcnkuZmlsdGVyKVxuICAgICAgaWYgKGZpbHRlckZ1bmN0aW9uKSB7XG4gICAgICAgIHJlZHVjZXIuZmlsdGVyKGZpbHRlckZ1bmN0aW9uKVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVkdWNlcilcblxuXG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZWN1cnNpdmVseSBmaW5kIHRoZSBmaXJzdCBsZXZlbCBvZiByZWR1Y3RpbyBtZXRob2RzIGluXG4gICAgLy8gZWFjaCBvYmplY3QgYW5kIGFkZHMgdGhhdCByZWR1Y3Rpb24gbWV0aG9kIHRvIHJlZHVjdGlvXG4gICAgZnVuY3Rpb24gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIsIHNlbGVjdHMpIHtcblxuICAgICAgLy8gU29ydCBzbyBuZXN0ZWQgdmFsdWVzIGFyZSBjYWxjdWxhdGVkIGxhc3QgYnkgcmVkdWN0aW8ncyAudmFsdWUgbWV0aG9kXG4gICAgICB2YXIgc29ydGVkU2VsZWN0S2V5VmFsdWUgPSBfLnNvcnRCeShcbiAgICAgICAgXy5tYXAoc2VsZWN0cywgZnVuY3Rpb24odmFsLCBrZXkpIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2V5OiBrZXksXG4gICAgICAgICAgICB2YWx1ZTogdmFsXG4gICAgICAgICAgfVxuICAgICAgICB9KSxcbiAgICAgICAgZnVuY3Rpb24ocykge1xuICAgICAgICAgIGlmIChyQWdncmVnYXRvcnMuYWdncmVnYXRvcnNbcy5rZXldKSB7XG4gICAgICAgICAgICByZXR1cm4gMFxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gMVxuICAgICAgICB9KVxuXG5cbiAgICAgIC8vIGRpdmUgaW50byBlYWNoIGtleS92YWx1ZVxuICAgICAgcmV0dXJuIF8uZm9yRWFjaChzb3J0ZWRTZWxlY3RLZXlWYWx1ZSwgZnVuY3Rpb24ocykge1xuXG4gICAgICAgIC8vIEZvdW5kIGEgUmVkdWN0aW8gQWdncmVnYXRpb25cbiAgICAgICAgaWYgKHJBZ2dyZWdhdG9ycy5hZ2dyZWdhdG9yc1tzLmtleV0pIHtcbiAgICAgICAgICAvLyBCdWlsZCB0aGUgdmFsdWVBY2Nlc3NvckZ1bmN0aW9uXG4gICAgICAgICAgdmFyIGFjY2Vzc29yID0gbWFrZVZhbHVlQWNjZXNzb3Iocy52YWx1ZSlcbiAgICAgICAgICAgIC8vIEFkZCB0aGUgcmVkdWNlciB3aXRoIHRoZSBWYWx1ZUFjY2Vzc29yRnVuY3Rpb24gdG8gdGhlIHJlZHVjZXJcbiAgICAgICAgICByZWR1Y2VyID0gckFnZ3JlZ2F0b3JzLmFnZ3JlZ2F0b3JzW3Mua2V5XShyZWR1Y2VyLCBhY2Nlc3NvcilcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZvdW5kIGEgdG9wIGxldmVsIGtleSB2YWx1ZSB0aGF0IGlzIG5vdCBhbiBhZ2dyZWdhdGlvbiBvciBhXG4gICAgICAgIC8vIG5lc3RlZCBvYmplY3QuIFRoaXMgaXMgdW5hY2NlcHRhYmxlLlxuICAgICAgICBpZiAoIV8uaXNPYmplY3Qocy52YWx1ZSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdOZXN0ZWQgc2VsZWN0cyBtdXN0IGJlIGFuIG9iamVjdCcsIHMua2V5KVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXQncyBhbm90aGVyIG5lc3RlZCBvYmplY3QsIHNvIGp1c3QgcmVwZWF0IHRoaXMgcHJvY2VzcyBvbiBpdFxuICAgICAgICByZWR1Y2VyID0gYWdncmVnYXRlT3JOZXN0KHJlZHVjZXIudmFsdWUocy5rZXkpLCBzLnZhbHVlKVxuXG4gICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VWYWx1ZUFjY2Vzc29yKG9iaikge1xuICAgICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhIHN0cmluZyBvciBhIG51bWJlciBoZXJlLCBpdCBpcyByZWZlcmVuY2luZ1xuICAgICAgLy8gYSBjb2x1bW4gcHJvcGVydHkgZm9yIGEgcmVkdWN0aW8gYWdncmVnYXRpb24sIHNvIGp1c3QgcmV0dXJuIGl0IGFzIGEgc3RyaW5nXG4gICAgICBpZiAodHlwZW9mKG9iaikgPT09ICdzdHJpbmcnIHx8IHR5cGVvZihvYmopID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gb2JqICsgJydcbiAgICAgIH1cbiAgICAgIC8vIElmIGl0J3MgYW4gb2JqZWN0LCB3ZSBuZWVkIHRvIGJ1aWxkIGEgY3VzdG9tIGFnZ3JlZ2F0aW9uIGZ1bmN0aW9uXG4gICAgICBpZiAoXy5pc09iamVjdChvYmopKSB7XG4gICAgICAgIHJldHVybiBhZ2dyZWdhdGlvbi5tYWtlRnVuY3Rpb24ob2JqKVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbnJlcXVpcmUoJy4vcS5zZXJpYWwnKVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ3EnKVxudmFyIF8gPSByZXF1aXJlKCcuL2xvZGFzaCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdW5pdmVyc2VcblxuZnVuY3Rpb24gdW5pdmVyc2UoZGF0YSwgb3B0aW9ucykge1xuXG4gIHZhciBzZXJ2aWNlID0ge1xuICAgIG9wdGlvbnM6IF8uYXNzaWduKHt9LCBvcHRpb25zKSxcbiAgICBjb2x1bW5zOiBbXSxcbiAgICBmaWx0ZXJzOiB7fSxcbiAgICBkYXRhTGlzdGVuZXJzOiBbXSxcbiAgfVxuXG4gIHZhciBjZiA9IHJlcXVpcmUoJy4vY3Jvc3NmaWx0ZXInKShzZXJ2aWNlKVxuXG4gIGRhdGEgPSBjZi5nZW5lcmF0ZUNvbHVtbnMoZGF0YSlcblxuICByZXR1cm4gY2YuYnVpbGQoZGF0YSlcbiAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZXJ2aWNlLmNmID0gZGF0YVxuICAgICAgcmV0dXJuIF8uYXNzaWduKHNlcnZpY2UsIHtcbiAgICAgICAgYWRkOiBjZi5hZGQsXG4gICAgICAgIHJlbW92ZTogY2YucmVtb3ZlLFxuICAgICAgICBjb2x1bW46IHJlcXVpcmUoJy4vY29sdW1uJykoc2VydmljZSksXG4gICAgICAgIHF1ZXJ5OiByZXF1aXJlKCcuL3F1ZXJ5Jykoc2VydmljZSksXG4gICAgICAgIGZpbHRlcjogcmVxdWlyZSgnLi9maWx0ZXJzJykoc2VydmljZSkuZmlsdGVyLFxuICAgICAgICBjbGVhcjogcmVxdWlyZSgnLi9jbGVhcicpKHNlcnZpY2UpLFxuICAgICAgICBvbkRhdGFDaGFuZ2U6IG9uRGF0YUNoYW5nZVxuICAgICAgfSlcbiAgICB9KVxuXG4gIGZ1bmN0aW9uIG9uRGF0YUNoYW5nZShjYil7XG4gICAgc2VydmljZS5kYXRhTGlzdGVuZXJzLnB1c2goY2IpXG4gICAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgICBzZXJ2aWNlLmRhdGFMaXN0ZW5lcnMuc3BsaWNlKHNlcnZpY2UuZGF0YUxpc3RlbmVycy5pbmRleE9mKGNiKSwgMSlcbiAgICB9XG4gIH1cbn1cbiJdfQ==
