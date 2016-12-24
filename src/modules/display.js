module.exports = {
  create: create
}

var displays  = []
var listening = false
function listen() {
  window.addEventListener('resize', onResize)
  listening = true
}

var resized = false
function onResize() {
  if (!resized)
    window.requestAnimationFrame(refit)
  resized = true
}

var resizeTimeout
function refit() {
  var i = displays.length
  while (i--) {
    var display = displays[i]
    display.refit()
  }
  window.clearTimeout(resizeTimeout)
  resizeTimeout = window.setTimeout(redraw, 100)
  resized = false
}

function redraw() {
  var i = displays.length
  while (i--) {
    var display = displays[i]
    display.redraw()
  }
}

var offsets = {
  'top-left':     [ 0,    0  ],
  'top':          [-0.5,  0  ],
  'top-right':    [-1,    0  ],
  'left':         [ 0,   -0.5],
  'center':       [-0.5, -0.5],
  'right':        [-1,   -0.5],
  'bottom-left':  [ 0,   -1  ],
  'bottom':       [-0.5, -1  ],
  'bottom-right': [-1,   -1  ]
}

var styles = {
  margin: 'auto',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}

function create(options) {

  var _options = {
    size: [0, 0],
    mode: 'default',
    smoothing: false
  }


  var _element = null
  var _canvas  = document.createElement('canvas')
  var _context = _canvas.getContext('2d')

  var _updateCanvas  = document.createElement('canvas')
  var _updateContext = _updateCanvas.getContext('2d')

  var _width, _height, _center
  config(options || _options)
  _canvas.width  = _width
  _canvas.height = _height

  var _nodes = []

  var _display = {
    context: _context,
    width:   _width,
    height:  _height,
    center:  _center,

    config: config,
    mount: mount,
    redraw: redraw,
    refit: refit,
    fill: fill,
    drawImage: drawImage
  }

  displays.push(_display)

  function config(options) {
    if (!options)
      throw 'GraphicsError: Cannot configure display with options `' + options + '`'
    if (Array.isArray(options))
      _size = _options.size = options
    else {
      Object.assign(_options, options)
      var _mode  = _options.mode
      var _style = _canvas.style
      if (_mode === 'default')
        _style.position = ''
      else if (_mode === 'fit' || _mode === 'center') {
        _style.position = 'absolute'
        Object.assign(_canvas.style, styles)
      }
      if (_mode === 'fit') {
        refit()
        if (!listening)
          listen()
      }
    }
    var _size = _options.size
    _width  = _size[0]
    _height = _size[1]
    _center = [_width / 2, _height / 2]
    _canvas.width  = _width
    _canvas.height = _height
  }

  function mount(element) {
    if (!element)
      throw 'GraphicsError: Cannot mount display on element `' + element + '`'
    if (typeof element === 'string') {
      var selector = element
      element = document.querySelector(selector)
    }
    if (!element)
      throw 'GraphicsError: Selector for display mount `' + selector + '` provided element `' + element + '`'
    element.appendChild(_canvas)
    _element = element
    if (_options.mode === 'fit')
      refit()
    return _display
  }

  function refit() {
    if (_element) {
      var rect = _element.getBoundingClientRect()
      var rectWidth   = rect.width  || window.innerWidth
      var rectHeight  = rect.height || window.innerHeight

      var aspect = _width / _height

      var width  = rectWidth
      var height = width * (1 / aspect)

      if (height > rectHeight) {
        height = rectHeight
        width  = height * aspect
      }

      _updateCanvas.width  = _canvas.width
      _updateCanvas.height = _canvas.height

      _updateContext.imageSmoothingEnabled = _options.smoothing
      _updateContext.drawImage(_canvas, 0, 0)

      _canvas.width  = width
      _canvas.height = height

      _context.imageSmoothingEnabled = _options.smoothing

      _context.drawImage(_updateCanvas, 0, 0, _canvas.width, _canvas.height)
    }
  }

  function getGradient(array) {
    if (!array || !array.length) return null
    if (array.length === 1)      return array[0]
    var gradient = _context.createLinearGradient(0, 0, 0, _canvas.height)
    var i = array.length
    while (i--)
      gradient.addColorStop(i, array[i])
    return gradient
  }

  function clear(rect) {

  }

  function fill(color) {
    var gradient
    if (!color)
      color = 'black'
    else if (Array.isArray(color))
      gradient = getGradient(color)
    _context.fillStyle = gradient || color
    _context.fillRect(0, 0, _canvas.width, _canvas.height)
    if (!drawing)
      _nodes.push({
        type:  'fill',
        color: color
      })
  }

  function drawImage(image, pos) {

    var options, origin = 'top-left'
    if (!(image instanceof window.HTMLImageElement || image instanceof window.HTMLCanvasElement)) {
      options = image
      image = options.image
      if (!pos)
        pos = options.pos
      origin = options.origin
    }

    if (!image)
      throw 'GraphicsError: Cannot draw image `' + image + '` onto display'

    // Destructure / normalize
    var x, y
    if (Array.isArray(pos))
      x = pos[0], y = pos[1]
    else if (!pos)
      x = 0, y = 0
    else
      x = pos.x, y = pos.y

    var unit = _canvas.width / _width

    var width  = image.width
    var height = image.height

    var offset = offsets[origin]

    x += offset[0] * width
    y += offset[1] * height

    _context.drawImage(image, x * unit, y * unit, width * unit, height * unit)

    if (!drawing)
      _nodes.push({
        type:   'image',
        image:  image,
        pos:    pos,
        origin: origin
      })
  }

  var drawing = false
  function draw(node) {
    var type = node.type
    drawing = true
    if (type === 'fill')
      fill(node.color)
    else if (type === 'image')
      drawImage(node)
    drawing = false
  }

  function redraw() {
    var i = 0, max = _nodes.length
    while (i < max) {
      var node = _nodes[i++]
      draw(node)
    }
  }

  return _display
}
