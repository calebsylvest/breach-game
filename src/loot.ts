import * as THREE from "three";
import type { World } from "./world.ts";
import { rollUpgrades, type Upgrade } from "./upgrades.ts";

export const INTERACT_RANGE = 2.2;
const CASES_PER_ARENA = 2;
const CASES_PER_NEST = 1;
const CASES_PER_CORRIDOR = 0;

export interface LootCase {
  readonly group: THREE.Group;
  readonly position: THREE.Vector3;
  readonly contents: Upgrade[];
  opened: boolean;
  readonly baseMat: THREE.MeshStandardMaterial;
  readonly glow: THREE.PointLight;
}

export class LootSystem {
  private readonly cases: LootCase[] = [];
  private readonly group = new THREE.Group();

  constructor(world: World, parent: THREE.Scene) {
    parent.add(this.group);
    for (const room of world.rooms) {
      const count =
        room.type === "arena" ? CASES_PER_ARENA :
        room.type === "nest"  ? CASES_PER_NEST  :
        CASES_PER_CORRIDOR;
      for (let i = 0; i < count; i++) {
        const pt = world.randomPointInRoom(room, 1.5);
        if (pt) this.spawnCase(pt.x, pt.z);
      }
    }
  }

  private spawnCase(x: number, z: number): void {
    const grp = new THREE.Group();

    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x2a3a28,
      roughness: 0.6,
      emissive: 0x336633,
      emissiveIntensity: 0.4,
    });
    const baseGeo = new THREE.BoxGeometry(0.72, 0.48, 0.52);
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.24;
    base.castShadow = true;
    grp.add(base);

    // Stripe / lid
    const lidMat = new THREE.MeshStandardMaterial({ color: 0x4a7a44, roughness: 0.5 });
    const lidGeo = new THREE.BoxGeometry(0.74, 0.08, 0.54);
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = 0.52;
    grp.add(lid);

    // Latch
    const latchMat = new THREE.MeshStandardMaterial({ color: 0xc8a840, roughness: 0.3, metalness: 0.8 });
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.08), latchMat);
    latch.position.set(0.37, 0.48, 0);
    grp.add(latch);

    const glow = new THREE.PointLight(0x66ff88, 1.8, 4);
    glow.position.set(0, 0.8, 0);
    grp.add(glow);

    grp.position.set(x, 0, z);
    this.group.add(grp);

    this.cases.push({
      group: grp,
      position: new THREE.Vector3(x, 0, z),
      contents: rollUpgrades(3),
      opened: false,
      baseMat,
      glow,
    });
  }

  update(_dt: number, playerPos: THREE.Vector3): void {
    const t = performance.now() / 1000;
    for (const c of this.cases) {
      if (c.opened) continue;
      const dx = playerPos.x - c.position.x;
      const dz = playerPos.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const inRange = dist < INTERACT_RANGE;
      // Pulse glow when in range
      c.glow.intensity = inRange
        ? 2.2 + Math.sin(t * 4) * 0.6
        : 1.8;
      c.baseMat.emissiveIntensity = inRange ? 0.7 : 0.4;
    }
  }

  nearest(playerPos: THREE.Vector3): LootCase | null {
    let best: LootCase | null = null;
    let bestDist = INTERACT_RANGE;
    for (const c of this.cases) {
      if (c.opened) continue;
      const dx = playerPos.x - c.position.x;
      const dz = playerPos.z - c.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    return best;
  }

  markOpened(c: LootCase): void {
    c.opened = true;
    c.baseMat.color.setHex(0x1a2218);
    c.baseMat.emissiveIntensity = 0;
    c.glow.intensity = 0;
  }

  dispose(parent: THREE.Scene): void {
    parent.remove(this.group);
  }

  reset(world: World, parent: THREE.Scene): void {
    this.dispose(parent);
    this.cases.length = 0;
    this.group.clear();
    parent.add(this.group);
    for (const room of world.rooms) {
      const count =
        room.type === "arena" ? CASES_PER_ARENA :
        room.type === "nest"  ? CASES_PER_NEST  :
        CASES_PER_CORRIDOR;
      for (let i = 0; i < count; i++) {
        const pt = world.randomPointInRoom(room, 1.5);
        if (pt) this.spawnCase(pt.x, pt.z);
      }
    }
  }
}
