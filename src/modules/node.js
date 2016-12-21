var Transform = require('./transform')
var Vector    = require('./vector')

var types   = ['Layer', 'Box', 'Text', 'Image']
var quality = 4 // Higher = less blur

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
               size: font.size        || 12,
             family: font.family      || 'sans-serif',
               fill: font.fill        || 'black',
             stroke: font.stroke      || 'transparent',
        strokeWidth: font.strokeWidth || 0
      }
    } else {
      font = node.font = {
               size: 12,
             family: 'sans-serif',
               fill: 'black',
             stroke: 'transparent',
        strokeWidth: 0
      }
    }
    context.font = font.size + 'px ' + font.family
    width  = node.width  = context.measureText(node.text).width
    height = node.height = font.size
  }

  canvas.className = type.toLowerCase()
  canvas.width     = (width  || 64) * quality
  canvas.height    = (height || 64) * quality

  if (Array.isArray(pos)) {
    node.pos = { x: pos[0], y: pos[1] }
  } else if (typeof pos === 'undefined') {
    node.pos = { x: 0, y: 0 }
  } else {
    node.pos = pos
  }

  if (type !== 'Layer' && !node.transform) {
    node.transform = Transform.create()
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

function arrayToGradient(array, context) {
  var canvas = context.canvas
  var gradient = context.createLinearGradient(0, 0, 0, canvas.height)
  var i = array.length
  while (i--) {
    gradient.addColorStop(i, array[i])
  }
  return gradient
}

function draw(node) {
  var context  = node.context
  var canvas   = context.canvas
  var unit     = canvas.width / 512

  var fill
  if (node.type === 'Text') fill = node.font.fill
  else fill = node.fill
  if (!fill) fill = 'transparent'
  else if (Array.isArray(fill)) fill = arrayToGradient(fill, context)
  context.fillStyle = fill

  var stroke
  if (node.type === 'Text') stroke = node.font.stroke
  else stroke = node.stroke
  if (!stroke) stroke = 'transparent'
  else if (Array.isArray(stroke)) stroke = arrayToGradient(stroke, context)
  context.strokeStyle = stroke

  if (node.type === 'Text') {
    context.textAlign    = node.align    || 'left'
    context.textBaseline = node.baseline || 'top'
    context.font = canvas.height + 'px ' + node.font.family
    var text = node.text
    var fill = node.font.fill
    if (fill) {
      context.fillText(text, 0, 0)
    }
    var stroke      = node.font.stroke
    var strokeWidth = node.font.strokeWidth
    if (stroke && strokeWidth) {
      context.lineWidth = strokeWidth * unit * quality
      context.strokeText(text, 0, 0)
    }
  } else {
    if (fill) {
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    var stroke      = node.stroke      || 'transparent'
    var strokeWidth = node.strokeWidth || 1
    if (stroke) {
      context.lineWidth   = strokeWidth = strokeWidth * unit * 4
      context.strokeRect(strokeWidth / 2, strokeWidth / 2, canvas.width - strokeWidth, canvas.height - strokeWidth)
    }
  }
}

function render(node, force) {
  var context  = node.context
  var canvas   = context.canvas
  var unit     = canvas.width / (node.width || 512)
  var drawn    = false

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

    var childContext = child.transformedContext || child.context
    var childCanvas  = childContext.canvas

    context.drawImage(childCanvas, x, y, width, height)
    rects[i] = newRect
  }
  if (!drawn && !children.length) draw(node)

  var transform = node.transform
  if (transform) {
    if (!Transform.isDefault(transform)) {

      var transformedCanvas, transformedContext = node.transformedContext

      if (!transformedContext) {
        transformedCanvas  = document.createElement('canvas')
        transformedContext = node.transformedContext = transformedCanvas.getContext('2d')
      }
      if (!transformedCanvas) {
        transformedCanvas = transformedContext.canvas
      }

      var rotation = transform.rotation
      var scaling  = transform.scaling

      transformedCanvas.width  = canvas.width
      transformedCanvas.height = canvas.height

      if (rotation) {
        var corners = getCorners(canvas.width, canvas.height, rotation)
        var bounds  = getBounds(corners)

        var topLeft     = bounds[0]
        var bottomRight = bounds[1]

        var transformedWidth  = (bottomRight[0] - topLeft[0])
        var transformedHeight = (bottomRight[1] - topLeft[1])

        transformedCanvas.width  = transformedWidth
        transformedCanvas.height = transformedHeight

        transformedContext.translate(-topLeft[0], -topLeft[1])
        transformedContext.rotate(rotation * Math.PI / 180)
      }

      transformedContext.drawImage(canvas, 0, 0, canvas.width, canvas.height)
    }
  }
}

function getCorners(width, height, angle) {
  var angle = (angle || 0)

  var topLeft  = [0, 0]
  var topRight = Vector.scaled(Vector.fromDegrees(angle), width)

  var bottomLeft  = Vector.scaled(Vector.fromDegrees(angle + 90), height)
  var bottomRight = Vector.add(Vector.clone(topRight), bottomLeft)

  var corners = [topLeft, topRight, bottomLeft, bottomRight]
  return corners
}

function getBounds(corners) {
  var x, y

  var listX = corners.slice().sort(function(a, b) { return a[0] - b[0] })
  var listY = corners.slice().sort(function(a, b) { return a[1] - b[1] })

  x = listX[0][0]
  y = listY[0][1]

  var topLeft = [x, y]

  x = listX[3][0]
  y = listY[3][1]

  var bottomRight = [x, y]

  return [topLeft, bottomRight]
}

var offsets = {
  'top-left':       [ 0,    0  ],
  'top':            [-0.5,  0  ],
  'top-right':      [-1,    0  ],
  'left':           [ 0,   -0.5],
  'center':         [-0.5, -0.5],
  'right':          [-1,   -0.5],
  'bottom-left':    [ 0,   -1  ],
  'bottom':         [-0.5, -1  ],
  'bottom-right':   [-1,   -1  ]
}

function getRect(node, scale) {
  scale = scale || 1

  var width  = node.width
  var height = node.height

  var offset = offsets[node.origin] || offsets.center

  var x, y
  var context = node.transformedContext
  if (!!context) {
    var transform = node.transform

    var translation = transform.translation
    var rotation    = transform.rotation
    var scaling     = transform.scaling

    if (rotation) {
      var canvas  = context.canvas
      var corners = getCorners(width, height, rotation)
      var bounds  = getBounds(corners)

      var topLeft     = bounds[0]
      var bottomRight = bounds[1]

      width  = (bottomRight[0] - topLeft[0])
      height = (bottomRight[1] - topLeft[1])
    }
    width  *= scaling.x
    height *= scaling.y
    x = node.pos.x + width  * offset[0] + translation.x
    y = node.pos.y + height * offset[1] + translation.y
  } else {
    x = node.pos.x + width  * offset[0]
    y = node.pos.y + height * offset[1]
  }

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

function translate(node, x, y) {
  var translation = node.transform.translation
  translation.x += x
  translation.y += y
}

function rotate(node, by) {
  var rotation = node.transform.rotation
  rotation += by
  while (rotation < 0)    rotation += 360
  while (rotation >= 360) rotation -= 360
  node.transform.rotation = rotation
  Node.render(node)
}

function scale(node, x, y) {
  if (!x) x = 1
  if (!y) y = x
  var scaling = node.transform.scaling
  scaling.x *= x
  scaling.y *= y
  Node.render(node)
}

module.exports = {
  types: types,

  create: create,

     add: add,
  remove: remove,

   clear: clear,
  render: render,

  translate: translate,
     rotate: rotate,
      scale: scale
}
