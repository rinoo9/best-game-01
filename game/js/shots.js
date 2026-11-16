// The screenshot scenes: each `shot` URL param stages a real game state with
// the real scene and render code (no mockups), deterministically with &seed=1.
// main.js renders the staged scene and sets window.__shotReady.

import { ZONES } from './config.js';
import { fishOfTier } from './fish.js';
import { PHASE_REELING } from './fishing.js';
import { rodById } from './shop.js';

function zoneName(id) {
  const zone = ZONES.find((entry) => entry.id === id);
  return zone ? zone.name : id;
}

/** The demo profile the shots stage with: coins, a carbon rod, a few catches. */
function demoProfile(profile) {
  profile.coins = 1240;
  profile.bestScore = 1240;
  profile.level = 3;
  profile.xp = 40;
  profile.rod = 'carbon';
  profile.ownedRods = ['bamboo', 'fiberglass', 'carbon'];
  profile.caught = {
    'sunny-minnow': 2, 'striped-perch': 1, 'blue-gill': 1,
    'reef-clownfish': 1, 'coral-dragon': 1, 'golden-carp': 1,
  };
  profile.catches = [{ id: 'coral-dragon', name: 'Coral Dragon', tier: 'legendary', weight: 8, coins: 1150, zone: 'coral' }];
  profile.outfit = { hat: null, top: 'green-shirt', shoes: null, accessory: null };
  profile.ownedClothes = ['green-shirt'];
}

export function stageShot(name, game, rng) {
  void rng;
  demoProfile(game.profile);
  game.rod = rodById('carbon');
  game.angler.setOutfit(game.profile.outfit);
  game.screen = 'play';
  game.ui.hideAllPanels();
  game.ui.hideTitle();

  if (name === 'title') {
    // Front view of the chibi on the beach, village and island behind.
    game.placePlayer(0, 24, 0);
    game.frameCamera(0, 3.4, 34.5, 0, 1.6, 24);
    game.ui.showTitle(game.profile.bestScore, 24);
    return;
  }

  if (name === 'play') {
    // Third-person view behind the chibi at the dock, mid-reel.
    const dock = game.world.dockEnd;
    game.placePlayer(dock.x + 1.2, dock.z + 1.2, -Math.PI / 4);
    const fish = fishOfTier('coral', 'epic');
    const session = game.fishing.state;
    session.phase = PHASE_REELING;
    session.fish = { ...fish, zoneName: zoneName('coral') };
    session.distanceTotal = 150;
    session.distance = 68;
    session.tension = 62;
    session.fighting = true;
    session.bobber = {
      x: game.player.x + Math.sin(game.player.facing) * 6.5,
      y: 0.7,
      z: game.player.z + Math.cos(game.player.facing) * 6.5,
    };
    game.showFishingGear(true);
    game.cameraOrbit.yaw = Math.PI * 0.75;
    game.cameraOrbit.pitch = 0.34;
    game.cameraOrbit.dist = 9.5;
    game.updateCamera();
    game.zone = 'sunny';
    game.ui.updateHUD(game.hudState());
    game.ui.setTension(true, 62, 0.55);
    game.ui.setPrompt('Hold SPACE to reel!');
    return;
  }

  if (name === 'catch') {
    // Legendary catch reveal over the 3D scene at the dock.
    const dock = game.world.dockEnd;
    game.placePlayer(dock.x + 1.2, dock.z + 1.2, Math.PI * 0.15);
    const fish = fishOfTier('coral', 'legendary');
    game.frameCamera(dock.x + 7, 3.6, dock.z + 8, dock.x, 1.5, dock.z);
    game.ui.updateHUD(game.hudState());
    game.ui.showCatch({ ...fish, zoneName: zoneName('coral') }, false);
    return;
  }

  if (name === 'shop') {
    // Customization shop open, chibi wearing a straw hat and angel wings.
    game.profile.outfit = { hat: 'straw-hat', top: 'red-shirt', shoes: 'sneakers', accessory: 'angel-wings' };
    game.profile.ownedClothes = ['green-shirt', 'straw-hat', 'red-shirt', 'sneakers', 'angel-wings'];
    game.angler.setOutfit(game.profile.outfit);
    game.placePlayer(-2, 22, 0.25);
    game.frameCamera(2.5, 3.0, 33, 2.5, 1.5, 22);
    game.ui.updateHUD(game.hudState());
    game.ui.showShop(game.profile, 'hat');
    return;
  }

  // Unknown shot: fall back to the title.
  game.placePlayer(0, 24, 0);
  game.frameCamera(0, 3.4, 34.5, 0, 1.6, 24);
  game.ui.showTitle(game.profile.bestScore, 24);
}
