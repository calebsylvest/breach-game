import * as THREE from "three";
import { createScene, type SceneCtx } from "./scene.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";
import { World, type Room } from "./world.ts";
import { BulletSystem, WEAPONS } from "./weapons.ts";
import { LEVEL_NAMES } from "./world.ts";
import { EnemyManager } from "./enemies.ts";
import type { EnemyType } from "./enemies.ts";
import { Hud } from "./hud.ts";
import { rollUpgrades, type Upgrade } from "./upgrades.ts";
import { Audio } from "./audio.ts";
import { ParticleSystem } from "./particles.ts";

const CAMERA_OFFSET = new THREE.Vector3(16, 20, 16);
const LIGHT_OFFSET = new THREE.Vector3(8, 24, 4);

const ARENA_WAVES: EnemyType[][] = [
  ["scuttler", "scuttler", "scuttler", "scuttler", "scuttler"],
  ["scuttler", "scuttler", "scuttler", "spitter", "spitter", "brute"],
  ["scuttler", "scuttler", "scuttler", "scuttler", "spitter", "spitter", "brute"],
  ["scuttler", "scuttler", "scuttler", "spitter", "spitter", "brute", "brute", "lurker"],
  ["scuttler", "scuttler", "scuttler", "scuttler", "spitter", "spitter", "spitter", "brute", "brute", "lurker", "lurker"],
];

const NEST_WAVES: EnemyType[][] = [
  [],
  ["nest", "scuttler", "scuttler"],
  ["nest", "scuttler", "scuttler", "lurker", "lurker"],
  ["nest", "nest", "scuttler", "scuttler", "scuttler", "lurker", "lurker"],
  ["nest", "nest", "scuttler", "scuttler", "spitter", "lurker", "lurker", "lurker"],
];

type RoomState = "untouched" | "active" | "cleared";

export class Game {
  readonly ctx: SceneCtx;
  readonly input: Input;
  readonly player: Player;
  world: World;
  readonly bullets: BulletSystem;
  readonly enemies: EnemyManager;
  readonly particles: ParticleSystem;
  private readonly hud: Hud;
  private readonly audio = new Audio();
  private readonly followTarget = new THREE.Vector3();
  private readonly muzzle = new THREE.Vector3();
  private readonly fireDir = new THREE.Vector3();
  private readonly roomStates = new Map<Room, RoomState>();
  private last = performance.now();
  private fireCooldown = 0;
  private deathShown = false;
  private winShown = false;
  private extractionHit = false;
  private paused = false;
  private currentLevel = 0;
  private runStart = performance.now();
  private lastHp = 0;
  private lastKillCount = 0;
  private shakeTime = 0;
  private shakeAmp = 0;

  constructor(container: HTMLElement) {
    this.ctx = createScene(container);
    this.input = new Input(this.ctx.renderer.domElement);
    this.world = new World();
    this.ctx.scene.add(this.world.group);
    this.player = new Player();
    this.player.position.copy(this.world.playerSpawn);
    this.ctx.scene.add(this.player.group);
    this.enemies = new EnemyManager(this.ctx.scene);
    this.bullets = new BulletSystem(this.ctx.scene);
    this.particles = new ParticleSystem(this.ctx.scene);
    this.hud = new Hud(
      () => this.restart(),
      () => this.restart(),
      () => this.startRun(),
    );
    this.paused = true;

    this.initRoomStates();

    this.lastHp = this.player.hp;
    this.lastKillCount = 0;
    this.ctx.renderer.domElement.addEventListener(
      "mousedown",
      () => this.audio.resume(),
      { once: true },
    );

    this.followTarget.copy(this.player.position);
    this.ctx.camera.position.copy(this.followTarget).add(CAMERA_OFFSET);
    this.ctx.camera.lookAt(this.followTarget);
    this.updateLight();

    console.log("[BREACH] boot ok — rooms", this.world.rooms.length);
  }

  start(): void {
    const loop = () => {
      const now = performance.now();
      const dt = Math.min((now - this.last) / 1000, 1 / 30);
      this.last = now;
      this.tick(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  private startRun(): void {
    this.hud.hideTitle();
    this.audio.resume();
    this.paused = false;
    this.runStart = performance.now();
    this.last = performance.now();
  }

  restart(): void {
    // Rebuild world at level 0 (handles mid-run restarts from any level)
    this.ctx.scene.remove(this.world.group);
    this.currentLevel = 0;
    this.world = new World(0);
    this.ctx.scene.add(this.world.group);

    this.player.resetRun();
    this.player.position.copy(this.world.playerSpawn);
    this.player.group.rotation.z = 0;
    this.player.group.position.y = 0;
    this.player.group.position.copy(this.player.position);
    for (const e of this.enemies.enemies) {
      e.alive = false;
      e.group.visible = false;
    }
    this.enemies.killCount = 0;
    this.deathShown = false;
    this.winShown = false;
    this.extractionHit = false;
    this.paused = false;
    this.runStart = performance.now();
    this.lastHp = this.player.hp;
    this.lastKillCount = 0;
    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.hud.hideDeath();
    this.hud.hideWin();
    this.hud.hideUpgrade();
    this.hud.hideLevelTransition();
    this.initRoomStates();
    this.followTarget.copy(this.player.position);
    this.updateLight();
  }

  private initRoomStates(): void {
    this.roomStates.clear();
    for (const room of this.world.rooms) {
      if (room.type === "arena" || room.type === "nest") {
        this.roomStates.set(room, "untouched");
      }
    }
  }

  private tick(dt: number): void {
    if (this.paused) {
      this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
      return;
    }

    this.player.update(dt, this.input, this.ctx.camera, this.world);
    this.enemies.update(dt, this.player, this.world);
    this.world.update(dt);

    this.updateCombatRooms();

    const smooth = 1 - Math.exp(-dt * 10);
    this.followTarget.lerp(this.player.position, smooth);
    this.ctx.camera.position.copy(this.followTarget).add(CAMERA_OFFSET);
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      const t = Math.max(0, Math.min(1, this.shakeTime / 0.25));
      const a = this.shakeAmp * t;
      this.ctx.camera.position.x += (Math.random() - 0.5) * a;
      this.ctx.camera.position.z += (Math.random() - 0.5) * a;
    }
    this.ctx.camera.lookAt(this.followTarget);
    this.updateLight();

    // Weapon switch
    const switchTo = this.input.consumeWeaponSwitch();
    if (switchTo !== null) this.player.switchWeapon(switchTo);

    // Reload
    const weapon = WEAPONS[this.player.weaponIndex];
    if (this.input.consumeReload()) this.player.startReload(weapon);
    this.player.updateReload(dt, weapon);

    // Auto-reload on empty
    if (this.player.mag === 0 && !this.player.reloading && this.player.reserve > 0) {
      this.player.startReload(weapon);
    }

    this.fireCooldown -= dt;
    const fireInterval = weapon.fireInterval / this.player.stats.fireRateMult;
    if (
      this.player.hp > 0 &&
      !this.winShown &&
      this.input.firing &&
      this.fireCooldown <= 0 &&
      !this.player.reloading
    ) {
      if (this.player.mag > 0) {
        this.player.mag--;
        const damage = weapon.damage * this.player.stats.damageMult;
        const muzzleX = this.player.position.x + this.player.aim.x * 0.9;
        const muzzleZ = this.player.position.z + this.player.aim.z * 0.9;
        this.muzzle.set(muzzleX, 1.15, muzzleZ);
        for (let p = 0; p < weapon.pellets; p++) {
          let dx = this.player.aim.x;
          let dz = this.player.aim.z;
          if (weapon.spread > 0) {
            const angle = (Math.random() - 0.5) * weapon.spread * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const ndx = dx * cos - dz * sin;
            const ndz = dx * sin + dz * cos;
            dx = ndx;
            dz = ndz;
          }
          this.fireDir.set(dx, 0, dz);
          this.bullets.spawn(this.muzzle, this.fireDir, damage, weapon.bulletSpeed);
        }
        this.particles.muzzle(muzzleX, 1.15, muzzleZ, this.player.aim.x, this.player.aim.z);
        this.fireCooldown = fireInterval;
        this.audio.gunshot(weapon.id);
        this.triggerShake(0.08, 0.08);
      } else {
        // Empty click — dry fire once per cooldown cycle
        this.fireCooldown = fireInterval;
        this.audio.dryFire();
      }
    }

    this.bullets.update(dt, this.world, this.enemies, this.particles);
    this.particles.update(dt);
    this.hud.update(this.player, this.enemies, this.world);

    if (this.player.hp < this.lastHp) {
      this.audio.playerHit();
      this.triggerShake(0.45, 0.22);
    }
    this.lastHp = this.player.hp;

    if (this.enemies.killCount > this.lastKillCount) {
      for (let i = this.lastKillCount; i < this.enemies.killCount; i++) {
        this.audio.enemyDeath();
      }
      this.lastKillCount = this.enemies.killCount;
    }

    if (this.player.hp <= 0 && !this.deathShown) {
      this.hud.showDeath(this.player.lastDamageSource);
      this.audio.deathTone();
      this.deathShown = true;
    }

    if (!this.extractionHit && !this.deathShown && this.playerReachedExtraction()) {
      this.extractionHit = true;
      if (this.currentLevel >= LEVEL_NAMES.length - 1) {
        const elapsed = (performance.now() - this.runStart) / 1000;
        this.hud.showWin(this.enemies.killCount, elapsed);
        this.audio.winTone();
        this.winShown = true;
      } else {
        this.paused = true;
        this.input.firing = false;
        const nextLevel = this.currentLevel + 1;
        this.hud.showLevelTransition(nextLevel + 1, LEVEL_NAMES[nextLevel], () => {
          this.advanceLevel(nextLevel);
        });
      }
    }

    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }

  private updateCombatRooms(): void {
    const room = this.currentRoom();
    if (room) {
      const state = this.roomStates.get(room);
      if (state === "untouched") {
        this.spawnWave(room);
        this.roomStates.set(room, "active");
      }
    }
    for (const [r, state] of this.roomStates) {
      if (state === "active" && this.enemies.aliveCount() === 0) {
        this.roomStates.set(r, "cleared");
        this.openUpgradeScreen();
        break;
      }
    }
  }

  private currentRoom(): Room | null {
    const x = this.player.position.x;
    const z = this.player.position.z;
    for (const r of this.world.rooms) {
      if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return r;
    }
    return null;
  }

  private spawnWave(room: Room): void {
    const li = Math.min(this.currentLevel, ARENA_WAVES.length - 1);
    const plan = room.type === "arena" ? ARENA_WAVES[li] : NEST_WAVES[li];
    for (const type of plan) {
      const point = this.world.randomPointInRoom(room, 1.2);
      if (point) this.enemies.spawn(type, point.x, point.z);
    }
  }

  private advanceLevel(nextLevel: number): void {
    this.currentLevel = nextLevel;

    // Swap world geometry
    this.ctx.scene.remove(this.world.group);
    this.world = new World(this.currentLevel);
    this.ctx.scene.add(this.world.group);

    // Reposition player
    this.player.position.copy(this.world.playerSpawn);
    this.player.group.position.set(this.player.position.x, 0, this.player.position.z);
    this.player.group.rotation.z = 0;

    // Clear enemies
    for (const e of this.enemies.enemies) {
      e.alive = false;
      e.group.visible = false;
    }

    // Reset per-level flags
    this.extractionHit = false;
    this.deathShown = false;
    this.fireCooldown = 0;
    this.shakeTime = 0;
    this.shakeAmp = 0;
    this.lastHp = this.player.hp;
    this.lastKillCount = this.enemies.killCount;

    // Camera snap to new spawn
    this.followTarget.copy(this.player.position);
    this.updateLight();

    this.initRoomStates();
    this.hud.hideLevelTransition();
    this.paused = false;
  }

  private openUpgradeScreen(): void {
    const cards = rollUpgrades(3);
    this.paused = true;
    this.input.firing = false; // mouseup won't fire on canvas while overlay is open
    this.hud.showUpgrade(cards, (picked: Upgrade) => {
      picked.apply(this.player);
      this.hud.hideUpgrade();
      this.paused = false;
    });
  }

  private triggerShake(amp: number, duration: number): void {
    if (amp > this.shakeAmp || this.shakeTime <= 0) {
      this.shakeAmp = amp;
    }
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  private playerReachedExtraction(): boolean {
    const e = this.world.extraction;
    const dx = this.player.position.x - e.x;
    const dz = this.player.position.z - e.z;
    return dx * dx + dz * dz < e.r * e.r;
  }

  private updateLight(): void {
    const light = this.ctx.keyLight;
    light.position.copy(this.followTarget).add(LIGHT_OFFSET);
    light.target.position.copy(this.followTarget);
    light.target.updateMatrixWorld();
  }
}
