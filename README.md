# graphics
> Powerful JavaScript graphics library for use in the browser.

2D graphics library boilerplate designed for personal use. The premise is pretty simple: `Displays` render `Scenes` full of `Sprites`. In other words, if a `Scene` was a fish tank and a `Sprite` represented a fish, then the `Display` would be like a camera that would allow you to view fish in various "exhibits".

Here's a basic example:

```javascript
import Graphics from "./graphics"

var display = new Graphics.Display
display.mount("#app")

var sprite = new Sprite({ size: [16, 16], fill: "teal" })
sprite.position = display.center

var scene = new Graphics.Scene
scene.add(sprite)

display.render(scene)

```

## `load(paths..., done)`
Asynchronously loads one or more images.

### Arguments
- #### `paths...`
Paths to the desired images.

- #### `done(images...)`
`images` refers to the requested `Image` elements corresponding to the `paths` initially provided.

## `Display([aspectRatio])`
A Display `element` for drawing `Sprite` objects.

- ### `aspectRatio`
The display aspect ratio. Defaults to `4 / 3`.

- ### `scale`
Defines the size of one "display pixel". Defaults to `256`.

- ### `width`
The amount of "display pixels" from the left side to the right. Depends on aspect ratio.

- ### `height`
The amount of "display pixels" from the top to the bottom. Depends on aspect ratio.

- ### `center`
The center of the display in "display pixels".

- ### `clear([rect])`
Clears the screen at the provided rectangle `rect` (`[x, y, width, height]`), or the entire display if not provided.

- ### `render([scene])`
Redraws the sprites in `scene` or the last-rendered scene if not provided. Clears the entire display first if a new scene is provided.

- ### `clearSprite(sprite, force)`
Clears sprite from display context. Returns `true` if `sprite` rect hasn't been defined, `false` if it hasn't moved since the last draw (this step can be overridden with the `force` flag), or `sprite.rect` if the sprite was successfully cleared.

- ### `drawSprite(sprite)`
Draws `sprite` onto the `display.context`. Does not clear its last drawn region beforehand.

- ### `redrawSprite(sprite, force)`
Redraws `sprite` onto the `display.context`. If the sprite hasn't changed since it was last drawn, it won't be redrawn unless the `force` flag is supplied.

- ### `mount(parent)`
Mounts this display onto `parent`, which can be either an HTML element or a selector pointing to one. Returns self.

## `Scene`
A simple wrapper for `Sprite` objects. (Might be removed because it just wraps an array.)

- ### `add(sprites...)`
Adds one or more sprites to the scene.

- ### `remove(sprites...)`
Removes one or more sprites from the scene.

## `Sprite(type)`
Objects that get drawn to the screen.

- ### `type`
The sprite's type object.

  - `size`:
  The sprite's initial size in an an array of coordinates, like `[x, y]`.

  - `shape`:
  The shape of the sprite. Defaults to `"rect"`, but can also be `"circle"`.

  - `fill`:
  The sprite's fill color.

  - `stroke`:
  The sprite's stroke color.

  - `strokeWidth`:
  The sprite's stroke width.

  - `image`:
  An `HTMLImageElement` representing the sprite's image, which you can obtain via `Graphics.load`.

  - `imageRect`:
  The sub-rectangle defining which part of the sprite's image is shown.

  - `text`:
  Text that the sprite draws onto its `context`.

  - `font`:
  The font for the sprite's `text`. Can usually be a `String` if referencing a system font, a webfont, etc. but can also be an `ImageFont` object.

- ### `canvas`
The sprite's canvas element.

- ### `context`
The sprite's canvas context.

- ### `position`
The sprite's position in an array of coordinates.

- ### `size`
The sprite's size in an an array of coordinates.

- ### `origin`
The origin of the sprite. Defaults to 'center', but can be one of the following:
```javascript
['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right']
```

- ### `rect`
The last drawn position of this sprite. (What if this sprite is being drawn in multiple locations?)

- ### `getRect(scale)`
Gets the sprite's "rectangle" (draw region) based on its position, size and origin.

- ### `render()`
Renders an image onto the sprite's context based on its data.

- ### `translate(x, y)`
Offsets the sprite's position by `x` and `y`.

- ### `rotate(deg)`
Rotates the sprite by `deg`.

- ### `scale(x, y)`
Scales the sprite by `x` and `y`.

## `ImageFont(image, config)`
An image-based font used for drawing text.

- ### `image`
An `HTMLImageElement` loaded via `Graphics.load`. Typically appears as a spritesheet consisting of letters, numbers, and other characters.

- ### `config`
  - `chars`: A `String` (not an `Array`) of characters in the order in which they appear in the `image`.
  ```javascript
    {
      chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    }
  ```
  - `charSize`: An array in the form `[width, height]` indicating the size (in pixels) for each character sprite.
  ```javascript
    {
      charSize: [8, 12]
    }
  ```
  - `styles`: The amount of "styles" (e.g. bold, italic, shadow) for this font.
