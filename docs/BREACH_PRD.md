# BREACH — Product Requirements Document
### Vibe Jam 2026 Entry | Deadline: May 1, 2026

---

## Overview

BREACH is a top-down isometric real-time shooter built in Three.js. You play as a lone soldier dropped into a procedurally generated alien-infested facility. Your mission: reach extraction before the infestation overwhelms you. Between rooms, you choose upgrades. When you die, you start over. The tone is gritty, tense, and fast — closer to Alien Swarm than a bullet-heaven.

---

## Core Pillars

1. **Legibility over fidelity** — Everything reads clearly at a glance. Low-poly 3D with high contrast.
2. **Pressure is constant** — Aliens never stop spawning. Standing still is dying slowly.
3. **Every run feels different** — Procedural layout + roguelite upgrade choices.
4. **Instant to play** — No login. No loading screen. One click to start.

---

## Jam Compliance Checklist

- [ ] Vibe Jam widget: `<script async src="https://vibej.am/2026/widget.js"></script>`
- [ ] 90%+ AI-generated code
- [ ] New game (created after April 1, 2026)
- [ ] Free to play, no login required
- [ ] No heavy loading screens
- [ ] Runs in browser, no downloads
- [ ] Optional: Vibe Jam Portal (webring integration)
- [ ] Optional: Multiplayer (co-op stretch goal)

---

## Player Experience

### Game Loop

```
START → Username prompt (instant, optional) → Drop into Level 1
  → Fight through rooms → Clear room trigger → Upgrade screen (3 choices)
  → Next room → ... → Reach Extraction Zone → Win screen / Next difficulty
  → Player dies → Death screen → Play Again
```

### Session Length Target
- Average run: 8–15 minutes
- Fast death run: under 3 minutes
- Successful extraction: ~12 minutes

---

## Controls

| Input | Action |
|-------|--------|
| `W A S D` | Move soldier |
| Mouse position | Aim (soldier faces cursor) |
| Left click / hold | Fire weapon |
| `R` | Reload |
| `Space` or `Shift` | Dash/dodge roll |
| `1 2 3` | Switch weapons (if unlocked) |
| `F` | Interact (activate terminals, pick up items) |
| `Esc` | Pause |

Dash has a short cooldown (1.5s). It is the primary survival tool — communicating this to new players is essential.

---

## Camera

Isometric perspective. Fixed angle (approximately 45°, looking down-forward). Camera follows the player with slight lag (smoothed lerp). The camera does NOT rotate. Room edges are visible — player can see ahead of where they're moving.

Zoom level: enough to see ~8–10 meters in every direction around the player.

---

## World & Level Design

### Procedural Generation

Each level is a set of connected rectangular rooms generated at runtime:

- **Room count per level:** 5–9 rooms
- **Room types:** Corridor, open arena, tight chokepoint, nest room (high alien density), loot room
- **Connection:** Rooms connect via doorways. Doors are open by default; some are locked (triggered by clearing a room)
- **Extraction zone:** Always at the far end of the last room — visually distinct (glowing pad, beacon)

### Tile/Room Construction (Three.js)

Rooms are built from modular tile units (e.g., 2m × 2m grid):
- Floor tile mesh (flat box geometry, textured or colored)
- Wall meshes on room edges
- Cover objects scattered inside rooms (crates, pillars, debris — using BoxGeometry / CylinderGeometry)
- Lights placed at room entry points and extraction zone

No external 3D asset loading required — everything built from Three.js primitives.

### Level Progression

| Level | Name | Alien density | Room count | Notes |
|-------|------|--------------|------------|-------|
| 1 | Outer Corridors | Low | 5 | Tutorial feel, wide rooms |
| 2 | Processing Wing | Medium | 6 | Narrow corridors introduced |
| 3 | Nest Core | High | 7 | Dense spawns, nest rooms appear |
| 4 | Reactor Depth | Very high | 8 | Time pressure mechanic added |
| 5 | Extraction Run | Max | 9 | Final gauntlet |

---

## Player (Soldier)

### Stats

| Stat | Base Value | Notes |
|------|-----------|-------|
| HP | 100 | Shown as bar top-left |
| Move speed | 5 m/s | Can be upgraded |
| Dash distance | 4 m | Invincible frames during dash |
| Dash cooldown | 1.5s | Can be upgraded |
| Armor | 0 | Flat damage reduction, upgradeable |

### Visual Representation
- Capsule body + box torso (Three.js primitives)
- Soldier always faces mouse cursor direction
- Muzzle flash particle on fire
- Hit flash (brief red tint on damage)
- Death: ragdoll collapse animation (simple rotation/fall)

---

## Weapons

Three weapon slots. Player starts with the Assault Rifle. Additional weapons found as drops or upgrades.

### Weapon Table

| Weapon | Type | Damage | Fire rate | Mag size | Notes |
|--------|------|--------|-----------|----------|-------|
| Assault Rifle | Hitscan | 25 | 600 rpm | 30 | Default weapon |
| Shotgun | Hitscan spread | 15 × 6 pellets | 60 rpm | 8 | Close range king |
| SMG | Hitscan | 15 | 900 rpm | 45 | Fast, low damage |
| Sniper | Hitscan | 150 | 40 rpm | 5 | Pierces enemies |
| Flamethrower | DoT cone | 8/tick | Continuous | N/A (fuel) | Ignores armor |
| Grenade Launcher | Explosive | 80 AoE | 90 rpm | 6 | Self-damage possible |

### Ammo
Each weapon has its own ammo pool. Ammo crates found mid-level. Running dry forces weapon switch — creates pressure.

---

## Alien Types

Four alien variants, introduced progressively across levels.

### Scuttler (Level 1+)
- Fast, low HP (30), no ranged attack
- Charges directly at player
- Swarms in groups of 5–15
- Threat: overwhelm by numbers

### Brute (Level 2+)
- Slow, high HP (250), melee only
- Damages player on contact (40 dmg)
- Knocks player back on hit
- Threat: forces movement, blocks escape routes

### Spitter (Level 2+)
- Medium speed, medium HP (80)
- Ranged acid projectile (25 dmg)
- Keeps distance from player, retreats if cornered
- Threat: punishes standing still behind cover

### Lurker (Level 3+)
- Invisible until within 5m or shot
- Medium HP (100), medium speed
- Ambush burst attack (50 dmg)
- Threat: psychological pressure, forces awareness

### Nest (Spawner, Level 3+)
- Stationary, high HP (400)
- Spawns Scuttlers every 4 seconds
- Must be destroyed to stop infinite spawning
- Always placed in "nest rooms"
- Threat: escalating pressure if ignored

---

## Alien AI

Behavior is intentionally simple — complexity comes from alien variety, not individual AI depth.

- **Pathfinding:** A* or simple steering toward player (Three.js world space)
- **Aggro range:** All aliens in a room aggro when player enters doorway
- **Flanking:** Brutes path around obstacles; Scuttlers do not
- **Spitter retreat:** If player moves within 3m, Spitter runs to far wall
- **Lurker reveal:** Trigger on proximity or bullet impact

---

## Roguelite Upgrade System

After clearing each room, the player is presented with 3 upgrade cards. Pick one. The upgrade screen pauses combat.

### Upgrade Categories

**Offense**
- +15% damage (all weapons)
- +1 ammo magazine capacity
- Explosive rounds (10% chance per shot)
- Piercing shots (bullets pass through 1 enemy)
- +20% fire rate
- Chain lightning (kills arc to nearby enemies)

**Defense**
- +25 max HP (and heal 25)
- +10 armor (flat damage reduction)
- Dash cooldown -0.3s
- Dash now deals 30 dmg to enemies passed through
- +1 extra life (respawn in place, once per run)

**Utility**
- Reveal all Lurkers on level (passive)
- Ammo refill (instant) + +15% max ammo
- Nest radar (Nests shown on minimap)
- Speed boost +1 m/s
- Ricochet (bullets bounce once off walls)

**Rare / Build-Defining (lower probability)**
- Overdrive: fire rate doubles, accuracy halved
- Venom rounds: every shot applies DoT stack
- Ghost: brief invisibility after each dash
- Glass cannon: -50 max HP, +50% damage
- Berserker: kill streak boosts speed temporarily

### Upgrade Rarity
- Common (gray): always available as an option
- Uncommon (blue): ~40% chance to appear
- Rare (amber): ~15% chance to appear
- Build-defining (red): ~5% chance, only once per run

---

## HUD

Minimal. All elements stay at screen edges.

```
┌─────────────────────────────────────────────────┐
│ [HP BAR]          [MINIMAP — top right]         │
│ [ARMOR]                                         │
│                                                 │
│                  GAME WORLD                     │
│                                                 │
│ [AMMO: 28/120]             [WEAPON ICON]        │
│ [DASH COOLDOWN]            [LEVEL / ROOM]       │
└─────────────────────────────────────────────────┘
```

- HP bar: red, left side, with numeric value
- Armor: small gray bar below HP
- Ammo: bottom left (current mag / total reserve)
- Dash: radial cooldown indicator near player character (not screen edge)
- Minimap: small top-right, shows current room + connections, player dot, extraction zone

---

## Audio

Minimal implementation — use Web Audio API only (no file loading = no loading screen).

- Synthesized gunshot (short noise burst per weapon type)
- Alien death: short pitch-shifted pop
- Player hit: low thud
- Extraction reached: rising tone
- Death: descending tone

All sounds are procedurally generated via `AudioContext.createOscillator()` and `createBufferSource()`. No audio file loading required.

---

## Screens & Flow

### Title Screen
- Game name
- "Enter name" text input (optional, defaults to "Soldier")
- "PLAY" button → immediately starts Level 1, no transition

### Upgrade Screen (between rooms)
- Pause gameplay
- Show 3 upgrade cards with rarity color, name, description
- Click to select → resume into next room

### Win Screen
- "Extraction successful"
- Run stats: time, kills, rooms cleared, upgrades taken
- "Play again" button

### Death Screen
- "KIA"
- Cause of death (last enemy type that hit you)
- Run stats
- "Play again" button

---

## Vibe Jam Portal (Optional Stretch Goal)

If time permits, implement the portal webring integration.

### Exit Portal
- Placed in extraction zone area
- Label: "VIBE JAM PORTAL"
- On approach: glow effect, "Enter portal" prompt
- On enter: redirect to `https://vibej.am/portal/2026?username={name}&hp={hp}&ref={currentDomain}`

### Entry Portal (for players arriving from portal)
- Detect `?portal=true` in URL
- Skip title screen, spawn player immediately
- Show a portal object at spawn — walking into it sends player back via `?ref=` param
- Read `?username=` if present, pre-fill player name

---

## Multiplayer (Stretch Goal — Only if Time Permits)

Two-player co-op via WebSockets. Do not build this until single-player is fully playable and polished.

### Recommended approach
- Use [Partykit](https://partykit.io) or [Ably](https://ably.com) for WebSocket hosting
- Player 2 joins via shared URL
- Both players see same procedural level (seeded RNG — share seed over socket)
- Shared HP pool or individual HP (decide during implementation)
- Upgrades: each player picks independently from same pool

### Scope warning
Real-time multiplayer adds significant complexity. This is a jam entry. If co-op isn't solid by April 26, cut it and ship single-player only.

---

## Technical Architecture

### Stack
- **Renderer:** Three.js (r150+)
- **Language:** Vanilla JS or TypeScript
- **Build:** Vite (instant dev server, fast HMM)
- **Hosting:** Any static host (Vercel, Netlify, Fly.io)
- **Physics:** No physics engine — manual AABB collision detection
- **Audio:** Web Audio API (procedural synthesis only)

### Key Systems (Implementation Order)

1. **Renderer + camera** — isometric Three.js scene, soldier mesh, light
2. **Player controller** — WASD movement, mouse aim, shooting
3. **Collision system** — AABB boxes for walls, enemies, bullets
4. **Enemy AI** — Spawn, pathfind toward player, attack
5. **Room/level generator** — Procedural rooms, doorways, cover
6. **HUD** — HP, ammo, minimap overlay (HTML/CSS over canvas)
7. **Upgrade system** — Upgrade screen, stat application
8. **Game state machine** — Title → Playing → Upgrade → Win/Death
9. **Audio** — Procedural Web Audio sounds
10. **Polish** — Particles, screen shake, enemy variety tuning
11. **Vibe Jam widget + portal** — Required widget, optional portal
12. **Multiplayer** — Only if all above are solid

### Performance Targets
- 60fps on a mid-range laptop
- Max ~100 simultaneous enemy meshes
- Bullets: use object pooling (never create/destroy, reuse meshes)
- Enemies: object pool of 100, recycle on death

### No External Assets Policy
Everything rendered from Three.js primitives:
- Player: CapsuleGeometry body + BoxGeometry arms/weapon
- Enemies: differentiated by color + shape (Scuttlers: small sphere cluster; Brutes: large box; Spitters: elongated capsule; Lurkers: translucent sphere)
- Environment: BoxGeometry tiles, walls, cover objects
- Projectiles: small SphereGeometry

---

## Build Timeline

| Date | Milestone |
|------|-----------|
| Apr 14 | PRD finalized, repo created, scene + player movement |
| Apr 16 | Shooting, basic collision, first enemy (Scuttler) |
| Apr 18 | Room generator, multi-room level, doorway transitions |
| Apr 20 | All 4 alien types + AI behaviors |
| Apr 22 | Upgrade system + upgrade screen |
| Apr 23 | HUD, minimap, all screens (title/win/death) |
| Apr 24 | Audio, particles, screen shake |
| Apr 25 | Full playtest + balance pass |
| Apr 26 | Bug fixes, performance pass |
| Apr 27 | Deploy to domain, add Vibe Jam widget |
| Apr 28 | Portal integration (if scope allows) |
| Apr 29 | Final polish buffer |
| Apr 30 | Submit. Done. |

---

## Out of Scope

- Story or narrative
- Cutscenes or cinematics
- Save/persist progress between sessions
- Mobile / touch controls
- Controller support
- More than 5 levels at launch
- Leaderboards (no backend required)
- Difficulty settings (difficulty scales with level progression)

---

## Success Criteria

A successful submission means:
- Player can complete a full run (start → extract) without crashing
- Three distinct weapon types feel meaningfully different
- At least 3 alien types in the game
- Roguelite upgrades create build variety across runs
- Loads in under 3 seconds
- Vibe Jam widget present
- Hosted on a domain

---

*Built with Claude. BREACH is an original game created for Vibe Jam 2026.*
