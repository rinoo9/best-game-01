// The renderer: everything the game shows, painted on one canvas in a fixed
// 1280x720 logical area that scales to the window. The scene is the island's sky
// and water, the boat and angler, the bobber and the fish shadows below; the HUD
// and the screens (title, catch, shop, map, fishdex, pause, win) sit on top.

import { BOATS, FIELD, FONT, ISLANDS, PALETTE, RODS, TIERS } from './config.js';
import { canTravelTo, islandById, lockText } from './islands.js';
import { collectionPercent } from './fish.js';

/** The HUD buttons, in logical coordinates (shared with main.js for clicks). */
export const HUD_BUTTONS = [
  { id: 'shop', label: 'Shop (S)', x: 968, y: 14, w: 96, h: 36 },
  { id: 'map', label: 'Map (M)', x: 1070, y: 14, w: 96, h: 36 },
  { id: 'fishdex', label: 'Fishdex (F)', x: 1172, y: 14, w: 96, h: 36 },
];

const GOLDEN_TINT = 'rgba(255, 200, 60, 0.10)';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = '600') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function button(ctx, rect, label, enabled = true) {
  ctx.fillStyle = enabled ? PALETTE.button : 'rgba(120, 130, 140, 0.6)';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 5, 15, '#ffffff', 'center', '700');
}

/** A procedural fish: body, tail, fin and eye, facing left or right. */
export function drawFishShape(ctx, x, y, size, body, belly, facing = 1, glow = null) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing * size, size);
  if (glow !== null) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, 1, 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = belly;
  ctx.beginPath();
  ctx.ellipse(0.15, 0.2, 0.7, 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-0.85, 0);
  ctx.lineTo(-1.5, -0.55);
  ctx.lineTo(-1.5, 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.1, -0.5);
  ctx.lineTo(0.25, -0.95);
  ctx.lineTo(0.55, -0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#101418';
  ctx.beginPath();
  ctx.arc(0.55, -0.12, 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0.59, -0.16, 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSky(ctx, island, time) {
  const grad = ctx.createLinearGradient(0, 0, 0, FIELD.horizonY);
  grad.addColorStop(0, island.sky[0]);
  grad.addColorStop(1, island.sky[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, FIELD.width, FIELD.horizonY);
  ctx.save();
  ctx.shadowColor = 'rgba(255, 240, 180, 0.9)';
  ctx.shadowBlur = 60;
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(1080, 90, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 3; i += 1) {
    const cx = ((time * (6 + i * 3) + i * 430) % 1500) - 120;
    const cy = 70 + i * 55;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 70, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 45, cy + 6, 50, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = island.accent;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(180, FIELD.horizonY - 8, 190, 42, 0, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawWater(ctx, island, time) {
  const grad = ctx.createLinearGradient(0, FIELD.horizonY, 0, FIELD.height);
  grad.addColorStop(0, island.water[0]);
  grad.addColorStop(1, island.water[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, FIELD.horizonY, FIELD.width, FIELD.height - FIELD.horizonY);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 4; row += 1) {
    const y = FIELD.horizonY + 30 + row * 55;
    ctx.beginPath();
    for (let x = 0; x <= FIELD.width; x += 16) {
      const wave = Math.sin(x / 90 + time * (1.1 + row * 0.25) + row * 2) * 5;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  for (let i = 0; i < 24; i += 1) {
    const sx = ((i * 173 + time * 22) % 1300) - 10;
    const sy = FIELD.horizonY + 18 + ((i * 97) % 380);
    ctx.fillRect(sx, sy, 14, 2);
  }
}

function drawShadows(ctx, shadows, time) {
  ctx.fillStyle = 'rgba(8, 20, 32, 0.35)';
  for (const shadow of shadows) {
    const x = ((shadow.x + time * shadow.speed * shadow.dir) % 1400 + 1400) % 1400 - 60;
    ctx.save();
    ctx.translate(x, shadow.y);
    ctx.scale(shadow.dir, 1);
    ctx.beginPath();
    ctx.ellipse(0, 0, shadow.size, shadow.size * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBoat(ctx, boatId, time) {
  const bx = 300;
  const by = FIELD.waterY + 6;
  const bob = Math.sin(time * 1.4) * 3;
  ctx.save();
  ctx.translate(bx, by + bob);
  ctx.fillStyle = '#7a4a21';
  ctx.beginPath();
  ctx.moveTo(-110, 0);
  ctx.lineTo(110, 0);
  ctx.lineTo(84, 34);
  ctx.lineTo(-84, 34);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5c3618';
  ctx.fillRect(-110, 0, 220, 6);
  if (boatId === 'sailboat' || boatId === 'yacht') {
    ctx.fillStyle = '#8b5e34';
    ctx.fillRect(-4, -96, 8, 96);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(6, -92);
    ctx.lineTo(6, -18);
    ctx.lineTo(74, -18);
    ctx.closePath();
    ctx.fill();
  }
  if (boatId === 'speedboat') {
    ctx.fillStyle = '#d90429';
    ctx.beginPath();
    ctx.moveTo(-110, 0);
    ctx.lineTo(110, 0);
    ctx.lineTo(84, 34);
    ctx.lineTo(-84, 34);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-40, -26, 80, 26);
    ctx.fillStyle = '#22223b';
    ctx.fillRect(-32, -22, 64, 12);
  }
  if (boatId === 'yacht') {
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(-58, -34, 116, 34);
    ctx.fillStyle = '#22223b';
    ctx.fillRect(-46, -30, 92, 12);
  }
  // The angler, standing with the rod toward the bobber.
  ctx.fillStyle = '#2b2d42';
  ctx.fillRect(-14, -58, 28, 34);
  ctx.fillStyle = '#f4a261';
  ctx.beginPath();
  ctx.arc(0, -66, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e76f51';
  ctx.beginPath();
  ctx.arc(0, -66, 14, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#3a2c18';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(10, -48);
  ctx.lineTo(120, -108);
  ctx.stroke();
  ctx.restore();
}

function drawLineAndBobber(ctx, fishing, time) {
  const tipX = 420;
  const tipY = FIELD.waterY + 6 + Math.sin(time * 1.4) * 3 - 102;
  const bobX = fishing.bobberX;
  const bobY = fishing.bobberY + fishing.dip;
  ctx.strokeStyle = 'rgba(240, 240, 230, 0.85)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.quadraticCurveTo((tipX + bobX) / 2, Math.min(tipY, bobY) - 26, bobX, bobY);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let ring = 0; ring < 2; ring += 1) {
    const r = 10 + ((time * 18 + ring * 14) % 28);
    ctx.globalAlpha = 0.5 - r / 70;
    ctx.beginPath();
    ctx.ellipse(bobX, bobY + 4, r, r * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.translate(bobX, bobY);
  ctx.fillStyle = '#e63946';
  ctx.beginPath();
  ctx.arc(0, -4, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#f8f9fa';
  ctx.beginPath();
  ctx.arc(0, 4, 9, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  if (fishing.phase === 'bite') {
    text(ctx, '!', bobX, bobY - 42, 44, '#ffd60a', 'center', '900');
  }
}

function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, state) {
  const { profile, goldenHour } = state;
  const island = islandById(profile.island);
  ctx.fillStyle = 'rgba(10, 20, 34, 0.55)';
  roundRect(ctx, 12, 12, 300, 40, 10);
  ctx.fill();
  text(ctx, `Coins: ${profile.coins.toLocaleString('en-US')}`, 26, 38, 20, '#ffd60a', 'left', '800');
  text(ctx, `${island.name}  ·  Collection ${collectionPercent(new Set(Object.keys(profile.caught)))}%`, 322, 38, 17, PALETTE.text, 'left', '700');
  for (const buttonDef of HUD_BUTTONS) button(ctx, buttonDef, buttonDef.label);
  if (goldenHour.active) {
    const left = Math.max(0, Math.ceil(goldenHour.endsAt - goldenHour.time));
    ctx.fillStyle = 'rgba(255, 180, 0, 0.9)';
    roundRect(ctx, 480, 56, 320, 34, 10);
    ctx.fill();
    text(ctx, `GOLDEN HOUR ${left}s — rare odds doubled!`, 640, 79, 17, '#3a2503', 'center', '800');
  }
  if (state.message !== '') {
    ctx.fillStyle = 'rgba(10, 20, 34, 0.8)';
    const w = Math.min(720, 40 + state.message.length * 9);
    roundRect(ctx, (FIELD.width - w) / 2, 648, w, 40, 10);
    ctx.fill();
    text(ctx, state.message, FIELD.width / 2, 674, 18, PALETTE.text, 'center', '700');
  }
}

function drawTensionBar(ctx, fishing) {
  const x = 1216;
  const y = 200;
  const h = 280;
  ctx.fillStyle = 'rgba(10, 20, 34, 0.7)';
  roundRect(ctx, x - 14, y - 34, 52, h + 68, 10);
  ctx.fill();
  text(ctx, 'TENSION', x + 12, y - 14, 11, PALETTE.text, 'center', '800');
  const frac = fishing.tension / 100;
  const barH = h * frac;
  const grad = ctx.createLinearGradient(0, y + h, 0, y);
  grad.addColorStop(0, '#58c96b');
  grad.addColorStop(0.6, '#ffd60a');
  grad.addColorStop(1, '#ff4d4d');
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x, y, 24, h);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + h - barH, 24, barH);
  text(ctx, 'REEL!', x + 12, y + h + 28, 15, fishing.tension > 70 ? '#ff4d4d' : '#ffffff', 'center', '800');
  const remaining = Math.max(0, fishing.distance);
  const total = Math.max(1, fishing.distanceTotal);
  text(ctx, `${Math.round(((total - remaining) / total) * 100)}% in`, x + 12, y + h + 50, 14, PALETTE.text, 'center', '700');
}

// ---------------------------------------------------------------- screens

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  roundRect(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawTitle(ctx, state) {
  drawPanel(ctx, 290, 120, 700, 470);
  text(ctx, 'REEL LEGENDS', 640, 210, 64, '#ffd60a', 'center', '900');
  text(ctx, 'A fishing adventure across four islands', 640, 248, 20, PALETTE.text, 'center', '600');
  drawFishShape(ctx, 640, 310, 46, '#3fa9f5', '#bde0fe', 1, '#3fa9f5');
  drawFishShape(ctx, 540, 316, 26, '#ff6b9d', '#ffc2d4', -1, null);
  drawFishShape(ctx, 740, 316, 26, '#58c96b', '#d8f3dc', 1, null);
  text(ctx, 'Cast. Hook. Reel. Collect all 25 fish —', 640, 392, 18, PALETTE.text, 'center', '600');
  text(ctx, 'from Common to the Divine, 1 in 1,000,000.', 640, 418, 18, PALETTE.text, 'center', '600');
  text(ctx, 'Click or Space: cast · hook · reel (hold)      S: Shop   M: Map   F: Fishdex', 640, 470, 16, PALETTE.muted, 'center', '600');
  text(ctx, `Best coins: ${state.profile.bestScore.toLocaleString('en-US')}    Collection: ${collectionPercent(new Set(Object.keys(state.profile.caught)))}%`, 640, 502, 16, PALETTE.muted, 'center', '600');
  text(ctx, 'Press Space or click to start', 640, 556, 22, '#ffd60a', 'center', '800');
}

function drawCatch(ctx, state) {
  const fish = state.catchFish;
  if (fish === null) return;
  const tier = TIERS[fish.tier];
  ctx.fillStyle = 'rgba(6, 12, 24, 0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawPanel(ctx, 320, 110, 640, 480);
  text(ctx, fish.tier === 'divine' ? 'A DIVINE LEGEND!' : 'CAUGHT!', 640, 168, 40, tier.color, 'center', '900');
  drawFishShape(ctx, 640, 268, 92, fish.body, fish.belly, 1, tier.glow);
  text(ctx, fish.name, 640, 356, 34, PALETTE.text, 'center', '800');
  ctx.fillStyle = tier.color;
  roundRect(ctx, 540, 372, 200, 34, 17);
  ctx.fill();
  text(ctx, `${tier.name}  ·  1 in ${tier.odds.toLocaleString('en-US')}`, 640, 396, 17, '#101418', 'center', '800');
  text(ctx, `Weight: ${fish.weight} kg      +${fish.coins.toLocaleString('en-US')} coins`, 640, 444, 19, PALETTE.text, 'center', '700');
  text(ctx, `Caught at ${islandById(fish.island).name}`, 640, 472, 16, PALETTE.muted, 'center', '600');
  text(ctx, 'Press Space or click to keep fishing', 640, 540, 18, '#ffd60a', 'center', '800');
}

function shopRows(shop) {
  const list = shop.tab === 'rods' ? RODS : BOATS;
  return list.map((item, i) => ({ item, rect: { x: 200, y: 168 + i * 82, w: 880, h: 74 } }));
}

export function shopHitRects(shop) {
  const rects = [
    { kind: 'tab', id: 'rods', rect: { x: 460, y: 100, w: 120, h: 34 } },
    { kind: 'tab', id: 'boats', rect: { x: 590, y: 100, w: 120, h: 34 } },
    { kind: 'close', id: 'close', rect: { x: 1060, y: 100, w: 60, h: 36 } },
  ];
  for (const { item, rect } of shopRows(shop)) {
    rects.push({ kind: 'row', id: item.id, rect: { x: rect.x + rect.w - 170, y: rect.y + 16, w: 150, h: 42 } });
  }
  return rects;
}

function drawShop(ctx, state) {
  const { shop, profile } = state;
  drawPanel(ctx, 160, 80, 960, 560);
  text(ctx, 'Tackle Shop', 200, 120, 28, PALETTE.text, 'left', '900');
  text(ctx, `${profile.coins.toLocaleString('en-US')} coins`, 1040, 120, 22, '#ffd60a', 'right', '800');
  const tabs = [
    { id: 'rods', label: 'Rods' },
    { id: 'boats', label: 'Boats' },
  ];
  for (const tab of tabs) {
    const rect = { x: tab.id === 'rods' ? 460 : 590, y: 100, w: 120, h: 34 };
    ctx.fillStyle = shop.tab === tab.id ? PALETTE.button : 'rgba(255,255,255,0.12)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    text(ctx, tab.label, rect.x + rect.w / 2, rect.y + 23, 16, '#ffffff', 'center', '700');
  }
  button(ctx, { x: 1060, y: 100, w: 60, h: 36 }, 'Close');
  for (const { item, rect } of shopRows(shop)) {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    const isRod = shop.tab === 'rods';
    const owned = isRod ? profile.ownedRods.includes(item.id) : profile.ownedBoats.includes(item.id);
    const equipped = isRod ? profile.rod === item.id : profile.boat === item.id;
    text(ctx, item.name, rect.x + 16, rect.y + 28, 20, PALETTE.text, 'left', '800');
    const stats = isRod
      ? `Cast x${item.cast}  ·  Strength x${item.strength}  ·  Luck x${item.luck}`
      : item.unlocks
        ? `Unlocks ${islandById(item.unlocks).name}  ·  Speed x${item.speed}`
        : `Golden hour x2  ·  Speed x${item.speed}`;
    text(ctx, stats, rect.x + 16, rect.y + 54, 15, PALETTE.muted, 'left', '600');
    text(ctx, item.blurb, rect.x + 420, rect.y + 28, 14, PALETTE.muted, 'left', '600');
    const btn = { x: rect.x + rect.w - 170, y: rect.y + 16, w: 150, h: 42 };
    if (equipped) button(ctx, btn, 'EQUIPPED', false);
    else if (owned) button(ctx, btn, 'Equip');
    else button(ctx, btn, `Buy ${item.price}c`, profile.coins >= item.price);
  }
  text(ctx, 'Click a row button to buy or equip. Esc closes.', 640, 616, 15, PALETTE.muted, 'center', '600');
}

function mapCards() {
  return ISLANDS.map((island, i) => ({ island, rect: { x: 140 + i * 252, y: 200, w: 236, h: 300 } }));
}

export function mapHitRects(profile) {
  const rects = [{ kind: 'close', id: 'close', rect: { x: 1060, y: 140, w: 60, h: 36 } }];
  for (const { island, rect } of mapCards()) {
    if (island.id !== profile.island && canTravelTo(island, profile.ownedBoats)) {
      rects.push({ kind: 'travel', id: island.id, rect: { x: rect.x + 20, y: rect.y + 248, w: 196, h: 36 } });
    }
  }
  return rects;
}

function drawMap(ctx, state) {
  const { profile } = state;
  drawPanel(ctx, 120, 120, 1040, 480);
  text(ctx, 'Island Map', 160, 168, 30, PALETTE.text, 'left', '900');
  button(ctx, { x: 1060, y: 140, w: 60, h: 36 }, 'Close');
  for (const { island, rect } of mapCards()) {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
    ctx.fill();
    ctx.fillStyle = island.water[0];
    roundRect(ctx, rect.x + 12, rect.y + 12, rect.w - 24, 110, 8);
    ctx.fill();
    ctx.fillStyle = island.sand;
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + 100, 70, 20, 0, Math.PI, 0);
    ctx.fill();
    text(ctx, island.name, rect.x + rect.w / 2, rect.y + 160, 20, PALETTE.text, 'center', '800');
    text(ctx, island.blurb, rect.x + rect.w / 2, rect.y + 186, 13, PALETTE.muted, 'center', '600');
    const signature = island.fish.find((fish) => fish.signature);
    text(ctx, `Legendary: ${signature.name}`, rect.x + rect.w / 2, rect.y + 210, 13, '#ffb020', 'center', '700');
    if (island.id === profile.island) {
      text(ctx, 'YOU ARE HERE', rect.x + rect.w / 2, rect.y + 268, 15, '#58c96b', 'center', '800');
    } else if (canTravelTo(island, profile.ownedBoats)) {
      button(ctx, { x: rect.x + 20, y: rect.y + 248, w: 196, h: 36 }, 'Travel');
    } else {
      text(ctx, lockText(island), rect.x + rect.w / 2, rect.y + 268, 15, '#ff4d4d', 'center', '800');
    }
  }
  text(ctx, 'Better boats reach further islands. Each island has its own fish.', 640, 560, 15, PALETTE.muted, 'center', '600');
}

function fishdexCells() {
  const cells = [];
  const all = ISLANDS.flatMap((island) => island.fish.map((fish) => ({ ...fish, island: island.id })));
  all.forEach((fish, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    cells.push({ fish, rect: { x: 160 + col * 190, y: 150 + row * 88, w: 180, h: 80 } });
  });
  return cells;
}

export function fishdexHitRects() {
  const rects = [{ kind: 'close', id: 'close', rect: { x: 1060, y: 108, w: 60, h: 36 } }];
  for (const { fish, rect } of fishdexCells()) rects.push({ kind: 'fish', id: fish.id, rect });
  return rects;
}

function drawFishdex(ctx, state) {
  const { profile, selectedFish } = state;
  drawPanel(ctx, 140, 90, 1000, 540);
  text(ctx, 'Fishdex', 180, 132, 30, PALETTE.text, 'left', '900');
  text(ctx, `${Object.keys(profile.caught).length} / 25 caught`, 960, 132, 20, '#ffd60a', 'left', '800');
  button(ctx, { x: 1060, y: 108, w: 60, h: 36 }, 'Close');
  for (const { fish, rect } of fishdexCells()) {
    const caught = profile.caught[fish.id];
    ctx.fillStyle = caught ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    if (selectedFish === fish.id) {
      ctx.strokeStyle = '#ffd60a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (caught) {
      drawFishShape(ctx, rect.x + 40, rect.y + 34, 26, fish.body, fish.belly, 1, TIERS[fish.tier].glow);
      text(ctx, fish.name, rect.x + 78, rect.y + 30, 15, PALETTE.text, 'left', '700');
      text(ctx, `${TIERS[fish.tier].name} · 1 in ${TIERS[fish.tier].odds.toLocaleString('en-US')}`, rect.x + 78, rect.y + 52, 13, TIERS[fish.tier].color, 'left', '600');
    } else {
      text(ctx, '?', rect.x + 40, rect.y + 46, 30, '#5a6b7d', 'center', '900');
      text(ctx, '???', rect.x + 78, rect.y + 30, 15, PALETTE.muted, 'left', '700');
      text(ctx, `${TIERS[fish.tier].name} · 1 in ${TIERS[fish.tier].odds.toLocaleString('en-US')}`, rect.x + 78, rect.y + 52, 13, PALETTE.muted, 'left', '600');
    }
  }
  const detail = selectedFish ? profile.caught[selectedFish] : null;
  const fish = selectedFish ? ISLANDS.flatMap((island) => island.fish.map((entry) => ({ ...entry, island: island.id }))).find((entry) => entry.id === selectedFish) : null;
  if (fish && detail) {
    text(ctx, `${fish.name} — best ${detail.weight} kg, best ${detail.coins} coins, ${islandById(fish.island).name}`, 640, 612, 16, PALETTE.text, 'center', '600');
  } else {
    text(ctx, 'Click a caught fish to see its best weight.', 640, 612, 16, PALETTE.muted, 'center', '600');
  }
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6, 12, 24, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawPanel(ctx, 440, 280, 400, 160);
  text(ctx, 'PAUSED', 640, 348, 40, PALETTE.text, 'center', '900');
  text(ctx, 'Press P or click to resume', 640, 392, 17, PALETTE.muted, 'center', '600');
}

function drawWin(ctx, state) {
  ctx.fillStyle = 'rgba(6, 12, 24, 0.6)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  drawPanel(ctx, 290, 150, 700, 420);
  text(ctx, state.winReason === 'divine' ? 'THE DIVINE IS YOURS!' : 'COLLECTION COMPLETE!', 640, 230, 44, '#ffd60a', 'center', '900');
  text(ctx, state.winReason === 'divine'
    ? 'You caught the Aurora Leviathan — a 1-in-1,000,000 legend.'
    : 'You caught every fish in Reel Legends. A true master angler.', 640, 280, 19, PALETTE.text, 'center', '600');
  text(ctx, `Coins: ${state.profile.coins.toLocaleString('en-US')}    Catches: ${state.profile.totalCaught}    Collection: ${collectionPercent(new Set(Object.keys(state.profile.caught)))}%`, 640, 330, 18, PALETTE.text, 'center', '700');
  text(ctx, 'Press Space or click to keep fishing', 640, 480, 20, '#ffd60a', 'center', '800');
}

// ---------------------------------------------------------------- entry point

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height;
  const ctx = canvas.getContext('2d');

  return {
    draw(state) {
      const island = islandById(state.profile.island);
      drawSky(ctx, island, state.time);
      drawWater(ctx, island, state.time);
      drawShadows(ctx, state.shadows, state.time);
      drawBoat(ctx, state.profile.boat, state.time);
      if (state.fishing.phase !== 'idle') drawLineAndBobber(ctx, state.fishing, state.time);
      drawParticles(ctx, state.particles);
      if (state.goldenHour.active) {
        ctx.fillStyle = GOLDEN_TINT;
        ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      }
      if (state.screen === 'title') drawTitle(ctx, state);
      if (state.screen === 'catch' && state.catchFish !== null) drawCatch(ctx, state);
      if (state.screen === 'shop') drawShop(ctx, state);
      if (state.screen === 'map') drawMap(ctx, state);
      if (state.screen === 'fishdex') drawFishdex(ctx, state);
      if (state.screen === 'paused') drawPaused(ctx);
      if (state.screen === 'win') drawWin(ctx, state);
      if (state.screen !== 'title') drawHud(ctx, state);
      if (state.fishing.phase === 'reeling') drawTensionBar(ctx, state.fishing);
    },
  };
}
