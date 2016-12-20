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
     Node: require('./modules/node')
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

},{"./modules/display":2,"./modules/node":3}],2:[function(require,module,exports){
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

  var units = 256

  var display  = {
    aspect: aspect,
    center: [units / 2, units * (1 / aspect) / 2],
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

},{}]},{},[1]);
