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
