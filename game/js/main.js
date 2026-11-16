// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between screens: title, fishing, shop,
// map, fishdex, paused, catch reveal and win.
//
// ?seed=N fixes the random draws. ?shot=title|play|catch|shop (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.

import { FIELD, STEP } from './config.js';
import { ALL_FISH } from './fish.js';
import { createRandom, range } from './random.js';
import { ACTION_CONFIRM, ACTION_FISHDEX, ACTION_MAP, ACTION_PAUSE, ACTION_RESTART, ACTION_SHOP, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  EVENT_BITE,
  EVENT_CAUGHT,
  EVENT_ESCAPED,
  EVENT_REEL_TICK,
  EVENT_SNAPPED,
  PHASE_BITE,
  PHASE_IDLE,
  createFishing,
} from './fishing.js';
import { buyBoat, buyRod, createShop, equipBoat, equipRod, equippedRod } from './shop.js';
import { loadProfile, recordCatch, saveProfile } from './save.js';
import { createGoldenHour, islandById, tickGoldenHour } from './islands.js';
import { createRenderer, HUD_BUTTONS, fishdexHitRects, mapHitRects, shopHitRects } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const audio = createAudio();
const input = createInput(canvas);
const renderer = createRenderer(canvas);
const profile = loadProfile();
const fishing = createFishing(random);
const goldenHour = createGoldenHour();
const shop = createShop();

const state = {
  screen: 'title',
  time: 0,
  profile,
  fishing: fishing.state,
  goldenHour,
  shop,
  selectedFish: null,
  catchFish: null,
  winReason: null,
  message: '',
  messageTimer: 0,
  particles: [],
  shadows: [],
  prevScreen: 'fishing',
};

for (let i = 0; i < 6; i += 1) {
  state.shadows.push({
    x: range(random, 100, 1200),
    y: range(random, FIELD.waterY + 50, 680),
    size: range(random, 14, 30),
    speed: range(random, 8, 26),
    dir: random() < 0.5 ? -1 : 1,
  });
}

function showMessage(text, seconds = 3) {
  state.message = text;
  state.messageTimer = seconds;
}

function burst(x, y, color, count, speed = 120) {
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const power = range(random, 0.3, 1) * speed;
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * power,
      vy: Math.sin(angle) * power - 60,
      life: range(random, 0.4, 0.9),
      maxLife: 0.9,
      color,
      size: range(random, 2, 5),
    });
  }
}

function splashAt(x, y, color = '#bde0fe') {
  burst(x, y, color, 10, 90);
}

function luckOf() {
  return equippedRod(profile).luck;
}

function openOverlay(screen) {
  state.prevScreen = state.screen === 'fishing' ? 'fishing' : state.prevScreen;
  state.screen = screen;
  audio.click();
}

function closeOverlay() {
  state.screen = 'fishing';
  audio.click();
}

function collectCatch() {
  const fish = fishing.state.fish;
  if (fish === null) return;
  recordCatch(profile, fish);
  state.catchFish = null;
  fishing.reset();
  audio.coin();
  if (profile.divineCaught) {
    state.winReason = 'divine';
    state.screen = 'win';
    return;
  }
  if (Object.keys(profile.caught).length === ALL_FISH.length) {
    state.winReason = 'collection';
    state.screen = 'win';
    return;
  }
  state.screen = 'fishing';
  showMessage(`Caught ${fish.name}! +${fish.coins} coins.`);
}

function handleConfirm() {
  const pointer = input.pointer();
  if (state.screen === 'title') {
    audio.unlock();
    audio.click();
    state.screen = 'fishing';
    return;
  }
  if (state.screen === 'win') {
    state.screen = 'fishing';
    fishing.reset();
    return;
  }
  if (state.screen === 'paused') {
    state.screen = 'fishing';
    return;
  }
  if (state.screen === 'catch') {
    collectCatch();
    return;
  }
  if (state.screen === 'shop' || state.screen === 'map' || state.screen === 'fishdex') {
    handleOverlayClick(pointer);
    return;
  }
  if (state.screen !== 'fishing') return;
  for (const buttonDef of HUD_BUTTONS) {
    if (pointer.x >= buttonDef.x && pointer.x <= buttonDef.x + buttonDef.w && pointer.y >= buttonDef.y && pointer.y <= buttonDef.y + buttonDef.h) {
      openOverlay(buttonDef.id === 'shop' ? 'shop' : buttonDef.id === 'map' ? 'map' : 'fishdex');
      return;
    }
  }
  if (fishing.state.phase === PHASE_IDLE) {
    fishing.cast(equippedRod(profile));
    profile.totalCasts += 1;
    saveProfile(profile);
    audio.splash();
    splashAt(fishing.state.bobberX, fishing.state.bobberY);
  } else if (fishing.state.phase === PHASE_BITE) {
    if (fishing.hook(equippedRod(profile), luckOf(), goldenHour.active, profile.island)) {
      audio.bite();
    }
  }
}

function handleOverlayClick(pointer) {
  if (state.screen === 'shop') {
    for (const hit of shopHitRects(shop)) {
      if (pointer.x < hit.rect.x || pointer.x > hit.rect.x + hit.rect.w || pointer.y < hit.rect.y || pointer.y > hit.rect.y + hit.rect.h) continue;
      if (hit.kind === 'close') {
        closeOverlay();
        return;
      }
      if (hit.kind === 'tab') {
        shop.tab = hit.id;
        audio.click();
        return;
      }
      if (hit.kind === 'row') {
        if (shop.tab === 'rods') {
          if (profile.ownedRods.includes(hit.id)) equipRod(profile, hit.id);
          else if (buyRod(profile, hit.id)) audio.coin();
        } else {
          if (profile.ownedBoats.includes(hit.id)) equipBoat(profile, hit.id);
          else if (buyBoat(profile, hit.id)) audio.coin();
        }
        saveProfile(profile);
        return;
      }
    }
    closeOverlay();
    return;
  }
  if (state.screen === 'map') {
    for (const hit of mapHitRects(profile)) {
      if (pointer.x < hit.rect.x || pointer.x > hit.rect.x + hit.rect.w || pointer.y < hit.rect.y || pointer.y > hit.rect.y + hit.rect.h) continue;
      if (hit.kind === 'close') {
        closeOverlay();
        return;
      }
      if (hit.kind === 'travel') {
        profile.island = hit.id;
        saveProfile(profile);
        audio.travel();
        showMessage(`Sailed to ${islandById(hit.id).name}.`);
        closeOverlay();
        return;
      }
    }
    closeOverlay();
    return;
  }
  if (state.screen === 'fishdex') {
    for (const hit of fishdexHitRects()) {
      if (pointer.x < hit.rect.x || pointer.x > hit.rect.x + hit.rect.w || pointer.y < hit.rect.y || pointer.y > hit.rect.y + hit.rect.h) continue;
      if (hit.kind === 'close') {
        closeOverlay();
        return;
      }
      if (hit.kind === 'fish') {
        state.selectedFish = hit.id;
        audio.click();
        return;
      }
    }
    closeOverlay();
  }
}

function handleActions() {
  const actions = input.takeActions();
  if (actions & ACTION_CONFIRM) handleConfirm();
  if (actions & ACTION_PAUSE) {
    if (state.screen === 'fishing') {
      state.screen = 'paused';
    } else if (state.screen === 'paused') {
      state.screen = 'fishing';
    } else if (state.screen === 'shop' || state.screen === 'map' || state.screen === 'fishdex') {
      closeOverlay();
    }
  }
  if (actions & ACTION_SHOP) {
    if (state.screen === 'fishing') openOverlay('shop');
    else if (state.screen === 'shop') closeOverlay();
  }
  if (actions & ACTION_MAP) {
    if (state.screen === 'fishing') openOverlay('map');
    else if (state.screen === 'map') closeOverlay();
  }
  if (actions & ACTION_FISHDEX) {
    if (state.screen === 'fishing') openOverlay('fishdex');
    else if (state.screen === 'fishdex') closeOverlay();
  }
  if (actions & ACTION_RESTART) {
    if (state.screen === 'win') {
      state.screen = 'fishing';
      fishing.reset();
    } else if (state.screen === 'fishing') {
      fishing.reset();
    }
  }
}

function stepWorld(dt) {
  state.time += dt;
  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) state.message = '';
  }
  for (let i = state.particles.length - 1; i >= 0; i -= 1) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
    p.life -= dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  if (state.screen !== 'fishing') return;
  if (tickGoldenHour(goldenHour, dt, profile.boat === 'yacht')) {
    audio.goldenHour();
    showMessage('GOLDEN HOUR — rare odds doubled for 60 seconds!', 4);
  }
  const events = fishing.step(dt, input.isReeling(), equippedRod(profile), profile.island, luckOf(), goldenHour.active);
  if (events & EVENT_BITE) {
    audio.bite();
    splashAt(fishing.state.bobberX, fishing.state.bobberY, '#ffffff');
  }
  if (events & EVENT_REEL_TICK) audio.reelTick();
  if (events & EVENT_SNAPPED) {
    audio.snap();
    showMessage(fishing.state.message, 3);
  }
  if (events & EVENT_ESCAPED) {
    audio.escape();
    showMessage(fishing.state.message, 3);
  }
  if (events & EVENT_CAUGHT) {
    const fish = fishing.state.fish;
    state.catchFish = fish;
    state.screen = 'catch';
    audio.fanfare(fish.tier);
    burst(fishing.state.bobberX, fishing.state.bobberY, '#ffd60a', 24, 160);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const last = frame.last ?? now;
  frame.last = now;
  const elapsed = Math.min((now - last) / 1000, MAX_FRAME);
  handleActions();
  let accumulator = frame.accumulator ?? 0;
  accumulator += elapsed;
  while (accumulator >= STEP) {
    stepWorld(STEP);
    accumulator -= STEP;
  }
  frame.accumulator = accumulator;
  renderer.draw(state);
}

function runShot(name) {
  // A staged scene shows a richer game than a fresh profile: some coins, better
  // gear, a further island and a few fish already in the log.
  if (name !== 'title') {
    profile.coins = 1240;
    profile.rod = 'carbon';
    profile.ownedRods = ['bamboo', 'fiberglass', 'carbon'];
    profile.boat = 'sailboat';
    profile.ownedBoats = ['rowboat', 'sailboat'];
    profile.island = 'coral';
    profile.caught = {
      'sunny-minnow': { weight: 0.3, coins: 8 },
      'striped-perch': { weight: 0.9, coins: 12 },
      'blue-gill': { weight: 1.1, coins: 28 },
      'golden-carp': { weight: 2.4, coins: 95 },
      'reef-clownfish': { weight: 0.2, coins: 10 },
      'azure-tang': { weight: 0.8, coins: 33 },
    };
  }
  const staged = stageShot(name, {
    random,
    fishing,
    profile,
    rod: equippedRod(profile),
    luck: luckOf(),
    goldenHour,
  });
  state.screen = staged.screen;
  if (staged.screen === 'catch') state.catchFish = fishing.state.fish;
  state.time = 12;
  let painted = 0;
  function paint() {
    renderer.draw(state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

if (shot) runShot(shot);
else requestAnimationFrame(frame);
