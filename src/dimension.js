import _ from './lodash'


// TODO(cg): add dimension dispose to get rid of unused dimension 
// and free up space

export default function(service) {
  return {
    make: make,
    makeAccessor: makeAccessor,
    dispose: dispose,
  }

  function make(key, type, complex, missingValue = '__missing__') {
    var accessor = makeAccessor(key, complex, missingValue)
    // Promise.resolve will handle promises or non promises, so
    // this crossfilter async is supported if present
    return Promise.resolve(service.cf.dimension(accessor, type === 'array'))
  }

  function makeAccessor(key, complex, missingValue) {
    var accessorFunction

    if (complex === 'string') {
      accessorFunction = function(d) {
        const value = _.get(d, key)
        return value === undefined ? missingValue : value
      }
    } else if (complex === 'function') {
      accessorFunction = key
    } else if (complex === 'array') {
      var arrayString = _.map(key, function(k) {
        return 'd[\'' + k + '\']'
      })
      accessorFunction = new Function('d', String('return ' + JSON.stringify(arrayString).replace(/"/g, ''))) // eslint-disable-line  no-new-func
    } else {
      accessorFunction =
        // Index Dimension
        key === true ? (d, i) => i :
        // Value Accessor Dimension
        (d) => {
          const value = d[key]
          return value === undefined ? missingValue : value
        }
    }
    return accessorFunction
  }

  function dispose(key) {
    console.warn('universe dispose not yet implemented');
  }
}