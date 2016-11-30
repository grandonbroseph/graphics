import Vector   from "./vector.js"
import Physics  from "./physics.js"
import Graphics from "./graphics.js"

var display = Graphics.createDisplay(4/3, "#wrap").fill("white")

var Square = {
  proto: {
    type: {
      size: [2, 2],
      spd:  0.015,
      frc:  0.98,
      bnc:  0.6
    },
    color: "seagreen",
    move: function (direction) {
      this.body.dir = Vector.normalized(direction)
    },
    update: function () {
      this.body.update()
      this.sprite.update()
    }
  },
  create: function (pos) {
    pos = Vector.clone(pos)
    var proto  = this.proto
    var square = Object.assign(Object.create(proto), {
      pos: pos,
      body: Physics.createBody(proto.type).spawn(pos, display.size),
      sprite: display.createSprite(pos, proto.type.size).fill(proto.color).rotate(45)
    })
    return square
  }
}

var square = Square.create(Vector.scaled(display.size, 0.5))

var keys = {}
function handleKeys(event) {
  keys[event.code] = event.type === "keydown"
}

window.addEventListener("keydown", handleKeys)
window.addEventListener("keyup",   handleKeys)

var keybindings = {
  ArrowLeft:  Vector.LEFT,
  ArrowUp:    Vector.UP,
  ArrowRight: Vector.RIGHT,
  ArrowDown:  Vector.DOWN
}

function update() {
  var direction = [0, 0]
  for (var code in keybindings) {
    var keyDirection = keybindings[code]
    if (keys[code]) {
      Vector.add(direction, keyDirection)
    }
  }
  square.move(direction)
  square.update()
  requestAnimationFrame(update)
}
update()
