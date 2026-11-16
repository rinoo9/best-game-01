[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/rinoo9/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/rinoo9/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Reel Legends — 3D Fishing Adventure

A complete original 3D fishing game with an MMORPG look, built with three.js
(vendored locally, no network). Walk a low-poly island as a chibi angler,
fish four zones from Sunny Beach to Ember Volcano, and collect all 25 fish —
from Common to the Divine, 1 in 1,000,000.

## How to play

Serve `game/` with any static server, then open `game/index.html` in desktop
Chrome. No network is needed; everything loads from `game/`.

- **WASD / arrows** — walk (Shift to run)
- **Drag mouse** — orbit the camera
- **Space / click** — cast at a glowing fishing spot, hook on the bite, hold
  Space to reel (watch the tension — at 100 the line snaps!)
- **Shop button** — buy hats, tops, shoes and accessories (wings, backpack,
  shades, cape) that appear on your chibi, plus better rods
- **M** — island map and travel · **F** — Fishdex · **Esc** — close / pause

## The loop

Catch fish to earn coins and XP. Rarer fish fight harder and pay more.
Complete the collection or catch the Divine Aurora Leviathan to win. A
golden hour doubles rare odds every few minutes.

## Layout

- `game/index.html` — the page, import map and HUD
- `game/js/three.module.min.js` — vendored three.js r160 (minified library)
- `game/js/world.js` — island, ocean, sky, village, dock, fishing spots
- `game/js/character.js` — the chibi angler, face, animation and outfits
- `game/js/fishing.js` — cast, bite, hook, reel and tension
- `game/js/fish.js` — rarity rolls and the 25-fish tables
- `game/js/shop.js` — rods and the clothing catalog
- `game/js/ui.js` — HUD and panels · `game/js/audio.js` — synth sounds
- `game/js/shots.js` — the `?shot=` screenshot scenes
- `main.ts` — the make.fun entry program (copies game/ + screenshots/ and
  writes dossier.json)

## License

MIT — see `LICENSE`.
