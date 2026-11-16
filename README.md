[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/rinoo9/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/rinoo9/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

# Reel Legends — make.fun bounty best-game-01

A fishing adventure that runs offline in a desktop browser. Cast the line, hook the fish in the timing window, and reel it in without snapping the line. Every catch shows its rarity — Common (1 in 2) up to the Divine Aurora Leviathan (1 in 1,000,000) — and pays coins. Spend coins on better rods and boats, sail to four islands, each with its own fish, and fill the Fishdex. A golden hour doubles rare odds every few minutes.

## How to play

Serve `game/` with any static server and open `game/index.html` in desktop Chrome, or run `node main.ts` to hand the game in (see below).

- **Click or Space**: cast, hook when the bobber dips and "!" appears, confirm screens
- **Hold mouse or Space**: reel in while a fish fights (watch the tension bar — at 100 the line snaps)
- **S**: shop (rods and boats) · **M**: island map · **F**: Fishdex · **P**: pause · **R**: restart

Catch the Divine fish or complete the 25-fish collection to win.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`MAKEFUN_OUTPUT_DIR` stands in for `/output` outside the grader's container. The program runs twice and writes the same bytes both times: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-game.ts`.

## License

MIT (SPDX-License-Identifier: MIT). See LICENSE.
