// The shop: rods and boats, their prices, and buying and equipping them.
// A rod improves cast distance, line strength and luck; a boat unlocks islands.

import { BOATS, RODS } from './config.js';

export function createShop() {
  return { tab: 'rods', selectedRod: 0, selectedBoat: 0 };
}

/** The rod a profile has equipped. */
export function equippedRod(profile) {
  return RODS.find((rod) => rod.id === profile.rod) ?? RODS[0];
}

/** The boat a profile has equipped. */
export function equippedBoat(profile) {
  return BOATS.find((boat) => boat.id === profile.boat) ?? BOATS[0];
}

/** Whether a profile owns a rod. */
export function ownsRod(profile, rodId) {
  return profile.ownedRods.includes(rodId);
}

/** Whether a profile owns a boat. */
export function ownsBoat(profile, boatId) {
  return profile.ownedBoats.includes(boatId);
}

/** Buy a rod: deducts coins, owns it and equips it. Returns true when bought. */
export function buyRod(profile, rodId) {
  const rod = RODS.find((entry) => entry.id === rodId);
  if (!rod || ownsRod(profile, rodId) || profile.coins < rod.price) return false;
  profile.coins -= rod.price;
  profile.ownedRods.push(rodId);
  profile.rod = rodId;
  return true;
}

/** Buy a boat: deducts coins, owns it and equips it. Returns true when bought. */
export function buyBoat(profile, boatId) {
  const boat = BOATS.find((entry) => entry.id === boatId);
  if (!boat || ownsBoat(profile, boatId) || profile.coins < boat.price) return false;
  profile.coins -= boat.price;
  profile.ownedBoats.push(boatId);
  profile.boat = boatId;
  return true;
}

/** Equip an owned rod. Returns true when equipped. */
export function equipRod(profile, rodId) {
  if (!ownsRod(profile, rodId)) return false;
  profile.rod = rodId;
  return true;
}

/** Equip an owned boat. Returns true when equipped. */
export function equipBoat(profile, boatId) {
  if (!ownsBoat(profile, boatId)) return false;
  profile.boat = boatId;
  return true;
}
