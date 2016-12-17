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
