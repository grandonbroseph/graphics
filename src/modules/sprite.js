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
