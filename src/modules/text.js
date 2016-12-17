var Sprite = require('./sprite')

function create(content, font) {
  var text = Sprite.create()
  text.content = content
  text.font    = font
}

module.exports = {
  create: create
}
