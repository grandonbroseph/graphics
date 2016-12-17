(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Graphics = window.Graphics = window.Graphics || {
  Display: require('./modules/display'),
  Scene:   require('./modules/scene'),
  Sprite:  require('./modules/sprite')
}

},{"./modules/display":2,"./modules/scene":3,"./modules/sprite":4}],2:[function(require,module,exports){
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

  display.context = canvas.getContext('2d')
  display.parent  = null

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
  scene = display.scene = scene || display.scene
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

module.exports = {
  create: create,
  mount:  mount,
  clear:  clear,
  render: render,
  getCenter: getCenter,
  getAspectRatio: getAspectRatio
}

},{}],3:[function(require,module,exports){
function create(aspectRatio) {
  aspectRatio = aspectRatio || 4 / 3

  var scene = {}

  var canvas, width
  scene.canvas = canvas = document.createElement('canvas')
  scene.width  = canvas.width  = width = 256
  scene.height = canvas.height = width * (1 / aspectRatio)

  scene.context = canvas.getContext('2d')

  scene.children = []
  scene.rects  = {}

  return scene
}

function add(scene, child) {
  var children = scene.children
  if (!Array.isArray(child)) child = [child]
  for (var i = child.length; i--; children[children.length] = child[i]);
}

function remove(scene, child) {
  var children = scene.children
  if (!Array.isArray(child)) child = [child]
  for (var i = arguments.length; i--;) {
    var index
    (index = children.indexOf(arguments[i])) && children.splice(index, 1)
  }
}

function render(scene, children) {
  children = children || scene.children
  for (var i = children.length; i--; redrawSprite(scene, children[i]));
}

function getRect(sprite) {
  var position = sprite.position
  var size     = sprite.size

  var width  = size[0]
  var height = size[1]
  
  var x = position[0] -  width / 2
  var y = position[1] - height / 2

  return [x, y, width, height]
}

function isRectEqual(a, b) {
  for (var i = a.length; i--;) if (a[i] !== b[i]) return false
  return true
}

function clearSprite(scene, sprite) {
  var oldRect = scene.rects[sprite.id]
  if (!oldRect) return true
  var newRect = getRect(sprite)
  if (isRectEqual(oldRect, newRect)) return false
  var context = scene.context
  var x      = oldRect[0]
  var y      = oldRect[1]
  var width  = oldRect[2]
  var height = oldRect[3]
  context.clearRect(x, y, width, height)
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

function redrawSprite(scene, sprite) {
  newRect = clearSprite(scene, sprite)
  if (newRect) {
    drawSprite(scene, sprite, newRect !== true ? newRect : null)
  }
}

module.exports = {
  create: create,
  add:    add,
  remove: remove,
  render: render,
  clearSprite:  clearSprite,
  drawSprite:   drawSprite,
  redrawSprite: redrawSprite
}

},{}],4:[function(require,module,exports){
var Scene = require('./scene')

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

function render(sprite) {
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

  Scene.render(sprite)
}

function resize(sprite, size) {
  var width  = size[0]
  var height = size[1]
  var canvas = sprite.canvas
  sprite.size   = size
  canvas.width  = width
  canvas.height = height
}

module.exports = Object.assign({}, Scene, {
  create: create,
  render: render,
  resize: resize
})

},{"./scene":3}]},{},[1]);
