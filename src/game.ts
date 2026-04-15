import * as THREE from "three";
import { createScene, type SceneCtx } from "./scene.ts";
import { Input } from "./input.ts";
import { Player } from "./player.ts";
import { World } from "./world.ts";
import { BulletSystem } from "./weapons.ts";
import { Hud } from "./hud.ts";

const CAMERA_OFFSET = new THREE.Vector3(16, 20, 16);
const FIRE_INTERVAL = 60 / 600;

export class Game {
  readonly ctx: SceneCtx;
  readonly input: Input;
  readonly player: Player;
  readonly world: World;
  readonly bullets: BulletSystem;
  private readonly hud: Hud;
  private readonly followTarget = new THREE.Vector3();
  private readonly muzzle = new THREE.Vector3();
  private last = performance.now();
  private fireCooldown = 0;

  constructor(container: HTMLElement) {
    this.ctx = createScene(container);
    this.input = new Input(this.ctx.renderer.domElement);
    this.world = new World();
    this.ctx.scene.add(this.world.group);
    this.player = new Player();
    this.ctx.scene.add(this.player.group);
    this.bullets = new BulletSystem(this.ctx.scene);
    this.hud = new Hud();

    this.followTarget.copy(this.player.position);
    this.ctx.camera.position.copy(this.followTarget).add(CAMERA_OFFSET);
    this.ctx.camera.lookAt(this.followTarget);

    console.log("[BREACH] boot ok");
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

  private tick(dt: number): void {
    this.player.update(dt, this.input, this.ctx.camera, this.world);

    const smooth = 1 - Math.exp(-dt * 10);
    this.followTarget.lerp(this.player.position, smooth);
    this.ctx.camera.position.copy(this.followTarget).add(CAMERA_OFFSET);
    this.ctx.camera.lookAt(this.followTarget);

    this.fireCooldown -= dt;
    if (this.input.firing && this.fireCooldown <= 0) {
      this.muzzle.set(
        this.player.position.x + this.player.aim.x * 0.9,
        1.15,
        this.player.position.z + this.player.aim.z * 0.9,
      );
      this.bullets.spawn(this.muzzle, this.player.aim);
      this.fireCooldown = FIRE_INTERVAL;
    }

    this.bullets.update(dt, this.world);
    this.hud.update(this.player);
    this.ctx.renderer.render(this.ctx.scene, this.ctx.camera);
  }
}
