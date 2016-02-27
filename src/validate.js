module.exports = {
  cf: cf
}

function cf(c){
  if(!c || typeof(c.dimension) !== 'function'){
    throw new Error('No Crossfilter instance found!')
  }
}
