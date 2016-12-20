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
