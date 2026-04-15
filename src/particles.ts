import * as THREE from "three";

const POOL_SIZE = 256;
const GRAVITY = -8;

interface Particle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  alive: boolean;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private readonly items: Particle[] = [];
  private readonly group = new THREE.Group();

  constructor(parent: THREE.Scene) {
    parent.add(this.group);
    const geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    for (let i = 0; i < POOL_SIZE; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.group.add(mesh);
      this.items.push({
        mesh,
        mat,
        alive: false,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 0,
      });
    }
  }

  burst(
    x: number,
    y: number,
    z: number,
    count: number,
    color: number,
    speed = 5,
    life = 0.45,
  ): void {
    for (let i = 0; i < count; i++) {
      const p = this.acquire();
      if (!p) return;
      p.mesh.position.set(x, y, z);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.4 + Math.PI * 0.15;
      const s = speed * (0.6 + Math.random() * 0.8);
      p.velocity.set(
        Math.cos(theta) * Math.sin(phi) * s,
        Math.cos(phi) * s,
        Math.sin(theta) * Math.sin(phi) * s,
      );
      p.life = life * (0.7 + Math.random() * 0.6);
      p.maxLife = p.life;
      p.mat.color.setHex(color);
      p.mat.opacity = 1;
    }
  }

  muzzle(x: number, y: number, z: number, dirX: number, dirZ: number): void {
    for (let i = 0; i < 3; i++) {
      const p = this.acquire();
      if (!p) return;
      p.mesh.position.set(x, y, z);
      const spread = 0.6;
      p.velocity.set(
        dirX * 6 + (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        dirZ * 6 + (Math.random() - 0.5) * spread,
      );
      p.life = 0.08;
      p.maxLife = 0.08;
      p.mat.color.setHex(0xffdd66);
      p.mat.opacity = 1;
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      if (!p.alive) continue;
      p.life -= dt;
      if (p.life <= 0) {
        this.retire(p);
        continue;
      }
      p.velocity.y += GRAVITY * dt;
      p.mesh.position.x += p.velocity.x * dt;
      p.mesh.position.y += p.velocity.y * dt;
      p.mesh.position.z += p.velocity.z * dt;
      if (p.mesh.position.y < 0.02) {
        p.mesh.position.y = 0.02;
        p.velocity.y *= -0.35;
        p.velocity.x *= 0.6;
        p.velocity.z *= 0.6;
      }
      p.mat.opacity = Math.max(0, p.life / p.maxLife);
    }
  }

  private acquire(): Particle | null {
    for (const p of this.items) {
      if (!p.alive) {
        p.alive = true;
        p.mesh.visible = true;
        return p;
      }
    }
    return null;
  }

  private retire(p: Particle): void {
    p.alive = false;
    p.mesh.visible = false;
  }
}
