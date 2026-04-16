# BREACH — Task Planner

Living task list tracking build progress against `BREACH_PRD.md`. Update as work lands.

## Status

- **Branch:** main
- **Playable:** yes — title → run → arena wave → upgrade → nest wave → upgrade → extraction → win
- **Last phase shipped:** Enemy aggro stagger + bigger rooms + physical gear upgrades + balance tuning
- **Next suggested phase:** ammo/health floor pickups, non-linear room branching (stretch), or deploy

## Done

### Foundation
- [x] Vite + TypeScript + Three.js scaffold
- [x] Isometric orthographic camera with follow lerp
- [x] Input: WASD, mouse aim, click-fire, space/shift dash
- [x] AABB circle collision with axis-separated resolution
- [x] Player capsule, hit flash, ragdoll on death

### Combat
- [x] BulletSystem with pooled bullets, per-bullet damage
- [x] Scuttler, Brute, Spitter, Lurker, Nest with behavior dispatch (chase / keepDistance / ambush / stationary)
- [x] SpitSystem for ranged acid projectiles
- [x] Damage, hit flash, contact damage cooldown
- [x] Dash iframes (no damage during dash)

### World
- [x] Procedural 7-room level: start → corridor → arena → corridor → nest → corridor → extraction
- [x] Doorways computed from z-range overlap between adjacent rooms
- [x] Cover boxes in arena/nest rooms
- [x] Extraction pad with pulsing beacon and point light
- [x] Player-following key light so shadows stay crisp

### Roguelite Loop
- [x] Combat room wave spawning (arena / nest presets)
- [x] Room clear detection
- [x] Upgrade screen: pause + 3 random cards + click-to-apply
- [x] Stats struct feeding damage/fireRate/speed/maxHp
- [x] Upgrade pool: 15 physical gear items (Hollow Points, AP Rounds, Kevlar Vest, Dash Canister, Exo-Legs, etc.)
- [x] Loot cases: pre-placed in arenas/nests, click-to-open modal replaces room-clear reward
- [x] Enemy pre-spawn + per-type aggro ranges; alarm propagation on damage
- [x] Callsign prompt on title screen

### HUD & Screens
- [x] HP bar + kill count
- [x] Minimap canvas with room colors, extraction marker, player dot
- [x] Current room label
- [x] Dash cooldown bar
- [x] Title screen (BREACH + PLAY button)
- [x] Death screen with cause-of-death
- [x] Win screen with kills + time

### Polish
- [x] Web Audio: gunshot, enemy death, player hit, win tone, death tone
- [x] Camera shake on fire and damage
- [x] Particle bursts on hit, kill, wall impact, muzzle flash
- [x] Vibe Jam 2026 widget script embedded

## In Progress

_None._

## Remaining (by PRD section)

### Jam Compliance (`## Jam Compliance Checklist`)
- [x] Vibe Jam widget embedded
- [x] Free to play, no login
- [x] No heavy loading screens (procedural sound/geometry)
- [x] Runs in browser, no downloads
- [ ] Verify 90%+ AI-generated code claim when submitting
- [ ] Confirm project created after April 1, 2026

### Level Progression (`## World & Level Design — Level Progression`)
- [x] Level 2 "Processing Wing" — 6 rooms, nest introduced
- [x] Level 3 "Nest Core" — 7 rooms
- [x] Level 4 "Reactor Depth" — 8 rooms, narrower corridors
- [x] Level 5 "Extraction Run" — 9 rooms, max density
- [x] Level transition screen on extraction (instead of immediate win)
- [x] Difficulty scaling: wave composition scales per level
- [ ] Enemy HP/speed scaling per level (stretch)

### Weapons (`## Weapons`)
- [x] Ammo system (mag + reserve, reload on R)
- [x] Shotgun (spread hitscan)
- [x] SMG (fast low-dmg)
- [ ] Sniper (piercing, slow)
- [ ] Grenade launcher (AoE)
- [x] Weapon switching (1 / 2 / 3 keys)

### Upgrades (`## Roguelite Upgrade System`)
- [x] Base pool of offense/defense/utility
- [ ] Rare / build-defining cards with rarity weights
- [ ] Card rarity coloring in UI (gray / blue / amber / red)
- [ ] Armor stat + flat damage reduction
- [ ] Piercing / chain / ricochet bullets
- [ ] Extra life upgrade

### Audio (`## Audio`)
- [x] Gunshot / hit / death / win / death tone
- [x] Distinct gunshot per weapon type
- [ ] Low-frequency ambient hum
- [ ] Footstep ticks

### Screens & Flow (`## Screens & Flow`)
- [x] Title screen
- [x] Upgrade screen
- [x] Win screen
- [x] Death screen
- [x] Username prompt on title (defaults to "Soldier")
- [x] Run stats on win/death: kills, time, level, upgrades taken

### Balance & Polish (`## Build Timeline — Apr 25-26`)
- [ ] Full playtest pass
- [ ] Tune wave composition per room
- [ ] Tune upgrade strength
- [ ] Performance pass (inspect with devtools, target 60fps)
- [ ] Bug sweep

### Deploy (`## Build Timeline — Apr 27`)
- [ ] Production build (`vite build`)
- [ ] Deploy to domain
- [ ] Verify widget works on production

### Stretch Goals
- [ ] Vibe Jam Portal integration (`## Vibe Jam Portal`)
  - [ ] Exit portal at extraction
  - [ ] `?portal=true` entry detection
- [ ] Multiplayer co-op (`## Multiplayer`)
  - [ ] Only after everything else above is stable

## TO SORT → DONE

All items below have been resolved:

- [x] **Game too easy** — Enemy HP buffed 40-60%, speed/attack rate increased; wave density up ~50%; MAX_ALIVE 24→36
- [x] **Camera direction SE→NE** — CAMERA_OFFSET flipped to (-16,20,16); level progression now reads left-to-right
- [x] **Bigger rooms + more cover** — Arenas 30-50% larger; added corner pillars, mid-wall segments, center flanking boxes; nests get organic cluster ring
- [x] **Physical gear upgrades** — 15 named items (Hollow Points, AP Rounds, Kevlar Vest, Medkit, Exo-Legs, Dash Canister, etc.) replace abstract stat boosts
- [x] **Room-clear upgrade screen removed** — Upgrades now found in loot cases scattered in rooms (click to open)
- [x] **Enemy visibility + aggro stagger** — Enemies pre-spawn at level load with `aggroed=false`; each type has an aggro range (scuttler 8u, brute 11u, spitter 15u, lurker 5u); alarm propagates on hit

### Still open from TO SORT
- [ ] **Non-linear room paths** — Current layout is still linear chain. Would need World generator to support branching (separate room graph task, large scope)
- [ ] **Armor as HP substitute** — User wants armor stat instead of maxHp bonus (separate Stats refactor)
- [ ] **Ammo/health packs as world pickups** — Could add floor-dropped items alongside loot cases
  