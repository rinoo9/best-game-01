// Every tuning number, colour and data table in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below
// depends on the screen size.

export const FIELD = { width: 1280, height: 720, waterY: 430, horizonY: 300 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Where the best score and the collection are kept between visits (this browser only). */
export const SAVE_KEY = 'reel-legends.save.v1';

/** Rarity tiers: the label, the 1-in-N odds the catch reveal shows, the glow colour,
 *  the coin range a catch of the tier pays, and the fight the fish puts up. */
export const TIERS = {
  common:    { name: 'Common',    odds: 2,        color: '#9aa5b1', glow: '#7d8894', coins: [5, 15],    fight: 1.0, distance: 60 },
  uncommon:  { name: 'Uncommon',  odds: 5,        color: '#58c96b', glow: '#2f9e44', coins: [20, 40],   fight: 1.3, distance: 80 },
  rare:      { name: 'Rare',      odds: 20,       color: '#3fa9f5', glow: '#1971c2', coins: [60, 120],  fight: 1.7, distance: 110 },
  epic:      { name: 'Epic',      odds: 100,      color: '#b26bff', glow: '#7b2fbe', coins: [200, 400], fight: 2.2, distance: 150 },
  legendary: { name: 'Legendary', odds: 1000,     color: '#ffb020', glow: '#e8890c', coins: [800, 1500], fight: 2.8, distance: 220 },
  mythic:    { name: 'Mythic',    odds: 10000,    color: '#ff4d8d', glow: '#c2255c', coins: [3000, 6000], fight: 3.5, distance: 300 },
  divine:    { name: 'Divine',    odds: 1000000,  color: '#ffe066', glow: '#fab005', coins: [50000, 50000], fight: 4.5, distance: 500 },
};

/** Rods: each improves cast distance, line strength (less tension) and luck (rarer rolls). */
export const RODS = [
  { id: 'bamboo',     name: 'Bamboo Rod',     price: 0,    cast: 1.0, strength: 1.0, luck: 1.0, blurb: 'A trusty stick. It catches fish.' },
  { id: 'fiberglass', name: 'Fiberglass Rod', price: 150,  cast: 1.2, strength: 1.3, luck: 1.2, blurb: 'Lighter, springier, luckier.' },
  { id: 'carbon',     name: 'Carbon Rod',     price: 600,  cast: 1.5, strength: 1.6, luck: 1.5, blurb: 'Stiff, fast and kind to rare fish.' },
  { id: 'titan',      name: 'Titan Rod',      price: 2000, cast: 1.8, strength: 2.0, luck: 2.0, blurb: 'A rod that has seen legends.' },
  { id: 'celestial',  name: 'Celestial Rod',  price: 8000, cast: 2.2, strength: 2.5, luck: 3.0, blurb: 'Strung with starlight. The Divine can feel it.' },
];

/** Boats: each unlocks a further island (the Yacht also doubles golden hour). */
export const BOATS = [
  { id: 'rowboat',   name: 'Rowboat',   price: 0,     unlocks: 'coral', speed: 1.0, blurb: 'Slow, steady, yours from the start.' },
  { id: 'sailboat',  name: 'Sailboat',  price: 800,   unlocks: 'misty', speed: 1.6, blurb: 'Catches the wind to Misty Lagoon.' },
  { id: 'speedboat', name: 'Speedboat', price: 2500,  unlocks: 'ember', speed: 2.4, blurb: 'Roars across the waves to Ember Isle.' },
  { id: 'yacht',     name: 'Yacht',     price: 10000, unlocks: null,   speed: 3.0, blurb: 'Golden hour lasts twice as long aboard.' },
];

/** Islands: palette, required boat, fish table and signature legendary. */
export const ISLANDS = [
  {
    id: 'sunny', name: 'Sunny Shore', boat: null, unlockText: 'Home waters',
    blurb: 'Warm shallows where every angler begins.',
    sky: ['#7ec8f7', '#cfeefc'], water: ['#2fa8c9', '#0d6e8f'], sand: '#f2d492', accent: '#ffb020',
    fish: [
      { id: 'sunny-minnow', name: 'Sunny Minnow', tier: 'common', weight: [0.1, 0.4], body: '#ffd166', belly: '#fff3c4' },
      { id: 'striped-perch', name: 'Striped Perch', tier: 'common', weight: [0.3, 1.2], body: '#8ecae6', belly: '#e0fbfc' },
      { id: 'blue-gill', name: 'Blue Gill', tier: 'uncommon', weight: [0.4, 1.5], body: '#4361ee', belly: '#90e0ef' },
      { id: 'coral-guppy', name: 'Coral Guppy', tier: 'uncommon', weight: [0.1, 0.5], body: '#ff6b9d', belly: '#ffc2d4' },
      { id: 'golden-carp', name: 'Golden Carp', tier: 'rare', weight: [1.0, 4.0], body: '#f4a900', belly: '#ffe066' },
      { id: 'sunfish-king', name: 'Sunfish King', tier: 'legendary', weight: [3.0, 9.0], body: '#ff8500', belly: '#ffd166', signature: true },
    ],
  },
  {
    id: 'coral', name: 'Coral Reef', boat: 'rowboat', unlockText: 'Needs a Rowboat',
    blurb: 'A bright reef buzzing with colour.',
    sky: ['#5ec8e8', '#b8f0e0'], water: ['#1fb6a6', '#0a7d74'], sand: '#f6e27a', accent: '#ff6b9d',
    fish: [
      { id: 'reef-clownfish', name: 'Reef Clownfish', tier: 'common', weight: [0.1, 0.3], body: '#ff7b00', belly: '#ffffff' },
      { id: 'pink-anemonefish', name: 'Pink Anemonefish', tier: 'uncommon', weight: [0.1, 0.4], body: '#ff8fab', belly: '#ffe5ec' },
      { id: 'azure-tang', name: 'Azure Tang', tier: 'uncommon', weight: [0.3, 1.0], body: '#219ebc', belly: '#8ecae6' },
      { id: 'reef-shark-pup', name: 'Reef Shark Pup', tier: 'rare', weight: [2.0, 6.0], body: '#6c757d', belly: '#dee2e6' },
      { id: 'jewel-eel', name: 'Jewel Eel', tier: 'epic', weight: [1.0, 3.5], body: '#7209b7', belly: '#b5179e' },
      { id: 'coral-dragon', name: 'Coral Dragon', tier: 'legendary', weight: [4.0, 12.0], body: '#e63946', belly: '#ffb703', signature: true },
    ],
  },
  {
    id: 'misty', name: 'Misty Lagoon', boat: 'sailboat', unlockText: 'Needs a Sailboat',
    blurb: 'Fog on the water, glow beneath it.',
    sky: ['#9aa7c7', '#d9dee9'], water: ['#3d5a80', '#1d3557'], sand: '#b8c0cc', accent: '#80ed99',
    fish: [
      { id: 'fog-carp', name: 'Fog Carp', tier: 'common', weight: [0.5, 2.0], body: '#adb5bd', belly: '#e9ecef' },
      { id: 'glow-tadpole', name: 'Glow Tadpole', tier: 'uncommon', weight: [0.1, 0.3], body: '#80ed99', belly: '#d8f3dc' },
      { id: 'silver-catfish', name: 'Silver Catfish', tier: 'uncommon', weight: [1.0, 4.0], body: '#c0c8d8', belly: '#f8f9fa' },
      { id: 'mist-eel', name: 'Mist Eel', tier: 'rare', weight: [1.5, 5.0], body: '#7b8ba0', belly: '#a8dadc' },
      { id: 'lanternfish', name: 'Lanternfish', tier: 'epic', weight: [0.5, 2.0], body: '#ffd60a', belly: '#fff3b0' },
      { id: 'mist-serpent', name: 'Mist Serpent', tier: 'legendary', weight: [5.0, 15.0], body: '#4cc9f0', belly: '#bde0fe', signature: true },
    ],
  },
  {
    id: 'ember', name: 'Ember Isle', boat: 'speedboat', unlockText: 'Needs a Speedboat',
    blurb: 'Black sand, hot springs, and the rarest fish alive.',
    sky: ['#f4845f', '#ffd6a5'], water: ['#c1440e', '#7f1d1d'], sand: '#4a4e69', accent: '#ff5400',
    fish: [
      { id: 'ember-minnow', name: 'Ember Minnow', tier: 'common', weight: [0.1, 0.4], body: '#e85d04', belly: '#ffba08' },
      { id: 'lava-guppy', name: 'Lava Guppy', tier: 'uncommon', weight: [0.1, 0.5], body: '#dc2f02', belly: '#ff8500' },
      { id: 'ash-trout', name: 'Ash Trout', tier: 'uncommon', weight: [0.5, 2.0], body: '#6c757d', belly: '#ff9e00' },
      { id: 'magma-koi', name: 'Magma Koi', tier: 'rare', weight: [1.0, 4.0], body: '#ff4800', belly: '#ffd60a' },
      { id: 'phoenix-ray', name: 'Phoenix Ray', tier: 'epic', weight: [2.0, 7.0], body: '#ff006e', belly: '#ffbe0b' },
      { id: 'ember-leviathan', name: 'Ember Leviathan', tier: 'legendary', weight: [8.0, 25.0], body: '#9d0208', belly: '#ff5400', signature: true },
      { id: 'aurora-leviathan', name: 'Aurora Leviathan', tier: 'divine', weight: [20.0, 60.0], body: '#ffd700', belly: '#fff3b0', signature: true },
    ],
  },
];

/** Every fish in the game, flattened, for the Fishdex. */
export const ALL_FISH = ISLANDS.flatMap((island) => island.fish.map((fish) => ({ ...fish, island: island.id, islandName: island.name })));

/** Golden hour: how often it starts (seconds of play) and how long it lasts. */
export const GOLDEN_HOUR = { everySeconds: 210, durationSeconds: 60, yachtDurationSeconds: 120 };

export const PALETTE = {
  panel: 'rgba(12, 24, 40, 0.88)',
  panelEdge: 'rgba(255, 255, 255, 0.25)',
  text: '#f8f9fa',
  muted: '#b8c4d0',
  gold: '#ffd60a',
  danger: '#ff4d4d',
  button: '#1b7f5e',
  buttonHover: '#25a77a',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
