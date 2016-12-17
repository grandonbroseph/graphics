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
