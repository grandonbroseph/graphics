var Graphics = {
  load: function (imagePath, done) {
    var image = new window.Image()
    image.src = imagePath
    image.onload = function () {
      done.call(window, image)
    }
  },
    Display: require('./modules/display'),
       Node: require('./modules/node'),
  Transform: require('./modules/transform')
}

var types = Graphics.Node.types
var i     = types.length
while (i--) {
  var type = types[i]
  Graphics[type] = function (type) {
    return {
      create: function (options, pos) {
        var node = Node.create(type, options, pos)
        return node
      }
    }
  }(type)
}

window.Graphics = window.Graphics || Graphics
