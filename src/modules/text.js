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
