// The saved profile: coins, collection, outfit, rods, level and best score,
// kept in localStorage between visits (this browser only).

import { SAVE_KEY } from './config.js';

/** A fresh profile for a new player. */
export function newProfile() {
  return {
    coins: 0,
    bestScore: 0,
    level: 1,
    xp: 0,
    caught: {},
    catches: [],
    ownedRods: ['bamboo'],
    rod: 'bamboo',
    ownedClothes: ['green-shirt'],
    outfit: { hat: null, top: 'green-shirt', shoes: null, accessory: null },
    zone: 'sunny',
  };
}

/** Load the profile, or a fresh one when nothing is saved. */
export function loadProfile() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return newProfile();
    const saved = JSON.parse(raw);
    const fresh = newProfile();
    return { ...fresh, ...saved, caught: saved.caught ?? {}, outfit: { ...fresh.outfit, ...(saved.outfit ?? {}) } };
  } catch (error) {
    return newProfile();
  }
}

/** Save the profile; never throws (a full or blocked storage is ignored). */
export function saveProfile(profile) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch (error) {
    // Storage unavailable — the session keeps playing unsaved.
  }
}

/** Record a catch: coins, collection, best list and XP. Returns the XP gained. */
export function recordCatch(profile, fish, xp) {
  profile.coins += fish.coins;
  profile.bestScore = Math.max(profile.bestScore, profile.coins);
  profile.caught[fish.id] = (profile.caught[fish.id] ?? 0) + 1;
  profile.catches.push({ id: fish.id, name: fish.name, tier: fish.tier, weight: fish.weight, coins: fish.coins, zone: fish.zone });
  if (profile.catches.length > 50) profile.catches = profile.catches.slice(-50);
  profile.xp += xp;
  saveProfile(profile);
  return xp;
}
