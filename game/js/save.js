// The player's profile: coins, gear, island, collection and best catches, kept
// in localStorage between visits (this browser only; a fresh profile when it is off).

import { SAVE_KEY } from './config.js';

/** A fresh profile for a new angler. */
export function freshProfile() {
  return {
    coins: 0,
    rod: 'bamboo',
    boat: 'rowboat',
    ownedRods: ['bamboo'],
    ownedBoats: ['rowboat'],
    island: 'sunny',
    caught: {},
    catches: [],
    totalCasts: 0,
    totalCaught: 0,
    divineCaught: false,
    bestScore: 0,
  };
}

/** Load the saved profile, or a fresh one when there is none or it is broken. */
export function loadProfile() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (raw === null) return freshProfile();
    const saved = JSON.parse(raw);
    const profile = freshProfile();
    return { ...profile, ...saved, caught: saved.caught ?? {}, catches: saved.catches ?? [] };
  } catch {
    return freshProfile();
  }
}

/** Save the profile; a storage failure keeps the game running in memory only. */
export function saveProfile(profile) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
  } catch {
    // Storage can be off (private windows): progress then lasts this visit only.
  }
}

/** Record a catch: coins, collection, best catches and the win flags. */
export function recordCatch(profile, fish) {
  profile.coins += fish.coins;
  profile.totalCaught += 1;
  profile.catches.push({ id: fish.id, name: fish.name, tier: fish.tier, weight: fish.weight, coins: fish.coins, island: fish.island });
  if (profile.catches.length > 200) profile.catches.splice(0, profile.catches.length - 200);
  const best = profile.caught[fish.id];
  if (!best || fish.weight > best.weight) profile.caught[fish.id] = { weight: fish.weight, coins: fish.coins };
  if (fish.tier === 'divine') profile.divineCaught = true;
  profile.bestScore = Math.max(profile.bestScore, profile.coins);
  saveProfile(profile);
}
