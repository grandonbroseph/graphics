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
