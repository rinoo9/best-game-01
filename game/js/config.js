// Every tuning number, colour and data table in one place. The 3D world is one
// walkable island, about 110 units across, split into four fishing zones by
// quadrant: Sunny Beach (south-west), Coral Reef (south-east), Misty Lagoon
// (north-west) and Ember Volcano (north-east). A zone is where the player
// stands; its fish table is what bites there.

export const WORLD = { radius: 55, waterY: 0.4, volcanoX: 30, volcanoZ: -30 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** Where the profile is kept between visits (this browser only). */
export const SAVE_KEY = 'reel-legends-3d.save.v1';

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

/** Fishing zones: palette, fish table and signature legendary. */
export const ZONES = [
  {
    id: 'sunny', name: 'Sunny Beach', center: [-28, 28],
    blurb: 'Warm shallows where every angler begins.',
    sky: 0x7ec8f7, grass: 0x58c96b, sand: 0xf2d492, water: 0x2fa8c9, accent: 0xffb020,
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
    id: 'coral', name: 'Coral Reef', center: [28, 28],
    blurb: 'A bright reef buzzing with colour.',
    sky: 0x5ec8e8, grass: 0x2fbf8f, sand: 0xf6e27a, water: 0x1fb6a6, accent: 0xff6b9d,
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
    id: 'misty', name: 'Misty Lagoon', center: [-28, -28],
    blurb: 'Fog on the water, glow beneath it.',
    sky: 0x9aa7c7, grass: 0x6a994e, sand: 0xb8c0cc, water: 0x3d5a80, accent: 0x80ed99,
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
    id: 'ember', name: 'Ember Volcano', center: [28, -28],
    blurb: 'Black sand, hot springs, and the rarest fish alive.',
    sky: 0xf4845f, grass: 0x8a5a3b, sand: 0x4a4e69, water: 0xc1440e, accent: 0xff5400,
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
export const ALL_FISH = ZONES.flatMap((zone) => zone.fish.map((fish) => ({ ...fish, zone: zone.id, zoneName: zone.name })));

/** Golden hour: how often it starts (seconds of play) and how long it lasts. */
export const GOLDEN_HOUR = { everySeconds: 210, durationSeconds: 60 };

/** The clothing and accessory shop: every item is a procedural 3D attachment
 *  on the chibi angler. `slot` is hat, top, shoes or accessory. */
export const CLOTHES = [
  { id: 'straw-hat', name: 'Straw Hat', slot: 'hat', price: 100, color: '#e9c46a', blurb: 'Sunny and honest.' },
  { id: 'cap', name: 'Lucky Cap', slot: 'hat', price: 150, color: '#4361ee', blurb: 'Worn backwards, obviously.' },
  { id: 'pirate-hat', name: 'Pirate Hat', slot: 'hat', price: 800, color: '#212529', blurb: 'For the seven seas and one lagoon.' },
  { id: 'wizard-hat', name: 'Wizard Hat', slot: 'hat', price: 500, color: '#7209b7', blurb: 'It knows where the fish are.' },
  { id: 'crown', name: 'Golden Crown', slot: 'hat', price: 2000, color: '#ffd60a', blurb: 'Royalty fishes here.' },
  { id: 'green-shirt', name: 'Green Shirt', slot: 'top', price: 0, color: '#58c96b', blurb: 'Your trusty first shirt.' },
  { id: 'red-shirt', name: 'Red Shirt', slot: 'top', price: 120, color: '#e63946', blurb: 'Bold. The fish can tell.' },
  { id: 'blue-shirt', name: 'Blue Shirt', slot: 'top', price: 120, color: '#3fa9f5', blurb: 'Matches the lagoon.' },
  { id: 'golden-shirt', name: 'Golden Shirt', slot: 'top', price: 600, color: '#ffb020', blurb: 'Shines like a catch.' },
  { id: 'sandals', name: 'Sandals', slot: 'shoes', price: 80, color: '#b08968', blurb: 'Beach-ready.' },
  { id: 'sneakers', name: 'Sneakers', slot: 'shoes', price: 200, color: '#f8f9fa', blurb: 'For running to the next bite.' },
  { id: 'boots', name: 'Explorer Boots', slot: 'shoes', price: 400, color: '#6c4a2f', blurb: 'Volcano-proof, probably.' },
  { id: 'angel-wings', name: 'Angel Wings', slot: 'accessory', price: 1500, color: '#ffffff', blurb: 'Soft, glowing, slightly smug.' },
  { id: 'backpack', name: 'Explorer Pack', slot: 'accessory', price: 300, color: '#8a5a3b', blurb: 'Holds snacks and spare hooks.' },
  { id: 'sunglasses', name: 'Cool Shades', slot: 'accessory', price: 250, color: '#212529', blurb: 'The sun never stood a chance.' },
  { id: 'cape', name: 'Hero Cape', slot: 'accessory', price: 700, color: '#b26bff', blurb: 'Flaps dramatically in the wind.' },
];

/** XP needed to reach the next level (level starts at 1). */
export function xpForLevel(level) {
  return 100 + (level - 1) * 80;
}

/** HUD palette and font (system fonts only — no network). */
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
