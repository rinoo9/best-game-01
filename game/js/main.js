// Reel Legends 3D: the game itself. Third-person chibi angler on a low-poly
// island: walk with WASD, orbit the camera by dragging, fish at glowing spots
// (Space to cast, hook and hold to reel), buy clothes that appear on the
// character, level up, and hunt the Divine fish. ?shot=title|play|catch|shop
// stages a screenshot scene instead of starting the loop.

import * as THREE from 'three';
import { RODS, STEP, WORLD, ZONES, xpForLevel } from './config.js';
import { collectionPercent, xpForCatch } from './fish.js';
import { mulberry32 } from './random.js';
import { loadProfile, newProfile, recordCatch, saveProfile } from './save.js';
import { createWorld, groundHeight, zoneAt } from './world.js';
import { createAngler } from './character.js';
import {
  EVENT_BITE, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_REEL_TICK, EVENT_SNAPPED,
  PHASE_BITE, PHASE_IDLE, PHASE_REELING, PHASE_WAITING, createFishing,
} from './fishing.js';
import { buyClothes, buyRod, equipClothes, equipRod, equippedRod } from './shop.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createUI } from './ui.js';
import { exportShot, stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') ?? '1') || 1;
const rng = mulberry32(seed);

function zoneName(id) {
  const zone = ZONES.find((entry) => entry.id === id);
  return zone ? zone.name : id;
}

function angleLerp(from, to, t) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return from + d * t;
}

// ---- renderer, scene, camera, lights
const container = document.getElementById('scene-container');
// preserveDrawingBuffer: shot mode reads the canvas back with drawImage, so
// the buffer must survive the frame (see exportShot in shots.js).
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd8f0);
scene.fog = new THREE.Fog(0x9fd8f0, 70, 230);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);

// Shot mode stages and exports exactly 1280x720, whatever the window is:
// the renderer's drawing buffer and the canvas style are fixed at 1280x720
// with pixel ratio 1, the app (which the HUD and panels are laid out in) is
// pinned to the top-left at 1280x720, and the camera aspect matches, so the
// staged scene and the HUD composite pixel-for-pixel in exportShot.
if (shotName) {
  renderer.setPixelRatio(1);
  renderer.setSize(1280, 720, false);
  renderer.domElement.style.width = '1280px';
  renderer.domElement.style.height = '720px';
  const app = document.getElementById('app');
  app.style.position = 'absolute';
  app.style.left = '0';
  app.style.top = '0';
  app.style.width = '1280px';
  app.style.height = '720px';
  camera.aspect = 1280 / 720;
  camera.updateProjectionMatrix();
}

const hemi = new THREE.HemisphereLight(0xbfdfff, 0x3a7d44, 0.95);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xfff2cc, 1.15);
sunLight.position.set(40, 60, 20);
scene.add(sunLight);

// ---- world, character, fishing gear
const world = createWorld(scene);
const angler = createAngler();
scene.add(angler.group);

const bobberGroup = new THREE.Group();
const bobberTop = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 8), new THREE.MeshLambertMaterial({ color: 0xff4d4d }));
bobberTop.position.y = 0.1;
const bobberBottom = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
bobberBottom.position.y = -0.12;
bobberGroup.add(bobberTop, bobberBottom);
bobberGroup.visible = false;
scene.add(bobberGroup);

const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xf8f9fa, transparent: true, opacity: 0.9 }));
line.visible = false;
line.frustumCulled = false;
scene.add(line);

// ---- game state (one object, so shots.js can stage it)
const game = {
  scene,
  camera,
  renderer,
  world,
  angler,
  profile: loadProfile(),
  rod: null,
  screen: 'title',
  modal: null,
  paused: false,
  zone: 'sunny',
  goldenHour: false,
  goldenLeft: 0,
  nextGoldenAt: 150,
  playTime: 0,
  pendingWin: null,
  player: { x: -4, z: 24, facing: 0, moving: false, speed: 7 },
  cameraOrbit: { yaw: Math.PI, pitch: 0.35, dist: 9 },
  fishing: null,
  ui: null,
  audio: null,
  input: null,
  titleAngle: 0,
};
game.rod = equippedRod(game.profile);
angler.setOutfit(game.profile.outfit);

game.placePlayer = function placePlayer(x, z, facing) {
  game.player.x = x;
  game.player.z = z;
  game.player.facing = facing;
  game.angler.group.position.set(x, groundHeight(x, z), z);
  game.angler.face(facing);
};

game.frameCamera = function frameCamera(px, py, pz, tx, ty, tz) {
  camera.position.set(px, py, pz);
  camera.lookAt(tx, ty, tz);
};

game.updateCamera = function updateCamera() {
  const target = angler.group.position.clone();
  target.y += 1.6;
  const { yaw, pitch, dist } = game.cameraOrbit;
  const offset = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch) * dist,
    Math.sin(pitch) * dist,
    Math.cos(yaw) * Math.cos(pitch) * dist,
  );
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
};

game.showFishingGear = function showFishingGear(visible) {
  angler.rod.visible = visible;
  bobberGroup.visible = visible;
  line.visible = visible;
};

/** Put the bobber and the line where the fishing session says they are. */
game.positionFishingGear = function positionFishingGear() {
  const phase = game.fishing.state.phase;
  if (phase !== PHASE_WAITING && phase !== PHASE_BITE && phase !== PHASE_REELING) return;
  const t = performance.now() * 0.001;
  const b = game.fishing.state.bobber;
  bobberGroup.position.set(b.x, 0.7 + Math.sin(t * 2) * 0.06 - game.fishing.state.dip, b.z);
  const start = angler.group.position.clone();
  start.y += 2.1;
  start.x += Math.sin(game.player.facing) * 0.5;
  start.z += Math.cos(game.player.facing) * 0.5;
  const positions = lineGeo.attributes.position;
  positions.setXYZ(0, start.x, start.y, start.z);
  positions.setXYZ(1, b.x, bobberGroup.position.y, b.z);
  positions.needsUpdate = true;
};

game.hudState = function hudState() {
  return {
    profile: game.profile,
    xpNeed: xpForLevel(game.profile.level),
    zoneName: zoneName(game.zone),
    rodName: game.rod.name,
    goldenHour: game.goldenHour,
    goldenLeft: game.goldenLeft,
  };
};

game.fishing = createFishing(rng);
game.audio = createAudio();
game.input = createInput(renderer.domElement);

// ---- helpers
function nearestSpot() {
  let best = null;
  let bestDist = 5;
  for (const spot of world.spots) {
    const d = Math.hypot(game.player.x - spot.stand.x, game.player.z - spot.stand.z);
    if (d < bestDist) {
      bestDist = d;
      best = spot;
    }
  }
  return best;
}

function cleanupFishing() {
  game.fishing.reset();
  game.showFishingGear(false);
}

function resolveCatch() {
  const fish = game.fishing.state.fish;
  if (!fish) return;
  const xp = xpForCatch(fish);
  recordCatch(game.profile, fish, xp);
  game.audio.catchFanfare(fish.tier);
  while (game.profile.xp >= xpForLevel(game.profile.level)) {
    game.profile.xp -= xpForLevel(game.profile.level);
    game.profile.level += 1;
    game.audio.levelUp();
    game.ui.banner(`Level up! You are now Lv ${game.profile.level}`);
  }
  saveProfile(game.profile);
  cleanupFishing();
  const complete = collectionPercent(new Set(Object.keys(game.profile.caught))) >= 100;
  if (fish.tier === 'divine') {
    game.pendingWin = 'You caught the Divine Aurora Leviathan — the rarest fish alive!';
  } else if (complete) {
    game.pendingWin = 'Collection complete! You caught all 25 fish!';
  }
  game.modal = 'catch';
  game.ui.showCatch({ ...fish, zoneName: zoneName(fish.zone) }, fish.tier === 'divine');
}

function closePanels() {
  const was = game.modal;
  game.ui.hideAllPanels();
  game.modal = null;
  game.paused = false;
  if (was === 'catch' && game.pendingWin) {
    const text = game.pendingWin;
    game.pendingWin = null;
    game.audio.win();
    game.ui.showWin(text);
    game.modal = 'win';
  }
}

function startGame() {
  game.audio.unlock();
  game.screen = 'play';
  game.ui.hideTitle();
  game.ui.banner('Welcome to Sunny Beach! Walk to a glowing ring and press SPACE to cast.');
}

function restartGame() {
  game.profile = newProfile();
  game.rod = equippedRod(game.profile);
  angler.setOutfit(game.profile.outfit);
  game.placePlayer(-4, 24, 0);
  game.zone = 'sunny';
  game.goldenHour = false;
  game.playTime = 0;
  game.nextGoldenAt = 150;
  game.pendingWin = null;
  cleanupFishing();
  game.screen = 'title';
  game.modal = null;
  game.paused = false;
  saveProfile(game.profile);
  game.ui.showTitle(0, 0);
}

function travelTo(zoneId) {
  const spot = world.spots.find((entry) => entry.zone === zoneId);
  if (!spot) return;
  const facing = Math.atan2(spot.water.x - spot.stand.x, spot.water.z - spot.stand.z);
  game.placePlayer(spot.stand.x, spot.stand.z, facing);
  game.zone = zoneId;
  game.profile.zone = zoneId;
  saveProfile(game.profile);
  closePanels();
  game.ui.banner(`Welcome to ${zoneName(zoneId)}!`);
}

function castOrHook() {
  const phase = game.fishing.state.phase;
  if (phase === PHASE_IDLE) {
    const spot = nearestSpot();
    if (!spot) return;
    const facing = Math.atan2(spot.water.x - game.player.x, spot.water.z - game.player.z);
    game.player.facing = facing;
    angler.face(facing);
    // Aim the cast at open water: step out until the ground drops below the waterline.
    let reach = 4;
    while (reach < 14 && groundHeight(game.player.x + Math.sin(facing) * reach, game.player.z + Math.cos(facing) * reach) >= 0.9) {
      reach += 1;
    }
    game.fishing.cast({ x: game.player.x, z: game.player.z }, facing, game.rod, reach + 1.5);
    game.showFishingGear(true);
    game.audio.splash();
  } else if (phase === PHASE_BITE) {
    if (game.fishing.hook(game.rod, game.rod.luck, game.goldenHour, game.zone)) {
      game.audio.bite();
    }
  }
}

// ---- UI wiring
game.ui = createUI({
  onStart: startGame,
  onRestart: restartGame,
  onClosePanels: closePanels,
  onCatchOk: closePanels,
  onOpenShop: () => {
    if (game.screen !== 'play') return;
    game.modal = 'shop';
    game.ui.showShop(game.profile, 'hat');
  },
  onOpenMap: () => {
    if (game.screen !== 'play') return;
    game.modal = 'map';
    game.ui.showMap(game.profile);
  },
  onOpenDex: () => {
    if (game.screen !== 'play') return;
    game.modal = 'dex';
    game.ui.showFishdex(game.profile);
  },
  onPause: () => {
    if (game.screen !== 'play' || game.modal) return;
    game.modal = 'pause';
    game.paused = true;
    game.ui.showPause();
  },
  onShopTab: (tab) => game.ui.showShop(game.profile, tab),
  onBuyClothes: (id) => {
    if (buyClothes(game.profile, id)) {
      angler.setOutfit(game.profile.outfit);
      game.audio.buy();
      game.ui.renderShop(game.profile);
    }
  },
  onEquipClothes: (id) => {
    if (equipClothes(game.profile, id)) {
      angler.setOutfit(game.profile.outfit);
      game.audio.click();
      game.ui.renderShop(game.profile);
    }
  },
  onBuyRod: (id) => {
    if (buyRod(game.profile, id)) {
      game.rod = equippedRod(game.profile);
      game.audio.buy();
      game.ui.renderShop(game.profile);
    }
  },
  onEquipRod: (id) => {
    if (equipRod(game.profile, id)) {
      game.rod = equippedRod(game.profile);
      game.audio.click();
      game.ui.renderShop(game.profile);
    }
  },
  onTravel: travelTo,
});

window.addEventListener('keydown', (event) => {
  if (game.screen !== 'play' || game.modal) return;
  if (event.code === 'KeyM') game.ui.showMap(game.profile), (game.modal = 'map');
  if (event.code === 'KeyF') game.ui.showFishdex(game.profile), (game.modal = 'dex');
});

// ---- the fixed-step loop
let last = performance.now();
let accumulator = 0;

function step(dt) {
  if (game.screen === 'play' && !game.paused) game.playTime += dt;

  // Golden hour: rare odds double, the light turns gold.
  if (!game.goldenHour && game.screen === 'play' && game.playTime >= game.nextGoldenAt) {
    game.goldenHour = true;
    game.goldenLeft = 60;
    sunLight.color.set(0xffb020);
    scene.fog.color.set(0xf7c873);
    scene.background.set(0xf7c873);
    game.ui.banner('GOLDEN HOUR! Rare odds doubled for 60 seconds!');
  }
  if (game.goldenHour) {
    game.goldenLeft -= dt;
    if (game.goldenLeft <= 0) {
      game.goldenHour = false;
      game.nextGoldenAt = game.playTime + 210;
      sunLight.color.set(0xfff2cc);
      scene.fog.color.set(0x9fd8f0);
      scene.background.set(0x9fd8f0);
    }
  }

  const input = game.input.take();
  game.cameraOrbit.yaw -= input.dx * 0.005;
  game.cameraOrbit.pitch = Math.min(1.1, Math.max(0.12, game.cameraOrbit.pitch + input.dy * 0.004));

  const busy = game.screen !== 'play' || game.modal !== null || game.paused;
  if (!busy) {
    if (input.click || input.space) castOrHook();

    // Movement: WASD relative to the camera, blocked by deep water and the shore.
    const move = game.input.moveVector();
    let moving = false;
    if (move) {
      const yaw = game.cameraOrbit.yaw;
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      const rx = Math.cos(yaw);
      const rz = -Math.sin(yaw);
      const wx = fx * -move.z + rx * move.x;
      const wz = fz * -move.z + rz * move.x;
      const run = game.input.held('ShiftLeft') || game.input.held('ShiftRight');
      const speed = run ? 11 : 7;
      const nx = game.player.x + wx * speed * dt;
      const nz = game.player.z + wz * speed * dt;
      const tryMove = (x, z) => groundHeight(x, z) >= 0.9 && Math.hypot(x, z) <= 52;
      if (tryMove(nx, nz)) {
        game.player.x = nx;
        game.player.z = nz;
      } else if (tryMove(nx, game.player.z)) {
        game.player.x = nx;
      } else if (tryMove(game.player.x, nz)) {
        game.player.z = nz;
      }
      game.player.facing = angleLerp(game.player.facing, Math.atan2(wx, wz), 1 - Math.pow(0.0001, dt));
      game.player.speed = speed;
      moving = true;
    }
    game.player.moving = moving;

    // Zone tracking.
    const zone = zoneAt(game.player.x, game.player.z);
    if (zone !== game.zone) {
      game.zone = zone;
      game.profile.zone = zone;
      saveProfile(game.profile);
      game.ui.banner(`${zoneName(zone)}`);
    }

    // Fishing.
    const reeling = game.input.held('Space');
    const events = game.fishing.step(dt, reeling, game.rod);
    if (events & EVENT_BITE) game.audio.bite();
    if (events & EVENT_REEL_TICK) game.audio.reelTick();
    if (events & EVENT_SNAPPED) {
      game.audio.snap();
      game.ui.banner('The line snapped! The fish got away.');
      cleanupFishing();
    }
    if (events & EVENT_ESCAPED) {
      game.audio.escape();
      game.ui.banner('Too slow — it got away!');
      cleanupFishing();
    }
    if (events & EVENT_CAUGHT) resolveCatch();
  }

  // Character and world animation.
  const pose = game.fishing.state.phase === PHASE_REELING ? 'reel'
    : game.fishing.state.phase === PHASE_WAITING || game.fishing.state.phase === PHASE_BITE ? 'cast' : null;
  angler.group.position.set(game.player.x, groundHeight(game.player.x, game.player.z), game.player.z);
  angler.face(game.player.facing);
  angler.update(dt, game.player.moving, game.player.speed, pose);
  world.update(dt, game.playTime + performance.now() * 0.001);

  // Bobber and line follow the fishing session.
  game.positionFishingGear();
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 5) {
    step(STEP);
    accumulator -= STEP;
    steps += 1;
  }
  if (steps === 5) accumulator = 0;

  if (game.screen === 'title') {
    game.titleAngle += dt * 0.045;
    const a = game.titleAngle;
    camera.position.set(Math.sin(a) * 42, 19, Math.cos(a) * 42);
    camera.lookAt(0, 5, 8);
    angler.group.position.set(0, groundHeight(0, 24), 24);
    angler.face(Math.atan2(Math.sin(a), Math.cos(a)));
  } else {
    game.updateCamera();
  }

  // HUD: prompts and the tension bar follow the fishing session.
  if (game.screen === 'play' && !game.modal) {
    const phase = game.fishing.state.phase;
    if (phase === PHASE_IDLE) {
      game.ui.setPrompt(nearestSpot() ? 'Press SPACE to cast' : 'Walk to a glowing fishing spot to cast');
      game.ui.setTension(false, 0, 0);
    } else if (phase === PHASE_WAITING) {
      game.ui.setPrompt('Waiting for a bite…');
      game.ui.setTension(false, 0, 0);
    } else if (phase === PHASE_BITE) {
      game.ui.setPrompt('NOW! Press SPACE to hook!');
      game.ui.setTension(false, 0, 0);
    } else if (phase === PHASE_REELING) {
      game.ui.setPrompt('');
      const s = game.fishing.state;
      game.ui.setTension(true, s.tension, 1 - s.distance / s.distanceTotal);
    } else {
      game.ui.setPrompt('');
      game.ui.setTension(false, 0, 0);
    }
    game.ui.updateHUD(game.hudState());
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  if (shotName) return; // shot mode stays pinned at 1280x720
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- boot
game.placePlayer(-4, 24, 0);
if (shotName) {
  stageShot(shotName, game, rng);
  game.updateCamera();
  angler.update(0, false, 7, shotName === 'play' ? 'reel' : null);
  game.positionFishingGear();
  renderer.render(scene, camera);
  renderer.render(scene, camera);
  renderer.render(scene, camera);
  // __shotReady is set only after the JPEG download has been triggered; on
  // any export failure it stays false and the error is logged, so the shot
  // taker never collects a HUD-less or blank image.
  try {
    await exportShot(shotName, game);
    window.__shotReady = true;
  } catch (error) {
    console.error('Shot export failed:', error);
  }
} else {
  game.ui.showTitle(game.profile.bestScore, collectionPercent(new Set(Object.keys(game.profile.caught))));
  requestAnimationFrame(frame);
}
