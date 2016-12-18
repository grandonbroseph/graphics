(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Graphics = window.Graphics = window.Graphics || {
  load: function (imagePath, done) {
    var image = new window.Image()
    // image.crossOrigin = 'anonymous'
    image.src = imagePath
    image.onload = function () {
      done.call(window, image)
    }
  },
  Display:    require('./modules/display'),
  Scene:      require('./modules/scene'),
  Sprite:     require('./modules/sprite'),
  Text:       require('./modules/text'),
  ImageFont:  require('./modules/image-font')
}

},{"./modules/display":2,"./modules/image-font":3,"./modules/scene":4,"./modules/sprite":5,"./modules/text":6}],2:[function(require,module,exports){
var Display = {}

var displays = []
var listening = false
function listen() {
  window.addEventListener("resize", onWindowResize)
  listening = true
}

var resized = false
function onWindowResize() {
  if (!resized) {
    requestAnimationFrame(resize)
  }
  resized = true
}

function resize() {
  for (var i = displays.length; i--; refit(displays[i]));
  resized = false
}

function create(aspectRatio) {
  aspectRatio = aspectRatio || 4 / 3

  var display = {}
  display.scene   = null

  var canvas
  display.canvas       = canvas = document.createElement('canvas')
  display.canvasWidth  = canvas.width  = null
  display.canvasHeight = canvas.height = null

  display.parent  = null
  display.context = canvas.getContext('2d')

  display.backgroundColor = 'black'

  var width
  display.width  = width = 256
  display.height = width * (1 / aspectRatio)

  displays.push(display)
  if (!listening) {
    listen()
  }

  return display
}

function mount(display, parent) {
  if (!display) throw 'GraphicsError: Failed to mount display `' + display + '`'
  if (typeof parent === 'string') {
    parent = document.querySelector(parent)
  }
  if (!parent)  throw 'GraphicsError: Failed to mount `display` on parent `' + parent + '`'
  display.parent = parent
  parent.appendChild(display.canvas)
  refit(display)
}

function refit(display) {
  var canvas = display.canvas
  var parent = display.parent
  if (!parent) throw 'GraphicsError: `Display` cannot fit to parent `' + parent + '`'
  var parentRect   = parent.getBoundingClientRect()
  var parentWidth  = parentRect.width
  var parentHeight = parentRect.height
  var aspectRatio  = getAspectRatio(display)
  var height = parentHeight
  var width  = height * aspectRatio
  if (width > parentWidth) {
    width  = parentWidth
    height = width * (1 / aspectRatio)
  }
  if (width !== display.canvasWidth || height !== display.canvasHeight) {
    canvas.width  = display.canvasWidth  = width
    canvas.height = display.canvasHeight = height
    display.context.imageSmoothingEnabled = false
    clear(display)
    render(display)
  }
}

function clear(display, rect) {
  if (!display) throw 'GraphicsError: Failed to clear `display` ' + display
  var canvas  = display.canvas
  var context = display.context
  var x, y, width, height

  if (rect) {
    x      = rect[0]
    y      = rect[1]
    width  = rect[2]
    height = rect[3]
  } else {
    x = 0
    y = 0
    width  = canvas.width
    height = canvas.height
  }

  context.fillStyle = display.backgroundColor
  context.fillRect(x, y, width, height)
}

function render(display, scene) {
  if (!display) throw 'GraphicsError: Failed to render `display` ' + display
  scene = scene || display.scene
  if (scene && scene !== display.scene) {
    display.scene = scene
    clear(display)
  }
  if (!scene) return null
  var canvas  = display.canvas
  var context = display.context
  context.drawImage(scene.canvas, 0, 0, canvas.width, canvas.height)
}

function getCenter(display) {
  return [display.width / 2, display.height / 2]
}

function getAspectRatio(display) {
  return display.width / display.height
}

module.exports = Object.assign(Display, {
  create: create,
  mount:  mount,
  clear:  clear,
  render: render,
  getCenter: getCenter,
  getAspectRatio: getAspectRatio
})

},{}],3:[function(require,module,exports){
function create(image, config) {
  var imageFont = { image: image }
  var _chars    = imageFont.chars = config.chars
  var _charSize = config.charSize
  _charSize  = imageFont.charSize = !isNaN(_charSize) ? [_charSize, _charSize] : _charSize

  var _charWidth  = _charSize[0]
  var _charHeight = _charSize[1]

  var _styles = imageFont.styles = config.styles || 1

  imageFont.smoothing = typeof config.smoothing !== 'undefined' ? config.smoothing : true

  imageFont.charMap = map(imageFont, 16)

  return imageFont
}

function map(imageFont, scale) {
  var charMap    = []
  var chars      = imageFont.chars
  var charSize   = imageFont.charSize
  var charWidth  = charSize[0]
  var charHeight = charSize[1]

  var charWidthScaled  = charWidth  * scale
  var charHeightScaled = charHeight * scale

  var styles = imageFont.styles

  var image = imageFont.image
  var charsPerRow   = image.width  / charWidth

  var smoothing = imageFont.smoothing

  var i = styles
  while (i--) {
    var style = charMap[i] = []
    var j = chars.length
    while (j--) {
      var charCanvas = document.createElement('canvas')
      charCanvas.width  = charWidthScaled
      charCanvas.height = charHeightScaled

      var charContext = charCanvas.getContext('2d')
      charContext.imageSmoothingEnabled = smoothing

      var x = j % charsPerRow
      var y = (j - x) / charsPerRow

      charContext.drawImage(image, x * charWidth, y * charWidth, charWidth, charHeight, 0, 0, charWidthScaled, charHeightScaled)

      style[j] = charCanvas
    }
  }
  return charMap
}

function get(imageFont, char, style) {
  style = style || 0
  var index = imageFont.chars.indexOf(char.toUpperCase())
  return imageFont.charMap[style][index] || null
}

module.exports = {
  create: create,
  get:    get
}

},{}],4:[function(require,module,exports){
var utils = require('./utils')
var removeFromArray = utils.removeFromArray

var Scene = {}

function create(aspectRatio) {
  aspectRatio = aspectRatio || 4 / 3

  var scene = {
    type:     Scene,
    children: [],
    rects:    {}
  }

  var canvas, width
  scene.canvas = canvas = document.createElement('canvas')
  scene.width  = canvas.width  = width = 256
  scene.height = canvas.height = width * (1 / aspectRatio)

  scene.context = canvas.getContext('2d')
  scene.context.imageSmoothingEnabled = false

  return scene
}

function add(scene, child) {
  var sceneChildren = scene.children
  if (Array.isArray(child)) {
    var children = child
    for (var i = children.length; child = children[i--]; sceneChildren[sceneChildren.length] = child, child.parent = scene, Sprite.render(child));
  } else {
    sceneChildren[sceneChildren.length] = child
  }
  parent = scene
  while (parent) {
    render(parent, true)
    parent = parent.parent
  }
}

function remove(scene, child) {
  var sceneChildren = scene.children
  if (Array.isArray(child)) {
    var children = child
    for (var i = children.length; child = children[i--]; removeFromArray(sceneChildren, children[i]), child.parent = null);
  } else {
    removeFromArray(sceneChildren, child)
  }
  parent = scene
  while (parent) {
    render(parent, true)
    parent = parent.parent
  }
}

function render(scene, force) {
  children = scene.children
  for (var i = children.length; i--; redrawSprite(scene, children[i], force));
}

function getRect(sprite) {
  var position = sprite.position
  var size     = sprite.size

  var width  = size[0]
  var height = size[1]

  var x = position[0] - width / 2
  var y = position[1] - height / 2

  return [x, y, width, height]
}

function isRectEqual(a, b) {
  for (var i = a.length; i--;) if (a[i] !== b[i]) return false
  return true
}

function clearSprite(scene, sprite, force) {
  var oldRect = scene.rects[sprite.id]
  if (!oldRect) return true
  var newRect = getRect(sprite)
  if (!force && isRectEqual(oldRect, newRect)) return false
  var context = scene.context
  var x      = oldRect[0]
  var y      = oldRect[1]
  var width  = oldRect[2]
  var height = oldRect[3]
  fill = sprite.fill
  if (fill) {
    context.fillStyle = fill
    context.fillRect(x, y, width, height)
  } else {
    context.clearRect(x, y, width, height)
  }
  return newRect
}

function drawSprite(scene, sprite, rect) {
  var rects = scene.rects
  var id    = sprite.id
  rect = rects[id] = rect || rects[id] || getRect(sprite)
  if (!rect) throw 'GraphicsError: Cannot draw sprite with rect `' + rect + '`'
  var x       = rect[0]
  var y       = rect[1]
  var width   = rect[2]
  var height  = rect[3]
  scene.context.drawImage(sprite.canvas, x, y, width, height)
}

function redrawSprite(scene, sprite, force) {
  newRect = clearSprite(scene, sprite, force)
  if (newRect) {
    drawSprite(scene, sprite, newRect !== true ? newRect : null)
  }
}

function getCenter(scene) {
  return [scene.width / 2, scene.height / 2]
}

module.exports = Object.assign(Scene, {
  create: create,
  add:    add,
  remove: remove,
  render: render,

  clearSprite:  clearSprite,
  drawSprite:   drawSprite,
  redrawSprite: redrawSprite,

  getCenter: getCenter
})

},{"./utils":7}],5:[function(require,module,exports){
var Scene = require('./scene')
var Text  = require('./text')

var Sprite = {}

var numbers = '0123456789'
var letters = 'abcdefghijklmnopqrstuvwxyz'
var getId = function (defaultChars, defaultLength, defaultRandom) {
  var floor = Math.floor
  return function getId(chars, length, random) {
    chars  = chars  || defaultChars
    length = length || defaultLength || 0
    random = random || defaultRandom || Math.random
    var result = ''
    var charsLength = chars.length
    var i = length
    while (i--) {
      var char = chars[floor(random() * charsLength)]
      result += char
    }
    return result
  }
}(numbers + letters + letters.toUpperCase() + '_-', 32)

function create(type) {
  var sprite = Object.assign(Object.create(type), Scene.create())
  delete sprite.width
  delete sprite.height
  sprite.position = null
  sprite.id = getId()
  resize(sprite, sprite.size || [0, 0])
  render(sprite)
  return sprite
}

function render(sprite, force) {
  if (sprite.type === Text) return Text.render(sprite)

  var canvas  = sprite.canvas
  var context = sprite.context
  var size    = sprite.size
  var width   = size[0]
  var height  = size[1]

  var fill = sprite.fill
  if (fill) {
    context.fillStyle = fill
    context.fillRect(0, 0, width, height)
  }

  parent = sprite
  while (parent) {
    Scene.render(parent, true)
    parent = parent.parent
  }
}

function resize(sprite, size) {
  var width   = size[0]
  var height  = size[1]
  var canvas  = sprite.canvas
  var context = sprite.context
  sprite.size   = size
  canvas.width  = width
  canvas.height = height
  context.imageSmoothingEnabled = false
}

function getCenter(sprite) {
  var size = sprite.size
  return [size[0] / 2, size[1] / 2]
}

module.exports = Object.assign(Sprite, Scene, {
  create: create,
  render: render,
  resize: resize,

  getCenter: getCenter
})

},{"./scene":4,"./text":6}],6:[function(require,module,exports){
var Sprite    = require('./sprite')
var ImageFont = require('./image-font')

function create(text, config) {
  var text = { text: text }

  var font = config.font
  if (!font) throw 'GraphicsError: Failed to create text with font `' + font + '`'

  var size
  text.size     = size = [0, 0]
  text.font     = font
  text.fontSize = config.fontSize

  var canvas
  text.canvas   = canvas = document.createElement('canvas')
  canvas.width  = size[0]
  canvas.height = size[1]

  text.context = canvas.getContext('2d')

  return text
}

function render(text) {
  var size = text.size

  var canvas  = text.canvas
  var context = text.context

  var content = text.text
  var length  = content.length
  var font    = text.font

  var charSize = font.charSize
  var fontSize = text.fontSize

  var aspectRatio = charSize[0] / charSize[1]

  var charWidth  = charSize[0]
  var charHeight = charSize[1]

  var charWidthScaled  = charWidth  * fontSize * (1 / aspectRatio)
  var charHeightScaled = charHeight * fontSize

  canvas.width  = size[0] = charWidthScaled * length
  canvas.height = size[1] = charHeightScaled

  // context.fillStyle = 'seagreen'
  // context.fillRect(0, 0, size[0], size[1])

  var i = length
  while (i--) {
    var char = content[i]
    var charImage = ImageFont.get(font, char)
    var x = charWidthScaled * i
    var y = 0
    context.drawImage(charImage, x, y, charWidthScaled, charHeightScaled)
  }

  console.log(canvas.toDataURL())
}

module.exports = Object.assign({
  create: create,
  render: render
})

},{"./image-font":3,"./sprite":5}],7:[function(require,module,exports){
function removeFromArray(array, item) {
  var index = array.indexOf(item)
  if (index !== -1) array.splice(index, 1)
  return index
}

module.exports = {
  removeFromArray: removeFromArray
}

},{}]},{},[1]);
