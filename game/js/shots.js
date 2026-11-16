// The screenshot scenes: each `shot` URL param stages a real game state with
// the real scene and render code (no mockups), deterministically with &seed=1.
// main.js renders the staged scene and sets window.__shotReady.

import { ZONES } from './config.js';
import { fishOfTier } from './fish.js';
import { PHASE_REELING } from './fishing.js';
import { rodById } from './shop.js';

function zoneName(id) {
  const zone = ZONES.find((entry) => entry.id === id);
  return zone ? zone.name : id;
}

/** The demo profile the shots stage with: coins, a carbon rod, a few catches. */
function demoProfile(profile) {
  profile.coins = 1240;
  profile.bestScore = 1240;
  profile.level = 3;
  profile.xp = 40;
  profile.rod = 'carbon';
  profile.ownedRods = ['bamboo', 'fiberglass', 'carbon'];
  profile.caught = {
    'sunny-minnow': 2, 'striped-perch': 1, 'blue-gill': 1,
    'reef-clownfish': 1, 'coral-dragon': 1, 'golden-carp': 1,
  };
  profile.catches = [{ id: 'coral-dragon', name: 'Coral Dragon', tier: 'legendary', weight: 8, coins: 1150, zone: 'coral' }];
  profile.outfit = { hat: null, top: 'green-shirt', shoes: null, accessory: null };
  profile.ownedClothes = ['green-shirt'];
}

// ---------------------------------------------------------------------------
// Self-export of a staged shot as a real 1280x720 JPEG file.
//
// The screenshot taker cannot save a viewport screenshot, so the game exports
// its own shot: the WebGL canvas (preserveDrawingBuffer is on, see main.js)
// is drawn into an offscreen 2D canvas, and the DOM HUD/panels are rasterized
// on top via an SVG <foreignObject> with the game's CSS inlined, then the
// composite is downloaded as a JPEG. The foreignObject re-lays the DOM out
// at exactly 1280x720, so the HUD in the JPEG sits exactly where it sits on
// a real 1280x720 screen; the WebGL canvas is also exactly 1280x720 in shot
// mode, so the two layers line up pixel-for-pixel with no scaling.
// ---------------------------------------------------------------------------

/** Download filename per shot (the cover is first by name). */
const SHOT_FILES = { catch: '1-catch.jpg', title: '2-title.jpg', play: '3-play.jpg', shop: '4-shop.jpg' };

const SHOT_W = 1280;
const SHOT_H = 720;

/** Escape text for embedding inside an XML document. */
function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** The game's own stylesheet text, fetched same-origin. */
async function fetchCssText() {
  const url = new URL('css/style.css', document.baseURI);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`shot export: CSS fetch failed (${response.status})`);
  return response.text();
}

/**
 * Clone the visible HUD and panels into a fresh 1280x720 wrapper. The clone
 * is never attached to the live document: it is only serialized into the SVG,
 * where the inlined CSS lays it out again at exactly 1280x720. Inline styles
 * (XP bar, tension fill, catch-title colour) survive cloneNode, so the staged
 * values are preserved.
 */
function buildHudClone() {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('style', `position:relative;width:${SHOT_W}px;height:${SHOT_H}px;overflow:hidden;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#f8f9fa;`);
  const hud = document.getElementById('hud');
  if (hud && !hud.classList.contains('hidden')) wrapper.appendChild(hud.cloneNode(true));
  for (const id of ['title-screen', 'catch-panel', 'shop-panel', 'map-panel', 'dex-panel', 'win-panel', 'pause-panel']) {
    const el = document.getElementById(id);
    if (el && !el.classList.contains('hidden')) wrapper.appendChild(el.cloneNode(true));
  }
  return wrapper;
}

/** Rasterize the HUD clone to an Image by way of an SVG foreignObject. */
async function rasterizeHud() {
  const cssText = await fetchCssText();
  const wrapper = buildHudClone();
  const hudXml = new XMLSerializer().serializeToString(wrapper);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SHOT_W}" height="${SHOT_H}" viewBox="0 0 ${SHOT_W} ${SHOT_H}"><style>${escapeXml(cssText)}</style><foreignObject x="0" y="0" width="${SHOT_W}" height="${SHOT_H}">${hudXml}</foreignObject></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('shot export: HUD SVG failed to load as an image'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Composite the staged scene and the HUD into one 1280x720 JPEG and trigger
 * its download. Resolves after the download has been triggered; rejects (and
 * logs) on any failure so the caller can keep window.__shotReady false.
 */
export async function exportShot(name, game) {
  const file = SHOT_FILES[name] ?? 'shot.jpg';
  // Fresh render right before the readback, so the buffer is current.
  game.renderer.render(game.scene, game.camera);
  const hudImage = await rasterizeHud();
  const out = document.createElement('canvas');
  out.width = SHOT_W;
  out.height = SHOT_H;
  const ctx = out.getContext('2d');
  ctx.drawImage(game.renderer.domElement, 0, 0, SHOT_W, SHOT_H);
  ctx.drawImage(hudImage, 0, 0, SHOT_W, SHOT_H);
  const dataUrl = out.toDataURL('image/jpeg', 0.85);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = file;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function stageShot(name, game, rng) {
  void rng;
  demoProfile(game.profile);
  game.rod = rodById('carbon');
  game.angler.setOutfit(game.profile.outfit);
  game.screen = 'play';
  game.ui.hideAllPanels();
  game.ui.hideTitle();

  if (name === 'title') {
    // Front view of the chibi on the beach, village and island behind.
    game.placePlayer(0, 24, 0);
    game.frameCamera(0, 3.4, 34.5, 0, 1.6, 24);
    game.ui.showTitle(game.profile.bestScore, 24);
    return;
  }

  if (name === 'play') {
    // Third-person view behind the chibi at the dock, mid-reel.
    const dock = game.world.dockEnd;
    game.placePlayer(dock.x + 1.2, dock.z + 1.2, -Math.PI / 4);
    const fish = fishOfTier('coral', 'epic');
    const session = game.fishing.state;
    session.phase = PHASE_REELING;
    session.fish = { ...fish, zoneName: zoneName('coral') };
    session.distanceTotal = 150;
    session.distance = 68;
    session.tension = 62;
    session.fighting = true;
    session.bobber = {
      x: game.player.x + Math.sin(game.player.facing) * 6.5,
      y: 0.7,
      z: game.player.z + Math.cos(game.player.facing) * 6.5,
    };
    game.showFishingGear(true);
    game.cameraOrbit.yaw = Math.PI * 0.75;
    game.cameraOrbit.pitch = 0.34;
    game.cameraOrbit.dist = 9.5;
    game.updateCamera();
    game.zone = 'sunny';
    game.ui.updateHUD(game.hudState());
    game.ui.setTension(true, 62, 0.55);
    game.ui.setPrompt('Hold SPACE to reel!');
    return;
  }

  if (name === 'catch') {
    // Legendary catch reveal over the 3D scene at the dock.
    const dock = game.world.dockEnd;
    game.placePlayer(dock.x + 1.2, dock.z + 1.2, Math.PI * 0.15);
    const fish = fishOfTier('coral', 'legendary');
    game.frameCamera(dock.x + 7, 3.6, dock.z + 8, dock.x, 1.5, dock.z);
    game.ui.updateHUD(game.hudState());
    game.ui.showCatch({ ...fish, zoneName: zoneName('coral') }, false);
    return;
  }

  if (name === 'shop') {
    // Customization shop open, chibi wearing a straw hat and angel wings.
    game.profile.outfit = { hat: 'straw-hat', top: 'red-shirt', shoes: 'sneakers', accessory: 'angel-wings' };
    game.profile.ownedClothes = ['green-shirt', 'straw-hat', 'red-shirt', 'sneakers', 'angel-wings'];
    game.angler.setOutfit(game.profile.outfit);
    game.placePlayer(-2, 22, 0.25);
    game.frameCamera(2.5, 3.0, 33, 2.5, 1.5, 22);
    game.ui.updateHUD(game.hudState());
    game.ui.showShop(game.profile, 'hat');
    return;
  }

  // Unknown shot: fall back to the title.
  game.placePlayer(0, 24, 0);
  game.frameCamera(0, 3.4, 34.5, 0, 1.6, 24);
  game.ui.showTitle(game.profile.bestScore, 24);
}
