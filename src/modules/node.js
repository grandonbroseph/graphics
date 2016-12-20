types = ['Layer', 'Box', 'Text', 'Image']
function create(type, options, pos) {
  options = options || {}

  type = type || options.type
    if (!type || types.indexOf(type) === -1) throw 'GraphicsError: Cannot create `Node` of type `' + type + '`'

  var canvas = document.createElement('canvas')

  var id = options.id
  if (id) canvas.id = id

  var scale = 4 // Higher = better quality

  canvas.className = type.toLowerCase()
  canvas.width     = (options.width  || 64) * scale
  canvas.height    = (options.height || 64) * scale

  var context = canvas.getContext('2d')

  var node = {
       type: type,
    context: context
  }

  if (Array.isArray(options)) {
    node.children = options
  } else {
    Object.assign(node, options)
  }

  var rects    = node.rects    = []
  var children = node.children = node.children || []
  var i = children.length
  while (i--) {
    rects[i] = null
  }

  if (Array.isArray(pos)) {
    node.pos = { x: pos[0], y: pos[1] }
  } else if (typeof pos === 'undefined') {
    node.pos = { x: 0, y: 0 }
  } else {
    node.pos = pos
  }

  Node.render(node)

  return node
}

function add(node, child) {
  var children = node.children
  var length   = children.length
    children[length] = child
  node.rects[length] = child
}

function remove(node, child) {
  var children = node.children
  var index    = children.indexOf(child)
  if (index !== -1) {
      children.splice(index, 1)
    node.rects.splice(index, 1)
  }
}

function clear(node, rect) {
  var context = node.context
  var x, y, width, height
  if (!rect) {
    var canvas = context.canvas
    rect = [0, 0, canvas.width, canvas.height]
  }
  x      = rect[0]
  y      = rect[1]
  width  = rect[2]
  height = rect[3]
  context.clearRect(x, y, width, height)
}

function render(node) {
  var children = node.children
  var rects    = node.rects
  var context  = node.context
  var canvas   = context.canvas
  var unit     = canvas.width / 256
  var i = children.length
  while (i--) {
    var child   = children[i]
    var oldRect = rects[i]
    var newRect = getRect(child, unit)
    if (oldRect && !isRectEqual(oldRect, newRect)) {
      clear(node, oldRect)
    }
    var x      = newRect[0]
    var y      = newRect[1]
    var width  = newRect[2]
    var height = newRect[3]
    context.drawImage(child.context.canvas, x, y, width, height)
    rects[i] = newRect
  }
  var fill = node.fill || 'transparent'
  if (fill) {
    context.fillStyle = fill
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  var stroke      = node.stroke      || 'transparent'
  var strokeWidth = node.strokeWidth || 1
  if (stroke) {
    context.strokeStyle = stroke
    context.lineWidth   = strokeWidth = strokeWidth * unit * 4
    context.strokeRect(strokeWidth / 2, strokeWidth / 2, canvas.width - strokeWidth, canvas.height - strokeWidth)
  }
}

function getRect(node, scale) {
  scale = scale || 1

  var width  = node.width
  var height = node.height

  var x = node.pos.x - width  / 2
  var y = node.pos.y - height / 2

  var rect = [x * scale, y * scale, width * scale, height * scale]

  return rect
}

function isRectEqual(a, b) {
  var i = a.length
  while (i--) {
    if (a[i] !== b[i]) return false
  }
  return true
}

module.exports = {
   types: types,

  create: create,

     add: add,
  remove: remove,

   clear: clear,
  render: render
}
