var types = ['Layer', 'Box', 'Text', 'Image']
var scale = 4 // Higher = less blur

function create(type, options, pos) {
  options = options || {}

  type = type || options.type
    if (!type || types.indexOf(type) === -1) throw 'GraphicsError: Cannot create `Node` of type `' + type + '`'

  var canvas = document.createElement('canvas')
  var context = canvas.getContext('2d')

  var node = {
       type: type,
    context: context
  }

  if (Array.isArray(options)) {
    node.children = options
  } else if (typeof options === 'string'){
    node.text = options
  } else {
    Object.assign(node, options)
  }

  var id = options.id
  if (id) canvas.id = id

  var width  = options.width
  var height = options.height

  if (type === 'Text') {
    var font = node.font
    if (font) {
      font = node.font = {
               size: font.size        || 16,
             family: font.family      || 'sans-serif',
               fill: font.fill        || 'white',
             stroke: font.stroke      || 'transparent',
        strokeWidth: font.strokeWidth || 0
      }
    } else {
      font = node.font = {
               size: 12,
             family: 'sans-serif',
               fill: 'white',
             stroke: 'transparent',
        strokeWidth: 0
      }
    }
    context.font = (font.size) + 'px ' + font.family
    width  = node.width  = context.measureText(node.text).width
    height = node.height = font.size
  }

  canvas.className = type.toLowerCase()
  canvas.width     = (width  || 64) * scale
  canvas.height    = (height || 64) * scale

  if (Array.isArray(pos)) {
    node.pos = { x: pos[0], y: pos[1] }
  } else if (typeof pos === 'undefined') {
    node.pos = { x: 0, y: 0 }
  } else {
    node.pos = pos
  }

  node.rects   = []
  var children = node.children = node.children || []

  node.children = []
  add(node, children)

  node.center = {x: node.width / 2, y: node.height / 2}

  return node
}

function addOne(node, index, child) {
  node.children[index] = child
     node.rects[index] = null

  return index
}

function add(node, child) {
  var index = node.children.length
  if (Array.isArray(child)) {
    var children = child
    var i = children.length
    while (i--) {
      child = children[i]
      addOne(node, index + i, child)
    }
  } else {
    addOne(node, index, child)
  }
  render(node)
}

function remove(node, child) {
  var children = node.children
  var index    = children.indexOf(child)
  if (index !== -1) {
      children.splice(index, 1)
    node.rects.splice(index, 1)
  }
  render(node)
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

function draw(node) {
  var context  = node.context
  var canvas   = context.canvas
  var unit     = canvas.width / 512

  if (node.type === 'Text') {
    context.textAlign    = node.align    || 'left'
    context.textBaseline = node.baseline || 'top'
    context.font = canvas.height + 'px ' + node.font.family
    var text = node.text
    var fill = node.font.fill
    if (fill) {
      context.fillStyle = fill
      context.fillText(text, 0, 0)
    }
    var stroke      = node.font.stroke
    var strokeWidth = node.font.strokeWidth
    if (stroke && strokeWidth) {
      context.strokeStyle = stroke
      context.lineWidth   = strokeWidth * unit * scale
      context.strokeText(text, 0, 0)
    }
  } else {
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
}

function render(node, force) {
  var context  = node.context
  var canvas   = context.canvas
  var unit     = canvas.width / (node.width || 512)
  var drawn = false

  var children = node.children
  var rects    = node.rects
  var i = children.length
  while (i--) {
    var child   = children[i]
    var oldRect = rects[i]
    var newRect = getRect(child, unit)
    if (oldRect) {
      if (isRectEqual(oldRect, newRect) && !force) {
        continue
      } else {
        if (!drawn) draw(node), drawn = true
        clear(node, oldRect)
      }
    } else {
      if (!drawn) draw(node), drawn = true
    }
    var x      = newRect[0]
    var y      = newRect[1]
    var width  = newRect[2]
    var height = newRect[3]
    context.drawImage(child.context.canvas, x, y, width, height)
    rects[i] = newRect
  }
  if (!drawn) draw(node)
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
