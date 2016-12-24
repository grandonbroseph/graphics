module.exports = {
  create: create,
     get: get
}

function create(config) {
  var image = config.image
  if (!image instanceof Image) throw 'GraphicsError: Cannot create ImageFont with image `' + image + '`'

  var chars = config.chars
  if (!chars) throw 'GraphicsError: Cannot create ImageFont with character list `' + chars + '`'

  var size = config.size
  if (!size) throw 'GraphicsError: Cannot create ImageFont with character size `' + size + '`'
  if (!isNaN(size)) {
    size = config.size = [size, size]
  }

  var styles = config.styles || 1

  var normalize = config.normalize

  var imageFont = {
        image: image,
        chars: chars,
         size: size,
       styles: styles,
    normalize: normalize
  }

  imageFont.map = cache(imageFont)

  return imageFont
}

function cache(imageFont) {
  var map = []
  var i = imageFont.styles
  while (i--) {
    map[i] = cacheStyle(imageFont, i)
  }
  return map
}

function cacheStyle(imageFont, style) {
  var image  = imageFont.image
  var chars  = imageFont.chars
  var size   = imageFont.size
  var styles = imageFont.styles

  var charWidth  = size[0]
  var charHeight = size[1]

  var charsPerRow  = image.width  / charWidth
  var rowsPerStyle = image.height / styles / charHeight

  var map = {}

  var i = 0, max = chars.length
  while (i < max) {
    var x = i % charsPerRow
    var y = (i - x) / charsPerRow

    var subX = x * charWidth
    var subY = (y + style * rowsPerStyle) * charHeight

    var canvas    = document.createElement('canvas')
    canvas.width  = charWidth
    canvas.height = charHeight

    var context = canvas.getContext('2d')
    context.drawImage(image, subX, subY, charWidth, charHeight, 0, 0, charWidth, charHeight)

    var char = chars[i++]
    map[char] = canvas
  }

  return map
}

function get(imageFont, value, style) {
  if (!value)
    throw 'GraphicsError: Cannot get ImageFont text with value `' + value + '`'
  style = style || 0
  var i = value.length
  var canvas
  var map       = imageFont.map
  var normalize = imageFont.normalize
  if (i > 1) {
    var size   = imageFont.size
    var styles = imageFont.styles

    if (style < 0 || style >= styles)
      throw 'GraphicsError: Cannot get ImageFont text with style `' + style + '`'

    var charWidth  = size[0]
    var charHeight = size[1]

    canvas = document.createElement('canvas')
    canvas.width  = charWidth * i
    canvas.height = charHeight

    var context = canvas.getContext('2d')

    while (i--) {
      var char = value[i]
      normalize && (char = normalize.call(char))
      var charImage = map[style][char]
      if (!charImage)
        throw 'GraphicsError: The char `' + char + '` has not been configured in style `' + style + '` for the specified ImageFont'
      context.drawImage(charImage, charWidth * i, 0, charWidth, charHeight)
    }
  } else {
    var char = value
    normalize && (char = normalize.call(char))
    canvas = map[style][char]
    if (!canvas)
      throw 'GraphicsError: The char `' + char + '` has not been configured in style `' + style + '` for the specified ImageFont'
  }
  return canvas
}
