import Vector from "./vector.js"

function Body(type) {
  Object.assign(Object.assign(this, {
    pos:  null,
    size: [0, 0],
    vel:  [0, 0],
    dir:  [0, 0],
    spd:  0,
    frc:  0,
    bnc:  0
  }), type || {})
}

Body.prototype = {
  spawn: function (pos, env) {
    this.pos = pos
    this.env = env
    return this
  },
  update: function () {
    var pos  = this.pos
    var size = this.size
    var vel  = this.vel
    var bnc  = this.bnc
    var env  = this.env
    Vector.add(vel, Vector.scaled(this.dir, this.spd))
    Vector.add(pos, vel)
    Vector.scale(vel, this.frc)
    if (env) {
      var x = pos[0]
      var y = pos[1]
      var w = size[0]
      var h = size[1]
      if (x < w / 2) {
        pos[0] = w / 2
        vel[0] *= -bnc
      }
      if (y < h / 2) {
        pos[1] = h / 2
        vel[1] *= -bnc
      }
      if (x > env[0] - w / 2) {
        pos[0] = env[0] - w / 2
        vel[0] *= -bnc
      }
      if (y > env[1] - h / 2) {
        pos[1] = env[1] - h / 2
        vel[1] *= -bnc
      }
    }
  }
}

export default {
  createBody: function (type) {
    return new Body(type)
  }
}
