import * as THREE from "three";
import type { World } from "./world.ts";

const BULLET_SPEED = 45;
const BULLET_LIFE = 1.2;
const POOL_SIZE = 128;

interface Bullet {
  mesh: THREE.Mesh;
  alive: boolean;
  velocity: THREE.Vector3;
  life: number;
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
      });
    }
  }

  spawn(origin: THREE.Vector3, direction: THREE.Vector3): void {
    for (const b of this.bullets) {
      if (b.alive) continue;
      b.alive = true;
      b.mesh.visible = true;
      b.mesh.position.copy(origin);
      b.velocity.copy(direction).multiplyScalar(BULLET_SPEED);
      b.life = BULLET_LIFE;
      return;
    }
  }

  update(dt: number, world: World): void {
    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.life -= dt;
      if (b.life <= 0) {
        this.retire(b);
        continue;
      }
      b.mesh.position.addScaledVector(b.velocity, dt);
      if (world.collidesPoint(b.mesh.position)) {
        this.retire(b);
      }
    }
  }

  private retire(b: Bullet): void {
    b.alive = false;
    b.mesh.visible = false;
  }
}
