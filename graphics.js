(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Graphics = {
  load: function (imagePath, done) {
    var image = new window.Image()
    image.src = imagePath
    image.onload = function () {
      done.call(window, image)
    }
  },
    Display: require('./modules/display'),
       Node: require('./modules/node'),
  Transform: require('./modules/transform')
}

var types = Graphics.Node.types
var i     = types.length
while (i--) {
  var type = types[i]
  Graphics[type] = function (type) {
    return {
      create: function (options, pos) {
        var node = Node.create(type, options, pos)
        return node
      }
    }
  }(type)
}

window.Graphics = window.Graphics || Graphics

},{"./modules/display":2,"./modules/node":3,"./modules/transform":4}],2:[function(require,module,exports){
var Node = require('./node')

var _displays = []
var _listening = false

function listen() {
  window.addEventListener('resize', onWindowResize)
  _listening = true
}

var _resized = false
function onWindowResize() {
  if (!_resized) {
    requestAnimationFrame(resize)
  }
  _resized = true
}

function resize() {
  var i = _displays.length
  while (i--) {
    var display = _displays[i]
    display.refit()
  }
  _resized = false
}

function create(aspect) {
  aspect = aspect || 4 / 3

  // Private variables
  var _layers = []

  var _element       = null
  var _elementWidth  = 0
  var _elementHeight = 0

  var _parent  = null

  var units = 512

  var width  = units
  var height = width * (1 / aspect)
  var center = [width / 2, height / 2]

  var display  = {
    aspect: aspect,
     width: width,
    height: height,
    center: center,
     mount: mount,
     refit: refit,
    render: render
  }
  function mount(parent) {
    if (typeof parent === 'string') {
      parent = document.querySelector(parent)
    }
    if (!parent) throw 'GraphicsError: Cannot mount display on parent `' + parent + '`'
    var element = document.createElement('div')
    element.className = 'display'
    parent.appendChild(element)

    _parent  = parent
    _element = element

    refit()
  }

  function refit() {
    if (!_element) throw 'GraphicsError: Cannot refit display before mount'

    var parentRect   = _parent.getBoundingClientRect()
    var parentWidth  = parentRect.width
    var parentHeight = parentRect.height

    var height = parentHeight
    var width  = height * aspect

    if (width > parentWidth) {
      width  = parentWidth
      height = width * (1 / aspect)
    }

    width  = Math.ceil(width)
    height = Math.ceil(height)

    if (width !== _elementWidth || height !== _elementHeight) {
      _element.style.width  = _elementWidth  = width
      _element.style.height = _elementHeight = height
      clear()
      render(_layers, true)
    }
  }

  function clear() {
    _layers.forEach(Node.clear)
  }

  function render(layers, force) {
    layers = layers || _layers
    if (!_element) throw 'GraphicsError: Cannot render display before mount'
    if (!layers)   throw 'GraphicsError: Cannot render display layers `' + layers + '`'
    var i = 0, max = layers.length
    while (i < max) {
      var layer  = layers[i]
      var _layer = _layers[i]
      var canvas = layer.context.canvas
      if (layer !== _layer) {
        if (canvas.parentNode !== _element) {
          if (_layer) {
            _element.insertBefore(_layer, canvas)
          } else {
            _element.appendChild(canvas)
          }
        }
      }
      if (canvas.width !== _elementWidth || canvas.height !== _elementHeight) {
        canvas.width  = _elementWidth
        canvas.height = _elementHeight
      }
      Node.render(layer)
      i++
    }
    _layers = layers
  }

  _displays.push(display)
  if (!_listening) {
    listen()
  }

  return display
}

module.exports = {
  create: create
}

},{"./node":3}],3:[function(require,module,exports){
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

},{"./transform":4,"./vector":5}],4:[function(require,module,exports){
function create(translation, rotation, scaling) {
  if (translation) {
    if (Array.isArray(translation)) {
      translation = { x: translation[0], y: translation[1] }
    }
  } else {
    translation = { x: 0, y: 0 }
  }
  if (!rotation) {
    rotation = 0
  }
  if (scaling) {
    if (Array.isArray(scaling)) {
      scaling = { x: scaling[0], y: scaling[1] }
    }
  } else {
    scaling = { x: 1, y: 1 }
  }
  var transform = {
    translation: translation,
       rotation: rotation,
        scaling: scaling
  }
  return transform
}

function isDefault(transform) {
  if (!transform) return null
  var translation = transform.translation
  var rotation    = transform.rotation
  var scaling     = transform.scaling
  return translation && !translation.x && !translation.y && !rotation && scaling && scaling.x === 1 && scaling.y === 1
}

module.exports = {
  create: create,

  isDefault: isDefault
}

},{}],5:[function(require,module,exports){
module.exports = {
  LEFT:       [-1, 0],
  RIGHT:      [ 1, 0],
  UP:         [ 0,-1],
  DOWN:       [ 0, 1],
  UP_LEFT:    [-1,-1],
  UP_RIGHT:   [ 1,-1],
  DOWN_LEFT:  [-1, 1],
  DOWN_RIGHT: [ 1, 1],
  NEUTRAL:    [ 0, 0],
  add: function(a, b) {
    a[0] += b[0]
    a[1] += b[1]
    return a
  },
  added: function(a, b) {
    return [a[0] + b[0], a[1] + b[1]]
  },
  subtract: function(a, b) {
    a[0] -= b[0]
    a[1] -= b[1]
    return a
  },
  subtracted: function(a, b) {
    return [a[0] - b[0], a[1] - b[1]]
  },
  multiply: function(a, b) {
    a[0] *= b[0]
    a[1] *= b[1]
    return a
  },
  multiplied: function(a, b) {
    return [a[0] * b[0], a[1] * b[1]]
  },
  divide: function(a, b) {
    a[0] /= b[0]
    a[1] /= b[1]
    return a
  },
  divided: function(a, b) {
    return [a[0] / b[0], a[1] / b[1]]
  },
  round: function(vector) {
    vector[0] = Math.round(vector[0])
    vector[1] = Math.round(vector[1])
  },
  rounded: function(vector) {
    return [Math.round(vector[0]), Math.round(vector[1])]
  },
  floor: function(vector) {
    vector[0] = Math.floor(vector[0])
    vector[1] = Math.floor(vector[1])
  },
  floored: function(vector) {
    return [Math.floor(vector[0]), Math.floor(vector[1])]
  },
  ceil: function(vector) {
    vector[0] = Math.ceil(vector[0])
    vector[1] = Math.ceil(vector[1])
  },
  ceiled: function(vector) {
    return [Math.ceil(vector[0]), Math.ceil(vector[1])]
  },
  invert: function(vector) {
    vector[0] *= -1
    vector[1] *= -1
    return vector
  },
  inverted: function(vector) {
    return [-vector[0], -vector[1]]
  },
  scale: function(vector, scalar) {
    vector[0] *= scalar
    vector[1] *= scalar
    return vector
  },
  scaled: function(vector, scalar) {
    return [vector[0] * scalar, vector[1] * scalar]
  },
  magnitude: function(vector) {
    return Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
  },
  normalize: function(vector) {
    var magnitude = this.magnitude(vector)
    if (!magnitude) return [0, 0]
    vector[0] /= magnitude
    vector[1] /= magnitude
    return vector
  },
  normalized: function(vector) {
    var magnitude = this.magnitude(vector)
    if (!magnitude) return [0, 0]
    return this.scaled(vector, 1 / magnitude)
  },
  clone: function(vector) {
    return [vector[0], vector[1]]
  },
  fromDegrees: function(degrees) {
    var radians = degrees * Math.PI / 180;
    return [Math.cos(radians), Math.sin(radians)]
  },
  toDegrees: function(vector) {
    var degrees = Math.atan2(vector[1], vector[0]) * 180 / Math.PI
    while (degrees < 0)
      degrees += 360
    return degrees
  },
  getNormal: function(direction) {
    var n, t = typeof direction
    if (t === 'number') {
      n = this.fromDegrees(direction)
    } else if (t === 'object') {
      n = this.normalized(direction)
    }
    return n
  }
}

},{}]},{},[1]);
