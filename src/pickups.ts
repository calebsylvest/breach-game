import * as THREE from "three";
import type { World } from "./world.ts";
import type { Player } from "./player.ts";

export type PickupType = "ammo" | "health" | "armor";

const COLLECT_RADIUS = 1.1;
const AMMO_RESERVE_RESTORE = 0.25;
const HEALTH_RESTORE = 40;
const ARMOR_RESTORE = 25;

// Health is rare — only in nest rooms. Armor is the common defensive pickup.
const PICKUPS_PER_ROOM: Record<string, PickupType[]> = {
  start:      ["ammo"],
  corridor:   [],
  arena:      ["armor"],
  nest:       ["health"],
  extraction: [],
};

interface Pickup {
  type: PickupType;
  position: THREE.Vector3;
  readonly mesh: THREE.Group;
  collected: boolean;
  bobPhase: number;
}

export class PickupSystem {
  private readonly pickups: Pickup[] = [];
  private readonly group = new THREE.Group();

  constructor(world: World, parent: THREE.Scene) {
    parent.add(this.group);
    this.populate(world);
  }

  private populate(world: World): void {
    for (const room of world.rooms) {
      const types = PICKUPS_PER_ROOM[room.type] ?? [];
      for (const type of types) {
        const pt = world.randomPointInRoom(room, 1.8);
        if (pt) this.spawnPickup(type, pt.x, pt.z);
      }
    }
  }

  private spawnPickup(type: PickupType, x: number, z: number): void {
    const grp = new THREE.Group();

    if (type === "health") {
      // Red cross shape — two overlapping boxes
      const mat = new THREE.MeshStandardMaterial({
        color: 0xdd2244,
        emissive: 0xcc1133,
        emissiveIntensity: 1.2,
        roughness: 0.4,
      });
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.44, 0.1), mat);
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.1), mat);
      h.rotation.x = Math.PI / 2;
      v.rotation.x = Math.PI / 2;
      grp.add(h, v);
    } else if (type === "armor") {
      // Steel-blue hexagonal plate
      const mat = new THREE.MeshStandardMaterial({
        color: 0x3a7ab0,
        emissive: 0x1a4a7a,
        emissiveIntensity: 1.0,
        roughness: 0.3,
        metalness: 0.6,
      });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.44), mat);
      const trimMat = new THREE.MeshStandardMaterial({ color: 0x6aaed6, roughness: 0.2, metalness: 0.8 });
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.02, 0.46), trimMat);
      trim.position.y = 0.04;
      grp.add(plate, trim);
    } else {
      // Gold ammo box
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc8901a,
        emissive: 0x7a4800,
        emissiveIntensity: 1.0,
        roughness: 0.5,
        metalness: 0.4,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.22), mat);
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x2a1a00, roughness: 0.9 });
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.24), stripeMat);
      stripe.position.y = 0.01;
      grp.add(box, stripe);
    }

    grp.position.set(x, 0.35, z);
    this.group.add(grp);

    this.pickups.push({
      type,
      position: new THREE.Vector3(x, 0, z),
      mesh: grp,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  update(dt: number, player: Player): string | null {
    let collected: string | null = null;

    for (const p of this.pickups) {
      if (p.collected) continue;

      // Bob animation
      p.bobPhase += dt * 2.2;
      p.mesh.position.y = 0.35 + Math.sin(p.bobPhase) * 0.06;
      p.mesh.rotation.y += dt * 1.4;

      // Proximity collect
      const dx = player.position.x - p.position.x;
      const dz = player.position.z - p.position.z;
      if (dx * dx + dz * dz < COLLECT_RADIUS * COLLECT_RADIUS) {
        const result = this.collect(p, player);
        if (result) collected = result;
      }
    }

    return collected;
  }

  private collect(p: Pickup, player: Player): string | null {
    if (p.type === "health") {
      if (player.hp >= player.maxHp) return null;
      player.hp = Math.min(player.maxHp, player.hp + HEALTH_RESTORE);
      p.collected = true;
      p.mesh.visible = false;
      return "health";
    } else if (p.type === "armor") {
      if (player.armor >= player.maxArmor) return null;
      player.repairArmor(ARMOR_RESTORE);
      p.collected = true;
      p.mesh.visible = false;
      return "armor";
    } else {
      if (!player.topUpReserve(AMMO_RESERVE_RESTORE)) return null;
      p.collected = true;
      p.mesh.visible = false;
      return "ammo";
    }
  }

  private disposeGroup(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          for (const m of obj.material) m.dispose();
        } else {
          obj.material.dispose();
        }
      }
    });
  }

  reset(world: World, parent: THREE.Scene): void {
    this.disposeGroup();
    parent.remove(this.group);
    this.pickups.length = 0;
    this.group.clear();
    parent.add(this.group);
    this.populate(world);
  }

  dispose(parent: THREE.Scene): void {
    this.disposeGroup();
    parent.remove(this.group);
  }
}
