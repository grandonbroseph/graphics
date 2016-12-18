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
