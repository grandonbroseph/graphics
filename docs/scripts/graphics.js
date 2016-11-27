export default (function () {
  return (function () {
    var parent
    var parentRect
    var canvases = []
    var resized = false
    function onresize() {
      if (!resized) {
        requestAnimationFrame(function () {
          parentRect = parent.getBoundingClientRect()
          var i = canvases.length
          while (i--) {
            var canvas = canvases[i]
            resizeCanvas(canvas)
          }
          resized = false
        })
      }
      resized = true
    }
    function drawSprite(canvas, sprite) {
      var ctx = canvas.context
      if (sprite.drawRegionLast) {
        var pos  = sprite.drawRegionLast[0]
        var size = sprite.drawRegionLast[1]
        ctx.clearRect(pos[0], pos[1], size[0], size[1])
      }
      sprite.drawRegion = [sprite.pos, [sprite.pos[0] + sprite.size[0], sprite.pos[1] + sprite.size[1]]]
      var pos  = sprite.drawRegion[0]
      var size = sprite.drawRegion[1]
      if (sprite.color) {
        ctx.fillStyle = sprite.color
        ctx.drawRect(pos[0], pos[1], size[0], size[1])
      }
    }
    var canvasMethods = {
      fill: function (color) {
        var canvas = this
        canvas._backgroundColor = color
        updateCanvas(canvas)
      }
    }
    function createCanvas(aspectRatio) {
      var canvas = Object.assign(Object.create(canvasMethods), {
        aspectRatio: aspectRatio || 4/3,
        sprites: []
      })
      var el = canvas.el = document.createElement("canvas")
      canvas.context = el.getContext("2d")
      Object.assign(el.style, {
        position:  "absolute",
        left:      "50%",
        top:       "50%",
        transform: "translate(-50%, -50%)"
      })
      return canvas
    }
    function updateCanvas(canvas) {
      var ctx = canvas.context
      var el  = canvas.el
      var backgroundColor = canvas._backgroundColor
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, el.width, el.height)
      }
      var sprites = canvas.sprites
      var i = sprites.length
      while (i--) {
        var sprite = sprites[i]
        drawSprite(canvas, sprite)
      }
    }
    function resizeCanvas(canvas) {
      var el     = canvas.el
      var width  = parentRect.width
      var height = parentRect.height
      var w = width
      var h = width * (1 / canvas.aspectRatio)
      if (h > height) {
        h = height
        w = height * canvas.aspectRatio
      }
      el.width  = w
      el.height = h
      updateCanvas(canvas)
    }
    return {
      createDisplay: function (el, aspectRatio) {
        parent = el ? document.querySelector(el) : document.body
        var canvas = createCanvas(aspectRatio)
        canvases.push(canvas)
        parent.appendChild(canvas.el)
        if (!parentRect) {
          window.addEventListener("orientationchange", onresize)
          window.addEventListener("resize", onresize)
          onresize()
        } else {
          resizeCanvas(canvas)
        }
        return canvas
      },
      createSprite: function () {
        return "sprite"
      },
      update: function () {

      }
    }
  })()
})()
