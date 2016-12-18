var Graphics = window.Graphics = window.Graphics || {
  load: function (imagePath, done) {
    var image = new window.Image()
    // image.crossOrigin = 'anonymous'
    image.src = imagePath
    image.onload = function () {
      done.call(window, image)
    }
  },
  Display:    require('./modules/display'),
  Scene:      require('./modules/scene'),
  Sprite:     require('./modules/sprite'),
  Text:       require('./modules/text'),
  ImageFont:  require('./modules/image-font')
}
