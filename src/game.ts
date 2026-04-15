import * as THREE from "three";
import { createScene, type SceneCtx } from "./scene.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";
import { World } from "./world.ts";
import { BulletSystem } from "./weapons.ts";
import { EnemyManager } from "./enemies.ts";
import { Hud } from "./hud.ts";

const CAMERA_OFFSET = new THREE.Vector3(16, 20, 16);
const LIGHT_OFFSET = new THREE.Vector3(8, 24, 4);
const FIRE_INTERVAL = 60 / 600;

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
  private last = performance.now();
  private fireCooldown = 0;
  private deathShown = false;
  private winShown = false;
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
    this.player.hp = this.player.maxHp;
    this.player.position.copy(this.world.playerSpawn);
    this.player.group.rotation.z = 0;
    this.player.group.position.copy(this.player.position);
    for (const e of this.enemies.enemies) {
      e.alive = false;
      e.group.visible = false;
    }
    this.enemies.killCount = 0;
    this.deathShown = false;
    this.winShown = false;
    this.runStart = performance.now();
    this.hud.hideDeath();
    this.hud.hideWin();
    this.followTarget.copy(this.player.position);
  }

  private tick(dt: number): void {
    this.player.update(dt, this.input, this.ctx.camera, this.world);
    this.enemies.update(dt, this.player, this.world);
    if (!this.winShown) {
      this.enemies.tickSpawner(dt, this.player.position, this.world);
    }
    this.world.update(dt);

    const smooth = 1 - Math.exp(-dt * 10);
    this.followTarget.lerp(this.player.position, smooth);
    this.ctx.camera.position.copy(this.followTarget).add(CAMERA_OFFSET);
    this.ctx.camera.lookAt(this.followTarget);
    this.updateLight();

    this.fireCooldown -= dt;
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
      this.bullets.spawn(this.muzzle, this.player.aim);
      this.fireCooldown = FIRE_INTERVAL;
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
