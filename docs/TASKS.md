# BREACH — Task Planner

Living task list tracking build progress against `BREACH_PRD.md`. Update as work lands.

## Status

- **Branch:** main
- **Playable:** yes — title → run → arena wave → upgrade → nest wave → upgrade → extraction → win
- **Last phase shipped:** Phase 11 (particles)
- **Next suggested phase:** balance pass or level progression (see Remaining)

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
- [x] Upgrade pool: 9 offense / defense / utility cards

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

_None — paused for review._

## Remaining (by PRD section)

### Jam Compliance (`## Jam Compliance Checklist`)
- [x] Vibe Jam widget embedded
- [x] Free to play, no login
- [x] No heavy loading screens (procedural sound/geometry)
- [x] Runs in browser, no downloads
- [ ] Verify 90%+ AI-generated code claim when submitting
- [ ] Confirm project created after April 1, 2026

### Level Progression (`## World & Level Design — Level Progression`)
- [ ] Level 2 "Processing Wing" — 6 rooms, narrower corridors, medium alien density
- [ ] Level 3 "Nest Core" — 7 rooms, more nest rooms
- [ ] Level 4 "Reactor Depth" — 8 rooms, optional time pressure
- [ ] Level 5 "Extraction Run" — 9 rooms, max density
- [ ] Level transition screen on extraction (instead of immediate win)
- [ ] Difficulty scaling: wave size, enemy HP/speed per level

### Weapons (`## Weapons`)
- [ ] Ammo system (mag + reserve, reload on R)
- [ ] Shotgun (spread hitscan)
- [ ] SMG (fast low-dmg)
- [ ] Sniper (piercing, slow)
- [ ] Grenade launcher (AoE)
- [ ] Weapon switching (1 / 2 / 3 keys)

### Upgrades (`## Roguelite Upgrade System`)
- [x] Base pool of offense/defense/utility
- [ ] Rare / build-defining cards with rarity weights
- [ ] Card rarity coloring in UI (gray / blue / amber / red)
- [ ] Armor stat + flat damage reduction
- [ ] Piercing / chain / ricochet bullets
- [ ] Extra life upgrade

### Audio (`## Audio`)
- [x] Gunshot / hit / death / win / death tone
- [ ] Distinct gunshot per weapon type
- [ ] Low-frequency ambient hum
- [ ] Footstep ticks

### Screens & Flow (`## Screens & Flow`)
- [x] Title screen
- [x] Upgrade screen
- [x] Win screen
- [x] Death screen
- [ ] Username prompt on title (defaults to "Soldier")
- [ ] Run stats on win/death: rooms cleared, upgrades taken

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
