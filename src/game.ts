import * as THREE from "three";
import { createScene, type SceneCtx } from "./scene.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";
import { World, type Room } from "./world.ts";
import { BulletSystem, BULLET_BASE_DAMAGE } from "./weapons.ts";
import { EnemyManager, type EnemyType } from "./enemies.ts";
import { Hud } from "./hud.ts";
import { rollUpgrades, type Upgrade } from "./upgrades.ts";

const CAMERA_OFFSET = new THREE.Vector3(16, 20, 16);
const LIGHT_OFFSET = new THREE.Vector3(8, 24, 4);
const FIRE_INTERVAL_BASE = 60 / 600;

type RoomState = "untouched" | "active" | "cleared";

export class Game {
  readonly ctx: SceneCtx;
  readonly input: Input;
  readonly player: Player;
  readonly world: World;
  readonly bullets: BulletSystem;
  readonly enemies: EnemyManager;
  private readonly hud: Hud;
  private readonly followTarget = new THREE.Vector3();
  private readonly muzzle = new THREE.Vector3();
  private readonly roomStates = new Map<Room, RoomState>();
  private last = performance.now();
  private fireCooldown = 0;
  private deathShown = false;
  private winShown = false;
  private paused = false;
  private runStart = performance.now();

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
    this.hud = new Hud(
      () => this.restart(),
      () => this.restart(),
    );

    this.initRoomStates();

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

  restart(): void {
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
    this.paused = false;
    this.runStart = performance.now();
    this.hud.hideDeath();
    this.hud.hideWin();
    this.hud.hideUpgrade();
    this.initRoomStates();
    this.followTarget.copy(this.player.position);
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
    this.ctx.camera.lookAt(this.followTarget);
    this.updateLight();

    this.fireCooldown -= dt;
    const fireInterval = FIRE_INTERVAL_BASE / this.player.stats.fireRateMult;
    if (
      this.player.hp > 0 &&
      !this.winShown &&
      this.input.firing &&
      this.fireCooldown <= 0
    ) {
      this.muzzle.set(
        this.player.position.x + this.player.aim.x * 0.9,
        1.15,
        this.player.position.z + this.player.aim.z * 0.9,
      );
      const damage = BULLET_BASE_DAMAGE * this.player.stats.damageMult;
      this.bullets.spawn(this.muzzle, this.player.aim, damage);
      this.fireCooldown = fireInterval;
    }

    this.bullets.update(dt, this.world, this.enemies);
    this.hud.update(this.player, this.enemies, this.world);

    if (this.player.hp <= 0 && !this.deathShown) {
      this.hud.showDeath("scuttler");
      this.deathShown = true;
    }

    if (!this.winShown && !this.deathShown && this.playerReachedExtraction()) {
      const elapsed = (performance.now() - this.runStart) / 1000;
      this.hud.showWin(this.enemies.killCount, elapsed);
      this.winShown = true;
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
    const plan: EnemyType[] =
      room.type === "arena"
        ? ["scuttler", "scuttler", "scuttler", "scuttler", "spitter", "spitter", "brute"]
        : ["nest", "scuttler", "scuttler", "lurker", "lurker"];
    for (const type of plan) {
      const point = this.world.randomPointInRoom(room, 1.2);
      if (point) this.enemies.spawn(type, point.x, point.z);
    }
  }

  private openUpgradeScreen(): void {
    const cards = rollUpgrades(3);
    this.paused = true;
    this.hud.showUpgrade(cards, (picked: Upgrade) => {
      picked.apply(this.player);
      this.hud.hideUpgrade();
      this.paused = false;
    });
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
