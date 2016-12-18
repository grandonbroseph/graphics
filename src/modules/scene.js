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
