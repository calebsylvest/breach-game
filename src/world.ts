import * as THREE from "three";
import type { AABB } from "./collision.ts";
import { pointInAABB } from "./collision.ts";

export class World {
  readonly group = new THREE.Group();
  readonly colliders: AABB[] = [];

  constructor() {
    this.buildFloor();
    this.buildWalls();
    this.buildCover();
  }

  collidesPoint(p: THREE.Vector3): boolean {
    for (const c of this.colliders) {
      if (pointInAABB(p.x, p.z, c)) return true;
    }
    return false;
  }

  private addBox(
    x: number,
    z: number,
    sx: number,
    sz: number,
    height: number,
    color: number,
  ): void {
    const geo = new THREE.BoxGeometry(sx, height, sz);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.colliders.push({
      minX: x - sx / 2,
      maxX: x + sx / 2,
      minZ: z - sz / 2,
      maxZ: z + sz / 2,
    });
  }

  private buildFloor(): void {
    const geo = new THREE.PlaneGeometry(40, 40);
    const mat = new THREE.MeshStandardMaterial({ color: 0x141924, roughness: 0.95 });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    const grid = new THREE.GridHelper(40, 20, 0x2a3446, 0x1a2332);
    grid.position.y = 0.01;
    this.group.add(grid);
  }

  private buildWalls(): void {
    const h = 2.8;
    const t = 0.6;
    const half = 20;
    const wallColor = 0x2f3947;
    this.addBox(0, -half + t / 2, half * 2, t, h, wallColor);
    this.addBox(0, half - t / 2, half * 2, t, h, wallColor);
    this.addBox(-half + t / 2, 0, t, half * 2, h, wallColor);
    this.addBox(half - t / 2, 0, t, half * 2, h, wallColor);
  }

  private buildCover(): void {
    const cover = 0x3a4658;
    this.addBox(-6, -4, 1.6, 1.6, 1.2, cover);
    this.addBox(6, -4, 1.6, 1.6, 1.2, cover);
    this.addBox(-6, 6, 2.8, 1.2, 1.2, cover);
    this.addBox(6, 6, 2.8, 1.2, 1.2, cover);
    this.addBox(-3, 8, 1.2, 2.5, 1.2, cover);
    this.addBox(3, -8, 1.2, 2.5, 1.2, cover);
  }
}
