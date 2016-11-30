import Vector from "./vector.js"

var displays = []
var parents  = []
var parentsBySelectors = {}

function getParentBySelector(selector) {
  return parentsBySelectors[selector] || null
}

function removeFromArray(item, array) {
  var index = array.indexOf(item)
  if (index !== -1) {
    array.splice(index, 1)
  }
}

var scale     = 32
var listening = false
var resized   = false
function onresize() {
  if (!resized) {
    requestAnimationFrame(function resize() {
      var i = parents.length
      while (i--) {
        var parent = parents[i]
        parent.resize()
      }
      resized = false
    })
  }
  resized = true
}

function Parent(selector) {
  this.el       = selector ? document.querySelector(selector) : null
  this.rect     = null
  this.displays = []
  this.resize()
  parents.push(this)
  parentsBySelectors[selector] = this
}

Parent.prototype = {
  resize: function () {
    var rect = this.rect = this.el.getBoundingClientRect()
    var displays = this.displays
    var i = displays.length
    while (i--) {
      var display = displays[i]
      display.resize(rect)
    }
  }
}

function Display(aspectRatio, parent) {
  var _fill = null
  var el = this.el = document.createElement("canvas")
  this.context     = el.getContext("2d")
  this.sprites     = []
  this.aspectRatio = aspectRatio || 4 / 3
  this.parent      = null
  var width        = this.width  = scale
  var height       = this.height = scale * (1 / aspectRatio)
  this.size        = [width, height]
  Object.assign(this, {
    fill: function (color) {
      _fill = color
      this.draw()
      return this
    },
    clearRect: function (x, y, w, h) {
      this.drawRect(x, y, w, h, _fill)
    },
    drawRect: function (x, y, w, h, fill) {
      var unit = this.unit
      var ctx = this.context
      x *= unit
      y *= unit
      w *= unit
      h *= unit
      if (fill) {
        ctx.fillStyle = fill
        ctx.fillRect(x, y, w, h)
      } else {
        ctx.clearRect(x, y, w, h)
      }
    },
    draw: function () {
      if (_fill) {
        this.drawRect(0, 0, this.width, this.height, _fill)
      }
      var sprites = this.sprites
      var i = sprites.length
      while (i--) {
        var sprite = sprites[i]
        sprite.redraw()
      }
    }
  })
  Object.assign(el.style, {
    position:  "absolute",
    left:      "50%",
    top:       "50%",
    transform: "translate(-50%, -50%)"
  })
  parent && this.attach(parent)
}

Display.prototype = {
  clear: function () {
    this.clearRect(0, 0, this.width, this.height)
  },
  redraw: function () {
    this.clear()
    this.draw()
  },
  resize: function (rect) {
    rect = rect || this.parent.rect
    var el = this.el
    var aspectRatio = this.aspectRatio
    var rectWidth   = rect.width
    var rectHeight  = rect.height
    var width       = rectWidth
    var height      = rectWidth * (1 / aspectRatio)
    if (height > rectHeight) {
      height = rectHeight
      width  = rectHeight * aspectRatio
    }
    el.width  = width
    el.height = height
    this.unit = width / scale
    this.draw()
  },
  attach: function (parent) {
    parent.el.appendChild(this.el)
    parent.displays.push(this)
    this.parent = parent
    this.resize()
    return this
  },
  detach: function () {
    var parent = this.parent
    parent.el.removeChild(this.el)
    removeFromArray(this, parent.displays)
    this.parent = null
  },
  update: function () {
    var sprites = this.sprites
    var i = sprites.length
    while (i--) {
      var sprite = sprites[i]
      sprite.update()
    }
  },
  createSprite: function (pos, size) {
    return new Sprite(pos, size).attach(this)
  }
}

function Sprite(pos, size, display) {
  var _fill           = null
  var _stroke         = null
  var _strokeWidth    = 1
  var el = this.el    = document.createElement("canvas")
  this.context        = el.getContext("2d")
  this.pos            = pos || null
  this.size           = size = size || null
  this.display        = display || null
  this.transform      = new Transform()
  this.drawRegionLast = null
  this.drawRegion     = null
  Object.assign(el, {
    width:  size[0],
    height: size[1]
  })
  Object.assign(this, { // Privileged methods
    fill: function (color) {
      _fill   = color
      var el  = this.el
      var ctx = this.context
      ctx.fillStyle = _fill
      ctx.fillRect(0, 0, el.width, el.height)
      this.draw()
      return this
    },
    stroke: function (color, width) {
      _stroke      = color
      _strokeWidth = width
      this.draw()
      return this
    },
    draw: function () {
      var unit = this.display.unit
      var ctx = this.display.context
      var r = this.drawRegion = this.getDrawRegion()
      var x = r[0] * unit
      var y = r[1] * unit
      var w = r[2] * unit
      var h = r[3] * unit
      if (_fill) {
        ctx.drawImage(this.el, x, y, w, h)
      }
      this.drawRegionLast = this.drawRegion
    }
  })
}

Sprite.prototype = {
  getDrawRegion: function () {
    var pos = this.pos
    var size = this.size
    var w = size[0]
    var h = size[1]
    var x = pos[0] - w / 2
    var y = pos[1] - h / 2
    return [x, y, w, h]
  },
  clear: function () {
    var r = this.drawRegionLast
    if (r) {
      var x = r[0] - 1
      var y = r[1] - 1
      var w = r[2] + 2
      var h = r[3] + 2
      this.display.clearRect(x, y, w, h)
    }
  },
  redraw: function () {
    this.clear()
    this.draw()
  },
  attach: function (display) {
    display.sprites.push(this)
    this.display = display
    this.draw()
    return this
  },
  detach: function () {
    this.clear()
    removeFromArray(this, this.display.sprites)
    this.display = null
    return this
  },
  update: function () {
    this.redraw()
  },
  rotate: function (angle) {
    this.transform.rotate(angle)
    return this
  }
}

function Transform() {
  this.translation = [0, 0]
  this.rotation    = 0
  this.scaling     = [1, 1]
  Object.assign(this, {
    translate: function(translation) {
      Vector.add(this.translation, translation)
    },
    translateX: function(translationX) {
      this.translation[0] += translationX
    },
    translateY: function(translationY) {
      this.translation[1] += translationY
    },
    resetTranslation: function () {
      this.translation[0] = 0
      this.translation[1] = 0
    },
    rotate: function(rotation) {
      this.rotation += rotation
      while (this.rotation < 0) {
        this.rotation += 360
      }
      while (this.rotation > 360) {
        this.rotation -= 360
      }
    },
    resetRotation: function () {
      this.rotation = 0
    },
    scale: function(scaling) {
      Vector.add(this.scaling, scaling)
    },
    scaleX: function(scalingX) {
      this.scaling[0] += scalingX
    },
    scaleY: function(scalingY) {
      this.scaling[1] += scalingY
    },
    resetScaling: function () {
      this.scaling[0] = 1
      this.scaling[1] = 1
    }
  })
}

export default {
  createDisplay: function (aspectRatio, selector) {
    var display = new Display(aspectRatio)
    var parent = getParentBySelector(selector) || new Parent(selector)
    parent && display.attach(parent)
    if (!listening) {
      listening = true
      window.addEventListener("orientationchange", onresize)
      window.addEventListener("resize", onresize)
      onresize()
    }
    return display
  },
  createSprite: function (pos, size, display) {
    var sprite = new Sprite(pos, size)
    display && sprite.attach(display)
    return sprite
  },
  update: function () {
    var i = displays.length
    while (i--) {
      var display = displays[i]
      display.update()
    }
  }
}
