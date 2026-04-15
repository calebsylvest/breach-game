import * as THREE from "three";
import type { Player } from "./player.ts";
import type { World } from "./world.ts";
import { resolveMovement } from "./collision.ts";

export type EnemyType = "scuttler";

interface TypeDef {
  maxHp: number;
  speed: number;
  radius: number;
  contactDamage: number;
  contactCooldown: number;
}

const TYPES: Record<EnemyType, TypeDef> = {
  scuttler: {
    maxHp: 30,
    speed: 4.5,
    radius: 0.38,
    contactDamage: 10,
    contactCooldown: 0.7,
  },
};

interface Enemy {
  type: EnemyType;
  alive: boolean;
  position: THREE.Vector3;
  hp: number;
  contactTimer: number;
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
  hitFlash: number;
}

const HIT_FLASH_DURATION = 0.1;
const SPAWN_INTERVAL = 2.2;
const SPAWN_BURST_MIN = 2;
const SPAWN_BURST_MAX = 4;
const MIN_SPAWN_DIST = 9;
const MAX_SPAWN_DIST = 15;
const ARENA_LIMIT = 18;
const MAX_ALIVE = 24;

export class EnemyManager {
  readonly enemies: Enemy[] = [];
  private readonly group = new THREE.Group();
  private spawnTimer = SPAWN_INTERVAL;
  killCount = 0;

  constructor(parent: THREE.Scene) {
    parent.add(this.group);
  }

  aliveCount(): number {
    let n = 0;
    for (const e of this.enemies) if (e.alive) n++;
    return n;
  }

  spawn(type: EnemyType, x: number, z: number): Enemy {
    let e = this.enemies.find((en) => !en.alive && en.type === type);
    if (!e) {
      e = this.create(type);
      this.enemies.push(e);
      this.group.add(e.group);
    }
    e.alive = true;
    e.group.visible = true;
    e.position.set(x, 0, z);
    e.group.position.copy(e.position);
    e.hp = TYPES[type].maxHp;
    e.contactTimer = 0;
    e.hitFlash = 0;
    e.bodyMat.emissive.setRGB(0, 0, 0);
    return e;
  }

  update(dt: number, player: Player, world: World): void {
    if (player.hp <= 0) return;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      this.updateEnemy(e, dt, player, world);
    }
  }

  tickSpawner(dt: number, playerPos: THREE.Vector3): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = SPAWN_INTERVAL;

    if (this.aliveCount() >= MAX_ALIVE) return;

    const count =
      SPAWN_BURST_MIN +
      Math.floor(Math.random() * (SPAWN_BURST_MAX - SPAWN_BURST_MIN + 1));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = MIN_SPAWN_DIST + Math.random() * (MAX_SPAWN_DIST - MIN_SPAWN_DIST);
      const x = clamp(playerPos.x + Math.cos(angle) * dist, -ARENA_LIMIT, ARENA_LIMIT);
      const z = clamp(playerPos.z + Math.sin(angle) * dist, -ARENA_LIMIT, ARENA_LIMIT);
      this.spawn("scuttler", x, z);
    }
  }

  damageAtPoint(point: THREE.Vector3, amount: number): Enemy | null {
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = point.x - e.position.x;
      const dz = point.z - e.position.z;
      const r = TYPES[e.type].radius;
      if (dx * dx + dz * dz <= r * r) {
        this.damage(e, amount);
        return e;
      }
    }
    return null;
  }

  private damage(e: Enemy, amount: number): void {
    e.hp -= amount;
    e.hitFlash = HIT_FLASH_DURATION;
    if (e.hp <= 0) {
      e.alive = false;
      e.group.visible = false;
      this.killCount++;
    }
  }

  private create(type: EnemyType): Enemy {
    const { group, bodyMat } = buildMesh(type);
    group.visible = false;
    return {
      type,
      alive: false,
      position: new THREE.Vector3(),
      hp: 0,
      contactTimer: 0,
      group,
      bodyMat,
      hitFlash: 0,
    };
  }

  private updateEnemy(e: Enemy, dt: number, player: Player, world: World): void {
    const def = TYPES[e.type];
    const dx = player.position.x - e.position.x;
    const dz = player.position.z - e.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.05) {
      const nx = dx / dist;
      const nz = dz / dist;
      const step = def.speed * dt;
      const resolved = resolveMovement(
        { x: e.position.x, z: e.position.z, r: def.radius },
        nx * step,
        nz * step,
        world.colliders,
      );
      e.position.x = resolved.x;
      e.position.z = resolved.z;
      e.group.position.copy(e.position);
      e.group.rotation.y = Math.atan2(-dz, dx);
    }

    e.contactTimer -= dt;
    if (def.contactDamage > 0 && e.contactTimer <= 0) {
      const touchR = def.radius + 0.42;
      if (dx * dx + dz * dz < touchR * touchR) {
        player.damage(def.contactDamage);
        e.contactTimer = def.contactCooldown;
      }
    }

    if (e.hitFlash > 0) {
      e.hitFlash -= dt;
      const t = Math.max(0, e.hitFlash / HIT_FLASH_DURATION);
      e.bodyMat.emissive.setRGB(t, t * 0.9, t * 0.9);
    } else if (e.bodyMat.emissive.r !== 0) {
      e.bodyMat.emissive.setRGB(0, 0, 0);
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function buildMesh(type: EnemyType): {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();
  switch (type) {
    case "scuttler":
      return buildScuttler(group);
  }
}

function buildScuttler(group: THREE.Group): {
  group: THREE.Group;
  bodyMat: THREE.MeshStandardMaterial;
} {
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x8f2f2f,
    roughness: 0.55,
    emissive: 0x000000,
  });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), bodyMat);
  body.position.y = 0.38;
  body.scale.set(1.1, 0.85, 1);
  body.castShadow = true;
  group.add(body);

  const spikeMat = new THREE.MeshStandardMaterial({
    color: 0x1a0606,
    roughness: 0.4,
  });
  const spike = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 6), spikeMat);
  spike.rotation.z = -Math.PI / 2;
  spike.position.set(0.35, 0.38, 0);
  spike.castShadow = true;
  group.add(spike);

  const legMat = new THREE.MeshStandardMaterial({
    color: 0x3e1414,
    roughness: 0.7,
  });
  for (let i = 0; i < 6; i++) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.42), legMat);
    const angle = (i / 6) * Math.PI * 2;
    leg.position.set(Math.cos(angle) * 0.3, 0.14, Math.sin(angle) * 0.3);
    leg.rotation.y = angle + Math.PI / 2;
    leg.castShadow = true;
    group.add(leg);
  }

  return { group, bodyMat };
}
