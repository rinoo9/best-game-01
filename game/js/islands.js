// Islands: which one the player is on, who may travel where, and the golden hour.

import { BOATS, GOLDEN_HOUR, ISLANDS } from './config.js';

/** The island object for an id. */
export function islandById(id) {
  return ISLANDS.find((island) => island.id === id) ?? ISLANDS[0];
}

/** Whether the player's boats let them travel to an island. */
export function canTravelTo(island, ownedBoats) {
  if (island.boat === null) return true;
  const boatIndex = BOATS.findIndex((boat) => boat.id === island.boat);
  return ownedBoats.some((owned) => BOATS.findIndex((boat) => boat.id === owned) >= boatIndex);
}

/** What the map card shows when an island is locked. */
export function lockText(island) {
  if (island.boat === null) return null;
  const boat = BOATS.find((entry) => entry.id === island.boat);
  return `Needs ${boat.name}`;
}

/** Golden hour state: starts every few minutes of play, lasts a minute (two on a Yacht). */
export function createGoldenHour() {
  return { active: false, endsAt: 0, nextAt: GOLDEN_HOUR.everySeconds, time: 0 };
}

/** Advance the golden hour clock; returns true when it just started. */
export function tickGoldenHour(hour, dt, hasYacht) {
  hour.time += dt;
  if (!hour.active && hour.time >= hour.nextAt) {
    hour.active = true;
    hour.endsAt = hour.time + (hasYacht ? GOLDEN_HOUR.yachtDurationSeconds : GOLDEN_HOUR.durationSeconds);
    return true;
  }
  if (hour.active && hour.time >= hour.endsAt) {
    hour.active = false;
    hour.nextAt = hour.time + GOLDEN_HOUR.everySeconds;
  }
  return false;
}

/** Seconds of golden hour left, or 0. */
export function goldenHourLeft(hour) {
  return hour.active ? Math.max(0, Math.ceil(hour.endsAt - hour.time)) : 0;
}
