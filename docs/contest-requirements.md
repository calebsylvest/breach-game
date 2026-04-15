# Cursor Vibe Jam 2026
The Annual Vibe Coding Game Jam

DEADLINE: 1 MAY 2026 @ 13:37 UTC


## rules.sh
rule_00_REQUIRED
REQUIRED: Add the Vibe Jam widget to your game's HTML so we can track entrants and how popular each game is. See the widget section ↓

1. rule_01
Anyone can enter! At least 90% of the code must be written by AI.

1. rule_02
Only NEW games created during the jam period accepted. Do not submit games that existed before 1 April 2026.

1. rule_03
Game must be accessible on the web, free-to-play, NO login or signup required. Preferably its own domain or subdomain.

1. rule_04
NO loading screens and heavy downloads!!! Game has to load almost instantly (except maybe asking for a username).

1. rule_05
Multiplayer games preferred but not required!

1. rule_06
You can use any engine, but Three.js is recommended.

1. rule_07
One entry per person — focus on making one really good game!

1. rule_08
Deadline: 1 MAY 2026 @ 13:37 UTC. Check the countdown above!

## Widget <Required>

(!) IMPORTANT — This JS snippet is REQUIRED.

Add this code to your game's HTML to show you're an entrant:

`<script async src="https://vibej.am/2026/widget.js"></script>`
We use this to track entrants and also how popular each game is.

Make sure your game is on a single domain (like vibegame.com, or fly.pieter.com, or rally.bolt.new) because that's how we track the games.

## FAQ

### what-counts-as-vibe-coding
Vibe coding means using AI assistants as your primary development tool. You describe what you want, the AI writes the code, and you guide the creative direction. At least 90% of your code must be AI-generated.


### can-i-use-existing-code
You may use existing libraries and frameworks (Three.js, etc.), but the game itself must be brand new — created during the jam period. Do not submit games that existed before 1 April 2026.

### what-engine
You can use any engine, but Three.js is the recommended choice. Your game must run in a web browser with no downloads, no login, and no heavy loading screens.

### prizes
Gold ($20,000), Silver ($10,000), and Bronze ($5,000) winners receive real CASH prizes — $35,000 total! Last year we gave out $17,500. The Vibe Jam is like a fun benchmark for AI coding!

### show-entrant-badge
This widget is REQUIRED. Add it to your game's HTML — see the WIDGET section above.

`<script async src="https://vibej.am/2026/widget.js"></script>`


## Portals (optional)

Note: this Vibe Jam Portal is a totally different thing than the required widget snippet above. The widget is mandatory and just tracks your game; portals are optional and let players hop between games like a webring.

Make an exit portal in your game players can walk/fly/drive into — you can add a label like Vibe Jam Portal. This way players can play and hop to the next game like a Vibe Jam 2026 Webring! Your game will be added to the webring if you have a portal.

When the player enters the portal, redirect them to:

https://vibej.am/portal/2026
You can send GET query params that get forwarded to the next game:

username= — username/name of the player
color= — player color in hex or just red/green/yellow
speed= — meters per second
ref= — URL of the game the player came from
Use ?ref= to add a portal BACK to the game they came from.

Example URL:

https://vibej.am/portal/2026?username=levelsio&color=red&speed=5&ref=fly.pieter.com
The receiving game can use this info to spawn the player with full continuity!

Optional extra params:

avatar_url=
team=
hp= — health points; 1..100 range
speed_x= — meters per second
speed_y= — meters per second
speed_z= — meters per second
rotation_x= — radians
rotation_y= — radians
rotation_z= — radians
The portal redirector will always add ?portal=true so you can detect when a user comes from a portal and instantly drop them into your game out of another portal — no start screens.

(!) IMPORTANT — Add a start portal:

When receiving a user (with ?portal=true in your URL) and a ?ref=, make a portal where the user spawns out of so they can return back to the previous game by walking into it. When returning them, make sure to send all the query parameters again too.

All parameters except portal are optional and may or may not be present — do not rely on their presence.

IMPORTANT: make sure your game instantly loads — no loading screens, no input screens — so the continuity is nice for players.

SAMPLE CODE — copy-paste-ready Three.js snippet for start + exit portals. Include it with a <script src>, call initVibeJamPortals({ scene, getPlayer }) once, and animateVibeJamPortals() inside your animate loop.

https://vibej.am/2026/portal/sample.js

<script src="https://vibej.am/2026/portal/sample.js"></script>
<script>
  initVibeJamPortals({
    scene: yourScene,
    getPlayer: () => yourPlayerObject3D,
    spawnPoint:   { x: 0, y: 0, z: 0 },
    exitPosition: { x: -200, y: 200, z: -300 },
  });
  // Inside your existing animate/render loop:
  // animateVibeJamPortals();
</script>