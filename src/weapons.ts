import * as THREE from "three";
import type { World } from "./world.ts";
import type { EnemyManager } from "./enemies.ts";
import type { ParticleSystem } from "./particles.ts";

const BULLET_LIFE = 1.2;
const POOL_SIZE = 128;

export interface WeaponDef {
  readonly id: "rifle" | "shotgun" | "smg" | "sniper";
  readonly name: string;
  readonly damage: number;
  readonly pellets: number;
  readonly spread: number;       // half-angle radians per pellet
  readonly fireInterval: number; // seconds between shots (base, before fireRateMult)
  readonly bulletSpeed: number;
  readonly magSize: number;
  readonly reserveSize: number;
  readonly reloadTime: number;   // seconds
  readonly piercing?: boolean;   // bullet passes through enemies
}

export const WEAPONS: WeaponDef[] = [
  {
    id: "rifle",
    name: "RIFLE",
    damage: 25,
    pellets: 1,
    spread: 0,
    fireInterval: 0.1,
    bulletSpeed: 45,
    magSize: 30,
    reserveSize: 90,
    reloadTime: 1.4,
  },
  {
    id: "shotgun",
    name: "SHOTGUN",
    damage: 18,
    pellets: 8,
    spread: 0.22,
    fireInterval: 0.75,
    bulletSpeed: 38,
    magSize: 6,
    reserveSize: 30,
    reloadTime: 1.8,
  },
  {
    id: "smg",
    name: "SMG",
    damage: 10,
    pellets: 1,
    spread: 0.06,
    fireInterval: 0.067,
    bulletSpeed: 42,
    magSize: 60,
    reserveSize: 180,
    reloadTime: 1.0,
  },
  {
    id: "sniper",
    name: "SNIPER",
    damage: 150,
    pellets: 1,
    spread: 0,
    fireInterval: 1.6,
    bulletSpeed: 65,
    magSize: 5,
    reserveSize: 20,
    reloadTime: 2.4,
    piercing: true,
  },
];

interface Bullet {
  mesh: THREE.Mesh;
  alive: boolean;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
  piercing: boolean;
}

export class BulletSystem {
  private readonly bullets: Bullet[] = [];
  private readonly group = new THREE.Group();

  constructor(parent: THREE.Scene) {
    parent.add(this.group);
    const geo = new THREE.SphereGeometry(0.09, 6, 6);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffee66,
      emissive: 0xffdd44,
      emissiveIntensity: 2.5,
    });
    for (let i = 0; i < POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.bullets.push({
        mesh,
        alive: false,
        velocity: new THREE.Vector3(),
        life: 0,
        damage: 0,
        piercing: false,
      });
    }
  }

  spawn(origin: THREE.Vector3, direction: THREE.Vector3, damage: number, speed = 45, piercing = false): void {
    for (const b of this.bullets) {
      if (b.alive) continue;
      b.alive = true;
      b.mesh.visible = true;
      b.mesh.position.copy(origin);
      b.velocity.copy(direction).multiplyScalar(speed);
      b.life = BULLET_LIFE;
      b.damage = damage;
      b.piercing = piercing;
      return;
    }
  }

  update(dt: number, world: World, enemies: EnemyManager, particles: ParticleSystem): void {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.life -= dt;
      if (b.life <= 0) {
        this.retire(b);
        continue;
      }
      b.mesh.position.addScaledVector(b.velocity, dt);
      if (world.collidesPoint(b.mesh.position)) {
        particles.burst(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, 3, 0x88aaff, 3, 0.22);
        this.retire(b);
        continue;
      }
      const hit = enemies.damageAtPoint(b.mesh.position, b.damage);
      if (hit) {
        const color = hit.alive ? 0xffaa55 : 0xff5544;
        const count = hit.alive ? 4 : 10;
        particles.burst(
          b.mesh.position.x,
          b.mesh.position.y,
          b.mesh.position.z,
          count,
          color,
          hit.alive ? 4 : 7,
          hit.alive ? 0.3 : 0.6,
        );
        if (!b.piercing) this.retire(b);
      }
    }
  }

  private retire(b: Bullet): void {
    b.alive = false;
    b.mesh.visible = false;
  }
}
