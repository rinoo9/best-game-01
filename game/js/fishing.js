// The fishing itself: cast, wait for a bite, hook in the window, then reel in
// while the fish fights. Tension climbs while the fish fights and while the line
// is reeled; it snaps at 100. Every step returns event flags for sounds.
// Positions are world coordinates: the bobber lands in the water in front of
// the angler, and the line runs from the rod tip to the bobber.

import { fishOfTier, rollCatch } from './fish.js';
import { range } from './random.js';

export const PHASE_IDLE = 'idle';
export const PHASE_WAITING = 'waiting';
export const PHASE_BITE = 'bite';
export const PHASE_REELING = 'reeling';
export const PHASE_CAUGHT = 'caught';
export const PHASE_SNAPPED = 'snapped';
export const PHASE_ESCAPED = 'escaped';

export const EVENT_BITE = 1;
export const EVENT_HOOKED = 2;
export const EVENT_SNAPPED = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_ESCAPED = 16;
export const EVENT_REEL_TICK = 32;

const REEL_RATE = 16;
const TENSION_FIGHT_REELING = 30;
const TENSION_CALM_REELING = 10;
const TENSION_FIGHT_IDLE = 6;
const TENSION_RELIEF = 28;
const FISH_PULL = 7;

export function createFishing(random) {
  const session = {
    phase: PHASE_IDLE,
    bobber: { x: 0, y: 0.7, z: 0 },
    dip: 0,
    waitTimer: 0,
    biteAt: 0,
    hookTimer: 0,
    hookWindow: 0.9,
    fish: null,
    distance: 0,
    distanceTotal: 0,
    tension: 0,
    fighting: false,
    fightTimer: 0,
    restTimer: 0,
    reelTimer: 0,
    message: '',
  };

  function startFight() {
    session.fighting = true;
    session.fightTimer = range(random, 0.5, 1.4);
  }

  return {
    state: session,

    /** Cast the line: the bobber lands in the water ahead of the angler.
     *  `reach` overrides the rod's cast distance (the game aims at water). */
    cast(origin, facing, rod, reach = null) {
      const distance = reach ?? (4.5 + 2.2 * rod.cast) + range(random, -0.6, 0.6);
      session.bobber.x = origin.x + Math.sin(facing) * distance;
      session.bobber.z = origin.z + Math.cos(facing) * distance;
      session.bobber.y = 0.7;
      session.phase = PHASE_WAITING;
      session.dip = 0;
      session.waitTimer = 0;
      session.biteAt = range(random, 0.9, 3.4) / Math.sqrt(rod.luck);
      session.fish = null;
      session.message = '';
      return session;
    },

    /** Try to hook during the bite window; returns true when the fish is on.
     *  `forceTier` stages a catch of that tier for the screenshot scenes only;
     *  real play never passes it. */
    hook(rod, luck, goldenHour, zoneId, forceTier = null) {
      if (session.phase !== PHASE_BITE) return false;
      session.fish = forceTier === null
        ? rollCatch(random, zoneId, luck, goldenHour)
        : fishOfTier(zoneId, forceTier);
      session.phase = PHASE_REELING;
      session.distanceTotal = tierDistance(session.fish);
      session.distance = session.distanceTotal;
      session.tension = 18;
      startFight();
      session.restTimer = 0;
      return true;
    },

    /** Advance the session one fixed step. `reeling` is whether the reel is held. */
    step(dt, reeling, rod) {
      let events = 0;
      if (session.phase === PHASE_WAITING) {
        session.waitTimer += dt;
        if (session.waitTimer >= session.biteAt) {
          session.phase = PHASE_BITE;
          session.hookTimer = 0;
          session.hookWindow = 0.9 * (1 + (rod.strength - 1) * 0.3);
          events |= EVENT_BITE;
        }
      } else if (session.phase === PHASE_BITE) {
        session.hookTimer += dt;
        session.dip = Math.sin(session.hookTimer * 18) * 0.18;
        if (session.hookTimer >= session.hookWindow) {
          session.phase = PHASE_ESCAPED;
          session.message = 'Too slow — it got away!';
          events |= EVENT_ESCAPED;
        }
      } else if (session.phase === PHASE_REELING) {
        if (session.fighting) {
          session.fightTimer -= dt;
          if (session.fightTimer <= 0) {
            session.fighting = false;
            session.restTimer = range(random, 0.8, 2.0);
          }
        } else {
          session.restTimer -= dt;
          if (session.restTimer <= 0) startFight();
        }
        const strength = session.fish ? fightOf(session.fish) : 1;
        if (reeling) {
          session.distance -= REEL_RATE * rod.cast * dt;
          session.tension += (session.fighting ? TENSION_FIGHT_REELING : TENSION_CALM_REELING) * strength * dt / rod.strength;
          session.reelTimer += dt;
          if (session.reelTimer >= 0.12) {
            session.reelTimer = 0;
            events |= EVENT_REEL_TICK;
          }
        } else {
          session.tension -= TENSION_RELIEF * dt;
          if (session.fighting) session.distance += FISH_PULL * strength * dt;
        }
        if (session.fighting) session.tension += TENSION_FIGHT_IDLE * strength * dt / rod.strength;
        session.tension = Math.max(0, Math.min(100, session.tension));
        session.distance = Math.max(0, Math.min(session.distanceTotal * 1.5, session.distance));
        if (session.tension >= 100) {
          session.phase = PHASE_SNAPPED;
          session.message = 'The line snapped! The fish got away.';
          events |= EVENT_SNAPPED;
        } else if (session.distance <= 0) {
          session.phase = PHASE_CAUGHT;
          events |= EVENT_CAUGHT;
        }
      }
      return events;
    },

    /** Back to waiting for a cast, after a catch, a snap or an escape. */
    reset() {
      session.phase = PHASE_IDLE;
      session.fish = null;
      session.distance = 0;
      session.distanceTotal = 0;
      session.tension = 0;
      session.dip = 0;
      session.message = '';
    },
  };
}

/** How far a caught fish has to be reeled, from its tier. */
function tierDistance(fish) {
  return { common: 60, uncommon: 80, rare: 110, epic: 150, legendary: 220, mythic: 300, divine: 500 }[fish.tier] ?? 60;
}

/** How hard a caught fish fights, from its tier. */
function fightOf(fish) {
  return { common: 1.0, uncommon: 1.3, rare: 1.7, epic: 2.2, legendary: 2.8, mythic: 3.5, divine: 4.5 }[fish.tier] ?? 1;
}
