function create(options) {
  var canvas  = document.createElement('canvas')
  canvas.className = 'layer'

  var id = options.id
  if (id) canvas.id = id

  var context = canvas.getContext('2d')

  var layer = {
    context: context
  }

  return layer
}

function add() {

}

function remove() {

}

module.exports = {
  create: create,
     add: add,
  remove: remove
}
