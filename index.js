var Graphics = require('./src/index.js')

var Display   = Graphics.Display
var ImageFont = Graphics.ImageFont
var Image     = Graphics.Image
Image.load('./text.png', setup)

function setup(image) {
  var font = ImageFont.create({
    image:     image,
    chars:     '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!-<> ',
    size:      8,
    styles:    2,
    normalize: String.prototype.toUpperCase
  })

  var greeting = ImageFont.get(font, 'Hello World!')

  var options = {
    size: [256, 224],
    mode: 'fit',
    smoothing: false
  }

  var display = Display.create(options).mount(document.body)
  display.fill(['purple', 'orange'])
  display.drawImage({
    image: greeting,
    pos: display.center,
    origin: 'center'
  })

  loop()
}

function loop() {
  requestAnimationFrame(loop)
}
