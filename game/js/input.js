// Keyboard and pointer input. One-shot presses (cast, hook, confirm) are queued as
// bit flags and taken once by the loop, so a press between two frames is never lost
// and never counted twice. Holding the pointer or Space reels the line in.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SHOP = 4;
export const ACTION_MAP = 8;
export const ACTION_FISHDEX = 16;
export const ACTION_RESTART = 32;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(canvas) {
  let actions = 0;
  let reeling = false;
  let pointer = { x: 0, y: 0, down: false };

  function confirm() {
    actions |= ACTION_CONFIRM;
  }

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) confirm();
      reeling = true;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyS') {
      if (!event.repeat) actions |= ACTION_SHOP;
    } else if (event.code === 'KeyM') {
      if (!event.repeat) actions |= ACTION_MAP;
    } else if (event.code === 'KeyF') {
      if (!event.repeat) actions |= ACTION_FISHDEX;
    } else if (event.code === 'KeyR') {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else {
      return;
    }
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (CONFIRM.has(event.code)) reeling = false;
  });
  window.addEventListener('blur', () => {
    reeling = false;
    pointer.down = false;
  });

  function trackPointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: ((event.clientX - rect.left) / rect.width) * 1280,
      y: ((event.clientY - rect.top) / rect.height) * 720,
      down: pointer.down,
    };
  }
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', (event) => {
    trackPointer(event);
    pointer.down = true;
    reeling = true;
    confirm();
  });
  window.addEventListener('pointerup', () => {
    pointer.down = false;
    reeling = false;
  });

  return {
    /** Whether the reel is held down right now (pointer or Space). */
    isReeling() {
      return reeling;
    },
    /** The pointer's position in logical 1280x720 coordinates. */
    pointer() {
      return pointer;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
