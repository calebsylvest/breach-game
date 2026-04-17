# BREACH — Task Planner

Living task list tracking build progress against `BREACH_PRD.md`. Update as work lands.

## Status

- **Branch:** main
- **Playable:** yes — title → run → arena wave → upgrade → nest wave → upgrade → extraction → win
- **Last phase shipped:** Enemy aggro stagger + bigger rooms + physical gear upgrades + balance tuning
- **Next suggested phase:** Balance/playtest pass — armor system changed the damage model significantly

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
- [x] Loot cases: pre-placed in arenas/nests, E-key to open modal
- [x] Loot cases: only 1–2 choices per case
- [x] Enemy pre-spawn + per-type aggro ranges; alarm propagation on damage
- [x] Callsign prompt on title screen
- [x] Ammo system (mag + reserve, reload on R)
- [x] Floor pickups: health and ammo packs (auto-collect on proximity)
- [x] Reduced pickup density (not too many items on ground)
- [x] Ammo packs give fewer bullets

### HUD & Screens
- [x] HP bar + kill count
- [x] Minimap canvas with room colors, extraction marker, player dot
- [x] Current room label
- [x] Dash cooldown bar
- [x] Title screen (BREACH + PLAY button)
- [x] Death screen with cause-of-death
- [x] Win screen with kills + time
- [x] Run stats on win/death: kills, time, level, upgrades taken

### Weapons
- [x] Shotgun (spread hitscan)
- [x] SMG (fast low-dmg)
- [x] Weapon switching (1 / 2 / 3 keys)
- [x] Distinct gunshot per weapon type

### Level Progression
- [x] Level 2 "Processing Wing" — 6 rooms, nest introduced
- [x] Level 3 "Nest Core" — 7 rooms
- [x] Level 4 "Reactor Depth" — 8 rooms, narrower corridors
- [x] Level 5 "Extraction Run" — 9 rooms, max density
- [x] Level transition screen on extraction (instead of immediate win)
- [x] Difficulty scaling: wave composition scales per level

### Polish
- [x] Web Audio: gunshot, enemy death, player hit, win tone, death tone
- [x] Camera shake on fire and damage
- [x] Particle bursts on hit, kill, wall impact, muzzle flash
- [x] Vibe Jam 2026 widget script embedded

### Jam Compliance
- [x] Vibe Jam widget embedded
- [x] Free to play, no login
- [x] No heavy loading screens (procedural sound/geometry)
- [x] Runs in browser, no downloads

---

## Open Bugs

_None._

---

## Remaining Features (by PRD section)

### General
- [x] Reload progress ring — blue arc draws around player feet, fills from 12 o'clock as reload progresses

### Roguelite Loop
- [x] Upgrade stacking limit — `maxStacks` per upgrade + `upgradeUsed` map fully implemented
- [ ] HOLD: Rare / build-defining cards with rarity weights
- [ ] HOLD: Card rarity coloring in UI (gray / blue / amber / red)
- [x] Armor stat — flat pool, absorbs damage before HP, overflow to HP
  - Armor Plate I / II / III upgrades (replaces Trauma Plate / Kevlar Vest)
  - Armor Repair Kit upgrade
  - Armor floor pickup (steel-blue plate, drops in arenas)
  - HUD split: HP bar (red) + Armor bar (steel blue)
  - Spitter acid: 60% armor / 40% direct HP split damage
  - Health floor pickups now rare (nest rooms only)
  - FUTURE: Armor color shifts as it depletes (warning/critical states)
  - FUTURE: Character traits — Strength (carry capacity) affects max armor; Speed penalty for heavy armor
  - FUTURE: Enemy armor stat with AP Round interactions
  - FUTURE: Attack types that fully bypass armor (pure HP damage)
- [x] Piercing bullets upgrade — "Piercing Rounds" card (maxStacks 1), sets `piercingBullets` flag on Stats
- [x] Extra life upgrade — "Emergency Beacon" card (maxStacks 2), `tryRevive()` intercepts death, restores 50 HP + 25 armor

### Weapons
- [x] Sniper (piercing, slow) — 150 dmg, 1.6s fire rate, 5 mag, pierces through enemies, key 4, distinct crack+thump audio
- [ ] HOLD: Grenade launcher (AoE)

### Audio
- [ ] HOLD: Low-frequency ambient hum
- [ ] HOLD: Footstep ticks

### Level Scaling
- [ ] Enemy HP/speed scaling per level (stretch)

### Balance & Polish
- [ ] Full playtest pass
- [ ] Tune wave composition per room
- [ ] Tune upgrade strength
- [ ] Performance pass (inspect with devtools, target 60fps)
- [ ] Bug sweep

### Jam Compliance
- [ ] Verify 90%+ AI-generated code claim when submitting
- [ ] Confirm project created after April 1, 2026

### Deploy
- [ ] Production build (`vite build`)
- [ ] Deploy to domain
- [ ] Verify widget works on production

---

## Research

- [x] **RESEARCH: Environment lighting / fog of war** — Implemented: ambient drastically reduced, player-carried PointLight (r=15, warm) is primary visibility. Fog tightened (18→42 vs old 30→80). Extraction beacon light was already in world.ts. Result: rooms outside player radius go dark; works with orthographic camera.
  - FUTURE: Per-room ceiling fixtures as dim static lights for navigation landmarks
  - FUTURE: Enemy light sources (glowing nests, spitter acid trails)
  - FUTURE: Flickering/damaged lights in later levels
- [ ] **RESEARCH: Texturing and visual enhancements** — Investigate procedural textures, normal maps, or material improvements to make the isometric world look more polished and distinctive without asset loading.

---

## Stretch Goals

- [ ] Non-linear room paths — World generator branching (large scope)
- [ ] Armor as HP substitute — Stats refactor
- [ ] Vibe Jam Portal integration
  - [ ] Exit portal at extraction
  - [ ] `?portal=true` entry detection
- [ ] Multiplayer co-op — Only after everything else stable
