// Fish rolls: which tier bites, which species of that tier, how heavy it is and
// what it pays. A tier's weight is 1 over its 1-in-N odds, boosted by the rod's
// luck and doubled for rare tiers during golden hour.

import { ALL_FISH, TIERS, ZONES } from './config.js';
import { range } from './random.js';

const RARE_TIERS = ['rare', 'epic', 'legendary', 'mythic', 'divine'];

/** The roll weight of a tier: 1/odds, luck-boosted, golden hour doubling rare tiers. */
export function tierWeight(tier, luck, goldenHour) {
  let w = 1 / TIERS[tier].odds;
  if (tier !== 'common' && tier !== 'uncommon') w *= luck;
  if (goldenHour && RARE_TIERS.includes(tier)) w *= 2;
  return w;
}

/** Roll a tier for a bite, from a random function. */
export function rollTier(random, luck, goldenHour) {
  const tiers = Object.keys(TIERS);
  const weights = tiers.map((tier) => tierWeight(tier, luck, goldenHour));
  const total = weights.reduce((n, w) => n + w, 0);
  let roll = random() * total;
  for (let i = 0; i < tiers.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return tiers[i];
  }
  return 'common';
}

/** All species of a zone in a tier (falls back to the zone's whole table). */
export function speciesOfTier(zoneId, tier) {
  const zone = ZONES.find((entry) => entry.id === zoneId) ?? ZONES[0];
  const inTier = zone.fish.filter((fish) => fish.tier === tier);
  return inTier.length > 0 ? inTier : zone.fish;
}

/** Roll one catch: species, weight in kg, coins. */
export function rollCatch(random, zoneId, luck, goldenHour) {
  const tier = rollTier(random, luck, goldenHour);
  const list = speciesOfTier(zoneId, tier);
  const species = list[Math.floor(random() * list.length)];
  const [minWeight, maxWeight] = species.weight;
  const weight = Math.round(range(random, minWeight, maxWeight) * 10) / 10;
  const [minCoins, maxCoins] = TIERS[species.tier].coins;
  const coins = Math.round(range(random, minCoins, maxCoins) * (0.8 + weight / (maxWeight * 2)));
  return { ...species, tier: species.tier, weight, coins, zone: zoneId };
}

/** A fish of a given tier from a zone, for the screenshot scenes. */
export function fishOfTier(zoneId, tier) {
  const species = speciesOfTier(zoneId, tier)[0];
  const [minWeight, maxWeight] = species.weight;
  const [minCoins, maxCoins] = TIERS[species.tier].coins;
  return { ...species, tier: species.tier, weight: Math.round(((minWeight + maxWeight) / 2) * 10) / 10, coins: Math.round((minCoins + maxCoins) / 2), zone: zoneId };
}

/** Look a species up by id (for the Fishdex). */
export function fishById(id) {
  return ALL_FISH.find((fish) => fish.id === id) ?? null;
}

/** How much of the collection is caught: caught ids over every species. */
export function collectionPercent(caughtIds) {
  return Math.round((caughtIds.size / ALL_FISH.length) * 100);
}

/** The best catches, richest first, at most five. */
export function bestCatches(catches, limit = 5) {
  return [...catches].sort((a, b) => b.coins - a.coins).slice(0, limit);
}

/** XP a catch is worth, by tier. */
export function xpForCatch(fish) {
  const xp = { common: 10, uncommon: 15, rare: 30, epic: 60, legendary: 150, mythic: 400, divine: 2000 };
  return xp[fish.tier] ?? 10;
}
