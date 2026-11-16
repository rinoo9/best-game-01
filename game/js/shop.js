// The shops: rods and the clothing catalog. Buying always equips the item at
// once, so the chibi visibly changes the moment coins are spent.

import { CLOTHES, RODS } from './config.js';
import { saveProfile } from './save.js';

/** All clothing of one slot, in catalog order. */
export function clothesBySlot(slot) {
  return CLOTHES.filter((item) => item.slot === slot);
}

/** A clothing item by id, or null. */
export function clothesById(id) {
  return CLOTHES.find((item) => item.id === id) ?? null;
}

/** Whether the profile owns a clothing item. */
export function ownsClothes(profile, itemId) {
  return profile.ownedClothes.includes(itemId);
}

/** Whether a clothing item is the one equipped in its slot. */
export function isEquipped(profile, itemId) {
  const item = clothesById(itemId);
  return item !== null && profile.outfit[item.slot] === itemId;
}

/** Buy a clothing item: deducts coins, owns it and equips it. Returns true when bought. */
export function buyClothes(profile, itemId) {
  const item = clothesById(itemId);
  if (!item || ownsClothes(profile, itemId) || profile.coins < item.price) return false;
  profile.coins -= item.price;
  profile.ownedClothes.push(itemId);
  profile.outfit[item.slot] = itemId;
  saveProfile(profile);
  return true;
}

/** Equip an owned clothing item. Returns true when equipped. */
export function equipClothes(profile, itemId) {
  const item = clothesById(itemId);
  if (!item || !ownsClothes(profile, itemId)) return false;
  profile.outfit[item.slot] = itemId;
  saveProfile(profile);
  return true;
}

/** A rod by id, or the bamboo rod. */
export function rodById(id) {
  return RODS.find((rod) => rod.id === id) ?? RODS[0];
}

/** The rod the profile has equipped. */
export function equippedRod(profile) {
  return rodById(profile.rod);
}

/** Buy a rod: deducts coins, owns it and equips it. Returns true when bought. */
export function buyRod(profile, rodId) {
  const rod = rodById(rodId);
  if (!rod || profile.ownedRods.includes(rodId) || profile.coins < rod.price) return false;
  profile.coins -= rod.price;
  profile.ownedRods.push(rodId);
  profile.rod = rodId;
  saveProfile(profile);
  return true;
}

/** Equip an owned rod. Returns true when equipped. */
export function equipRod(profile, rodId) {
  if (!profile.ownedRods.includes(rodId)) return false;
  profile.rod = rodId;
  saveProfile(profile);
  return true;
}
