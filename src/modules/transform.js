function create(translation, rotation, scaling) {
  if (translation) {
    if (Array.isArray(translation)) {
      translation = { x: translation[0], y: translation[1] }
    }
  } else {
    translation = { x: 0, y: 0 }
  }
  if (!rotation) {
    rotation = 0
  }
  if (scaling) {
    if (Array.isArray(scaling)) {
      scaling = { x: scaling[0], y: scaling[1] }
    }
  } else {
    scaling = { x: 1, y: 1 }
  }
  var transform = {
    translation: translation,
       rotation: rotation,
        scaling: scaling
  }
  return transform
}

function isDefault(transform) {
  if (!transform) return null
  var translation = transform.translation
  var rotation    = transform.rotation
  var scaling     = transform.scaling
  return translation && !translation.x && !translation.y && !rotation && scaling && scaling.x === 1 && scaling.y === 1
}

module.exports = {
  create: create,

  isDefault: isDefault
}
