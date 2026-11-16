// Keyboard and mouse: WASD/arrows to move, mouse drag to orbit the camera,
// click (a press without a drag) to cast, hook and reel, Space the same.
// The game reads the frame's accumulated deltas and click through `take`.

/** Track input on the canvas element. */
export function createInput(canvas) {
  const keys = new Set();
  let dragDX = 0;
  let dragDY = 0;
  let dragging = false;
  let downX = 0;
  let downY = 0;
  let moved = 0;
  let clickQueued = false;
  let spaceQueued = false;

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      if (!event.repeat) spaceQueued = true;
      event.preventDefault();
    }
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });

  canvas.addEventListener('mousedown', (event) => {
    dragging = true;
    moved = 0;
    downX = event.clientX;
    downY = event.clientY;
  });
  window.addEventListener('mousemove', (event) => {
    if (!dragging) return;
    const dx = event.movementX ?? 0;
    const dy = event.movementY ?? 0;
    dragDX += dx;
    dragDY += dy;
    moved += Math.abs(dx) + Math.abs(dy);
  });
  window.addEventListener('mouseup', (event) => {
    if (!dragging) return;
    dragging = false;
    // A press that barely moved is a click, not a camera drag.
    if (moved < 6 && event.target === canvas) clickQueued = true;
    void downX;
    void downY;
  });

  return {
    /** Is a key held (by KeyboardEvent.code)? */
    held(code) {
      return keys.has(code);
    },

    /** Is any of these movement keys held? */
    moveHeld() {
      return keys.has('KeyW') || keys.has('ArrowUp') || keys.has('KeyS') || keys.has('ArrowDown')
        || keys.has('KeyA') || keys.has('ArrowLeft') || keys.has('KeyD') || keys.has('ArrowRight');
    },

    /** The frame's movement direction in camera space: { x, z } or null. */
    moveVector() {
      let x = 0;
      let z = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (x === 0 && z === 0) return null;
      const len = Math.hypot(x, z);
      return { x: x / len, z: z / len };
    },

    /** Consume and return the frame's camera orbit deltas and action presses. */
    take() {
      const out = { dx: dragDX, dy: dragDY, click: clickQueued, space: spaceQueued };
      dragDX = 0;
      dragDY = 0;
      clickQueued = false;
      spaceQueued = false;
      return out;
    },
  };
}
