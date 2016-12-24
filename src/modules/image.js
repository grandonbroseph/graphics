module.exports = {
       load: load,
  serialize: serialize
}

function loadOne(path, done) {
  var image = new Image()
  image.src = path
  image.onload = function() {
    done && done(image)
  }
}

function load(paths, done) {
  if (Array.isArray(paths)) {
    var i = 0, max = paths.length
    var images = []
    var loaded = []
    ;(function next(image) {
      if (image) images[i - 1] = image
      if (i >= max)
        return done(images)
      var path = paths[i++]
      if (loaded.indexOf(path) !== -1) next()
      loadOne(path, i < max ? next : null)
      loaded.push(path)
    })()
  } else {
    loadOne(paths, done)
  }
}

function serialize(image) {
  var canvas
  if (image instanceof Image) {
    canvas = document.createElement('canvas')
    canvas.width  = image.width
    canvas.height = image.height
    var context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
  } else {
    canvas = image
  }
  return canvas.toDataURL()
}
