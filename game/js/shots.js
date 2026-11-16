// The screenshot scenes behind ?shot=title|play|catch|shop. Each one plays the real
// rules forward from a fresh session for a fixed number of steps, steered by a
// simple autopilot (hook on the bite, reel while tension is low, ease off when it
// climbs), so the frame is what a short game really looks like and the same seed
// always gives the same frame.

import { STEP } from './config.js';
import { fishOfTier } from './fish.js';
import { PHASE_BITE, PHASE_CAUGHT, PHASE_REELING, PHASE_WAITING } from './fishing.js';

const SAMPLE = STEP;
const PLAY_STEPS = 60 * 14;
const TENSION_EASE = 62;

/**
 * Stage the named scene on the game's live objects and return the screen to draw.
 * `game` holds { random, fishing, profile, rod, luck, goldenHour }.
 */
export function stageShot(name, game) {
  if (name === 'catch') {
    stageCatch(game);
    return { screen: 'catch' };
  }
  if (name === 'shop') {
    return { screen: 'shop' };
  }
  if (name !== 'play') {
    return { screen: 'title' };
  }
  return stagePlay(game);
}

/** Play forward until the line is mid-reel, then freeze there for the shot. */
function stagePlay(game) {
  const { fishing } = game;
  fishing.cast(game.rod);
  for (let i = 0; i < PLAY_STEPS; i += 1) {
    const phase = fishing.state.phase;
    if (phase === PHASE_WAITING || phase === PHASE_BITE) {
      fishing.step(SAMPLE, false, game.rod, game.profile.island, game.luck, game.goldenHour.active);
      if (fishing.state.phase === PHASE_BITE) {
        fishing.hook(game.rod, game.luck, game.goldenHour.active, game.profile.island);
      }
      continue;
    }
    if (phase === PHASE_REELING) {
      const hold = fishing.state.tension < TENSION_EASE;
      fishing.step(SAMPLE, hold, game.rod, game.profile.island, game.luck, game.goldenHour.active);
      const total = Math.max(1, fishing.state.distanceTotal);
      const done = 1 - fishing.state.distance / total;
      if (done >= 0.55) break;
      continue;
    }
    break;
  }
  return { screen: 'fishing' };
}

/** Stage a Legendary catch reveal: one real cast, bite and hook, forced to the
 *  island's Legendary tier so the reveal shows what a legendary catch looks like. */
function stageCatch(game) {
  const { fishing } = game;
  fishing.cast(game.rod);
  for (let i = 0; i < 60 * 8; i += 1) {
    const phase = fishing.state.phase;
    if (phase === PHASE_WAITING) {
      fishing.step(SAMPLE, false, game.rod, game.profile.island, game.luck, game.goldenHour.active);
      continue;
    }
    if (phase === PHASE_BITE) {
      fishing.hook(game.rod, game.luck, game.goldenHour.active, game.profile.island, 'legendary');
      continue;
    }
    if (phase === PHASE_REELING) {
      const hold = fishing.state.tension < TENSION_EASE;
      fishing.step(SAMPLE, hold, game.rod, game.profile.island, game.luck, game.goldenHour.active);
      continue;
    }
    if (phase === PHASE_CAUGHT) break;
    break;
  }
  if (fishing.state.phase !== PHASE_CAUGHT) {
    const legendary = fishOfTier(game.profile.island, 'legendary');
    fishing.state.phase = PHASE_CAUGHT;
    fishing.state.fish = legendary;
  }
}
